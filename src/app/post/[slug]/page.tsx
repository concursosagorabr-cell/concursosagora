import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getCachedPostBySlug,
  getCachedRelatedPosts,
  getCachedRelatedPostsFallback,
  getCachedRecentPosts,
  getCachedTopPosts,
  getCachedCategories,
  getCachedAllPostSlugs,
} from '@/lib/sanity';
import { Post } from '@/types';
import { getImageUrl } from '@/lib/image';
import { deduplicateCategories } from '@/utils/categories';
import { getContestStatusInfo } from '@/utils/status';
import { getDescriptiveImageAlt } from '@/utils/imageAlt';
import { injectRelatedArticle } from '@/utils/injectRelatedArticle';
import PortableText from '@/components/PortableText';
import Breadcrumb from '@/components/Breadcrumb';
import AuthorCard from '@/components/AuthorCard';
import RelatedPosts from '@/components/RelatedPosts';
import PostHubWidget from '@/components/PostHubWidget';
import InArticleCTA from '@/components/InArticleCTA';
import InstagramFollowBox from '@/components/InstagramFollowBox';
import ShareButtons from '@/components/ShareButtons';
import CommunityBanner from '@/components/CommunityBanner';
import ContestCountdown from '@/components/ContestCountdown';
import ContestQuickFacts from '@/components/ContestQuickFacts';
import Sidebar from '@/components/Sidebar';
import ViewTracker from '@/components/ViewTracker';

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 60; // ISR

export async function generateStaticParams() {
  try {
    const rawSlugs = await getCachedAllPostSlugs();
    const slugs = (rawSlugs || [])
      .map((item: any) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') return item.slug || item.current || item._id;
        return null;
      })
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0);

    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error('Erro ao gerar parâmetros estáticos:', error);
    return [];
  }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCachedPostBySlug(slug);

  if (!post) {
    return { title: 'Post não encontrado' };
  }

  const imageUrl = getImageUrl(post.mainImage, 1200, 630);
  const slugStr = typeof post.slug === 'string' ? post.slug : (post.slug as any)?.current || post._id;
  const url = `https://concursosagora.com.br/post/${slugStr}`;

  return {
    title: post.title,
    description: post.excerpt || `Confira a matéria completa sobre ${post.title}`,
    alternates: { canonical: url },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'article',
      locale: 'pt_BR',
      url,
      title: post.title,
      description: post.excerpt || `Confira a matéria completa sobre ${post.title}`,
      publishedTime: post.publishedAt,
      modifiedTime: post._updatedAt || post.publishedAt,
      tags: (post.categories || []).map((c: { title: string }) => c.title),
      images: [{ url: imageUrl, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || `Confira a matéria completa sobre ${post.title}`,
      images: [imageUrl],
    },
  };
}

/**
 * Extrai automaticamente perguntas (h3) e respostas do Portable Text
 * para gerar o schema estruturado Schema.org/FAQPage para o Google Rich Snippets.
 */
