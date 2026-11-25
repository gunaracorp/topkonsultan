"use client";

/**
 * Halaman Jadwalkan Konsultasi — sesi orientasi 30 menit bersama Partner-in-Chief.
 * Form terhubung ke /api/contact (type "booking") — setiap sesi menetas tiket TOP-XXXXXX.
 */

import { motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageCircle,
  MonitorPlay,
  Phone,
  Send,
  Building2,
  Video,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { BRAND } from "@/data/brand";
import { EASE, Reveal } from "@/components/landing/motion";
import { LinkButton, PageHero } from "@/components/site/ui";

/* ------------------------------- Konstanta sesi ------------------------------- */

const TIME_SLOTS = ["09:00", "11:00", "13:00", "15:00", "17:00"] as const;

const TOPICS = [
  "Perizinan & Izin Usaha",
  "Pendirian PT / PMA",
  "Sertifikasi (BPOM · Halal · SNI · ISO)",
  "Strategi & Transformasi Bisnis",
  "Ekspansi Global / Market Entry",
  "Lainnya — akan saya jelaskan",
] as const;

const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "zoom", label: "Zoom", icon: Video },
  { id: "telepon", label: "Telepon", icon: Phone },
  { id: "kantor", label: "Datang ke Kantor", icon: Building2 },
] as const;

const EXPECTATIONS = [
  {
    icon: Clock3,
    title: "30 menit, fokus penuh",
    text: "Sesi orientasi bersama Partner-in-Chief — bukan sales pitch, bukan bot. Satu tantangan, satu percakapan.",
  },
  {
    icon: CalendarCheck2,
    title: "Konfirmasi dalam 24 jam",
    text: "Tim kami mengonfirmasi jadwal dan tautan sesi Anda dalam satu hari kerja — biasanya jauh lebih cepat.",
  },
  {
    icon: MonitorPlay,
    title: "Dari mana saja",
    text: "WhatsApp, Zoom, telepon, atau hadir ke kantor — lima kantor resmi siap menerima Anda.",
  },
  {
    icon: BadgeCheck,
    title: "Tanpa komitmen",
    text: "Sesi orientasi gratis. Rekomendasi model kemitraan baru dibicarakan setelah Anda melihat cara kami berpikir.",
  },
] as const;

/* --------------------------------- Helpers --------------------------------- */

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function twoWeeksISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 15);
  return d.toISOString().split("T")[0];
}

