import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
      // ══════════════════════════════════════════════════════════════
      // 1. ROTAS ESTRUTURAIS — typos e variantes comuns que geram 404
      // ══════════════════════════════════════════════════════════════
      {
        source: '/noticia',
        destination: '/noticias',
        permanent: true,
      },
      {
        source: '/posts',
        destination: '/noticias',
        permanent: true,
      },
      {
        source: '/blog',
        destination: '/noticias',
        permanent: true,
      },
      {
        source: '/concurso',
        destination: '/concursos',
        permanent: true,
      },
      {
        source: '/categoria',
        destination: '/concursos',
        permanent: true,
      },
      {
        source: '/sobre',
        destination: '/sobre-nos',
        permanent: true,
      },
      {
        source: '/about',
        destination: '/sobre-nos',
        permanent: true,
      },

      // ══════════════════════════════════════════════════════════════
      // 2. SLUGS COM TRÁFEGO NO GA QUE RETORNAM 404
      //    Detectados via teste de URLs em 27/08/2026
      // ══════════════════════════════════════════════════════════════

      // Câmara Municipal de Maringá — GA mostra tráfego em slug longo que não existe
      {
        source: '/post/concurso-camara-municipal-de-maringa',
        destination: '/post/concurso-maringa-pr',
        permanent: true,
      },
      {
        source: '/post/concurso-camara-maringa',
        destination: '/post/concurso-maringa-pr',
        permanent: true,
      },

      // PRF Administrativo — GA top page com slug "concurso-prf-administrativo-2026"
      {
        source: '/post/concurso-prf-administrativo-2026',
        destination: '/post/prf-administrativo-vagas',
        permanent: true,
      },
      {
        source: '/post/concurso-prf-vagas',
        destination: '/post/prf-administrativo-vagas',
        permanent: true,
      },
      {
        source: '/post/concurso-prf-2026',
        destination: '/post/prf-administrativo-vagas',
        permanent: true,
      },

      // TRT-8 — slug curto "concurso-trt-8-2026" gera 404 (artigo pilar tem slug longo)
      {
        source: '/post/concurso-trt-8-2026',
        destination: '/post/concurso-trt-8-2026-vagas-salarios-e-provas-discursivas',
        permanent: true,
      },
      {
        source: '/post/concurso-trt-8',
        destination: '/post/concurso-trt-8-2026-vagas-salarios-e-provas-discursivas',
        permanent: true,
      },

      // SEDUC PA — GA mostra tráfego, mas slug "concurso-seduc-pa-2026" não existe
      {
        source: '/post/concurso-seduc-pa-2026',
        destination: '/post/concurso-seduc-pa-2026-vagas-salarios-e-edital-da-fgv',
        permanent: true,
      },
      {
        source: '/post/seduc-pa-2026',
        destination: '/post/concurso-seduc-pa-2026-vagas-salarios-e-edital-da-fgv',
        permanent: true,
      },

      // Transpetro — slug genérico "concurso-transpetro-2026" gera 404
      {
        source: '/post/concurso-transpetro-2026',
        destination: '/post/transpetro-vagas-2026',
        permanent: true,
      },
      {
        source: '/post/concurso-transpetro',
        destination: '/post/transpetro-vagas-2026',
        permanent: true,
      },

      // ══════════════════════════════════════════════════════════════
      // 3. CONSOLIDAÇÃO DE CANIBALIZAÇÃO — slugs duplicados → pilar
      // ══════════════════════════════════════════════════════════════

      // Transpetro: variantes → artigo pilar
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

      // TRT-8: variantes antigas → artigo pilar
      {
        source: '/post/concurso-trt-8-fcc-organiza-salarios-ate-r-16-mil-veja-vagas',
        destination: '/post/concurso-trt-8-2026-vagas-salarios-e-provas-discursivas',
        permanent: true,
      },
      {
        source: '/post/concurso-trt-8-ate-92-vagas-salarios-de-ate-r-16-mil-veja-detalhes',
        destination: '/post/concurso-trt-8-2026-vagas-salarios-e-provas-discursivas',
        permanent: true,
      },
      {
        source: '/post/trt-8-banca-fcc-confirmada-salarios-ate-r-16-mil-veja-detalhes-do-certame',
        destination: '/post/concurso-trt-8-2026-vagas-salarios-e-provas-discursivas',
        permanent: true,
      },
      {
        source: '/post/concurso-trt-8-banca-fcc-confirmada-vagas-ainda-sem-numero-veja-detalhes',
        destination: '/post/concurso-trt-8-2026-vagas-salarios-e-provas-discursivas',
        permanent: true,
      },
      {
        source: '/post/concurso-trt-8-fcc-ja-e-banca-vagas-e-salarios-ainda-em-fase-de-definicao',
        destination: '/post/concurso-trt-8-2026-vagas-salarios-e-provas-discursivas',
        permanent: true,
      },
      {
        source: '/post/concurso-trt-8-1-vaga-e-cadastro-de-reserva',
        destination: '/post/concurso-trt-8-2026-vagas-salarios-e-provas-discursivas',
        permanent: true,
      },
      {
        source: '/post/concurso-trt-8-103-vagas-para-tecnico-e-analista-judiciario',
        destination: '/post/concurso-trt-8-2026-vagas-salarios-e-provas-discursivas',
        permanent: true,
      },

      // ══════════════════════════════════════════════════════════════
      // 4. HUBS — atalhos sem /hub/ prefix
      // ══════════════════════════════════════════════════════════════
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
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://va.vercel-scripts.com https://partner.googleadservices.com https://tpc.googlesyndication.com https://adservice.google.com https://www.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://cdn.sanity.io https://*.google.com https://*.doubleclick.net https://pagead2.googlesyndication.com https://*.googleadservices.com https://*.googlesyndication.com https://pixabay.com https://cdn.pixabay.com https://images.unsplash.com https://images.pexels.com https://flagcdn.com https://upload.wikimedia.org https://commons.wikimedia.org",
              "connect-src 'self' https://*.sanity.io https://*.sanity.work https://*.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://*.doubleclick.net https://pagead2.googlesyndication.com https://*.upstash.io",
              "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://*.google.com",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
