"use client";

/**
 * Halaman Penghargaan & Rekognisi — akreditasi nyata, keanggotaan, dan
 * standar mutu firma. Memakai aset foto asli dari /public/images.
 */

import Image from "next/image";
import {
  Award,
  BadgeCheck,
  Building,
  FileBadge,
  Globe2,
  Landmark,
  Medal,
  ScrollText,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Reveal } from "@/components/landing/motion";
import { CTABand, LinkButton, PageHero, StatBand } from "@/components/site/ui";

/* ------------------------------- Bukti lapangan ------------------------------- */

const PROOFS = [
  {
    src: "/images/penyerahan-ppiu-ashanty.jpg",
    alt: "Penyerahan sertifikat PPIU berbingkai kepada PT Ashanty Perdana Pratiwi",
    title: "Sertifikat PPIU — Penyerahan Resmi",
    tag: "Penyerahan",
    width: 1400,
    height: 1215,
  },
  {
    src: "/images/akreditasi-ppiu-ashanty.jpg",
    alt: "Tim gabungan merayakan akreditasi PPIU PT Ashanty Perdana Pratiwi",
    title: "Akreditasi PPIU — Ashanty Perdana Pratiwi",
    tag: "Akreditasi",
    width: 1280,
    height: 850,
  },
  {
    src: "/images/penyerahan-bpw-ashanty.jpg",
    alt: "Penyerahan sertifikat Biro Perjalanan Wisata kepada PT Ashanty Perdana Pratiwi",
    title: "Sertifikat Biro Perjalanan Wisata",
    tag: "Penyerahan",
    width: 1400,
    height: 1050,
  },
  {
    src: "/images/akreditasi-kanwil-jatim.jpg",
    alt: "Sidang akreditasi bersama Kanwil Kementerian Agama Jawa Timur",
    title: "Akreditasi Kanwil Kemenag Jawa Timur",
    tag: "Akreditasi",
    width: 1400,
    height: 950,
  },
  {
    src: "/images/akreditasi-ppiu-riff.jpg",
    alt: "Riffy Group resmi terakreditasi PPIU bersama tim TOP Konsultan",
    title: "Akreditasi PPIU — Riff Religi Travelindo",
    tag: "Akreditasi",
    width: 1280,
    height: 960,
  },
] as const;

/* --------------------------- Pengakuan & keanggotaan --------------------------- */

const RECOGNITIONS = [
  {
    icon: Landmark,
    title: "Berhadapan dengan 23 Instansi Resmi",
    text: "Kemenkumham, BKPM, Kemenkeu, Kemendag, BPOM, OJK, Kemenag, BSN, Komdigi — logo instansi yang kami hadapi langsung setiap hari, bukan sekadar daftar di brosur.",
  },
  {
    icon: FileBadge,
    title: "Standardisasi Nasional & Internasional",
    text: "Klien kami dituntaskan hingga bergelar resmi: SNI, ISO, BPOM, halal BPJPH, akreditasi KAN/BNSP, dan standar IATA — diterima regulator, diakui pasar.",
  },
  {
    icon: Building,
    title: "Keanggotaan IPHI Pusat",
    text: "Perwakilan resmi di Sekretariat Ikatan Penasihat Hukum Indonesia — jaringan penasihat hukum berstandar yang menopang setiap pendampingan hukum kami.",
  },
  {
    icon: Globe2,
    title: "Dipercaya Lintas Batas",
    text: "Penugasan menjangkau 190 negara dengan 195 bahasa layanan — dari UMKM Tasikmalaya hingga korporasi yang melantai di bursa mancanegara.",
  },
] as const;

const STANDARDS = [
  {
    icon: ShieldCheck,
    title: "Jaminan 48 Jam",
    text: "Wawasan pertama substantif dalam 48 jam — tertulis di setiap kontrak sejak 2001.",
  },
  {
    icon: ScrollText,
    title: "Piagam Firma",
    text: "Tujuh pasal yang mengikat: dari kebenaran di atas kenyamanan hingga eksekusi sampai tuntas.",
  },
  {
    icon: Medal,
    title: "Rekor 99,97%",
    text: "Tingkat keberhasilan penugasan sejak 2001 — angka yang kami jaga, bukan kami pujikan.",
  },
  {
    icon: Star,
    title: "12.000+ Penugasan",
    text: "Dari izin usaha pertama hingga mandat kedaulatan multi-tahun — semuanya berkas bernomor.",
  },
] as const;

