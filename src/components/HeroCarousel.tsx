'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types';
import { getImageUrl } from '@/lib/image';
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

  const total = posts.length;

  const goTo = useCallback(
    (index: number, dir: 'left' | 'right' = 'right') => {
      if (isAnimating || index === current) return;
      setDirection(dir);
      setIsAnimating(true);
      setTimeout(() => {
        setCurrent(index);
        setIsAnimating(false);
      }, 400);
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

  if (!posts || posts.length === 0) return null;

  const post = posts[current];
  const imageUrl = getImageUrl(post.mainImage, 1200, 600);
  const postLink = `/post/${post.slug || post._id}`;
  const uniqueCategories = deduplicateCategories(post.categories || []).slice(0, 2);
  const statusInfo = getContestStatusInfo(post);
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <section className="mb-12 relative group/carousel" aria-label="Destaques principais">
      {/* Label de destaque */}
      <div className="mb-4 flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
        <span>Destaques Principais</span>
        <span className="ml-auto text-slate-400 font-normal normal-case tracking-normal">
          {current + 1} / {total}
        </span>
      </div>

      {/* Card principal */}
      <article
        className="relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 grid md:grid-cols-2 items-stretch transition-all hover:shadow-2xl"
        style={{ minHeight: '340px' }}
      >
        {/* Imagem */}
        <div className="relative w-full h-64 md:h-full min-h-[300px] overflow-hidden">
          <Link href={postLink} className="block w-full h-full" tabIndex={-1}>
            <Image
              key={post._id}
              src={imageUrl}
              alt={post.title}
              fill
              className={`object-cover transition-all duration-500 group-hover/carousel:scale-105 ${
                isAnimating
                  ? direction === 'right'
                    ? 'opacity-0 translate-x-4'
                    : 'opacity-0 -translate-x-4'
                  : 'opacity-100 translate-x-0'
              }`}
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </Link>

          {/* Badges sobre a imagem */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10 items-center">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md backdrop-blur ${statusInfo.badgeBg}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
              {statusInfo.label}
            </span>
            {uniqueCategories.map((cat) => (
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

        {/* Conteúdo textual */}
        <div
          className={`p-6 md:p-8 flex flex-col justify-center space-y-4 transition-all duration-400 ${
            isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="flex flex-wrap items-center text-xs text-slate-500 dark:text-slate-400 gap-2">
            <span>{formattedDate}</span>
            {post.author && (
              <>
                <span>•</span>
                <span>Por {post.author.name}</span>
              </>
            )}
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-tight">
            <Link href={postLink}>{post.title}</Link>
          </h2>

          {post.excerpt && (
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base line-clamp-3 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <div className="pt-2 flex items-center justify-between">
            <Link
              href={postLink}
              className="inline-flex items-center font-bold text-sm text-blue-600 dark:text-blue-400 hover:translate-x-1 transition-transform"
            >
              Ler matéria completa →
            </Link>
            <span className="text-xs text-slate-400 font-medium">{statusInfo.expirationNote}</span>
          </div>

          {/* Dots de navegação */}
          <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            {posts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  goTo(idx, idx > current ? 'right' : 'left');
                  resetInterval();
                }}
                aria-label={`Ir para destaque ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  idx === current
                    ? 'bg-blue-600 w-6'
                    : 'bg-slate-300 dark:bg-slate-700 hover:bg-blue-400 dark:hover:bg-blue-600 w-2'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Botão Anterior */}
        <button
          onClick={() => {
            prev();
            resetInterval();
          }}
          aria-label="Matéria anterior"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Botão Próximo */}
        <button
          onClick={() => {
            next();
            resetInterval();
          }}
          aria-label="Próxima matéria"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      </article>
    </section>
  );
}
