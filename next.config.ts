import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  // Disabled temporarily to debug multiple POST requests issue
  reactStrictMode: false,

  // Remove console.log in production
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allow all external image URLs
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Production optimizations
  poweredByHeader: false,
  compress: true,

  // Server Actions configuration
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

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

export default withSentryConfig(nextConfig, {
  // Suppresses source map uploading logs during bundling
  silent: true,
  org: "wahfalab",
  project: "javascript-nextjs",
  
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Routes HTTP requests through "Monitoring" to avoid ad-blockers
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
