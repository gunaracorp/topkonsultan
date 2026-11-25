import { NextResponse } from "next/server";
import { verifySession } from "@/lib/portal";
import {
  getInvoice,
  issueInvoice,
  listAllInvoices,
  listInvoicesByTicket,
  officerKey,
  qrisPayloadForInvoice,
  setInvoiceStatus,
  type InvoiceRecord,
  type InvoiceStatus,
} from "@/lib/invoice";
import { QRIS, formatMoney, formatIdr } from "@/data/payment";
import { BRAND } from "@/data/brand";
import { notify } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/invoice — otak Transaksi Penuh.
 *
 * POST { action: "view",   number, token }                        → lihat invoice (publik, token-gated)
 * POST { action: "mine",   portalToken }                          → invoice milik tiket sesi portal
 * POST { action: "issue",  key, ticket, clientName, clientEmail,
 *        service, currency, amount, note? }                       → officer menerbitkan invoice
 * POST { action: "mark-paid", key, number, note? }                → officer menandai LUNAS
 * POST { action: "void",   key, number }                          → officer membatalkan invoice
 * POST { action: "list",   key }                                  → officer: daftar semua invoice
 *
 * GET  ?number=…&token=…                                          → bentuk JSON dari aksi view
 */

function invoiceUrl(rec: InvoiceRecord): string {
  return `/invoice?no=${encodeURIComponent(rec.number)}&k=${encodeURIComponent(rec.viewToken)}`;
}

function waUrl(rec: InvoiceRecord): string {
  const text =
    rec.status === "paid"
      ? `Halo PT TOP KONSULTAN INTERNASIONAL, saya klien dengan invoice ${rec.number} (${rec.ticket}). Mohon kirim bukti pembayaran resmi.`
      : `Halo PT TOP KONSULTAN INTERNASIONAL, saya ingin membayar invoice ${rec.number} (${rec.ticket}) senilai ${formatIdr(rec.amountIdr)} melalui QRIS PusatPerizinan.com. Berikut bukti transferannya.`;
  return `https://wa.me/${BRAND.whatsappIntl}?text=${encodeURIComponent(text)}`;
}

function toPayload(rec: InvoiceRecord) {
  return {
    number: rec.number,
    status: rec.status,
    ticket: rec.ticket,
    clientName: rec.clientName,
    clientEmail: rec.clientEmail,
    service: rec.service,
    currency: rec.currency,
    amount: rec.amount,
    amountIdr: rec.amountIdr,
    amountFormatted: formatMoney(rec.amount, rec.currency),
    amountIdrFormatted: formatIdr(rec.amountIdr),
    isForeign: rec.currency !== "IDR",
    note: rec.note,
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
    source: rec.source,
    viewToken: rec.viewToken,
    url: invoiceUrl(rec),
    qris: {
      payload: qrisPayloadForInvoice(rec),
      svgUrl: `/api/qris?number=${encodeURIComponent(rec.number)}&k=${encodeURIComponent(rec.viewToken)}`,
      staticImage: QRIS.image,
      nmid: QRIS.nmid,
      merchant: QRIS.merchant,
    },
    whatsappUrl: waUrl(rec),
    officer: { name: "Tim Keuangan", phone: BRAND.phone },
  };
}

