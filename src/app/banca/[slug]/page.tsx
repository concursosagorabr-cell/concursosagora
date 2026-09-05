import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCachedBancaPosts } from '@/lib/sanity';
import { getExamBoardBySlug, getAllExamBoards } from '@/utils/bancas';
import Breadcrumb from '@/components/Breadcrumb';
import PostCard from '@/components/PostCard';
import SegmentedAlertBox from '@/components/SegmentedAlertBox';

interface BancaPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 300; // 5 minutos ISR

export async function generateStaticParams() {
  const boards = getAllExamBoards();
  return boards.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: BancaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const banca = getExamBoardBySlug(slug);

  if (!banca) {
    return { title: 'Banca não encontrada' };
  }

  const currentYear = new Date().getFullYear();
  const title = `Concursos Banca ${banca.name} ${currentYear}: Editais Abertos, Perfil e Vagas`;
  const description = `Guia completo dos concursos organizados pela banca ${banca.name} em ${currentYear}. Editais abertos, histórico de provas, dicas de resolução e vagas.`;
  const url = `https://concursosagora.com.br/banca/${banca.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: `concursos ${banca.shortName}, edital banca ${banca.shortName}, provas ${banca.name}, concurso ${banca.shortName} ${currentYear}`,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      locale: 'pt_BR',
    },
  };
}

export default async function BancaPage({ params }: BancaPageProps) {
  const { slug } = await params;
  const banca = getExamBoardBySlug(slug);

  if (!banca) {
    notFound();
  }

  const posts = await getCachedBancaPosts(banca.slug, banca.searchQuery);
  const allBoards = getAllExamBoards();
  const pageUrl = `https://concursosagora.com.br/banca/${banca.slug}`;

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: `Concursos Públicos da Banca ${banca.name}`,
        description: banca.description,
        url: pageUrl,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://concursosagora.com.br' },
            { '@type': 'ListItem', position: 2, name: 'Bancas Organizadoras', item: 'https://concursosagora.com.br/concursos' },
            { '@type': 'ListItem', position: 3, name: banca.name, item: pageUrl },
          ],
        },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: (posts || []).slice(0, 20).map((post, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: post.title,
            url: `https://concursosagora.com.br/post/${typeof post.slug === 'string' ? post.slug : (post.slug as any)?.current || post._id}`,
          })),
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `Como é o estilo de prova da banca ${banca.shortName}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: banca.style,
            },
          },
          {
            '@type': 'Question',
            name: `Como passar em um concurso da banca ${banca.shortName}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: banca.tips.join(' '),
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-slate-50 py-6 sm:py-10">
        <div className="container mx-auto px-4 max-w-7xl space-y-8">
          <Breadcrumb
            items={[
              { label: 'Início', href: '/' },
              { label: 'Bancas Organizadoras', href: '/concursos' },
              { label: banca.name },
            ]}
          />

          {/* Hero Header da Banca */}
          <header className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4 max-w-3xl">
              <div className="flex flex-wrap gap-2">
                <span className="px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase tracking-wider">
                  🏢 Banca Examinadora Oficial
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Concursos Banca {banca.name}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {banca.description}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse motion-reduce:animate-none" />
                  {posts.length} {posts.length === 1 ? 'concurso listado' : 'concursos listados'}
                </span>

                {banca.website && (
                  <a
                    href={banca.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                  >
                    <span>Portal Oficial da Banca</span>
                    <span>↗</span>
                  </a>
                )}
              </div>
            </div>
          </header>

          {/* Dicas Estratégicas e Perfil da Banca */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span>🧠</span> Perfil da Prova & Dicas Estratégicas ({banca.shortName})
            </h2>

            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>Estilo de Cobrança:</strong> {banca.style}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {banca.tips.map((tip, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Editais Ativos da Banca */}
          <section aria-label={`Concursos da banca ${banca.name}`}>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mb-6 flex items-center gap-2.5">
              <span className="w-2.5 h-6 bg-blue-600 rounded-full" />
              Editais Recentes e Abertos pela {banca.shortName}
            </h2>

            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                <p className="text-3xl">📋</p>
                <h3 className="text-lg font-bold text-slate-900">
                  Nenhum edital recente registrado para a {banca.shortName} no momento
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Acompanhe nosso portal ou cadastre seu e-mail para receber as notificações assim que um novo certame for lançado pela {banca.shortName}.
                </p>
              </div>
            )}
          </section>

          {/* Captura de Leads Segmentada por Banca */}
          <SegmentedAlertBox
            segmentName={`Banca ${banca.shortName}`}
            badgeText={`Alerta de Editais ${banca.shortName}`}
          />

          {/* Navegação Rápida entre Outras Bancas */}
          <section className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              Conheça e Acompanhe Outras Bancas Examinadoras:
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {allBoards
                .filter((b) => b.slug !== banca.slug)
                .map((other) => (
                  <Link
                    key={other.slug}
                    href={`/banca/${other.slug}`}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-600 text-xs font-bold border border-slate-200 transition-colors"
                  >
                    Banca {other.shortName} →
                  </Link>
                ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
