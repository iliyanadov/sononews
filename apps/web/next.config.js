/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sononews/shared'],
  output: 'standalone', // Optimize for Vercel deployment
};

module.exports = nextConfig;
