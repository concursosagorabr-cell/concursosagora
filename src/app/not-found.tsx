import Link from 'next/link';
import Image from 'next/image';
import { getCachedRecentPosts, getCachedTopPosts } from '@/lib/sanity';
import { Post } from '@/types';
import { getImageUrl } from '@/lib/image';
import SearchBar from '@/components/SearchBar';

/**
 * Página 404 otimizada para retenção.
 *
 * Problemas anteriores:
 * - A 404 estava no Top 6 de páginas mais acessadas (45 views, 44,1% bounce).
 * - Oferecia apenas um botão "Voltar ao Início" — sem opções para o usuário continuar navegando.
 *
 * Melhorias:
 * 1. Barra de busca proeminente para redirecionar a intenção do usuário.
 * 2. Grid de posts recentes e populares para manter o engajamento.
 * 3. Links rápidos para seções principais do site.
 * 4. Design editorial coerente com o resto do portal.
 */
export default async function NotFound() {
  let recentPosts: Post[] = [];
  let topPosts: Post[] = [];

  try {
    [recentPosts, topPosts] = await Promise.all([
      getCachedRecentPosts(),
      getCachedTopPosts(5),
    ]);
  } catch (error) {
    console.error('[NotFound] Erro ao buscar posts para 404:', error);
  }

  // Combina posts recentes e populares, removendo duplicatas
  const seenIds = new Set<string>();
  const suggestedPosts: Post[] = [];
  for (const post of [...topPosts, ...recentPosts]) {
    if (!seenIds.has(post._id) && suggestedPosts.length < 6) {
      seenIds.add(post._id);
      suggestedPosts.push(post);
    }
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center px-4 py-10 sm:py-16">
      {/* Cabeçalho da 404 */}
      <div className="max-w-2xl text-center space-y-4 mb-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-5xl sm:text-6xl" aria-hidden="true">🔍</span>
          <span className="text-5xl sm:text-6xl font-black text-slate-300" aria-hidden="true">404</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
          Página não encontrada
        </h1>

        <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
          A página ou notícia que você procurava não existe, foi removida ou teve seu endereço alterado.
          Use a busca abaixo para encontrar o que precisa:
        </p>

        {/* Barra de Busca */}
        <div className="pt-2 max-w-lg mx-auto">
          <SearchBar placeholder="Buscar concursos, editais, provas..." />
        </div>
      </div>

      {/* Links Rápidos */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-full transition-colors shadow-sm"
        >
          🏠 Início
        </Link>
        <Link
          href="/concursos"
          className="inline-flex items-center gap-1.5 bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs sm:text-sm px-4 py-2 rounded-full transition-colors shadow-sm border border-blue-200"
        >
          📋 Concursos Abertos
        </Link>
        <Link
          href="/noticias"
          className="inline-flex items-center gap-1.5 bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs sm:text-sm px-4 py-2 rounded-full transition-colors shadow-sm border border-blue-200"
        >
          📰 Notícias
        </Link>
        <Link
          href="/hub"
          className="inline-flex items-center gap-1.5 bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs sm:text-sm px-4 py-2 rounded-full transition-colors shadow-sm border border-blue-200"
        >
          🎯 Guias de Carreiras
        </Link>
      </div>

      {/* Grid de Posts Sugeridos */}
      {suggestedPosts.length > 0 && (
        <section className="w-full max-w-5xl">
          <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span>🔥</span> Talvez você estivesse procurando
            </h2>
            <Link
              href="/"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Ver Todos →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {suggestedPosts.map((post) => {
              const imgUrl = getImageUrl(post.mainImage, 600, 340);
              const postSlug = typeof post.slug === 'string'
                ? post.slug
                : (post.slug as any)?.current || post._id;
              const postLink = `/post/${postSlug}`;
              const formattedDate = post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                  })
                : '';

              return (
                <article
                  key={post._id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden hover:shadow-md transition-shadow group"
                >
                  <Link href={postLink} className="block">
                    <div className="relative w-full h-40 bg-slate-100">
                      <Image
                        src={imgUrl}
                        alt={post.mainImage?.alt || post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  </Link>

                  <div className="p-4 space-y-2">
                    {post.categories && post.categories.length > 0 && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                        {post.categories[0].title}
                      </span>
                    )}

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                      <Link href={postLink}>
                        {post.title}
                      </Link>
                    </h3>

                    {formattedDate && (
                      <span className="text-[11px] text-slate-400 font-medium block">
                        {formattedDate}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
