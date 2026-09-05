import { Metadata } from 'next';
import Link from 'next/link';
import { getCachedHighSalaryPosts } from '@/lib/sanity';
import Breadcrumb from '@/components/Breadcrumb';
import PostCard from '@/components/PostCard';
import SegmentedAlertBox from '@/components/SegmentedAlertBox';

export const revalidate = 300; // 5 minutos ISR

export const metadata: Metadata = {
  title: 'Concursos com Salário Acima de R$ 10.000 em 2026: Vagas de Alta Remuneração',
  description:
    'Guia atualizado com todos os concursos públicos com salários acima de R$ 10.000, R$ 15.000 e R$ 20.000 por mês. Oportunidades fiscais, jurídicas, policiais e de controle.',
  alternates: { canonical: 'https://concursosagora.com.br/concursos/salario-acima-de-10-mil' },
  keywords:
    'concursos salario alto, concursos acima de 10 mil, concursos fiscais, concursos tribunais, concursos perito policial, salarios concursos 2026',
  openGraph: {
    title: 'Concursos com Salário Acima de R$ 10.000 em 2026 — Concursos Agora',
    description:
      'Confira os melhores editais do Brasil com remunerações acima de R$ 10 mil mensais.',
    url: 'https://concursosagora.com.br/concursos/salario-acima-de-10-mil',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default async function HighSalaryContestsPage() {
  const posts = await getCachedHighSalaryPosts();
  const pageUrl = 'https://concursosagora.com.br/concursos/salario-acima-de-10-mil';

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Concursos Públicos com Salários Acima de R$ 10.000',
    description:
      'Seleção de editais abertos e previstos com as maiores remunerações do serviço público brasileiro.',
    url: pageUrl,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://concursosagora.com.br' },
        { '@type': 'ListItem', position: 2, name: 'Concursos', item: 'https://concursosagora.com.br/concursos' },
        { '@type': 'ListItem', position: 3, name: 'Salários Acima de R$ 10.000', item: pageUrl },
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
              { label: 'Explorador de Concursos', href: '/concursos' },
              { label: 'Salários Acima de R$ 10 Mil' },
            ]}
          />

          {/* Hero Header */}
          <header className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white shadow-xl border border-emerald-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4 max-w-3xl">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
                💰 Carreiras de Elite
              </span>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Concursos com Salário Acima de R$ 10.000
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                As melhores oportunidades do serviço público: Auditor Fiscal, Delegado, Defensor, Analista de TI, Perito Criminal, Procurador e Carreiras de Controle (TCU/TCE).
              </p>

              <div className="pt-2">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse motion-reduce:animate-none" />
                  {posts.length} {posts.length === 1 ? 'edital de alto rendimento' : 'editais de alto rendimento'}
                </span>
              </div>
            </div>
          </header>

          {/* Lista de Vagas */}
          <section aria-label="Concursos com salários acima de 10 mil reais">
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                <p className="text-3xl">💼</p>
                <h2 className="text-lg font-bold text-slate-900">
                  Nenhum edital com salário acima de R$ 10.000 listado no momento
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Acompanhe nosso explorador completo para conferir outras oportunidades disponíveis.
                </p>
                <Link
                  href="/concursos"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                >
                  Ver Todos os Concursos
                </Link>
              </div>
            )}
          </section>

          {/* Alerta VIP */}
          <SegmentedAlertBox
            segmentName="Concursos de Alta Remuneração (R$ 10.000+)"
            badgeText="Alerta VIP de Altos Salários"
          />
        </div>
      </main>
    </>
  );
}
