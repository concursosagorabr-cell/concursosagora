import type { NextConfig } from "next";

// Em produção na nuvem (Vercel/CI), a verificação de certificados TLS é 100% estrita e obrigatória.
// Apenas no ambiente local de desenvolvimento Windows com interceptação de proxy/antivírus permite fallback.
if (!process.env.VERCEL && !process.env.CI) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'pixabay.com' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'flagcdn.com' },
      { protocol: 'https', hostname: 'commons.wikimedia.org' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
  async redirects() {
    return [
      // ── Consolidação de Canibalização de Palavras-chave (SEO) ──
      {
        source: '/post/concurso-transpetro-2026-4-171-vagas-e-salario-ate-r-15-034-81',
        destination: '/post/transpetro-vagas-2026',
        permanent: true,
      },
      {
        source: '/post/transpetro-2026-vagas',
        destination: '/post/transpetro-vagas-2026',
        permanent: true,
      },
      {
        source: '/post/concurso-prf-vagas',
        destination: '/post/prf-administrativo-vagas',
        permanent: true,
      },
      {
        source: '/concursos-municipais',
        destination: '/hub/concursos-municipais',
        permanent: true,
      },
      {
        source: '/concursos-policiais',
        destination: '/hub/concursos-policiais',
        permanent: true,
      },
      {
        source: '/concursos-tribunais',
        destination: '/hub/concursos-tribunais',
        permanent: true,
      },
      {
        source: '/concursos-bancarios',
        destination: '/hub/concursos-bancarios',
        permanent: true,
      },
      {
        source: '/concursos-fiscais',
        destination: '/hub/concursos-fiscais',
        permanent: true,
      },
      {
        source: '/concursos-saude',
        destination: '/hub/concursos-saude',
        permanent: true,
      },
      {
        source: '/concursos-educacao',
        destination: '/hub/concursos-educacao',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
