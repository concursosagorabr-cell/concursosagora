/**
 * Ordena os posts recuperados do Sanity na exata ordem dos slugs do ranking do Redis.
 */
export function orderPostsBySlugs(posts, slugs) {
  if (!Array.isArray(posts) || !Array.isArray(slugs)) return [];

  const postMap = new Map();
  for (const post of posts) {
    if (post && post.slug) {
      postMap.set(post.slug, post);
    }
  }

  const ordered = [];
  for (const slug of slugs) {
    const post = postMap.get(slug);
    if (post) {
      ordered.push(post);
    }
  }

  return ordered;
}

/**
 * Mescla os posts mais lidos com os posts recentes para garantir que
 * o ranking sempre atinja o limite solicitado (ex: 5 posts) sem duplicatas.
 */
export function mergeWithFallback(topPosts = [], recentPosts = [], limit = 5) {
  const result = [];
  const seenSlugs = new Set();

  for (const post of topPosts) {
    if (post && post.slug && !seenSlugs.has(post.slug)) {
      seenSlugs.add(post.slug);
      result.push(post);
      if (result.length >= limit) return result;
    }
  }

  for (const post of recentPosts) {
    if (post && post.slug && !seenSlugs.has(post.slug)) {
      seenSlugs.add(post.slug);
      result.push(post);
      if (result.length >= limit) return result;
    }
  }

  return result;
}
