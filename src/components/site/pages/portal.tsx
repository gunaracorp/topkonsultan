"use client";

/**
 * /portal — Portal Klien PT TOP KONSULTAN INTERNASIONAL.
 * ----------------------------------------------------------------------------
 * Dasbor privat setiap klien: login dengan nomor tiket (TOP-XXXXXX) + email
 * yang dipakai saat mengirim brief. Menampilkan (Portal v2 — Kabar & Berkas):
 *   - timeline enam tahap penanganan (real-time dari tim TOP)
 *   - unggah dokumen persyaratan + status verifikasinya
 *   - riwayat notifikasi email status kasus (tiket, tahap, dokumen, invoice)
 *   - kartu tagihan & pembayaran QRIS resmi
 *   - jalur langsung ke officer penanganan via WhatsApp
 *
 * Sesi: token HMAC 7 hari di sessionStorage — tidak ada password yang bocor
 * karena memang tidak ada password sama sekali.
 */

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Download,
  FileCheck2,
  FileWarning,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MailCheck,
  MessageCircle,
  Paperclip,
  QrCode,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "@/lib/router";
import { BRAND } from "@/data/brand";

const TOKEN_KEY = "topkonsultan_portal_token";

interface TimelineItem {
  index: number;
  label: string;
  desc: string;
  state: "done" | "active" | "pending";
}

interface PortalCase {
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
  timeline: TimelineItem[];
  documents: { name: string; required: boolean; done: boolean }[];
  payment: { qrisImage: string; nmid: string; merchant: string; whatsappUrl: string };
  officer: { name: string; phone: string; whatsappUrl: string };
}

type Phase = "idle" | "loading" | "locked" | "open";

/** Ringkasan invoice untuk kartu Tagihan & Pembayaran (aksi `mine`). */
interface InvoiceLite {
  number: string;
  status: "unpaid" | "paid" | "void";
  service: string;
  currency: string;
  amountFormatted: string;
  amountIdrFormatted: string;
  isForeign: boolean;
  url: string;
  createdAt: string;
}

const INVOICE_STATUS_UI: Record<
  InvoiceLite["status"],
  { label: string; cls: string }
