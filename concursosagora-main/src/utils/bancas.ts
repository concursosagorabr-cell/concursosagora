export interface ExamBoard {
  slug: string;
  name: string;
  shortName: string;
  searchQuery: string;
  description: string;
  style: string;
  tips: string[];
  website?: string;
}

export const EXAM_BOARDS: Record<string, ExamBoard> = {
  fgv: {
    slug: 'fgv',
    name: 'Fundação Getulio Vargas (FGV)',
    shortName: 'FGV',
    searchQuery: 'FGV',
    description: 'A Fundação Getulio Vargas é uma das bancas mais renomadas e exigentes do Brasil, organizadora de grandes certames jurídicos, fiscais e da OAB.',
    style: 'Textos longos e interpretativos, foco em interpretação de texto pesada e casos práticos multidisciplinares.',
    tips: [
      'Estude interpretação de texto avançada com foco no estilo peculiar da FGV.',
      'Resolva questões recentes de provas dos últimos 3 anos.',
      'Atenção redobrada na gestão de tempo durante a prova devido aos enunciados extensos.',
    ],
    website: 'https://conhecimento.fgv.br/concursos',
  },
  cebraspe: {
    slug: 'cebraspe',
    name: 'Cebraspe / CESPE (UnB)',
    shortName: 'Cebraspe',
    searchQuery: 'Cebraspe',
    description: 'O Cebraspe é o principal organizador de concursos federais no Brasil (Polícia Federal, PRF, TCU, INSS, Tribunais Federais e Agências Reguladoras).',
    style: 'Modelo clássico Certo ou Errado onde uma questão errada anula uma certa, exigindo controle cirúrgico de chutes.',
    tips: [
      'Domine a estratégia de deixar questões em branco quando houver dúvida real.',
      'Foque na literalidade da lei combinada com jurisprudência consolidada dos tribunais superiores (STF/STJ).',
      'Treine simulados no modelo 120 itens C/E.',
    ],
    website: 'https://www.cebraspe.org.br/concursos',
  },
  vunesp: {
    slug: 'vunesp',
    name: 'Fundação Vunesp',
    shortName: 'Vunesp',
    searchQuery: 'Vunesp',
    description: 'Banca hegemônica no Estado de São Paulo, responsável pelos maiores concursos de prefeituras paulistas, TJ-SP, PC-SP e PM-SP.',
    style: 'Provas diretas de múltipla escolha (5 alternativas), cobrança intensa da letra seca da lei e gramática normativa tradicional.',
    tips: [
      'Leitura minuciosa da lei seca é fundamental para acertar 90%+ das questões de direito.',
      'Gramática clássica (crase, regência, concordância e pontuação) é muito cobrada.',
      'Excelente banca para ganhar velocidade e precisão em provas objetivas.',
    ],
    website: 'https://www.vunesp.com.br',
  },
  fcc: {
    slug: 'fcc',
    name: 'Fundação Carlos Chagas (FCC)',
    shortName: 'FCC',
    searchQuery: 'FCC',
    description: 'Tradicional organizadora dos principais concursos de Tribunais Regionais do Trabalho (TRTs), Tribunais de Contas e Secretarias de Fazenda.',
    style: 'Evoluiu da clássica "letra de lei" para questões com casos práticos e doutrina aprofundada, além de redações discursivas rigorosas.',
    tips: [
      'Priorize a resolução de baterias de questões anteriores por disciplina.',
      'Treine a elaboração de redações com temas da atualidade e direitos sociais.',
      'Atenção ao cálculo do desvio-padrão e notas de corte normalmente muito altas.',
    ],
    website: 'https://www.concursosfcc.com.br',
  },
  ibfc: {
    slug: 'ibfc',
    name: 'Instituto Brasileiro de Formação e Capacitação (IBFC)',
    shortName: 'IBFC',
    searchQuery: 'IBFC',
    description: 'Banca com forte presença em concursos de segurança pública estaduais (Polícias Militares, Civis e Penais), além da EBSERH e tribunais de justiça.',
    style: 'Questões diretas de múltipla escolha (4 ou 5 alternativas), enunciados objetivos e cobrança literal de legislação.',
    tips: [
      'Foque na memorização de prazos, conceitos e tabelas de legislação.',
      'Mantenha alto índice de acertos para compensar a nota de corte elevada.',
    ],
    website: 'https://www.ibfc.org.br',
  },
  'instituto-aocp': {
    slug: 'instituto-aocp',
    name: 'Instituto AOCP',
    shortName: 'Instituto AOCP',
    searchQuery: 'AOCP',
    description: 'Uma das bancas que mais cresce no país, organizando concursos de grandes universidades, secretarias de estado e corporações policiais.',
    style: 'Múltipla escolha objetiva com distribuição equilibrada de matérias e foco no edital de ponta a ponta.',
    tips: [
      'Cubra todo o conteúdo programático do edital sem deixar tópicos de lado.',
      'Pratique redações dissertativas estruturadas no padrão da banca.',
    ],
    website: 'https://www.institutoaocp.org.br',
  },
  fundatec: {
    slug: 'fundatec',
    name: 'Fundação Universidade Empresa de Tecnologia e Ciências (Fundatec)',
    shortName: 'Fundatec',
    searchQuery: 'Fundatec',
    description: 'Principal banca organizadora do Rio Grande do Sul e Região Sul, conduzindo certames de prefeituras, órgãos estaduais e conselhos regionais.',
    style: 'Questões bem contextualizadas e elaboradas, valorizando o conhecimento prático da rotina pública.',
    tips: [
      'Estude com ênfase nas legislações municipais e estaduais do RS.',
      'Atenção especial à interpretação de texto e matemática aplicada.',
    ],
    website: 'https://www.fundatec.org.br',
  },
  quadrix: {
    slug: 'quadrix',
    name: 'Instituto Quadrix',
    shortName: 'Quadrix',
    searchQuery: 'Quadrix',
    description: 'Líder nacional na organização de certames para Conselhos Regionais e Federais de Classe (CREA, CRM, CRO, CFP, COREN, etc.).',
    style: 'Adota frequentemente o modelo de itens Certo ou Errado (estilo Cebraspe) ou múltipla escolha de 5 alternativas.',
    tips: [
      'Conheça a legislação específica da profissão e do conselho regulador.',
      'Treine a estratégia de gestão de risco em provas de Certo/Errado.',
    ],
    website: 'https://www.quadrix.org.br',
  },
  cesgranrio: {
    slug: 'cesgranrio',
    name: 'Fundação Cesgranrio',
    shortName: 'Cesgranrio',
    searchQuery: 'Cesgranrio',
    description: 'Famosa organizadora do Concurso Público Nacional Unificado (CNU), Banco do Brasil, Caixa Econômica Federal e Petrobras.',
    style: 'Textos de apoio elucidativos, questões com abordagem prática, multidisciplinar e interdisciplinaridade.',
    tips: [
      'Entenda como aplicar a teoria em situações-problema do dia a dia bancário ou corporativo.',
      'Treine redações argumentativas claras e fundamentadas.',
    ],
    website: 'https://www.cesgranrio.org.br',
  },
};

export function getExamBoardBySlug(slug: string): ExamBoard | undefined {
  return EXAM_BOARDS[slug.toLowerCase()];
}

export function getAllExamBoards(): ExamBoard[] {
  return Object.values(EXAM_BOARDS);
}
