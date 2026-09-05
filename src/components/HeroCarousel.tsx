'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types';
import { getImageUrl } from '@/lib/image';
import { getPostUrl, getCategoryUrl, formatDate } from '@/lib/helpers';
import { deduplicateCategories } from '@/utils/categories';
import { getContestStatusInfo } from '@/utils/status';
import { getDescriptiveImageAlt } from '@/utils/imageAlt';

interface HeroCarouselProps {
  posts: Post[];
}

export default function HeroCarousel({ posts }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const total = posts.length;

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating || index === current) return;
      setIsAnimating(true);
      setTimeout(() => {
        setCurrent(index);
        setIsAnimating(false);
      }, 250);
    },
    [isAnimating, current],
  );

  const next = useCallback(() => {
    goTo((current + 1) % total);
  }, [current, total, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + total) % total);
  }, [current, total, goTo]);

  const resetInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(next, 6000);
  }, [next]);

  useEffect(() => {
    resetInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resetInterval]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);

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

  const leadPost = posts[current];
  const leadImageUrl = getImageUrl(leadPost.mainImage, 1200, 700);
  const leadPostLink = getPostUrl(leadPost);
  const leadCategories = deduplicateCategories(leadPost.categories || []).slice(0, 2);
  const leadStatus = getContestStatusInfo(leadPost);
  const leadDate = formatDate(leadPost.publishedAt);

  // Side highlights: pega outros posts da lista de destaques
  const sidePosts = posts.filter((_, idx) => idx !== current).slice(0, 3);

  return (
    <section className="mb-10 md:mb-12" aria-label="Destaques e Manchetes do Dia">
      {/* Cabeçalho de Destaque Editorial */}
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
          </span>
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <span>Manchetes & Destaques de Hoje</span>
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <span>{current + 1} de {total}</span>
        </div>
      </div>

      {/* Grade Editorial: Manchete Principal (Esq) + Plantão Lateral (Dir) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* ── COLUNA 1: Manchete Principal (Hero Lead) ── */}
        <div
          className="lg:col-span-8 bg-white rounded-2xl overflow-hidden shadow-xs border border-slate-200 flex flex-col justify-between group select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Container da Imagem com Badges e Controles */}
          <div className="relative w-full h-56 sm:h-72 md:h-80 bg-slate-100 overflow-hidden">
            <Link href={leadPostLink} className="block w-full h-full" tabIndex={-1}>
              <Image
                key={leadPost._id}
                src={leadImageUrl}
                alt={getDescriptiveImageAlt(leadPost)}
                fill
                className={`object-cover transition-all duration-500 group-hover:scale-105 ${
                  isAnimating ? 'opacity-50 scale-102' : 'opacity-100 scale-100'
                }`}
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
            </Link>

            {/* Badges Superiores */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
              <div className="flex flex-wrap gap-1.5 pointer-events-auto">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md ${leadStatus.badgeBg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${leadStatus.dotColor}`} />
                  {leadStatus.label}
                </span>
                {leadCategories.map((cat) => (
                  <Link
                    key={cat._id}
                    href={getCategoryUrl(cat)}
                    className="bg-slate-900/80 hover:bg-blue-600 text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md transition-colors"
                  >
                    {cat.title}
                  </Link>
                ))}
              </div>

              {/* Setas Anterior / Próxima */}
              <div className="hidden sm:flex items-center gap-1 pointer-events-auto bg-white/90 p-1 rounded-full border border-slate-200 shadow-sm backdrop-blur-md">
                <button
                  onClick={() => { prev(); resetInterval(); }}
                  aria-label="Manchete anterior"
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors text-base font-bold"
                >
                  ‹
                </button>
                <button
                  onClick={() => { next(); resetInterval(); }}
                  aria-label="Próxima manchete"
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors text-base font-bold"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {/* Conteúdo da Manchete (Fundo Branco Limpo com Tipografia Nítida) */}
          <div className="p-4 sm:p-6 space-y-2.5 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span>{leadDate}</span>
                {leadPost.author && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>Por {leadPost.author.name}</span>
                  </>
                )}
              </div>

              <h3 className="text-lg sm:text-2xl lg:text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                <Link href={leadPostLink}>{leadPost.title}</Link>
              </h3>

              {leadPost.excerpt && (
                <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                  {leadPost.excerpt}
                </p>
              )}
            </div>

            {/* Rodapé da Manchete com CTA e Indicadores de Slide */}
            <div className="pt-3 mt-3 flex items-center justify-between border-t border-slate-100">
              <Link
                href={leadPostLink}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span>Ler cobertura completa</span>
                <span className="text-base leading-none">→</span>
              </Link>

              {/* Dots clicáveis */}
              <div className="flex items-center gap-1.5">
                {posts.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => { goTo(idx); resetInterval(); }}
                    aria-label={`Destaque ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === current ? 'bg-blue-600 w-6' : 'bg-slate-200 hover:bg-slate-300 w-2'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── COLUNA 2: Plantão Lateral (Secondary Breaking News) ── */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-3 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>⚡</span> Plantão de Notícias
            </span>
            <span className="text-xs font-bold text-blue-600">
              Atualizado
            </span>
          </div>

          <div className="flex flex-col divide-y divide-slate-100 flex-1 justify-around">
            {sidePosts.map((post) => {
              const img = getImageUrl(post.mainImage, 160, 160);
              const link = getPostUrl(post);
              const cats = deduplicateCategories(post.categories || []).slice(0, 1);
              const status = getContestStatusInfo(post);

              return (
                <article key={post._id} className="py-3 first:pt-1 last:pb-1 group">
                  <Link href={link} className="flex gap-3 items-start">
                    <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200/60">
                      <Image
                        src={img}
                        alt={getDescriptiveImageAlt(post)}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="88px"
                      />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {cats[0] && (
                          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                            {cats[0].title}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-600 font-medium">
                          {formatDate(post.publishedAt)}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h4>
                      <span className={`inline-flex items-center gap-1 text-xs font-black uppercase px-2 py-0.5 rounded ${status.badgeBg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                        {status.label}
                      </span>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}


