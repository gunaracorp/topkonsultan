import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";
import { BRAND } from "@/data/brand";

/**
 * /manifest.webmanifest — PWA manifest lengkap.
 * Ikon PNG dipesan di /icons/* (192, 512, maskable 512) dan
 * /apple-icon.png (180) untuk perangkat Apple.
 * Versi tersinkron otomatis dari BRAND (PENTA-VERSI) — jangan tulis manual.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.wordmark}`,
    short_name: "TOP Konsultan",
    description: SITE.description,
    id: "/",
    version: BRAND.versionCode,
    version_name: `${BRAND.version} "${BRAND.versionName}"`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#fafafc",
    theme_color: "#7c3aed",
    lang: "id",
    dir: "ltr",
    categories: ["business", "consulting", "legal", "productivity", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Gerbang Perizinan",
        short_name: "Perizinan",
        description: "36 jenis izin dalam satu gerbang",
        url: "/perizinan",
      },
      {
        name: "Hubungi Kami",
        short_name: "Kontak",
        description: "WhatsApp 24/7 +62 813-1651-6524",
        url: "/contact",
      },
    ],
  };
}
