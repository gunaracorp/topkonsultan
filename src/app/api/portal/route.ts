import { NextResponse } from "next/server";
import {
  STAGES,
  DOCS,
  issueSession,
  loginCase,
  verifySession,
  getCaseByTicket,
  setCaseStage,
  type CaseRecord,
} from "@/lib/portal";
import {
  saveDocument,
  listDocumentsByTicket,
  listRecentDocuments,
  getDocumentFile,
  removeDocument,
  setDocumentStatus,
  formatFileSize,
  MAX_FILE_BYTES,
  DOC_TYPE_HINT,
  type DocumentMeta,
  type DocumentStatus,
} from "@/lib/documents";
import { notify, listNotificationsByTicket, emailTransportActive, type NotificationItem } from "@/lib/email";
import { officerKey } from "@/lib/invoice";
import { QRIS } from "@/data/payment";
import { BRAND } from "@/data/brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/portal — otak Portal Klien (v2: Kabar & Berkas).
 *
 * POST { action: "login", ticket, email }
 *   → 200 { ok, token, case }      sesi terbit (token berlaku 7 hari)
 *   → 401 { ok:false }             kombinasi tiket+email tidak dikenal
 *
 * POST { action: "case", token }
 *   → 200 { ok, case }             data kasus terbaru
 *   → 401 { ok:false }             token tidak valid / kedaluwarsa
 *
 * POST (multipart) { action: "upload", token, docName, file }
 *   → 201 { ok, document }         berkas tersimpan (menunggu verifikasi)
 *   → 400/401/413                  validasi gagal / sesi invalid / terlalu besar
 *
 * POST { action: "documents", token }
 *   → 200 { ok, documents }        daftar berkas kasus (metadata)
 *
 * POST { action: "doc-remove", token, id }
 *   → 200 { ok }                   hapus berkas milik sendiri (hanya pending)
 *
 * POST { action: "notifications", token }
 *   → 200 { ok, notifications }    riwayat email status kasus
 *
 * POST { action: "stage", key, ticket, stage, note? }        — OFFICER
 *   → 200 { ok, case, notification }  tahap berubah + email status terkirim
 *
 * POST { action: "doc-verify" | "doc-reject", key, id, note? } — OFFICER
 *   → 200 { ok, document, notification }
 *
 * POST { action: "doc-list", key }                            — OFFICER
 *   → 200 { ok, documents }        berkas terbaru lintas kasus
 *
 * GET  ?doc=…&t=…                  → unduh berkas (sesi portal valid)
 */

interface PortalCasePayload {
  ticket: string;
  name: string;
  company: string | null;
  service: string | null;
  stage: number;
  stageLabel: string;
  progress: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  source: string;
  timeline: { index: number; label: string; desc: string; state: "done" | "active" | "pending" }[];
  documents: { name: string; required: boolean; done: boolean }[];
  payment: {
    qrisImage: string;
    nmid: string;
    merchant: string;
    whatsappUrl: string;
  };
  officer: { name: string; phone: string; whatsappUrl: string };
}

function toPayload(rec: CaseRecord): PortalCasePayload {
  const stage = Math.min(Math.max(rec.stage, 1), STAGES.length);
  const progress = Math.round((stage / STAGES.length) * 100);

  // Dokumen inti dianggap lengkap mulai tahap 3 (penyusunan dokumen).
  const docsDone = stage >= 3;
  const documents = DOCS.map((d, i) => ({
    ...d,
    done: docsDone || (stage >= 2 && i < 2),
  }));

  const waUrl = (text: string) =>
    `https://wa.me/${BRAND.whatsappIntl}?text=${encodeURIComponent(text)}`;

  return {
    ticket: rec.refCode,
    name: rec.name,
    company: rec.company ?? null,
    service: rec.service ?? "Konsultasi Umum",
    stage,
    stageLabel: STAGES[stage - 1].label,
    progress,
    note: rec.note ?? null,
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
    source: rec.source,
    timeline: STAGES.map((s, i) => ({
      index: i + 1,
      label: s.label,
      desc: s.desc,
      state: i + 1 < stage ? "done" : i + 1 === stage ? "active" : "pending",
    })),
    documents,
    payment: {
      qrisImage: QRIS.image,
      nmid: QRIS.nmid,
      merchant: QRIS.merchant,
      whatsappUrl: waUrl(
        `Halo PT TOP KONSULTAN INTERNASIONAL, saya klien dengan tiket ${rec.refCode} ingin menanyakan pembayaran via QRIS.`
      ),
    },
    officer: {
      name: "Tim Penanganan Kasus",
      phone: BRAND.phone,
      whatsappUrl: waUrl(
        `Halo PT TOP KONSULTAN INTERNASIONAL, saya klien dengan tiket ${rec.refCode} ingin meminta pembaruan status penanganan.`
      ),
    },
  };
}

