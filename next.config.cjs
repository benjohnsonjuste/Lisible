// next.config.cjs
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@livepeer/react", "lucide-react"],
  
  images: {
    // Activation des formats modernes pour une vitesse incroyable
    formats: ['image/avif', 'image/webp'],
    // Unification des domaines autorisés
    domains: [
      "raw.githubusercontent.com", 
      "lp-playback.com", 
      "livepeer.studio",
      "api.dicebear.com",
      "github.com"
    ],
  },
};

module.exports = withPWA(nextConfig);
