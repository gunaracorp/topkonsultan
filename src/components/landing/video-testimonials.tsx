"use client";

/**
 * VideoTestimonials — galeri testimoni sinematik kinetik (v2.5.0.0.0).
 * ----------------------------------------------------------------------------
 * Setiap kartu membuka pemutar layar-penuh yang menayangkan kutipan klien
 * baris demi baris dengan kontrol penuh (play/pause, lini sebelumnya /
 * berikutnya, putar ulang, bilah progres). Menghormati preferensi
 * reduced-motion: tanpa autoplay, navigasi manual. Bidang `videoUrl` pada
 * data memungkinkan footage asli dipasang tanpa mengubah antarmuka.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Quote,
  RotateCcw,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  VIDEO_TESTIMONIALS,
  type VideoTestimonial,
} from "@/data/video-testimonials";
import { BRAND } from "@/data/brand";
import { EASE, SectionHeading } from "./motion";
import { Reveal } from "./motion";

/* ------------------------------ Skema warna ------------------------------- */

const ACCENTS: Record<
  VideoTestimonial["accent"],
  { poster: string; stage: string; bar: string }
> = {
  violet: {
    poster: "from-violet-700 via-purple-600 to-indigo-800",
    stage: "from-[#2e1065] via-[#4c1d95] to-[#1e1b4b]",
    bar: "from-violet-400 to-fuchsia-400",
  },
  blue: {
    poster: "from-blue-700 via-indigo-600 to-violet-800",
    stage: "from-[#1e3a8a] via-[#312e81] to-[#172554]",
    bar: "from-sky-400 to-indigo-400",
  },
  indigo: {
    poster: "from-indigo-700 via-blue-600 to-slate-800",
    stage: "from-[#312e81] via-[#1e40af] to-[#0f172a]",
    bar: "from-indigo-400 to-sky-400",
  },
  fuchsia: {
    poster: "from-fuchsia-700 via-purple-600 to-indigo-800",
    stage: "from-[#701a75] via-[#5b21b6] to-[#2e1065]",
    bar: "from-fuchsia-400 to-violet-400",
  },
};

function fmt(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => Array.from(p)[0] ?? "").join("").toUpperCase();
}

/* ------------------------------- Pemutar ---------------------------------- */

