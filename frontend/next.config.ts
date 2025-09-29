/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/public/**',
      },
      {
        protocol: 'http',
        hostname: 'backend',
        port: '3000',
        pathname: '/public/**',
      },
      // --- BLOCO ADICIONADO PARA O GOOGLE STORAGE ---
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/pub-system-media-storage/**', // IMPORTANTE: Confirme que este é o nome exato do seu bucket
      },
    ],
  },
};

module.exports = nextConfig;