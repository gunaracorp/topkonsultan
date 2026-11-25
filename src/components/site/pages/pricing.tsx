"use client";

/**
 * Halaman Paket & Model Kemitraan — bagaimana klien bekerja sama dengan firma.
 * Konsisten dengan FAQ: diagnostik berbiaya tetap → mandat penuh.
 */

import {
  BadgeCheck,
  CalendarClock,
  Compass,
  Crown,
  FileText,
  Gauge,
  Handshake,
  Infinity as InfinityIcon,
  Layers,
  LineChart,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Swords,
  Users,
  Zap,
} from "lucide-react";
import { Reveal } from "@/components/landing/motion";
import { CTABand, LinkButton, PageHero, StatBand } from "@/components/site/ui";

/* ------------------------------- Data model ------------------------------- */

const PACKAGES = [
  {
    icon: Compass,
    name: "Diagnostik Tetap",
    tag: "Titik masuk",
    duration: "5 hari kerja",
    desc: "Diagnostik berbiaya tetap yang mengurai satu masalah terfokus — dan berakhir dengan peta jalan bernama, bukan teaser.",
    features: [
      "Satu Dewan Pakar + satu Partner-in-Chief",
      "Diagnosa mendalam atas satu tantangan",
      "Peta jalan eksekusi 90 hari",
      "Sesi pembacaan hasil 60 menit",
      "Konversi mulus ke mandat bila dilanjutkan",
    ],
    cta: "Mulai dari Sini",
    highlight: false,
  },
  {
    icon: Layers,
    name: "Mandat Proyek",
    tag: "Paling diminati",
    duration: "4–12 minggu",
    desc: "Penugasan penuh Protokol Oracle: penghimpunan dewan, rekayasa opsi, dan eksekusi sampai lintasan keberhasilan terbukti di angka Anda.",
    features: [
      "2–6 Dewan Pakar sesuai kebutuhan",
      "5 fase Protokol Oracle lengkap",
      "War-game strategi & rencana cadangan",
      "Pendampingan perizinan tuntas (NIB–OJK)",
      "Serah terima dokumen & pelatihan tim internal",
    ],
    cta: "Ajukan Brief",
    highlight: true,
  },
  {
    icon: Gauge,
    name: "Retainer Pertumbuhan",
    tag: "Berjalan terus",
    duration: "Bulanan, 6+ bulan",
    desc: "Dewan yang berjaga setiap bulan: strategi berkelanjutan, war-game kuartalan, dan akses prioritas saat pasar bergerak.",
    features: [
      "Satu dewan tetap + mitra on-call",
      "War-game kuartalan bersama direksi",
      "Tinjauan regulasi & peluang tiap bulan",
      "Akses prioritas 46 dewan lintas bidang",
      "Laporan lintasan terukur setiap periode",
    ],
    cta: "Diskusikan Retainer",
    highlight: false,
  },
  {
    icon: Crown,
    name: "Mandat Kedaulatan",
    tag: "Enterprise VVIP",
    duration: "Multi-tahun",
    desc: "Kemitraan tertinggi firma: seluruh 46 dewan, Partner-in-Chief penuh waktu, dan akses Oracle di Member Lounge VVIP.",
    features: [
      "46 Dewan Pakar siaga penuh",
      "Partner-in-Chief khusus satu klien",
      "Akses Oracle AI 24/7 di lounge VVIP",
      "Prioritas absolut antrean penugasan",
      "Duta firma untuk mitra & regulator global",
    ],
    cta: "Ajukan Kandidatur",
    highlight: false,
  },
] as const;

