// Projeção compacta otimizada para listagens, cards, carrossel e sidebars
export const compactPostFields = `
  _id,
  _createdAt,
  _updatedAt,
  _type,
  title,
  "slug": coalesce(slug.current, _id),
  publishedAt,
  enrollmentStartDate,
  enrollmentEndDate,
  examDate,
  salaryMax,
  salaryMin,
  vacanciesTotal,
  educationLevel,
  banca,
  stateUf,
  region,
  hubAreas,
  cityName,
  organ,
  sphere,
  registrationFee,
  hasExemption,
  studyMaterialUrl,
  status,
  vacanciesByRole,
  mainImage {
    ...,
    asset-> {
      _id,
      url,
      mimeType,
      metadata {
        dimensions
      }
    }
  },
  "excerpt": coalesce(excerpt, ""),
  "author": author->{
    _id,
    name,
    role,
    "slug": coalesce(slug.current, _id),
    image,
    facebookUrl,
    linkedinUrl,
    instagramUrl,
    twitterUrl
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
  enrollmentStartDate,
  enrollmentEndDate,
  examDate,
  salaryMax,
  salaryMin,
  vacanciesTotal,
  educationLevel,
  banca,
  stateUf,
  region,
  hubAreas,
  cityName,
  organ,
  sphere,
  registrationFee,
  hasExemption,
  studyMaterialUrl,
  status,
  vacanciesByRole,
  mainImage {
    ...,
    asset-> {
      _id,
      url,
      mimeType,
      metadata {
        dimensions
      }
    }
  },
  "excerpt": coalesce(excerpt, ""),
  "author": author->{
    _id,
    name,
    role,
    "slug": coalesce(slug.current, _id),
    image,
    bio,
    facebookUrl,
    linkedinUrl,
    instagramUrl,
    twitterUrl
  },
  "categories": coalesce(categories[]->{
    _id,
    title,
    "slug": coalesce(slug.current, _id),
    description
  }, []),
  body,
  slugHistory,
  seo {
    metaTitle,
    metaDescription,
    keywords,
    noIndex
  }
`;

// 1. Consulta para todos os posts
// Filtra apenas status "aberto", "previsto" e "em_andamento" — oculta "encerrado" e "cancelado"
export const allPostsQuery = `
  *[_type == "post" && status in ["aberto", "previsto", "em_andamento"]] | order(publishedAt desc) {
    ${compactPostFields}
  }
`;

// 2. Consulta para posts paginados (10 em 10)
// Filtra apenas status "aberto", "previsto" e "em_andamento" — oculta "encerrado" e "cancelado"
export const postsPaginatedQuery = `
  *[_type == "post" && status in ["aberto", "previsto", "em_andamento"]] | order(publishedAt desc) [$start..$end] {
    ${compactPostFields}
  }
`;

// 3. Contagem total de posts
export const postsCountQuery = `
  count(*[_type == "post" && status in ["aberto", "previsto", "em_andamento"]])
`;

// 4. Consulta de um post único por Slug ou ID (com corpo completo)
export const postBySlugQuery = `
  *[_type == "post" && (slug.current == $slug || _id == $slug)][0] {
    ${fullPostFields}
  }
`;

// 5. Consulta de posts relacionados — filtra por categoria primeiro
// Filtra apenas status "aberto", "previsto" e "em_andamento" — oculta "encerrado" e "cancelado"
export const relatedPostsQuery = `
  *[_type == "post" && _id != $currentId && status in ["aberto", "previsto", "em_andamento"] && count((categories[]->_id)[@ in $categoryIds]) > 0]
  | order(publishedAt desc)[0..2] {
    ${compactPostFields}
  }
`;

// 5b. Fallback — posts recentes quando não há relacionados pela categoria
// Filtra apenas status "aberto", "previsto" e "em_andamento" — oculta "encerrado" e "cancelado"
export const relatedPostsFallbackQuery = `
  *[_type == "post" && _id != $currentId && !(_id in $excludeIds) && status in ["aberto", "previsto", "em_andamento"]]
  | order(publishedAt desc)[0..2] {
    ${compactPostFields}
  }
`;

