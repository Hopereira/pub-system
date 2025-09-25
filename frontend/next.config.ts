/** @type {import('next').NextConfig} */
const nextConfig = {
  // ADICIONE ESTA SEÇÃO COMPLETA
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**', // Permite qualquer imagem dentro do servidor
      },
    ],
  },
};

module.exports = nextConfig;