# Changelog — topkonsultan

Semua perubahan penting pada platform **PT TOP KONSULTAN INTERNASIONAL (PUSAT PERIZINAN.COM)** didokumentasikan di sini.

Format bersandar pada [Keep a Changelog](https://keepachangelog.com/id/1.1.0/) dan skema versi **PENTA-VERSI** — lima segmen `GENERASI.MAYOR.MINOR.PATCH.BUILD` (penjelasan lengkap di [README](./README.md#-penta-versi--lima-pilar)).

---

## [2.5.0.0.0] — 2026-11-25 · "Konversi & Konten" (Conversion & Content)

### Ditambahkan
- **Kalkulator Biaya Perizinan (`/kalkulator`)** — estimasi jasa pendampingan dalam tiga langkah (kategori → layanan → kecepatan): **23 layanan dalam 6 kategori** (pendirian PT/PMA/CV/yayasan, NIB OSS RBA, izin sesuai risiko, SNI, ISO, halal BPJPH, izin edar BPOM, PSE, pariwisata, lingkungan, PKP, laporan tahunan, due diligence, KITAS, market entry), **tiga mode kecepatan** (Standar / Cepat / Prioritas Dewan), rentang biaya + durasi dihitung seketika di sisi klien — lengkap dengan tombol **Minta Penawaran via WhatsApp** (ringkasan terisi otomatis), **Salin Ringkasan**, FAQ mini, dan disclaimer transparan (jasa pendampingan vs biaya resmi instansi).
- **Blog Wawasan Penuh — 6 esai dewan baru (total 12)** di garis depan kompetensi firma: *Hukum Risiko: Peta Baru Perizinan Setelah OSS RB*, *Peta Emas PT PMA*, *Izin PSE dan Uang yang Percaya*, *Dari Dapur ke Rak Global: Halal–BPOM*, *Pajak sebagai Seni Bertahan*, *Konstitusi Perusahaan* — ditulis ketua & mitra dewan (Public Policy, Geopolitical Risk, Data Intelligence, Food & Agriculture, Global Macro, Constitutional Design), dengan 6 sampul ilustrasi baru bergaya editorial.
- **Pencarian & filter kategori di `/insights`** — pencarian instan (judul, ringkasan, penulis, tag), chip kategori, dukungan URL `?kategori=…`, status jumlah hasil, dan keadaan kosong yang ramah.
- **Halaman artikel v2** — bagian **"Baca juga"** (3 artikel terkait sekategori), chip kategori tersambut, dan avatar inisial penulis di hero serta kotak penulis.
- **Testimoni Video Sinematik** di beranda — 4 testimoni klien dalam empat bahasa (Indonesia, Inggris, Jepang, Arab dengan dukungan RTL) diputar sebagai narasi kinetik dengan pemutar lengkap: play/pause, baris sebelumnya/berikutnya, putar ulang, bilah progres, tutup via ESC — menghormati `prefers-reduced-motion` (tanpa autoplay), dan slot `videoUrl` disiapkan untuk footage asli.
- Modul data baru: `src/data/calculator.ts` (23 layanan, 6 kategori, 3 kecepatan, mesin estimasi) · `src/data/video-testimonials.ts` (4 narasi multi-bahasa).

### Diubah
- Navigasi: **Kalkulator Biaya Izin** masuk menu mobile navbar & kolom footer "Untuk Klien"; seksi **Testimoni Video** hadir di beranda tepat di bawah testimoni klasik.
- `/kalkulator` masuk sitemap (prioritas 0.9) dengan metadata SEO + Open Graph lengkap; deskripsi `/insights` dimutakhirkan ke fokus regulasi-perizinan.
- Angka nyata diperbarui dari build produksi: **684 halaman prerender** · **674 URL sitemap** (141 inti & esai + 533 katalog jasa).
- Skema versi naik ke MAYOR 5 (era Konversi & Konten) sesuai roadmap.

---

## [2.4.0.0.0] — 2026-11-25 · "Transaksi Penuh" (Full Transactions)

### Ditambahkan
- **Invoice Online (`/invoice`)** — setiap tagihan kini hadir sebagai dokumen digital resmi: dicari dengan nomor invoice (`INV-2026-XXXXXX`) + kunci akses privat 22 karakter, menampilkan identitas penerbit, rincian layanan, nominal multi-mata uang, panel pembayaran, dan tombol **Cetak / Simpan PDF** dengan tata letak cetak bersih. Tautan invoice dapat dibagikan langsung (`/invoice?no=…&k=…`).
- **QRIS Dinamis per transaksi** — mesin `src/lib/qris.ts` membangun payload QRIS standar EMVCo (Point of Initiation `12`) dengan **nominal Rupiah tertanam** (tag 54) dan nomor invoice sebagai referensi transaksi (tag 62.01), dikunci integritasnya dengan **CRC16-CCITT**. Aplikasi pemindai mengisi nominal otomatis — tanpa salah ketik. QR statis resmi tetap tersedia sebagai kanal utama.
- **`/api/qris`** — merender payload QRIS menjadi **gambar QR SVG** (512px, koreksi error M); mode invoice (`?number=…&k=…`) dan mode payload jadi yang **wajib lolos verifikasi CRC16** — bukan generator QR bebas.
- **`/api/invoice`** — enam aksi: `view` (token-gated publik), `mine` (sesi portal klien), `issue` / `mark-paid` / `void` / `list` (dilindungi kunci `OFFICER_KEY`). Penomoran `INV-<tahun>-<base36>` unik; tahan banting dengan fallback memori penuh untuk serverless.
- **Multi-mata uang** — invoice dapat diterbitkan dalam **12 mata uang** (IDR, USD, EUR, SGD, GBP, JPY, AUD, CNY, AED, SAR, MYR, THB) dengan ekuivalen Rupiah berdasarkan kurs referensi bertanggal; QRIS selalu menyelesaikan dana dalam Rupiah.
- **Kartu "Tagihan & Pembayaran" di Portal Klien** — klien yang login melihat seluruh invoice kasusnya (nomor, layanan, nominal, status Lunas/Belum Bayar/Batal) dengan tautan langsung membuka dokumennya.
- **Seksi "Transaksi Penuh" di `/payment`** — pratinjau QRIS dinamis interaktif (nominal diubah → QR berubah seketika), konverter 12 mata uang → ekuivalen QRIS, dan gerbang Invoice Online.
- **Invoice demo permanen**: `INV-DEMO2026` · kunci `DEMO` (Rp 12.500.000, tiket TOP-DEMO2026) — siapa pun bisa mencoba.
- Tabel Prisma **`Invoice`** (nomor, tiket, klien, layanan, mata uang, nominal, ekuivalen IDR, status, token tampilan).

### Diubah
- Navigasi: tautan **Invoice Online** di kolom footer "Untuk Klien".
- `/invoice` masuk sitemap (indeksable); metadata SEO lengkap + Open Graph.
- Skema versi naik ke MAYOR 4 (era Transaksi Penuh) sesuai roadmap.

---

## [2.3.1.0.0] — 2026-11-25 · "Gerbang Klien" (The Client Gateway)

### Ditambahkan
- **Portal Klien (`/portal`)** — dasbor privat setiap klien: login dengan nomor tiket `TOP-XXXXXX` + email brief, timeline enam tahap penanganan (Brief Diterima → Verifikasi Berkas → Penyusunan Dokumen → Pengurusan ke Instansi → Serah Terima → Selesai & Garansi), checklist dokumen kasus, kanal pembayaran, dan jalur langsung ke officer via WhatsApp.
- **Sesi tanpa password**: token HMAC-SHA256 bertanda-tangan (berlaku 7 hari) — tanpa menyimpan kredensial apa pun; verifikasi tiket+email terhadap database, dengan fallback memori penuh untuk serverless.
- **API `/api/portal`** — aksi `login` & `case`; kasus otomatis ter-bootstrap dari ContactMessage saat klien pertama kali masuk; form kontak kini mendaftarkan kasus ke portal sejak tiket terbit.
- **Tabel `ClientCase`** (Prisma) — status tahap, catatan officer, dan layanan per tiket, dipersist di SQLite.
- **Halaman Pembayaran QRIS (`/payment`)** — QRIS resmi **PusatPerizinan.com** (NMID **ID1026629416698**, terminal A01) terpasang: kartu QR besar dengan tombol unduh & cek NMID ke aspi-qris.id, kalkulator konfirmasi pembayaran (layanan + nominal + tiket → pesan WhatsApp terisi otomatis), panduan 3 langkah, 12+ aplikasi yang didukung, dan jaminan keamanan merchant.
- **Kasus demo permanen**: tiket `TOP-DEMO2026` · email `demo@pusatperizinan.com` (tahap 3, Penyusunan Dokumen) — siapa pun bisa mencoba portal.
- Navigasi baru: tombol **Portal Klien** & **Bayar QRIS** di navbar desktop, item menu mobile, dan kolom footer **"Untuk Klien"**.

### Diubah
- `SITE_LASTMOD` → 2026-11-25; `/payment` masuk sitemap (indeksable), `/portal` sengaja `noindex` seperti `/vvip` (privat).
- Skema versi naik ke MAYOR 3 (era Portal Klien) + MINOR 1 (QRIS) sesuai roadmap.

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
