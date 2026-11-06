import type { Analise } from '@/types';

/**
 * Análises autorais do Concursos Agora.
 *
 * Para publicar uma nova análise:
 * 1. Adicione a imagem em `public/analises/<slug>.jpg` (1200x675 recomendado).
 * 2. Crie um novo objeto `Analise` em `ANALISES` (o mais recente primeiro).
 * 3. Use `**texto**` para destacar trechos em negrito dentro dos blocos.
 *
 * O conteúdo é local e versionado, portanto não depende de credenciais do Sanity.
 */
const ANALISES: Analise[] = [
  {
    slug: 'do-jatinho-de-brad-pitt-ao-crack-da-anidrol',
    title:
      'DO JATINHO DE BRAD PITT AO CRACK DA ANIDROL: A farsa do “milagre privado” ruiu — e o Brasil corre para o Diário Oficial',
    shortTitle:
      'Do jatinho de Brad Pitt ao crack da Anidrol: a farsa do “milagre privado” ruiu',
    excerpt:
      'Casas apodrecidas em Nova Orleans, notas frias na AstraZeneca, confeiteiras infartando por boicote político e patriotas dormindo na lama em Ciudad del Este: o retrato sem filtros de um mercado em colapso que transformou a estabilidade pública no bem mais cobiçado da década.',
    image: {
      src: '/analises/ninguem-esta-seguro.jpg',
      alt: 'Arte editorial dividida entre um cenário de colapso urbano e um edifício público clássico, com a pergunta “Ninguém está seguro?”',
      caption:
        'De um lado, o colapso do “milagre privado”. Do outro, a estabilidade protegida pelo serviço público.',
      credit: 'Arte: Concursos Agora',
    },
    publishedAt: '2026-11-06T08:30:00-03:00',
    author: {
      name: 'Redação Concursos Agora',
      role: 'Análise editorial',
    },
    tags: [
      'Estabilidade',
      'Serviço público',
      'Concursos',
      'Setor privado',
      'Análise',
    ],
    featured: true,
    seo: {
      metaTitle:
        'Ninguém está seguro? A farsa do “milagre privado” e a corrida pelo Diário Oficial',
      metaDescription:
        'Brad Pitt, Renato Cariani, boicotes e o delírio do Paraguai: o retrato de um mercado em colapso que transformou a estabilidade pública no bem mais cobiçado da década.',
    },
    body: [
      {
        type: 'paragraph',
        text: 'Se você passar trinta minutos navegando pelas redes sociais ou assistindo ao noticiário nesta semana, a conclusão é inescapável: **o setor privado perdeu completamente a compostura.**',
      },
      {
        type: 'paragraph',
        text: 'Não importa se você é um astro de cinema bilionário, um influenciador fitness com 11 milhões de seguidores, uma comerciante do interior ou um autônomo tentando a sorte além da fronteira — a iniciativa privada se transformou em um moedor de carne emocional e financeiro. Enquanto a internet continua inundada de gurus prometendo “liberdade financeira”, “ganhos em dólar” e “fuga de impostos”, a vida real vem cobrando a fatura com juros, processos e desespero.',
      },
      {
        type: 'heading',
        text: 'O colapso no topo da pirâmide: até Brad Pitt virou refém do próprio império',
      },
      {
        type: 'paragraph',
        text: 'Engana-se quem pensa que a montanha-russa do mercado só atinge os pequenos. Analisado em detalhes por Peter Jordan no canal Ei Nerd, o império do homem que já foi considerado o mais intocável de Hollywood virou um cemitério de reputação e dinheiro.',
      },
      {
        type: 'paragraph',
        text: 'Brad Pitt não apenas viu seus filhos (Maddox, Zahara e Shiloh) irem à Justiça para apagar seu sobrenome da certidão de nascimento, como coleciona escândalos empresariais desastrosos:',
      },
      {
        type: 'list',
        items: [
          '**Casas descartáveis em Nova Orleans:** a sua fundação, a Make It Right, prometeu moradias sustentáveis pós-furacão Katrina a **US$ 150 mil**. Poucos anos depois, a madeira apodreceu, telhados desabaram e a prefeitura local precisou enviar tratores para **demolir as casas por risco de desabamento iminente**, gerando processos de mais de **US$ 20 milhões**.',
          '**A guerra do vinho na França:** sua batalha judicial com Angelina Jolie pela vinícola Château Miraval descarrilou para acusações de contratos ilegais com magnatas russos e episódios de violência em jatinhos particulares, com poltronas destruídas por vinho derramado.',
          '**A terra sem lei da Inteligência Artificial:** como se não bastasse, sua imagem virou arma de estelionato digital — uma mulher francesa de 53 anos entregou nada menos que **R$ 5,1 milhões (€ 830 mil)** acreditando namorar um clone virtual de Brad Pitt criado por criminosos na web.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Se o auge do capitalismo de Hollywood não oferece estabilidade, o que sobra para o trabalhador comum?',
      },
      {
        type: 'heading',
        text: 'Da glória do fisiculturismo à mira da Polícia Federal: o pesadelo Cariani',
      },
      {
        type: 'paragraph',
        text: 'Enquanto os ricos sangram em Beverly Hills, o “empreendedorismo de alta performance” brasileiro enfrenta suas próprias bombas-relógio. No programa Na Cena do Crime, o especialista em segurança Jorge Lordello e o Detetive Allan colocaram o influenciador fitness Renato Cariani sob a lente da Justiça criminal.',
      },
      {
        type: 'paragraph',
        text: 'Dono de um império construído diante de milhões de seguidores que compram dietas e motivação, Cariani e sua empresa, a Anidrol, foram tragados por um inquérito da Polícia Federal que investiga o desvio massivo de toneladas de produtos químicos controlados:',
      },
      {
        type: 'list',
        items: [
          '**Solventes, ácidos clorídrico e sulfúrico, bicarbonato e lidocaína** — o cardápio exato utilizado por facções como PCC e Comando Vermelho para transformar pasta-base em cocaína refinada e pedras de crack.',
          '**Notas fiscais frias** emitidas em nome de gigantes farmacêuticas, como a AstraZeneca, que precisou ir a público desmentir que jamais comprou um único grama da empresa do influenciador.',
          '**Mensagens interceptadas de arrepiar:** “Poderemos trabalhar no feriado para arrumar a casa e fugir da polícia”, além de contatos suspeitos com o policial civil André Dziuba na tentativa desesperada de monitorar investigações.',
        ],
      },
      {
        type: 'paragraph',
        text: 'O recado foi dado: no setor corporativo, basta um contrato mal amarrado, um sócio controverso ou a ambição desmedida para trocar o escritório de vidro por um mandado de busca e apreensão às 6 da manhã.',
      },
      {
        type: 'heading',
        text: 'O inferno dos pequenos: lágrimas em Itumbiara e UTI em Águas de São Pedro',
      },
      {
        type: 'paragraph',
        text: 'Descendo para o chão de fábrica e para o pequeno comércio, o cenário é de terra arrasada. Documentado pelo canal de Daniel, o pós-eleição brasileiro transformou clientes em inimigos declarados por pura histeria de polarização:',
      },
      {
        type: 'list',
        items: [
          '**O desespero do adoçante:** em Itumbiara (GO), a proprietária de uma doceria saudável viralizou aos prantos ao ver seu negócio arruinado. Ela desabafou sobre o custo de insumos caros — farinha de arroz, grão-de-bico, goma xantana e blends de adoçante — descartados no lixo porque entrou em uma “lista de boicote” bolsonarista por ter apoiado o PT.',
          '**Infarto no comércio:** em Águas de São Pedro, a comerciante Maria de Fátima foi parar na emergência do hospital com dores agudas no peito, após 30 anos de trabalho serem alvejados por vizinhos jurando que ninguém mais pisaria na sua lanchonete.',
          '**O chef desafiante:** o renomado confeiteiro Lucas Corazza precisou ir às redes sociais declarar que “o dinheiro do fascista é bem-vindo, mas o fascista não”, enquanto outros donos de restaurantes imploravam publicamente para não quebrar.',
        ],
      },
      {
        type: 'paragraph',
        text: 'No setor privado brasileiro de hoje, o seu sustento não depende da qualidade do que você produz. Depende de quem você votou, do algoritmo do dia e da misericórdia de linchamentos virtuais.',
      },
      {
        type: 'heading',
        text: 'O delírio do “Migramóvel”: R$ 82 no papel higiênico e humilhação na lama',
      },
      {
        type: 'paragraph',
        text: 'Fugir do Brasil resolve? Muitos acreditaram que sim. E o resultado beira o tragicômico.',
      },
      {
        type: 'paragraph',
        text: 'O comunicador Luide Matos (Luideverso) expôs o delírio coletivo de brasileiros que caíram na lábia de influenciadores digitais vendendo o Paraguai como a “Suíça da América Latina sem CLT e sem impostos”:',
      },
      {
        type: 'list',
        items: [
          '**O acampamento da humilhação:** centenas de famílias dormindo em filas de três dias, debaixo de chuva e frio, em barracas improvisadas no asfalto de Ciudad del Este para tentar o atendimento do “Migramóvel”.',
          '**O choque da gôndola:** a fantasia de luxo evaporou no caixa do supermercado, onde o pacote de café Melitta bateu **R$ 62** e o fardo de **papel higiênico atingiu surreais R$ 82**, pagos em guaranis desvalorizados.',
          '**A quebra dos bancos:** o suposto paraíso financeiro implodiu com a intervenção no UENO Bank, deixando milhares de brasileiros desesperados sem conseguir resgatar o dinheiro suado que transferiram para lá.',
          '**O golpe da “imersão”:** enquanto famílias dividiam rolos de papel higiênico na calçada, gurus de terno de poliéster continuavam gravando vídeos em ruas esburacadas de barro, prometendo “cursos para virar pedreiro no Paraguai e faturar em dólar”.',
        ],
      },
      {
        type: 'heading',
        text: 'O choque de lucidez: por que a estabilidade virou o sonho proibido?',
      },
      {
        type: 'paragraph',
        text: 'Coloque os fatos lado a lado:',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          'Em Paris, Sonia Blota mostrava na Band que o salário do cidadão europeu foi devorado pela inflação de energia e comida do governo Macron.',
          'No Brasil, o pequeno empresário infarta com medo de cancelamento no Instagram.',
          'No topo, Brad Pitt e Renato Cariani provam que o mercado corporativo é uma selva de processos e riscos legais.',
          'Na fronteira, a fuga de impostos virou perrengue de barraca na lama em Ciudad del Este.',
        ],
      },
      {
        type: 'paragraph',
        text: 'É em meio a esse caos generalizado que cai a ficha de milhões de brasileiros: **a iniciativa privada virou um cassino viciado.**',
      },
      {
        type: 'paragraph',
        text: 'Enquanto a internet tenta te vender atalhos perigosos — de “ganhar em dólar da sala de casa” até “viver sem leis no Paraguai” —, existe apenas um refúgio amparado pelo Artigo 41 da Constituição Federal: **o Concurso Público.**',
      },
      {
        type: 'list',
        items: [
          '**Salário blindado:** no serviço público, o salário não atrasa se houver guerra na Europa ou boicote no comércio da esquina. Cai impreterivelmente no 5º dia útil.',
          '**Imunidade contra o ódio:** o servidor público responde à lei e à impessoalidade, e não ao capricho de clientes furiosos nas redes sociais. Ninguém te demite porque descobriu sua opinião política.',
          '**Fim das notas frias e da insegurança jurídica:** o concursado não precisa se associar a esquemas duvidosos para faturar alto; sua remuneração e sua progressão são públicas, transparentes e garantidas por lei.',
        ],
      },
      {
        type: 'heading',
        text: 'O único atalho real é o Diário Oficial',
      },
      {
        type: 'paragraph',
        text: 'A loucura das manchetes mostra que não há paz para quem vive na corda bamba do mercado autônomo. Fugir para o Paraguai não vai te salvar. Apostar em fórmulas milagrosas de internet só vai enriquecer quem vende o curso.',
      },
      {
        type: 'paragraph',
        text: 'A única variável que depende exclusivamente de você — e que nenhum algoritmo, cliente histérico ou crise bancária pode te tirar — é **o tempo que você passa estudando até cravar seu nome na lista de aprovados.**',
      },
      {
        type: 'quote',
        text: 'Pare de apostar no caos: transforme o seu esforço na estabilidade que ninguém conseguirá derrubar.',
      },
      {
        type: 'paragraph',
        text: 'Se você cansou de ser passageiro da incerteza e decidiu construir uma carreira com chão firme, o seu ponto de partida é o portal **Concursos Agora** — o maior radar de editais abertos, remunerações de ponta e cronogramas estratégicos do Brasil.',
      },
      {
        type: 'paragraph',
        text: 'Acompanhe também as análises completas e desmistificadas de cada concurso no canal do Concursos Agora no YouTube. O atalho existe — e ele passa pela sua aprovação.',
      },
    ],
  },
];

export function getAllAnalises(): Analise[] {
  return [...ANALISES].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getAnaliseBySlug(slug: string): Analise | undefined {
  return ANALISES.find((analise) => analise.slug === slug);
}

export function getLatestAnalises(limit = 3): Analise[] {
  return getAllAnalises().slice(0, limit);
}

export function getRelatedAnalises(slug: string, limit = 3): Analise[] {
  return getAllAnalises()
    .filter((analise) => analise.slug !== slug)
    .slice(0, limit);
}

export function getAnaliseReadingMinutes(analise: Analise): number {
  const text = analise.body
    .map((block) => (block.type === 'list' ? block.items.join(' ') : block.text))
    .join(' ');

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function getAnalisePlainText(analise: Analise): string {
  return analise.body
    .map((block) => (block.type === 'list' ? block.items.join(' ') : block.text))
    .join(' ')
    .replace(/\*\*/g, '');
}

export function formatAnaliseDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