function formatTanggal(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/* --------------------------------- Halaman -------------------------------- */

export default function BookingPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [refCode, setRefCode] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;

    /* Tangkap elemen form sebelum await — e.currentTarget menjadi null
       setelah yield di React, sehingga .reset() di akhir harus pakai ref ini. */
    const form = e.currentTarget;

    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const company = String(fd.get("company") ?? "").trim();
    const topic = String(fd.get("topic") ?? "");
    const date = String(fd.get("date") ?? "");
    const slot = String(fd.get("slot") ?? "");
    const channel = String(fd.get("channel") ?? "");
    const notes = String(fd.get("notes") ?? "").trim();

    if (!date || !slot || !channel) {
      setErrorMsg("Pilih tanggal, jam, dan kanal sesi Anda terlebih dahulu.");
      setStatus("error");
      return;
    }
    if (notes.length < 10) {
      setErrorMsg("Ceritakan konteks Anda singkat — minimal 10 karakter agar sesi efektif.");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company,
          budget: `Sesi ${formatTanggal(date)} · ${slot} WIB · via ${channel}`,
          role: topic || undefined,
          challenge: `Permintaan sesi konsultasi.\n\nTopik: ${topic}\nCatatan: ${notes}`,
          type: "booking",
        }),
      });
      const data = (await res.json()) as { ok: boolean; id?: string; error?: string };
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error ?? "Permintaan sesi gagal terkirim. Coba lagi.");
        setStatus("error");
        return;
      }
      setRefCode(data.id ?? "TOP-0000");
      setStatus("sent");
      form.reset();
    } catch {
      setErrorMsg("Sinyal terputus di tengah jalan. Coba lagi.");
      setStatus("error");
    }
  }

  const inputCls =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20";

  return (
    <>
      <PageHero
        eyebrow="Jadwalkan Sesi"
        title={
          <>
            Tiga Puluh Menit yang <span className="text-gradient-gold">Mengubah Arah.</span>
          </>
        }
        sub="Pilih tanggal, jam, dan kanal sesi orientasi Anda. Partner-in-Chief yang menelepon — membawa konteks 46 dewan di punggungnya."
        crumbs={[{ label: "Beranda", to: "/" }, { label: "Jadwalkan Konsultasi" }]}
        meta={["30 menit", "Konfirmasi ≤ 24 jam", "Tanpa komitmen"]}
      />

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8" aria-label="Formulir penjadwalan">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr] lg:gap-8">
          {/* Kiri: apa yang Anda dapatkan */}
          <Reveal className="h-full">
            <div className="glass flex h-full flex-col gap-6 rounded-3xl p-7 sm:p-8">
              <h2 className="font-display text-xl font-bold text-slate-900">Apa yang terjadi setelah Anda menekan kirim.</h2>
              <ul className="space-y-5">
                {EXPECTATIONS.map((x) => (
                  <li key={x.title} className="flex items-start gap-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-300 bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600">
                      <x.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-slate-900">{x.title}</span>
                      <span className="block text-[13px] leading-relaxed text-slate-900">{x.text}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" aria-hidden="true" />

              <div className="mt-auto space-y-2.5 text-[13px]">
                <p className="flex items-center gap-2.5 text-slate-900">
                  <Phone className="h-4 w-4 text-violet-500" aria-hidden="true" />
                  Linin bisnis 24/7:{" "}
                  <a href={`tel:${BRAND.phoneHref}`} className="font-semibold text-violet-600 hover:underline">
                    {BRAND.phone}
                  </a>
                </p>
                <p className="flex items-center gap-2.5 text-slate-900">
                  <MessageCircle className="h-4 w-4 text-violet-500" aria-hidden="true" />
                  Email resmi:{" "}
                  <a href={`mailto:${BRAND.email}`} className="font-semibold text-violet-600 hover:underline">
                    {BRAND.email}
                  </a>
                </p>
                <p className="flex items-center gap-2.5 text-slate-900">
                  <CalendarDays className="h-4 w-4 text-violet-500" aria-hidden="true" />
                  Zona waktu kantor: WIB (GMT+7) — slot lain terjangkau via meja regional.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Kanan: formulir */}
          <Reveal delay={0.12} className="h-full">
            <div className="glass h-full rounded-3xl p-7 sm:p-8">
              {status === "sent" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="flex h-full min-h-[460px] flex-col items-center justify-center gap-5 text-center"
                  role="status"
                >
                  <span className="relative flex h-20 w-20 items-center justify-center">
                    <span className="absolute inset-0 animate-ping-slow rounded-full bg-violet-600/30" />
                    <CheckCircle2 className="h-16 w-16 text-violet-600" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-2xl font-bold text-slate-900">Sesi diajukan.</h3>
                  <p className="max-w-sm text-sm leading-relaxed text-slate-500">
                    Tim kami mengonfirmasi jadwal Anda dalam ≤ 24 jam melalui email dan WhatsApp.
                    Nomor tiket sesi Anda{" "}
                    <span className="font-bold text-violet-600">#{refCode}</span> — simpan untuk
                    referensi cepat.
                  </p>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <a
                      href={`${BRAND.whatsappHref}?text=${encodeURIComponent(`Halo TOP Konsultan, saya baru mengajukan sesi konsultasi #${refCode}. Mohon konfirmasi jadwalnya.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full border border-emerald-300 bg-emerald-50 px-8 py-3.5 text-sm font-bold text-emerald-600 transition-all duration-300 hover:border-emerald-500/60 hover:bg-emerald-100"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Konfirmasi via WhatsApp
                    </a>
                    <LinkButton to="/pricing" variant="ghost">
                      Lihat Model Kemitraan
                    </LinkButton>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatus("idle")}
                    className="mt-3 text-xs font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-violet-600"
                  >
                    Ajukan sesi lain
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5" noValidate={false}>
                  <h2 className="font-display text-xl font-bold text-slate-900">Formulir Penjadwalan</h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="bk-name" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.15em] text-slate-900">
                        Nama Lengkap <span className="text-violet-600">*</span>
                      </label>
                      <input id="bk-name" name="name" required minLength={2} maxLength={120} placeholder="Nama Anda" className={inputCls} autoComplete="name" />
                    </div>
                    <div>
                      <label htmlFor="bk-email" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.15em] text-slate-900">
                        Email <span className="text-violet-600">*</span>
                      </label>
                      <input id="bk-email" name="email" type="email" required placeholder="nama@perusahaan.com" className={inputCls} autoComplete="email" />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="bk-company" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.15em] text-slate-900">
                        Perusahaan <span className="font-normal normal-case text-slate-900">(opsional)</span>
                      </label>
                      <input id="bk-company" name="company" maxLength={120} placeholder="PT / CV / merek" className={inputCls} autoComplete="organization" />
                    </div>
                    <div>
                      <label htmlFor="bk-topic" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.15em] text-slate-900">
                        Topik Utama
                      </label>
                      <select id="bk-topic" name="topic" className={inputCls} defaultValue={TOPICS[0]}>
                        {TOPICS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="bk-date" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.15em] text-slate-900">
                      Tanggal Preferensi <span className="text-violet-600">*</span>
                    </label>
                    <input
                      id="bk-date"
                      name="date"
                      type="date"
                      required
                      min={tomorrowISO()}
                      max={twoWeeksISO()}
                      className={inputCls}
                      aria-describedby="bk-date-help"
                    />
                    <p id="bk-date-help" className="mt-1.5 text-[11px] text-slate-900">
                      Pilih tanggal dalam 14 hari ke depan (hari kerja diprioritaskan).
                    </p>
                  </div>

                  <fieldset>
                    <legend className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-900">
                      Slot Waktu (WIB) <span className="text-violet-600">*</span>
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {TIME_SLOTS.map((slot, i) => (
                        <label key={slot} className="cursor-pointer">
                          <input type="radio" name="slot" value={slot} required={i === 0} className="peer sr-only" />
                          <span className="inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all peer-checked:border-violet-600 peer-checked:bg-violet-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-violet-500/40 hover:border-violet-400">
                            {slot}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-900">
                      Kanal Sesi <span className="text-violet-600">*</span>
                    </legend>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {CHANNELS.map((c) => (
                        <label key={c.id} className="cursor-pointer">
                          <input type="radio" name="channel" value={c.label} required className="peer sr-only" />
                          <span className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition-all peer-checked:border-violet-600 peer-checked:bg-violet-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-violet-500/40 hover:border-violet-400">
                            <c.icon className="h-4 w-4" aria-hidden="true" />
                            {c.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div>
                    <label htmlFor="bk-notes" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.15em] text-slate-900">
                      Konteks Singkat <span className="text-violet-600">*</span>
                    </label>
                    <textarea
                      id="bk-notes"
                      name="notes"
                      required
                      minLength={10}
                      maxLength={4000}
                      rows={4}
                      placeholder="Ceritakan tantangan atau target utama Anda — 2-3 kalimat cukup untuk mempersiapkan sesi."
                      className={`${inputCls} resize-y`}
                    />
                  </div>

                  {status === "error" ? (
                    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                      {errorMsg}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="shine inline-flex min-h-13 w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-600 px-8 py-4 text-sm font-bold text-white shadow-[0_12px_44px_-10px_rgba(139,92,246,0.42)] transition-all duration-300 hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === "sending" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Menghubungkan dengan Dewan…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" aria-hidden="true" />
                        Ajukan Jadwal Sesi
                      </>
                    )}
                  </button>
                  <p className="text-center text-[11px] leading-relaxed text-slate-900">
                    Dengan mengirim formulir, Anda menyetujui{" "}
                    <a href="#/privacy" className="underline decoration-slate-300 underline-offset-2 hover:text-violet-600">
                      Kebijakan Privasi
                    </a>{" "}
                    kami. Data Anda tak pernah dibagikan ke pihak ketiga.
                  </p>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
