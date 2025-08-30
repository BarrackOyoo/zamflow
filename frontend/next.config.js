/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {}, // must be an object, not a boolean
  },
  outputFileTracingRoot: './frontend', // helps with workspace root detection
}

module.exports = nextConfig
