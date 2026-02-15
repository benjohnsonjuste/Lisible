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
  // Indique à Next.js où mettre les fichiers de build
  distDir: '.next',
  
  // Bloc expérimental pour bcrypt et les fonctions edge
  experimental: {
    serverComponentsExternalPackages: ['bcrypt'],
  },

  images: {
    // Liste consolidée des domaines autorisés via remotePatterns (plus sécurisé et flexible)
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' } // Pour les images de profil Google si besoin
    ],
    // Rétrocompatibilité
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

  // Optionnel mais recommandé pour les déploiements Cloudflare/Vercel
  output: 'standalone', 
};

export default withPWA(nextConfig);
