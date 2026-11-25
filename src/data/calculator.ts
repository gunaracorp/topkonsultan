/**
 * src/data/calculator.ts — Data Kalkulator Biaya Perizinan (v2.5.0.0.0).
 * ----------------------------------------------------------------------------
 * Estimasi JASA PENDAMPINGAN TOP Konsultan (bukan biaya resmi instansi).
 * Angka adalah rentang awal untuk klien berkas-normal; angka final selalu
 * dikunci dalam penawaran tertulis sebelum eksekusi (prinsip "biaya tetap,
 * kejutan nol" — lihat halaman /pricing).
 *
 * Semua nominal dalam Rupiah penuh (bukan juta) agar bebas ambigu.
 */

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  FileCheck2,
  Globe2,
  Landmark,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

/* --------------------------------- Kategori -------------------------------- */

export interface CalcCategory {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
}

export const CALC_CATEGORIES: CalcCategory[] = [
  {
    id: "pendirian",
    name: "Pendirian & Badan Usaha",
    desc: "PT, PT PMA, CV, yayasan — dari akta notaris hingga pengesahan Kemenkumham.",
    icon: Building2,
  },
  {
    id: "izin-usaha",
    name: "Izin Usaha & NIB",
    desc: "NIB OSS RBA, izin usaha sesuai tingkat risiko, IUMK.",
    icon: FileCheck2,
  },
  {
    id: "sertifikasi",
    name: "Sertifikasi & Standar",
    desc: "SNI produk, ISO mutu, HACCP pangan, sertifikasi halal BPJPH.",
    icon: ShieldCheck,
  },
  {
    id: "sektor",
    name: "Izin Sektor Khusus",
    desc: "Izin edar BPOM, PSE Komdigi, pariwisata, persetujuan lingkungan.",
    icon: ScrollText,
  },
  {
    id: "kepatuhan",
    name: "Kepatuhan & Pajak",
    desc: "Pengukuhan PKP, laporan tahunan badan, due diligence legal.",
    icon: Landmark,
  },
  {
    id: "global",
    name: "Investor Asing & Global",
    desc: "KITAS investor & ahli, market entry, perizinan impor.",
    icon: Globe2,
  },
];

/* --------------------------------- Layanan --------------------------------- */

export interface CalcService {
  id: string;
  cat: string;
  name: string;
  desc: string;
  /** Rentang jasa pendampingan (Rupiah penuh). */
  feeMin: number;
  feeMax: number;
  /** Rentang durasi penanganan (hari kerja, jalur standar). */
  daysMin: number;
  daysMax: number;
  /** Catatan biaya resmi instansi yang ditagih terpisah (bukan jasa TOP). */
  govNote?: string;
  popular?: boolean;
}

