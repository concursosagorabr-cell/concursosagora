import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import PostCard from '@/components/PostCard';
import Sidebar from '@/components/Sidebar';
import Pagination from '@/components/Pagination';
import { getHubBySlug, CONTENT_HUBS } from '@/utils/hubs';
import { sanityFetch } from '@/lib/sanity';
import {
  postsByKeywordsPaginatedQuery,
  postsByKeywordsCountQuery,
  recentPostsQuery,
  allCategoriesQuery,
} from '@/lib/queries';
import { Post, Category } from '@/types';
import { deduplicateCategories } from '@/utils/categories';

interface HubPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  return CONTENT_HUBS.map((hub) => ({ slug: hub.slug }));
}

export async function generateMetadata({ params }: HubPageProps): Promise<Metadata> {
  const { slug } = await params;
  const hub = getHubBySlug(slug);

  if (!hub) {
    return { title: 'Hub não encontrado' };
  }

  const url = `https://concursosagora.com.br/hub/${hub.slug}`;

  return {
    title: `${hub.title} — Guia de Editais & Vagas`,
    description: hub.seoDescription,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: hub.title,
      description: hub.seoDescription,
    },
  };
}

export default async function HubDetailPage({ params, searchParams }: HubPageProps) {
  const { slug } = await params;
  const { page } = await searchParams;

  const hub = getHubBySlug(slug);

  if (!hub) {
    notFound();
  }

  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const itemsPerPage = 10;
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage - 1;

  const mainKeyword = hub.keywords[0] || slug;

  const [posts, totalPosts, recentPosts, categories]: [Post[], number, Post[], Category[]] = await Promise.all([
    sanityFetch(postsByKeywordsPaginatedQuery, {
      keywords: hub.categoryMatch,
      mainKeyword,
      start,
      end,
    }),
    sanityFetch(postsByKeywordsCountQuery, {
      keywords: hub.categoryMatch,
      mainKeyword,
    }),
    sanityFetch(recentPostsQuery),
    sanityFetch(allCategoriesQuery),
  ]);

  const uniqueCategories = deduplicateCategories(categories);
  const totalPages = Math.ceil((totalPosts || 0) / itemsPerPage);
  const baseUrl = `/hub/${hub.slug}`;
  const hubUrl = `https://concursosagora.com.br/hub/${hub.slug}`;

  // Schema.org JSON-LD para CollectionPage
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: hub.title,
    description: hub.seoDescription,
    url: hubUrl,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: 'https://concursosagora.com.br',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Hubs de Conteúdo',
        item: 'https://concursosagora.com.br/hub',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: hub.title,
        item: hubUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: 'Hubs de Conteúdo', href: '/hub' },
            { label: hub.shortTitle },
          ]}
        />

        {/* Header Pillar do Hub */}
        <header className="mb-10 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white p-8 md:p-10 rounded-3xl shadow-xl border border-blue-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl p-3 bg-white/10 backdrop-blur rounded-2xl">
                {hub.icon}
              </span>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-blue-300 block">
                  Página Pilar (SEO Silo)
                </span>
                <span className="text-xs text-blue-200/80 font-medium">
                  {totalPosts} {totalPosts === 1 ? 'matéria mapeada' : 'matérias mapeadas'}
                </span>
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              {hub.title}
            </h1>

            <p className="text-blue-100 text-sm md:text-base max-w-3xl leading-relaxed">
              {hub.description}
            </p>
          </div>
        </header>

        {/* Seção de Sub-Silos / Links Internos Estruturados (Silo Interlinking) */}
        {hub.subSilos.length > 0 && (
          <section className="mb-12 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span>📍</span> Sub-Silos & Categorias Relacionadas
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {hub.subSilos.map((sub, idx) => {
                const targetUrl =
                  sub.type === 'uf'
                    ? `/categoria/${sub.slug}`
                    : `/search?q=${encodeURIComponent(sub.slug)}`;
                return (
                  <Link
                    key={idx}
                    href={targetUrl}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 border border-slate-200 dark:border-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-200 text-center transition-all duration-200 flex flex-col items-center justify-center gap-1 group shadow-2xs"
                  >
                    <span className="group-hover:scale-110 transition-transform">
                      {sub.type === 'uf' ? '🗺️' : '📌'}
                    </span>
                    <span className="line-clamp-1">{sub.title}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Conteúdo Principal com Feed de Matérias */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📰</span> Últimas Notícias do Hub
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Página {currentPage} de {totalPages || 1}
              </span>
            </div>

            {posts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posts.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl={baseUrl}
                  totalItems={totalPosts}
                  itemsPerPage={itemsPerPage}
                />
              </>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-slate-600 dark:text-slate-400">
                  Nenhuma notícia associada a este Hub encontrada no momento.
                </p>
              </div>
            )}
          </div>

          <Sidebar recentPosts={recentPosts} categories={uniqueCategories} />
        </div>
      </div>
    </>
  );
}
