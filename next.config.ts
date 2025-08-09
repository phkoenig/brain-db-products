import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: ['@subframe/core'],
  },
  // ESLint-Konfiguration für Production-Builds
  eslint: {
    // Warnungen statt Fehler in Production
    ignoreDuringBuilds: true,
  },
  // TypeScript-Konfiguration
  typescript: {
    // TypeScript-Fehler als Warnungen behandeln
    ignoreBuildErrors: true,
  },
  // Rewrite-Regel für APS Viewer ACM Session
  async rewrites() {
    return [
      {
        source: '/oss-ext/v2/acmsessions',
        destination: '/api/oss-ext/v2/acmsessions'
      }
    ];
  },
  // Neue Turbopack-Konfiguration (stabil)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
    resolveAlias: {
      '@': './src',
    },
  },
  // Webpack-Fallback für Production
  webpack: (config, { dev, isServer }) => {
    // Nur in Production oder wenn Turbopack nicht aktiv ist
    if (!dev || process.env.TURBOPACK !== '1') {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': require('path').resolve(__dirname, 'src'),
      };
    }
    return config;
  },
};

export default nextConfig;
