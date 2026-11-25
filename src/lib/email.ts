/**
 * src/lib/email.ts — Mesin Notifikasi Email Portal v2 (server-only).
 * ----------------------------------------------------------------------------
 * Misi: setiap peristiwa penting kasus klien mengirim email status otomatis:
 * tiket terbit, tahap penanganan berubah, dokumen diterima/diverifikasi/ditolak,
 * invoice terbit, dan invoice lunas.
 *
 * Arsitektur tiga lapis:
 * 1. TEMPLATE — render subjek + teks polos + HTML ringan (inline style, aman
 *    untuk semua klien email) dalam bahasa Indonesia ber-brand TOP KONSULTAN.
 * 2. TRANSPORT — bila env RESEND_API_KEY + EMAIL_FROM tersedia, email dikirim
 *    nyata via HTTP API Resend (tanpa dependensi baru — cukup fetch). Tanpa
 *    kredensial → mode ANTREAN: notifikasi tetap dipersist & tampil di portal.
 * 3. PERSIST — setiap upaya tercatat di tabel Notification (status:
 *    queued | sent | failed) sehingga klien melihat riwayat "kabar" di portal
 *    dan officer bisa mengauditnya.
 *
 * Prinsip: notify() TIDAK PERNAH melempar — kegagalan email tidak boleh
 * membatalkan aksi utama (unggah dokumen, terbitkan invoice, dsb.).
 */

import { db } from "@/lib/db";
import { BRAND } from "@/data/brand";

/* ================================ KONSTANTA ================================= */

export type NotifyKind =
  | "case-created"
  | "stage"
  | "doc-received"
  | "doc-verified"
  | "doc-rejected"
  | "invoice-issued"
  | "invoice-paid";

export interface NotificationItem {
  id: string;
  ticket: string;
  toEmail: string;
  kind: NotifyKind;
  subject: string;
  status: "queued" | "sent" | "failed";
  createdAt: string;
}

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

/* ============================ STORE MEMORI (FALLBACK) ======================= */

const memoryNotifications: NotificationItem[] = [];

/* =============================== TRANSPORT ================================== */

/** Apakah pengiriman email nyata aktif (kredensial Resend tersedia)? */
export function emailTransportActive(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/** Nama pengirim default. */
function fromAddress(): string {
  return process.env.EMAIL_FROM ?? `${BRAND.legal} <no-reply@${BRAND.domain}>`;
}

interface SendResult {
  status: "sent" | "failed" | "queued";
  error?: string;
}

/** Kirim email via Resend HTTP API; kembalikan hasil singkat. */
async function transport(to: string, content: EmailContent): Promise<SendResult> {
  if (!emailTransportActive()) {
    return { status: "queued" }; // mode antrean — dipersist, tampil di portal
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [to],
        subject: content.subject,
        html: content.html,
        text: content.text,
      }),
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 180);
      return { status: "failed", error: `resend_${res.status}: ${detail}` };
    }
    return { status: "sent" };
  } catch (err) {
    return { status: "failed", error: err instanceof Error ? err.message.slice(0, 180) : "network_error" };
  }
}

/* =============================== TEMPLATE =================================== */

