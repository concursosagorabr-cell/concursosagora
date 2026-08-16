import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { client } from '@/lib/sanity';
import {
  postBySlugQuery,
  relatedPostsQuery,
  relatedPostsFallbackQuery,
  allPostSlugsQuery,
  recentPostsQuery,
  allCategoriesQuery,
} from '@/lib/queries';
import { Post } from '@/types';
import { getImageUrl } from '@/lib/image';
import { deduplicateCategories } from '@/utils/categories';
import { getContestStatusInfo } from '@/utils/status';
import { injectRelatedArticle } from '@/utils/injectRelatedArticle';
import PortableText from '@/components/PortableText';
import Breadcrumb from '@/components/Breadcrumb';
import AuthorCard from '@/components/AuthorCard';
import RelatedPosts from '@/components/RelatedPosts';
import PostHubWidget from '@/components/PostHubWidget';
import InArticleCTA from '@/components/InArticleCTA';
import InstagramFollowBox from '@/components/InstagramFollowBox';
import Sidebar from '@/components/Sidebar';

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 60; // ISR

export async function generateStaticParams() {
  try {
    const rawSlugs: any[] = await client.fetch(allPostSlugsQuery);
    const slugs = (rawSlugs || [])
      .map((item) => {
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
  const post: Post | null = await client.fetch(postBySlugQuery, { slug });

  if (!post) {
    return { title: 'Post não encontrado' };
  }

  const imageUrl = getImageUrl(post.mainImage, 1200, 630);
  const slugStr = typeof post.slug === 'string' ? post.slug : (post.slug as any)?.current || post._id;
  const url = `https://concursosagora.com.br/post/${slugStr}`;

  // Palavras-chave para Google Discover (news_keywords)
  const categoryKeywords = (post.categories || [])
    .map((c: { title: string }) => c.title)
    .filter(Boolean)
    .join(', ');

  return {
    title: post.title,
    description: post.excerpt || `Confira a matéria completa sobre ${post.title}`,
    alternates: { canonical: url },
    // news_keywords melhora as chances de aparecer no Google Discover
    keywords: categoryKeywords || 'concursos públicos, editais, concursos 2026',
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

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  const post: Post | null = await client.fetch(postBySlugQuery, { slug });

  if (!post) {
    notFound();
  }

  // IDs das categorias do post atual para filtrar posts relacionados
  const categoryIds = (post.categories || []).map((c: { _id: string }) => c._id).filter(Boolean);

  const [relatedByCategory, recentPosts, categories] = await Promise.all([
    // Busca relacionados da mesma categoria
    client.fetch(relatedPostsQuery, { currentId: post._id, categoryIds }),
    client.fetch(recentPostsQuery),
    client.fetch(allCategoriesQuery),
  ]);

  // Fallback: se não há relacionados por categoria, busca os mais recentes
  let relatedPosts: Post[] = relatedByCategory || [];
  if (relatedPosts.length < 3) {
    const existingIds = [post._id, ...relatedPosts.map((p: Post) => p._id)];
    const fallbackPosts: Post[] = await client.fetch(relatedPostsFallbackQuery, {
      currentId: post._id,
      excludeIds: existingIds,
    });
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

  const primaryCategory = uniquePostCategories[0];

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

      <article className="max-w-7xl mx-auto px-0 py-2 sm:py-6">
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

              {/* Metadados do Autor, Data, Leitura e Compartilhamento */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-y border-slate-200 py-4 gap-4 text-xs md:text-sm text-slate-500">
                <div className="flex items-center gap-3">
                  {post.author?.image && (
                    <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-blue-500 shadow-xs">
                      <Image
                        src={getImageUrl(post.author.image, 88, 88)}
                        alt={post.author.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">
                      {post.author?.name || 'Redação Concursos Agora'}
                    </span>
                    <span>Publicado em {formattedDate}</span>
                    {/* Tempo estimado de leitura */}
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <span>⏱️</span>
                      <span>Leitura: ~{readingMinutes} min</span>
                    </span>
                  </div>
                </div>

                {/* Compartilhamento Social */}
                <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 mr-1">Compartilhar:</span>
                  {/* WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${post.title} — Concursos Agora ${postUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-emerald-500 text-white hover:scale-110 transition-transform"
                    title="Compartilhar no WhatsApp"
                    aria-label="Compartilhar no WhatsApp"
                  >
                    💬
                  </a>
                  {/* Facebook */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-blue-600 text-white hover:scale-110 transition-transform"
                    title="Compartilhar no Facebook"
                    aria-label="Compartilhar no Facebook"
                  >
                    📘
                  </a>
                  {/* X/Twitter */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(postUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-sky-500 text-white hover:scale-110 transition-transform"
                    title="Compartilhar no X/Twitter"
                    aria-label="Compartilhar no X (Twitter)"
                  >
                    🐦
                  </a>
                </div>
              </div>
            </header>

            {/* Imagem de Capa do Artigo */}
            <figure className="relative w-full h-[320px] sm:h-[420px] md:h-[500px] rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-slate-100">
              <Image
                src={mainImageUrl}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 850px"
              />
            </figure>

            {/* Conteúdo Rico (Portable Text com injeção dinâmica de Leia Também) */}
            <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-6">
              {bodyWithRelated.length > 0 && <PortableText value={bodyWithRelated} />}
            </div>

            {/* "Leia Também" Contextual — exibido logo após o conteúdo para reter o leitor */}
            <InArticleCTA
              posts={relatedPosts.slice(0, 2)}
              categoryName={primaryCategory?.title}
            />

            {/* Banner de Tráfego Cruzado para o Instagram */}
            <InstagramFollowBox />

            {/*
              === BANNER WHATSAPP/TELEGRAM ===
              Descomente quando criar seus grupos:

              <WhatsAppBanner
                whatsappUrl="https://chat.whatsapp.com/SEU_LINK_AQUI"
                telegramUrl="https://t.me/SEU_CANAL_AQUI"
              />
            */}

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
            categories={uniqueCategories}
            categoryPosts={relatedPosts.length > 0 ? relatedPosts : undefined}
            categoryName={primaryCategory?.title}
          />
        </div>
      </article>
    </>
  );
}
