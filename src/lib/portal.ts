/**
 * src/lib/portal.ts — Jantung Portal Klien (server-only).
 * ----------------------------------------------------------------------------
 * Misi: setiap klien yang pernah mengirim brief (form kontak) bisa masuk ke
 * portal dengan TIKET + EMAIL mereka, lalu melihat status penanganan kasus
 * secara real-time: timeline, dokumen, dan pembayaran QRIS.
 *
 * Desain tahan banting:
 * - Database tersedia (Prisma/SQLite) → kasus dipersist di tabel ClientCase.
 * - Database tidak tersedia (Vercel filesystem read-only) → fallback memori:
 *   kasus demo + kasus yang masuk via /api/contact pada sesi server yang sama.
 * - Sesi login = token HMAC-SHA256 ter-tanda-tangan (tiket|kedaluwarsa),
 *   berlaku 7 hari, tanpa menyimpan password apa pun — kebijakan sesi paling
 *   sederhana & aman untuk portal berbasis tiket.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

/* ================================ KONSTANTA ================================ */

/** Sesi login berlaku 7 hari. */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function portalSecret(): string {
  return (
    process.env.PORTAL_SECRET ??
    process.env.VVIP_ACCESS_CODE ??
    "TOP-PORTAL-SECRET-DO-ROTATE"
  );
}

/* ============================== PIPELINE TAHAP ============================== */

export interface Stage {
  label: string;
  desc: string;
}

/** Enam tahap standar penanganan setiap kasus perizinan. */
export const STAGES: Stage[] = [
  {
    label: "Brief Diterima",
    desc: "Brief Anda masuk dan dikonfirmasi front-office PT TOP KONSULTAN INTERNASIONAL.",
  },
  {
    label: "Verifikasi Berkas",
    desc: "Dewan Pakar penanggung jawab memeriksa kelengkapan dokumen dasar kasus Anda.",
  },
  {
    label: "Penyusunan Dokumen",
    desc: "Akta, aplikasi perizinan, dan lampiran disusun sesuai regulasi terbaru.",
  },
  {
    label: "Pengurusan ke Instansi",
    desc: "Berkas diserahkan ke instansi (OSS, Kemenkumham, BPOM, dst.) dan dipantau berkala.",
  },
  {
    label: "Verifikasi & Serah Terima",
    desc: "Izin terbit, diverifikasi tim, lalu diserahkan kepada Anda beserta arsip digital.",
  },
  {
    label: "Selesai & Garansi",
    desc: "Kasus ditutup. Garansi pendampingan pasca-terbit tetap aktif untuk Anda.",
  },
];

/** Dokumen standar yang dipantau portal (v1). */
export const DOCS: { name: string; required: boolean }[] = [
  { name: "KTP & NPWP direksi / pemilik", required: true },
  { name: "Pas foto direksi (background merah)", required: true },
  { name: "Bukti alamat domisili usaha", required: true },
  { name: "Nama & logo badan usaha", required: false },
  { name: "Dokumen pendukung khusus layanan", required: false },
];

/** Label ramah untuk tipe brief. */
export const TYPE_LABELS: Record<string, string> = {
  general: "Konsultasi Umum",
  booking: "Penjadwalan Sesi Dewan",
  career: "Lamaran Karier",
  "oracle-escalation": "Eskalasi Oracle (VVIP)",
};

/* ============================ STORE MEMORI (FALLBACK) ======================= */

export interface CaseRecord {
  refCode: string;
  email: string;
  name: string;
  company?: string | null;
  service?: string | null;
  stage: number;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  source: "db" | "memory" | "demo";
}

/** Memori kasus — dipakai bila DB tidak tersedia (serverless read-only). */
const memoryCases = new Map<string, CaseRecord>();

/** Kasus demo resmi — selalu tersedia supaya portal bisa dicoba siapa pun. */
const DEMO_CASES: CaseRecord[] = [
  {
    refCode: "TOP-DEMO2026",
    email: "demo@pusatperizinan.com",
    name: "Klien Demo",
    company: "PT Contoh Sukses Sejahtera",
    service: "Pendirian PT + NIB OSS RBA",
    stage: 3,
    note: "Akta pendirian telah disusun notaris partner; menunggu jadwal pengesahan Kemenkumham.",
    createdAt: "2026-11-10T03:00:00.000Z",
    updatedAt: new Date().toISOString(),
    source: "demo",
  },
];

