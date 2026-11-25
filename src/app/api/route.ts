import { NextResponse } from "next/server";
import { BRAND } from "@/data/brand";

/**
 * /api — health & version endpoint (PENTA-VERSI).
 * Respons JSON ringan, cocok untuk uptime monitor (UptimeRobot, BetterStack, dll):
 * GET /api -> { status, service, legal, version, time }
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "topkonsultan",
    legal: BRAND.legal,
    version: BRAND.version,
    release: BRAND.versionName,
    time: new Date().toISOString(),
  });
}
