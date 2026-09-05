import Link from 'next/link';
import HeroCarousel from '@/components/HeroCarousel';
import PostCard from '@/components/PostCard';
import RegionalExplorer from '@/components/RegionalExplorer';
import Sidebar from '@/components/Sidebar';
import Pagination from '@/components/Pagination';
import HubCard from '@/components/HubCard';
import { CONTENT_HUBS } from '@/utils/hubs';
import {
  getCachedPostsPaginated,
  getCachedPostsCount,
  getCachedRecentPosts,
  getCachedTopPosts,
  getCachedCategories,
} from '@/lib/sanity';
import { Post, Category } from '@/types';
import { deduplicateCategories } from '@/utils/categories';

interface HomePageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export const revalidate = 60; // Incremental Static Regeneration (ISR)

export default async function HomePage({ searchParams }: HomePageProps) {
  const { page } = await searchParams;

  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const itemsPerPage = 10;
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage - 1;

  let posts: Post[] = [];
  let totalPosts = 0;
  let recentPosts: Post[] = [];
  let topPosts: Post[] = [];
  let categories: Category[] = [];

  try {
    const [fetchedPosts, fetchedCount, fetchedRecent, fetchedTop, fetchedCategories] = await Promise.all([
      getCachedPostsPaginated(start, end),
      getCachedPostsCount(),
      getCachedRecentPosts(),
      getCachedTopPosts(5),
      getCachedCategories(),
    ]);

    posts = fetchedPosts || [];
    totalPosts = fetchedCount || 0;
    recentPosts = fetchedRecent || [];
    topPosts = fetchedTop || [];
    categories = fetchedCategories || [];
  } catch (error) {
    console.error('Erro ao buscar dados na Home Page:', error);
  }

  const uniqueCategories = deduplicateCategories(categories);
  const totalPages = Math.ceil((totalPosts || 0) / itemsPerPage);
  // O Hero utiliza as 6 matérias mais recentes para alimentar a Manchete + Plantão Lateral
  const heroPosts = currentPage === 1 ? recentPosts.slice(0, 6) : [];
  const gridPosts = posts;

  return (
    <div className="max-w-7xl mx-auto px-0 py-2 sm:py-4">
      {/* ── H1 Semântico Principal para SEO Técnico e Acessibilidade ── */}
      <h1 className="sr-only">
        Concursos Agora — Portal de Notícias, Editais Abertos e Concursos Públicos no Brasil
      </h1>

      {/* ── 1. Grade Editorial de Manchetes & Plantão de Notícias ── */}
      {currentPage === 1 && heroPosts.length > 0 && (
        <HeroCarousel posts={heroPosts} />
      )}

      {/* ── 2. Navegador Regional Interativo por Estados e Regiões ── */}
      {currentPage === 1 && (
        <RegionalExplorer />
      )}

      {/* ── 3. Carreiras em Foco (Silos e Guias Especializados) ── */}
      {currentPage === 1 && (
        <section className="my-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 block">
                Especialidades
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <span>🎯</span> Guias de Carreiras & Editais por Área
              </h2>
            </div>
            <Link href="/hub" className="text-xs font-bold text-blue-600 hover:underline">
              Ver Todos ({CONTENT_HUBS.length}) →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CONTENT_HUBS.slice(0, 4).map((hub) => (
              <HubCard key={hub.slug} hub={hub} />
            ))}
          </div>
        </section>
      )}

      {/* ── 4. Feed de Últimas Notícias com Sidebar Editorial ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 my-10">
        
        {/* Feed de Matérias */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>📰</span> Últimas Notícias & Editais
            </h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60">
              {totalPosts} matérias publicadas
            </span>
          </div>

          {gridPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {gridPosts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>

              {/* Paginação */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl="/"
                totalItems={totalPosts}
                itemsPerPage={itemsPerPage}
              />
            </>
          ) : (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2">
              <p className="text-base font-bold text-slate-800">
                Nenhuma notícia encontrada no momento.
              </p>
              <p className="text-xs text-slate-500">
                Novos editais e atualizações são publicados automaticamente a cada rodada de monitoramento.
              </p>
            </div>
          )}
        </div>

        {/* Barra Lateral (Sidebar) */}
        <Sidebar recentPosts={recentPosts} topPosts={topPosts} categories={uniqueCategories} />
      </div>
    </div>
  );
}

