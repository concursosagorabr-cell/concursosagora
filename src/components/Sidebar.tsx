import Link from 'next/link';
import Image from 'next/image';
import { Post, Category } from '@/types';
import { getImageUrl } from '@/lib/image';
import { deduplicateCategories } from '@/utils/categories';
import SearchBar from './SearchBar';
import Newsletter from './Newsletter';

interface SidebarProps {
  recentPosts?: Post[];
  categories?: Category[];
}

export default function Sidebar({ recentPosts = [], categories = [] }: SidebarProps) {
  const uniqueCategories = deduplicateCategories(categories);

  return (
    <aside className="space-y-8">
      {/* Busca */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span>🔍</span> Pesquisar no Portal
        </h3>
        <SearchBar />
      </div>

      {/* Categorias */}
      {uniqueCategories.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            Categorias em Destaque
          </h3>
          <div className="flex flex-wrap gap-2">
            {uniqueCategories.map((cat) => (
              <Link
                key={cat._id}
                href={`/categoria/${cat.slug || cat._id}`}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-colors"
              >
                {cat.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Últimas Notícias */}
      {recentPosts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            Últimas Notícias
          </h3>
          <div className="space-y-4">
            {recentPosts.map((post) => {
              const imgUrl = getImageUrl(post.mainImage, 120, 120);
              const postLink = `/post/${post.slug || post._id}`;
              return (
                <article key={post._id} className="flex gap-3 items-center group">
                  <Link href={postLink} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 block">
                    <Image
                      src={imgUrl}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="64px"
                    />
                  </Link>
                  <div className="space-y-1">
                    <h4 className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      <Link href={postLink}>
                        {post.title}
                      </Link>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('pt-BR') : ''}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* Widget Newsletter */}
      <Newsletter />
    </aside>
  );
}
