import { NextResponse } from "next/server";
import {
  STAGES,
  DOCS,
  issueSession,
  loginCase,
  verifySession,
  getCaseByTicket,
  type CaseRecord,
} from "@/lib/portal";
import { QRIS } from "@/data/payment";
import { BRAND } from "@/data/brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/portal — otak Portal Klien.
 *
 * POST { action: "login", ticket, email }
 *   → 200 { ok, token, case }      sesi terbit (token berlaku 7 hari)
 *   → 401 { ok:false }             kombinasi tiket+email tidak dikenal
 *
 * POST { action: "case", token }
 *   → 200 { ok, case }             data kasus terbaru
 *   → 401 { ok:false }             token tidak valid / kedaluwarsa
 */

interface PortalCasePayload {
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
  timeline: { index: number; label: string; desc: string; state: "done" | "active" | "pending" }[];
  documents: { name: string; required: boolean; done: boolean }[];
  payment: {
    qrisImage: string;
    nmid: string;
    merchant: string;
    whatsappUrl: string;
  };
  officer: { name: string; phone: string; whatsappUrl: string };
}

function toPayload(rec: CaseRecord): PortalCasePayload {
  const stage = Math.min(Math.max(rec.stage, 1), STAGES.length);
  const progress = Math.round((stage / STAGES.length) * 100);

  // Dokumen inti dianggap lengkap mulai tahap 3 (penyusunan dokumen).
  const docsDone = stage >= 3;
  const documents = DOCS.map((d, i) => ({
    ...d,
    done: docsDone || (stage >= 2 && i < 2),
  }));

  const waUrl = (text: string) =>
    `https://wa.me/${BRAND.whatsappIntl}?text=${encodeURIComponent(text)}`;

  return {
    ticket: rec.refCode,
    name: rec.name,
    company: rec.company ?? null,
    service: rec.service ?? "Konsultasi Umum",
    stage,
    stageLabel: STAGES[stage - 1].label,
    progress,
    note: rec.note ?? null,
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
    source: rec.source,
    timeline: STAGES.map((s, i) => ({
      index: i + 1,
      label: s.label,
      desc: s.desc,
      state: i + 1 < stage ? "done" : i + 1 === stage ? "active" : "pending",
    })),
    documents,
    payment: {
      qrisImage: QRIS.image,
      nmid: QRIS.nmid,
      merchant: QRIS.merchant,
      whatsappUrl: waUrl(
        `Halo PT TOP KONSULTAN INTERNASIONAL, saya klien dengan tiket ${rec.refCode} ingin menanyakan pembayaran via QRIS.`
      ),
    },
    officer: {
      name: "Tim Penanganan Kasus",
      phone: BRAND.phone,
      whatsappUrl: waUrl(
        `Halo PT TOP KONSULTAN INTERNASIONAL, saya klien dengan tiket ${rec.refCode} ingin meminta pembaruan status penanganan.`
      ),
    },
  };
}

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const b = (body ?? {}) as Record<string, unknown>;
  const action = String(b.action ?? "");

  /* ── LOGIN ─────────────────────────────────────────────────────────── */
  if (action === "login") {
    const ticket = String(b.ticket ?? "").trim();
    const email = String(b.email ?? "").trim();

    if (!ticket || !email) {
      return NextResponse.json(
        { ok: false, error: "fields_required", message: "Nomor tiket dan email wajib diisi." },
        { status: 400 }
      );
    }

    const rec = await loginCase(ticket, email);
    if (!rec) {
      // Jeda menumpulkan brute-force; pesan tidak membocorkan mana yang salah.
      await new Promise((r) => setTimeout(r, 650));
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_credentials",
          message:
            "Kombinasi nomor tiket dan email tidak dikenal. Pastikan Anda memakai email saat mengirim brief. Demo: tiket TOP-DEMO2026 · email demo@pusatperizinan.com.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      token: issueSession(rec.refCode),
      case: toPayload(rec),
    });
  }

  /* ── AMBIL KASUS (sesi aktif) ──────────────────────────────────────── */
  if (action === "case") {
    const token = String(b.token ?? "");
    const ticket = verifySession(token);
    if (!ticket) {
      return NextResponse.json(
        { ok: false, error: "session_invalid", message: "Sesi berakhir. Silakan masuk kembali." },
        { status: 401 }
      );
    }
    const rec = await getCaseByTicket(ticket);
    if (!rec) {
      return NextResponse.json(
        { ok: false, error: "case_missing", message: "Kasus tidak lagi tersedia. Hubungi tim kami." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, case: toPayload(rec) });
  }

  return NextResponse.json(
    { ok: false, error: "unknown_action", message: "Aksi tidak dikenal." },
    { status: 400 }
  );
}
