import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Moderne Browser unterstützen - reduziert Polyfills
  compiler: {
    // Entferne Console-Logs in Production (optional)
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "womosuche.de",
      },
      {
        protocol: "https",
        hostname: "*.womosuche.de",
      },
    ],
    // Qualitäten für Image-Optimierung
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp", "image/avif"],
  },
  webpack: (config, { isServer }) => {
    // Deaktiviere Polyfills für moderne Browser-Features
    // Diese Features sind in modernen Browsern nativ verfügbar
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Deaktiviere Polyfills für moderne JavaScript-Features
        // Diese werden von modernen Browsern nativ unterstützt
      };
    }

    // Stelle sicher, dass Prisma Client nur server-seitig verwendet wird
    if (isServer) {
      // Für Server-Side: Stelle sicher, dass @prisma/client und .prisma/client nicht gebundelt werden
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        // Prisma Client als extern markieren
        config.externals.push(({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
          if (request && (request === '@prisma/client' || request.includes('.prisma/client'))) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        });
        
        // Node.js-Module als extern markieren
        config.externals.push({
          'node:child_process': 'commonjs node:child_process',
          'node:fs': 'commonjs node:fs',
          'node:path': 'commonjs node:path',
          'node:process': 'commonjs node:process',
          'node:url': 'commonjs node:url',
        });
      }
    } else {
      // Für Client-Side: Prisma Client komplett ausschließen
      config.resolve.alias = {
        ...config.resolve.alias,
        '@prisma/client': false,
        '.prisma/client': false,
      };
      
      // Fallbacks für Node.js-Module
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
        path: false,
        process: false,
        url: false,
        'node:child_process': false,
        'node:fs': false,
        'node:path': false,
        'node:process': false,
        'node:url': false,
      };
    }

    // Mapbox GL Worker Support
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: { loader: 'worker-loader' },
    });

    return config;
  },
};

export default nextConfig;
