/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['api.dicebear.com', 'raw.githubusercontent.com'],
  },
  // Empêche la mise en cache infinie des requêtes API GitHub
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
