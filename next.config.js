/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export configuration to allow dynamic API routes
  // output: 'export',
  // distDir: 'out',
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['fortecofficial.site', 'fortecai-84d62.netlify.app'],
  },
  // For static export to work with dynamic routes
  trailingSlash: true,
  // Custom domain configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'same-origin',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Let Netlify handle the routing instead
  // async rewrites() {
  //   return [
  //     {
  //       source: '/:path*',
  //       destination: '/',
  //     },
  //   ];
  // },
};

// next.config.js is not statically analyzable, so we need to export it this way for types to work
module.exports = nextConfig;
