# Changelog — topkonsultan

Semua perubahan penting pada platform **PT TOP KONSULTAN INTERNASIONAL (PUSAT PERIZINAN.COM)** didokumentasikan di sini.

Format bersandar pada [Keep a Changelog](https://keepachangelog.com/id/1.1.0/) dan skema versi **PENTA-VERSI** — lima segmen `GENERASI.MAYOR.MINOR.PATCH.BUILD` (penjelasan lengkap di [README](./README.md#-penta-versi--lima-pilar)).

---

## [2.2.2.2.2] — 2026-11-25 · "Lima Pilar" (The Five Pillars)

### Ditambahkan
- **Sistem versi PENTA-VERSI** — lima segmen tersinkron di 12 titik, satu sumber kebenaran (file `VERSION`).
- **Penjaga sinkronisasi** `ops/version-check.mjs` — dipanggil `bun run version:check`, memverifikasi semua titik versi identik; dijalankan otomatis di CI sebelum build.
- **Endpoint health & versi** `GET /api` — mengembalikan `status`, `service`, `version`, `time` untuk uptime monitor.
- **`CHANGELOG.md`** — dokumentasi sejarah rilis dari generasi pertama hingga kini.
- Versi pada **manifest PWA** (`version` + `version_name`), **footer situs** ("Platform v2.2.2.2.2"), dan **`humans.txt`**.
- Bagian **Peta Jalan (Roadmap)** di README — arah evolusi hingga generasi 3.

### Diubah
- **README ditulis ulang total** dengan angka terverifikasi dari build nyata: 674 halaman prerender, 665 URL sitemap, 500 layanan jasa (33 kategori), 36 jenis perizinan, 46 Dewan Pakar, 195 bahasa, 23 logo instansi — memperbaiki angka lama yang usang (127 URL, 136 halaman).
- Tombol *Deploy with Vercel* kini menunjuk ke repo resmi `gunaracorp/topkonsultan`.
- Badge README kini **dinamis** (versi, CI, rilis — membaca langsung dari GitHub, selalu sinkron tanpa sunting manual).
- `package.json`: nama paket menjadi `topkonsultan`, versi `2.2.2.2.2`.
- `SITE_LASTMOD` (basis lastmod sitemap) dimutakhirkan ke 2026-11-25.

---

## [2.2.2.2.1] — 2026-11-25 · "Nadi Bersih" (Clean Pulse)

### Keamanan
- **Penghapusan data sensitif dari pelacakan git** pada repo publik: `.env`, `db/custom.db` (memuat PII 18 pesan kontak + 8 pelanggan newsletter), dan artefak kerja lokal (`notes/`, `scripts/` riset, `.zscripts/`, screenshot debug).
- Histori lama dipindahkan ke branch **`legacy-v1`**; `main` ditulis ulang sebagai satu commit bersih ber-author resmi.

### Diperbaiki
- **CI rusak diperbaiki**: workflow webpack warisan template (selalu gagal) diganti **CI Bun modern** — install, prisma generate, lint, build — kini hijau.

---

## [2.2.2.1.1] — 2026-11-25 · "Kanal Satu" (One Channel)

### Diperbaiki
- **Seluruh nomor telepon disatukan** ke **+62 813-1651-6524** (WhatsApp + telepon) di semua halaman, tombol mengapung, metadata, dan manifest.
- **Email resmi ditambahkan**: **topmanajemenkonsultan@gmail.com** di seluruh titik kontak, footer, JSON-LD, dan halaman kontak.
- Perbaikan navigasi menu mobile, form kontak bertiket, dan halaman detail perizinan.

---

## [2.2.1.1.1] — 2026-11-25 · "Ledakan Konten" (Content Ignition)

### Ditambahkan
- Katalog jasa **500 layanan dalam 33 kategori** + katalog **36 jenis perizinan** (PT/PMA, NIB, BPOM, Halal, SNI, KITAS, PSE, OJK, …).
- **23 logo instansi resmi** (Kemenkumham, BKPM, Kemenkeu, Kemendag, BPOM, OJK, …).
- **Mesin SEO terpusat** (`src/lib/seo.ts`): URL nyata, JSON-LD schema.org lengkap, hreflang **195 bahasa**, sitemap **665 URL**, robots.txt, PWA manifest.
- **674 halaman prerender**, 120+ tampilan hash-router dengan URL nyata.
- Halaman: councils (46 Dewan), industries (12), insights, careers, awards, booking, pricing, method, results, global, legal, FAQ, VVIP.

---

## [2.2.0.0.0] — 2026-11-25 · "Oracle"

### Ditambahkan
- **Oracle AI — 46 Dewan Pakar** di lounge VVIP eksklusif (`#/vvip`, kode akses): perizinan, bisnis, pajak, strategi dalam bahasa apa pun, 24/7.
- **Mode cadangan cerdas**: bila mesin AI tidak tersedia, tamu diarahkan ke tim manusia — pengunjung tidak pernah melihat error.

---

## [2.1.0.0.0] — 2026-11 · "Fondasi"

### Ditambahkan
- Rebuild penuh di atas **Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Prisma**.
- Tema ungu-biru futuristik, animasi premium, responsif penuh, dukungan `prefers-reduced-motion`.
- Form kontak bertiket `TOP-XXXXXX` + newsletter dengan fallback memori (tanpa database pun jalan).

---

## [2.0.0.0.0] — 2026-10-21 · "Kelahiran Kembali"

### Diubah
- Keputusan arsitektur: situs generasi pertama dihentikan, platform baru dibangun dari nol. Kode generasi pertama dipreservasi di branch **`legacy-v1`**.

---

## [1.0.0.0.0] — 2026-10 · "Generasi Pertama"

- Situs awal PT TOP KONSULTAN INTERNASIONAL. Lihat branch **`legacy-v1`**.

---

<div align="center"><sub>PT TOP KONSULTAN INTERNASIONAL — PUSAT PERIZINAN.COM</sub></div>