function docToPayload(d: DocumentMeta) {
  return {
    id: d.id,
    name: d.name,
    filename: d.filename,
    mime: d.mime,
    size: d.size,
    sizeLabel: formatFileSize(d.size),
    status: d.status,
    note: d.note,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    source: d.source,
  };
}

function notifToPayload(n: NotificationItem) {
  return {
    id: n.id,
    kind: n.kind,
    subject: n.subject,
    status: n.status,
    toEmail: n.toEmail,
    createdAt: n.createdAt,
  };
}

function isOfficer(key: unknown): boolean {
  return typeof key === "string" && key.length > 0 && key === officerKey();
}

const UPLOAD_ERRORS: Record<string, { message: string; status: number }> = {
  ticket_invalid: { message: "Sesi kasus tidak dikenali — muat ulang halaman lalu coba lagi.", status: 400 },
  name_invalid: { message: "Jenis dokumen wajib dipilih (minimal 3 karakter).", status: 400 },
  filename_invalid: { message: "Nama berkas tidak valid.", status: 400 },
  mime_unsupported: { message: `Tipe berkas tidak didukung. Yang diterima: ${DOC_TYPE_HINT}.`, status: 415 },
  data_invalid: { message: "Isi berkas rusak atau kosong — coba berkas lain.", status: 400 },
  file_too_large: { message: `Berkas melebihi 4 MB — kompres atau pecah dulu (${DOC_TYPE_HINT}).`, status: 413 },
  quota_exceeded: { message: "Batas 24 berkas per kasus tercapai. Hubungi officer untuk bantuan.", status: 429 },
};

