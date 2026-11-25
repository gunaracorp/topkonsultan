import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* Pemeriksaan tipe kini AKTIF — semua error tS sudah dibereskan (v2.5.1.0.0). */
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
};

export default nextConfig;
