import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    /** 
     * 🚫 This prevents ESLint errors from failing `next build`
     * Useful temporarily while fixing things.
     */
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