const PRINCIPLES = [
  {
    icon: ReceiptText,
    title: "Biaya tetap, kejutan nol",
    text: "Setiap penawaran diikat angka tertulis sebelum eksekusi dimulai. Tidak ada biaya yang muncul di tengah jalan — birokrasi kejutan bukan layanan kami.",
  },
  {
    icon: LineChart,
    title: "Berbasis nilai, bukan jam",
    text: "Kami menghargaikan lintasan hasil yang Anda kejar, bukan jumlah jam konsultasi. Penugasan berakhir ketika hasil terbukti — bukan ketika jam habis.",
  },
  {
    icon: Handshake,
    title: "Diagnostik dulu, mandat kemudian",
    text: "Hampir semua klien memulai dari diagnostik berbiaya tetap. Anda melihat cara kami berpikir sebelum memutuskan seberapa jauh melangkah bersama kami.",
  },
  {
    icon: ShieldCheck,
    title: "Jaminan 48 jam",
    text: "Brief yang disampaikan dengan benar mendapat wawasan substantif pertama dalam 48 jam. Kami menulisnya di setiap kontrak — dan memenuhinya.",
  },
] as const;

const COMPARE_ROWS = [
  { label: "Dewan Pakar", values: ["1", "2–6", "1 tetap + on-call", "46"] },
  { label: "Durasi", values: ["5 hari kerja", "4–12 minggu", "6–12 bulan", "Multi-tahun"] },
  { label: "Wawasan pertama", values: ["≤ 48 jam", "≤ 48 jam", "≤ 48 jam", "≤ 24 jam"] },
  { label: "War-game", values: ["—", "1 siklus", "Kuartalan", "Atas permintaan"] },
  { label: "Oracle AI VVIP", values: ["—", "—", "—", "Termasuk"] },
  { label: "Serah terima dokumen", values: ["Peta jalan", "Lengkap + pelatihan", "Laporan berkala", "Kabinet khusus"] },
] as const;

