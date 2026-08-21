import Link from 'next/link';
import Image from 'next/image';
import { Post, Category } from '@/types';
import { getImageUrl } from '@/lib/image';
import { deduplicateCategories } from '@/utils/categories';
import SearchBar from './SearchBar';
import Newsletter from './Newsletter';
import { InstagramIcon, FacebookIcon, XIcon, ThreadsIcon, YouTubeIcon } from './SocialIcons';
import { SOCIAL_LINKS } from '@/lib/constants';

interface SidebarProps {
  recentPosts?: Post[];
  categories?: Category[];
  /** Posts da mesma categoria — exibidos na página de post para reter o leitor */
  categoryPosts?: Post[];
  /** Nome da categoria atual — usado no título do widget contextual */
  categoryName?: string;
}

const SOCIAL_ICON_MAP: Record<string, React.ElementType> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  x: XIcon,
  threads: ThreadsIcon,
  youtube: YouTubeIcon,
};

const SOCIAL_COLORS: Record<string, string> = {
  instagram: 'bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 hover:from-pink-500/20 hover:to-amber-500/20 text-pink-600 border-pink-500/20',
  facebook: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border-blue-500/20',
  x: 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-800 border-slate-500/20',
  threads: 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-800 border-slate-500/20',
  youtube: 'bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-500/20',
};

function SidebarPostList({ posts, title, icon }: { posts: Post[]; title: string; icon?: string }) {
  if (!posts || posts.length === 0) return null;
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
      <h3 className={`text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 ${icon ? 'flex items-center gap-2' : ''}`}>
        {icon && <span>{icon}</span>}
        {title}
      </h3>
      <div className="space-y-4">
        {posts.map((post) => {
          const imgUrl = getImageUrl(post.mainImage, 120, 120);
          const postLink = `/post/${post.slug || post._id}`;
          return (
            <article key={post._id} className="flex gap-3 items-center group">
              <Link href={postLink} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 block">
                <Image
                  src={imgUrl}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="64px"
                />
              </Link>
              <div className="space-y-1">
                <h4 className="text-xs md:text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
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
  );
}

export default function Sidebar({ recentPosts = [], categories = [], categoryPosts, categoryName }: SidebarProps) {
  const uniqueCategories = deduplicateCategories(categories);

  return (
    <aside className="space-y-8">
      {/* Busca */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span>🔍</span> Pesquisar no Portal
        </h3>
        <SearchBar />
      </div>

      {/* Categorias */}
      {uniqueCategories.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            Categorias em Destaque
          </h3>
          <div className="flex flex-wrap gap-2">
            {uniqueCategories.map((cat) => (
              <Link
                key={cat._id}
                href={`/categoria/${cat.slug || cat._id}`}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white transition-colors"
              >
                {cat.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posts da Mesma Categoria (aparece na página de post) */}
      {categoryPosts && categoryPosts.length > 0 && (
        <SidebarPostList
          posts={categoryPosts}
          title={categoryName ? `Mais sobre ${categoryName}` : 'Mesma Categoria'}
          icon="📌"
        />
      )}

      {/* Últimas Notícias (exibido quando não há categoryPosts) */}
      {recentPosts.length > 0 && !categoryPosts && (
        <SidebarPostList
          posts={recentPosts}
          title="Últimas Notícias"
        />
      )}

      {/* Widget Redes Sociais */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
          <span>📲</span> Siga o Concursos Agora
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Acompanhe editais abertos, notícias urgentes e dicas exclusivas:
        </p>
        <div className="grid grid-cols-1 gap-2.5 text-xs font-bold">
          {SOCIAL_LINKS.map((link) => {
            const Icon = SOCIAL_ICON_MAP[link.icon];
            const colorClass = SOCIAL_COLORS[link.icon] || 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-800 border-slate-500/20';

            return (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-3 rounded-xl transition-all border group ${colorClass}`}
              >
                {Icon && <Icon className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />}
                <span>{link.label}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Widget Newsletter */}
      <Newsletter />
    </aside>
  );
}
