/**
 * src/lib/qris.ts — Mesin QRIS dinamis isomorfik (client & server).
 * ----------------------------------------------------------------------------
 * Membangun string payload QRIS (standar EMVCo yang diadopsi Bank Indonesia)
 * dengan nominal tertanam (tag 54) dan nomor invoice sebagai referensi
 * transaksi (tag 62.01), lalu mengunci integritasnya dengan CRC16-CCITT.
 *
 * Karena murni TypeScript tanpa import apa pun, modul ini aman dipakai:
 *   - server: /api/invoice, /api/qris
 *   - client: halaman /payment (pratinjau QR nominal) dan /invoice
 *
 * Sifat "dinamis" berasal dari Point of Initiation Method "12" (tag 01) —
 * aplikasi pemindai akan mengisi nominal otomatis sesuai tag 54.
 */

/* ================================ CRC16-CCITT ================================ */

/**
 * CRC-16/CCITT-FALSE — polynomial 0x1021, init 0xFFFF, tanpa refleksi,
 * tanpa final XOR. Inilah algoritma wajib tag 63 pada QRIS.
 */
export function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/* ============================== PEMBANGUN TLV =============================== */

/** Satu pasangan Tag-Length-Value sesuai spesifikasi EMVCo QR. */
function tlv(tag: string, value: string): string {
  if (value.length > 99) throw new Error(`tlv_too_long:${tag}`);
  return `${tag}${String(value.length).padStart(2, "0")}${value}`;
}

/** Batas panjang field sesuai spesifikasi QRIS. */
const MAX_MERCHANT_NAME = 25;
const MAX_CITY = 15;
const MAX_REFERENCE = 25;

/* ============================ PAYLOAD QRIS DINAMIS ========================== */

export interface QrisDynamicInput {
  /** Nominal dalam Rupiah penuh (tanpa sen) — QRIS selalu settle IDR. */
  amountIdr: number;
  /** Referensi transaksi (nomor invoice / tiket) — tampil di struk pemindai. */
  reference: string;
  /** NMID merchant terdaftar ASPI (15 karakter, diawali "ID"). */
  nmid: string;
  /** Nama tampilan merchant (maks 25 karakter). */
  merchantName?: string;
  /** Kota merchant (maks 15 karakter). */
  city?: string;
  /** Merchant Category Code — 8742 = konsultan manajemen. */
  mcc?: string;
}

/** Normalisasi string ke charset QRIS (uppercase alfanumerik + spasi + titik). */
function qrisSafe(s: string, max: number): string {
  return s
    .normalize("NFKD")
    .replace(/[^\w .-]/g, "")
    .toUpperCase()
    .slice(0, max);
}

/**
 * Bangun string payload QRIS dinamis lengkap dengan CRC16.
 * Struktur: 00|01|26|52|53|54|58|59|60|62|63 sesuai spesifikasi QRIS nasional.
 */
export function buildQrisDynamicPayload(input: QrisDynamicInput): string {
  const amount = Math.max(0, Math.round(input.amountIdr));
  if (!Number.isFinite(amount) || amount > 99_999_999_999) {
    throw new Error("amount_invalid");
  }
  if (!/^[A-Z0-9]{8,25}$/.test(input.reference)) {
    throw new Error("reference_invalid");
  }
  if (!/^[A-Z0-9]{15}$/.test(input.nmid)) {
    throw new Error("nmid_invalid");
  }

  const merchantAccount =
    tlv("00", "ID") + // GUI — Indonesia
    tlv("01", "QRIS") + // Penyelenggara QRIS
    tlv("02", input.nmid); // National Merchant ID

  const additionalData = tlv("01", input.reference.slice(0, MAX_REFERENCE));

  let payload =
    tlv("00", "01") + // Payload Format Indicator — wajib "01"
    tlv("01", "12") + // Point of Initiation — 12 = DINAMIS (nominal tertanam)
    tlv("26", merchantAccount) + // Informasi akun merchant
    tlv("52", input.mcc ?? "8742") + // MCC: konsultan manajemen
    tlv("53", "360") + // Mata uang IDR (ISO 4217 numeric)
    tlv("54", `${amount}.00`) + // Nominal (dua desimal wajib)
    tlv("58", "ID") + // Negara
    tlv("59", qrisSafe(input.merchantName ?? "PUSATPERIZINAN.COM", MAX_MERCHANT_NAME)) +
    tlv("60", qrisSafe(input.city ?? "JAKARTA", MAX_CITY)) +
    tlv("62", additionalData); // Data tambahan: nomor invoice
  payload += "6304"; // CRC placeholder — dihitung termasuk tag ini

  return payload + crc16(payload);
}

/* =============================== VALIDASI =================================== */

/** Panjang payload QRIS yang masuk akal (semua tag inti terisi). */
const MIN_PAYLOAD_LEN = 60;
const MAX_PAYLOAD_LEN = 400;

/**
 * Validasi string payload QRIS: format umum, charset, dan CRC16.
 * Dipakai /api/qris supaya endpoint tidak menjadi generator QR bebas.
 */
export function isValidQrisPayload(payload: string): boolean {
  if (typeof payload !== "string") return false;
  if (payload.length < MIN_PAYLOAD_LEN || payload.length > MAX_PAYLOAD_LEN) return false;
  if (!/^[0-9A-Z.]+$/.test(payload)) return false;
  const body = payload.slice(0, -4);
  const crc = payload.slice(-4);
  if (!body.endsWith("6304")) return false;
  try {
    return crc16(body) === crc;
  } catch {
    return false;
  }
}
