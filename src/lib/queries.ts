// Projeção base reutilizável para listagens de posts no Sanity com tratamento de resiliência
const postFields = `
  _id,
  _createdAt,
  _updatedAt,
  _type,
  title,
  "slug": coalesce(slug.current, _id),
  publishedAt,
  enrollmentEndDate,
  examDate,
  "isExpired": select(
    defined(coalesce(enrollmentEndDate, examDate)) => dateTime(coalesce(enrollmentEndDate, examDate)) < dateTime(now()),
    (dateTime(coalesce(publishedAt, _createdAt)) + 31536000) < dateTime(now())
  ),
  "statusLabel": select(
    (defined(coalesce(enrollmentEndDate, examDate)) && dateTime(coalesce(enrollmentEndDate, examDate)) < dateTime(now())) || (!defined(coalesce(enrollmentEndDate, examDate)) && (dateTime(coalesce(publishedAt, _createdAt)) + 31536000) < dateTime(now())) => "Concurso Encerrado",
    "Concurso Aberto"
  ),
  mainImage,
  "excerpt": array::join(string::split(pt::text(body), " ")[0..35], " ") + "...",
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
  }, [])
`;

// 1. Consulta para todos os posts
export const allPostsQuery = `
  *[_type == "post"] | order(publishedAt desc) {
    ${postFields}
  }
`;

// 2. Consulta para posts paginados (10 em 10)
export const postsPaginatedQuery = `
  *[_type == "post"] | order(publishedAt desc) [$start..$end] {
    ${postFields}
  }
`;

// 3. Contagem total de posts
export const postsCountQuery = `
  count(*[_type == "post"])
`;

// 4. Consulta de um post único por Slug ou ID
export const postBySlugQuery = `
  *[_type == "post" && (slug.current == $slug || _id == $slug)][0] {
    ${postFields},
    body
  }
`;

// 5. Consulta de posts relacionados
export const relatedPostsQuery = `
  *[_type == "post" && _id != $currentId] | order(publishedAt desc)[0..2] {
    ${postFields}
  }
`;

// 6. Consulta de posts recentes para Sidebar e Home
export const recentPostsQuery = `
  *[_type == "post"] | order(publishedAt desc)[0..4] {
    ${postFields}
  }
`;

// 7. Consulta de todas as categorias do Sanity (com fallback de slug e título)
export const allCategoriesQuery = `
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    "slug": coalesce(slug.current, _id),
    description
  }
`;

// 8. Consulta de uma categoria por Slug, ID ou Título (case-insensitive)
export const categoryBySlugQuery = `
  *[_type == "category" && (
    slug.current == $slug ||
    lower(slug.current) == lower($slug) ||
    _id == $slug ||
    lower(title) == lower($slug)
  )][0] {
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
    ${postFields}
  }
`;

// 9b. Consulta de posts por categoria paginados (10 por 10) com busca flexível
export const postsByCategoryPaginatedQuery = `
  *[_type == "post" && (
    $categorySlug in categories[]->slug.current ||
    lower($categorySlug) in categories[]->slug.current ||
    $categorySlug in categories[]->_id ||
    lower($categorySlug) in categories[]->title ||
    $categorySlug in categories[]->title
  )] | order(publishedAt desc) [$start..$end] {
    ${postFields}
  }
`;

// 9c. Contagem total de posts por categoria
export const postsByCategoryCountQuery = `
  count(*[_type == "post" && (
    $categorySlug in categories[]->slug.current ||
    lower($categorySlug) in categories[]->slug.current ||
    $categorySlug in categories[]->_id ||
    lower($categorySlug) in categories[]->title ||
    $categorySlug in categories[]->title
  )])
`;

// 10. Consulta de pesquisa global flexível e abrangente
export const searchPostsQuery = `
  *[_type == "post" && (
    title match "*" + $searchTerm + "*" ||
    pt::text(body) match "*" + $searchTerm + "*" ||
    $searchTerm in categories[]->title ||
    $searchTerm in categories[]->slug.current ||
    categories[]->title match "*" + $searchTerm + "*"
  )] | order(publishedAt desc) {
    ${postFields}
  }
`;

// 10b. Consulta de posts por conjunto de palavras-chave para Hubs de Conteúdo (Silos)
export const postsByKeywordsPaginatedQuery = `
  *[_type == "post" && (
    count((categories[]->slug.current)[@ in $keywords]) > 0 ||
    count((categories[]->title)[lower(@) in $keywords]) > 0 ||
    title match "*" + $mainKeyword + "*" ||
    pt::text(body) match "*" + $mainKeyword + "*"
  )] | order(publishedAt desc) [$start..$end] {
    ${postFields}
  }
`;

export const postsByKeywordsCountQuery = `
  count(*[_type == "post" && (
    count((categories[]->slug.current)[@ in $keywords]) > 0 ||
    count((categories[]->title)[lower(@) in $keywords]) > 0 ||
    title match "*" + $mainKeyword + "*" ||
    pt::text(body) match "*" + $mainKeyword + "*"
  )])
`;

// 11. Consulta de todos os Slugs como strings planas (para generateStaticParams e Sitemap)
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
