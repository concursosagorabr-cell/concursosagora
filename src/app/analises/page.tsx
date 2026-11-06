import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import AnaliseCard from '@/components/analises/AnaliseCard';
import {
  formatAnaliseDate,
  getAllAnalises,
  getAnaliseReadingMinutes,
} from '@/content/analises';
import { SITE_URL } from '@/lib/constants';

export const revalidate = 300;

const PAGE_URL = `${SITE_URL}/analises`;

export const metadata: Metadata = {
  title: 'Análises & Opinião',
  description:
    'Análises editoriais do Concursos Agora sobre carreira pública, economia, política e o caminho da estabilidade profissional no Brasil.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Análises & Opinião | Concursos Agora',
    description:
      'Leituras sem filtro sobre o mercado, a política e o caminho da estabilidade pública.',
    url: PAGE_URL,
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Concursos Agora',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Análises & Opinião | Concursos Agora',
    description:
      'Leituras sem filtro sobre o mercado, a política e o caminho da estabilidade pública.',
  },
};

export default function AnalisesPage() {
  const analises = getAllAnalises();
  const [featured, ...rest] = analises;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Análises & Opinião',
        item: PAGE_URL,
      },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Análises & Opinião',
    url: PAGE_URL,
    description:
      'Análises editoriais sobre carreira pública, economia e estabilidade profissional.',
    numberOfItems: analises.length,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: analises.map((analise, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/analises/${analise.slug}`,
        name: analise.title,
      })),
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-0 py-2 sm:py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <Breadcrumb items={[{ label: 'Análises & Opinião' }]} />

      <header className="relative overflow-hidden rounded-2xl bg-slate-950 p-6 text-white shadow-xl ring-1 ring-slate-800 sm:rounded-3xl sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl"
        />

        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-amber-400">
              <span aria-hidden="true" className="inline-block h-px w-8 bg-amber-400" />
              Coluna editorial
            </span>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
              Análises &amp; Opinião
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              Leituras sem filtro sobre o mercado, a política e o caminho da estabilidade
              pública. O contexto que falta para você decidir o próximo passo da sua carreira.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center backdrop-blur">
            <span className="block text-2xl font-black text-amber-400 sm:text-3xl">
              {analises.length}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              {analises.length === 1 ? 'Análise publicada' : 'Análises publicadas'}
            </span>
          </div>
        </div>
      </header>

      {analises.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-base font-bold text-slate-800">
            Nenhuma análise publicada no momento.
          </p>
          <Link
            href="/noticias"
            className="mt-3 inline-block text-sm font-bold text-blue-600 hover:underline"
          >
            Ver as últimas notícias →
          </Link>
        </div>
      ) : (
        <>
          {featured && (
            <article className="mt-8 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg lg:grid-cols-2">
              <Link
                href={`/analises/${featured.slug}`}
                className="group relative block min-h-[240px] overflow-hidden bg-slate-200 sm:min-h-[320px]"
              >
                <Image
                  src={featured.image.src}
                  alt={featured.image.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-950 shadow">
                  Em destaque
                </span>
              </Link>

              <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-amber-400">
                      Análise
                    </span>
                    <span>{formatAnaliseDate(featured.publishedAt)}</span>
                    <span aria-hidden="true">•</span>
                    <span>{getAnaliseReadingMinutes(featured)} min de leitura</span>
                  </div>

                  <h2 className="mt-3 text-2xl font-black leading-tight text-slate-900 sm:text-3xl">
                    <Link
                      href={`/analises/${featured.slug}`}
                      className="transition-colors hover:text-amber-700"
                    >
                      {featured.shortTitle}
                    </Link>
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                    {featured.excerpt}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                  <div className="text-xs text-slate-500">
                    <span className="block font-bold text-slate-800">
                      {featured.author.name}
                    </span>
                    <span>{featured.author.role}</span>
                  </div>
                  <Link
                    href={`/analises/${featured.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-amber-400 transition-colors hover:bg-slate-800"
                  >
                    Ler análise
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </article>
          )}

          {rest.length > 0 && (
            <section className="mt-10" aria-labelledby="analises-lista">
              <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
                <h2
                  id="analises-lista"
                  className="text-lg font-black text-slate-900 sm:text-xl"
                >
                  Todas as análises
                </h2>
                <span className="text-xs font-semibold text-slate-500">
                  {rest.length} {rest.length === 1 ? 'publicação' : 'publicações'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((analise) => (
                  <AnaliseCard key={analise.slug} analise={analise} />
                ))}
              </div>
            </section>
          )}

          <section className="mt-10 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 sm:p-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Análise é contexto. Aprovação é decisão.
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                  Depois de entender o cenário, dê o próximo passo: confira os editais abertos,
                  os salários e o cronograma do concurso que pode mudar a sua carreira.
                </p>
              </div>
              <Link
                href="/concursos"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-wider text-amber-400 transition-colors hover:bg-slate-800"
              >
                Explorar vagas
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