function Player({ vt, onClose }: { vt: VideoTestimonial; onClose: () => void }) {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(!reduced);
  const [elapsed, setElapsed] = useState(0);
  const total = vt.duration * 1000;
  const lines = vt.lines;
  const accent = ACCENTS[vt.accent];

  const idx = Math.min(lines.length - 1, Math.floor((elapsed / total) * lines.length));
  const ended = elapsed >= total;
  /** Berjalan hanya bila diputar DAN belum selesai — interval dibersihkan lewat efek. */
  const running = playing && !ended;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setElapsed((e) => Math.min(total, e + 100));
    }, 100);
    return () => window.clearInterval(id);
  }, [running, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const jump = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(lines.length - 1, i));
      setElapsed(Math.min(total - 1, clamped * (total / lines.length)));
    },
    [lines.length, total]
  );

  function toggle() {
    if (ended) {
      setElapsed(0);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  }

  const line = lines[idx];
  const progress = (elapsed / total) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/92 p-4 backdrop-blur-md sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Testimoni video dari ${vt.name}`}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 22 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.45, ease: EASE }}
        className={`relative aspect-video w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${accent.stage} shadow-[0_60px_140px_-40px_rgba(0,0,0,0.9)]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol tutup */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pemutar testimoni"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/90 backdrop-blur transition-colors hover:bg-white/20"
        >
          <X className="h-4.5 w-4.5" aria-hidden="true" />
        </button>

        {/* Bilah progres */}
        <div className="absolute inset-x-0 top-0 z-10 px-5 pt-4">
          <div className="h-1 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={`h-full rounded-full bg-gradient-to-r ${accent.bar} transition-[width] duration-100 ease-linear`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 flex items-center justify-between font-mono text-[11px] tracking-wider text-white/60">
            <span>{vt.langLabel ? `${vt.langLabel} · ` : ""}Testimoni sinematik</span>
            <span>
              {fmt(elapsed / 1000)} / {fmt(vt.duration)}
            </span>
          </p>
        </div>

        {/* Panggung */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pb-20 pt-16 text-center sm:px-14">
          <AnimatePresence mode="wait">
            {ended ? (
              <motion.div
                key="end"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="flex flex-col items-center"
              >
                <span className="flex gap-1.5" aria-label={`Penilaian ${vt.rating} dari 5`}>
                  {Array.from({ length: vt.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  ))}
                </span>
                <p className="mt-5 max-w-xl font-display text-xl font-bold leading-snug text-white sm:text-2xl">
                  {vt.name} — {vt.role}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {vt.company} · {vt.country}
                </p>
                <p className="mt-4 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                  {vt.service}
                </p>
                <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
                  <a
                    href={`${BRAND.whatsappHref}?text=${encodeURIComponent(
                      `Halo TOP Konsultan, saya menonton testimoni ${vt.name} (${vt.company}) dan ingin mendiskusikan kebutuhan serupa: ${vt.service}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[13px] font-bold text-slate-900 transition-transform duration-300 hover:scale-[1.03] active:scale-95"
                  >
                    Diskusikan kasus serupa
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setElapsed(0);
                      setPlaying(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-[13px] font-semibold text-white/90 transition-colors hover:bg-white/10"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Putar ulang
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.55, ease: EASE }}
                className="flex flex-col items-center"
              >
                <Quote className="mb-5 h-8 w-8 text-white/30" aria-hidden="true" />
                <p
                  dir={vt.rtl ? "rtl" : "ltr"}
                  className={`max-w-2xl font-display text-xl font-semibold leading-relaxed text-white sm:text-2xl md:text-[27px] ${
                    playing ? "" : "opacity-90"
                  }`}
                >
                  {line.text}
                </p>
                {line.caption && (
                  <p className="mt-4 max-w-xl text-[13px] italic leading-relaxed text-white/55 sm:text-sm">
                    {line.caption}
                  </p>
                )}
                <p className="mt-6 font-mono text-[11px] tracking-[0.25em] text-white/40">
                  {String(idx + 1).padStart(2, "0")} / {String(lines.length).padStart(2, "0")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Kontrol */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-4 bg-gradient-to-t from-black/45 to-transparent px-5 pb-5 pt-10">
          <button
            type="button"
            onClick={() => jump(idx - 1)}
            disabled={idx === 0 || ended}
            aria-label="Baris sebelumnya"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white/85 transition-colors hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={ended ? "Putar ulang" : playing ? "Jeda" : "Putar"}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_14px_40px_-10px_rgba(255,255,255,0.4)] transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            {ended ? (
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
            ) : playing ? (
              <Pause className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Play className="ml-0.5 h-5 w-5" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => jump(idx + 1)}
            disabled={idx === lines.length - 1 || ended}
            aria-label="Baris berikutnya"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white/85 transition-colors hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------- Seksi ----------------------------------- */

export default function VideoTestimonials() {
  const [active, setActive] = useState<VideoTestimonial | null>(null);
  const cards = useMemo(() => VIDEO_TESTIMONIALS, []);

  return (
    <section
      className="relative border-t border-slate-200 py-24 sm:py-28"
      aria-label="Testimoni video klien"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Testimoni video — saksikan, bukan sekadar baca"
          title={
            <>
              Kemenangan klien, <span className="text-gradient-gold">diceritakan kembali.</span>
            </>
          }
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {cards.map((vt, i) => {
            const accent = ACCENTS[vt.accent];
            return (
              <Reveal key={vt.id} delay={(i % 2) * 0.08} className="h-full">
                <button
                  type="button"
                  onClick={() => setActive(vt)}
                  aria-label={`Putar testimoni video dari ${vt.name}, ${vt.company}`}
                  className="group flex h-full w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-left transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-500/60 hover:shadow-[0_30px_70px_-30px_rgba(139,92,246,0.3)]"
                >
                  {/* Poster */}
                  <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${accent.poster} sm:h-52`}>
                    <div
                      className="grid-bg absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,black_30%,transparent_80%)]"
                      aria-hidden="true"
                    />
                    <Quote className="absolute left-6 top-6 h-9 w-9 text-white/25" aria-hidden="true" />
                    <span className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/25 px-3 py-1 font-mono text-[11px] tracking-wider text-white/85 backdrop-blur">
                      {fmt(vt.duration)}
                    </span>
                    {vt.langLabel && (
                      <span className="absolute left-4 top-4 rounded-full border border-white/25 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/85 backdrop-blur">
                        {vt.langLabel}
                      </span>
                    )}
                    {/* Tombol putar */}
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-110">
                        <Play className="ml-1 h-6 w-6" aria-hidden="true" />
                      </span>
                    </span>
                    {/* Inisial */}
                    <span className="absolute bottom-4 left-6 flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/15 font-display text-sm font-bold text-white backdrop-blur">
                        {initialsOf(vt.name)}
                      </span>
                      <span className="leading-tight text-white">
                        <span className="block text-sm font-bold">{vt.name}</span>
                        <span className="block text-[11px] text-white/70">
                          {vt.role} · {vt.company}
                        </span>
                      </span>
                    </span>
                  </div>

                  {/* Isi */}
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <span className="w-fit rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-700">
                      {vt.service}
                    </span>
                    <p className="flex-1 text-[13.5px] leading-relaxed text-slate-500">
                      &ldquo;{vt.lines[0].text}&rdquo;
                      {vt.lines[0].caption ? ` — ${vt.lines[0].caption}` : ""}
                    </p>
                    <p className="flex items-center justify-between gap-3">
                      <span className="flex gap-1" aria-hidden="true">
                        {Array.from({ length: vt.rating }).map((_, s) => (
                          <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600">
                        Putar testimoni
                        <Play className="ml-1.5 inline h-3 w-3" aria-hidden="true" />
                      </span>
                    </p>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.12}>
          <p className="mt-8 text-center text-[12px] leading-relaxed text-slate-400">
            Testimoni ditayangkan sebagai narasi sinematik dengan izin klien. Kutipan
            dipadatkan untuk format tayang; dokumen penugasan asli tersedia saat due diligence.
          </p>
        </Reveal>
      </div>

      <AnimatePresence>
        {active && <Player vt={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </section>
  );
}
