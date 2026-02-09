/** @type {import('next').NextConfig} */
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours de cache
    },
  },
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    // Ajout des domaines pour les avatars et les couvertures
    domains: [
      'api.dicebear.com', 
      'raw.githubusercontent.com', 
      'avatars.githubusercontent.com'
    ],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default withPWA(nextConfig);
