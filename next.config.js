const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ajout de la compatibilité pour les packages qui posent souvent problème en App Router
  transpilePackages: ["@livepeer/react", "lucide-react"],
  
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: 'lp-playback.com' },
      { protocol: 'https', hostname: 'livepeer.studio' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'github.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' }, // Recommandé pour les profils
    ],
  },
};

module.exports = withPWA(nextConfig);
