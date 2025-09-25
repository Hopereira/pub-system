/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
  // ADICIONE ESTA SEÇÃO COMPLETA
=======
>>>>>>> d738c0d94244b2141347abcc7b7f1cd9a5c54292
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
<<<<<<< HEAD
        pathname: '/**', // Permite qualquer imagem dentro do servidor
      },
=======
        pathname: '/public/**',
      },
      {
        protocol: 'http',
        hostname: 'backend',
        port: '3000',
        pathname: '/public/**',
      }
>>>>>>> d738c0d94244b2141347abcc7b7f1cd9a5c54292
    ],
  },
};

module.exports = nextConfig;