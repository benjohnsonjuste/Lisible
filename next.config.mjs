/** @type {import('next').NextConfig} */
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  reactStrictMode: true,
  // Force le runtime Edge pour toutes les routes (requis par Cloudflare Pages)
  experimental: {
    runtime: 'edge',
  },
  images: {
    domains: [
      'api.dicebear.com', 
      'raw.githubusercontent.com', 
      'avatars.githubusercontent.com',
      'res.cloudinary.com'
    ],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default withPWA(nextConfig);
