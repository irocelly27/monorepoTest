import type { NextConfig } from "next";

const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'https://monorepo-test-backend-kappa.vercel.app';
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
