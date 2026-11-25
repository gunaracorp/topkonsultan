import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getInvoice, qrisPayloadForInvoice } from "@/lib/invoice";
import { isValidQrisPayload } from "@/lib/qris";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/qris — merender payload QRIS menjadi gambar QR SVG.
 *
 * GET ?number=INV-…&k=TOKEN   → QR dinamis untuk invoice tersebut
 *                               (nominal Rupiah tertanam di payload).
 * GET ?payload=<string-QRIS>  → QR dari payload jadi — HANYA bila CRC16
 *                               valid (divalidasi ketat supaya endpoint ini
 *                               tidak menjadi generator QR bebas).
 */

const QR_OPTS = {
  type: "svg" as const,
  errorCorrectionLevel: "M" as const,
  margin: 2,
  width: 512,
  color: { dark: "#09090b", light: "#ffffff" },
};

async function renderSvg(payload: string): Promise<string> {
  return QRCode.toString(payload, QR_OPTS);
}

function svgResponse(svg: string, cachePrivate: boolean): Response {
  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": cachePrivate ? "private, max-age=300" : "public, max-age=3600",
    },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  /* ── Mode invoice: QR dinamis (nominal tertanam) ─────────────────── */
  const number = url.searchParams.get("number");
  const key = url.searchParams.get("k") ?? url.searchParams.get("token");
  if (number || key) {
    if (!number || !key) {
      return NextResponse.json(
        { ok: false, error: "params_required", message: "Butuh ?number=…&k=… untuk QR invoice." },
        { status: 400 }
      );
    }
    const rec = await getInvoice(number, key);
    if (!rec) {
      return NextResponse.json(
        { ok: false, error: "not_found", message: "Invoice tidak ditemukan." },
        { status: 404 }
      );
    }
    const svg = await renderSvg(qrisPayloadForInvoice(rec));
    return svgResponse(svg, true);
  }

  /* ── Mode payload jadi — wajib lolos validasi CRC16 ──────────────── */
  const payload = url.searchParams.get("payload") ?? "";
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "params_required", message: "Butuh ?payload=… atau ?number=…&k=…" },
      { status: 400 }
    );
  }
  if (!isValidQrisPayload(payload)) {
    return NextResponse.json(
      { ok: false, error: "payload_invalid", message: "Payload QRIS tidak valid (CRC16 gagal)." },
      { status: 400 }
    );
  }
  const svg = await renderSvg(payload);
  return svgResponse(svg, true);
}
