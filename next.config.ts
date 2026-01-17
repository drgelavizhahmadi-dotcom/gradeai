import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Increase body size limit to 15MB (larger than our 10MB limit for safety)
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
};

export default nextConfig;