export const CALC_SERVICES: CalcService[] = [
  /* Pendirian & badan usaha */
  {
    id: "pt-lokal",
    cat: "pendirian",
    name: "Pendirian PT Lokal",
    desc: "Akta notaris, SK pengesahan Kemenkumham, NIB OSS, NPWP badan — satu paket tuntas.",
    feeMin: 4_500_000,
    feeMax: 8_000_000,
    daysMin: 10,
    daysMax: 20,
    govNote: "Honor notaris & PNBP pengesahan ditagih resmi terpisah.",
    popular: true,
  },
  {
    id: "pt-pma",
    cat: "pendirian",
    name: "Pendirian PT PMA",
    desc: "Badan usaha penanaman modal asing: akta, NIB, pemetaan KBLI, dan rencana investasi.",
    feeMin: 25_000_000,
    feeMax: 55_000_000,
    daysMin: 30,
    daysMax: 60,
    popular: true,
  },
  {
    id: "cv",
    cat: "pendirian",
    name: "Pendirian CV",
    desc: "Commanditaire Vennootschap untuk usaha perorangan/keluarga — akta hingga NIB.",
    feeMin: 3_500_000,
    feeMax: 6_000_000,
    daysMin: 7,
    daysMax: 14,
  },
  {
    id: "yayasan",
    cat: "pendirian",
    name: "Pendirian Yayasan",
    desc: "Badan hukum nirlaba: akta, pengesahan Kemenkumham, NPWP, dan SK Kemenkumham organ.",
    feeMin: 5_000_000,
    feeMax: 9_000_000,
    daysMin: 14,
    daysMax: 25,
  },
  {
    id: "perubahan-akta",
    cat: "pendirian",
    name: "Perubahan Akta / Amendemen",
    desc: "Perubahan direksi, domicile, maksud-tujuan, atau modal — akta hingga pembaruan NIB.",
    feeMin: 3_000_000,
    feeMax: 6_000_000,
    daysMin: 7,
    daysMax: 14,
  },
  /* Izin usaha & NIB */
  {
    id: "nib-oss",
    cat: "izin-usaha",
    name: "NIB via OSS RBA",
    desc: "Nomor Induk Berusaha — identitas tunggal badan usaha di sistem OSS berbasis risiko.",
    feeMin: 1_500_000,
    feeMax: 2_500_000,
    daysMin: 1,
    daysMax: 3,
    popular: true,
  },
  {
    id: "izin-risiko",
    cat: "izin-usaha",
    name: "Izin Usaha Sesuai Tingkat Risiko",
    desc: "Untuk KBLI risiko menengah-tinggi: pernyataan mandiri hingga verifikasi instansi.",
    feeMin: 2_500_000,
    feeMax: 5_000_000,
    daysMin: 5,
    daysMax: 12,
  },
  {
    id: "iumk",
    cat: "izin-usaha",
    name: "Izin Usaha Mikro Kecil (IUMK)",
    desc: "Izin usaha mikro/kecil dari pemerintah daerah — cepat, untuk UMK dan usaha rumahan.",
    feeMin: 1_000_000,
    feeMax: 2_000_000,
    daysMin: 2,
    daysMax: 5,
  },
  {
    id: "sertifikat-standar",
    cat: "izin-usaha",
    name: "Sertifikat Standar (Self-Declare → Terverifikasi)",
    desc: "Sertifikat standar kegiatan usaha untuk KBLI menengah-rendah, termasuk pemeriksaan.",
    feeMin: 4_000_000,
    feeMax: 9_000_000,
    daysMin: 10,
    daysMax: 25,
  },
  /* Sertifikasi & standar */
  {
    id: "sni",
    cat: "sertifikasi",
    name: "Sertifikasi SNI Produk",
    desc: "Pemetaan standard, penyiapan dokumen mutu, koordinasi uji lab, hingga sertifikat terbit.",
    feeMin: 15_000_000,
    feeMax: 40_000_000,
    daysMin: 30,
    daysMax: 60,
    govNote: "Biaya pengujian laboratorium KAN dibayarkan langsung ke lab.",
    popular: true,
  },
  {
    id: "iso-9001",
    cat: "sertifikasi",
    name: "ISO 9001:2015 Sistem Manajemen Mutu",
    desc: "Pendampingan penuh: penyusunan SOP, internal audit, hingga sertifikasi badan penerbit.",
    feeMin: 10_000_000,
    feeMax: 22_000_000,
    daysMin: 20,
    daysMax: 40,
  },
  {
    id: "haccp-22000",
    cat: "sertifikasi",
    name: "HACCP / ISO 22000 Keamanan Pangan",
    desc: "Sistem jaminan keamanan pangan untuk produsen & pengolahan — siap audit ritel modern.",
    feeMin: 8_000_000,
    feeMax: 18_000_000,
    daysMin: 20,
    daysMax: 40,
  },
  {
    id: "halal",
    cat: "sertifikasi",
    name: "Sertifikasi Halal BPJPH",
    desc: "Penyelia halal, dokumen SJPH, audit bersama LPH — untuk produk & fasilitas produksi.",
    feeMin: 5_000_000,
    feeMax: 14_000_000,
    daysMin: 20,
    daysMax: 45,
    govNote: "Tarif audit BPJPH/LPH sesuai skema skala usaha.",
    popular: true,
  },
  /* Izin sektor khusus */
  {
    id: "bpom-pangan",
    cat: "sektor",
    name: "Izin Edar BPOM (Pangan)",
    desc: "Registrasi e-Registration BPOM: komposisi, label, uji pra-registrasi, hingga MD terbit.",
    feeMin: 8_000_000,
    feeMax: 20_000_000,
    daysMin: 20,
    daysMax: 40,
    govNote: "PnBP BPOM & biaya uji lab pra-registrasi dibayar resmi terpisah.",
    popular: true,
  },
  {
    id: "pse",
    cat: "sektor",
    name: "Pendaftaran PSE (Komdigi)",
    desc: "Penyelenggara Sistem Elektronik privat/umum — kepatuhan domain, data & pelaporan.",
    feeMin: 3_000_000,
    feeMax: 7_000_000,
    daysMin: 5,
    daysMax: 14,
  },
  {
    id: "pariwisata",
    cat: "sektor",
    name: "Izin Usaha Pariwisata & Travel",
    desc: "BUUP travel, biro perjalanan, atau agen — termasuk asuransi & legalitas dukung.",
    feeMin: 4_000_000,
    feeMax: 9_000_000,
    daysMin: 10,
    daysMax: 20,
  },
  {
    id: "lingkungan",
    cat: "sektor",
    name: "Persetujuan Lingkungan (UKL-UPL / AMDAL)",
    desc: "Dokumen lingkungan + pernyataan kesanggupan pengelolaan untuk fasilitas & pabrik.",
    feeMin: 6_000_000,
    feeMax: 15_000_000,
    daysMin: 20,
    daysMax: 45,
  },
  /* Kepatuhan & pajak */
  {
    id: "pkp",
    cat: "kepatuhan",
    name: "Pengukuhan Pengusaha Kena Pajak (PKP)",
    desc: "Persiapan tempat & berkas, pengajuan pengukuhan, sinkron faktur pajak digital.",
    feeMin: 2_500_000,
    feeMax: 5_000_000,
    daysMin: 3,
    daysMax: 8,
  },
  {
    id: "laporan-tahunan",
    cat: "kepatuhan",
    name: "Kepatuhan Laporan Pajak Tahunan Badan",
    desc: "Penghubung SPT tahunan, rekonsiliasi fiskal, dan pengingat jadwal selama setahun.",
    feeMin: 3_000_000,
    feeMax: 8_000_000,
    daysMin: 5,
    daysMax: 10,
  },
  {
    id: "due-diligence",
    cat: "kepatuhan",
    name: "Due Diligence Legal & Perizinan",
    desc: "Audit status legal sebelum akuisisi/pendanaan: izin, sengketa, beban, kepatuhan.",
    feeMin: 10_000_000,
    feeMax: 25_000_000,
    daysMin: 10,
    daysMax: 20,
  },
  /* Investor asing & global */
  {
    id: "kitas-investor",
    cat: "global",
    name: "KITAS Investor Terbatas",
    desc: "Izin tinggal investor: pengawasan rencana investasi, telex, e-VOA hingga BTN.",
    feeMin: 6_000_000,
    feeMax: 12_000_000,
    daysMin: 10,
    daysMax: 15,
    govNote: "Pungutan imigrasi (telex/visa/BTN) dibayarkan resmi ke instansi.",
    popular: true,
  },
  {
    id: "kitas-kerja",
    cat: "global",
    name: "KITAS / KITAP Kerja Ahli",
    desc: "Izin kerja tenaga asing (RPTKA) + izin tinggal — untuk direksi asing & tenaga ahli.",
    feeMin: 5_000_000,
    feeMax: 10_000_000,
    daysMin: 10,
    daysMax: 15,
  },
  {
    id: "market-entry",
    cat: "global",
    name: "Market Entry & Perizinan Impor",
    desc: "Riset KBLI, struktur badan usaha, API-U/API-P, dan izin impor end-to-end.",
    feeMin: 15_000_000,
    feeMax: 40_000_000,
    daysMin: 20,
    daysMax: 45,
  },
];

