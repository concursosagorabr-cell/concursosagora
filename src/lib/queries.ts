// Projeção compacta otimizada para listagens, cards, carrossel e sidebars
export const compactPostFields = `
  _id,
  _createdAt,
  _updatedAt,
  _type,
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
  "excerpt": coalesce(excerpt, ""),
  "author": author->{
    _id,
    name,
    "slug": coalesce(slug.current, _id),
    image
  },
  "categories": coalesce(categories[]->{
    _id,
    title,
    "slug": coalesce(slug.current, _id)
  }, [])
`;

// Projeção completa para a página do post individual
export const fullPostFields = `
  _id,
  _createdAt,
  _updatedAt,
  _type,
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
  "excerpt": coalesce(excerpt, ""),
  "author": author->{
    _id,
    name,
    "slug": coalesce(slug.current, _id),
    image,
    bio
  },
  "categories": coalesce(categories[]->{
    _id,
    title,
    "slug": coalesce(slug.current, _id),
    description
  }, []),
  body
`;

// 1. Consulta para todos os posts
export const allPostsQuery = `
  *[_type == "post"] | order(publishedAt desc) {
    ${compactPostFields}
  }
`;

// 2. Consulta para posts paginados (10 em 10)
export const postsPaginatedQuery = `
  *[_type == "post"] | order(publishedAt desc) [$start..$end] {
    ${compactPostFields}
  }
`;

// 3. Contagem total de posts
export const postsCountQuery = `
  count(*[_type == "post"])
`;

// 4. Consulta de um post único por Slug ou ID (com corpo completo)
export const postBySlugQuery = `
  *[_type == "post" && (slug.current == $slug || _id == $slug)][0] {
    ${fullPostFields}
  }
`;

// 5. Consulta de posts relacionados — filtra por categoria primeiro
export const relatedPostsQuery = `
  *[_type == "post" && _id != $currentId && count((categories[]->_id)[@ in $categoryIds]) > 0]
  | order(publishedAt desc)[0..2] {
    ${compactPostFields}
  }
`;

// 5b. Fallback — posts recentes quando não há relacionados pela categoria
export const relatedPostsFallbackQuery = `
  *[_type == "post" && _id != $currentId && !(_id in $excludeIds)]
  | order(publishedAt desc)[0..2] {
    ${compactPostFields}
  }
`;

// 6. Consulta de posts recentes para Sidebar, Home e Carrossel
export const recentPostsQuery = `
  *[_type == "post"] | order(publishedAt desc)[0..4] {
    ${compactPostFields}
  }
`;

// 7. Consulta de todas as categorias do Sanity
export const allCategoriesQuery = `
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    "slug": coalesce(slug.current, _id),
    description
  }
`;

// 8. Consulta de uma categoria por Slug ou por ID
export const categoryBySlugQuery = `
  *[_type == "category" && (slug.current == $slug || _id == $slug)][0] {
    _id,
    title,
    "slug": coalesce(slug.current, _id),
    description
  }
`;

// 9. Consulta de posts por categoria
export const postsByCategoryQuery = `
  *[_type == "post" && (
    $categorySlug in categories[]->slug.current ||
    $categorySlug in categories[]->_id ||
    $categorySlug in categories[]->title
  )] | order(publishedAt desc) {
    ${compactPostFields}
  }
`;

// Filtro reutilizável para busca flexível de posts por categoria com sinônimos
const categoryFilter = `
  $categorySlug in categories[]->slug.current ||
  lower($categorySlug) in categories[]->slug.current ||
  $categorySlug in categories[]->_id ||
  lower($categorySlug) in categories[]->title ||
  $categorySlug in categories[]->title ||
  count((categories[]->slug.current)[@ in $categorySlugs]) > 0 ||
  count((categories[]->title)[lower(@) in $categorySlugs]) > 0
`;

// 9b. Consulta de posts por categoria paginados (10 por 10)
export const postsByCategoryPaginatedQuery = `
  *[_type == "post" && (${categoryFilter})] | order(publishedAt desc) [$start..$end] {
    ${compactPostFields}
  }
`;

// 9c. Contagem total de posts por categoria
export const postsByCategoryCountQuery = `
  count(*[_type == "post" && (${categoryFilter})])
`;

// 10. Consulta de posts por estado (UF)
export const statePostsQuery = `
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
    ${compactPostFields}
  }
`;

// 11. Consulta de pesquisa global flexível
export const searchPostsQuery = `
  *[_type == "post" && (
    title match "*" + $searchTerm + "*" ||
    excerpt match "*" + $searchTerm + "*" ||
    $searchTerm in categories[]->title ||
    $searchTerm in categories[]->slug.current ||
    categories[]->title match "*" + $searchTerm + "*"
  )] | order(publishedAt desc) {
    ${compactPostFields}
  }
`;

// Filtro reutilizável para busca por keywords de Hubs de Conteúdo
const keywordsFilter = `
  count((categories[]->slug.current)[@ in $keywords]) > 0 ||
  count((categories[]->title)[lower(@) in $keywords]) > 0 ||
  $mainKeyword in categories[]->slug.current ||
  $mainKeyword in categories[]->title ||
  title match "*" + $mainKeyword + "*" ||
  excerpt match "*" + $mainKeyword + "*"
`;

// 12. Consulta de posts por conjunto de palavras-chave para Hubs de Conteúdo (Silos)
export const postsByKeywordsPaginatedQuery = `
  *[_type == "post" && (${keywordsFilter})] | order(publishedAt desc) [$start..$end] {
    ${compactPostFields}
  }
`;

export const postsByKeywordsCountQuery = `
  count(*[_type == "post" && (${keywordsFilter})])
`;

// 13. Consulta de todos os Slugs como strings planas (para generateStaticParams e Sitemap)
export const allPostSlugsQuery = `
  *[_type == "post" && defined(title)] {
    "slug": coalesce(slug.current, _id)
  }[].slug
`;

export const allCategorySlugsQuery = `
  *[_type == "category" && defined(title)] {
    "slug": coalesce(slug.current, _id)
  }[].slug
`;
