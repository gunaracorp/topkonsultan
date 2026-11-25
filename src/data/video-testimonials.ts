/**
 * src/data/video-testimonials.ts — Testimoni Video (v2.5.0.0.0).
 * ----------------------------------------------------------------------------
 * Setiap entri diputar sebagai "testimoni sinematik kinetik": narasi kutipan
 * klien yang dianimasikan baris demi baris dengan kontrol pemutar penuh
 * (play/pause, lini sebelumnya/berikutnya, putar ulang, progres).
 *
 * Bidang `videoUrl` disediakan sebagai slot: begitu footage asli tersedia,
 * cukup isi URL berkas video — pemutar akan memutarnya tanpa mengubah UI.
 */

export interface VideoTestimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  country: string;
  /** Layanan TOP yang ditangani untuk klien ini. */
  service: string;
  /** 1–5. */
  rating: number;
  /** Durasi tayang dalam detik. */
  duration: number;
  /** Skema warna poster & pemutar. */
  accent: "violet" | "indigo" | "blue" | "fuchsia";
  /** Baris narasi; `caption` = terjemahan Indonesia (untuk narasi asing). */
  lines: { text: string; caption?: string }[];
  /** true untuk narasi beraksen kanan-ke-kiri (mis. Arab). */
  rtl?: boolean;
  /** Label bahasa narasi (tampil sebagai chip). */
  langLabel?: string;
  /** Slot footage asli — bila terisi, pemutar memutar video sungguhan. */
  videoUrl?: string;
}

export const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  {
    id: "budi-santoso",
    name: "Budi Santoso",
    role: "Direktur Utama",
    company: "PT Jamu Sejahtera Nusantara",
    country: "Indonesia",
    service: "Sertifikasi Halal BPJPH + Izin Edar BPOM",
    rating: 5,
    duration: 66,
    accent: "violet",
    lines: [
      { text: "Produk kami sudah dipercaya dua belas tahun." },
      { text: "Tapi pasar modern menuntut dua kunci: halal dan izin edar." },
      { text: "TOP datang membawa jadwal — bukan sekadar janji." },
      { text: "Sertifikat halal BPJPH: terbit." },
      { text: "Izin edar BPOM: terbit." },
      { text: "Kini rak kami membentang lintas ASEAN." },
      { text: "Itu bukan keberuntungan. Itu rekayasa." },
    ],
  },
  {
    id: "sarah-mitchell",
    name: "Sarah Mitchell",
    role: "Regional Director, APAC",
    company: "Norske Foods International",
    country: "Singapura",
    service: "Pendirian PT PMA + KITAS Investor",
    rating: 5,
    duration: 58,
    accent: "blue",
    langLabel: "English",
    lines: [
      {
        text: "Indonesia was our hardest market on paper.",
        caption: "Di atas kertas, Indonesia adalah pasar tersulit kami.",
      },
      {
        text: "One word from our legal team: maze.",
        caption: "Satu kata dari tim hukum kami: labirin.",
      },
      {
        text: "TOP brought a map — and a schedule.",
        caption: "TOP datang membawa peta — dan jadwal.",
      },
      {
        text: "Our PT PMA stood legally in thirty-eight days.",
        caption: "PT PMA kami berdiri sah dalam tiga puluh delapan hari.",
      },
      {
        text: "Two investor KITAS followed.",
        caption: "Dua KITAS investor menyusul segera.",
      },
      {
        text: "Our board now asks one question:",
        caption: "Dewan kami kini hanya bertanya satu hal:",
      },
      {
        text: "Why isn't every market entry this clean?",
        caption: "Mengapa tidak semua market entry semulus ini?",
      },
    ],
  },
  {
    id: "tanaka-misaki",
    name: "田中美咲",
    role: "General Manager",
    company: "Sakura Foods Corporation",
    country: "Jepang",
    service: "Izin Edar BPOM Pangan Impor",
    rating: 5,
    duration: 54,
    accent: "indigo",
    langLabel: "日本語",
    lines: [
      {
        text: "インドネシアの食品規制は、迷路のようでした。",
        caption: "Regulasi pangan Indonesia terasa seperti labirin bagi kami.",
      },
      {
        text: "TOPの理事会は、地図を持っていました。",
        caption: "Dewan TOP datang membawa peta.",
      },
      {
        text: "必要な書類。正しい順序。明確な期限。",
        caption: "Dokumen yang tepat. Urutan yang benar. Tenggat yang jelas.",
      },
      {
        text: "インポーター許可も、BPOM登録も。",
        caption: "Izin impor maupun registrasi BPOM — semuanya.",
      },
      {
        text: "今、ジャカルタの棚に私たちの製品が並んでいます。",
        caption: "Kini produk kami berjajar di rak-rak Jakarta.",
      },
      {
        text: "これは幸運ではなく、設計の結果です。",
        caption: "Ini bukan keberuntungan — ini hasil dari perancangan.",
      },
    ],
  },
  {
    id: "rania-al-azm",
    name: "رانيا العزم",
    role: "Chief Executive Officer",
    company: "Levant Bright Trading",
    country: "Uni Emirat Arab",
    service: "Market Entry & Perizinan Impor",
    rating: 5,
    duration: 62,
    accent: "fuchsia",
    rtl: true,
    langLabel: "العربية",
    lines: [
      {
        text: "خمسة تراخيص. دولة واحدة. صفر مفاجآت.",
        caption: "Lima perizinan. Satu negara. Nol kejutan.",
      },
      {
        text: "فريق TOP حوّل البيروقراطية إلى قائمة أنيقة.",
        caption: "Tim TOP mengubah birokrasi menjadi daftar periksa yang elegan.",
      },
      {
        text: "كل خطوة موثقة، وكل موعد محترم.",
        caption: "Setiap langkah terdokumentasi, setiap tenggat dihormati.",
      },
      {
        text: "مكتبنا في جاكرتا انطلق قبل الموعد.",
        caption: "Kantor kami di Jakarta beroperasi lebih cepat dari jadwal.",
      },
      {
        text: "أمام أي مجلس إدارات، أكرر الجملة نفسها:",
        caption: "Di depan dewan direksi mana pun, saya mengulang kalimat yang sama:",
      },
      {
        text: "هذه شراكة نفتخر بها.",
        caption: "Ini adalah kemitraan yang kami banggakan.",
      },
    ],
  },
];
