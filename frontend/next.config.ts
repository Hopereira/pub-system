/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ CORREÇÃO: Habilita output standalone para Docker otimizado
  // Gera uma pasta .next/standalone com servidor Node.js mínimo
  output: 'standalone',

  // Ignorar erros de ESLint durante o build (warnings não bloqueiam)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignorar erros de TypeScript durante o build
  typescript: {
    ignoreBuildErrors: true,
  },
  // A sua configuração de imagens que você me mostrou. Está correta.
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
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/pub-system-media-storage/**',
      },
    ],
  },

  // ✅ ADIÇÃO AQUI: Esta é a parte que estabiliza o ambiente Docker
  webpack: (config: { watchOptions: { poll: number; aggregateTimeout: number } }) => {
    config.watchOptions = {
      poll: 1000, // Verifica por alterações a cada segundo
      aggregateTimeout: 300, // Agrupa múltiplas alterações num único rebuild
    };
    return config;
  },
};

module.exports = nextConfig;