export function registerMemoryCase(rec: Omit<CaseRecord, "stage" | "updatedAt" | "source"> & { stage?: number }): void {
  memoryCases.set(rec.refCode, {
    ...rec,
    stage: rec.stage ?? 1,
    updatedAt: new Date().toISOString(),
    source: "memory",
  });
}

/* ================================= SESI ==================================== */

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string): string {
  return createHmac("sha256", portalSecret()).update(data).digest("base64url");
}

/** Terbitkan token sesi untuk sebuah tiket. */
export function issueSession(refCode: string): string {
  const payload = b64url(
    JSON.stringify({ t: refCode.toUpperCase(), exp: Date.now() + SESSION_TTL_MS })
  );
  return `${payload}.${sign(payload)}`;
}

/** Verifikasi token sesi → tiket, atau null bila rusak/kedaluwarsa. */
export function verifySession(token: string): string | null {
  const [payload, sig] = (token ?? "").split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      t?: string;
      exp?: number;
    };
    if (!data.t || !data.exp || data.exp < Date.now()) return null;
    return data.t;
  } catch {
    return null;
  }
}

/* =============================== AKSES KASUS =============================== */

function normalizeTicket(t: string): string {
  return (t ?? "").trim().toUpperCase();
}

async function findContact(ticket: string, email: string) {
  try {
    const rows = await db.contactMessage.findMany({ where: { refCode: ticket } });
    return rows.find((r) => r.email.toLowerCase() === email.toLowerCase()) ?? null;
  } catch {
    return null; // DB tidak tersedia
  }
}

/** Cari atau bootstrap ClientCase dari ContactMessage (DB), lalu fallback memori/demo. */
async function resolveCase(ticket: string, email: string): Promise<CaseRecord | null> {
  const contact = await findContact(ticket, email);
  if (contact) {
    // Pastikan ClientCase ada (bootstrap sekali), lalu baca.
    try {
      const existing = await db.clientCase.findUnique({ where: { refCode: ticket } });
      const rec =
        existing ??
        (await db.clientCase.create({
          data: {
            refCode: contact.refCode,
            email: contact.email,
            name: contact.name,
            company: contact.company,
            service: TYPE_LABELS[contact.type] ?? "Konsultasi Umum",
            stage: 1,
          },
        }));
      return {
        refCode: rec.refCode,
        email: rec.email,
        name: rec.name,
        company: rec.company,
        service: rec.service,
        stage: rec.stage,
        note: rec.note,
        createdAt: rec.createdAt.toISOString(),
        updatedAt: rec.updatedAt.toISOString(),
        source: "db",
      };
    } catch {
      // DB read-only (mis. Vercel) → turun ke memori/demo.
    }
  }

  const mem =
    memoryCases.get(ticket) ??
    DEMO_CASES.find((c) => c.refCode === ticket && c.email.toLowerCase() === email.toLowerCase()) ??
    null;
  if (mem && mem.email.toLowerCase() === email.toLowerCase()) return { ...mem };
  return null;
}

/** Login portal: tiket + email → catatan kasus (atau null). */
export async function loginCase(ticket: string, email: string): Promise<CaseRecord | null> {
  const t = normalizeTicket(ticket);
  const e = (email ?? "").trim().toLowerCase();
  if (!t || !e) return null;
  return resolveCase(t, e);
}

/** Ambil kasus berdasarkan tiket (untuk sesi yang sudah valid). */
export async function getCaseByTicket(ticket: string): Promise<CaseRecord | null> {
  const t = normalizeTicket(ticket);
  if (!t) return null;
  try {
    const rec = await db.clientCase.findUnique({ where: { refCode: t } });
    if (rec)
      return {
        refCode: rec.refCode,
        email: rec.email,
        name: rec.name,
        company: rec.company,
        service: rec.service,
        stage: rec.stage,
        note: rec.note,
        createdAt: rec.createdAt.toISOString(),
        updatedAt: rec.updatedAt.toISOString(),
        source: "db",
      };
  } catch {
    // fallback
  }
  return memoryCases.get(t) ?? DEMO_CASES.find((c) => c.refCode === t) ?? null;
}
