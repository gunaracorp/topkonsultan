/**
 * src/lib/documents.ts — Berkas Kasus Klien, Portal v2 (server-only).
 * ----------------------------------------------------------------------------
 * Misi: klien mengunggah dokumen persyaratan (KTP, akta, NPWP, …) langsung
 * dari dasbor portal; officer memverifikasi atau menolaknya dengan catatan.
 *
 * Desain tahan banting (mengikuti portal.ts & invoice.ts):
 * - Database tersedia → berkas dipersist di tabel CaseDocument (Prisma/SQLite).
 * - Database tidak tersedia (serverless read-only) → fallback memori: berkas
 *   yang diunggah pada sesi server yang sama tetap bisa dilihat & diunduh.
 *
 * Batas & keamanan:
 * - Maks 4 MB per berkas (dikenai sebelum base64 ± 5,4 MB).
 * - Whitelist tipe: PDF, JPG, PNG, WEBP, DOC, DOCX.
 * - Maks 24 berkas per tiket (sisanya ditolak agar tidak membanjiri server).
 * - Akses file selalu couple dengan tiket sesi — tidak ada enumerasi ID publik.
 */

import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";

/* ================================ KONSTANTA ================================= */

export type DocumentStatus = "pending" | "verified" | "rejected";

export interface DocumentMeta {
  id: string;
  ticket: string;
  name: string;
  filename: string;
  mime: string;
  size: number;
  status: DocumentStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  source: "db" | "memory";
}

/** Rekaman penuh (termasuk isi base64) — hanya untuk internal server. */
interface DocumentRecord extends DocumentMeta {
  data: string;
}

/** Batas ukuran berkas mentah (byte). */
export const MAX_FILE_BYTES = 4 * 1024 * 1024;

/** Batas jumlah berkas per tiket. */
export const MAX_DOCS_PER_TICKET = 24;

/** Tipe berkas yang diterima (mime + ekstensi yang diizinkan). */
export const ALLOWED_MIMES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

/** Label ramah per tipe (untuk UI). */
export const DOC_TYPE_HINT = "PDF, JPG, PNG, WEBP, DOC, atau DOCX — maks 4 MB";

/* ============================ STORE MEMORI (FALLBACK) ======================= */

const memoryDocs = new Map<string, DocumentRecord>();

/* =============================== VALIDASI =================================== */

export interface UploadInput {
  ticket: string;
  name: string;
  filename: string;
  mime: string;
  data: string; // base64 (tanpa prefix data:)
}