/* -------------------------------- Kecepatan -------------------------------- */

export interface CalcSpeed {
  id: string;
  name: string;
  /** Pengali jasa pendampingan. */
  mult: number;
  /** Faktor pengali durasi. */
  daysFactor: number;
  note: string;
}

export const CALC_SPEEDS: CalcSpeed[] = [
  {
    id: "standar",
    name: "Standar",
    mult: 1,
    daysFactor: 1,
    note: "Jalur reguler — paling ekonomis, cocok untuk perencanaan matang.",
  },
  {
    id: "cepat",
    name: "Cepat",
    mult: 1.3,
    daysFactor: 0.7,
    note: "Antrean internal diprioritaskan; dokumen disusun paralel.",
  },
  {
    id: "prioritas",
    name: "Prioritas Dewan",
    mult: 1.7,
    daysFactor: 0.5,
    note: "Satu Dewan Pakar mengawal kasus Anda penuh waktu sampai tuntas.",
  },
];

/* --------------------------------- Helper ---------------------------------- */

export function calcServicesIn(cat: string): CalcService[] {
  return CALC_SERVICES.filter((s) => s.cat === cat);
}

export function findCalcService(id: string): CalcService | undefined {
  return CALC_SERVICES.find((s) => s.id === id);
}

export function findCalcCategory(id: string): CalcCategory | undefined {
  return CALC_CATEGORIES.find((c) => c.id === id);
}

export function findCalcSpeed(id: string): CalcSpeed {
  return CALC_SPEEDS.find((s) => s.id === id) ?? CALC_SPEEDS[0];
}

/** Format angka Rupiah tanpa desimal: 4500000 → "4.500.000". */
export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);
}

export interface CalcEstimate {
  feeMin: number;
  feeMax: number;
  daysMin: number;
  daysMax: number;
}

/** Hitung estimasi jasa pendampingan + durasi untuk kombinasi layanan & kecepatan. */
export function estimateCalc(service: CalcService, speed: CalcSpeed): CalcEstimate {
  const round = (n: number) => Math.max(500_000, Math.round(n / 500_000) * 500_000);
  return {
    feeMin: round(service.feeMin * speed.mult),
    feeMax: round(service.feeMax * speed.mult),
    daysMin: Math.max(1, Math.round(service.daysMin * speed.daysFactor)),
    daysMax: Math.max(2, Math.round(service.daysMax * speed.daysFactor)),
  };
}
