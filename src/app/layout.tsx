import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { client } from '@/lib/sanity';
import { allCategoriesQuery } from '@/lib/queries';
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
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};

export const revalidate = 60; // Revalida a cada 60 segundos (ISR)

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let categories: Category[] = [];
  try {
    categories = await client.fetch(allCategoriesQuery);
  } catch (error) {
    console.error('Erro ao buscar categorias no RootLayout:', error);
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Concursos Agora',
    url: 'https://concursosagora.com.br',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://concursosagora.com.br/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Concursos Agora',
    url: 'https://concursosagora.com.br',
    logo: 'https://concursosagora.com.br/logo.png',
    sameAs: [],
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
      </head>
      <body className="font-sans bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen flex flex-col antialiased">
        <Header categories={categories} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
