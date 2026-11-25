"use client";

/**
 * /payment — Pembayaran QRIS resmi PT TOP KONSULTAN INTERNASIONAL.
 * ----------------------------------------------------------------------------
 * Satu QRIS untuk semua: halaman pembayaran publik dengan QR resmi
 * PusatPerizinan.com (NMID ID1026629416698), kalkulator konfirmasi
 * pembayaran via WhatsApp, panduan 3 langkah, pratinjau QRIS DINAMIS
 * (nominal tertanam), dan konverter multi-mata uang (Transaksi Penuh).
 */

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Fingerprint,
  Globe2,
  Landmark,
  Lock,
  MessageCircle,
  QrCode,
  Receipt,
  ShieldCheck,
  Smartphone,
  UserRound,
  Wallet,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "@/lib/router";
import { BRAND } from "@/data/brand";
import {
  CURRENCIES,
  QRIS,
  QRIS_STEPS,
  QRIS_SUPPORTED_APPS,
  RATES_REF_DATE,
  buildPaymentWhatsAppUrl,
  convertToIdr,
  formatIdr,
  formatMoney,
} from "@/data/payment";
import { buildQrisDynamicPayload } from "@/lib/qris";

const SERVICE_OPTIONS = [
  "Pendirian PT / PT PMA",
  "NIB & OSS RBA",
  "Izin Edar BPOM",
  "Sertifikasi Halal BPJPH",
  "SNI & Tata Niaga",
  "KITAS / RPTKA",
  "PSE Komdigi",
  "ISO 9001 / 14001 / 45001",
  "Konsultasi Strategi Bisnis",
] as const;

