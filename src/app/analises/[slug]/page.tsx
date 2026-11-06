import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import ShareButtons from '@/components/ShareButtons';
import AnaliseBody from '@/components/analises/AnaliseBody';
import AnaliseCard from '@/components/analises/AnaliseCard';
import AnaliseSidebar from '@/components/analises/AnaliseSidebar';
import {
  formatAnaliseDate,
  getAllAnalises,
  getAnaliseBySlug,
  getAnalisePlainText,
  getAnaliseReadingMinutes,
  getRelatedAnalises,
} from '@/content/analises';
import { getCachedRecentPosts } from '@/lib/sanity';
import { SITE_URL } from '@/lib/constants';
import type { Post } from '@/types';

interface AnalisePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 300;

export function generateStaticParams() {
  return getAllAnalises().map((analise) => ({ slug: analise.slug }));
}

export async function generateMetadata({ params }: AnalisePageProps): Promise<Metadata> {
  const { slug } = await params;
  const analise = getAnaliseBySlug(slug);

  if (!analise) {
    return {
      title: 'Análise não encontrada',
      robots: { index: false, follow: false },
    };
  }

  const url = `${SITE_URL}/analises/${analise.slug}`;
  const imageUrl = `${SITE_URL}${analise.image.src}`;
  const title = analise.seo?.metaTitle || analise.shortTitle;
  const description =
    analise.seo?.metaDescription ||
    getAnalisePlainText(analise).slice(0, 157).trimEnd() + '…';

  return {
    title: { absolute: `${title} | Análises` },
    description,
    authors: [{ name: analise.author.name }],
    keywords: analise.tags,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      locale: 'pt_BR',
      url,
      siteName: 'Concursos Agora',
      title,
      description,
      publishedTime: analise.publishedAt,
      modifiedTime: analise.updatedAt || analise.publishedAt,
      authors: [analise.author.name],
      tags: analise.tags,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 675,
          alt: analise.image.alt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function AnalisePage({ params }: AnalisePageProps) {
  const { slug } = await params;
  const analise = getAnaliseBySlug(slug);

  if (!analise) {
    notFound();
  }

  const relatedAnalises = getRelatedAnalises(analise.slug, 3);
  const readingMinutes = getAnaliseReadingMinutes(analise);
  const url = `${SITE_URL}/analises/${analise.slug}`;
  const imageUrl = `${SITE_URL}${analise.image.src}`;

  let recentPosts: Post[] = [];
  try {
    recentPosts = (await getCachedRecentPosts()) || [];
  } catch (error) {
    console.error('Erro ao buscar notícias recentes na página de análise:', error);
  }

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    headline: analise.seo?.metaTitle || analise.shortTitle,
    alternativeHeadline: analise.title,
    image: [imageUrl],
    datePublished: analise.publishedAt,
    dateModified: analise.updatedAt || analise.publishedAt,
    inLanguage: 'pt-BR',
    isAccessibleForFree: true,
    articleSection: 'Análises',
    keywords: analise.tags.join(', '),
    author: [
      {
        '@type': 'Organization',
        name: analise.author.name,
        url: `${SITE_URL}/analises`,
      },
    ],
    publisher: {
      '@type': 'Organization',
      name: 'Concursos Agora',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
        width: 200,
        height: 200,
      },
    },
    description: analise.excerpt,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Análises & Opinião',
        item: `${SITE_URL}/analises`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: analise.shortTitle,
        item: url,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="max-w-7xl mx-auto px-0 py-2 sm:py-6">
        <Breadcrumb
          items={[
            { label: 'Análises & Opinião', href: '/analises' },
            { label: analise.shortTitle },
          ]}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          <div className="space-y-6 lg:col-span-2">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Análise
                </span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-800">
                  Concursos Agora
                </span>
              </div>

              <h1 className="text-[1.7rem] font-black leading-[1.12] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.65rem]">
                {analise.title}
              </h1>

              <p className="border-l-4 border-amber-400 pl-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                {analise.excerpt}
              </p>

              <div className="flex flex-col gap-4 border-y border-slate-200 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-amber-400 ring-2 ring-amber-400/40">
                    CA
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900">
                      {analise.author.name}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {analise.author.role} · {formatAnaliseDate(analise.publishedAt)}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                      <span aria-hidden="true">⏱️</span>
                      Leitura: ~{readingMinutes} min
                    </span>
                  </div>
                </div>

                <ShareButtons
                  title={analise.title}
                  url={url}
                  excerpt={analise.excerpt}
                  compact
                />
              </div>
            </header>

            <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-lg sm:rounded-3xl">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={analise.image.src}
                  alt={analise.image.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 850px"
                  className="object-cover"
                />
              </div>
              {(analise.image.caption || analise.image.credit) && (
                <figcaption className="flex flex-col gap-1.5 border-t border-slate-200/80 bg-slate-50 px-4 py-2.5 text-xs leading-relaxed text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                  {analise.image.caption && (
                    <span className="text-slate-600">{analise.image.caption}</span>
                  )}
                  {analise.image.credit && (
                    <span className="shrink-0 font-medium italic text-slate-600">
                      {analise.image.credit}
                    </span>
                  )}
                </figcaption>
              )}
            </figure>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-8">
              <AnaliseBody blocks={analise.body} />

              <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                {analise.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                  >
                    #{tag.replace(/\s+/g, '')}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl ring-1 ring-slate-800 sm:rounded-3xl sm:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/15 blur-3xl"
              />
              <div className="relative">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400">
                  O próximo passo
                </span>
                <h2 className="mt-2 text-xl font-black leading-tight sm:text-2xl">
                  Saia da corda bamba. Comece pelo edital certo.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
                  Confira os concursos com inscrições abertas, os salários e o cronograma
                  completo. A estabilidade que ninguém derruba começa com uma decisão.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/concursos"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition-colors hover:bg-amber-300"
                  >
                    Ver concursos abertos
                    <span aria-hidden="true">→</span>
                  </Link>
                  <a
                    href="https://www.youtube.com/@ConcursosAgora"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-white/10"
                  >
                    Assistir no YouTube
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-5">
              <p className="mb-1 text-sm font-bold text-slate-900">
                Compartilhe esta análise
              </p>
              <p className="mb-2 text-xs text-slate-600">
                Ajude mais gente a enxergar o cenário antes de tomar uma decisão de carreira.
              </p>
              <ShareButtons title={analise.title} url={url} excerpt={analise.excerpt} />
            </div>

            {relatedAnalises.length > 0 && (
              <section aria-labelledby="analises-relacionadas" className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h2
                    id="analises-relacionadas"
                    className="text-lg font-black text-slate-900 sm:text-xl"
                  >
                    Continue lendo
                  </h2>
                  <Link
                    href="/analises"
                    className="text-xs font-bold text-amber-700 hover:underline"
                  >
                    Ver todas →
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {relatedAnalises.map((related) => (
                    <AnaliseCard key={related.slug} analise={related} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-1">
            <AnaliseSidebar
              analises={getAllAnalises()}
              currentSlug={analise.slug}
              recentPosts={recentPosts}
            />
          </div>
        </div>
      </article>
    </>
  );
}