// 6. Consulta de posts recentes para Sidebar, Home e Carrossel
// Filtra apenas status "aberto", "previsto" e "em_andamento" — oculta "encerrado" e "cancelado"
export const recentPostsQuery = `
  *[_type == "post" && status in ["aberto", "previsto", "em_andamento"]] | order(publishedAt desc)[0..4] {
    ${compactPostFields}
  }
`;

// 6b. Consulta de posts por lista de slugs para o ranking de Mais Lidas
export const postsBySlugsQuery = `
  *[_type == "post" && (slug.current in $slugs || _id in $slugs)] {
    ${compactPostFields}
  }
`;

// 7. Consulta de todas as categorias do Sanity
export const allCategoriesQuery = `
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    "slug": coalesce(slug.current, _id),
    description,
    group
  }
`;

// 8. Consulta de uma categoria por Slug ou por ID
export const categoryBySlugQuery = `
  *[_type == "category" && (slug.current == $slug || _id == $slug)][0] {
    _id,
    title,
    "slug": coalesce(slug.current, _id),
    description,
    group
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

// Filtro de escopo geográfico: usa os campos dedicados stateUf/region e mantém
// o fallback por categoria para matérias antigas que ainda não foram migradas.
const categoryScopeFilter = `
  ($uf != null && stateUf == $uf) ||
  ($region != null && (region == $region || stateUf in $regionUfs)) ||
  (${categoryFilter})
`;

// 9b. Consulta de posts por categoria paginados (10 por 10)
// Filtra apenas status "aberto", "previsto" e "em_andamento" — oculta "encerrado" e "cancelado"
export const postsByCategoryPaginatedQuery = `
  *[_type == "post" && status in ["aberto", "previsto", "em_andamento"] && (${categoryScopeFilter})] | order(publishedAt desc) [$start..$end] {
    ${compactPostFields}
  }
`;

// 9c. Contagem total de posts por categoria (mesmo filtro da listagem)
export const postsByCategoryCountQuery = `
  count(*[_type == "post" && status in ["aberto", "previsto", "em_andamento"] && (${categoryScopeFilter})])
