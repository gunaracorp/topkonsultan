"use client";

/**
 * Halaman Jaringan Global — kehadiran lintas benua, 190 negara, 195 bahasa.
 * Sumber data: HUBS (src/data/content.ts) — konsisten dengan globe di beranda.
 */

import {
  Building2,
  Globe2,
  Handshake,
  Languages,
  MapPin,
  Plane,
  Scale,
  ShieldCheck,
  Ship,
  Stamp,
  Users,
} from "lucide-react";
import { HUBS } from "@/data/content";
import { BRAND } from "@/data/brand";
import { Reveal } from "@/components/landing/motion";
import { CTABand, LinkButton, PageHero, StatBand } from "@/components/site/ui";

/* ------------------------------- Data meja regional ------------------------------- */

const REGIONS = [
  {
    region: "Asia-Pasifik",
    accent: "Markas Global",
    cities: ["Jakarta", "Singapore", "Tokyo", "Seoul", "Sydney"],
    timezone: "GMT+7 hingga GMT+11",
    focus: "Pusat komando firma: pendirian badan usaha, perizinan OSS RBA, BPOM, halal BPJPH, SNI — plus pintu masuk pasar ASEAN terbesar.",
  },
  {
    region: "EMEA",
    accent: "Eropa · Timur Tengah · Afrika",
    cities: ["Dubai", "London", "Frankfurt"],
    timezone: "GMT hingga GMT+4",
    focus: "Meja investor masuk (PMA), kepatuhan GDPR & CSRD, sertifikasi CE/UKCA, serta jembatan modal Eropa ke peluang Asia.",
  },
  {
    region: "Amerika",
    accent: "Utara & Selatan",
    cities: ["New York", "San Francisco"],
    timezone: "GMT-5 hingga GMT-8",
    focus: "Market entry dua arah: perusahaan AS masuk ke Asia Tenggara, dan korporasi Asia melantai serta berekspansi ke bursa Amerika.",
  },
] as const;

const CROSS_BORDER = [
  {
    icon: Building2,
    title: "Pendirian PT PMA",
    text: "Badan usaha penanaman modal asing dari nol — akta, NIB, izin, hingga rekening — tanpa Anda harus hadir di Indonesia.",
  },
  {
    icon: Stamp,
    title: "Market Entry 190 Negara",
    text: "Peta regulasi, struktur entitas, dan mitra lokal untuk negara tujuan mana pun — disusun dewan yang menguasai yurisdiksinya.",
  },
  {
    icon: Plane,
    title: "KITAS & Mobilitas Ekspat",
    text: "Izin tinggal terbatas, izin kerja, dan mobilitas keluarga ekspatriat — diurus sampai kartu di tangan.",
  },
  {
    icon: Ship,
    title: "Perdagangan & Bea Cukai",
    text: "Importir umum (API-U), merek bebas, HS code, dan sertifikat asal agar barang melintas batas tanpa terhambat.",
  },
  {
    icon: Scale,
    title: "Kepatuhan Lintas Yurisdiksi",
    text: "GDPR Eropa, CCPA California, OJK, hingga FATCA/CRS — satu peta kepatuhan yang berbicara semua bahasa regulator.",
  },
  {
    icon: Handshake,
    title: "Perjanjian & Negosiasi",
    text: "Joint venture, akuisisi, dan perjanjian distribusi lintas negara — dirancang pengacara yang menandatangani di tiga benua.",
  },
] as const;

const GUARANTEES = [
  {
    icon: Globe2,
    value: "190",
    label: "negara terjangkau",
    text: "Jaringan mitra dan dewan yang menguasai yurisdiksi negara tujuan Anda.",
  },
  {
    icon: Languages,
    value: "195",
    label: "bahasa diucapkan",
    text: "Oracle AI menjawab dalam bahasa pilihan Anda — dari Arab hingga Zulu.",
  },
  {
    icon: Users,
    value: "46",
    label: "dewan lintas benua",
    text: "Dewan yang bekerja sebagai satu organisme yang mengikuti matahari.",
  },
  {
    icon: ShieldCheck,
    value: "24/7",
    label: "matahari tak terbenam",
    text: "Saat kantor Jakarta tidur, meja London dan New York tetap terjaga.",
  },
] as const;

/* --------------------------------- Halaman -------------------------------- */

