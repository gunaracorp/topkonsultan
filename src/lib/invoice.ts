/**
 * src/lib/invoice.ts — Jantung Transaksi Penuh (server-only).
 * ----------------------------------------------------------------------------
 * Misi: menerbitkan invoice online resmi untuk setiap kasus klien, lengkap
 * dengan QRIS DINAMIS — nominal Rupiah tertanam di dalam kode QR sehingga
 * aplikasi pemindai mengisinya otomatis — plus dukungan multi-mata uang
 * (nominal asing dikonversi ke ekuivalen Rupiah saat terbit).
 *
 * Desain tahan banting (sama seperti Portal Klien):
 * - Database tersedia → invoice dipersist di tabel Invoice (Prisma/SQLite).
 * - Database tidak tersedia (Vercel read-only) → fallback memori: invoice
 *   yang diterbitkan pada sesi server yang sama tetap bisa dilihat.
 * - Invoice demo permanen selalu tersedia agar halaman bisa dicoba siapa pun.
 *
 * Keamanan:
 * - Aksi officer (issue / mark-paid / void / list) dilindungi OFFICER_KEY.
 * - Aksi klien (view) dilindungi viewToken acak 22 karakter per invoice.
 * - Aksi `mine` memakai sesi portal (token HMAC) — tanpa kebocoran data.
 */

import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { QRIS, convertToIdr } from "@/data/payment";
import { buildQrisDynamicPayload } from "@/lib/qris";

/* ================================ KONSTANTA ================================= */

export type InvoiceStatus = "unpaid" | "paid" | "void";

export interface InvoiceRecord {
  number: string;
  ticket: string;
  clientName: string;
  clientEmail: string;
  service: string;
  currency: string;
  amount: number;
  amountIdr: number;
  status: InvoiceStatus;
  note: string | null;
  viewToken: string;
  createdAt: string;
  updatedAt: string;
  source: "db" | "memory" | "demo";
}

/** Kunci officer — untuk menerbitkan & menutup invoice via API. */
export function officerKey(): string {
  return (
    process.env.OFFICER_KEY ??
    process.env.VVIP_ACCESS_CODE ??
    "TOP-OFFICER-2026"
  );
}

/** Tahun berjalan untuk penomoran invoice (INV-YYYY-XXXXXX). */
function yearNow(): string {
  return String(new Date().getFullYear());
}

/** Nomor invoice unik: INV-2026-<base36 waktu><2 digit acak>. */
function newInvoiceNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(1).toString("hex").toUpperCase();
  return `INV-${yearNow()}-${stamp}${rand}`;
}

/** Token tampilan acak (base64url, 22 karakter entropi penuh). */
function newViewToken(): string {
  return randomBytes(16).toString("base64url");
}

/* ============================ STORE MEMORI (FALLBACK) ======================= */

const memoryInvoices = new Map<string, InvoiceRecord>();

/** Invoice demo resmi — selalu tersedia supaya /invoice bisa dicoba siapa pun. */
const DEMO_INVOICES: InvoiceRecord[] = [
  {
    number: "INV-DEMO2026",
    ticket: "TOP-DEMO2026",
    clientName: "Klien Demo",
    clientEmail: "demo@pusatperizinan.com",
    service: "Pendirian PT + NIB OSS RBA",
    currency: "IDR",
    amount: 12_500_000,
    amountIdr: 12_500_000,
    status: "unpaid",
    note: "Termin 1 dari 2 — meliputi akta pendirian, SK Kemenkumham, dan NIB OSS RBA.",
    viewToken: "DEMO",
    createdAt: "2026-11-20T04:00:00.000Z",
    updatedAt: "2026-11-20T04:00:00.000Z",
    source: "demo",
  },
];

/* =============================== KONVERSI =============================== */

export interface IssueInput {
  ticket: string;
  clientName: string;
  clientEmail: string;
  service: string;
  currency: string;
  amount: number;
  amountIdr?: number;
  note?: string | null;
}

function normalizeIssueInput(input: IssueInput): IssueInput & { amountIdr: number } {
  const currency = (input.currency || "IDR").toUpperCase();
  const amount = Math.round(Number(input.amount));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 9_999_999_999) {
    throw new Error("amount_invalid");
  }
  const amountIdr =
    input.amountIdr && input.amountIdr > 0
      ? Math.round(input.amountIdr)
      : currency === "IDR"
        ? amount
        : convertToIdr(amount, currency);
  if (amountIdr < 1000) throw new Error("amount_too_small"); // QRIS minimal ±Rp 1.000
  return {
    ticket: input.ticket.trim().toUpperCase(),
    clientName: input.clientName.trim(),
    clientEmail: input.clientEmail.trim().toLowerCase(),
    service: input.service.trim(),
    currency,
    amount,
    amountIdr,
    note: input.note?.trim() || null,
  };
}

/* =============================== PENERBITAN ================================= */

