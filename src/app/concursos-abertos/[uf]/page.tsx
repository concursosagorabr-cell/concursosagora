import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sanityFetch } from '@/lib/sanity';
import { Post } from '@/types';
import PostCard from '@/components/PostCard';
import Breadcrumb from '@/components/Breadcrumb';
import Sidebar from '@/components/Sidebar';
import ShareButtons from '@/components/ShareButtons';
import CommunityBanner from '@/components/CommunityBanner';
import { BRAZIL_STATES } from '@/utils/states';

export const revalidate = 300; // 5 minutos ISR

interface StatePageProps {
  params: Promise<{
    uf: string;
  }>;
}

export async function generateStaticParams() {
  return Object.keys(BRAZIL_STATES).map((uf) => ({ uf }));
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { uf } = await params;
  const ufLower = uf.toLowerCase();
  const state = BRAZIL_STATES[ufLower];

  if (!state) {
    return { title: 'Estado não encontrado' };
  }

  const ufUpper = ufLower.toUpperCase();
  const currentYear = new Date().getFullYear();
  const title = `Concursos Abertos em ${state.name} (${ufUpper}) ${currentYear}: Vagas e Editais`;
  const description = `Confira a lista atualizada de concursos públicos abertos e previstos em ${state.name} (${ufUpper}) em ${currentYear}. Vagas para prefeituras, tribunais, polícias e órgãos estaduais.`;
  const url = `https://concursosagora.com.br/concursos-abertos/${ufLower}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: `concursos abertos em ${state.name}, concurso ${ufUpper} ${currentYear}, vagas ${state.name}, editais ${ufUpper}, concurso público ${state.capital}`,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      locale: 'pt_BR',
      images: [
        {
          url: 'https://concursosagora.com.br/logo.png',
          width: 1200,
          height: 630,
          alt: `Concursos Abertos em ${state.name} - Concursos Agora`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

const statePostsQuery = `
  *[_type == "post" && (
    location match $ufUpper ||
    location match $stateName ||
    $ufLower in categories[]->slug.current ||
    $ufUpper in categories[]->title ||
    $stateName in categories[]->title ||
    title match " " + $ufUpper + " " ||
    title match "-" + $ufUpper ||
    title match "/" + $ufUpper ||
    title match $stateName
  )] | order(publishedAt desc)[0..30] {
    _id,
    _createdAt,
    _updatedAt,
    title,
    "slug": coalesce(slug.current, _id),
    publishedAt,
    enrollmentEndDate,
    examDate,
    mainImage {
      ...,
      asset-> {
        _id,
        url
      }
    },
    "excerpt": coalesce(excerpt, array::join(string::split(pt::text(body), " ")[0..35], " ") + "..."),
    "author": author->{
      _id,
      name,
      image
    },
    "categories": coalesce(categories[]->{
      _id,
      title,
      "slug": coalesce(slug.current, _id)
    }, [])
  }
`;

export default async function StateContestsPage({ params }: StatePageProps) {
  const { uf } = await params;
  const ufLower = uf.toLowerCase();
  const state = BRAZIL_STATES[ufLower];

  if (!state) {
    notFound();
  }

  const ufUpper = ufLower.toUpperCase();
  const stateName = state.name;

  let posts: Post[] = [];
  try {
    posts = await sanityFetch(statePostsQuery, {
      ufLower,
      ufUpper,
      stateName,
    });
  } catch (error) {
    console.error(`Erro ao buscar concursos de ${stateName}:`, error);
  }

  const pageUrl = `https://concursosagora.com.br/concursos-abertos/${ufLower}`;

  // JSON-LD Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Concursos Públicos Abertos em ${stateName} (${ufUpper})`,
    description: `Lista completa de editais e concursos abertos em ${stateName}.`,
    url: pageUrl,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Início',
          item: 'https://concursosagora.com.br',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Concursos Abertos',
          item: 'https://concursosagora.com.br/concursos-abertos/sp',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: `${stateName} (${ufUpper})`,
          item: pageUrl,
        },
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: (posts || []).map((post, index) => ({
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

      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 sm:py-10">
        <div className="container mx-auto px-4 max-w-7xl">
          <Breadcrumb
            items={[
              { label: 'Início', href: '/' },
              { label: 'Concursos por Estado', href: '/hub/concursos-municipais' },
              { label: `${stateName} (${ufUpper})` },
            ]}
          />

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-8">
              {/* Header Hero do Estado */}
              <header className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl border border-blue-700/40 relative overflow-hidden">
                <div className="relative z-10 space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                    <span>Região {state.region}</span>
                    <span>•</span>
                    <span>Capital: {state.capital}</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                    Concursos Abertos em {stateName} ({ufUpper})
                  </h1>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                    Guia consolidado com todos os editais publicados, inscrições abertas e oportunidades previstas em prefeituras, órgãos estaduais e federais em {stateName}.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {posts.length} {posts.length === 1 ? 'oportunidade listada' : 'oportunidades listadas'}
                    </span>
                  </div>
                </div>
              </header>

              {/* Barra de Compartilhamento */}
              <ShareButtons
                title={`Concursos Abertos em ${stateName} (${ufUpper})`}
                url={pageUrl}
                excerpt={`Confira a lista completa de vagas abertas e editais em ${stateName}.`}
              />

              {/* Lista de Concursos do Estado */}
              <section aria-label={`Lista de concursos em ${stateName}`}>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2.5">
                  <span className="w-2.5 h-6 bg-blue-600 rounded-full" />
                  Editais Recentes em {stateName}
                </h2>

                {posts && posts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {posts.map((post) => (
                      <PostCard key={post._id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                    <p className="text-3xl">📋</p>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Nenhum edital recente específico para {stateName} no momento
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                      Novas vagas são publicadas diariamente. Acesse a página inicial ou inscreva-se nos nossos canais para ser avisado assim que sair um novo edital em {ufUpper}.
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                    >
                      Ver Todos os Concursos Nacionais
                    </Link>
                  </div>
                )}
              </section>

              {/* Banner de Comunidade */}
              <CommunityBanner categoryName={stateName} />

              {/* Navegação Rápida entre Outros Estados da Mesma Região */}
              <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
                  Outros Estados na Região {state.region}:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(BRAZIL_STATES)
                    .filter(([otherUf, otherData]) => otherData.region === state.region && otherUf !== ufLower)
                    .map(([otherUf, otherData]) => (
                      <Link
                        key={otherUf}
                        href={`/concursos-abertos/${otherUf}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/40 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        {otherData.name} ({otherUf.toUpperCase()})
                      </Link>
                    ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-6">
              <Sidebar />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}