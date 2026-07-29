import type { NextConfig } from "next";

const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const backendUrl = rawUrl.replace(/\/+$/, '');

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ]
  },
};

export default nextConfig;