> = {
  unpaid: { label: "Belum Bayar", cls: "border-amber-400/30 bg-amber-500/10 text-amber-300" },
  paid: { label: "Lunas", cls: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300" },
  void: { label: "Batal", cls: "border-red-400/30 bg-red-500/10 text-red-300" },
};

/** Berkas yang diunggah klien untuk kasusnya (aksi `documents`). */
interface UploadDoc {
  id: string;
  name: string;
  filename: string;
  mime: string;
  size: number;
  sizeLabel: string;
  status: "pending" | "verified" | "rejected";
  note: string | null;
  createdAt: string;
  updatedAt: string;
  source: string;
}

/** Entri riwayat notifikasi email (aksi `notifications`). */
interface NotifItem {
  id: string;
  kind: string;
  subject: string;
  status: "queued" | "sent" | "failed";
  toEmail: string;
  createdAt: string;
}

const DOC_STATUS_UI: Record<UploadDoc["status"], { label: string; cls: string; icon: typeof Check }> = {
  pending: { label: "Menunggu Verifikasi", cls: "border-amber-400/30 bg-amber-500/10 text-amber-300", icon: Clock3 },
  verified: { label: "Terverifikasi", cls: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300", icon: CheckCircle2 },
  rejected: { label: "Perlu Perbaikan", cls: "border-red-400/30 bg-red-500/10 text-red-300", icon: FileWarning },
};

const NOTIF_KIND_UI: Record<string, { label: string; icon: typeof Mail }> = {
  "case-created": { label: "Tiket Terbit", icon: MailCheck },
  stage: { label: "Status Kasus", icon: Clock3 },
  "doc-received": { label: "Dokumen Diterima", icon: Paperclip },
  "doc-verified": { label: "Dokumen Terverifikasi", icon: CheckCircle2 },
  "doc-rejected": { label: "Dokumen Perlu Perbaikan", icon: FileWarning },
  "invoice-issued": { label: "Invoice Terbit", icon: Receipt },
  "invoice-paid": { label: "Pembayaran Lunas", icon: BadgeCheck },
};

const NOTIF_STATUS_UI: Record<NotifItem["status"], { label: string; cls: string }> = {
  sent: { label: "Terkirim", cls: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300" },
  queued: { label: "Di Antrean", cls: "border-zinc-400/30 bg-zinc-500/10 text-zinc-300" },
  failed: { label: "Gagal", cls: "border-red-400/30 bg-red-500/10 text-red-300" },
};

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export default function PortalPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [ticket, setTicket] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<PortalCase | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceLite[] | null>(null);

  /* Portal v2 — berkas & kabar email */
  const [uploads, setUploads] = useState<UploadDoc[] | null>(null);
  const [notifs, setNotifs] = useState<NotifItem[] | null>(null);
  const [notifTransport, setNotifTransport] = useState<"live" | "outbox" | null>(null);
  const [docName, setDocName] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadOk, setUploadOk] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Ambil invoice milik tiket ini (Transaksi Penuh — /api/invoice `mine`). */
  const loadInvoices = useCallback(async (portalToken: string) => {
    try {
      const res = await fetch("/api/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mine", portalToken }),
      });
      if (!res.ok) {
        setInvoices(null);
        return;
      }
      const data = (await res.json()) as { ok: boolean; invoices?: InvoiceLite[] };
      setInvoices(data.ok ? (data.invoices ?? []) : null);
    } catch {
      setInvoices(null);
    }
  }, []);

  /** Muat daftar berkas kasus (Portal v2 — aksi `documents`). */
  const loadUploads = useCallback(async (portalToken: string) => {
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "documents", token: portalToken }),
      });
      if (!res.ok) {
        setUploads(null);
        return;
      }
      const data = (await res.json()) as { ok: boolean; documents?: UploadDoc[] };
      setUploads(data.ok ? (data.documents ?? []) : null);
    } catch {
      setUploads(null);
    }
  }, []);

  /** Muat riwayat notifikasi email kasus (Portal v2 — aksi `notifications`). */
  const loadNotifs = useCallback(async (portalToken: string) => {
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "notifications", token: portalToken }),
      });
      if (!res.ok) {
        setNotifs(null);
        return;
      }
      const data = (await res.json()) as {
        ok: boolean;
        transport?: "live" | "outbox";
        notifications?: NotifItem[];
      };
      setNotifTransport(data.transport ?? null);
      setNotifs(data.ok ? (data.notifications ?? []) : null);
    } catch {
      setNotifs(null);
    }
  }, []);

  const loadCase = useCallback(async (token: string, silent = false): Promise<boolean> => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "case", token }),
      });
      if (!res.ok) {
        window.sessionStorage.removeItem(TOKEN_KEY);
        setCaseData(null);
        setPhase("locked");
        return false;
      }
      const data = (await res.json()) as { ok: boolean; case: PortalCase };
      setCaseData(data.case);
      setPhase("open");
      return true;
    } catch {
      if (!silent) setError("Sinyal terputus — periksa koneksi lalu coba lagi.");
      return false;
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(TOKEN_KEY);
    if (saved) {
      void loadCase(saved, true);
    } else {
      setPhase("locked");
    }
  }, [loadCase]);

  /* Saat dasbor terbuka → muat invoice, berkas, dan kabar email kasus ini. */
  useEffect(() => {
    if (phase !== "open") return;
    const t = window.sessionStorage.getItem(TOKEN_KEY);
    if (t) {
      void loadInvoices(t);
      void loadUploads(t);
      void loadNotifs(t);
    }
  }, [phase, loadInvoices, loadUploads, loadNotifs]);

  /** Unggah berkas persyaratan (Portal v2). */
  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = window.sessionStorage.getItem(TOKEN_KEY);
    if (!token || !docFile || !docName.trim()) return;
    setUploading(true);
    setUploadError(null);
    setUploadOk(null);
    try {
      const fd = new FormData();
      fd.append("action", "upload");
      fd.append("token", token);
      fd.append("docName", docName.trim());
      fd.append("file", docFile);
      const res = await fetch("/api/portal", { method: "POST", body: fd });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (res.ok && data?.ok) {
        setUploadOk(
          `"${docFile.name}" terkirim — menunggu verifikasi tim (biasanya ≤ 48 jam kerja).`
        );
        setDocName("");
        setDocFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        void loadUploads(token);
        void loadNotifs(token);
      } else {
        setUploadError(
          data?.message ?? "Unggahan gagal — periksa tipe & ukuran berkas lalu coba lagi."
        );
      }
    } catch {
      setUploadError("Sinyal terputus — periksa koneksi lalu coba lagi.");
    } finally {
      setUploading(false);
    }
  }

  /** Unduh berkas milik sendiri via sesi portal. */
  function downloadDoc(id: string) {
    const t = window.sessionStorage.getItem(TOKEN_KEY);
    if (!t) return;
    window.open(
      `/api/portal?doc=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`,
      "_blank",
      "noopener"
    );
  }

  /** Hapus berkas milik sendiri (hanya yang belum diverifikasi). */
  async function removeDoc(id: string) {
    const token = window.sessionStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "doc-remove", token, id }),
      });
      if (res.ok) void loadUploads(token);
    } catch {
      // diam — tombol tetap bisa dicoba lagi
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ticket.trim() || !email.trim()) return;
    setPhase("loading");
    setError(null);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", ticket: ticket.trim(), email: email.trim() }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        token?: string;
        case?: PortalCase;
        message?: string;
      };
      if (res.ok && data.ok && data.token && data.case) {
        window.sessionStorage.setItem(TOKEN_KEY, data.token);
        setCaseData(data.case);
        setPhase("open");
        return;
      }
      setError(
        data.message ??
          "Kombinasi tiket dan email tidak dikenal. Hubungi tim kami bila Anda lupa detail tiket."
      );
      setPhase("locked");
    } catch {
      setError("Sinyal terputus — periksa koneksi lalu coba lagi.");
      setPhase("locked");
    }
  }

  function logout() {
    window.sessionStorage.removeItem(TOKEN_KEY);
    setCaseData(null);
    setTicket("");
    setEmail("");
    setError(null);
    setPhase("locked");
    setInvoices(null);
    setUploads(null);
    setNotifs(null);
    setNotifTransport(null);
    setDocName("");
    setDocFile(null);
    setUploadError(null);
    setUploadOk(null);
  }

  return (
    <section className="noise-overlay relative overflow-hidden bg-zinc-950 text-white">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[26rem] w-[46rem] -translate-x-1/2 rounded-full bg-violet-600/25 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-indigo-600/20 blur-[110px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-24 pt-32 sm:pt-36">
        {/* ══ GERBANG LOGIN ══════════════════════════════════════════ */}
        {phase !== "open" && (
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto flex max-w-xl flex-col items-center text-center"
          >
            <span className="inline-flex items-center gap-2.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-violet-300">
              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
              Portal Klien
            </span>

            <h1 className="mt-7 font-display text-4xl font-black leading-[1.06] tracking-tight sm:text-5xl">
              <span className="bg-gradient-to-r from-violet-300 via-indigo-300 to-blue-300 bg-clip-text text-transparent">
                Dasbor Kasus Anda
              </span>
            </h1>
            <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-zinc-400">
              Masuk dengan <strong className="text-zinc-200">nomor tiket</strong> dan{" "}
              <strong className="text-zinc-200">email</strong> yang Anda pakai saat mengirim
              brief — pantau progres penanganan izin Anda kapan pun, tanpa perlu bertanya.
            </p>

            <motion.div
              initial={false}
              animate={error ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
              transition={{ duration: 0.45 }}
              className="mt-9 w-full rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl sm:p-8"
            >
              <div className="flex flex-col items-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 shadow-[0_14px_44px_-10px_rgba(139,92,246,0.55)]">
                  <Lock className="h-6 w-6" aria-hidden="true" />
                </span>
                <h2 className="mt-4 font-display text-lg font-bold tracking-wide">
                  Masuk ke Portal
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-zinc-500">
                  Nomor tiket terbit otomatis setiap kali Anda mengirim brief
                  (contoh: <span className="font-mono text-zinc-400">TOP-MXXXXXXX</span>).
                </p>
              </div>

              <form onSubmit={onSubmit} className="mt-6 space-y-3.5">
                <div>
                  <label htmlFor="portal-ticket" className="sr-only">
                    Nomor tiket
                  </label>
                  <input
                    id="portal-ticket"
                    value={ticket}
                    onChange={(e) => setTicket(e.target.value)}
                    placeholder="TOP-XXXXXX"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Nomor tiket Anda"
                    className="h-12 w-full rounded-xl border border-white/10 bg-zinc-900/80 px-4 text-center font-mono text-sm font-semibold uppercase tracking-[0.2em] text-white placeholder:text-zinc-600 outline-none transition-all focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/25"
                  />
                </div>
                <div>
                  <label htmlFor="portal-email" className="sr-only">
                    Email
                  </label>
                  <input
                    id="portal-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@perusahaananda.com"
                    autoComplete="email"
                    aria-label="Email Anda"
                    className="h-12 w-full rounded-xl border border-white/10 bg-zinc-900/80 px-4 text-center text-sm font-medium text-white placeholder:text-zinc-600 outline-none transition-all focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/25"
                  />
                </div>
                <button
                  type="submit"
                  disabled={phase === "loading" || !ticket.trim() || !email.trim()}
                  className="shine inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-600 px-7 text-sm font-bold text-white shadow-[0_14px_44px_-10px_rgba(139,92,246,0.5)] transition-transform duration-300 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {phase === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Memverifikasi…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Buka Dasbor Saya
                    </>
                  )}
                </button>
                {error && (
                  <p role="alert" className="text-center text-[12.5px] font-medium leading-relaxed text-red-400">
                    {error}
                  </p>
                )}
              </form>

              <div className="mt-6 rounded-2xl border border-white/[0.07] bg-zinc-900/60 p-4 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Coba portal (demo)
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 font-mono text-[12px] text-zinc-300">
                  <button
                    type="button"
                    onClick={() => {
                      setTicket("TOP-DEMO2026");
                      setEmail("demo@pusatperizinan.com");
                    }}
                    className="rounded-lg border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 font-semibold text-violet-300 transition-colors hover:bg-violet-500/20"
                  >
                    TOP-DEMO2026
                  </button>
                  <span className="text-zinc-600">+</span>
                  <span className="rounded-lg border border-white/10 px-3 py-1.5">demo@pusatperizinan.com</span>
                </div>
              </div>
            </motion.div>

            <p className="mt-8 text-[12.5px] text-zinc-500">
              Belum punya tiket?{" "}
              <Link to="/contact" className="font-semibold text-violet-300 transition-colors hover:text-violet-200">
                Kirim brief pertama Anda
              </Link>{" "}
              — tiket terbit otomatis.
            </p>
          </motion.div>
        )}

        {/* ══ DASBOR ═════════════════════════════════════════════════ */}
        {phase === "open" && caseData && (
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header dasbor */}
            <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
                    Sesi Aktif
                  </span>
                  {caseData.source === "demo" && (
                    <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                      Data Demo
                    </span>
                  )}
                </div>
                <h1 className="mt-4 font-display text-3xl font-black tracking-tight sm:text-4xl">
                  Selamat datang,{" "}
                  <span className="bg-gradient-to-r from-violet-300 via-indigo-300 to-blue-300 bg-clip-text text-transparent">
                    {caseData.name.split(" ")[0]}
                  </span>
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-zinc-400">
                  <span className="font-mono font-semibold text-violet-300">{caseData.ticket}</span>
                  {caseData.company && <span>{caseData.company}</span>}
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    Sejak {fmtDate(caseData.createdAt)}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const t = window.sessionStorage.getItem(TOKEN_KEY);
                    if (t) {
                      void loadCase(t);
                      void loadInvoices(t);
                      void loadUploads(t);
                      void loadNotifs(t);
                    }
                  }}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-[12.5px] font-semibold text-zinc-300 transition-colors hover:border-violet-400/40 hover:text-violet-300 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
                  Muat Ulang
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-[12.5px] font-semibold text-zinc-400 transition-colors hover:border-red-400/40 hover:text-red-300"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  Keluar
                </button>
              </div>
            </div>

            {/* Ringkasan status + progress */}
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
                    Layanan berjalan
                  </p>
                  <p className="mt-1.5 font-display text-xl font-bold text-white sm:text-2xl">
                    {caseData.service}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
                    Tahap {caseData.stage} dari 6
                  </p>
                  <p className="mt-1.5 font-display text-xl font-bold text-emerald-300">
                    {caseData.stageLabel}
                  </p>
                </div>
              </div>
              <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${caseData.progress}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500"
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11.5px] text-zinc-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  Pembaruan terakhir: {fmtDate(caseData.updatedAt)}
                </span>
                <span className="font-mono font-semibold text-violet-300">{caseData.progress}%</span>
              </div>
              {caseData.note && (
                <div className="mt-5 rounded-2xl border border-violet-400/20 bg-violet-500/[0.08] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">
                    Catatan tim penanganan
                  </p>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-zinc-300">{caseData.note}</p>
                </div>
              )}
            </div>

            {/* Grid: timeline + kartu samping */}
            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              {/* Kolom kiri: timeline + kabar email */}
              <div className="flex flex-col gap-6">
              {/* Timeline */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
                <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-wide">
                  <Clock3 className="h-4.5 w-4.5 text-violet-300" aria-hidden="true" />
                  Timeline Penanganan
                </h2>
                <ol className="mt-7 space-y-0">
                  {caseData.timeline.map((t, i) => (
                    <li key={t.index} className="relative flex gap-4 pb-7 last:pb-0">
                      {/* garis penghubung */}
                      {i < caseData.timeline.length - 1 && (
                        <span
                          aria-hidden="true"
                          className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px ${
                            t.state === "done" ? "bg-emerald-400/50" : "bg-white/10"
                          }`}
                        />
                      )}
                      <span
                        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                          t.state === "done"
                            ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                            : t.state === "active"
                              ? "border-violet-400/50 bg-violet-500/20 text-violet-300"
                              : "border-white/10 bg-zinc-900 text-zinc-600"
                        }`}
                      >
                        {t.state === "done" ? (
                          <Check className="h-4 w-4" aria-hidden="true" />
                        ) : t.state === "active" ? (
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-300" />
                          </span>
                        ) : (
                          <Circle className="h-3 w-3" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`text-[14.5px] font-bold ${
                            t.state === "pending" ? "text-zinc-500" : "text-white"
                          }`}
                        >
                          {t.label}
                          {t.state === "active" && (
                            <span className="ml-2.5 rounded-full bg-violet-500/20 px-2.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300">
                              Sedang berjalan
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-400">{t.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Kabar Email — Portal v2: riwayat notifikasi status */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
                <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-wide">
                  <Mail className="h-4.5 w-4.5 text-violet-300" aria-hidden="true" />
                  Kabar Email
                </h2>
                <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">
                  Setiap perubahan penting kasus Anda — tahap, dokumen, tagihan — dikirim
                  sebagai email status ke alamat Anda dan tercatat di sini.
                </p>
                {notifs === null ? (
                  <p className="mt-4 text-[12.5px] leading-relaxed text-zinc-500">
                    Riwayat kabar belum dapat dimuat untuk sesi ini.
                  </p>
                ) : notifs.length === 0 ? (
                  <p className="mt-4 text-[12.5px] leading-relaxed text-zinc-500">
                    Belum ada kabar email untuk kasus ini. Kabar pertama terbit saat tim
                    memutakhirkan status penanganan Anda.
                  </p>
                ) : (
                  <ul className="mt-5 space-y-3.5">
                    {notifs.map((n) => {
                      const kind = NOTIF_KIND_UI[n.kind] ?? { label: "Kabar", icon: Mail };
                      const st = NOTIF_STATUS_UI[n.status];
                      const KindIcon = kind.icon;
                      return (
                        <li key={n.id} className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/10 text-violet-300">
                            <KindIcon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <p className="text-[12.5px] font-bold text-zinc-100">{kind.label}</p>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em] ${st.cls}`}
                              >
                                {st.label}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-400">{n.subject}</p>
                            <p className="mt-0.5 text-[11px] text-zinc-600">{fmtDate(n.createdAt)}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {notifTransport === "outbox" && notifs !== null && notifs.length > 0 && (
                  <p className="mt-5 rounded-xl border border-white/[0.07] bg-zinc-900/60 p-3 text-[11px] leading-relaxed text-zinc-500">
                    Mode antrean aktif: pengiriman email nyata menunggu kredensial pengirim
                    resmi dipasang. Seluruh kabar tetap tercatat dan dapat dibaca di sini.
                  </p>
                )}
              </div>
              </div>

              {/* Kolom kartu */}
              <div className="flex flex-col gap-6">
                {/* Dokumen — Portal v2: unggah berkas + status verifikasi */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-7">
                  <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-wide">
                    <FileCheck2 className="h-4.5 w-4.5 text-violet-300" aria-hidden="true" />
                    Dokumen Kasus
                  </h2>

                  {/* Form unggah berkas persyaratan */}
                  <form
                    onSubmit={onUpload}
                    className="mt-5 space-y-3 rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] p-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">
                      Unggah berkas persyaratan
                    </p>
                    <div>
                      <label htmlFor="doc-kind" className="sr-only">
                        Jenis dokumen
                      </label>
                      <select
                        id="doc-kind"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        aria-label="Jenis dokumen yang diunggah"
                        className="h-11 w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3.5 text-[13px] font-medium text-white outline-none transition-all focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/25"
                      >
                        <option value="">Pilih jenis dokumen…</option>
                        {caseData.documents.map((d) => (
                          <option key={d.name} value={d.name}>
                            {d.name}
                            {d.required ? " (wajib)" : ""}
                          </option>
                        ))}
                        <option value="Dokumen lainnya">Dokumen lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="doc-file" className="sr-only">
                        Berkas
                      </label>
                      <input
                        ref={fileInputRef}
                        id="doc-file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                        onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                        aria-label="Berkas dokumen (maks 4 MB)"
                        className="w-full cursor-pointer rounded-xl border border-white/10 bg-zinc-900/80 px-3.5 py-2.5 text-[12px] text-zinc-300 outline-none transition-all file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-violet-500/20 file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-violet-200"
                      />
                      <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
                        PDF, JPG, PNG, WEBP, DOC, atau DOCX — maks 4 MB per berkas.
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={uploading || !docFile || !docName.trim()}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-[12.5px] font-bold text-white transition-transform duration-300 hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Mengunggah…
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" aria-hidden="true" />
                          Unggah Dokumen
                        </>
                      )}
                    </button>
                    {uploadError && (
                      <p role="alert" className="text-[12px] font-medium leading-relaxed text-red-400">
                        {uploadError}
                      </p>
                    )}
                    {uploadOk && (
                      <p className="text-[12px] font-medium leading-relaxed text-emerald-300">
                        {uploadOk}
                      </p>
                    )}
                  </form>

                  {/* Berkas terunggah + status verifikasi tim */}
                  {uploads === null ? (
                    <p className="mt-5 text-[12.5px] leading-relaxed text-zinc-500">
                      Daftar berkas belum dapat dimuat untuk sesi ini.
                    </p>
                  ) : uploads.length === 0 ? (
                    <p className="mt-5 text-[12.5px] leading-relaxed text-zinc-500">
                      Belum ada berkas terunggah. Berkas yang Anda kirim akan muncul di
                      sini beserta status verifikasinya.
                    </p>
                  ) : (
                    <ul className="mt-5 space-y-3">
                      {uploads.map((u) => {
                        const ui = DOC_STATUS_UI[u.status];
                        const StatusIcon = ui.icon;
                        return (
                          <li
                            key={u.id}
                            className="rounded-2xl border border-white/[0.07] bg-zinc-900/60 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-zinc-100">{u.name}</p>
                                <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-500">
                                  {u.filename} · {u.sizeLabel} · {fmtDate(u.createdAt)}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${ui.cls}`}
                              >
                                {ui.label}
                              </span>
                            </div>
                            {u.note && (
                              <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-relaxed text-zinc-400">
                                <StatusIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                {u.note}
                              </p>
                            )}
                            <div className="mt-2.5 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => downloadDoc(u.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-violet-400/40 hover:text-violet-300"
                              >
                                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                                Unduh
                              </button>
                              {u.status === "pending" && (
                                <button
                                  type="button"
                                  onClick={() => void removeDoc(u.id)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-zinc-400 transition-colors hover:border-red-400/40 hover:text-red-300"
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                  Hapus
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Checklist kebutuhan dokumen */}
                  <ul className="mt-6 space-y-3 border-t border-white/[0.07] pt-5">
                    {caseData.documents.map((d) => {
                      const verifiedUpload =
                        uploads?.some((u) => u.name === d.name && u.status === "verified") ?? false;
                      const done = d.done || verifiedUpload;
                      return (
                        <li key={d.name} className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                              done ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-500"
                            }`}
                          >
                            {done ? (
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <Circle className="h-3 w-3" aria-hidden="true" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className={`text-[13px] font-medium ${done ? "text-zinc-300" : "text-zinc-400"}`}>
                              {d.name}
                            </p>
                            <p className="text-[11px] text-zinc-600">
                              {done
                                ? "Diterima & terverifikasi"
                                : d.required
                                  ? "Wajib"
                                  : "Opsional"}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Tagihan & Pembayaran (Transaksi Penuh) */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-7">
                  <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-wide">
                    <Receipt className="h-4.5 w-4.5 text-violet-300" aria-hidden="true" />
                    Tagihan & Pembayaran
                  </h2>
                  {invoices === null ? (
                    <p className="mt-4 text-[12.5px] leading-relaxed text-zinc-500">
                      Riwayat tagihan belum dapat dimuat untuk sesi ini.
                    </p>
                  ) : invoices.length === 0 ? (
                    <p className="mt-4 text-[12.5px] leading-relaxed text-zinc-500">
                      Belum ada invoice untuk kasus ini. Tagihan resmi akan muncul otomatis di sini
                      begitu diterbitkan officer.
                    </p>
                  ) : (
                    <ul className="mt-5 space-y-3">
                      {invoices.map((inv) => {
                        const ui = INVOICE_STATUS_UI[inv.status];
                        return (
                          <li
                            key={inv.number}
                            className="rounded-2xl border border-white/[0.07] bg-zinc-900/60 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-mono text-[12.5px] font-semibold text-zinc-200">
                                {inv.number}
                              </span>
                              <span
                                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${ui.cls}`}
                              >
                                {ui.label}
                              </span>
                            </div>
                            <p className="mt-1.5 truncate text-[12px] text-zinc-400">{inv.service}</p>
                            <div className="mt-2.5 flex items-center justify-between gap-3">
                              <div>
                                <p className="font-display text-[15px] font-bold text-white">
                                  {inv.amountIdrFormatted}
                                </p>
                                {inv.isForeign && (
                                  <p className="text-[11px] text-zinc-500">
                                    {inv.amountFormatted} · {inv.currency ?? ""}
                                  </p>
                                )}
                              </div>
                              <Link
                                to={inv.url}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-400/30 bg-violet-500/10 px-3.5 py-2 text-[11.5px] font-bold text-violet-300 transition-colors hover:bg-violet-500/20"
                              >
                                Buka Invoice
                                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                              </Link>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Pembayaran QRIS */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-7">
                  <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-wide">
                    <QrCode className="h-4.5 w-4.5 text-violet-300" aria-hidden="true" />
                    Pembayaran QRIS
                  </h2>
                  <div className="mt-5 flex items-center gap-4">
                    <img
                      src={caseData.payment.qrisImage}
                      alt={`QRIS resmi ${caseData.payment.merchant}`}
                      width={900}
                      height={1267}
                      loading="lazy"
                      className="h-24 w-24 shrink-0 rounded-xl border-2 border-white/10 object-cover"
                    />
                    <div className="min-w-0 text-[12.5px] leading-relaxed text-zinc-400">
                      <p className="font-semibold text-zinc-200">{caseData.payment.merchant}</p>
                      <p className="font-mono text-[11.5px] text-zinc-500">NMID {caseData.payment.nmid}</p>
                      <p className="mt-1">Semua e-wallet & mobile banking diterima.</p>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2.5">
                    <a
                      href={caseData.payment.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-[12.5px] font-bold text-white transition-transform duration-300 hover:scale-[1.02] active:scale-95"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Kirim Bukti Bayar
                    </a>
                    <Link
                      to="/payment"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 text-[12.5px] font-semibold text-zinc-300 transition-colors hover:border-violet-400/40 hover:text-violet-300"
                    >
                      Halaman Bayar
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                {/* Officer */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-7">
                  <div className="flex items-center gap-2.5">
                    <BadgeCheck className="h-4.5 w-4.5 text-emerald-300" aria-hidden="true" />
                    <h2 className="font-display text-lg font-bold tracking-wide">{caseData.officer.name}</h2>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
                    Butuh pembaruan cepat atau ada perubahan data? Sambungan langsung ke
                    officer Anda — respons resmi kami ≤ 48 jam, via WhatsApp biasanya jauh
                    lebih cepat.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <a
                      href={caseData.officer.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2.5 text-[12.5px] font-bold text-emerald-300 transition-colors hover:bg-emerald-500/25"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Minta Update Status
                    </a>
                    <span className="inline-flex items-center rounded-full border border-white/10 px-4 py-2.5 font-mono text-[12px] text-zinc-400">
                      {caseData.officer.phone}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
