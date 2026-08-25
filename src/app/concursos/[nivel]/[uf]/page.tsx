import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCachedEducationAndStatePosts, getCachedRecentPosts } from '@/lib/sanity';
import { BRAZIL_STATES } from '@/utils/states';
import ContestExplorer from '@/components/ContestExplorer';
import Breadcrumb from '@/components/Breadcrumb';
import SegmentedAlertBox from '@/components/SegmentedAlertBox';
import PostCard from '@/components/PostCard';

interface EduStatePageProps {
  params: Promise<{
    nivel: string;
    uf: string;
  }>;
}

export const revalidate = 300; // 5 minutos ISR

const EDU_LEVEL_MAP: Record<string, { key: string; label: string; short: string }> = {
  'nivel-medio': { key: 'medio', label: 'Nível Médio e Técnico', short: 'Nível Médio' },
  'nivel-superior': { key: 'superior', label: 'Nível Superior (Graduação)', short: 'Nível Superior' },
  'nivel-fundamental': { key: 'fundamental', label: 'Nível Fundamental', short: 'Nível Fundamental' },
};

export async function generateStaticParams() {
  const levels = Object.keys(EDU_LEVEL_MAP);
  const ufs = Object.keys(BRAZIL_STATES);
  const params: Array<{ nivel: string; uf: string }> = [];

  for (const nivel of levels) {
    for (const uf of ufs) {
      params.push({ nivel, uf });
    }
  }

  return params;
}

export async function generateMetadata({ params }: EduStatePageProps): Promise<Metadata> {
  const { nivel, uf } = await params;
  const eduInfo = EDU_LEVEL_MAP[nivel.toLowerCase()];
  const state = BRAZIL_STATES[uf.toLowerCase()];

  if (!eduInfo || !state) {
    return { title: 'Página não encontrada' };
  }

  const ufUpper = uf.toUpperCase();
  const year = new Date().getFullYear();
  const title = `Concursos ${eduInfo.short} em ${state.name} (${ufUpper}) ${year}: Editais Abertos e Vagas`;
  const description = `Confira a lista de concursos públicos abertos e previstos para ${eduInfo.label} em ${state.name} (${ufUpper}) em ${year}. Vagas em prefeituras, tribunais e segurança pública.`;
  const url = `https://concursosagora.com.br/concursos/${nivel.toLowerCase()}/${uf.toLowerCase()}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: `concursos ${eduInfo.short} ${state.name}, concurso ${ufUpper} ${eduInfo.short}, vagas ${state.name} ${year}, editais ${ufUpper}`,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      locale: 'pt_BR',
    },
  };
}

export default async function EducationAndStatePage({ params }: EduStatePageProps) {
  const { nivel, uf } = await params;
  const nivelLower = nivel.toLowerCase();
  const ufLower = uf.toLowerCase();

  const eduInfo = EDU_LEVEL_MAP[nivelLower];
  const state = BRAZIL_STATES[ufLower];

  if (!eduInfo || !state) {
    notFound();
  }

  const ufUpper = ufLower.toUpperCase();
  const stateName = state.name;

  const [posts, recentPosts] = await Promise.all([
    getCachedEducationAndStatePosts(eduInfo.key, eduInfo.short, ufLower, ufUpper, stateName),
    getCachedRecentPosts(),
  ]);

  const pageUrl = `https://concursosagora.com.br/concursos/${nivelLower}/${ufLower}`;

  // JSON-LD Schemas (CollectionPage + ItemList + FAQPage)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: `Concursos Públicos para ${eduInfo.label} em ${stateName} (${ufUpper})`,
        description: `Lista atualizada de editais e oportunidades para candidatos de ${eduInfo.label} em ${stateName}.`,
        url: pageUrl,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://concursosagora.com.br' },
            { '@type': 'ListItem', position: 2, name: 'Concursos', item: 'https://concursosagora.com.br/concursos' },
            { '@type': 'ListItem', position: 3, name: `${eduInfo.short} em ${ufUpper}`, item: pageUrl },
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
            name: `Quais são os principais concursos de ${eduInfo.short} em ${stateName}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Em ${stateName}, os concursos de ${eduInfo.short} mais concorridos ocorrem em prefeituras municipais, órgãos do poder judiciário, secretarias estaduais e corporações de segurança pública.`,
            },
          },
          {
            '@type': 'Question',
            name: `Qual a faixa salarial média para ${eduInfo.short} em ${stateName}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Os salários iniciais variam de R$ 2.500,00 a mais de R$ 8.000,00 para ${eduInfo.short} em ${stateName}, a depender do órgão, plano de cargos e gratificações estatutárias.`,
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
              { label: 'Explorador de Concursos', href: '/concursos' },
              { label: `${eduInfo.short} em ${stateName} (${ufUpper})` },
            ]}
          />

          {/* Hero Header Segmentado */}
          <header className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white shadow-xl border border-blue-800/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4 max-w-3xl">
              <div className="flex flex-wrap gap-2">
                <span className="px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black uppercase tracking-wider">
                  🎓 {eduInfo.label}
                </span>
                <span className="px-3.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider">
                  📍 {stateName} ({ufUpper})
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Concursos para {eduInfo.short} em {stateName}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Central de editais abertos e previstos para cargos de {eduInfo.label} no estado de {stateName}. Consulte remunerações, datas de inscrição e bancas examinadoras.
              </p>

              <div className="pt-2">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {posts.length} {posts.length === 1 ? 'oportunidade localizada' : 'oportunidades localizadas'}
                </span>
              </div>
            </div>
          </header>

          {/* Lista de Concursos Específicos */}
          <section aria-label={`Vagas de ${eduInfo.short} em ${stateName}`}>
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                <p className="text-3xl">📋</p>
                <h2 className="text-lg font-bold text-slate-900">
                  Nenhum edital recente específico para {eduInfo.short} em {stateName} no momento
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Novos concursos são adicionados diariamente. Cadastre seu e-mail abaixo para ser avisado assim que sair um novo edital.
                </p>
              </div>
            )}
          </section>

          {/* Captura de Leads Segmentada */}
          <SegmentedAlertBox
            segmentName={`${eduInfo.short} em ${stateName}`}
            badgeText={`Alerta ${ufUpper} ${eduInfo.short}`}
          />

          {/* Navegação Cruzada entre Outras Escolaridades no Mesmo Estado */}
          <section className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              Outras Escolaridades em {stateName}:
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(EDU_LEVEL_MAP)
                .filter(([slug]) => slug !== nivelLower)
                .map(([slug, info]) => (
                  <Link
                    key={slug}
                    href={`/concursos/${slug}/${ufLower}`}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-600 text-xs font-bold border border-slate-200 transition-colors"
                  >
                    {info.short} em {stateName} ({ufUpper}) →
                  </Link>
                ))}
              <Link
                href={`/concursos-abertos/${ufLower}`}
                className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors"
              >
                Ver Todos os Concursos de {ufUpper} →
              </Link>
            </div>
          </section>

          {/* Navegação Cruzada para Outros Estados da Mesma Região */}
          <section className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              {eduInfo.short} em outros estados da Região {state.region}:
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(BRAZIL_STATES)
                .filter(([otherUf, otherData]) => otherData.region === state.region && otherUf !== ufLower)
                .map(([otherUf, otherData]) => (
                  <Link
                    key={otherUf}
                    href={`/concursos/${nivelLower}/${otherUf}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-semibold border border-slate-200 transition-colors"
                  >
                    {eduInfo.short} em {otherData.name} ({otherUf.toUpperCase()})
                  </Link>
                ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
