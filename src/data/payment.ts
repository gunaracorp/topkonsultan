/**
 * src/data/payment.ts — Satu sumber kebenaran kanal pembayaran resmi.
 * ----------------------------------------------------------------------------
 * QRIS (Quick Response Code Indonesian Standard) — standar pembayaran
 * nasional yang menerima SEMUA dompet digital & mobile banking Indonesia.
 *
 * Data merchant di bawah adalah data resmi terdaftar PT TOP KONSULTAN
 * INTERNASIONAL (NMID diterbitkan oleh ASPI — Asosiasi Sistem Pembayaran
 * Indonesia). Semua halaman pembayaran & portal klien membaca dari sini.
 */

export const QRIS = {
  /** Nama merchant terdaftar di QRIS */
  merchant: "PusatPerizinan.com",
  /** NMID — National Merchant ID (identitas resmi bank penerbit) */
  nmid: "ID1026629416698",
  /** Kode terminal/lokasi QRIS */
  terminalCode: "A01",
  /** Slogan standar QRIS */
  slogan: "SATU QRIS UNTUK SEMUA",
  /** Verifikasi merchant resmi */
  verifyUrl: "https://www.aspi-qris.id",
  /** Aset gambar QR (optimized web, ±900px) */
  image: "/images/qris-pusatperizinan.jpg",
  imageAlt:
    "QRIS resmi PusatPerizinan.com — PT TOP KONSULTAN INTERNASIONAL. NMID ID1026629416698. Pindai dengan semua aplikasi pembayaran Indonesia.",
} as const;

/** E-wallet & mobile banking yang diterima QRIS (semua otomatis). */
export const QRIS_SUPPORTED_APPS: { name: string; note: string }[] = [
  { name: "GoPay", note: "Gojek" },
  { name: "OVO", note: "Grab & Tokopedia" },
  { name: "DANA", note: "Ant/Alibaba" },
  { name: "ShopeePay", note: "Shopee" },
  { name: "LinkAja", note: "Telkomsel & BUMN" },
  { name: "Livin' by Mandiri", note: "Bank Mandiri" },
  { name: "BCA mobile", note: "Bank BCA" },
  { name: "BRImo", note: "Bank BRI" },
  { name: "BNI Mobile", note: "Bank BNI" },
  { name: "Jenius", note: "Bank BTPN" },
  { name: "SeaBank", note: "Sea Ltd" },
  { name: "blu", note: "Bank BCA Digital" },
];

/* ============================ MULTI-MATA UANG =============================== */

/**
 * Kurs referensi (per 1 unit mata uang → Rupiah) untuk klien internasional.
 * QRIS selalu menyelesaikan dana dalam Rupiah; nominal asing dikonversi ke
 * ekuivalen IDR saat invoice diterbitkan, memakai tabel referensi ini.
 *
 * CATATAN KEBENARAN: ini adalah kurs referensi statis bertanggal RATES_REF_DATE
 * (bukan kurs live) — kurs final dikonfirmasi officer saat penerbitan invoice.
 */
export const RATES_REF_DATE = "2026-11-25";

export interface CurrencyInfo {
  code: string;
  name: string;
  /** Simbol tampilan (aman untuk font umum). */
  symbol: string;
  /** Rupiah per 1 unit mata uang ini (kurs referensi). */
  rateToIdr: number;
  /** locale Intl untuk format angka. */
  locale: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "IDR", name: "Rupiah Indonesia", symbol: "Rp", rateToIdr: 1, locale: "id-ID" },
  { code: "USD", name: "Dolar Amerika Serikat", symbol: "US$", rateToIdr: 15_800, locale: "en-US" },
  { code: "EUR", name: "Euro", symbol: "€", rateToIdr: 17_200, locale: "de-DE" },
  { code: "SGD", name: "Dolar Singapura", symbol: "S$", rateToIdr: 11_900, locale: "en-SG" },
  { code: "GBP", name: "Pound Sterling", symbol: "£", rateToIdr: 20_100, locale: "en-GB" },
  { code: "JPY", name: "Yen Jepang", symbol: "¥", rateToIdr: 106, locale: "ja-JP" },
  { code: "AUD", name: "Dolar Australia", symbol: "A$", rateToIdr: 10_400, locale: "en-AU" },
  { code: "CNY", name: "Yuan Tiongkok", symbol: "CN¥", rateToIdr: 2_190, locale: "zh-CN" },
  { code: "AED", name: "Dirham Uni Emirat Arab", symbol: "AED", rateToIdr: 4_300, locale: "en-AE" },
  { code: "SAR", name: "Riyal Arab Saudi", symbol: "SAR", rateToIdr: 4_210, locale: "en-SA" },
  { code: "MYR", name: "Ringgit Malaysia", symbol: "RM", rateToIdr: 3_550, locale: "ms-MY" },
  { code: "THB", name: "Baht Thailand", symbol: "฿", rateToIdr: 460, locale: "th-TH" },
];

