"use client";

/**
 * Halaman Wawasan — blog dewan (v2.5: "Blog Wawasan Penuh").
 * ----------------------------------------------------------------------------
 * Pencarian instan + filter kategori, sepenuhnya di sisi klien. Kategori
 * awal bisa dibawa lewat URL: /insights?kategori=Regulasi (dipakai tautan
 * kategori pada halaman detail artikel).
 */

import Image from "next/image";
import { ArrowUpRight, CalendarDays, Clock3, Search, SearchX, X } from "lucide-react";
import { useMemo, useState } from "react";
import { INSIGHTS } from "@/data/insights";
import { useRoute } from "@/lib/router";
import { Reveal } from "@/components/landing/motion";
import { CTABand, LinkButton, PageHero } from "@/components/site/ui";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${iso}T00:00:00Z`));
  } catch {
    return iso;
  }
}

export default function InsightsPage() {
  const route = useRoute();
  const initialCat = route.query.get("kategori") ?? "Semua";
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState(initialCat);

  const categories = useMemo(
    () => ["Semua", ...Array.from(new Set(INSIGHTS.map((i) => i.category)))],
    []
  );

  const filterActive = query.trim().length > 0 || cat !== "Semua";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INSIGHTS.filter((i) => {
      if (cat !== "Semua" && i.category !== cat) return false;
      if (!q) return true;
      const hay = [i.title, i.excerpt, i.category, i.author.name, ...i.tags]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, cat]);

  const [featured, ...rest] = INSIGHTS;
  const gridItems = filterActive ? filtered : rest;

  return (
    <>
      <PageHero
        eyebrow="Wawasan"
        title={
          <>
            Wawasan dari <span className="text-gradient-gold">Ruang Dewan.</span>
          </>
        }
        sub="Putusan yang diterbitkan dari ruang dewan — penilaian yang sama dengan yang kami bawa ke setiap penugasan, kini dibuka untuk dunia. Strategi, regulasi, perizinan, dan kepatuhan: dibaca dari medan keputusan, bukan ruang redaksi."
        crumbs={[{ label: "Beranda", to: "/" }, { label: "Wawasan" }]}
        meta={[`${INSIGHTS.length} esai dewan`, `${categories.length - 1} kategori`, "Pencarian & filter instan"]}
      />

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8" aria-label="Semua wawasan">
        {/* Bilah pencarian & filter kategori */}
        <Reveal>
          <div className="flex flex-col gap-4">
            <div className="relative mx-auto w-full max-w-2xl">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari wawasan: PMA, halal, pajak, strategi…"
                aria-label="Cari wawasan"
                className="h-13 w-full rounded-full border border-slate-200 bg-white py-3.5 pl-11 pr-11 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-violet-500/60 focus:shadow-[0_10px_36px_-14px_rgba(139,92,246,0.35)]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Bersihkan pencarian"
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
            <div
              className="flex flex-wrap items-center justify-center gap-2"
              role="group"
              aria-label="Filter kategori wawasan"
            >
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  aria-pressed={cat === c}
                  className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition-all duration-300 ${
                    cat === c
                      ? "border-violet-600 bg-violet-600 text-white shadow-[0_8px_24px_-8px_rgba(139,92,246,0.5)]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-violet-400/60 hover:text-violet-600"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="text-center text-[12px] font-medium text-slate-400" aria-live="polite">
              {filterActive
                ? `${filtered.length} wawasan ditemukan${cat !== "Semua" ? ` dalam kategori ${cat}` : ""}`
                : `Menampilkan seluruh ${INSIGHTS.length} esai — terbaru lebih dulu`}
            </p>
          </div>
        </Reveal>

        {/* Sorotan utama — hanya saat tanpa filter */}
        {!filterActive && (
          <Reveal className="mt-6">
            <a
              href={`#/insights/${featured.slug}`}
              className="group relative grid overflow-hidden rounded-3xl border border-violet-200 bg-white transition-all duration-300 hover:border-violet-500/60 hover:shadow-[0_30px_80px_-30px_rgba(139,92,246,0.28)] lg:grid-cols-2"
              aria-label={`Baca: ${featured.title}`}
            >
              <div className="relative h-64 overflow-hidden lg:h-auto lg:min-h-[380px]">
                <Image
                  src={featured.cover}
                  alt={`Ilustrasi sampul untuk ${featured.title}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <span className="absolute left-5 top-5 rounded-full border border-violet-500/50 bg-white/80 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600 backdrop-blur">
                  Sorotan Utama
                </span>
              </div>
              <div className="flex flex-col justify-center gap-4 p-7 sm:p-10">
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-900">
                  <span className="text-violet-500">{featured.category}</span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatDate(featured.date)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                    {featured.readTime} mnt
                  </span>
                </p>
                <h2 className="font-display text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                  {featured.title}
                </h2>
                {featured.enTitle ? (
                  <p className="-mt-2 text-[12px] font-medium italic text-slate-900 sm:text-sm">
                    {featured.enTitle}
                  </p>
                ) : null}
                <p className="text-sm leading-relaxed text-slate-500 sm:text-base">{featured.excerpt}</p>
                <p className="text-[13px] text-slate-900">
                  <span className="font-semibold text-slate-600">{featured.author.name}</span> ·{" "}
                  {featured.author.role}
                </p>
                <span className="mt-2 inline-flex w-fit items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.18em] text-violet-600">
                  Baca wawasan
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </a>
          </Reveal>
        )}

        {/* Kisi artikel */}
        {gridItems.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {gridItems.map((ins, i) => (
              <Reveal key={ins.slug} delay={(i % 3) * 0.08} className="h-full">
                <a
                  href={`#/insights/${ins.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-500/50 hover:shadow-[0_24px_60px_-24px_rgba(139,92,246,0.22)]"
                  aria-label={`Baca: ${ins.title}`}
                >
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={ins.cover}
                      alt={`Ilustrasi sampul untuk ${ins.title}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute left-4 top-4 rounded-full border border-violet-500/50 bg-white/80 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-violet-600 backdrop-blur">
                      {ins.category}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3 w-3" aria-hidden="true" />
                        {formatDate(ins.date)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3 w-3" aria-hidden="true" />
                        {ins.readTime} mnt
                      </span>
                    </p>
                    <h2 className="mt-3 font-display text-lg font-bold leading-snug text-slate-900">
                      {ins.title}
                    </h2>
                    {ins.enTitle ? (
                      <p className="mt-1 text-[11px] italic text-slate-400">{ins.enTitle}</p>
                    ) : null}
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-900">{ins.excerpt}</p>
                    <span className="mt-4 text-[13px] text-slate-900">
                      <span className="font-semibold text-slate-600">{ins.author.name}</span>
                    </span>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal>
            <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center">
              <SearchX className="h-10 w-10 text-violet-400" aria-hidden="true" />
              <p className="font-display text-lg font-bold text-slate-900">
                Belum ada wawasan yang cocok.
              </p>
              <p className="max-w-md text-sm leading-relaxed text-slate-500">
                Coba kata kunci lain — atau kosongkan pencarian untuk melihat seluruh esai dewan.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCat("Semua");
                }}
                className="mt-1 rounded-full border border-slate-200 px-5 py-2.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-violet-400/60 hover:text-violet-600"
              >
                Reset pencarian & filter
              </button>
            </div>
          </Reveal>
        )}

        <Reveal delay={0.15}>
          <div className="mt-14 flex flex-col items-center gap-5 rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-600/[0.06] to-transparent p-8 text-center sm:p-10">
            <p className="max-w-2xl font-display text-xl italic leading-relaxed text-slate-700 sm:text-2xl">
              &ldquo;Membaca itu murah. Sidang yang menentukan.&rdquo;
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <LinkButton to="/contact" withArrow>
                Sidangkan para dewan
              </LinkButton>
              <LinkButton to="/method" variant="ghost">
                Lihat cara putusan ditempa
              </LinkButton>
            </div>
          </div>
        </Reveal>
      </section>

      <CTABand />
    </>
  );
}
