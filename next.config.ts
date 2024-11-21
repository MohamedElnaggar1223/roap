import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'roap.co',
      },
      {
        protocol: 'https',
        hostname: 'ppkbrqxaahbpfimifxng.supabase.co'
      },
    ],
  },
};

export default nextConfig;
