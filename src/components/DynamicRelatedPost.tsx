import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image';
import { DynamicRelatedPostBlock, RelatedPostData } from '@/types';

interface DynamicRelatedPostProps {
  value?: DynamicRelatedPostBlock | { data: RelatedPostData };
}

export default function DynamicRelatedPost({ value }: DynamicRelatedPostProps) {
  const postData = value?.data;

  if (!postData || !postData.title) {
    return null;
  }

  // Tratamento resiliente de slug
  const slugStr =
    typeof postData.slug === 'string'
      ? postData.slug
      : postData.slug?.current || postData._id;

  const href = `/post/${slugStr}`;
  const imageUrl = postData.mainImage ? getImageUrl(postData.mainImage, 240, 160) : null;
  const primaryCategory = postData.categories && postData.categories.length > 0 ? postData.categories[0] : null;

  return (
    <div className="my-8 group relative overflow-hidden rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/90 via-slate-50 to-indigo-50/40 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-600">
      {/* Top Tag Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs">
            <span>🔥</span>
            <span>LEIA TAMBÉM</span>
          </span>

          {primaryCategory && (
            <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block">
              {primaryCategory.title}
            </span>
          )}
        </div>

        <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1 shrink-0">
          <span>Ver matéria</span>
          <span className="text-sm font-bold">→</span>
        </span>
      </div>

      {/* Main Content Layout */}
      <Link href={href} className="flex gap-4 items-center group-hover:no-underline">
        {/* Thumbnail (se houver imagem) */}
        {imageUrl && (
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-slate-200/80 shadow-xs bg-slate-100">
            <Image
              src={imageUrl}
              alt={postData.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="96px"
            />
          </div>
        )}

        {/* Title and Excerpt */}
        <div className="flex-1 min-w-0">
          <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
            {postData.title}
          </h4>
          {postData.excerpt && (
            <p className="text-xs sm:text-sm text-slate-600 line-clamp-1 mt-1 hidden sm:block font-normal">
              {postData.excerpt}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