export function findCurrency(code: string): CurrencyInfo | undefined {
  return CURRENCIES.find((c) => c.code === code.toUpperCase());
}

/** Konversi nominal mata uang apa pun → ekuivalen Rupiah (kurs referensi). */
export function convertToIdr(amount: number, currency: string): number {
  const cur = findCurrency(currency) ?? CURRENCIES[0];
  return Math.round(amount * cur.rateToIdr);
}

/** Format nominal mata uang yang rapi dan konsisten (tanpa sen). */
export function formatMoney(amount: number, currency: string): string {
  const cur = findCurrency(currency) ?? CURRENCIES[0];
  const n = new Intl.NumberFormat(cur.locale, { maximumFractionDigits: 0 }).format(
    Math.round(amount)
  );
  return `${cur.symbol} ${n}`;
}

/** Format Rupiah khusus — dipakai semua titik pembayaran. */
export function formatIdr(amountIdr: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
    Math.round(amountIdr)
  )}`;
}

/** Tiga langkah pembayaran standar QRIS. */
export const QRIS_STEPS: { title: string; desc: string }[] = [
  {
    title: "Buka Aplikasi Pembayaran",
    desc: "Buka aplikasi e-wallet atau mobile banking apa pun yang Anda punya — semua aplikasi berlogo QRIS bisa dipakai.",
  },
  {
    title: "Pindai & Periksa",
    desc: "Arahkan kamera ke QR di samping, pastikan nama merchant PusatPerizinan.com dan NMID ID1026629416698 tampil.",
  },
  {
    title: "Bayar & Simpan Bukti",
    desc: "Masukkan nominal, konfirmasi, lalu kirim bukti (screenshot) ke WhatsApp resmi kami untuk verifikasi instan.",
  },
];

/**
 * Template pesan WhatsApp konfirmasi pembayaran.
 * Menghasilkan teks siap-kirim dengan tiket, layanan, dan nominal terformat.
 */
export function buildPaymentMessage(opts: {
  service?: string;
  amount?: number;
  ticket?: string;
}): string {
  const lines: string[] = ["Halo PT TOP KONSULTAN INTERNASIONAL, saya sudah melakukan pembayaran via QRIS PusatPerizinan.com."];
  if (opts.ticket?.trim()) lines.push(`Nomor tiket: ${opts.ticket.trim().toUpperCase()}`);
  if (opts.service?.trim()) lines.push(`Layanan: ${opts.service.trim()}`);
  if (opts.amount && opts.amount > 0)
    lines.push(`Nominal: Rp ${opts.amount.toLocaleString("id-ID")}`);
  lines.push("Berikut saya lampirkan bukti pembayaran. Mohon verifikasinya. Terima kasih.");
  return lines.join("\n");
}

/** URL WhatsApp dengan pesan konfirmasi pembayaran terisi otomatis. */
export function buildPaymentWhatsAppUrl(opts: {
  service?: string;
  amount?: number;
  ticket?: string;
  phoneIntl: string;
}): string {
  return `https://wa.me/${opts.phoneIntl}?text=${encodeURIComponent(buildPaymentMessage(opts))}`;
}