/** Sesi valid → tiket; atau null. */
function sessionTicket(b: Record<string, unknown>): string | null {
  return verifySession(String(b.token ?? ""));
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  let b: Record<string, unknown> = {};
  let uploadFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    if (form) {
      const action = String(form.get("action") ?? "");
      const token = String(form.get("token") ?? "");
      const docName = String(form.get("docName") ?? "");
      const file = form.get("file");
      b = { action, token, docName };
      if (file instanceof File && file.size > 0) uploadFile = file;
    }
  } else {
    const body: unknown = await req.json().catch(() => null);
    b = (body ?? {}) as Record<string, unknown>;
  }
  const action = String(b.action ?? "");

  /* ── LOGIN ─────────────────────────────────────────────────────────── */
  if (action === "login") {
    const ticket = String(b.ticket ?? "").trim();
    const email = String(b.email ?? "").trim();

    if (!ticket || !email) {
      return NextResponse.json(
        { ok: false, error: "fields_required", message: "Nomor tiket dan email wajib diisi." },
        { status: 400 }
      );
    }

    const rec = await loginCase(ticket, email);
    if (!rec) {
      // Jeda menumpulkan brute-force; pesan tidak membocorkan mana yang salah.
      await new Promise((r) => setTimeout(r, 650));
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_credentials",
          message:
            "Kombinasi nomor tiket dan email tidak dikenal. Pastikan Anda memakai email saat mengirim brief. Demo: tiket TOP-DEMO2026 · email demo@pusatperizinan.com.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      token: issueSession(rec.refCode),
      case: toPayload(rec),
    });
  }

  /* ── AMBIL KASUS (sesi aktif) ──────────────────────────────────────── */
  if (action === "case") {
    const ticket = sessionTicket(b);
    if (!ticket) {
      return NextResponse.json(
        { ok: false, error: "session_invalid", message: "Sesi berakhir. Silakan masuk kembali." },
        { status: 401 }
      );
    }
    const rec = await getCaseByTicket(ticket);
    if (!rec) {
      return NextResponse.json(
        { ok: false, error: "case_missing", message: "Kasus tidak lagi tersedia. Hubungi tim kami." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, case: toPayload(rec) });
  }

  /* ── UNGGAH BERKAS (klien, sesi aktif) ─────────────────────────────── */
  if (action === "upload") {
    const ticket = sessionTicket(b);
    if (!ticket) {
      return NextResponse.json(
        { ok: false, error: "session_invalid", message: "Sesi berakhir. Silakan masuk kembali." },
        { status: 401 }
      );
    }
    if (!uploadFile) {
      return NextResponse.json(
        { ok: false, error: "file_required", message: `Pilih berkas dulu (${DOC_TYPE_HINT}).` },
        { status: 400 }
      );
    }
    if (uploadFile.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { ok: false, error: "file_too_large", message: UPLOAD_ERRORS.file_too_large.message },
        { status: 413 }
      );
    }

    const rec = await getCaseByTicket(ticket);
    if (!rec) {
      return NextResponse.json({ ok: false, error: "case_missing" }, { status: 404 });
    }

    let dataB64: string;
    try {
      const buf = Buffer.from(await uploadFile.arrayBuffer());
      dataB64 = buf.toString("base64");
    } catch {
      return NextResponse.json(
        { ok: false, error: "data_invalid", message: UPLOAD_ERRORS.data_invalid.message },
        { status: 400 }
      );
    }

    try {
      const doc = await saveDocument({
        ticket,
        name: String(b.docName ?? ""),
        filename: uploadFile.name,
        mime: uploadFile.type,
        data: dataB64,
      });
      // Kabar email: dokumen diterima (tidak pernah membatalkan unggahan).
      const n = await notify("doc-received", {
        ticket: rec.refCode,
        clientName: rec.name,
        clientEmail: rec.email,
        service: rec.service,
        docName: doc.name,
      });
      console.log(`[portal] upload ${doc.id} (${doc.name}) oleh ${ticket}`);
      return NextResponse.json(
        { ok: true, document: docToPayload(doc), notification: n ? notifToPayload(n) : null },
        { status: 201 }
      );
    } catch (err) {
      const code = err instanceof Error ? err.message : "upload_failed";
      const mapped = UPLOAD_ERRORS[code] ?? { message: "Unggahan gagal — coba lagi sebentar.", status: 400 };
      return NextResponse.json({ ok: false, error: code, message: mapped.message }, { status: mapped.status });
    }
  }

  /* ── DAFTAR BERKAS KASUS (klien) ───────────────────────────────────── */
  if (action === "documents") {
    const ticket = sessionTicket(b);
    if (!ticket) {
      return NextResponse.json({ ok: false, error: "session_invalid" }, { status: 401 });
    }
    const docs = await listDocumentsByTicket(ticket);
    return NextResponse.json({ ok: true, ticket, documents: docs.map(docToPayload) });
  }

  /* ── HAPUS BERKAS MILIK SENDIRI (hanya status pending) ─────────────── */
  if (action === "doc-remove") {
    const ticket = sessionTicket(b);
    if (!ticket) {
      return NextResponse.json({ ok: false, error: "session_invalid" }, { status: 401 });
    }
    const removed = await removeDocument(String(b.id ?? ""), ticket);
    if (!removed) {
      return NextResponse.json(
        {
          ok: false,
          error: "remove_denied",
          message: "Berkas tidak ditemukan atau sudah diverifikasi tim (tidak dapat dihapus).",
        },
        { status: 403 }
      );
    }
    console.log(`[portal] doc removed by client ${ticket}`);
    return NextResponse.json({ ok: true });
  }

  /* ── RIWAYAT NOTIFIKASI EMAIL (klien) ──────────────────────────────── */
  if (action === "notifications") {
    const ticket = sessionTicket(b);
    if (!ticket) {
      return NextResponse.json({ ok: false, error: "session_invalid" }, { status: 401 });
    }
    const items = await listNotificationsByTicket(ticket);
    return NextResponse.json({
      ok: true,
      ticket,
      transport: emailTransportActive() ? "live" : "outbox",
      notifications: items.map(notifToPayload),
    });
  }

  /* ── UBAH TAHAP KASUS (OFFICER) ────────────────────────────────────── */
  if (action === "stage") {
    if (!isOfficer(b.key)) {
      await new Promise((r) => setTimeout(r, 650));
      return NextResponse.json({ ok: false, error: "officer_key_invalid" }, { status: 401 });
    }
    const stage = Number(b.stage ?? 0);
    if (!Number.isInteger(stage) || stage < 1 || stage > STAGES.length) {
      return NextResponse.json(
        { ok: false, error: "stage_invalid", message: `Tahap harus 1–${STAGES.length}.` },
        { status: 400 }
      );
    }
    const note = b.note == null ? null : String(b.note);
    const rec = await setCaseStage(String(b.ticket ?? ""), stage, note);
    if (!rec) {
      return NextResponse.json({ ok: false, error: "case_missing" }, { status: 404 });
    }
    const n = await notify("stage", {
      ticket: rec.refCode,
      clientName: rec.name,
      clientEmail: rec.email,
      service: rec.service,
      stageLabel: STAGES[rec.stage - 1].label,
      stageNote: rec.note,
    });
    console.log(`[portal] stage ${rec.refCode} → ${rec.stage} (${STAGES[rec.stage - 1].label})`);
    return NextResponse.json({
      ok: true,
      case: toPayload(rec),
      notification: n ? notifToPayload(n) : null,
    });
  }

  /* ── VERIFIKASI / TOLAK BERKAS (OFFICER) ───────────────────────────── */
  if (action === "doc-verify" || action === "doc-reject") {
    if (!isOfficer(b.key)) {
      await new Promise((r) => setTimeout(r, 650));
      return NextResponse.json({ ok: false, error: "officer_key_invalid" }, { status: 401 });
    }
    const status: DocumentStatus = action === "doc-verify" ? "verified" : "rejected";
    const note = b.note == null ? null : String(b.note);
    const doc = await setDocumentStatus(String(b.id ?? ""), status, note);
    if (!doc) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    // Kabar email hasil verifikasi ke klien pemilik kasus.
    const rec = await getCaseByTicket(doc.ticket);
    let n: NotificationItem | null = null;
    if (rec) {
      n = await notify(status === "verified" ? "doc-verified" : "doc-rejected", {
        ticket: rec.refCode,
        clientName: rec.name,
        clientEmail: rec.email,
        service: rec.service,
        docName: doc.name,
        docNote: doc.note,
      });
    }
    console.log(`[portal] doc ${doc.id} → ${status}`);
    return NextResponse.json({
      ok: true,
      document: docToPayload(doc),
      notification: n ? notifToPayload(n) : null,
    });
  }

  /* ── DAFTAR BERKAS TERBARU LINTAS KASUS (OFFICER) ──────────────────── */
  if (action === "doc-list") {
    if (!isOfficer(b.key)) {
      return NextResponse.json({ ok: false, error: "officer_key_invalid" }, { status: 401 });
    }
    const docs = await listRecentDocuments();
    return NextResponse.json({ ok: true, total: docs.length, documents: docs.map(docToPayload) });
  }

  return NextResponse.json(
    { ok: false, error: "unknown_action", message: "Aksi tidak dikenal." },
    { status: 400 }
  );
}

/* ── UNDUH BERKAS (sesi portal) ───────────────────────────────────────── */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const docId = url.searchParams.get("doc");
  const token = url.searchParams.get("t") ?? "";
  if (!docId) {
    return NextResponse.json({ ok: false, error: "doc_required" }, { status: 400 });
  }
  const ticket = verifySession(token);
  if (!ticket) {
    return NextResponse.json(
      { ok: false, error: "session_invalid", message: "Sesi berakhir. Silakan masuk kembali." },
      { status: 401 }
    );
  }
  const doc = await getDocumentFile(docId, ticket);
  if (!doc) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  // Nama file aman untuk header (tanpa CR/LF/kutip; fallback bila non-ASCII).
  const safeName = doc.filename.replace(/[^\w.\-() ]+/g, "_").replace(/^\.+/, "_") || "dokumen";
  const bytes = Buffer.from(doc.data, "base64");
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": doc.mime || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, no-store",
    },
  });
}
