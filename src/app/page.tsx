import HeroCarousel from '@/components/HeroCarousel';
import PostCard from '@/components/PostCard';
import CategoryCard from '@/components/CategoryCard';
import Sidebar from '@/components/Sidebar';
import Pagination from '@/components/Pagination';
import { client } from '@/lib/sanity';
import {
  postsPaginatedQuery,
  postsCountQuery,
  recentPostsQuery,
  allCategoriesQuery,
} from '@/lib/queries';
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
  let categories: Category[] = [];

  try {
    const [fetchedPosts, fetchedCount, fetchedRecent, fetchedCategories] = await Promise.all([
      client.fetch(postsPaginatedQuery, { start, end }),
      client.fetch(postsCountQuery),
      client.fetch(recentPostsQuery),
      client.fetch(allCategoriesQuery),
    ]);

    posts = fetchedPosts || [];
    totalPosts = fetchedCount || 0;
    recentPosts = fetchedRecent || [];
    categories = fetchedCategories || [];
  } catch (error) {
    console.error('Erro ao buscar dados na Home Page:', error);
  }

  const uniqueCategories = deduplicateCategories(categories);
  const totalPages = Math.ceil((totalPosts || 0) / itemsPerPage);
  // Carousel uses the 4 most recent posts from recentPostsQuery
  const carouselPosts = currentPage === 1 ? recentPosts.slice(0, 4) : [];
  const gridPosts = posts;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Carousel (Destaques Principais na 1ª página) */}
      {currentPage === 1 && carouselPosts.length > 0 && (
        <HeroCarousel posts={carouselPosts} />
      )}

      {/* Grid de Categorias Sem Duplicatas */}
      {uniqueCategories.length > 0 && (
        <section className="my-12">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span>🏷️</span> Concursos por Categoria
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uniqueCategories.map((category) => (
              <CategoryCard key={category._id} category={category} />
            ))}
          </div>
        </section>
      )}

      {/* Conteúdo Principal com Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 my-12">
        {/* Feed de Notícias */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📰</span> Últimas Notícias
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {totalPosts} {totalPosts === 1 ? 'matéria' : 'matérias'} no total
            </span>
          </div>

          {gridPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gridPosts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>

              {/* Paginação de 10 em 10 */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl="/"
                totalItems={totalPosts}
                itemsPerPage={itemsPerPage}
              />
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                Nenhuma notícia encontrada no momento.
              </p>
            </div>
          )}
        </div>

        {/* Barra Lateral (Sidebar) */}
        <Sidebar recentPosts={recentPosts} categories={uniqueCategories} />
      </div>
    </div>
  );
}
