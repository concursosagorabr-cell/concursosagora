import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types';
import { getImageUrl } from '@/lib/image';
import { getDescriptiveImageAlt } from '@/utils/imageAlt';

interface InArticleCTAProps {
  posts: Post[];
  categoryName?: string;
}

/**
 * Bloco de "Leia Também" inserido dentro do artigo para reduzir o bounce rate.
 * Exibe posts relacionados à mesma categoria com um visual chamativo e urgente.
 */
export default function InArticleCTA({ posts, categoryName }: InArticleCTAProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <aside
      aria-label="Leia também"
      className="my-8 p-5 rounded-2xl border-l-4 border-blue-500 bg-blue-50 shadow-sm"
    >
      <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-3 flex items-center gap-1.5">
        <span>📌</span>
        {categoryName ? `Veja também: Mais sobre ${categoryName}` : 'Leia Também'}
      </p>

      <div className="flex flex-col gap-3">
        {posts.map((post) => {
          const imgUrl = getImageUrl(post.mainImage, 120, 80);
          const postLink = `/post/${post.slug || post._id}`;
          const date = post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '';

          return (
            <Link
              key={post._id}
              href={postLink}
              className="group flex items-center gap-3 p-3 rounded-xl bg-white border border-blue-100 hover:border-blue-400 hover:shadow-md transition-all"
            >
              {post.mainImage && (
                <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-200">
                  <Image
                    src={imgUrl}
                    alt={getDescriptiveImageAlt(post)}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="64px"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                  {post.title}
                </p>
                {date && (
                  <span className="text-xs text-slate-600 font-medium mt-0.5 block">{date}</span>
                )}
              </div>
              <span className="text-blue-500 text-sm font-bold shrink-0 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
