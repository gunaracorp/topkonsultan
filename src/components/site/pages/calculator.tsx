"use client";

/**
 * Halaman Kalkulator Biaya Perizinan (v2.5.0.0.0 — "Konversi & Konten").
 * ----------------------------------------------------------------------------
 * Tiga langkah: kategori → layanan → kecepatan. Estimasi dihitung di sisi
 * klien dari src/data/calculator.ts (tanpa API, berjalan di mana pun).
 * Setiap estimasi bersifat rentang awal jasa pendampingan — angka final
 * selalu dikunci dalam penawaran tertulis (prinsip "biaya tetap, kejutan nol").
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  Info,
  MessageCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  CALC_CATEGORIES,
  CALC_SERVICES,
  CALC_SPEEDS,
  calcServicesIn,
  estimateCalc,
  findCalcCategory,
  findCalcService,
  findCalcSpeed,
  formatRupiah,
} from "@/data/calculator";
import { BRAND } from "@/data/brand";
import { Reveal } from "@/components/landing/motion";
import { CTABand, LinkButton, PageHero } from "@/components/site/ui";
import { useToast } from "@/hooks/use-toast";

const FAQ_ITEMS = [
  {
    q: "Apakah estimasi ini sudah termasuk biaya resmi instansi?",
    a: "Tidak. Angka di kalkulator adalah jasa pendampingan TOP Konsultan. Biaya resmi — honor notaris, PNBP, tarif laboratorium, pungutan imigrasi — ditagihkan oleh instansi bersangkutan sesuai tarif resmi, dan kami rinci sejak penawaran pertama. Tidak ada biaya yang muncul di tengah jalan.",
  },
  {
    q: "Mengapa berbentuk rentang, bukan satu angka pasti?",
    a: "Karena dua kasus dengan KBLI yang sama bisa berbeda kompleksitasnya: jumlah direksi, riwayat badan usaha, kesiapan dokumen, dan lokasi. Rentang menghormati kenyataan itu. Setelah brief 30 menit, angka final dikunci tertulis — biasanya di paruh bawah rentang untuk berkas yang rapi.",
  },
  {
    q: "Apakah 'Prioritas Dewan' mempercepat keputusan instansi?",
    a: "Yang kami percepat adalah sisi yang sepenuhnya milik kami: penyiapan dokumen, kepatuhan format, dan koordinasi. Keputusan resmi tetap di tangan instansi — dan dalam pengalaman kami, berkas yang bersih sejak hari pertama adalah akselerator paling ampuh yang bisa dibeli siapa pun.",
  },
  {
    q: "Apakah estimasi ini mengikat secara hukum?",
    a: "Bukan penawaran mengikat — ia adalah titik awal perencanaan. Penawaran resmi, tertulis, dan mengikat diterbitkan gratis setelah sesi orientasi singkat bersama tim kami.",
  },
];

export default function CalculatorPage() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [catId, setCatId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [speedId, setSpeedId] = useState<string>("standar");
  const panelRef = useRef<HTMLDivElement>(null);

  const services = useMemo(() => (catId ? calcServicesIn(catId) : []), [catId]);
  const service = serviceId ? findCalcService(serviceId) : undefined;
  const category = service ? findCalcCategory(service.cat) : undefined;
  const speed = findCalcSpeed(speedId);
  const estimate = service ? estimateCalc(service, speed) : undefined;

  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  function pickCategory(id: string) {
    setCatId(id);
    setServiceId(null);
    setStep(2);
  }

  function pickService(id: string) {
    setServiceId(id);
    setStep(3);
  }

  function reset() {
    setStep(1);
    setCatId(null);
    setServiceId(null);
    setSpeedId("standar");
  }

  const summaryText = service && estimate && category
    ? [
        "Estimasi Kalkulator Biaya Perizinan — pusatperizinan.com",
        `• Layanan: ${service.name} (${category.name})`,
        `• Kecepatan penanganan: ${speed.name}`,
        `• Estimasi jasa pendampingan: Rp ${formatRupiah(estimate.feeMin)} – Rp ${formatRupiah(estimate.feeMax)}`,
        `• Estimasi durasi: ${estimate.daysMin}–${estimate.daysMax} hari kerja`,
        "",
        "Belum termasuk biaya resmi instansi. Angka final dikunci dalam penawaran tertulis.",
      ].join("\n")
    : "";

  const waText = service && estimate && category
    ? encodeURIComponent(
        [
          "Halo TOP Konsultan Internasional,",
          "",
          "Saya baru mencoba Kalkulator Biaya Perizinan di pusatperizinan.com.",
          "",
          `• Layanan: ${service.name} (${category.name})`,
          `• Kecepatan penanganan: ${speed.name}`,
          `• Estimasi jasa pendampingan: Rp ${formatRupiah(estimate.feeMin)} – Rp ${formatRupiah(estimate.feeMax)}`,
          `• Estimasi durasi: ${estimate.daysMin}–${estimate.daysMax} hari kerja`,
          "",
          "Mohon penawaran resmi untuk kasus saya. Terima kasih.",
        ].join("\n")
      )
    : "";

  async function copySummary() {
    if (!summaryText) return;
    try {
      await navigator.clipboard.writeText(summaryText);
      toast({
        title: "Ringkasan tersalin",
        description: "Tempelkan di catatan Anda atau kirim ke tim internal.",
      });
    } catch {
      toast({
        title: "Clipboard tertolak peramban",
        description: "Salin manual dari panel estimasi di layar Anda.",
      });
    }
  }

  const steps = [
    { n: 1, label: "Kategori" },
    { n: 2, label: "Layanan" },
    { n: 3, label: "Kecepatan & Estimasi" },
  ];

  return (
    <>
      <PageHero
        eyebrow="Perkakas Keputusan"
        title={
          <>
            Kalkulator <span className="text-gradient-gold">Biaya Perizinan.</span>
          </>
        }
        sub="Tiga ketukan menuju kejelasan anggaran: pilih kategori, pilih layanan, pilih kecepatan — dan dapatkan rentang biaya serta durasi penanganan seketika. Tanpa email, tanpa antre, tanpa komitmen."
        crumbs={[{ label: "Beranda", to: "/" }, { label: "Kalkulator Biaya" }]}
        meta={[`${CALC_SERVICES.length} layanan terkalkulasi`, "6 kategori perizinan", "Estimasi instan & privat"]}
      />

      <section
        ref={panelRef}
        className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-16 sm:px-6 lg:px-8"
        aria-label="Kalkulator biaya perizinan"
      >
        {/* Stepper */}
        <Reveal>
          <ol className="mb-8 flex items-center justify-center gap-2 sm:gap-4" aria-label="Langkah kalkulator">
            {steps.map((s, i) => {
              const done = step > s.n;
              const active = step === s.n;
              return (
                <li key={s.n} className="flex items-center gap-2 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => s.n < step && setStep(s.n)}
                    disabled={s.n > step}
                    className={`flex items-center gap-2.5 rounded-full border px-3.5 py-2 text-[12px] font-semibold transition-all sm:px-4 sm:text-[13px] ${
                      active
                        ? "border-violet-500 bg-violet-600/[0.07] text-violet-700"
                        : done
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                          : "border-slate-200 text-slate-400"
                    }`}
                    aria-current={active ? "step" : undefined}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                        active
                          ? "bg-violet-600 text-white"
                          : done
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : s.n}
                    </span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < steps.length - 1 && (
                    <span className={`h-px w-4 sm:w-10 ${step > s.n ? "bg-emerald-400" : "bg-slate-200"}`} aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ol>
        </Reveal>

        {/* LANGKAH 1 — Kategori */}
        {step === 1 && (
          <Reveal>
            <div>
              <h2 className="mb-1 text-center font-display text-xl font-bold text-slate-900 sm:text-2xl">
                Kebutuhan Anda masuk kategori mana?
              </h2>
              <p className="mb-8 text-center text-sm text-slate-500">
                Pilih satu — Anda bisa berganti kapan pun tanpa mengulang dari nol.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {CALC_CATEGORIES.map((c) => {
                  const count = calcServicesIn(c.id).length;
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => pickCategory(c.id)}
                      className="group flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-500/60 hover:shadow-[0_24px_60px_-24px_rgba(139,92,246,0.25)]"
                    >
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-[0_8px_20px_-8px_rgba(139,92,246,0.5)]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="font-display text-base font-bold text-slate-900">{c.name}</span>
                      <span className="flex-1 text-[13px] leading-relaxed text-slate-500">{c.desc}</span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">
                        {count} layanan
                        <ArrowRight
                          className="ml-1.5 inline h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Reveal>
        )}

        {/* LANGKAH 2 — Layanan */}
        {step === 2 && catId && (
          <Reveal>
            <div>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
                    {findCalcCategory(catId)?.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Pilih layanan yang paling mendekati kebutuhan Anda.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-600 transition-colors hover:border-violet-400/60 hover:text-violet-600"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Ganti kategori
                </button>
              </div>
              <div className="grid gap-3">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pickService(s.id)}
                    className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all duration-300 hover:border-violet-500/60 hover:shadow-[0_18px_50px_-22px_rgba(139,92,246,0.28)]"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 transition-colors group-hover:border-violet-500" aria-hidden="true">
                      <span className="h-2 w-2 rounded-full bg-transparent transition-colors group-hover:bg-violet-500" />
                    </span>
                    <span className="flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-[15px] font-bold text-slate-900">{s.name}</span>
                        {s.popular && (
                          <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                            Paling diminati
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-[13px] leading-relaxed text-slate-500">{s.desc}</span>
                      <span className="mt-2 block text-[12px] font-semibold text-violet-600">
                        Rp {formatRupiah(s.feeMin)} – Rp {formatRupiah(s.feeMax)}
                        <span className="ml-2 font-medium text-slate-400">± {s.daysMin}–{s.daysMax} hari kerja</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        )}

        {/* LANGKAH 3 — Kecepatan + Hasil */}
        {step === 3 && service && estimate && category && (
          <Reveal>
            <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
              {/* Kolom kiri: pilihan kecepatan */}
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-bold text-slate-900 sm:text-xl">Kecepatan penanganan</h2>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-600 transition-colors hover:border-violet-400/60 hover:text-violet-600"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    Ubah layanan
                  </button>
                </div>
                <div className="grid gap-3" role="radiogroup" aria-label="Kecepatan penanganan">
                  {CALC_SPEEDS.map((sp) => {
                    const active = sp.id === speedId;
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setSpeedId(sp.id)}
                        className={`rounded-2xl border p-5 text-left transition-all duration-300 ${
                          active
                            ? "border-violet-500 bg-violet-600/[0.06] shadow-[0_18px_50px_-24px_rgba(139,92,246,0.35)]"
                            : "border-slate-200 bg-white hover:border-violet-400/50"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="font-display text-[15px] font-bold text-slate-900">{sp.name}</span>
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                              active ? "border-violet-600" : "border-slate-300"
                            }`}
                            aria-hidden="true"
                          >
                            <span className={`h-2 w-2 rounded-full ${active ? "bg-violet-600" : "bg-transparent"}`} />
                          </span>
                        </span>
                        <span className="mt-1.5 block text-[13px] leading-relaxed text-slate-500">{sp.note}</span>
                        <span className="mt-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-violet-600">
                          {sp.mult === 1 ? "Biaya dasar" : `×${sp.mult.toString().replace(".", ",")} biaya dasar`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 transition-colors hover:text-violet-600"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Mulai ulang dari kategori
                </button>
              </div>

              {/* Kolom kanan: hasil */}
              <div className="relative overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-600/[0.07] via-white to-white p-7 sm:p-8">
                <div
                  className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black_20%,transparent_75%)]"
                  aria-hidden="true"
                />
                <div className="relative">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-violet-600">
                    Estimasi jasa pendampingan
                  </p>
                  <p className="mt-3 font-display text-[26px] font-extrabold leading-tight text-slate-900 sm:text-[32px]">
                    Rp {formatRupiah(estimate.feeMin)}
                    <span className="mx-1 text-violet-400">–</span>
                    <span className="text-gradient-gold">Rp {formatRupiah(estimate.feeMax)}</span>
                  </p>

                  <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Clock3 className="h-4 w-4 text-violet-600" aria-hidden="true" />
                    ± {estimate.daysMin}–{estimate.daysMax} hari kerja
                    <span className="font-medium text-slate-400">({speed.name})</span>
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-violet-300 bg-violet-600/[0.07] px-3.5 py-1.5 text-[11px] font-semibold text-violet-700">
                      {category.name}
                    </span>
                    <span className="rounded-full border border-slate-300/70 px-3.5 py-1.5 text-[11px] font-medium text-slate-600">
                      {service.name}
                    </span>
                  </div>

                  {service.govNote && (
                    <p className="mt-5 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white/80 p-3.5 text-[12px] leading-relaxed text-slate-600">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" aria-hidden="true" />
                      {service.govNote}
                    </p>
                  )}

                  <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
                    Estimasi awal jasa pendampingan untuk kasus berkas-normal — belum termasuk biaya resmi
                    instansi. Angka final dikunci tertulis setelah brief, tanpa biaya konsultasi awal.
                  </p>

                  <div className="mt-6 flex flex-col gap-3">
                    <a
                      href={`https://wa.me/${BRAND.whatsappIntl}?text=${waText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-600 px-6 py-3.5 text-[13px] font-bold text-white shadow-[0_10px_34px_-10px_rgba(139,92,246,0.55)] transition-transform duration-300 hover:scale-[1.02] active:scale-95"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Minta penawaran resmi via WhatsApp
                    </a>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <LinkButton to="/contact" withArrow className="flex-1">
                        Kirim brief lengkap
                      </LinkButton>
                      <button
                        type="button"
                        onClick={copySummary}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-[12px] font-semibold text-slate-700 transition-colors hover:border-violet-400/60 hover:text-violet-600"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        Salin ringkasan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        )}
      </section>

      {/* FAQ mini */}
      <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8" aria-label="Pertanyaan umum kalkulator">
        <Reveal>
          <h2 className="text-center font-display text-2xl font-bold text-slate-900 sm:text-3xl">
            Pertanyaan yang selalu <span className="text-gradient-gold">muncul.</span>
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {FAQ_ITEMS.map((f, i) => (
            <Reveal key={f.q} delay={(i % 2) * 0.08} className="h-full">
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-6">
                <p className="flex items-start gap-2.5 font-display text-[15px] font-bold text-slate-900">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" aria-hidden="true" />
                  {f.q}
                </p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-slate-600">{f.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.15}>
          <p className="mt-8 text-center text-[13px] text-slate-500">
            Butuh angka yang belum ada di daftar?{" "}
            <LinkButton to="/contact" variant="ghost">
              Tanyakan langsung — gratis
            </LinkButton>
          </p>
        </Reveal>
      </section>

      <CTABand />
    </>
  );
}
