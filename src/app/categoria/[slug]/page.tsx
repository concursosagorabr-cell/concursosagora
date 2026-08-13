import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { client } from '@/lib/sanity';
import {
  categoryBySlugQuery,
  postsByCategoryPaginatedQuery,
  postsByCategoryCountQuery,
  allCategorySlugsQuery,
  recentPostsQuery,
  allCategoriesQuery,
} from '@/lib/queries';
import { Category, Post } from '@/types';
import { deduplicateCategories, getCategoryAliases } from '@/utils/categories';
import PostCard from '@/components/PostCard';
import Breadcrumb from '@/components/Breadcrumb';
import Sidebar from '@/components/Sidebar';
import Pagination from '@/components/Pagination';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const rawSlugs: any[] = await client.fetch(allCategorySlugsQuery);
    const slugs = (rawSlugs || [])
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') return item.slug || item.current || item._id;
        return null;
      })
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0);

    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error('Erro ao gerar parâmetros de categoria:', error);
    return [];
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category: Category | null = await client.fetch(categoryBySlugQuery, { slug });

  if (!category) {
    return { title: 'Categoria não encontrada' };
  }

  return {
    title: `Concursos em ${category.title}`,
    description: category.description || `Confira todas as notícias e editais sobre ${category.title}`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page } = await searchParams;

  const category: Category | null = await client.fetch(categoryBySlugQuery, { slug });

  if (!category) {
    notFound();
  }

  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const itemsPerPage = 10;
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage - 1;

  const categorySlugs = getCategoryAliases(slug);

  const [posts, totalPosts, recentPosts, categories]: [Post[], number, Post[], Category[]] = await Promise.all([
    client.fetch(postsByCategoryPaginatedQuery, { categorySlug: slug, categorySlugs, start, end }),
    client.fetch(postsByCategoryCountQuery, { categorySlug: slug, categorySlugs }),
    client.fetch(recentPostsQuery),
    client.fetch(allCategoriesQuery),
  ]);

  const uniqueCategories = deduplicateCategories(categories);
  const totalPages = Math.ceil((totalPosts || 0) / itemsPerPage);
  const baseUrl = `/categoria/${category.slug || category._id}`;

  return (
    <div className="max-w-7xl mx-auto px-0 py-2 sm:py-6">
      <Breadcrumb items={[{ label: 'Categorias' }, { label: category.title }]} />

      <header className="mb-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-300">
          Categoria
        </span>
        <h1 className="text-3xl md:text-5xl font-black mt-2 mb-3">
          {category.title}
        </h1>
        {category.description && (
          <p className="text-blue-100 text-sm md:text-base max-w-2xl leading-relaxed">
            {category.description}
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Matérias em {category.title}
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {totalPosts} {totalPosts === 1 ? 'matéria' : 'matérias'} no total
            </span>
          </div>

          {posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>

              {/* Paginação de 10 em 10 */}
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
                Nenhum concurso publicado nesta categoria ainda.
              </p>
            </div>
          )}
        </div>

        <Sidebar recentPosts={recentPosts} categories={uniqueCategories} />
      </div>
    </div>
  );
}