/* --------------------------------- Halaman -------------------------------- */

export default function AwardsPage() {
  return (
    <>
      <PageHero
        eyebrow="Penghargaan & Rekognisi"
        title={
          <>
            Diakui Regulator, <span className="text-gradient-gold">Dipercaya Dunia.</span>
          </>
        }
        sub="Bagi kami, penghargaan tertinggi adalah dokumen resmi yang tertera di tangan klien — sertifikat, akreditasi, dan izin yang berdiri tegak di hadapan hukum."
        crumbs={[{ label: "Beranda", to: "/" }, { label: "Penghargaan & Rekognisi" }]}
        meta={["Dokumen nyata", "23 instansi", "Sejak 2001"]}
      >
        <LinkButton to="/results" withArrow>
          Lihat Studi Kasus
        </LinkButton>
        <LinkButton to="/contact" variant="ghost">
          Verifikasi Langsung
        </LinkButton>
      </PageHero>

      <StatBand
        className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"
        stats={[
          { value: "12.000+", label: "penugasan berdokumen" },
          { value: "99,97%", label: "tingkat keberhasilan" },
          { value: "23", label: "instansi resmi dihadapi" },
        ]}
      />

      {/* Bukti foto */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" aria-label="Galeri akreditasi dan penyerahan sertifikat">
        <Reveal>
          <h2 className="text-center font-display text-3xl font-bold text-slate-900 sm:text-4xl">
            Setiap Bingkai <span className="text-gradient-gold">Adalah Dokumen.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-slate-500 sm:text-base">
            Potret langsung dari medan: sidang akreditasi, penyerahan sertifikat berbingkai, dan tangan yang berjabat setelah izin resmi terbit.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROOFS.map((p, i) => (
            <Reveal key={p.src} delay={(i % 3) * 0.08} className="h-full">
              <figure className="glass group h-full overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:gold-ring">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-violet-700 backdrop-blur">
                    {p.tag}
                  </span>
                </div>
                <figcaption className="flex items-start gap-3 p-5">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" aria-hidden="true" />
                  <div>
                    <span className="block font-display text-sm font-bold text-slate-900">{p.title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-500">{p.alt}</span>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pengakuan */}
      <section className="border-t border-slate-200 bg-slate-50/60 py-20" aria-label="Pengakuan dan keanggotaan">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center font-display text-3xl font-bold text-slate-900 sm:text-4xl">
              Rekognisi yang <span className="text-gradient-gold">Bisa Diverifikasi.</span>
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {RECOGNITIONS.map((r, i) => (
              <Reveal key={r.title} delay={(i % 2) * 0.08} className="h-full">
                <article className="glass flex h-full gap-5 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:gold-ring sm:p-7">
                  <span className="inline-flex h-13 w-13 shrink-0 items-center justify-center rounded-xl border border-violet-300 bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600">
                    <r.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">{r.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{r.text}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Standar mutu */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" aria-label="Standar mutu firma">
        <Reveal>
          <div className="flex flex-col items-center text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-violet-300 bg-violet-50 text-violet-600">
              <Award className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
              Standar yang Kami <span className="text-gradient-gold">Paksakan pada Diri Sendiri.</span>
            </h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STANDARDS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08} className="h-full">
              <article className="glass h-full rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:gold-ring">
                <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-violet-300 bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600">
                  <s.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-display text-base font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{s.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.15}>
          <p className="mx-auto mt-10 max-w-3xl text-center text-sm leading-relaxed text-slate-500">
            Ingin memverifikasi penugasan atau akreditasi kami? Hubungi tim melalui halaman kontak —
            kami menunjukkan berkas, bukan brosur.
          </p>
        </Reveal>
      </section>

      <CTABand
        title={
          <>
            Jadikan perusahaan Anda <span className="text-gradient-gold">berikutnya.</span>
          </>
        }
        sub="Setiap sertifikat di galeri ini dimulai dari satu brief. Kirim milik Anda hari ini — wawasan pertama hadir dalam 48 jam."
      />
    </>
  );
}
