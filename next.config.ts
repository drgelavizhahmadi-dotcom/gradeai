import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Increase body size limit to 50MB to support multi-page test uploads
    serverActions: {
      bodySizeLimit: '50mb',
    },
    esmExternals: true, // Enable ES module externals
  },
  // Suppress Node.js deprecation warnings in production
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
};

export default nextConfig;
