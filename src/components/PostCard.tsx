import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types';
import { getImageUrl } from '@/lib/image';
import { deduplicateCategories, getPureCategories } from '@/utils/categories';
import { getContestStatusInfo } from '@/utils/status';
import { getDescriptiveImageAlt } from '@/utils/imageAlt';

interface PostCardProps {
  post: Post;
  featured?: boolean;
}

export default function PostCard({ post, featured = false }: PostCardProps) {
  const imageUrl = getImageUrl(post.mainImage, featured ? 800 : 600, featured ? 450 : 340);
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const postLink = `/post/${post.slug || post._id}`;
  const pureCategories = getPureCategories(post.categories || []);
  const uniquePostCategories = (pureCategories.length > 0 ? pureCategories : deduplicateCategories(post.categories || [])).slice(0, 2);
  const statusInfo = getContestStatusInfo(post);

  return (
    <article className="group bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-xl border border-slate-200/90 hover:border-blue-200 transition-all duration-300 flex flex-col h-full">
      {/* ── Imagem com Badge de Status Flutuante ── */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-100 shrink-0">
        <Link href={postLink} className="relative block w-full h-full" tabIndex={-1}>
          <Image
            src={imageUrl}
            alt={getDescriptiveImageAlt(post)}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {/* Badges sobre a imagem */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex flex-wrap gap-1.5 pointer-events-auto">
            <span className={`inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md backdrop-blur-md ${statusInfo.badgeBg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
              {statusInfo.label}
            </span>
          </div>

          {uniquePostCategories.length > 0 && (
            <Link
              key={uniquePostCategories[0]._id}
              href={`/categoria/${uniquePostCategories[0].slug || uniquePostCategories[0]._id}`}
              className="pointer-events-auto bg-slate-900/80 hover:bg-blue-600 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs transition-colors"
            >
              {uniquePostCategories[0].title}
            </Link>
          )}
        </div>
      </div>

      {/* ── Corpo do Card ── */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>{formattedDate}</span>
            {post.author && (
              <span className="truncate max-w-[120px]">Por {post.author.name}</span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
            <Link href={postLink}>
              {post.title}
            </Link>
          </h3>

          {post.excerpt && (
            <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>

        {/* ── Rodapé do Card ── */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
          <Link href={postLink} className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Ler matéria</span>
            <span>→</span>
          </Link>
          {statusInfo.expirationNote && (
            <span className="text-xs text-slate-600 font-normal">
              {statusInfo.expirationNote}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

