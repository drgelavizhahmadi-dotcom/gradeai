import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Increase body size limit to 50MB to support multi-page test uploads
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
