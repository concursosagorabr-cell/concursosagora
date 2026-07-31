import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types';
import { getImageUrl } from '@/lib/image';
import { deduplicateCategories } from '@/utils/categories';
import { getContestStatusInfo } from '@/utils/status';

interface PostCardProps {
  post: Post;
  featured?: boolean;
}

export default function PostCard({ post, featured = false }: PostCardProps) {
  const imageUrl = getImageUrl(post.mainImage, featured ? 800 : 500, featured ? 500 : 320);
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const postLink = `/post/${post.slug || post._id}`;
  const uniquePostCategories = deduplicateCategories(post.categories || []).slice(0, 2);
  const statusInfo = getContestStatusInfo(post);

  if (featured) {
    return (
      <article className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 grid md:grid-cols-2 gap-6 items-center transition-all hover:shadow-2xl">
        <div className="relative w-full h-64 md:h-full min-h-[300px] overflow-hidden">
          <Link href={postLink} className="block w-full h-full">
            <Image
              src={imageUrl}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </Link>
          <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10 items-center">
            <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md backdrop-blur ${statusInfo.badgeBg}`}>
              <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
              {statusInfo.label}
            </span>
            {uniquePostCategories.length > 0 &&
              uniquePostCategories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/categoria/${cat.slug || cat._id}`}
                  className="bg-blue-600/90 hover:bg-blue-700 backdrop-blur text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md transition-colors"
                >
                  {cat.title}
                </Link>
              ))}
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col justify-center space-y-4">
          <div className="flex flex-wrap items-center text-xs text-slate-500 dark:text-slate-400 gap-2">
            <span>{formattedDate}</span>
            {post.author && (
              <>
                <span>•</span>
                <span>Por {post.author.name}</span>
              </>
            )}
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
            <Link href={postLink}>
              {post.title}
            </Link>
          </h2>

          {post.excerpt && (
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base line-clamp-3 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <div className="pt-2 flex items-center justify-between">
            <Link
              href={postLink}
              className="inline-flex items-center font-bold text-sm text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform"
            >
              Ler matéria completa →
            </Link>
            <span className="text-xs text-slate-400 font-medium">
              {statusInfo.expirationNote}
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-xs hover:shadow-xl border border-slate-200 dark:border-slate-800 transition-all flex flex-col h-full">
      <div className="relative w-full h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Link href={postLink} className="block w-full h-full">
          <Image
            src={imageUrl}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>
        <div className="absolute top-3 left-3 flex flex-wrap gap-1 z-10 items-center">
          <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs backdrop-blur ${statusInfo.badgeBg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
            {statusInfo.label}
          </span>
          {uniquePostCategories.length > 0 &&
            uniquePostCategories.map((cat) => (
              <Link
                key={cat._id}
                href={`/categoria/${cat.slug || cat._id}`}
                className="bg-blue-600/90 hover:bg-blue-600 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs transition-colors"
              >
                {cat.title}
              </Link>
            ))}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow justify-between space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>{formattedDate}</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
            <Link href={postLink}>
              {post.title}
            </Link>
          </h3>
          {post.excerpt && (
            <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
          <Link href={postLink} className="flex items-center justify-between w-full">
            <span>Ver matéria completa</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
