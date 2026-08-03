import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { client } from '@/lib/sanity';
import {
  postBySlugQuery,
  relatedPostsQuery,
  allPostSlugsQuery,
  recentPostsQuery,
  allCategoriesQuery,
} from '@/lib/queries';
import { Post } from '@/types';
import { getImageUrl } from '@/lib/image';
import { deduplicateCategories } from '@/utils/categories';
import { getContestStatusInfo } from '@/utils/status';
import PortableText from '@/components/PortableText';
import Breadcrumb from '@/components/Breadcrumb';
import AuthorCard from '@/components/AuthorCard';
import RelatedPosts from '@/components/RelatedPosts';
import PostHubWidget from '@/components/PostHubWidget';
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
  const url = `https://concursosagora.com.br/post/${post.slug || post._id}`;

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

  const [relatedPosts, recentPosts, categories] = await Promise.all([
    client.fetch(relatedPostsQuery, { currentId: post._id }),
    client.fetch(recentPostsQuery),
    client.fetch(allCategoriesQuery),
  ]);

  const uniqueCategories = deduplicateCategories(categories);
  const uniquePostCategories = deduplicateCategories(post.categories || []);
  const statusInfo = getContestStatusInfo(post);

  const mainImageUrl = getImageUrl(post.mainImage, 1200, 675);
  const postUrl = `https://concursosagora.com.br/post/${post.slug || post._id}`;
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

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

      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal border-l-2 border-blue-500 pl-4">
                  {post.excerpt}
                </p>
              )}

              {/* Banner Informativo de Validade do Concurso */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs sm:text-sm font-semibold ${
                statusInfo.isExpired
                  ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
              }`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{statusInfo.isExpired ? '📌' : '🗓️'}</span>
                  <div>
                    <span className="font-bold block">{statusInfo.label}</span>
                    <span className="font-normal text-xs opacity-90">{statusInfo.expirationNote}</span>
                  </div>
                </div>
              </div>

              {/* Metadados do Autor, Data e Compartilhamento */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-y border-slate-200 dark:border-slate-800 py-4 gap-4 text-xs md:text-sm text-slate-500 dark:text-slate-400">
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
                    <span className="font-bold text-slate-900 dark:text-white block text-sm">
                      {post.author?.name || 'Redação Concursos Agora'}
                    </span>
                    <span>Publicado em {formattedDate}</span>
                  </div>
                </div>

                {/* Compartilhamento Social */}
                <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1">Compartilhar:</span>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title)}%20https://concursosagora.com.br/post/${post.slug || post._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-emerald-500 text-white hover:scale-110 transition-transform"
                    title="Compartilhar no WhatsApp"
                  >
                    💬
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=https://concursosagora.com.br/post/${post.slug || post._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-sky-500 text-white hover:scale-110 transition-transform"
                    title="Compartilhar no X/Twitter"
                  >
                    🐦
                  </a>
                </div>
              </div>
            </header>

            {/* Imagem de Capa do Artigo */}
            {post.mainImage && (
              <figure className="relative w-full h-[320px] sm:h-[420px] md:h-[500px] rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
                <Image
                  src={mainImageUrl}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 850px"
                />
              </figure>
            )}

            {/* Conteúdo Rico (Portable Text) */}
            <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              {post.body && <PortableText value={post.body} />}
            </div>

            {/* Widget de Linkagem Interna Bidirecional (Hub de Conteúdo SEO) */}
            <PostHubWidget
              postTitle={post.title}
              categoryTitles={uniquePostCategories.map((c) => c.title)}
            />

            {/* Card do Autor */}
            <AuthorCard author={post.author} />

            {/* Matérias Relacionadas */}
            <RelatedPosts posts={relatedPosts} />
          </div>

          {/* Barra Lateral */}
          <Sidebar recentPosts={recentPosts} categories={uniqueCategories} />
        </div>
      </article>
    </>
  );
}