`;

// 10. Consulta de posts por estado (UF)
// Filtra apenas status "aberto", "previsto" e "em_andamento" — oculta "encerrado" e "cancelado"
export const statePostsQuery = `
  *[_type == "post" && 
    status in ["aberto", "previsto", "em_andamento"] &&
    (
      stateUf == $ufUpper ||
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
// Filtra apenas status "aberto", "previsto" e "em_andamento" — oculta "encerrado" e "cancelado"
export const searchPostsQuery = `
  *[_type == "post" && status in ["aberto", "previsto", "em_andamento"] && (
    title match "*" + $searchTerm + "*" ||
    excerpt match "*" + $searchTerm + "*" ||
    $searchTerm in categories[]->title ||
    $searchTerm in categories[]->slug.current ||
    categories[]->title match "*" + $searchTerm + "*"
  )] | order(publishedAt desc) {
    ${compactPostFields}
  }
`;

// Filtro reutilizável para busca por keywords de Hubs de Conteúdo.
// `hubAreas` é a fonte da verdade; o fallback por palavras-chave só é usado em
// matérias antigas que ainda não passaram pelo backfill.
const keywordsFilter = `
  $hubSlug in hubAreas ||
  (
    (!defined(hubAreas) || count(hubAreas) == 0) &&
    (
  count((categories[]->slug.current)[@ in $keywords]) > 0 ||
  count((categories[]->title)[lower(@) in $keywords]) > 0 ||
  $mainKeyword in categories[]->slug.current ||
  count((categories[]->slug.current)[lower(@) == lower($mainKeyword)]) > 0 ||
  count((categories[]->title)[lower(@) == lower($mainKeyword)]) > 0 ||
  title match "*" + $mainKeyword + "*" ||
  excerpt match "*" + $mainKeyword + "*" ||
  ($hubSlug == "concursos-municipais" && (
    sphere == "MUNICIPAL" ||
    title match "*prefeitura*" || title match "*municipal*" ||
    title match "*câmara*" || title match "*camara*"
  )) ||
  ($hubSlug == "concursos-policiais" && (
    title match "*polícia*" || title match "*policia*" || title match "*policial*" ||
    title match "*bombeiro*" || title match "*guarda municipal*" || title match "*penal*"
  )) ||
  ($hubSlug == "concursos-tribunais" && (
    title match "*tribunal*" || title match "*justiça*" || title match "*justica*" ||
    title match "*ministério público*" || title match "*ministerio publico*" ||
    title match "*defensoria*"
  )) ||
  ($hubSlug == "concursos-bancarios" && (
    title match "*banco*" || title match "*caixa econômica*" || title match "*caixa economica*" ||
    title match "*bacen*" || title match "*bndes*"
  )) ||
  ($hubSlug == "concursos-fiscais" && (
    title match "*fiscal*" || title match "*receita federal*" || title match "*sefaz*" ||
    title match "*auditor*" || title match "*tribunal de contas*" || title match "*tcu*" || title match "*tce*"
  )) ||
  ($hubSlug == "concursos-saude" && (
    title match "*saúde*" || title match "*saude*" || title match "*enfermagem*" ||
    title match "*médic*" || title match "*medic*" || title match "*hospital*" || title match "*sus*"
  )) ||
  ($hubSlug == "concursos-educacao" && (
    title match "*educação*" || title match "*educacao*" || title match "*professor*" ||
    title match "*pedagog*" || title match "*magistério*" || title match "*magisterio*" ||
    title match "*universidade*" || title match "*instituto federal*"
  )) ||
  ($hubSlug == "concursos-administrativos" && (
    title match "*administrativ*" || title match "*legislativo*" ||
    title match "*assembleia*" || title match "*câmara*" || title match "*camara*" ||
    title match "*inss*" || title match "*cgu*"
  ))
    )
  )
`;

// 12. Consulta de posts por conjunto de palavras-chave para Hubs de Conteúdo (Silos)
// Filtra apenas status "aberto", "previsto" e "em_andamento" — oculta "encerrado" e "cancelado"
export const postsByKeywordsPaginatedQuery = `
  *[_type == "post" && status in ["aberto", "previsto", "em_andamento"] && (${keywordsFilter})] | order(publishedAt desc) [$start..$end] {
    ${compactPostFields}
  }
`;

export const postsByKeywordsCountQuery = `
  count(*[_type == "post" && status in ["aberto", "previsto", "em_andamento"] && (${keywordsFilter})])
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

// 14. Consulta para o Explorador de Diretório (Lote principal de concursos recentes com metadados)
// Filtra apenas status "aberto", "previsto" e "em_andamento" — oculta "encerrado" e "cancelado"
export const directoryPostsQuery = `
  *[_type == "post" && status in ["aberto", "previsto", "em_andamento"]] | order(publishedAt desc)[0..120] {
    ${compactPostFields}
  }
`;

// 15. Consulta para Bancas Organizadoras (ex: FGV, Cebraspe, Vunesp...)
// Filtra apenas status "aberto", "previsto" e "em_andamento" — oculta "encerrado" e "cancelado"
export const bancaPostsQuery = `
  *[_type == "post" && 
    status in ["aberto", "previsto", "em_andamento"] &&
    (
      banca match $bancaName ||
      title match "*" + $bancaName + "*" ||
      title match "*" + $bancaSlug + "*" ||
      excerpt match "*" + $bancaName + "*"
    )] | order(publishedAt desc)[0..50] {
    ${compactPostFields}
  }
`;

// 16. Consulta para Combinações de Escolaridade + Estado (ex: Nível Médio em SP)
// Filtra apenas status "aberto", "previsto" e "em_andamento" — oculta "encerrado" e "cancelado"
export const educationAndStatePostsQuery = `
  *[_type == "post" && 
    status in ["aberto", "previsto", "em_andamento"] &&
    (
      $education in educationLevel ||
      title match "*" + $educationLabel + "*" ||
      excerpt match "*" + $educationLabel + "*" ||
      $educationLabel in categories[]->title
    ) && (
      stateUf == $ufUpper ||
      stateUf == "Nacional" ||
      $ufLower in categories[]->slug.current ||
      $ufUpper in categories[]->title ||
      title match " " + $ufUpper ||
      title match "-" + $ufUpper ||
      title match "/" + $ufUpper ||
      title match $stateName
    )] | order(publishedAt desc)[0..50] {
    ${compactPostFields}
  }
`;

// 17. Consulta para Concursos com Salários Acima de R$ 10.000
// Filtra apenas status "aberto", "previsto" e "em_andamento" — oculta "encerrado" e "cancelado"
export const highSalaryPostsQuery = `
  *[_type == "post" && status in ["aberto", "previsto", "em_andamento"] && (
    salaryMax >= 10000 ||
    title match "*10 mil*" ||
    title match "*15 mil*" ||
    title match "*20 mil*" ||
    title match "*30 mil*" ||
    title match "*R$ 1*" ||
    title match "*R$ 2*" ||
    title match "*R$ 3*" ||
    excerpt match "*10.000*" ||
    excerpt match "*15.000*" ||
    excerpt match "*20.000*"
  )] | order(publishedAt desc)[0..50] {
    ${compactPostFields}
  }
`;


// 18. Redirecionamento de slug antigo -> slug atual (301/308)
export const postBySlugHistoryQuery = `
  *[_type == "post" && $slug in slugHistory][0] {
    "slug": coalesce(slug.current, _id)
  }
`;

// 19. Autor por slug (páginas de autor / E-E-A-T)
export const authorBySlugQuery = `
  *[_type == "author" && (slug.current == $slug || _id == $slug)][0] {
    _id,
    name,
    role,
    "slug": coalesce(slug.current, _id),
    image,
    bio,
    facebookUrl,
    linkedinUrl,
    instagramUrl,
    twitterUrl
  }
`;

// 20. Posts de um autor (paginados)
export const postsByAuthorPaginatedQuery = `
  *[_type == "post" && author._ref == $authorId && status != "cancelado"]
  | order(publishedAt desc) [$start..$end] {
    ${compactPostFields}
  }
`;

export const postsByAuthorCountQuery = `
  count(*[_type == "post" && author._ref == $authorId && status != "cancelado"])
`;

export const allAuthorSlugsQuery = `
  *[_type == "author" && defined(name)] {
    "slug": coalesce(slug.current, _id)
  }[].slug
`;

// 21. Relacionados contextuais: mesma banca primeiro, depois mesmo estado
export const relatedPostsByBancaQuery = `
  *[_type == "post" && _id != $currentId && status != "cancelado" && (
    ($banca != "" && banca == $banca) ||
    ($stateUf != "" && $stateUf != "Nacional" && stateUf == $stateUf)
  )] | score(banca == $banca) | order(_score desc, publishedAt desc)[0..2] {
    ${compactPostFields}
  }
`;

// 22. Relacionados estritos por UF — usado no widget "Mais em [UF]".
// Nunca mistura outros estados quando o bloco é rotulado com a UF do post.
export const relatedPostsByStateQuery = `
  *[_type == "post" && _id != $currentId && stateUf == $stateUf &&
    status in ["aberto", "previsto", "em_andamento"]]
  | order(publishedAt desc)[0..4] {
    ${compactPostFields}
  }
`;
