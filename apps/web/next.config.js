/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sononews/shared'],
  output: 'standalone', // Optimize for Railway deployment

  // Fix React 19 compatibility during build
  // Disable static optimization to prevent prerender errors
  staticPageGenerationTimeout: 1,
};

module.exports = nextConfig;
