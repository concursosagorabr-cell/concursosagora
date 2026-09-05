import { Metadata } from 'next';
import Link from 'next/link';
import {
  getCachedPostsPaginated,
  getCachedPostsCount,
  getCachedRecentPosts,
  getCachedCategories,
} from '@/lib/sanity';
import { Post, Category } from '@/types';
import { deduplicateCategories } from '@/utils/categories';
import PostCard from '@/components/PostCard';
import Breadcrumb from '@/components/Breadcrumb';
import Sidebar from '@/components/Sidebar';
import Pagination from '@/components/Pagination';

interface NoticiasPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export const revalidate = 60; // Incremental Static Regeneration (ISR)

export async function generateMetadata({ searchParams }: NoticiasPageProps): Promise<Metadata> {
  const { page } = await searchParams;
  const pageNum = parseInt(page || '1', 10);
  const pageSuffix = pageNum > 1 ? ` — Página ${pageNum}` : '';
  const url = pageNum > 1 ? `https://concursosagora.com.br/noticias?page=${pageNum}` : 'https://concursosagora.com.br/noticias';

  return {
    title: `Todas as Notícias de Concursos Públicos e Editais${pageSuffix}`,
    description:
      'Acompanhe todas as notícias, editais publicados, inscrições abertas e atualizações de concursos públicos no Brasil em tempo real.',
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `Todas as Notícias de Concursos Públicos e Editais${pageSuffix}`,
      description:
        'Acompanhe todas as notícias, editais publicados, inscrições abertas e atualizações de concursos públicos no Brasil em tempo real.',
      url,
      type: 'website',
    },
  };
}

export default async function NoticiasPage({ searchParams }: NoticiasPageProps) {
  const { page } = await searchParams;

  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const itemsPerPage = 12;
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage - 1;

  let posts: Post[] = [];
  let totalPosts = 0;
  let recentPosts: Post[] = [];
  let categories: Category[] = [];

  try {
    const [fetchedPosts, fetchedCount, fetchedRecent, fetchedCategories] = await Promise.all([
      getCachedPostsPaginated(start, end),
      getCachedPostsCount(),
      getCachedRecentPosts(),
      getCachedCategories(),
    ]);

    posts = fetchedPosts || [];
    totalPosts = fetchedCount || 0;
    recentPosts = fetchedRecent || [];
    categories = fetchedCategories || [];
  } catch (error) {
    console.error('Erro ao buscar dados na Página de Notícias:', error);
  }

  const uniqueCategories = deduplicateCategories(categories);
  const totalPages = Math.ceil((totalPosts || 0) / itemsPerPage);

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
        name: 'Notícias',
        item: 'https://concursosagora.com.br/noticias',
      },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Arquivo de Notícias e Editais de Concursos Públicos',
    url: 'https://concursosagora.com.br/noticias',
    description: 'Lista completa de notícias sobre concursos públicos em todo o Brasil.',
    numberOfItems: totalPosts,
  };

  return (
    <div className="max-w-7xl mx-auto px-0 py-2 sm:py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <Breadcrumb items={[{ label: 'Todas as Notícias' }]} />

      {/* Header Editorial */}
      <header className="mb-8 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-blue-400">
              Arquivo Geral de Notícias
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black mt-2 mb-3">
              📰 Todas as Notícias & Editais
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
              Cobertura em tempo real com editais autorizados, publicados, bancas organizadoras e convocações em todo o Brasil.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-center">
            <span className="text-2xl sm:text-3xl font-black text-yellow-400 block">
              {totalPosts}
            </span>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Matérias Publicadas
            </span>
          </div>
        </div>

        {/* Categorias Rápidas */}
        {uniqueCategories.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold text-slate-300 shrink-0">Filtrar por Área:</span>
            {uniqueCategories.slice(0, 8).map((cat) => (
              <Link
                key={cat.slug || cat._id}
                href={`/categoria/${cat.slug || cat._id}`}
                className="text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
              >
                {cat.title}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Grid Principal + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>⚡</span> Plantão Editorial ({posts.length} nesta página)
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

              <div className="pt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl="/noticias"
                />
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-4xl block mb-2">🔍</span>
              <p className="text-slate-600 font-medium">
                Nenhuma matéria encontrada nesta página.
              </p>
              <Link
                href="/noticias"
                className="mt-4 inline-block text-blue-600 font-bold text-sm hover:underline"
              >
                ← Voltar para a página 1
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Sidebar
            recentPosts={recentPosts}
            categories={uniqueCategories}
          />
        </div>
      </div>
    </div>
  );
}