function isOfficer(key: unknown): boolean {
  return typeof key === "string" && key.length > 0 && key === officerKey();
}

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const b = (body ?? {}) as Record<string, unknown>;
  const action = String(b.action ?? "");

  /* ── LIHAT INVOICE (token-gated) ──────────────────────────────────── */
  if (action === "view") {
    const rec = await getInvoice(String(b.number ?? ""), String(b.token ?? ""));
    if (!rec) {
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json(
        { ok: false, error: "not_found", message: "Invoice tidak ditemukan — periksa nomor dan kunci akses." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, invoice: toPayload(rec) });
  }

  /* ── INVOICE SAYA (sesi portal aktif) ─────────────────────────────── */
  if (action === "mine") {
    const ticket = verifySession(String(b.portalToken ?? ""));
    if (!ticket) {
      return NextResponse.json(
        { ok: false, error: "session_invalid", message: "Sesi portal berakhir. Masuk kembali di /portal." },
        { status: 401 }
      );
    }
    const recs = await listInvoicesByTicket(ticket);
    return NextResponse.json({
      ok: true,
      ticket,
      invoices: recs.map(toPayload),
    });
  }

  /* ── TERBITKAN (officer) ─────────────────────────────────────────── */
  if (action === "issue") {
    if (!isOfficer(b.key)) {
      await new Promise((r) => setTimeout(r, 650));
      return NextResponse.json(
        { ok: false, error: "officer_key_invalid", message: "Kunci officer tidak valid." },
        { status: 401 }
      );
    }
    try {
      const rec = await issueInvoice({
        ticket: String(b.ticket ?? ""),
        clientName: String(b.clientName ?? ""),
        clientEmail: String(b.clientEmail ?? ""),
        service: String(b.service ?? ""),
        currency: String(b.currency ?? "IDR"),
        amount: Number(b.amount ?? 0),
        amountIdr: b.amountIdr ? Number(b.amountIdr) : undefined,
        note: b.note == null ? null : String(b.note),
      });
      console.log(`[invoice] issued ${rec.number} for ${rec.ticket} — ${rec.amountIdr} IDR (${rec.currency})`);
      // Portal v2 — email "invoice terbit" ke klien (tidak pernah menggagalkan penerbitan).
      await notify("invoice-issued", {
        ticket: rec.ticket,
        clientName: rec.clientName,
        clientEmail: rec.clientEmail,
        service: rec.service,
        invoiceNumber: rec.number,
        invoiceAmount: formatIdr(rec.amountIdr),
        invoiceUrl: `${BRAND.url}/invoice?no=${encodeURIComponent(rec.number)}&k=${encodeURIComponent(rec.viewToken)}`,
      });
      return NextResponse.json({ ok: true, invoice: toPayload(rec) });
    } catch (err) {
      const code = err instanceof Error ? err.message : "issue_failed";
      return NextResponse.json({ ok: false, error: code, message: "Data invoice tidak valid." }, { status: 400 });
    }
  }

  /* ── TANDAI LUNAS (officer) ───────────────────────────────────────── */
  if (action === "mark-paid") {
    if (!isOfficer(b.key)) {
      return NextResponse.json({ ok: false, error: "officer_key_invalid" }, { status: 401 });
    }
    const rec = await setInvoiceStatus(String(b.number ?? ""), "paid", b.note == null ? null : String(b.note));
    if (!rec) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    console.log(`[invoice] ${rec.number} marked PAID`);
    // Portal v2 — email "invoice lunas" ke klien (tidak pernah menggagalkan aksi).
    await notify("invoice-paid", {
      ticket: rec.ticket,
      clientName: rec.clientName,
      clientEmail: rec.clientEmail,
      service: rec.service,
      invoiceNumber: rec.number,
      invoiceAmount: formatIdr(rec.amountIdr),
      invoiceUrl: `${BRAND.url}/invoice?no=${encodeURIComponent(rec.number)}&k=${encodeURIComponent(rec.viewToken)}`,
    });
    return NextResponse.json({ ok: true, invoice: toPayload(rec) });
  }

  /* ── BATALKAN (officer) ───────────────────────────────────────────── */
  if (action === "void") {
    if (!isOfficer(b.key)) {
      return NextResponse.json({ ok: false, error: "officer_key_invalid" }, { status: 401 });
    }
    const rec = await setInvoiceStatus(String(b.number ?? ""), "void" satisfies InvoiceStatus);
    if (!rec) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    console.log(`[invoice] ${rec.number} VOIDED`);
    return NextResponse.json({ ok: true, invoice: toPayload(rec) });
  }

  /* ── DAFTAR SEMUA (officer) ───────────────────────────────────────── */
  if (action === "list") {
    if (!isOfficer(b.key)) {
      return NextResponse.json({ ok: false, error: "officer_key_invalid" }, { status: 401 });
    }
    const recs = await listAllInvoices();
    return NextResponse.json({ ok: true, total: recs.length, invoices: recs.map(toPayload) });
  }

  return NextResponse.json(
    { ok: false, error: "unknown_action", message: "Aksi tidak dikenal." },
    { status: 400 }
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const number = url.searchParams.get("number") ?? "";
  const token = url.searchParams.get("token") ?? url.searchParams.get("k") ?? "";
  const rec = await getInvoice(number, token);
  if (!rec) {
    return NextResponse.json(
      { ok: false, error: "not_found", message: "Invoice tidak ditemukan." },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true, invoice: toPayload(rec) });
}