export default function GlobalPage() {
  return (
    <>
      <PageHero
        eyebrow="Jaringan Global"
        title={
          <>
            Dari Jakarta untuk <span className="text-gradient-gold">190 Negara.</span>
          </>
        }
        sub="Kantor pusat di Indonesia, meja regional di tiga benua, dan jaringan dewan-mitra yang mengikuti matahari. Di mana pun bisnis Anda bergerak — kami sudah memikirkan regulasinya lebih dulu."
        crumbs={[{ label: "Beranda", to: "/" }, { label: "Jaringan Global" }]}
        meta={["10 hub kota", "3 benua", "24/7/365"]}
      >
        <LinkButton to="/booking" withArrow>
          Jadwalkan Sesi Global Desk
        </LinkButton>
        <LinkButton to="/contact" variant="ghost">
          Hubungi Meja Regional
        </LinkButton>
      </PageHero>

      <StatBand
        className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"
        stats={[
          { value: "190", label: "negara terjangkau" },
          { value: "195", label: "bahasa layanan" },
          { value: "24/7", label: "dewan mengikuti matahari" },
        ]}
      />

      {/* Peta hub — daftar kota dari HUBS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" aria-label="Peta jaringan hub">
        <Reveal>
          <h2 className="text-center font-display text-3xl font-bold text-slate-900 sm:text-4xl">
            Sepuluh Hub, <span className="text-gradient-gold">Satu Organisme.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-slate-500 sm:text-base">
            Setiap hub diwakili dewan senior lokal — menguasai bahasa, regulasi, dan budaya bisnis kotanya.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <ul className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-3">
            {HUBS.map((h, i) => (
              <li key={h.name}>
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-500/60 hover:text-violet-700">
                  <MapPin className="h-3.5 w-3.5 text-violet-600" aria-hidden="true" />
                  {h.name}
                  {i === 0 ? (
                    <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white">
                      Markas
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* Meja regional */}
      <section className="border-t border-slate-200 bg-slate-50/60 py-20" aria-label="Meja regional">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center font-display text-3xl font-bold text-slate-900 sm:text-4xl">
              Tiga Meja Regional <span className="text-gradient-gold">yang Mengikuti Matahari.</span>
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {REGIONS.map((r, i) => (
              <Reveal key={r.region} delay={i * 0.1} className="h-full">
                <article className="glass flex h-full flex-col rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:gold-ring">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl font-bold text-slate-900">{r.region}</h3>
                    <span className="rounded-full border border-violet-300 bg-violet-50 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-violet-600">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">{r.accent}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {r.cities.map((c) => (
                      <li
                        key={c}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/60 px-3 py-1.5 text-xs font-medium text-slate-600"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden="true" />
                        {c}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-500">{r.focus}</p>
                  <p className="mt-5 border-t border-slate-200/80 pt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-900">
                    {r.timezone}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Layanan lintas batas */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" aria-label="Layanan lintas batas">
        <Reveal>
          <h2 className="text-center font-display text-3xl font-bold text-slate-900 sm:text-4xl">
            Melewati Batas Negara <span className="text-gradient-gold">Tanpa Tersandung.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-slate-500 sm:text-base">
            Enam jalur layanan lintas batas yang paling sering diminta klien internasional kami.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CROSS_BORDER.map((s, i) => (
            <Reveal key={s.title} delay={(i % 3) * 0.08} className="h-full">
              <article className="glass group h-full rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:gold-ring">
                <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-violet-300 bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                  <s.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-display text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Jaminan global */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8" aria-label="Jaminan jaringan global">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {GUARANTEES.map((g, i) => (
            <Reveal key={g.label} delay={i * 0.08} className="h-full">
              <div className="glass flex h-full flex-col items-center gap-2 rounded-2xl px-6 py-8 text-center">
                <g.icon className="h-6 w-6 text-violet-600" aria-hidden="true" />
                <span className="font-display text-3xl font-bold text-gradient-gold">{g.value}</span>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900">{g.label}</span>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{g.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.15}>
          <p className="mx-auto mt-10 max-w-3xl text-center text-sm leading-relaxed text-slate-500">
            Satu pintu di {BRAND.hq} — nomor WhatsApp{" "}
            <a
              href={BRAND.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-violet-600 underline decoration-violet-300 underline-offset-4 hover:text-violet-700"
            >
              {BRAND.phone}
            </a>{" "}
            aktif 24/7 — dan meja regional mana pun yang tersambung, Anda tetap berbicara dengan firma yang sama.
          </p>
        </Reveal>
      </section>

      <CTABand
        title={
          <>
            Batas negara bukan <span className="text-gradient-gold">batas kami.</span>
          </>
        }
        sub="Sampaikan negara tujuan ekspansi Anda — 46 dewan memetakan jalur regulasi, entitas, dan mitranya dalam wawasan pertama 48 jam."
      />
    </>
  );
}
