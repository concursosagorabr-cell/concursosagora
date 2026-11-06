import Image from 'next/image';
import Link from 'next/link';
import {
  formatAnaliseDate,
  getAnaliseReadingMinutes,
  getLatestAnalises,
} from '@/content/analises';
import AnaliseCard from './AnaliseCard';

export default function AnaliseHomeSection() {
  const analises = getLatestAnalises(4);

  if (analises.length === 0) return null;

  const [featured, ...rest] = analises;
  const href = `/analises/${featured.slug}`;
  const readingMinutes = getAnaliseReadingMinutes(featured);

  return (
    <section aria-labelledby="analises-home-title" className="my-10 sm:my-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">
            <span aria-hidden="true" className="inline-block h-px w-8 bg-amber-500" />
            Coluna editorial
          </span>
          <h2
            id="analises-home-title"
            className="mt-1 flex items-center gap-2 text-xl sm:text-2xl font-black text-slate-900"
          >
            <span aria-hidden="true">✍️</span>
            Análises &amp; Opinião
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
            Leituras sem filtro sobre o mercado, a política e o caminho da estabilidade pública.
          </p>
        </div>

        <Link
          href="/analises"
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-800 transition-colors hover:bg-amber-100"
        >
          Ver todas
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl bg-slate-950 shadow-2xl ring-1 ring-slate-800">
        <div className="grid lg:grid-cols-12">
          <Link
            href={href}
            className="group relative block min-h-[240px] overflow-hidden bg-slate-900 sm:min-h-[300px] lg:col-span-7 lg:min-h-[400px]"
          >
            <Image
              src={featured.image.src}
              alt={featured.image.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 700px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-slate-950/5 lg:to-slate-950" />
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-950 shadow-lg">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-slate-950" />
              Análise em destaque
            </span>
            <span className="absolute bottom-4 left-4 hidden rounded-full bg-slate-950/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-200 backdrop-blur sm:inline-flex lg:bottom-5 lg:left-5">
              {featured.tags[0]}
            </span>
          </Link>

          <div className="flex flex-col justify-between gap-6 p-6 sm:p-8 lg:col-span-5">
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400">
                Nova análise
              </span>
              <h3 className="mt-3 text-xl sm:text-2xl font-black leading-tight text-white">
                <Link href={href} className="transition-colors hover:text-amber-300">
                  {featured.shortTitle}
                </Link>
              </h3>
              <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-300">
                {featured.excerpt}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
              <div className="text-xs text-slate-400">
                <span className="block font-bold text-slate-100">{featured.author.name}</span>
                <span>
                  {formatAnaliseDate(featured.publishedAt)} · {readingMinutes} min de leitura
                </span>
              </div>
              <Link
                href={href}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 transition-colors hover:bg-amber-300"
              >
                Ler análise
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {rest.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((analise) => (
            <AnaliseCard key={analise.slug} analise={analise} variant="compact" />
          ))}
        </div>
      )}
    </section>
  );
}
