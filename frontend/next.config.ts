/** @type {import('next').NextConfig} */
const nextConfig = {
  // SECURITY: Erros de ESLint e TypeScript agora bloqueiam o build
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Desabilitar trailing slash para evitar problemas de redirecionamento
  trailingSlash: false,
  
  // Desabilitar redirecionamentos automáticos do Next.js
  skipTrailingSlashRedirect: true,

  // ✅ SEGURANÇA: Headers de segurança para produção
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
        ],
      },
    ];
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

};

module.exports = nextConfig;
