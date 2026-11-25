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
