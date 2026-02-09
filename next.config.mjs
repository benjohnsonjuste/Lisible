/** @type {import('next').NextConfig} */
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  // Suppression du bloc workboxOptions.expiration erroné
  // Le plugin gère déjà une mise en cache par défaut très efficace
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    // Liste consolidée des domaines autorisés
    domains: [
      'api.dicebear.com', 
      'raw.githubusercontent.com', 
      'avatars.githubusercontent.com',
      'res.cloudinary.com' // Recommandé si tu héberges des couvertures plus tard
    ],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default withPWA(nextConfig);
