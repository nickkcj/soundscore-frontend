import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co', // Spotify album covers
      },
      {
        protocol: 'https',
        hostname: 'wessmnaqfgfdyigckcni.supabase.co', // Supabase storage (old)
      },
      {
        protocol: 'https',
        hostname: 'cksowdtecwjbwirzjlnf.supabase.co', // Supabase storage (US-WEST)
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Fallback images
      },
      {
        protocol: 'https',
        hostname: 'soundscore-2.s3.amazonaws.com', // AWS S3 storage
      },
    ],
  },
};

export default nextConfig;