function extractFaqJsonLd(body?: any[]): any | null {
  if (!body || !Array.isArray(body)) return null;

  const faqItems: Array<{ question: string; answer: string }> = [];
  let currentQuestion: string | null = null;
  let currentAnswerParts: string[] = [];
  let inFaqSection = false;

  for (const block of body) {
    if (block._type !== 'block') continue;

    const blockText = (block.children || [])
      .map((c: any) => c.text || '')
      .join('')
      .trim();

    if (!blockText) continue;

    const textLower = blockText.toLowerCase();

    // Identifica o início da seção de Perguntas Frequentes / FAQ
    if (
      (block.style === 'h2' || block.style === 'h3') &&
      (textLower.includes('perguntas frequentes') || textLower.includes('faq') || textLower.includes('dúvidas frequentes'))
    ) {
      inFaqSection = true;
      if (currentQuestion && currentAnswerParts.length > 0) {
        faqItems.push({
          question: currentQuestion,
          answer: currentAnswerParts.join(' '),
        });
      }
      currentQuestion = null;
      currentAnswerParts = [];
      continue;
    }

    // Se encontrou outro H2 fora do FAQ, encerra a captura de FAQ
    if (block.style === 'h2' && inFaqSection) {
      if (currentQuestion && currentAnswerParts.length > 0) {
        faqItems.push({
          question: currentQuestion,
          answer: currentAnswerParts.join(' '),
        });
      }
      currentQuestion = null;
      currentAnswerParts = [];
      inFaqSection = false;
      continue;
    }

    // Identifica uma pergunta (H3 interrogativo ou dentro da seção FAQ)
    const isQuestion =
      block.style === 'h3' &&
      (inFaqSection ||
        blockText.endsWith('?') ||
        textLower.startsWith('como ') ||
        textLower.startsWith('quando ') ||
        textLower.startsWith('qual ') ||
        textLower.startsWith('quem ') ||
        textLower.startsWith('o que '));

    if (isQuestion) {
      if (currentQuestion && currentAnswerParts.length > 0) {
        faqItems.push({
          question: currentQuestion,
          answer: currentAnswerParts.join(' '),
        });
      }
      currentQuestion = blockText;
      currentAnswerParts = [];
    } else if (currentQuestion && (block.style === 'normal' || !block.style)) {
      currentAnswerParts.push(blockText);
    }
  }

  if (currentQuestion && currentAnswerParts.length > 0) {
    faqItems.push({
      question: currentQuestion,
      answer: currentAnswerParts.join(' '),
    });
  }

  if (faqItems.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Gera Schema.org/JobPosting para inclusão automática e destaque no Google Jobs (Vagas).
 */
function generateJobPostingJsonLd(post: Post, postUrl: string): any | null {
  const validThrough =
    post.enrollmentEndDate ||
    new Date(new Date(post.publishedAt || Date.now()).getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();

  const hiringName = post.cityName
    ? `Prefeitura Municipal de ${post.cityName}`
    : post.stateUf && post.stateUf !== 'Nacional'
    ? `Órgão Público Estadual (${post.stateUf})`
    : 'Serviço Público Federal / Concurso Nacional';

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: post.title,
    description: post.excerpt || `Oportunidade no concurso público ${post.title}. Veja requisitos, cargos e edital completo.`,
    identifier: {
      '@type': 'PropertyValue',
      name: 'Concursos Agora',
      value: post._id,
    },
    datePosted: post.publishedAt,
    validThrough: validThrough,
    employmentType: 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: hiringName,
      sameAs: 'https://concursosagora.com.br',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressRegion: post.stateUf || 'BR',
        addressCountry: 'BR',
        ...(post.cityName ? { addressLocality: post.cityName } : {}),
      },
    },
    ...(post.salaryMax
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: 'BRL',
            value: {
              '@type': 'QuantitativeValue',
              value: post.salaryMax,
              minValue: post.salaryMin || post.salaryMax,
              maxValue: post.salaryMax,
              unitText: 'MONTH',
            },
          },
        }
      : {}),
    ...(post.educationLevel && post.educationLevel.length > 0
      ? {
          educationRequirements: post.educationLevel.join(', '),
        }
      : {}),
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  const post: Post | null = await getCachedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // IDs das categorias do post atual para filtrar posts relacionados
  const categoryIds = (post.categories || []).map((c: { _id: string }) => c._id).filter(Boolean);

  const [relatedByCategory, recentPosts, topPosts, categories] = await Promise.all([
    // Busca relacionados da mesma categoria (cacheado)
    categoryIds.length > 0 ? getCachedRelatedPosts(post._id, categoryIds) : Promise.resolve([]),
    getCachedRecentPosts(),
    getCachedTopPosts(5),
    getCachedCategories(),
  ]);

  // Fallback: se não há relacionados por categoria, busca os mais recentes
  let relatedPosts: Post[] = relatedByCategory || [];
  if (relatedPosts.length < 3) {
    const existingIds = [post._id, ...relatedPosts.map((p: Post) => p._id)];
    const fallbackPosts: Post[] = await getCachedRelatedPostsFallback(post._id, existingIds);
    // Mescla relacionados por categoria com fallback até completar 3
    relatedPosts = [...relatedPosts, ...(fallbackPosts || [])].slice(0, 3);
  }

  const uniqueCategories = deduplicateCategories(categories);
  const uniquePostCategories = deduplicateCategories(post.categories || []);
  const statusInfo = getContestStatusInfo(post);

  const slugStr = typeof post.slug === 'string' ? post.slug : (post.slug as any)?.current || post._id;
  const mainImageUrl = getImageUrl(post.mainImage, 1200, 675);
  const postUrl = `https://concursosagora.com.br/post/${slugStr}`;
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  // Tempo estimado de leitura (aprox. 200 palavras/min)
  const wordCount = post.body
    ? JSON.stringify(post.body).split(/\s+/).length
    : 0;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Schema.org JSON-LD para Artigo de Notícia
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    headline: post.title,
    image: [mainImageUrl],
    datePublished: post.publishedAt,
    dateModified: post._updatedAt || post.publishedAt,
    author: [
      {
        '@type': 'Person',
        name: post.author?.name || 'Marco Antonio',
      },
    ],
    publisher: {
      '@type': 'Organization',
      name: 'Concursos Agora',
      logo: {
        '@type': 'ImageObject',
        url: 'https://concursosagora.com.br/logo.png',
      },
    },
    description: post.excerpt || `Confira a matéria completa sobre ${post.title}`,
  };

  // Seleção Inteligente de Categoria Primária para Breadcrumb e Rich Results (Google Schema):
  const BRAZILIAN_UFS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
  ];

  // 1. Se o post tem stateUf definido (ex: "SC"), busca categoria com este estado
  const stateCategory = post.stateUf && post.stateUf !== 'Nacional'
    ? uniquePostCategories.find(
        (c) =>
          c.title?.toUpperCase() === post.stateUf?.toUpperCase() ||
          c.slug?.toLowerCase() === post.stateUf?.toLowerCase()
      )
    : null;

  // 2. Filtra categorias válidas (remove UFs conflitantes que não pertençam ao post)
  const validThematicCategories = uniquePostCategories.filter((c) => {
    const titleUpper = c.title?.toUpperCase();
    if (!titleUpper) return false;
    if (post.stateUf && post.stateUf !== 'Nacional' && BRAZILIAN_UFS.includes(titleUpper)) {
      return titleUpper === post.stateUf.toUpperCase();
    }
    return !['SUDESTE', 'SUL', 'NORDESTE', 'NORTE', 'CENTRO-OESTE', 'NACIONAL'].includes(titleUpper);
  });

  // 3. A categoria primária prioriza a UF legítima do post, ou a área temática de maior relevância
  const primaryCategory =
    stateCategory ||
    validThematicCategories[0] ||
    (post.stateUf && post.stateUf !== 'Nacional'
      ? { title: post.stateUf.toUpperCase(), slug: post.stateUf.toLowerCase(), _id: `cat-${post.stateUf.toLowerCase()}` }
      : uniquePostCategories[0]);

  // Schema.org JSON-LD para Breadcrumbs
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: 'https://concursosagora.com.br',
      },
      ...(primaryCategory
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: primaryCategory.title,
              item: `https://concursosagora.com.br/categoria/${primaryCategory.slug || primaryCategory._id}`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: post.title,
              item: postUrl,
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 2,
              name: post.title,
              item: postUrl,
            },
          ]),
    ],
  };

  // Extração automática de FAQ para Google Rich Snippets (Schema.org/FAQPage)
  const faqJsonLd = extractFaqJsonLd(post.body);

  // Schema.org/JobPosting para o Google Jobs
  const jobPostingJsonLd = generateJobPostingJsonLd(post, postUrl);

  // Injeta dinamicamente o card de "Leia Também" após o 2º parágrafo no Portable Text
  const bodyWithRelated = post.body
    ? injectRelatedArticle(post.body, relatedPosts[0], 2)
    : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {jobPostingJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }}
        />
      )}

      <article className="max-w-7xl mx-auto px-0 py-2 sm:py-6">
        <ViewTracker slug={slugStr} />
        {/* Trilha de Navegação (Breadcrumb) */}
        <Breadcrumb
          items={[
            ...(primaryCategory
              ? [{ label: primaryCategory.title, href: `/categoria/${primaryCategory.slug || primaryCategory._id}` }]
              : []),
            { label: post.title },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Conteúdo Principal da Notícia */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cabeçalho do Post */}
            <header className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-sm ${statusInfo.badgeBg}`}>
                  <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
                  {statusInfo.label}
                </span>
                {uniquePostCategories.length > 0 &&
                  uniquePostCategories.map((cat) => (
                    <Link
                      key={cat._id}
                      href={`/categoria/${cat.slug || cat._id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-xs transition-colors"
                    >
                      {cat.title}
                    </Link>
                  ))}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-normal border-l-2 border-blue-500 pl-4">
                  {post.excerpt}
                </p>
              )}

              {/* Banner Informativo de Validade do Concurso */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs sm:text-sm font-semibold ${
                statusInfo.isExpired
                  ? 'bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{statusInfo.isExpired ? '📌' : '🗓️'}</span>
                  <div>
                    <span className="font-bold block">{statusInfo.label}</span>
                    <span className="font-normal text-xs opacity-90">{statusInfo.expirationNote}</span>
                  </div>
                </div>
              </div>

              {/* Contador Regressivo Interativo de Inscrições */}
              <ContestCountdown
                enrollmentEndDate={post.enrollmentEndDate}
                examDate={post.examDate}
              />

              {/* Ficha Técnica Estruturada */}
              <ContestQuickFacts post={post} />

              {/* Metadados do Autor, Data e Leitura */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-y border-slate-200 py-4 gap-4 text-xs md:text-sm text-slate-500">
                <div className="flex items-center gap-3">
                  {post.author?.image && (
                    <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-blue-500 shadow-xs">
                      <Image
                        src={getImageUrl(post.author.image, 88, 88)}
                        alt={post.author.name ? `Foto de perfil de ${post.author.name}` : 'Foto do autor'}
                        width={44}
                        height={44}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 block text-sm">
                        {post.author?.name || 'Redação Concursos Agora'}
                      </span>
                      {post.author?.role && (
                        <span className="hidden sm:inline-block text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                          {post.author.role}
                        </span>
                      )}
                    </div>
                    <span>Publicado em {formattedDate}</span>
                    {/* Tempo estimado de leitura */}
                    <span className="flex items-center gap-1 text-xs text-slate-600 mt-0.5">
                      <span>⏱️</span>
                      <span>Leitura: ~{readingMinutes} min</span>
                    </span>
                  </div>
                </div>

                {/* Compartilhamento Social Superior */}
                <ShareButtons
                  title={post.title}
                  url={postUrl}
                  excerpt={post.excerpt}
                  compact
                />
              </div>
            </header>

            {/* Imagem de Capa do Artigo com Legenda e Créditos Editoriais */}
            <figure className="relative w-full rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-slate-100 mb-6">
              <div className="relative w-full h-[320px] sm:h-[420px] md:h-[500px]">
                <Image
                  src={mainImageUrl}
                  alt={getDescriptiveImageAlt(post)}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 850px"
                />
              </div>
              {(post.mainImage?.caption || post.mainImage?.credit) && (
                <figcaption className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 leading-relaxed">
                  {post.mainImage?.caption && (
                    <span className="font-normal text-slate-600">{post.mainImage.caption}</span>
                  )}
                  {post.mainImage?.credit && (
                    <span className="text-xs text-slate-600 font-medium shrink-0 italic">
                      {post.mainImage.credit.toLowerCase().startsWith('foto') ? post.mainImage.credit : `Foto: ${post.mainImage.credit}`}
                    </span>
                  )}
                </figcaption>
              )}
            </figure>

            {/* Conteúdo Rico (Portable Text com injeção dinâmica de Leia Também) */}
            <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-6">
              {bodyWithRelated.length > 0 && <PortableText value={bodyWithRelated} />}
            </div>

            {/* Compartilhamento no final do conteúdo */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
              <p className="text-sm font-bold text-slate-900 mb-2">
                📢 Gostou desta notícia sobre o {post.title}?
              </p>
              <p className="text-xs text-slate-600 mb-3">
                Ajude outros concurseiros e compartilhe com seus amigos e grupos de estudo:
              </p>
              <ShareButtons
                title={post.title}
                url={postUrl}
                excerpt={post.excerpt}
              />
            </div>

            {/* "Leia Também" Contextual — exibido logo após o conteúdo para reter o leitor */}
            <InArticleCTA
              posts={relatedPosts.slice(0, 2)}
              categoryName={primaryCategory?.title}
            />

            {/* Banner do Canal VIP do Telegram */}
            <CommunityBanner
              categoryName={primaryCategory?.title}
            />

            {/* Banner de Tráfego Cruzado para o Instagram */}
            <InstagramFollowBox />

            {/* Widget de Linkagem Interna Bidirecional (Hub de Conteúdo SEO) */}
            <PostHubWidget
              postTitle={post.title}
              categoryTitles={uniquePostCategories.map((c) => c.title)}
            />

            {/* Card do Autor */}
            <AuthorCard author={post.author} />

            {/* Matérias Relacionadas (grid de 3 no rodapé) */}
            <RelatedPosts posts={relatedPosts} />
          </div>

          {/* Barra Lateral — passa posts relacionados por categoria quando disponíveis */}
          <Sidebar
            recentPosts={recentPosts}
            topPosts={topPosts}
            categories={uniqueCategories}
            categoryPosts={relatedPosts.length > 0 ? relatedPosts : undefined}
            categoryName={primaryCategory?.title}
          />
        </div>
      </article>
    </>
  );
}
