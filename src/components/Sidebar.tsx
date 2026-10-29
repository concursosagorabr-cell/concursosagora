import Link from 'next/link';
import Image from 'next/image';
import { Post, Category } from '@/types';
import { getImageUrl } from '@/lib/image';
import { deduplicateCategories, getPureCategories } from '@/utils/categories';
import { getDescriptiveImageAlt } from '@/utils/imageAlt';
import Newsletter from './Newsletter';
import { InstagramIcon, FacebookIcon, YouTubeIcon, TelegramIcon } from './SocialIcons';
import { SOCIAL_LINKS } from '@/lib/constants';

interface SidebarProps {
  recentPosts?: Post[];
  /** Posts com mais acessos reais apurados via Redis */
  topPosts?: Post[];
  categories?: Category[];
  /** Posts da mesma categoria — exibidos na página de post para reter o leitor */
  categoryPosts?: Post[];
  /** Nome da categoria atual — usado no título do widget contextual */
  categoryName?: string;
}

const SOCIAL_ICON_MAP: Record<string, React.ElementType> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  telegram: TelegramIcon,
  youtube: YouTubeIcon,
};

const TOP_CAREERS = [
  { label: '👮 Segurança Pública & Polícia', href: '/categoria/seguranca' },
  { label: '⚖️ Tribunais & Ministério Público', href: '/categoria/judiciario' },
  { label: '💰 Área Fiscal & Receita', href: '/categoria/fiscal' },
  { label: '🏥 Saúde & Enfermagem', href: '/categoria/saude' },
  { label: '📚 Educação & Professores', href: '/categoria/educacao' },
  { label: '🏦 Bancária & Caixa', href: '/categoria/financas' },
  { label: '🏛️ Administrativa & Governos', href: '/categoria/administracao' },
];

function RankedPostList({ posts, title, icon = '🔥' }: { posts: Post[]; title: string; icon?: string }) {
  if (!posts || posts.length === 0) return null;
  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
          <span>{icon}</span>
          <span>{title}</span>
        </h3>
        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Top 5</span>
      </div>

      <div className="space-y-3.5">
        {posts.slice(0, 5).map((post, index) => {
          const imgUrl = getImageUrl(post.mainImage, 120, 120);
          const postLink = `/post/${post.slug || post._id}`;
          const rankNumber = String(index + 1).padStart(2, '0');

          return (
            <article key={post._id} className="flex items-center gap-3 group">
              <span className={`text-base sm:text-lg font-black shrink-0 w-6 text-center tabular-nums ${
                index === 0 ? 'text-blue-600' : index === 1 ? 'text-blue-500' : index === 2 ? 'text-slate-500' : 'text-slate-300'
              }`}>
                {rankNumber}
              </span>

              <Link href={postLink} className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200/60 block">
                <Image
                  src={imgUrl}
                  alt={getDescriptiveImageAlt(post)}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="56px"
                />
              </Link>

              <div className="space-y-0.5 min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                  <Link href={postLink}>
                    {post.title}
                  </Link>
                </h4>
                <span className="text-xs text-slate-600 font-medium block">
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

export default function Sidebar({
  recentPosts = [],
  topPosts = [],
  categories = [],
  categoryPosts,
  categoryName,
}: SidebarProps) {
  const uniqueCategories = deduplicateCategories(categories);
  const pureCategories = getPureCategories(uniqueCategories);

  const displayPopularPosts = topPosts && topPosts.length > 0 ? topPosts : recentPosts;

  return (
    <aside className="space-y-6">
      
      {/* Widget 1: Ranking Mais Lidas / Destaques */}
      {categoryPosts && categoryPosts.length > 0 ? (
        <RankedPostList
          posts={categoryPosts}
          title={categoryName ? `Mais em ${categoryName}` : 'Recomendados'}
          icon="📌"
        />
      ) : (
        <RankedPostList
          posts={displayPopularPosts}
          title="Mais Lidas do Portal"
          icon="🔥"
        />
      )}

      {/* Widget 2: Carreiras & Áreas em Foco */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 pb-3 mb-3 border-b border-slate-100 flex items-center gap-1.5">
          <span>🎯</span> Carreiras em Foco
        </h3>
        <div className="flex flex-col divide-y divide-slate-100 text-xs font-semibold">
          {TOP_CAREERS.map((career) => (
            <Link
              key={career.href}
              href={career.href}
              className="py-2 flex items-center justify-between text-slate-700 hover:text-blue-600 hover:translate-x-0.5 transition-all group"
            >
              <span>{career.label}</span>
              <span className="text-slate-500 group-hover:text-blue-600 font-bold">→</span>
            </Link>
          ))}
        </div>

        {/* Tags adicionais filtradas */}
        {pureCategories.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 block mb-2">
              Outras Tags Populares:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {pureCategories.slice(0, 8).map((cat) => (
                <Link
                  key={cat._id}
                  href={`/categoria/${cat.slug || cat._id}`}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                >
                  {cat.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Widget 3: Comunidade Oficial Concursos Agora */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-600 mb-1">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse motion-reduce:animate-none" />
          <span>Canal de Notificações</span>
        </div>
        <h3 className="text-base font-black text-slate-900 mb-1.5 leading-snug">
          Alertas de Editais Imediatos
        </h3>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Receba furos de editais, prazos de inscrição e suspensões em primeira mão nas nossas redes oficiais.
        </p>

        <div className="grid grid-cols-1 gap-2 text-xs font-bold">
          {SOCIAL_LINKS.filter(l => ['telegram', 'instagram', 'facebook', 'youtube'].includes(l.icon)).map((link) => {
            const Icon = SOCIAL_ICON_MAP[link.icon];
            return (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 text-slate-700 hover:text-blue-600 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  {Icon && <Icon className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />}
                  <span className="text-xs">{link.label}</span>
                </div>
                <span className="text-slate-500 group-hover:text-blue-600 text-xs">Acessar →</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Widget 4: Newsletter */}
      <Newsletter />
    </aside>
  );
}