/** Validasi + normalisasi input unggahan; melempar Error(code) bila ditolak. */
export function normalizeUpload(input: UploadInput): UploadInput & { size: number } {
  const ticket = input.ticket.trim().toUpperCase();
  if (!/^TOP-[A-Z0-9-]{2,38}$/.test(ticket)) throw new Error("ticket_invalid");

  const name = input.name.trim().slice(0, 120);
  if (name.length < 3) throw new Error("name_invalid");

  const filename = input.filename.trim().replace(/[\r\n"\\/\x00-\x1f]/g, "_").slice(0, 160);
  if (filename.length < 3) throw new Error("filename_invalid");

  const mime = (input.mime || "").trim().toLowerCase().split(";")[0];
  if (!ALLOWED_MIMES[mime]) throw new Error("mime_unsupported");

  const data = input.data.replace(/^data:[^,]+,/, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) throw new Error("data_invalid");

  const size = Math.floor((data.length * 3) / 4) - (data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0);
  if (size <= 0) throw new Error("data_invalid");
  if (size > MAX_FILE_BYTES) throw new Error("file_too_large");

  return { ticket, name, filename, mime, data, size };
}

/* =============================== PENYIMPANAN ================================ */

/** Simpan berkas baru (dipanggil aksi `upload` sesi portal). */
export async function saveDocument(input: UploadInput): Promise<DocumentMeta> {
  const data = normalizeUpload(input);

  const existing = await listDocumentsByTicket(data.ticket);
  if (existing.length >= MAX_DOCS_PER_TICKET) throw new Error("quota_exceeded");

  const rec: DocumentRecord = {
    id: `DOC-${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString("hex").toUpperCase()}`,
    ticket: data.ticket,
    name: data.name,
    filename: data.filename,
    mime: data.mime,
    size: data.size,
    status: "pending",
    note: null,
    data: data.data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: "memory",
  };

  try {
    const row = await db.caseDocument.create({
      data: {
        ticket: rec.ticket,
        name: rec.name,
        filename: rec.filename,
        mime: rec.mime,
        size: rec.size,
        data: rec.data,
        status: "pending",
      },
    });
    return metaOf(rowToRecord(row, "db"));
  } catch {
    memoryDocs.set(rec.id, rec);
    return metaOf(rec);
  }
}

/** Daftar berkas satu tiket (metadata saja — tanpa isi). */
export async function listDocumentsByTicket(ticket: string): Promise<DocumentMeta[]> {
  const t = (ticket ?? "").trim().toUpperCase();
  if (!t) return [];
  const out: DocumentMeta[] = [];
  try {
    const rows = await db.caseDocument.findMany({
      where: { ticket: t },
      orderBy: { createdAt: "desc" },
    });
    for (const r of rows) out.push(metaOf(rowToRecord(r, "db")));
  } catch {
    // fallback memori di bawah
  }
  for (const m of memoryDocs.values()) {
    if (m.ticket === t && !out.some((o) => o.id === m.id)) out.push(metaOf(m));
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return out;
}

/** Daftar berkas terbaru lintas tiket (officer). */
export async function listRecentDocuments(): Promise<DocumentMeta[]> {
  const out: DocumentMeta[] = [];
  try {
    const rows = await db.caseDocument.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    for (const r of rows) out.push(metaOf(rowToRecord(r, "db")));
  } catch {
    // fallback memori di bawah
  }
  for (const m of memoryDocs.values()) {
    if (!out.some((o) => o.id === m.id)) out.push(metaOf(m));
  }
  return out.slice(0, 100);
}

/** Ambil isi berkas (untuk diunduh klien pemilik tiket). */
export async function getDocumentFile(
  id: string,
  ticket: string
): Promise<DocumentRecord | null> {
  const i = (id ?? "").trim();
  const t = (ticket ?? "").trim().toUpperCase();
  if (!i || !t) return null;
  try {
    const row = await db.caseDocument.findUnique({ where: { id: i } });
    if (row && row.ticket === t) return rowToRecord(row, "db");
  } catch {
    // fallback
  }
  const mem = memoryDocs.get(i);
  if (mem && mem.ticket === t) return { ...mem };
  return null;
}

/** Hapus berkas milik sendiri — hanya boleh saat masih `pending`. */
export async function removeDocument(id: string, ticket: string): Promise<boolean> {
  const i = (id ?? "").trim();
  const t = (ticket ?? "").trim().toUpperCase();
  if (!i || !t) return false;
  try {
    const row = await db.caseDocument.findUnique({ where: { id: i } });
    if (!row || row.ticket !== t) return false;
    if (row.status !== "pending") return false;
    await db.caseDocument.delete({ where: { id: i } });
    return true;
  } catch {
    const mem = memoryDocs.get(i);
    if (!mem || mem.ticket !== t || mem.status !== "pending") return false;
    memoryDocs.delete(i);
    return true;
  }
}

/** Ubah status verifikasi berkas — officer only. */
export async function setDocumentStatus(
  id: string,
  status: DocumentStatus,
  note?: string | null
): Promise<DocumentMeta | null> {
  const i = (id ?? "").trim();
  if (!i) return null;
  const cleanNote = note?.trim().slice(0, 500) || null;

  try {
    const row = await db.caseDocument.update({
      where: { id: i },
      data: { status, note: cleanNote },
    });
    return metaOf(rowToRecord(row, "db"));
  } catch {
    const mem = memoryDocs.get(i);
    if (!mem) return null;
    mem.status = status;
    mem.note = cleanNote;
    mem.updatedAt = new Date().toISOString();
    return metaOf(mem);
  }
}

/* =============================== UTILITAS =================================== */

function rowToRecord(
  row: {
    id: string; ticket: string; name: string; filename: string; mime: string;
    size: number; data: string; status: string; note: string | null;
    createdAt: Date; updatedAt: Date;
  },
  source: "db" | "memory"
): DocumentRecord {
  return {
    id: row.id,
    ticket: row.ticket,
    name: row.name,
    filename: row.filename,
    mime: row.mime,
    size: row.size,
    status: (row.status === "verified" || row.status === "rejected" ? row.status : "pending") as DocumentStatus,
    note: row.note,
    data: row.data,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    source,
  };
}

function metaOf(rec: DocumentRecord): DocumentMeta {
  const { data: _data, ...meta } = rec;
  return meta;
}

/** Ukuran berkas ramah manusia (KB/MB). */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${bytes} B`;
}
