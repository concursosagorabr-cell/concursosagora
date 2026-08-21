'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types';
import { getImageUrl } from '@/lib/image';
import { getPostUrl, getCategoryUrl, formatDate } from '@/lib/helpers';
import { deduplicateCategories } from '@/utils/categories';
import { getContestStatusInfo } from '@/utils/status';

interface HeroCarouselProps {
  posts: Post[];
}

export default function HeroCarousel({ posts }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Touch/swipe support
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const total = posts.length;

  const goTo = useCallback(
    (index: number, dir: 'left' | 'right' = 'right') => {
      if (isAnimating || index === current) return;
      setDirection(dir);
      setIsAnimating(true);
      setTimeout(() => {
        setCurrent(index);
        setIsAnimating(false);
      }, 350);
    },
    [isAnimating, current],
  );

  const next = useCallback(() => {
    goTo((current + 1) % total, 'right');
  }, [current, total, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + total) % total, 'left');
  }, [current, total, goTo]);

  const resetInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(next, 5000);
  }, [next]);

  useEffect(() => {
    resetInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resetInterval]);

  // Touch handlers para swipe no mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);

    // Só dispara se o movimento horizontal for dominante (swipe real)
    if (Math.abs(deltaX) > 40 && deltaY < 60) {
      if (deltaX < 0) {
        next();
      } else {
        prev();
      }
      resetInterval();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!posts || posts.length === 0) return null;

  const post = posts[current];
  const imageUrl = getImageUrl(post.mainImage, 1200, 600);
  const postLink = getPostUrl(post);
  const uniqueCategories = deduplicateCategories(post.categories || []).slice(0, 2);
  const statusInfo = getContestStatusInfo(post);
  const formattedDate = formatDate(post.publishedAt);

  return (
    <section className="mb-10 md:mb-12" aria-label="Destaques principais">
      {/* Label de destaque */}
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
        <span>Destaques Principais</span>
        <span className="ml-auto text-slate-400 font-normal normal-case tracking-normal tabular-nums">
          {current + 1} / {total}
        </span>
      </div>

      {/* Card carousel com suporte a swipe */}
      <article
        className="relative bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/*
          Layout mobile:  imagem topo (altura fixa) + conteúdo abaixo
          Layout desktop: side-by-side em grid de 2 colunas
        */}
        <div className="flex flex-col md:grid md:grid-cols-2 md:items-stretch">

          {/* ── Imagem ── */}
          <div className="relative w-full h-52 sm:h-64 md:h-auto md:min-h-[340px] overflow-hidden shrink-0">
            <Link href={postLink} className="block w-full h-full" tabIndex={-1} aria-hidden="true">
              <Image
                key={post._id}
                src={imageUrl}
                alt={post.title}
                fill
                className={`object-cover transition-all duration-350 ${
                  isAnimating
                    ? direction === 'right'
                      ? 'opacity-0 scale-[1.02] translate-x-3'
                      : 'opacity-0 scale-[1.02] -translate-x-3'
                    : 'opacity-100 scale-100 translate-x-0'
                }`}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </Link>

            {/* Badges sobre a imagem */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md backdrop-blur ${statusInfo.badgeBg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                {statusInfo.label}
              </span>
              {uniqueCategories.map((cat) => (
                <Link
                  key={cat._id}
                  href={getCategoryUrl(cat)}
                  className="bg-blue-600/90 hover:bg-blue-700 backdrop-blur text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md transition-colors"
                >
                  {cat.title}
                </Link>
              ))}
            </div>

            {/* Botões ← → sobre a imagem — sempre visíveis no mobile, hover no desktop */}
            <button
              onClick={() => { prev(); resetInterval(); }}
              aria-label="Matéria anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20
                         w-8 h-8 md:w-9 md:h-9 rounded-full
                         bg-white/90 backdrop-blur
                         border border-slate-200 shadow-md
                         flex items-center justify-center
                         text-slate-700
                         hover:bg-blue-600 hover:text-white hover:border-blue-600
                         active:scale-95
                         transition-all duration-200
                         opacity-80 hover:opacity-100
                         focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              onClick={() => { next(); resetInterval(); }}
              aria-label="Próxima matéria"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20
                         w-8 h-8 md:w-9 md:h-9 rounded-full
                         bg-white/90 backdrop-blur
                         border border-slate-200 shadow-md
                         flex items-center justify-center
                         text-slate-700
                         hover:bg-blue-600 hover:text-white hover:border-blue-600
                         active:scale-95
                         transition-all duration-200
                         opacity-80 hover:opacity-100
                         focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* ── Conteúdo textual ── */}
          <div
            className={`p-5 sm:p-6 md:p-8 flex flex-col justify-center gap-3 transition-all duration-350 ${
              isAnimating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
            }`}
          >
            {/* Data + autor */}
            <div className="flex flex-wrap items-center text-xs text-slate-500 gap-1.5">
              <span>{formattedDate}</span>
              {post.author && (
                <>
                  <span>•</span>
                  <span>Por {post.author.name}</span>
                </>
              )}
            </div>

            {/* Título */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 hover:text-blue-600 transition-colors leading-tight">
              <Link href={postLink}>{post.title}</Link>
            </h2>

            {/* Excerpt — reduzido para 2 linhas no mobile */}
            {post.excerpt && (
              <p className="text-slate-600 text-sm md:text-base line-clamp-2 md:line-clamp-3 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            {/* CTA */}
            <div className="flex items-center justify-between">
              <Link
                href={postLink}
                className="inline-flex items-center gap-1 font-bold text-sm text-blue-600 hover:translate-x-1 transition-transform"
              >
                Ler matéria completa →
              </Link>
              {statusInfo.expirationNote && (
                <span className="text-xs text-slate-400 font-medium hidden sm:block">
                  {statusInfo.expirationNote}
                </span>
              )}
            </div>

            {/* Dots de navegação — sempre visíveis */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              {posts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    goTo(idx, idx > current ? 'right' : 'left');
                    resetInterval();
                  }}
                  aria-label={`Ir para destaque ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 touch-manipulation ${
                    idx === current
                      ? 'bg-blue-600 w-6'
                      : 'bg-slate-300 hover:bg-blue-400 w-2'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
