/**
 * ops/version-check.mjs — Penjaga Sinkronisasi PENTA-VERSI.
 * ----------------------------------------------------------------------------
 * Memastikan versi topkonsultan identik di SEMUA titik sinkronisasi:
 *
 *   1. VERSION                (sumber kebenaran kanonik — root repo)
 *   2. package.json           (name + version)
 *   3. src/data/brand.ts      (BRAND.version + BRAND.versionCode — jantung app)
 *   4. public/humans.txt      (deklarasi manusia)
 *   5. CHANGELOG.md           (entri teratas)
 *
 * Titik turunan berikut TIDAK perlu diperiksa langsung karena membaca dari
 * brand.ts secara otomatis saat build:
 *   - src/app/manifest.ts     (PWA manifest.version + version_name)
 *   - src/app/api/route.ts    (health endpoint /api)
 *   - footer.tsx              (tampilan "Platform vX.X.X.X.X")
 *
 * Badge README juga otomatis (membaca package.json & releases via shields.io).
 *
 * Dipanggil oleh: `bun run version:check` dan CI GitHub Actions.
 * Keluar dengan kode 1 jika ada satu saja titik yang tidak sinkron.
 */

import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

const points = [];

function check(label, file, actual, expected, hint = "") {
  points.push({ label, file, ok: actual === expected, actual, hint });
}

/* 1. Sumber kebenaran kanonik */
const canonical = read("VERSION").trim();
const short = canonical; // bentuk pendek: 2.2.2.2.2
const display = `v${canonical}`; // bentuk tampilan: v2.2.2.2.2

/* 2. package.json */
const pkg = JSON.parse(read("package.json"));
check("package.json · name", "package.json", pkg.name, "topkonsultan", 'harus "topkonsultan"');
check("package.json · version", "package.json", pkg.version, short, "versi npm/JS");

/* 3. brand.ts — jantung aplikasi */
const brand = read("src/data/brand.ts");
const versionField = brand.match(/version:\s*"([^"]+)"/);
const versionCodeField = brand.match(/versionCode:\s*"([^"]+)"/);
check(
  "brand.ts · version",
  "src/data/brand.ts",
  versionField ? versionField[1] : "(tidak ditemukan)",
  display,
  "dipakai footer & /api"
);
check(
  "brand.ts · versionCode",
  "src/data/brand.ts",
  versionCodeField ? versionCodeField[1] : "(tidak ditemukan)",
  short,
  "dipakai manifest PWA"
);

/* 4. humans.txt */
const humans = read("public/humans.txt");
check(
  "humans.txt · Versi",
  "public/humans.txt",
  humans.includes(display) ? display : "(tidak ditemukan)",
  display,
  "seksi /* SITE */"
);

/* 5. CHANGELOG.md — entri teratas harus versi kanonik */
const changelog = read("CHANGELOG.md");
const topEntry = changelog.match(/##\s*\[([^\]]+)\]/);
check(
  "CHANGELOG.md · entri teratas",
  "CHANGELOG.md",
  topEntry ? topEntry[1] : "(tidak ditemukan)",
  short,
  "rilis terbaru"
);

/* Laporan */
console.log("");
console.log("  PENTA-VERSI — Pemeriksaan Sinkronisasi Versi");
console.log(`  Kanonik: ${display} (file VERSION)`);
console.log("  " + "-".repeat(56));
let failed = 0;
for (const p of points) {
  const mark = p.ok ? "OK" : "!!";
  const pad = p.label.padEnd(30);
  if (!p.ok) failed++;
  console.log(`  [${mark}] ${pad} ${p.ok ? display : "DITEMUKAN: " + p.actual}`);
  if (!p.ok && p.hint) console.log(`        perbaiki -> ${p.file} (${p.hint})`);
}
console.log("  " + "-".repeat(56));
if (failed > 0) {
  console.error(`  GAGAL: ${failed} titik tidak sinkron dengan VERSION (${display}).`);
  console.error("  Perbaiki semua titik di atas sebelum commit/tag/push.");
  process.exit(1);
}
console.log(`  LULUS: semua ${points.length} titik sinkron — ${display} terkunci sempurna.`);
