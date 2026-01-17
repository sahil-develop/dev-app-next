import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '110mb',
    },
  },
  // Allow serving files from /public/uploads
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
          { key: 'Accept-Ranges', value: 'bytes' },
        ],
      },
    ];
  },
};

export default nextConfig;