export interface NotifyParams {
  ticket: string;
  clientName: string;
  clientEmail: string;
  service?: string | null;
  stageLabel?: string | null;
  stageNote?: string | null;
  docName?: string | null;
  docNote?: string | null;
  invoiceNumber?: string | null;
  invoiceAmount?: string | null;
  invoiceUrl?: string | null;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function firstName(name: string): string {
  return (name || "Saudara").split(" ")[0];
}

/** Bungkus konten dengan kulit email ber-brand (tabel inline-style). */
function shell(ticket: string, title: string, intro: string, rows: [string, string][], outro: string, cta?: { label: string; url: string }): EmailContent["html"] {
  const rowHtml = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 14px;color:#71717a;font-size:12px;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;color:#18181b;font-size:13px;font-weight:600">${esc(v)}</td></tr>`
    )
    .join("");
  const ctaHtml = cta
    ? `<p style="margin:20px 0 0"><a href="${esc(cta.url)}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:12px 22px;border-radius:10px">${esc(cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7">
<tr><td style="background:#09090b;padding:20px 24px">
  <p style="margin:0;color:#a78bfa;font-size:11px;letter-spacing:3px;font-weight:700">PT TOP KONSULTAN INTERNASIONAL</p>
  <p style="margin:6px 0 0;color:#ffffff;font-size:18px;font-weight:800">${esc(title)}</p>
</td></tr>
<tr><td style="padding:24px">
  <p style="margin:0 0 14px;color:#3f3f46;font-size:14px;line-height:1.65">${intro}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e4e4e7;border-radius:12px">${rowHtml}</table>
  ${ctaHtml}
  <p style="margin:18px 0 0;color:#3f3f46;font-size:13px;line-height:1.65">${outro}</p>
</td></tr>
<tr><td style="padding:16px 24px;background:#fafafa;border-top:1px solid #e4e4e7">
  <p style="margin:0;color:#a1a1aa;font-size:11px;line-height:1.6">${esc(BRAND.legal)} — ${esc(BRAND.domain)}<br>WhatsApp ${esc(BRAND.phone)} (24/7) · Email ${esc(BRAND.email)}<br>Email otomatis Portal Klien — tiket ${esc(ticket)}</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

/** Render konten email per jenis peristiwa. */
export function renderEmail(kind: NotifyKind, p: NotifyParams): EmailContent {
  const portalUrl = `${BRAND.url}/portal`;
  const svc = p.service ?? "Konsultasi Umum";
  const baseRows: [string, string][] = [
    ["Nomor tiket", p.ticket],
    ["Layanan", svc],
  ];

  switch (kind) {
    case "case-created": {
      const intro = `Selamat datang, ${esc(firstName(p.clientName))}. Brief Anda telah kami terima dan langsung ditangani Dewan Pakar. Nomor tiket di atas adalah kunci Anda memantau seluruh proses penanganan.`;
      return {
        subject: `[${p.ticket}] Brief diterima — selamat datang di ${BRAND.name}`,
        text: `Selamat datang, ${firstName(p.clientName)}.\n\nBrief Anda telah diterima ${BRAND.legal}.\nNomor tiket: ${p.ticket}\nLayanan: ${svc}\n\nPantau progres penanganan kapan pun di ${portalUrl} (masuk dengan tiket + email ini).\n\nWhatsApp ${BRAND.phone} (24/7)\n${BRAND.url}`,
        html: shell(
          p.ticket,
          "Brief Anda Diterima",
          intro,
          baseRows,
          `Simpan nomor tiket Anda. Masuk ke Portal Klien kapan pun untuk memantau timeline, mengunggah dokumen, dan melihat tagihan.`,
          { label: "Buka Portal Klien", url: portalUrl }
        ),
      };
    }
    case "stage": {
      const rows: [string, string][] = [...baseRows, ["Tahap baru", p.stageLabel ?? "-"]];
      if (p.stageNote) rows.push(["Catatan tim", p.stageNote]);
      return {
        subject: `[${p.ticket}] Status naik ke: ${p.stageLabel ?? "tahap baru"}`,
        text: `Halo ${firstName(p.clientName)},\n\nKasus ${p.ticket} kini memasuki tahap: ${p.stageLabel ?? "-"}.\nLayanan: ${svc}${p.stageNote ? `\nCatatan tim: ${p.stageNote}` : ""}\n\nPantau detailnya di ${portalUrl}.\n\nWhatsApp ${BRAND.phone} (24/7)`,
        html: shell(
          p.ticket,
          "Status Penanganan Diperbarui",
          `Halo ${esc(firstName(p.clientName))}, kasus Anda maju ke tahap berikutnya. Berikut ringkasannya:`,
          rows,
          `Anda bisa melihat timeline lengkap enam tahap beserta dokumen & tagihan di Portal Klien.`,
          { label: "Lihat Progres Saya", url: portalUrl }
        ),
      };
    }
    case "doc-received": {
      const rows: [string, string][] = [...baseRows, ["Dokumen", p.docName ?? "-"]];
      return {
        subject: `[${p.ticket}] Dokumen "${p.docName ?? "-"}" diterima`,
        text: `Halo ${firstName(p.clientName)},\n\nDokumen "${p.docName ?? "-"}" untuk kasus ${p.ticket} telah kami terima dan sedang diperiksa Dewan Pakar (biasanya ≤ 48 jam kerja).\n\nRiwayat dokumen Anda: ${portalUrl}\n\nWhatsApp ${BRAND.phone} (24/7)`,
        html: shell(
          p.ticket,
          "Dokumen Diterima",
          `Terima kasih, ${esc(firstName(p.clientName))}. Dokumen berikut telah masuk dan sedang diperiksa tim penanganan — biasanya ≤ 48 jam kerja:`,
          rows,
          `Status verifikasi akan terlihat di Portal Klien begitu tim selesai memeriksa.`,
          { label: "Lihat Status Dokumen", url: portalUrl }
        ),
      };
    }
    case "doc-verified": {
      const rows: [string, string][] = [...baseRows, ["Dokumen", p.docName ?? "-"]];
      if (p.docNote) rows.push(["Catatan", p.docNote]);
      return {
        subject: `[${p.ticket}] Dokumen "${p.docName ?? "-"}" terverifikasi ✓`,
        text: `Halo ${firstName(p.clientName)},\n\nDokumen "${p.docName ?? "-"}" kasus ${p.ticket} telah LOLOS verifikasi.${p.docNote ? `\nCatatan: ${p.docNote}` : ""}\n\nSelengkapnya: ${portalUrl}\n\nWhatsApp ${BRAND.phone} (24/7)`,
        html: shell(
          p.ticket,
          "Dokumen Terverifikasi",
          `Kabar baik, ${esc(firstName(p.clientName))} — dokumen berikut telah lolos verifikasi tim kami:`,
          rows,
          `Tidak ada tindakan yang diperlukan untuk dokumen ini. Terima kasih atas kerja sama Anda.`,
          { label: "Buka Portal Klien", url: portalUrl }
        ),
      };
    }
    case "doc-rejected": {
      const rows: [string, string][] = [...baseRows, ["Dokumen", p.docName ?? "-"]];
      if (p.docNote) rows.push(["Alasan", p.docNote]);
      return {
        subject: `[${p.ticket}] Dokumen "${p.docName ?? "-"}" perlu diperbaiki`,
        text: `Halo ${firstName(p.clientName)},\n\nDokumen "${p.docName ?? "-"}" kasus ${p.ticket} belum lolos verifikasi.${p.docNote ? `\nAlasan: ${p.docNote}` : ""}\n\nSilakan unggah ulang versi yang diperbaiki di ${portalUrl}.\n\nWhatsApp ${BRAND.phone} (24/7)`,
        html: shell(
          p.ticket,
          "Dokumen Perlu Diperbaiki",
          `Halo ${esc(firstName(p.clientName))}, dokumen berikut belum lolos verifikasi dan perlu Anda unggah ulang:`,
          rows,
          `Masuk ke Portal Klien, buka kartu Dokumen Kasus, lalu unggah ulang berkas penggantinya. Bila ada pertanyaan, officer Anda siap membantu.`,
          { label: "Unggah Ulang Dokumen", url: portalUrl }
        ),
      };
    }
    case "invoice-issued": {
      const rows: [string, string][] = [
        ...baseRows,
        ["Nomor invoice", p.invoiceNumber ?? "-"],
        ["Nominal", p.invoiceAmount ?? "-"],
      ];
      const url = p.invoiceUrl ?? `${BRAND.url}/invoice`;
      return {
        subject: `[${p.ticket}] Invoice ${p.invoiceNumber ?? ""} terbit — ${p.invoiceAmount ?? ""}`,
        text: `Halo ${firstName(p.clientName)},\n\nInvoice ${p.invoiceNumber ?? "-"} untuk kasus ${p.ticket} telah diterbitkan.\nLayanan: ${svc}\nNominal: ${p.invoiceAmount ?? "-"}\n\nBuka dokumen & bayar via QRIS: ${url}\n\nWhatsApp ${BRAND.phone} (24/7)`,
        html: shell(
          p.ticket,
          "Invoice Terbit",
          `Halo ${esc(firstName(p.clientName))}, tagihan resmi untuk kasus Anda telah diterbitkan:`,
          rows,
          `Buka dokumen invoice untuk melihat rincian lengkap dan membayar via QRIS (semua e-wallet & mobile banking).`,
          { label: "Buka Invoice", url }
        ),
      };
    }
    case "invoice-paid": {
      const rows: [string, string][] = [
        ...baseRows,
        ["Nomor invoice", p.invoiceNumber ?? "-"],
        ["Nominal", p.invoiceAmount ?? "-"],
      ];
      const url = p.invoiceUrl ?? `${BRAND.url}/invoice`;
      return {
        subject: `[${p.ticket}] Invoice ${p.invoiceNumber ?? ""} LUNAS — terima kasih`,
        text: `Halo ${firstName(p.clientName)},\n\nPembayaran untuk invoice ${p.invoiceNumber ?? "-"} (${p.invoiceAmount ?? "-"}) kasus ${p.ticket} telah kami terima dan dikonfirmasi LUNAS.\n\nBukti & dokumen: ${url}\n\nWhatsApp ${BRAND.phone} (24/7)`,
        html: shell(
          p.ticket,
          "Pembayaran Diterima",
          `Terima kasih, ${esc(firstName(p.clientName))}. Pembayaran berikut telah kami terima dan dikonfirmasi LUNAS:`,
          rows,
          `Penanganan kasus Anda berlanjut sesuai jadwal. Simpan tautan invoice sebagai bukti resmi.`,
          { label: "Lihat Invoice", url }
        ),
      };
    }
  }
}

/* ============================== PERSIST + KIRIM ============================== */

/**
 * Terbitkan notifikasi: render template → persist → kirim (bila transport
 * aktif) → mutakhirkan status. Tidak pernah melempar.
 */
export async function notify(kind: NotifyKind, p: NotifyParams): Promise<NotificationItem | null> {
  try {
    const toEmail = (p.clientEmail ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) return null;

    const content = renderEmail(kind, p);
    const result = await transport(toEmail, content);

    const base = {
      ticket: p.ticket,
      toEmail,
      kind,
      subject: content.subject,
      status: result.status,
    };

    try {
      const row = await db.notification.create({
        data: {
          ticket: base.ticket,
          toEmail: base.toEmail,
          kind: base.kind,
          subject: base.subject,
          bodyText: content.text,
          bodyHtml: content.html,
          status: base.status,
          error: result.error ?? null,
        },
      });
      return {
        id: row.id,
        ...base,
        createdAt: row.createdAt.toISOString(),
      };
    } catch {
      const item: NotificationItem = {
        id: `NTF-${Date.now().toString(36).toUpperCase()}`,
        ...base,
        createdAt: new Date().toISOString(),
      };
      memoryNotifications.unshift(item);
      if (memoryNotifications.length > 500) memoryNotifications.pop();
      return item;
    }
  } catch {
    return null; // notifikasi tidak boleh membatalkan aksi utama
  }
}

/** Riwayat notifikasi satu tiket (untuk kartu "Kabar Terbaru" di portal). */
export async function listNotificationsByTicket(ticket: string): Promise<NotificationItem[]> {
  const t = (ticket ?? "").trim().toUpperCase();
  if (!t) return [];
  const out: NotificationItem[] = [];
  try {
    const rows = await db.notification.findMany({
      where: { ticket: t },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    for (const r of rows) {
      out.push({
        id: r.id,
        ticket: r.ticket,
        toEmail: r.toEmail,
        kind: r.kind as NotifyKind,
        subject: r.subject,
        status: (r.status === "sent" || r.status === "failed" ? r.status : "queued") as NotificationItem["status"],
        createdAt: r.createdAt.toISOString(),
      });
    }
  } catch {
    // fallback memori di bawah
  }
  for (const m of memoryNotifications) {
    if (m.ticket === t && !out.some((o) => o.id === m.id)) out.push({ ...m });
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return out.slice(0, 50);
}
