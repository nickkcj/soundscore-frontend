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
        hostname: 'wessmnaqfgfdyigckcni.supabase.co', // Supabase storage
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Fallback images
      },
    ],
  },
};

export default nextConfig;
