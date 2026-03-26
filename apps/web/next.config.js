/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sononews/shared'],
  output: 'standalone', // Optimize for Railway deployment

  // Disable static optimization to prevent prerender errors
  experimental: {
    optimizeCss: false,
  },
};

module.exports = nextConfig;
