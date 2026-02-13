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
  // Bloc expérimental nettoyé pour éviter les erreurs de build
  experimental: {
    serverComponentsExternalPackages: ['bcrypt'],
  },
  images: {
    // Liste consolidée des domaines autorisés
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
