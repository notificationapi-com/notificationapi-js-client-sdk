/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  assetPrefix: '/notificationapi-js-client-sdk/nextts-live/',
  images: {
    unoptimized: true
  }
};

export default nextConfig;
