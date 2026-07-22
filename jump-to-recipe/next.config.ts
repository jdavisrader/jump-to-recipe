import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    // Only run ESLint on these directories during production builds
    // Ignore errors during Docker build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even with type errors
    // You should still fix these in development
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // Common recipe websites
      {
        protocol: 'https',
        hostname: 'joyfoodsunshine.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.allrecipes.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'food.fnr.sndimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.foodnetwork.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.kingarthurbaking.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.seriouseats.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.bbcgoodfood.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.immediate.co.uk',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.tasteofhome.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.delish.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'hips.hearstapps.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.recipetineats.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.simplyrecipes.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.bonappetit.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.bonappetit.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raderfamilyfarms.com',
        pathname: '/**',
      },
      // Generic patterns for common CDNs
      {
        protocol: 'https',
        hostname: '*.wp.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
        pathname: '/**',
      },
    ],
  },
  // Baseline security headers (transport-agnostic, safe over HTTP).
  // Deferred until HTTPS is set up: Strict-Transport-Security (HSTS).
  // Deferred to a dedicated effort: Content-Security-Policy (needs nonce
  // handling for Next.js inline scripts to enforce without breaking hydration).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;