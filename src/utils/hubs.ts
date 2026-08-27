export interface SubSilo {
  title: string;
  slug: string;
  description?: string;
  type: 'category' | 'uf' | 'search';
}

export interface ContentHub {
  slug: string;
  title: string;
  shortTitle: string;
  icon: string;
  description: string;
  seoDescription: string;
  keywords: string[];
  categoryMatch: string[]; // Slugs ou nomes de categorias no Sanity
  subSilos: SubSilo[];
}

export const CONTENT_HUBS: ContentHub[] = [
  {
    slug: 'concursos-municipais',
    title: 'Hub de Concursos Municipais & Prefeituras',
    shortTitle: 'Municipais',
    icon: '🏛️',
    description:
      'Guia completo com notícias, editais e prazos de Prefeituras, Câmaras Municipais e Guardas de todas as cidades brasileiras.',
    seoDescription:
      'Confira os concursos públicos municipais com editais abertos e previstos para prefeituras e câmaras em todos os estados do Brasil.',
    keywords: ['municipal', 'prefeitura', 'câmara', 'guarda municipal', 'município'],
    categoryMatch: ['municipais', 'prefeituras', 'câmaras', 'guarda-municipal'],
    subSilos: [
      { title: 'São Paulo (SP)', slug: 'sp', type: 'uf' },
      { title: 'Rio de Janeiro (RJ)', slug: 'rj', type: 'uf' },
      { title: 'Minas Gerais (MG)', slug: 'mg', type: 'uf' },
      { title: 'Rio Grande do Sul (RS)', slug: 'rs', type: 'uf' },
      { title: 'Paraná (PR)', slug: 'pr', type: 'uf' },
      { title: 'Santa Catarina (SC)', slug: 'sc', type: 'uf' },
      { title: 'Bahia (BA)', slug: 'ba', type: 'uf' },
      { title: 'Goiás (GO)', slug: 'go', type: 'uf' },
      { title: 'Pernambuco (PE)', slug: 'pe', type: 'uf' },
      { title: 'Ceará (CE)', slug: 'ce', type: 'uf' },
    ],
  },
  {
    slug: 'concursos-policiais',
    title: 'Hub de Concursos Policiais & Segurança Pública',
    shortTitle: 'Carreiras Policiais',
    icon: '🚓',
    description:
      'Central de editais da Polícia Federal, Polícia Rodoviária Federal, Polícias Civis, Militares, Penais e Guardas Municipais.',
    seoDescription:
      'Acompanhe todos os concursos da área policial e segurança pública: PF, PRF, Polícia Civil, Polícia Militar, Polícia Penal e Bombeiros.',
    keywords: ['polícia', 'policial', 'pm', 'pc', 'pf', 'prf', 'penal', 'bombeiro', 'segurança'],
    categoryMatch: ['policial', 'segurança-pública', 'carreiras-policiais', 'polícia-civil', 'polícia-militar', 'polícia-penal'],
    subSilos: [
      { title: 'Polícia Federal & PRF', slug: 'policia-federal', type: 'search' },
      { title: 'Polícia Civil (PC)', slug: 'policia-civil', type: 'search' },
      { title: 'Polícia Militar (PM)', slug: 'policia-militar', type: 'search' },
      { title: 'Polícia Penal & DEPEN', slug: 'policia-penal', type: 'search' },
      { title: 'Guardas Municipais (GCM)', slug: 'guarda-municipal', type: 'search' },
      { title: 'Corpo de Bombeiros', slug: 'bombeiros', type: 'search' },
    ],
  },
  {
    slug: 'concursos-tribunais',
    title: 'Hub de Concursos de Tribunais & Poder Judiciário',
    shortTitle: 'Tribunais & Judiciário',
    icon: '⚖️',
    description:
      'Guia definitivo de oportunidades no Poder Judiciário: TJs, TRTs, TRFs, TREs, STJ, STF, MPU e Defensorias Públicas.',
    seoDescription:
      'Tudo sobre concursos de tribunais de justiça (TJ), do trabalho (TRT), federais (TRF), eleitorais (TRE) e Ministério Público.',
    keywords: ['tribunal', 'tj', 'trt', 'trf', 'tre', 'tst', 'stj', 'stf', 'defensoria', 'mpu', 'ministério público'],
    categoryMatch: ['tribunais', 'judiciário', 'ministério-público', 'tj', 'trt', 'trf', 'tre'],
    subSilos: [
      { title: 'Tribunais de Justiça (TJs)', slug: 'tj', type: 'search' },
      { title: 'Tribunais Regionais do Trabalho (TRTs)', slug: 'trt', type: 'search' },
      { title: 'Tribunais Regionais Federais (TRFs)', slug: 'trf', type: 'search' },
      { title: 'Tribunais Regionais Eleitorais (TREs)', slug: 'tre', type: 'search' },
      { title: 'Ministério Público & MPU', slug: 'ministerio-publico', type: 'search' },
      { title: 'Defensoria Pública (DPE/DPU)', slug: 'defensoria', type: 'search' },
    ],
  },
  {
    slug: 'concursos-bancarios',
    title: 'Hub de Concursos Bancários & Área Financeira',
    shortTitle: 'Bancários & Finanças',
    icon: '🏦',
    description:
      'Acompanhe editais do Banco do Brasil, Caixa Econômica Federal, Banco Central (BACEN), BNDES e Bancos Estaduais.',
    seoDescription:
      'Notícias e vagas para concursos bancários no Brasil: Caixa Econômica, Banco do Brasil, BACEN, BNDES, BRB e Banrisul.',
    keywords: ['banco', 'bancária', 'caixa', 'bacen', 'bndes', 'finanças', 'banrisul', 'brb'],
    categoryMatch: ['bancária', 'bancários', 'finanças', 'bancos'],
    subSilos: [
      { title: 'Banco do Brasil (BB)', slug: 'banco-do-brasil', type: 'search' },
      { title: 'Caixa Econômica Federal (CEF)', slug: 'caixa-economica', type: 'search' },
      { title: 'Banco Central (BACEN)', slug: 'bacen', type: 'search' },
      { title: 'BNDES', slug: 'bndes', type: 'search' },
      { title: 'Bancos Regionais (BRB, Banrisul...)', slug: 'banco', type: 'search' },
    ],
  },
  {
    slug: 'concursos-fiscais',
    title: 'Hub de Concursos Fiscais & Controle',
    shortTitle: 'Fiscal & Controle',
    icon: '📊',
    description:
      'Oportunidades em fiscos federais, estaduais e municipais: Receita Federal, SEFAZ, ISS e Tribunais de Contas (TCU/TCE).',
    seoDescription:
      'Confira os melhores concursos para Auditor Fiscal e Analista da Receita Federal, SEFAZ estaduais, ISS e Tribunais de Contas.',
    keywords: ['fiscal', 'sefaz', 'receita', 'iss', 'tcu', 'tce', 'auditor', 'contábil', 'controle'],
    categoryMatch: ['fiscal', 'fiscal-contábil', 'receita-federal', 'sefaz', 'controle'],
    subSilos: [
      { title: 'Receita Federal', slug: 'receita-federal', type: 'search' },
      { title: 'Secretarias de Fazenda (SEFAZ)', slug: 'sefaz', type: 'search' },
      { title: 'Imposto Sobre Serviços (ISS)', slug: 'iss', type: 'search' },
      { title: 'Tribunal de Contas da União (TCU)', slug: 'tcu', type: 'search' },
      { title: 'Tribunais de Contas Estaduais (TCEs)', slug: 'tce', type: 'search' },
    ],
  },
  {
    slug: 'concursos-saude',
    title: 'Hub de Concursos da Saúde & SUS',
    shortTitle: 'Saúde & SUS',
    icon: '🏥',
    description:
      'Notícias e vagas para Enfermagem, Medicina, Psicologia, Odontologia, Ebserh, Anvisa e Secretarias de Saúde.',
    seoDescription:
      'Encontre concursos abertos e previstos para profissionais da saúde: Ebserh, Enfermagem, Médicos, Anvisa e SUS.',
    keywords: ['saúde', 'enfermagem', 'médico', 'ebserh', 'sus', 'anvisa', 'psicologia', 'nutrição', 'odontologia'],
    categoryMatch: ['saúde', 'ebserh', 'enfermagem', 'medicina'],
    subSilos: [
      { title: 'EBSERH (Hospitais Universitários)', slug: 'ebserh', type: 'search' },
      { title: 'Enfermagem & Técnicos', slug: 'enfermagem', type: 'search' },
      { title: 'Médicos & Especialistas', slug: 'medico', type: 'search' },
      { title: 'ANVISA & Agências Reguladoras', slug: 'anvisa', type: 'search' },
      { title: 'Secretarias de Saúde (SES/SMS)', slug: 'saude', type: 'search' },
    ],
  },
  {
    slug: 'concursos-educacao',
    title: 'Hub de Concursos de Educação & Magistério',
    shortTitle: 'Educação & Docência',
    icon: '🎓',
    description:
      'Notícias, editais e vagas para Professores, Pedagogos, Universidades Federais (UFs), Institutos Federais (IFs) e Secretarias.',
    seoDescription:
      'Tudo sobre concursos para professores e magistério público em secretarias de educação, IFs e universidades federais.',
    keywords: ['educação', 'professor', 'pedagogia', 'universidade', 'if', 'uf', 'magistério', 'docência'],
    categoryMatch: ['educação', 'magistério', 'professores', 'institutos-federais'],
    subSilos: [
      { title: 'Professores da Educação Básica', slug: 'professor', type: 'search' },
      { title: 'Institutos Federais (IFs)', slug: 'instituto-federal', type: 'search' },
      { title: 'Universidades Federais (UFs)', slug: 'universidade-federal', type: 'search' },
      { title: 'Pedagogos & Orientadores', slug: 'pedagogia', type: 'search' },
    ],
  },
];

export function getHubBySlug(slug: string): ContentHub | undefined {
  return CONTENT_HUBS.find((h) => h.slug === slug);
}

/**
 * Retorna o Hub de conteúdo mais relevante para um determinado post (para linkagem interna bidirecional)
 */
export function getMatchingHubForPost(postTitle: string, categories: string[] = []): ContentHub | undefined {
  const textToTest = `${postTitle} ${categories.join(' ')}`.toLowerCase();

  for (const hub of CONTENT_HUBS) {
    for (const kw of hub.keywords) {
      if (textToTest.includes(kw.toLowerCase())) {
        return hub;
      }
    }
  }

  return undefined;
}