/** Terbitkan invoice (dipanggil aksi `issue` officer). */
export async function issueInvoice(input: IssueInput): Promise<InvoiceRecord> {
  const data = normalizeIssueInput(input);
  if (data.ticket.length < 4 || data.ticket.length > 40) throw new Error("ticket_invalid");
  if (data.clientName.length < 2) throw new Error("name_invalid");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.clientEmail)) throw new Error("email_invalid");
  if (data.service.length < 3) throw new Error("service_invalid");

  const rec: InvoiceRecord = {
    number: newInvoiceNumber(),
    ticket: data.ticket,
    clientName: data.clientName,
    clientEmail: data.clientEmail,
    service: data.service,
    currency: data.currency,
    amount: data.amount,
    amountIdr: data.amountIdr,
    status: "unpaid",
    note: data.note,
    viewToken: newViewToken(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: "memory",
  };

  try {
    const row = await db.invoice.create({
      data: {
        number: rec.number,
        ticket: rec.ticket,
        clientName: rec.clientName,
        clientEmail: rec.clientEmail,
        service: rec.service,
        currency: rec.currency,
        amount: rec.amount,
        amountIdr: rec.amountIdr,
        status: rec.status,
        note: rec.note,
        viewToken: rec.viewToken,
      },
    });
    return { ...rec, source: "db", createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
  } catch {
    memoryInvoices.set(rec.number, rec);
    return rec;
  }
}

/* =============================== PEMBACAAN ================================== */

/** Ambil invoice berdasarkan nomor + token tampilan (atau null). */
export async function getInvoice(
  number: string,
  token: string
): Promise<InvoiceRecord | null> {
  const no = (number ?? "").trim().toUpperCase();
  const k = (token ?? "").trim();
  if (!no || !k) return null;

  try {
    const row = await db.invoice.findUnique({ where: { number: no } });
    if (row && row.viewToken === k) return rowToRecord(row, "db");
  } catch {
    // fallback
  }
  const mem = memoryInvoices.get(no);
  if (mem && mem.viewToken === k) return { ...mem };
  const demo = DEMO_INVOICES.find((d) => d.number === no);
  if (demo && demo.viewToken === k) return { ...demo };
  return null;
}

/** Daftar invoice untuk satu tiket kasus (dipakai dasbor portal). */
export async function listInvoicesByTicket(ticket: string): Promise<InvoiceRecord[]> {
  const t = (ticket ?? "").trim().toUpperCase();
  if (!t) return [];
  const out: InvoiceRecord[] = [];
  try {
    const rows = await db.invoice.findMany({
      where: { ticket: t },
      orderBy: { createdAt: "desc" },
    });
    for (const r of rows) out.push(rowToRecord(r, "db"));
  } catch {
    // fallback memori di bawah
  }
  for (const m of memoryInvoices.values()) {
    if (m.ticket === t && !out.some((o) => o.number === m.number)) out.push({ ...m });
  }
  for (const d of DEMO_INVOICES) {
    if (d.ticket === t && !out.some((o) => o.number === d.number)) out.push({ ...d });
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return out;
}

/** Daftar semua invoice (officer). */
export async function listAllInvoices(): Promise<InvoiceRecord[]> {
  const out: InvoiceRecord[] = [];
  try {
    const rows = await db.invoice.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    for (const r of rows) out.push(rowToRecord(r, "db"));
  } catch {
    // fallback
  }
  for (const m of memoryInvoices.values()) {
    if (!out.some((o) => o.number === m.number)) out.push({ ...m });
  }
  return out;
}

/* ============================= PERUBAHAN STATUS ============================= */

/** Ubah status invoice (unpaid → paid / void) — officer only. */
export async function setInvoiceStatus(
  number: string,
  status: InvoiceStatus,
  note?: string | null
): Promise<InvoiceRecord | null> {
  const no = (number ?? "").trim().toUpperCase();
  if (!no) return null;
  const now = new Date().toISOString();

  try {
    const row = await db.invoice.update({ where: { number: no }, data: { status, note: note ?? undefined } });
    return rowToRecord(row, "db");
  } catch {
    const mem = memoryInvoices.get(no) ?? DEMO_INVOICES.find((d) => d.number === no);
    if (!mem) return null;
    const updated: InvoiceRecord = { ...mem, status, note: note ?? mem.note, updatedAt: now };
    if (mem.source !== "demo") memoryInvoices.set(no, updated);
    else DEMO_INVOICES[0] = updated;
    return updated;
  }
}

function rowToRecord(
  row: {
    number: string; ticket: string; clientName: string; clientEmail: string;
    service: string; currency: string; amount: number; amountIdr: number;
    status: string; note: string | null; viewToken: string;
    createdAt: Date; updatedAt: Date;
  },
  source: "db" | "memory"
): InvoiceRecord {
  return {
    number: row.number,
    ticket: row.ticket,
    clientName: row.clientName,
    clientEmail: row.clientEmail,
    service: row.service,
    currency: row.currency,
    amount: row.amount,
    amountIdr: row.amountIdr,
    status: (row.status === "paid" || row.status === "void" ? row.status : "unpaid") as InvoiceStatus,
    note: row.note,
    viewToken: row.viewToken,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    source,
  };
}

/* ============================ QRIS DINAMIS ================================== */

/** Payload QRIS dinamis untuk sebuah invoice (nominal IDR tertanam). */
export function qrisPayloadForInvoice(rec: InvoiceRecord): string {
  return buildQrisDynamicPayload({
    amountIdr: rec.amountIdr,
    reference: rec.number.replace(/[^A-Z0-9]/g, "").slice(0, 25),
    nmid: QRIS.nmid,
    merchantName: QRIS.merchant,
    city: "JAKARTA",
  });
}
