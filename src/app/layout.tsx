import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieBanner from '@/components/CookieBanner';
import { sanityFetch } from '@/lib/sanity';
import { allCategoriesQuery } from '@/lib/queries';
import { SITE_CONFIG, SOCIAL_LINKS } from '@/lib/constants';
import { Category } from '@/types';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://concursosagora.com.br'),
  title: {
    default: 'Concursos Agora — Portal de Notícias e Editais de Concursos Públicos',
    template: '%s | Concursos Agora',
  },
  description:
    'Notícias em tempo real sobre concursos públicos no Brasil, editais abertos, gabaritos, inscrições e dicas de estudo para sua aprovação.',
  keywords: [
    'concursos públicos',
    'editais abertos',
    'concursos 2026',
    'gabarito concurso',
    'provas de concurso',
  ],
  authors: [{ name: 'Equipe Concursos Agora' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://concursosagora.com.br',
    siteName: 'Concursos Agora',
    title: 'Concursos Agora — Portal de Notícias e Editais',
    description:
      'Notícias em tempo real sobre concursos públicos no Brasil, editais abertos e materiais de estudo.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Concursos Agora — Portal de Notícias e Editais',
    description:
      'Notícias em tempo real sobre concursos públicos no Brasil, editais abertos e materiais de estudo.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
  },
  verification: {
    google: 'UMTtUIVgfZJrg_1aUkT_LpyLMHJq_Gg6dvNjhkcoLMs',
  },
  // favicon e apple-icon são resolvidos automaticamente pelo Next.js
  // a partir dos arquivos src/app/icon.png e src/app/apple-icon.png
};

export const revalidate = 60; // Revalida a cada 60 segundos (ISR)

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let categories: Category[] = [];
  try {
    categories = await sanityFetch<Category[]>(allCategoriesQuery);
  } catch (error) {
    console.error('Erro ao buscar categorias no RootLayout:', error);
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_CONFIG.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: SITE_CONFIG.logo,
    sameAs: SOCIAL_LINKS.map((s) => s.href),
  };

  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {/*
          Google Consent Mode v2 — deve rodar de forma síncrona ANTES do gtag.js
          para que o GA respeite o consentimento desde o primeiro hit.
          Todos os consentimentos começam como 'denied' (padrão LGPD).
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
              window.gtag('consent', 'default', {
                analytics_storage: 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                functionality_storage: 'granted',
                personalization_storage: 'denied',
                security_storage: 'granted',
                wait_for_update: 2000
              });
            `,
          }}
        />
      </head>
      <body className="font-sans bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">
        <Header categories={categories} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-6">
          {children}
        </main>
        <Footer />
        {/* Google Analytics 4 — gtag.js (carregado após hidração) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-YX2KZMH82Y"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
            window.gtag('js', new Date());
            window.gtag('config', 'G-YX2KZMH82Y');
          `}
        </Script>
        {/* Vercel Analytics + Speed Insights */}
        <Analytics />
        <SpeedInsights />
        {/* Banner de consentimento de cookies — LGPD Lei nº 13.709/2018 */}
        <CookieBanner />
      </body>
    </html>
  );
}
