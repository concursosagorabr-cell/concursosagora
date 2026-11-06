import Image from 'next/image';
import Link from 'next/link';
import type { Analise } from '@/types';
import { formatAnaliseDate, getAnaliseReadingMinutes } from '@/content/analises';

interface AnaliseCardProps {
  analise: Analise;
  variant?: 'default' | 'compact';
}

export default function AnaliseCard({ analise, variant = 'default' }: AnaliseCardProps) {
  const href = `/analises/${analise.slug}`;
  const readingMinutes = getAnaliseReadingMinutes(analise);
  const date = formatAnaliseDate(analise.publishedAt);

  if (variant === 'compact') {
    return (
      <Link
        href={href}
        className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-amber-300 hover:shadow-md"
      >
        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-200">
          <Image
            src={analise.image.src}
            alt=""
            fill
            sizes="80px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
            Análise
          </span>
          <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-amber-700">
            {analise.shortTitle}
          </p>
          <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
            {date} · {readingMinutes} min
          </span>
        </div>
      </Link>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-xl">
      <Link href={href} className="relative block aspect-[16/9] overflow-hidden bg-slate-200">
        <Image
          src={analise.image.src}
          alt={analise.image.alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-slate-950/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-400 backdrop-blur">
          Análise
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-slate-500">
          <span>{date}</span>
          <span aria-hidden="true">•</span>
          <span>{readingMinutes} min de leitura</span>
        </div>

        <h3 className="text-base sm:text-lg font-black leading-snug text-slate-900">
          <Link href={href} className="transition-colors group-hover:text-amber-700">
            {analise.shortTitle}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
          {analise.excerpt}
        </p>

        <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-700">
          Ler análise
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </article>
  );
}
