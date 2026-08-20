import { Metadata } from 'next';
import { client } from '@/lib/sanity';
import { searchPostsQuery, recentPostsQuery, allCategoriesQuery } from '@/lib/queries';
import { Post, Category } from '@/types';
import { deduplicateCategories } from '@/utils/categories';
import PostCard from '@/components/PostCard';
import SearchBar from '@/components/SearchBar';
import Breadcrumb from '@/components/Breadcrumb';
import Sidebar from '@/components/Sidebar';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Resultado da busca por "${q}"` : 'Pesquisar Concursos',
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: queryTerm } = await searchParams;
  const searchTerm = queryTerm || '';

  let posts: Post[] = [];
  let recentPosts: Post[] = [];
  let categories: Category[] = [];

  try {
    if (searchTerm) {
      posts = (await client.fetch(searchPostsQuery, { searchTerm })) || [];
    }

    const [fetchedRecent, fetchedCategories] = await Promise.all([
      client.fetch(recentPostsQuery),
      client.fetch(allCategoriesQuery),
    ]);
    recentPosts = fetchedRecent || [];
    categories = fetchedCategories || [];
  } catch (error) {
    console.error('Erro ao processar busca em SearchPage:', error);
  }

  const uniqueCategories = deduplicateCategories(categories);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'Pesquisa' }]} />

      <div className="mb-10 max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Pesquisar no Concursos Agora
        </h1>
        <SearchBar placeholder="Digite um termo, cargo, edital ou órgão..." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          {searchTerm ? (
            <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
              Resultados para &quot;<span className="text-blue-600 dark:text-blue-400">{searchTerm}</span>&quot; ({posts.length})
            </h2>
          ) : (
            <p className="text-slate-500 text-center py-4">Digite uma palavra-chave acima para buscar notícias.</p>
          )}

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          ) : searchTerm ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                Nenhum resultado encontrado para &quot;{searchTerm}&quot;. Tente buscar com outros termos.
              </p>
            </div>
          ) : null}
        </div>

        <Sidebar recentPosts={recentPosts} categories={uniqueCategories} />
      </div>
    </div>
  );
}
