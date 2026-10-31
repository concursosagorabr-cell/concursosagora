import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getCachedAllAuthorSlugs,
  getCachedAuthorBySlug,
  getCachedCategories,
  getCachedPostsByAuthor,
  getCachedPostsByAuthorCount,
  getCachedRecentPosts,
  getCachedTopPosts,
} from '@/lib/sanity';
import { Author, Post } from '@/types';
import { getImageUrl } from '@/lib/image';
import { SITE_URL } from '@/lib/constants';
import { deduplicateCategories } from '@/utils/categories';
import PostCard from '@/components/PostCard';
import Breadcrumb from '@/components/Breadcrumb';
import Sidebar from '@/components/Sidebar';
import Pagination from '@/components/Pagination';
import PortableText from '@/components/PortableText';

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const slugs = await getCachedAllAuthorSlugs();
    return (slugs || []).filter(Boolean).map((slug) => ({ slug }));
  } catch (error) {
    console.error('Erro ao gerar parâmetros de autor:', error);
    return [];
  }
}

function authorDescription(author: Author): string {
  if (typeof author.bio === 'string' && author.bio.trim()) {
    return author.bio.trim().slice(0, 155);
  }
  return `Notícias, editais e análises sobre concursos públicos por ${author.name}.`;
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getCachedAuthorBySlug(slug);

  if (!author) {
    return { title: 'Autor não encontrado', robots: { index: false, follow: false } };
  }

  const url = `${SITE_URL}/autor/${author.slug || author._id}`;
  const description = authorDescription(author);
  const image = getImageUrl(author.image, 400, 400);

  return {
    title: `${author.name} — Autor`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'profile',
      locale: 'pt_BR',
      url,
      siteName: 'Concursos Agora',
      title: `${author.name} — Autor`,
      description,
      images: [{ url: image, width: 400, height: 400, alt: `Foto de ${author.name}` }],
    },
  };
}

export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
  const { slug } = await params;
  const { page } = await searchParams;

  const author = await getCachedAuthorBySlug(slug);
  if (!author) notFound();

  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const itemsPerPage = 10;
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage - 1;

  const [posts, totalPosts, recentPosts, topPosts, categories] = await Promise.all([
    getCachedPostsByAuthor(author._id, start, end),
    getCachedPostsByAuthorCount(author._id),
    getCachedRecentPosts(),
    getCachedTopPosts(5),
    getCachedCategories(),
  ]);

  const uniqueCategories = deduplicateCategories(categories);
  const totalPages = Math.ceil((totalPosts || 0) / itemsPerPage);
  const baseUrl = `/autor/${author.slug || author._id}`;
  const avatarUrl = getImageUrl(author.image, 200, 200);
  const socials = [
    { label: 'LinkedIn', href: author.linkedinUrl },
    { label: 'X (Twitter)', href: author.twitterUrl },
    { label: 'Instagram', href: author.instagramUrl },
    { label: 'Facebook', href: author.facebookUrl },
  ].filter((item): item is { label: string; href: string } => Boolean(item.href));

  const profileJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: author.name,
      ...(author.role ? { jobTitle: author.role } : {}),
      ...(typeof author.bio === 'string' ? { description: author.bio } : {}),
      image: avatarUrl,
      url: `${SITE_URL}${baseUrl}`,
      ...(socials.length > 0 ? { sameAs: socials.map((s) => s.href) } : {}),
    },
  };

  const renderBio = () => {
    if (!author.bio) return null;
    if (typeof author.bio === 'string') {
      return <p className="text-sm md:text-base text-blue-100 leading-relaxed max-w-3xl">{author.bio}</p>;
    }
    return (
      <div className="text-sm md:text-base text-blue-100 leading-relaxed max-w-3xl">
        <PortableText value={Array.isArray(author.bio) ? author.bio : [author.bio as any]} />
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-0 py-2 sm:py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />
      <Breadcrumb items={[{ label: 'Autor' }, { label: author.name }]} />

      <header className="mb-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shrink-0 border-4 border-blue-400/70 shadow-lg bg-blue-800">
            <Image
              src={avatarUrl}
              alt={`Foto de perfil de ${author.name}`}
              width={112}
              height={112}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center sm:text-left space-y-2 flex-1">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-300">Autor</span>
            <h1 className="text-3xl md:text-4xl font-black">{author.name}</h1>
            {author.role && (
              <span className="inline-block text-xs font-semibold text-blue-900 bg-blue-100 px-3 py-1 rounded-full">
                {author.role}
              </span>
            )}
            <div className="pt-1">{renderBio()}</div>
            {socials.length > 0 && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                {socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-blue-100 hover:text-white underline underline-offset-4"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-xl font-extrabold text-slate-900">
              Artigos de {author.name}
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {totalPosts} {totalPosts === 1 ? 'matéria' : 'matérias'}
            </span>
          </div>

          {posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post: Post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl={baseUrl}
                totalItems={totalPosts}
                itemsPerPage={itemsPerPage}
              />
            </>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
              <p className="text-slate-600">Nenhuma matéria publicada por este autor ainda.</p>
            </div>
          )}
        </div>

        <Sidebar recentPosts={recentPosts} topPosts={topPosts} categories={uniqueCategories} />
      </div>
    </div>
  );
}
