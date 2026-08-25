import { Metadata } from 'next';
import Link from 'next/link';
import { getCachedDirectoryPosts } from '@/lib/sanity';
import ContestExplorer from '@/components/ContestExplorer';
import Breadcrumb from '@/components/Breadcrumb';
import SegmentedAlertBox from '@/components/SegmentedAlertBox';
import { getAllExamBoards } from '@/utils/bancas';

export const revalidate = 180; // ISR: 3 minutos

export const metadata: Metadata = {
  title: 'Diretório de Concursos Públicos 2026: Filtre por Salário, Escolaridade e Estado',
  description:
    'Explore o diretório completo e atualizado de concursos públicos no Brasil. Filtre editais por salário, nível de escolaridade, banca examinadora e estado.',
  alternates: { canonical: 'https://concursosagora.com.br/concursos' },
  keywords:
    'concursos abertos, diretório de concursos, vagas concursos 2026, concursos nível médio, concursos nível superior, concursos por banca, concurso público salário alto',
  openGraph: {
    title: 'Diretório de Concursos Públicos 2026 — Concursos Agora',
    description:
      'Filtre e encontre seu concurso público ideal por salário, nível de escolaridade, banca organizadora e região.',
    url: 'https://concursosagora.com.br/concursos',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default async function ConcursosDirectoryPage() {
  const posts = await getCachedDirectoryPosts();
  const examBoards = getAllExamBoards();

  // JSON-LD Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Diretório Completo de Concursos Públicos no Brasil',
    description:
      'Guia interativo com editais abertos, vagas por escolaridade, faixas salariais e bancas organizadoras.',
    url: 'https://concursosagora.com.br/concursos',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://concursosagora.com.br' },
        { '@type': 'ListItem', position: 2, name: 'Explorador de Concursos', item: 'https://concursosagora.com.br/concursos' },
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: (posts || []).slice(0, 30).map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: post.title,
        url: `https://concursosagora.com.br/post/${typeof post.slug === 'string' ? post.slug : (post.slug as any)?.current || post._id}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-slate-50 py-6 sm:py-10">
        <div className="container mx-auto px-4 max-w-7xl space-y-8">
          <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'Explorador de Concursos' }]} />

          {/* Hero Header do Diretório */}
          <header className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white shadow-xl border border-blue-900/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4 max-w-3xl">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black uppercase tracking-wider">
                🏛️ Diretório Central de Vagas
              </span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Explorador de Concursos Públicos
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Encontre rapidamente oportunidades em prefeituras, tribunais, polícias, área fiscal e saúde. Utilize os filtros interativos para cruzar sua escolaridade com sua região e pretensão salarial.
              </p>
            </div>
          </header>

          {/* Atalhos Rápidos para Micro-Diretórios Programáticos */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              🎯 Micro-Diretórios & Categorias Populares:
            </h2>
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/concursos/salario-acima-de-10-mil"
                className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1.5"
              >
                <span>💰</span>
                <span>Salários R$ 10.000+</span>
              </Link>

              <Link
                href="/concursos/nivel-medio/sp"
                className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200 transition-colors flex items-center gap-1.5"
              >
                <span>🎓</span>
                <span>Nível Médio em SP</span>
              </Link>

              <Link
                href="/concursos/nivel-superior/rj"
                className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200 transition-colors flex items-center gap-1.5"
              >
                <span>🎓</span>
                <span>Nível Superior no RJ</span>
              </Link>

              {examBoards.slice(0, 5).map((banca) => (
                <Link
                  key={banca.slug}
                  href={`/banca/${banca.slug}`}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <span>🏢</span>
                  <span>Banca {banca.shortName}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Componente Explorador de Concursos com Filtros Vivos */}
          <ContestExplorer initialPosts={posts} />

          {/* Captura de Leads / Alertas Segmentados */}
          <SegmentedAlertBox segmentName="Concursos Públicos Nacionais" />
        </div>
      </main>
    </>
  );
}