function formatRupiah(v: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function PaymentPage() {
  const [service, setService] = useState<string>(SERVICE_OPTIONS[0]);
  const [customService, setCustomService] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [ticket, setTicket] = useState("");
  const [copied, setCopied] = useState(false);

  /* Transaksi Penuh — pratinjau QRIS dinamis */
  const [dynAmount, setDynAmount] = useState<number>(2_500_000);
  const dynPayload = useMemo(() => {
    try {
      return buildQrisDynamicPayload({
        amountIdr: dynAmount,
        reference: "TOPKONSULTANWEB",
        nmid: QRIS.nmid,
        merchantName: QRIS.merchant,
        city: "JAKARTA",
      });
    } catch {
      return null;
    }
  }, [dynAmount]);

  /* Transaksi Penuh — konverter multi-mata uang */
  const [convAmount, setConvAmount] = useState<number>(850);
  const [convCurrency, setConvCurrency] = useState<string>("USD");
  const convIdr = useMemo(
    () => (convAmount > 0 ? convertToIdr(convAmount, convCurrency) : 0),
    [convAmount, convCurrency]
  );

  const finalService = service === "__lainnya" ? customService : service;

  const waUrl = useMemo(
    () =>
      buildPaymentWhatsAppUrl({
        service: finalService,
        amount: amount > 0 ? amount : undefined,
        ticket,
        phoneIntl: BRAND.whatsappIntl,
      }),
    [finalService, amount, ticket]
  );

  async function copyNmid() {
    try {
      await navigator.clipboard.writeText(QRIS.nmid);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard tidak tersedia */
    }
  }

  return (
    <section className="relative overflow-hidden bg-slate-50 pb-24 pt-28 sm:pt-32">
      {/* dekorasi latar */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[52rem] -translate-x-1/2 rounded-full bg-violet-300/25 blur-[120px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-indigo-300/20 blur-[110px]" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2.5 rounded-full border border-violet-200 bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-700 shadow-sm">
            <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
            Pembayaran Resmi
          </span>
          <h1 className="mt-6 font-display text-4xl font-black leading-[1.08] tracking-tight text-slate-900 sm:text-5xl">
            Satu <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">QRIS</span> untuk
            <br className="hidden sm:block" /> Semua Pembayaran Anda
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-slate-600">
            Bayar layanan konsultasi & perizinan PT TOP KONSULTAN INTERNASIONAL dengan
            e-wallet atau mobile banking <strong>apa pun</strong> — QRIS kami menerima
            semuanya. Tanpa biaya tambahan, terverifikasi 24 jam.
          </p>
        </motion.div>

        {/* ── Grid utama: QRIS + form konfirmasi ────────────────────── */}
        <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* Kartu QRIS */}
          <motion.figure
            initial={{ opacity: 0, x: -22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="h-fit overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_-30px_rgba(76,29,149,0.25)]"
          >
            <div className="bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-600 px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-violet-100">
                QRIS — QR Code Standar
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-violet-100">
                Pembayaran Nasional
              </p>
            </div>
            <div className="bg-white p-6">
              <div className="mx-auto max-w-[340px] overflow-hidden rounded-2xl border-2 border-slate-100">
                <img
                  src={QRIS.image}
                  alt={QRIS.imageAlt}
                  width={900}
                  height={1267}
                  loading="eager"
                  className="h-auto w-full"
                />
              </div>
              <figcaption className="mt-5 text-center">
                <p className="font-display text-lg font-bold tracking-tight text-slate-900">
                  {QRIS.merchant}
                </p>
                <button
                  type="button"
                  onClick={copyNmid}
                  className="group mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 font-mono text-[12.5px] font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50"
                  title="Klik untuk salin NMID"
                >
                  NMID {QRIS.nmid}
                  {copied ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-violet-500" aria-hidden="true" />
                  )}
                </button>
                <p className="mt-3 text-[12px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  {QRIS.slogan} · Terminal {QRIS.terminalCode}
                </p>
              </figcaption>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <a
                  href={QRIS.image}
                  download="QRIS-PUSATPERIZINAN.jpg"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-700"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Unduh QR
                </a>
                <a
                  href={QRIS.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-700"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Cek NMID
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </div>
          </motion.figure>

          {/* Form konfirmasi pembayaran */}
          <motion.div
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="flex flex-col gap-6"
          >
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_20px_60px_-30px_rgba(76,29,149,0.2)] sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-[0_10px_30px_-8px_rgba(139,92,246,0.5)]">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold tracking-tight text-slate-900">
                    Konfirmasi Pembayaran
                  </h2>
                  <p className="text-[12.5px] text-slate-500">
                    Isi detail, bayar via QRIS, lalu kirim konfirmasi ke tim kami.
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-5">
                <div>
                  <label htmlFor="pay-service" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                    Layanan yang dibayar
                  </label>
                  <select
                    id="pay-service"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/20"
                  >
                    {SERVICE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="__lainnya">Lainnya (tulis sendiri)…</option>
                  </select>
                  {service === "__lainnya" && (
                    <input
                      value={customService}
                      onChange={(e) => setCustomService(e.target.value)}
                      placeholder="Tulis nama layanan…"
                      className="mt-2.5 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/20"
                    />
                  )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="pay-amount" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                      Nominal (opsional)
                    </label>
                    <input
                      id="pay-amount"
                      type="number"
                      min={0}
                      step={1000}
                      value={amount || ""}
                      onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="15000000"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/20"
                    />
                    <p className="mt-1.5 text-[12px] text-slate-400">
                      {amount > 0 ? formatRupiah(amount) : "Sesuai invoice / kesepakatan"}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="pay-ticket" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                      Nomor tiket (opsional)
                    </label>
                    <input
                      id="pay-ticket"
                      value={ticket}
                      onChange={(e) => setTicket(e.target.value)}
                      placeholder="TOP-XXXXXX"
                      spellCheck={false}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-mono text-sm font-semibold uppercase tracking-wide text-slate-800 outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                </div>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shine inline-flex h-13 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-[0_14px_44px_-10px_rgba(139,92,246,0.5)] transition-transform duration-300 hover:scale-[1.01] active:scale-95"
                >
                  <MessageCircle className="h-4.5 w-4.5" aria-hidden="true" />
                  Kirim Bukti Pembayaran via WhatsApp
                </a>
                <p className="text-center text-[12px] leading-relaxed text-slate-400">
                  Pesan konfirmasi terisi otomatis ke {BRAND.phone} — cukup lampirkan
                  screenshot bukti bayar Anda.
                </p>
              </div>
            </div>

            {/* Tiga langkah */}
            <div className="grid gap-4 sm:grid-cols-3">
              {QRIS_STEPS.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.2 + i * 0.08 }}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 font-display text-[13px] font-black text-violet-700">
                      {i + 1}
                    </span>
                    {i === 0 && <Smartphone className="h-4 w-4 text-slate-400" aria-hidden="true" />}
                    {i === 1 && <QrCode className="h-4 w-4 text-slate-400" aria-hidden="true" />}
                    {i === 2 && <BadgeCheck className="h-4 w-4 text-slate-400" aria-hidden="true" />}
                  </div>
                  <h3 className="mt-3 text-[13.5px] font-bold text-slate-800">{s.title}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Aplikasi yang didukung ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mt-16 rounded-3xl border border-slate-200 bg-white p-7 sm:p-9"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="flex items-center gap-3 font-display text-xl font-bold tracking-tight text-slate-900">
              <Wallet className="h-5 w-5 text-violet-600" aria-hidden="true" />
              Semua Aplikasi Pembayaran Indonesia Diterima
            </h2>
            <p className="text-[12.5px] text-slate-500">
              Jika aplikasi Anda punya logo QRIS — pasti bisa.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {QRIS_SUPPORTED_APPS.map((a) => (
              <span
                key={a.name}
                className="inline-flex items-baseline gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[13px] font-semibold text-slate-700"
              >
                {a.name}
                <span className="text-[11px] font-normal text-slate-400">{a.note}</span>
              </span>
            ))}
            <span className="inline-flex items-center rounded-full border border-dashed border-violet-300 bg-violet-50 px-4 py-2 text-[13px] font-semibold text-violet-700">
              + semua bank & e-wallet berlogo QRIS
            </span>
          </div>
        </motion.div>

        {/* ── Transaksi Penuh: QRIS dinamis + multi-mata uang + invoice ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mt-16 overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-7 sm:p-9"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="flex items-center gap-3 font-display text-xl font-bold tracking-tight text-slate-900">
              <Zap className="h-5 w-5 text-violet-600" aria-hidden="true" />
              Transaksi Penuh — Nominal Tertanam & Multi-Mata Uang
            </h2>
            <span className="rounded-full border border-violet-200 bg-white px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700">
              v2.4 · baru
            </span>
          </div>

          <div className="mt-7 grid gap-6 lg:grid-cols-3">
            {/* QRIS dinamis */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="flex items-center gap-2 text-[14px] font-bold text-slate-800">
                <QrCode className="h-4 w-4 text-violet-600" aria-hidden="true" />
                Coba QRIS Dinamis
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">
                Isi nominal — QR di bawah berubah seketika dengan nilai Rupiah tertanam di
                dalamnya. Beginilah QR yang tercantum di setiap invoice resmi kami.
              </p>
              <label htmlFor="dyn-amount" className="sr-only">
                Nominal Rupiah
              </label>
              <input
                id="dyn-amount"
                type="number"
                min={1000}
                step={500000}
                value={dynAmount || ""}
                onChange={(e) => setDynAmount(Math.max(0, Number(e.target.value) || 0))}
                className="mt-4 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/20"
              />
              <p className="mt-1.5 text-[12px] font-medium text-violet-700">
                {dynAmount > 0 ? formatIdr(dynAmount) : "Masukkan nominal (min. Rp 1.000)"}
              </p>
              <div className="mt-4 flex flex-1 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-4">
                {dynPayload && dynAmount >= 1000 ? (
                  <img
                    src={`/api/qris?payload=${encodeURIComponent(dynPayload)}`}
                    alt={`Pratinjau QRIS dinamis dengan nominal ${formatIdr(dynAmount)} tertanam`}
                    width={512}
                    height={512}
                    className="h-36 w-36 rounded-xl bg-white"
                  />
                ) : (
                  <p className="px-6 py-9 text-center text-[12px] text-slate-400">
                    QR muncul saat nominal ≥ Rp 1.000
                  </p>
                )}
              </div>
            </div>

            {/* Konverter multi-mata uang */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="flex items-center gap-2 text-[14px] font-bold text-slate-800">
                <Globe2 className="h-4 w-4 text-violet-600" aria-hidden="true" />
                Konverter untuk Klien Internasional
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">
                Tagihan Anda dalam {CURRENCIES.length - 1} mata uang utama, terbayar Rupiah via
                QRIS — satu kode, semua aplikasi.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="conv-currency" className="sr-only">
                    Mata uang
                  </label>
                  <select
                    id="conv-currency"
                    value={convCurrency}
                    onChange={(e) => setConvCurrency(e.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/20"
                  >
                    {CURRENCIES.filter((c) => c.code !== "IDR").map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="conv-amount" className="sr-only">
                    Nominal
                  </label>
                  <input
                    id="conv-amount"
                    type="number"
                    min={0}
                    value={convAmount || ""}
                    onChange={(e) => setConvAmount(Math.max(0, Number(e.target.value) || 0))}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-1 flex-col justify-center rounded-2xl border border-violet-100 bg-violet-50/60 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Ekuivalen QRIS
                </p>
                <p className="mt-1.5 font-display text-2xl font-black tracking-tight text-slate-900">
                  {formatIdr(convIdr)}
                </p>
                <p className="mt-1 text-[12px] text-slate-500">
                  {convAmount > 0 ? `${formatMoney(convAmount, convCurrency)} × kurs referensi` : "Masukkan nominal"}
                </p>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                Kurs referensi per {RATES_REF_DATE} — kurs final dikonfirmasi officer saat invoice
                diterbitkan.
              </p>
            </div>

            {/* Invoice online */}
            <div className="flex flex-col rounded-2xl border-2 border-violet-200 bg-white p-6">
              <h3 className="flex items-center gap-2 text-[14px] font-bold text-slate-800">
                <Receipt className="h-4 w-4 text-violet-600" aria-hidden="true" />
                Invoice Online Resmi
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">
                Setiap tagihan kami kini hadir sebagai dokumen digital: nomor invoice unik, kunci
                akses privat, QRIS dinamis dengan nominal tepat, hingga tombol cetak PDF.
              </p>
              <ul className="mt-4 space-y-2.5 text-[12.5px] text-slate-600">
                {[
                  "Nominal & referensi tertanam di QR — tanpa salah ketik",
                  `Diterbitkan dalam ${CURRENCIES.length} mata uang, dibayar Rupiah`,
                  "Status LUNAS diperbarui officer & tampil di Portal Klien",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-2.5 pt-5">
                <Link
                  to="/invoice?no=INV-DEMO2026&k=DEMO"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-[13px] font-bold text-white transition-transform duration-300 hover:scale-[1.02] active:scale-95"
                >
                  Lihat Contoh Invoice
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/invoice"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-700"
                >
                  Buka Invoice Saya
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Jaminan keamanan ──────────────────────────────────────── */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Fingerprint,
              title: "Merchant Terverifikasi",
              desc: `NMID ${QRIS.nmid} terdaftar resmi di ASPI — dana langsung masuk rekening resmi PT TOP KONSULTAN INTERNASIONAL.`,
            },
            {
              icon: Lock,
              title: "Tanpa Biaya Tambahan",
              desc: "QRIS standar nasional — Anda hanya membayar nilai tagihan, tanpa markup atau biaya tersembunyi.",
            },
            {
              icon: Landmark,
              title: "Bukti Transaksi Sah",
              desc: "Struk digital dari aplikasi Anda berlaku sebagai bukti pembayaran resmi untuk rekonsiliasi tim kami.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45 }}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-3.5 text-[14px] font-bold text-slate-800">{title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* ── CTA portal klien ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="mt-10 overflow-hidden rounded-3xl bg-zinc-950 px-7 py-10 text-center sm:px-10"
        >
          <span className="inline-flex items-center gap-2.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-violet-300">
            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
            Portal Klien
          </span>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
            Sudah punya nomor tiket <span className="font-mono text-violet-300">TOP-XXXXXX</span>?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-zinc-400">
            Pantau progres penanganan izin Anda secara real-time — timeline enam tahap,
            checklist dokumen, dan pembayaran — semuanya di satu dasbor.
          </p>
          <Link
            to="/portal"
            className="shine mt-7 inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-600 px-8 text-sm font-bold text-white shadow-[0_14px_44px_-10px_rgba(139,92,246,0.5)] transition-transform duration-300 hover:scale-[1.03] active:scale-95"
          >
            Buka Portal Klien
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
