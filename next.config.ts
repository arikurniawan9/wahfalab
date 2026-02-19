import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Remove console.log in production
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Production optimizations
  poweredByHeader: false,
  compress: true,

  // Turbopack configuration (Next.js 16+)
  turbopack: {
    resolveAlias: {
      // Tree shaking optimizations
    },
  },

  // Webpack configuration (for backwards compatibility)
  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      // Tree shaking for lodash
      config.optimization.usedExports = true;
    }
    return config;
  },
};

export default nextConfig;