/* --------------------------------- Halaman -------------------------------- */

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Model Kemitraan"
        title={
          <>
            Investasi yang <span className="text-gradient-gold">Terukur.</span>
          </>
        }
        sub="Empat cara bekerja bersama firma — dari diagnostik lima hari hingga mandat kedaulatan multi-tahun. Biaya diikat tertulis sebelum eksekusi; hasil dilaporkan sampai desimal terakhir."
        crumbs={[{ label: "Beranda", to: "/" }, { label: "Paket & Model Kemitraan" }]}
        meta={["Biaya tetap tertulis", "Berbasis nilai", "Tanpa biaya tersembunyi"]}
      >
        <LinkButton to="/booking" withArrow>
          Jadwalkan Sesi Diagnostik
        </LinkButton>
        <LinkButton to="/contact" variant="ghost">
          Minta Penawaran Resmi
        </LinkButton>
      </PageHero>

      <StatBand
        className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"
        stats={[
          { value: "4", label: "model kemitraan" },
          { value: "48 jam", label: "wawasan pertama" },
          { value: "100%", label: "biaya diikat tertulis" },
        ]}
      />

      {/* Kartu paket */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" aria-label="Empat model kemitraan">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PACKAGES.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08} className="h-full">
              <article
                className={`glass relative flex h-full flex-col rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1.5 ${
                  p.highlight
                    ? "border-2 border-violet-500 shadow-[0_24px_70px_-24px_rgba(124,58,237,0.45)]"
                    : "hover:gold-ring"
                }`}
              >
                {p.highlight ? (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-lg">
                    <Sparkles className="mr-1 inline h-3 w-3" aria-hidden="true" />
                    {p.tag}
                  </span>
                ) : (
                  <span className="absolute -top-3 left-6 rounded-full border border-violet-300 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">
                    {p.tag}
                  </span>
                )}

                <span className="mb-5 mt-2 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-violet-300 bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600">
                  <p.icon className="h-5 w-5" aria-hidden="true" />
                </span>

                <h2 className="font-display text-xl font-bold text-slate-900">{p.name}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-violet-600">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                  {p.duration}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{p.desc}</p>

                <ul className="mt-5 flex-1 space-y-2.5 border-t border-slate-200/80 pt-5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px] leading-snug text-slate-600">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {p.name === "Mandat Kedaulatan" ? (
                    <LinkButton to="/vvip" className="w-full">
                      {p.cta}
                    </LinkButton>
                  ) : (
                    <LinkButton
                      to={p.name === "Diagnostik Tetap" ? "/booking" : "/contact"}
                      variant={p.highlight ? "gold" : "ghost"}
                      className="w-full"
                    >
                      {p.cta}
                    </LinkButton>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Prinsip harga */}
      <section className="border-t border-slate-200 bg-slate-50/60 py-20" aria-label="Prinsip penetapan biaya">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center font-display text-3xl font-bold text-slate-900 sm:text-4xl">
              Cara Kami <span className="text-gradient-gold">Menghargaikan.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-slate-500 sm:text-base">
              Empat prinsip yang mengikat setiap penawaran — tertulis di Piagam Firma, ditegakkan di setiap kontrak.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08} className="h-full">
                <article className="glass h-full rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:gold-ring">
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-violet-300 bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600">
                    <p.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-base font-bold text-slate-900">{p.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{p.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tabel perbandingan */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8" aria-label="Perbandingan paket">
        <Reveal>
          <h2 className="text-center font-display text-3xl font-bold text-slate-900 sm:text-4xl">
            Bandingkan dalam <span className="text-gradient-gold">Satu Pandangan.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200 custom-scrollbar">
            <table className="w-full min-w-[720px] border-collapse bg-white text-sm">
              <caption className="sr-only">Perbandingan empat model kemitraan TOP Konsultan Internasional</caption>
              <thead>
                <tr className="border-b border-slate-200 bg-gradient-to-r from-violet-50 to-indigo-50">
                  <th scope="col" className="px-5 py-4 text-left font-display text-xs font-bold uppercase tracking-[0.15em] text-slate-900">
                    <span className="inline-flex items-center gap-2">
                      <FileText className="h-4 w-4 text-violet-600" aria-hidden="true" />
                      Cakupan
                    </span>
                  </th>
                  {PACKAGES.map((p) => (
                    <th
                      key={p.name}
                      scope="col"
                      className={`px-5 py-4 text-left font-display text-xs font-bold uppercase tracking-[0.15em] ${
                        p.highlight ? "text-violet-700" : "text-slate-900"
                      }`}
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, ri) => (
                  <tr key={row.label} className={ri % 2 === 1 ? "bg-slate-50/70" : "bg-white"}>
                    <th scope="row" className="px-5 py-3.5 text-left font-semibold text-slate-700">
                      {row.label}
                    </th>
                    {row.values.map((v, vi) => (
                      <td
                        key={`${row.label}-${vi}`}
                        className={`px-5 py-3.5 ${PACKAGES[vi]?.highlight ? "bg-violet-50/50 font-semibold text-violet-700" : "text-slate-600"}`}
                      >
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* Jaminan */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8" aria-label="Jaminan firma">
        <Reveal>
          <div className="grid gap-5 rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-600/[0.07] to-transparent p-8 sm:grid-cols-3 sm:p-10">
            <div className="flex items-start gap-3.5">
              <Zap className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" aria-hidden="true" />
              <p className="text-[13px] leading-relaxed text-slate-600">
                <span className="block font-bold text-slate-900">Respons cepat</span>
                Brief dijawab wawasan pertama ≤ 48 jam — tertulis di kontrak.
              </p>
            </div>
            <div className="flex items-start gap-3.5">
              <Swords className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" aria-hidden="true" />
              <p className="text-[13px] leading-relaxed text-slate-600">
                <span className="block font-bold text-slate-900">War-game</span>
                Setiap mandat diuji dari 46 arah sebelum dieksekusi.
              </p>
            </div>
            <div className="flex items-start gap-3.5">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" aria-hidden="true" />
              <p className="text-[13px] leading-relaxed text-slate-600">
                <span className="block font-bold text-slate-900">Satu penanggung jawab</span>
                Partner-in-Chief bernama menjawab dari hulu ke hilir.
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
            <InfinityIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Angka final selalu tertulis dalam penawaran resmi — menyesuaikan lingkup, urgensi, dan kompleksitas penugasan Anda.
          </p>
        </Reveal>
      </section>

      <CTABand
        title={
          <>
            Brief Anda menentukan <span className="text-gradient-gold">modelnya.</span>
          </>
        }
        sub="Ceritakan tantangan Anda — kami balas dalam 48 jam dengan rekomendasi model kemitraan yang paling efisien, bukan yang paling mahal."
      />
    </>
  );
}
