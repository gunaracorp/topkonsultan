"use client";

/**
 * /invoice — Invoice Online PT TOP KONSULTAN INTERNASIONAL.
 * ----------------------------------------------------------------------------
 * Transaksi Penuh (v2.4.0.0.0):
 *   - cari invoice dengan nomor + kunci akses (token privat per invoice)
 *   - dokumen invoice profesional: identitas, layanan, nominal multi-mata
 *     uang (asing ditampilkan bersama ekuivalen Rupiah)
 *   - QRIS DINAMIS: QR dengan nominal Rupiah tertanam — aplikasi pemindai
 *     mengisi nominal otomatis; QR statis resmi tetap tersedia
 *   - cetak / simpan PDF (tata letak cetak bersih), bagikan tautan,
 *     konfirmasi pembayaran satu-klik ke WhatsApp
 *
 * Demo permanen: INV-DEMO2026 · kunci DEMO
 */

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BadgeCheck,
  Copy,
  FileText,
  Globe2,
  Loader2,
  Lock,
  MessageCircle,
  Printer,
  Search,
  Share2,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useRoute } from "@/lib/router";
import { BRAND } from "@/data/brand";
import { RATES_REF_DATE } from "@/data/payment";

interface InvoicePayload {
  number: string;
  status: "unpaid" | "paid" | "void";
  ticket: string;
  clientName: string;
  clientEmail: string;
  service: string;
  currency: string;
  amount: number;
  amountIdr: number;
  amountFormatted: string;
  amountIdrFormatted: string;
  isForeign: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  source: string;
  viewToken: string;
  url: string;
  qris: { payload: string; svgUrl: string; staticImage: string; nmid: string; merchant: string };
  whatsappUrl: string;
  officer: { name: string; phone: string };
}

const STATUS_UI: Record<
  InvoicePayload["status"],
  { label: string; chip: string; dot: string }
> = {
  unpaid: {
    label: "Belum Dibayar",
    chip: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
  },
  paid: {
    label: "Lunas",
    chip: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
  },
  void: {
    label: "Dibatalkan",
    chip: "border-red-400/40 bg-red-500/10 text-red-300",
    dot: "bg-red-400",
  },
};

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(iso)
  );
}

function fmtDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function InvoicePage() {
  const route = useRoute();
  const [number, setNumber] = useState("");
  const [token, setToken] = useState("");
  const [invoice, setInvoice] = useState<InvoicePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"none" | "link" | "payload">("none");

  const load = useCallback(async (no: string, k: string) => {
    if (!no.trim() || !k.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "view", number: no.trim(), token: k.trim() }),
      });
      const data = (await res.json()) as { ok: boolean; invoice?: InvoicePayload; message?: string };
      if (res.ok && data.ok && data.invoice) {
        setInvoice(data.invoice);
      } else {
        setInvoice(null);
        setError(data.message ?? "Invoice tidak ditemukan — periksa nomor dan kunci akses.");
      }
    } catch {
      setError("Sinyal terputus — periksa koneksi lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* Muat otomatis dari tautan: /invoice?no=…&k=… */
  useEffect(() => {
    const no = route.query.get("no") ?? "";
    const k = route.query.get("k") ?? "";
    if (no && k) {
      setNumber(no);
      setToken(k);
      void load(no, k);
    }
  }, [route.query, load]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await load(number, token);
  }

  async function copy(kind: "link" | "payload") {
    if (!invoice) return;
    try {
      const text =
        kind === "link"
          ? `${window.location.origin}${invoice.url}`
          : invoice.qris.payload;
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied("none"), 1800);
    } catch {
      /* clipboard tidak tersedia */
    }
  }

  const st = invoice ? STATUS_UI[invoice.status] : null;

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

      {/* Tata letak cetak: hanya area invoice yang tercetak */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .invoice-print, .invoice-print * { visibility: visible !important; }
          .invoice-print {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            background: #fff !important;
            color: #0f172a !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-24 pt-32 sm:pt-36">
        {/* ══ GERBANG PENCARIAN ═══════════════════════════════════════ */}
        {!invoice && (
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto flex max-w-xl flex-col items-center text-center"
          >
            <span className="inline-flex items-center gap-2.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-violet-300">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Invoice Online
            </span>

            <h1 className="mt-7 font-display text-4xl font-black leading-[1.06] tracking-tight sm:text-5xl">
              <span className="bg-gradient-to-r from-violet-300 via-indigo-300 to-blue-300 bg-clip-text text-transparent">
                Tagihan Anda, Satu Tautan
              </span>
            </h1>
            <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-zinc-400">
              Masukkan <strong className="text-zinc-200">nomor invoice</strong> dan{" "}
              <strong className="text-zinc-200">kunci akses</strong> yang dikirim tim kami —
              lihat rincian, bayar via QRIS dengan nominal tertanam, unduh, atau cetak PDF.
            </p>

            <motion.div
              initial={false}
              animate={error ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
              transition={{ duration: 0.45 }}
              className="mt-9 w-full rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl sm:p-8"
            >
              <form onSubmit={onSubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="inv-number" className="sr-only">
                    Nomor invoice
                  </label>
                  <input
                    id="inv-number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="INV-2026-XXXXXX"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Nomor invoice Anda"
                    className="h-12 w-full rounded-xl border border-white/10 bg-zinc-900/80 px-4 text-center font-mono text-sm font-semibold uppercase tracking-[0.15em] text-white placeholder:text-zinc-600 outline-none transition-all focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/25"
                  />
                </div>
                <div>
                  <label htmlFor="inv-key" className="sr-only">
                    Kunci akses
                  </label>
                  <input
                    id="inv-key"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Kunci akses (dikirim bersama invoice)"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Kunci akses invoice"
                    className="h-12 w-full rounded-xl border border-white/10 bg-zinc-900/80 px-4 text-center font-mono text-sm font-medium text-white placeholder:text-zinc-600 outline-none transition-all focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/25"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !number.trim() || !token.trim()}
                  className="shine inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-600 px-7 text-sm font-bold text-white shadow-[0_14px_44px_-10px_rgba(139,92,246,0.5)] transition-transform duration-300 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Membuka…
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" aria-hidden="true" />
                      Buka Invoice
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
                  Coba invoice (demo)
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 font-mono text-[12px] text-zinc-300">
                  <button
                    type="button"
                    onClick={() => {
                      setNumber("INV-DEMO2026");
                      setToken("DEMO");
                      void load("INV-DEMO2026", "DEMO");
                    }}
                    className="rounded-lg border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 font-semibold text-violet-300 transition-colors hover:bg-violet-500/20"
                  >
                    INV-DEMO2026
                  </button>
                  <span className="text-zinc-600">+</span>
                  <span className="rounded-lg border border-white/10 px-3 py-1.5">DEMO</span>
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-zinc-500">
                  Belum punya invoice?{" "}
                  <a
                    href={`https://wa.me/${BRAND.whatsappIntl}?text=${encodeURIComponent(
                      "Halo PT TOP KONSULTAN INTERNASIONAL, saya ingin meminta invoice resmi untuk layanan saya."
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-violet-300 transition-colors hover:text-violet-200"
                  >
                    Minta officer menerbitkannya
                  </a>{" "}
                  — atau pantau dasbor{" "}
                  <Link to="/portal" className="font-semibold text-violet-300 hover:text-violet-200">
                    Portal Klien
                  </Link>
                  .
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ══ DOKUMEN INVOICE ═════════════════════════════════════════ */}
        {invoice && st && (
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="invoice-print rounded-3xl bg-white p-7 text-slate-900 shadow-2xl sm:p-10"
          >
            {/* Kepala dokumen */}
            <div className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-7">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 font-display text-sm font-black text-white">
                    TOP
                  </span>
                  <div>
                    <p className="font-display text-lg font-black uppercase leading-tight tracking-wide">
                      {BRAND.legal}
                    </p>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-violet-600">
                      {BRAND.domain}
                    </p>
                  </div>
                </div>
                <p className="mt-3 max-w-xs text-[11.5px] leading-relaxed text-slate-500">
                  {BRAND.addresses[2].value}
                </p>
                <p className="mt-1.5 text-[11.5px] text-slate-500">
                  {BRAND.phone} · {BRAND.email}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Invoice
                </p>
                <p className="mt-1 font-mono text-xl font-bold tracking-tight text-slate-900">
                  {invoice.number}
                </p>
                <span
                  className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${
                    invoice.status === "paid"
                      ? "border-emerald-500/30 bg-emerald-50 text-emerald-700"
                      : invoice.status === "void"
                        ? "border-red-500/30 bg-red-50 text-red-700"
                        : "border-amber-500/30 bg-amber-50 text-amber-700"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      invoice.status === "paid"
                        ? "bg-emerald-500"
                        : invoice.status === "void"
                          ? "bg-red-500"
                          : "bg-amber-500"
                    }`}
                    aria-hidden="true"
                  />
                  {st.label}
                </span>
                <p className="mt-3 text-[11.5px] text-slate-500">
                  Terbit {fmtDate(invoice.createdAt)}
                </p>
              </div>
            </div>

            {/* Ditagihkan kepada + rincian */}
            <div className="grid gap-7 py-7 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Ditagihkan kepada
                </p>
                <p className="mt-2.5 font-display text-lg font-bold text-slate-900">
                  {invoice.clientName}
                </p>
                <p className="text-[13px] text-slate-500">{invoice.clientEmail}</p>
                <p className="mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-[12px] font-semibold text-violet-700">
                  Tiket {invoice.ticket}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Untuk layanan
                </p>
                <p className="mt-2.5 font-display text-lg font-bold leading-snug text-slate-900">
                  {invoice.service}
                </p>
                {invoice.note && (
                  <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">{invoice.note}</p>
                )}
              </div>
            </div>

            {/* Nominal */}
            <div className="rounded-2xl bg-slate-50 p-6 sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                    Total tagihan
                  </p>
                  <p className="mt-2 font-display text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                    {invoice.amountIdrFormatted}
                  </p>
                  {invoice.isForeign && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500">
                      <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Diterbitkan dalam {invoice.currency} · {invoice.amountFormatted} — ekuivalen
                      Rupiah berdasarkan kurs referensi ({RATES_REF_DATE})
                    </p>
                  )}
                </div>
                <p className="text-[11.5px] leading-relaxed text-slate-400">
                  Pembaruan terakhir: {fmtDateTime(invoice.updatedAt)}
                </p>
              </div>
            </div>

            {/* Panel pembayaran QRIS — hanya untuk invoice aktif */}
            {invoice.status === "unpaid" && (
              <div className="no-print mt-7 rounded-2xl border-2 border-violet-100 bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 p-6 sm:p-7">
                <div className="grid items-center gap-7 sm:grid-cols-[auto_minmax(0,1fr)]">
                  <div className="mx-auto w-fit rounded-2xl bg-white p-4 shadow-lg">
                    <img
                      src={invoice.qris.svgUrl}
                      alt={`QRIS dinamis ${invoice.qris.merchant} — nominal ${invoice.amountIdrFormatted} tertanam, NMID ${invoice.qris.nmid}`}
                      width={512}
                      height={512}
                      className="h-44 w-44 sm:h-48 sm:w-48"
                    />
                    <p className="mt-2 text-center font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      {invoice.qris.merchant}
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-2 font-display text-lg font-bold text-slate-900">
                      <BadgeCheck className="h-5 w-5 text-violet-600" aria-hidden="true" />
                      Bayar tepat {invoice.amountIdrFormatted}
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                      QR di samping adalah <strong>QRIS dinamis</strong> — nominal{" "}
                      <strong>{invoice.amountIdrFormatted}</strong> dan referensi{" "}
                      <span className="font-mono text-[12px]">{invoice.number}</span> sudah
                      tertanam di dalamnya. Arahkan kamera aplikasi pembayaran apa pun (GoPay,
                      OVO, DANA, ShopeePay, seluruh mobile banking) — nominal terisi otomatis,
                      tanpa salah ketik.
                    </p>
                    <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
                      NMID resmi <span className="font-mono font-semibold">{invoice.qris.nmid}</span> ·
                      QR statis resmi tetap tersedia di{" "}
                      <Link to="/payment" className="font-semibold text-violet-600 hover:text-violet-500">
                        halaman pembayaran
                      </Link>
                      .
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <a
                        href={invoice.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-5 text-[12.5px] font-bold text-white transition-transform duration-300 hover:scale-[1.02] active:scale-95"
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        Konfirmasi Pembayaran
                      </a>
                      <button
                        type="button"
                        onClick={() => void copy("payload")}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[12.5px] font-semibold text-slate-600 transition-colors hover:border-violet-300 hover:text-violet-600"
                      >
                        <Copy className="h-4 w-4" aria-hidden="true" />
                        {copied === "payload" ? "Payload tersalin!" : "Salin Payload"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {invoice.status === "paid" && (
              <div className="mt-7 rounded-2xl border-2 border-emerald-100 bg-emerald-50 p-6">
                <p className="flex items-center gap-2 font-display text-lg font-bold text-emerald-800">
                  <BadgeCheck className="h-5 w-5" aria-hidden="true" />
                  Terbayar penuh — terima kasih
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-emerald-700">
                  Invoice ini telah ditandai LUNAS oleh {BRAND.legal}. Bukti resmi dikirim tim
                  keuangan; arsip digital tersimpan di{" "}
                  <Link to="/portal" className="font-semibold underline-offset-2 hover:underline">
                    Portal Klien
                  </Link>
                  Anda.
                </p>
              </div>
            )}

            {/* Bilah aksi */}
            <div className="no-print mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-[12.5px] font-bold text-white transition-transform duration-300 hover:scale-[1.02] active:scale-95"
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  Cetak / Simpan PDF
                </button>
                <button
                  type="button"
                  onClick={() => void copy("link")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[12.5px] font-semibold text-slate-600 transition-colors hover:border-violet-300 hover:text-violet-600"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  {copied === "link" ? "Tautan tersalin!" : "Bagikan Tautan"}
                </button>
              </div>
              <div className="flex items-center gap-4 text-[12px] text-slate-500">
                <Link to="/portal" className="inline-flex items-center gap-1.5 font-semibold text-violet-600 hover:text-violet-500">
                  Portal Klien
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <Link to="/payment" className="inline-flex items-center gap-1.5 font-semibold text-violet-600 hover:text-violet-500">
                  Halaman Pembayaran
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setInvoice(null);
                    setNumber("");
                    setToken("");
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1.5 font-semibold text-slate-400 transition-colors hover:text-slate-600"
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Tutup
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
