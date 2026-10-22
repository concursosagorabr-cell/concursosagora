import { defineField, defineType } from 'sanity';
import {
  BRAZILIAN_STATES,
  CONTEST_PHASE,
  CONTEST_STATUS,
  EDUCATION_LEVELS,
  SPHERES,
} from '../objects/constants';

export default defineType({
  name: 'post',
  title: 'Matéria / Concurso',
  type: 'document',
  groups: [
    { name: 'conteudo', title: 'Conteúdo', default: true },
    { name: 'concurso', title: 'Dados do concurso' },
    { name: 'editorial', title: 'Publicação e organização' },
    { name: 'seo', title: 'SEO' },
    { name: 'legado', title: 'Campos legados' },
  ],
  fields: [
    // ── Conteúdo ────────────────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      group: 'conteudo',
      validation: (Rule) => Rule.required().min(8).max(160),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      group: 'conteudo',
      options: {
        source: 'title',
        maxLength: 96,
        isUnique: (slug, context) => context.defaultIsUnique(slug, context),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Resumo / chamada',
      type: 'text',
      rows: 4,
      group: 'conteudo',
      description: 'Aparece nos cards, na busca e como meta description quando o SEO não estiver preenchido.',
      validation: (Rule) => Rule.max(300).warning('Resumos acima de 300 caracteres podem ficar longos nos cards.'),
    }),
    defineField({
      name: 'mainImage',
      title: 'Imagem principal',
      type: 'image',
      group: 'conteudo',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Texto alternativo (acessibilidade)',
          type: 'string',
          description: 'Descreva a imagem para leitores de tela. Obrigatório para SEO e WCAG.',
          validation: (Rule) => Rule.required().warning('Imagens sem alt prejudicam acessibilidade e SEO.'),
        }),
        defineField({ name: 'caption', title: 'Legenda', type: 'string' }),
        defineField({ name: 'credit', title: 'Crédito / fonte da imagem', type: 'string' }),
      ],
    }),
    defineField({
      name: 'body',
      title: 'Corpo da matéria',
      type: 'array',
      group: 'conteudo',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Título 2', value: 'h2' },
            { title: 'Título 3', value: 'h3' },
            { title: 'Título 4', value: 'h4' },
            { title: 'Citação', value: 'blockquote' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numerada', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Negrito', value: 'strong' },
              { title: 'Itálico', value: 'em' },
              { title: 'Sublinhado', value: 'underline' },
              { title: 'Código', value: 'code' },
            ],
            annotations: [
              {
                name: 'link',
                title: 'Link',
                type: 'object',
                fields: [
                  defineField({
                    name: 'href',
                    title: 'URL',
                    type: 'url',
                    validation: (Rule) =>
                      Rule.required().uri({ scheme: ['http', 'https', 'mailto', 'tel'], allowRelative: true }),
                  }),
                  defineField({
                    name: 'blank',
                    title: 'Abrir em nova aba',
                    type: 'boolean',
                    initialValue: false,
                  }),
                ],
              },
            ],
          },
        },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Texto alternativo', type: 'string' }),
            defineField({ name: 'caption', title: 'Legenda', type: 'string' }),
            defineField({ name: 'credit', title: 'Crédito', type: 'string' }),
          ],
        },
        { type: 'codeBlock' },
        { type: 'dynamicRelatedPost' },
      ],
    }),

    // ── Dados do concurso ───────────────────────────────────────────────────
    defineField({
      name: 'status',
      title: 'Situação do concurso',
      type: 'string',
      group: 'concurso',
      options: { list: CONTEST_STATUS, layout: 'radio' },
      initialValue: 'previsto',
      validation: (Rule) => Rule.required(),
      description: 'Usado nos badges e no Schema.org JobPosting.',
    }),
    defineField({
      name: 'contestStatus',
      title: 'Fase do certame',
      type: 'string',
      group: 'concurso',
      options: { list: CONTEST_PHASE },
      description: 'Detalhe editorial da fase (ex.: comissão formada, edital publicado).',
    }),
    defineField({
      name: 'organ',
      title: 'Órgão / instituição',
      type: 'string',
      group: 'concurso',
      description: 'Ex.: Instituto Nacional do Seguro Social (INSS).',
    }),
    defineField({
      name: 'sphere',
      title: 'Esfera',
      type: 'string',
      group: 'concurso',
      options: { list: SPHERES, layout: 'radio' },
    }),
    defineField({
      name: 'banca',
      title: 'Banca organizadora',
      type: 'string',
      group: 'concurso',
      description: 'Nome da banca. Ex.: FGV, Cebraspe, Vunesp, FCC, IBFC.',
    }),
    defineField({
      name: 'stateUf',
      title: 'Estado (UF)',
      type: 'string',
      group: 'concurso',
      options: { list: BRAZILIAN_STATES, layout: 'dropdown' },
      description: 'Use "Nacional" para concursos federais de abrangência nacional.',
    }),
    defineField({
      name: 'cityName',
      title: 'Município',
      type: 'string',
      group: 'concurso',
    }),
    defineField({
      name: 'location',
      title: 'Localização (campo legado)',
      type: 'string',
      group: 'legado',
      description:
        'Texto livre usado pela busca por estado do frontend (ex.: "Campina Grande - PB"). Prefira os campos Município e Estado.',
    }),
    defineField({
      name: 'educationLevel',
      title: 'Escolaridade',
      type: 'array',
      group: 'concurso',
      of: [{ type: 'string' }],
      options: { list: EDUCATION_LEVELS, layout: 'grid' },
    }),
    defineField({
      name: 'vacanciesTotal',
      title: 'Total de vagas',
      type: 'number',
      group: 'concurso',
      validation: (Rule) => Rule.min(0).integer(),
    }),
    defineField({
      name: 'vacanciesByRole',
      title: 'Vagas por cargo',
      type: 'array',
      group: 'concurso',
      of: [{ type: 'vacancyByRole' }],
    }),
    defineField({
      name: 'salaryMin',
      title: 'Salário mínimo (R$)',
      type: 'number',
      group: 'concurso',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'salaryMax',
      title: 'Salário máximo (R$)',
      type: 'number',
      group: 'concurso',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'registrationFee',
      title: 'Taxa de inscrição (R$)',
      type: 'number',
      group: 'concurso',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'hasExemption',
      title: 'Prevê isenção de taxa',
      type: 'boolean',
      group: 'concurso',
    }),
    defineField({
      name: 'isCrOnly',
      title: 'Somente cadastro de reserva',
      type: 'boolean',
      group: 'concurso',
    }),
    defineField({
      name: 'enrollmentStartDate',
      title: 'Início das inscrições',
      type: 'date',
      group: 'concurso',
      options: { dateFormat: 'DD/MM/YYYY' },
    }),
    defineField({
      name: 'enrollmentEndDate',
      title: 'Fim das inscrições',
      type: 'date',
      group: 'concurso',
      options: { dateFormat: 'DD/MM/YYYY' },
    }),
    defineField({
      name: 'examDate',
      title: 'Data da prova',
      type: 'date',
      group: 'concurso',
      options: { dateFormat: 'DD/MM/YYYY' },
    }),

    // ── Publicação e organização ────────────────────────────────────────────
    defineField({
      name: 'publishedAt',
      title: 'Publicado em',
      type: 'datetime',
      group: 'editorial',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Autor',
      type: 'reference',
      group: 'editorial',
      to: [{ type: 'author' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'categories',
      title: 'Categorias',
      type: 'array',
      group: 'editorial',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
      options: { layout: 'tags' },
      validation: (Rule) => Rule.required().min(1).warning('Adicione ao menos uma categoria para o concurso aparecer nas listagens.'),
    }),
    defineField({
      name: 'seo',
      title: 'SEO e compartilhamento',
      type: 'seo',
      group: 'seo',
    }),

    // ── Governança do pipeline editorial ───────────────────────────────────
    defineField({
      name: 'reviewStatus',
      title: 'Status de revisão',
      type: 'string',
      group: 'editorial',
      options: {
        list: [
          { title: 'Aguardando revisão humana', value: 'pending' },
          { title: 'Aprovado', value: 'approved' },
          { title: 'Rejeitado', value: 'rejected' },
        ],
        layout: 'radio',
      },
      description:
        'O pipeline de IA deve criar rascunhos como "pending". A publicação só deve ocorrer após revisão humana.',
    }),
    defineField({
      name: 'aiAssisted',
      title: 'Produzido com auxílio de IA',
      type: 'boolean',
      group: 'editorial',
      initialValue: false,
      description: 'Transparência editorial: marque quando houver geração ou reescrita por IA.',
    }),
    defineField({
      name: 'sourceUrls',
      title: 'Fontes oficiais e verificações',
      type: 'array',
      group: 'editorial',
      of: [
        {
          type: 'object',
          name: 'sourceReference',
          fields: [
            defineField({ name: 'title', title: 'Título / documento', type: 'string' }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (Rule) => Rule.required().uri({ scheme: ['http', 'https'] }),
            }),
            defineField({
              name: 'type',
              title: 'Tipo',
              type: 'string',
              options: {
                list: [
                  { title: 'Oficial (diário, órgão, banca)', value: 'official' },
                  { title: 'Secundária / imprensa', value: 'secondary' },
                ],
              },
              initialValue: 'official',
            }),
            defineField({
              name: 'kind',
              title: 'Camada da fonte',
              type: 'string',
              options: {
                list: [
                  { title: 'Prim?ria oficial', value: 'official_primary' },
                  { title: 'Oficial secund?ria', value: 'official_secondary' },
                  { title: 'Imprensa', value: 'journalism' },
                  { title: 'Agregador', value: 'aggregator' },
                ],
              },
            }),
            defineField({
              name: 'usage',
              title: 'Uso',
              type: 'string',
              options: {
                list: [
                  { title: 'Fatos', value: 'facts' },
                  { title: 'Descoberta', value: 'discovery' },
                  { title: 'Corrobora??o', value: 'corroboration' },
                ],
              },
            }),
            defineField({ name: 'evidence', title: 'Trecho de evidência', type: 'text', rows: 3 }),
            defineField({ name: 'checkedAt', title: 'Verificado em', type: 'datetime' }),
          ],
          preview: {
            select: { title: 'title', subtitle: 'url' },
          },
        },
      ],
    }),
    defineField({
      name: 'contentHash',
      title: 'Hash do conteúdo de origem',
      type: 'string',
      group: 'editorial',
      readOnly: true,
      description: 'Usado para deduplicação pelo pipeline.',
    }),
    defineField({
      name: 'lastCheckedAt',
      title: 'Última checagem da fonte',
      type: 'datetime',
      group: 'editorial',
      readOnly: true,
    }),
    defineField({
      name: 'pipelineRunId',
      title: 'ID da execução do pipeline',
      type: 'string',
      group: 'editorial',
      readOnly: true,
    }),

    defineField({
      name: 'verificationStatus',
      title: 'Status da verificação',
      type: 'string',
      group: 'editorial',
      readOnly: true,
      options: {
        list: [
          { title: 'Verificado na fonte oficial', value: 'verified' },
          { title: 'Revisão necessária', value: 'needs_review' },
          { title: 'Bloqueado pelo pipeline', value: 'blocked' },
        ],
        layout: 'radio',
      },
      description:
        'Resultado da checagem determinística de fatos e evidências. Não substitui a revisão humana.',
    }),
    defineField({
      name: 'verificationScore',
      title: 'Nota de verificação',
      type: 'number',
      group: 'editorial',
      readOnly: true,
      validation: (Rule) => Rule.min(0).max(100),
      description: 'Nota de evidência na fonte (0 a 100). O rascunho só é criado acima do mínimo configurado.',
    }),
    defineField({
      name: 'verificationReport',
      title: 'Relatório de verificação',
      type: 'object',
      group: 'editorial',
      readOnly: true,
      fields: [
        defineField({ name: 'checkedAt', title: 'Verificado em', type: 'datetime' }),
        defineField({ name: 'method', title: 'Método', type: 'string' }),
        defineField({ name: 'score', title: 'Nota', type: 'number' }),
        defineField({ name: 'requiredScore', title: 'Nota m?nima', type: 'number' }),
        defineField({ name: 'sourceTier', title: 'Camada da fonte', type: 'string' }),
        defineField({ name: 'officialSource', title: 'Fonte oficial', type: 'boolean' }),
        defineField({ name: 'totalFacts', title: 'Fatos extraídos', type: 'number' }),
        defineField({ name: 'supportedFacts', title: 'Fatos com evidência', type: 'number' }),
        defineField({
          name: 'criticalMissing',
          title: 'Fatos críticos sem evidência',
          type: 'array',
          of: [{ type: 'string' }],
        }),
        defineField({
          name: 'blocking',
          title: 'Bloqueios',
          type: 'array',
          of: [{ type: 'string' }],
        }),
        defineField({
          name: 'warnings',
          title: 'Avisos',
          type: 'array',
          of: [{ type: 'string' }],
        }),
      ],
    }),
    defineField({
      name: 'factSheet',
      title: 'Ficha de fatos e evidências',
      type: 'array',
      group: 'editorial',
      readOnly: true,
      description:
        'Cada fato extra?do com o trecho literal da fonte que o sustenta. Use na revisão humana.',
      of: [
        {
          type: 'object',
          name: 'factCheck',
          fields: [
            defineField({ name: 'key', title: 'Campo', type: 'string' }),
            defineField({ name: 'value', title: 'Valor', type: 'text', rows: 2 }),
            defineField({ name: 'status', title: 'Situação', type: 'string' }),
            defineField({ name: 'confidence', title: 'Confiança', type: 'number' }),
            defineField({ name: 'quote', title: 'Trecho da fonte', type: 'text', rows: 4 }),
            defineField({
              name: 'sourceUrl',
              title: 'URL da fonte',
              type: 'url',
              validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
            }),
            defineField({ name: 'sourceTitle', title: 'Título da fonte', type: 'string' }),
            defineField({ name: 'method', title: 'Método', type: 'string' }),
          ],
          preview: {
            select: { title: 'key', subtitle: 'status' },
          },
        },
      ],
    }),

    // ── Campos legados (mantidos para compatibilidade com o pipeline) ───────
    defineField({
      name: 'examBoard',
      title: 'Banca (campo legado)',
      type: 'string',
      group: 'legado',
      hidden: ({ document }) => Boolean(document?.banca),
      description: 'Mantido para importações antigas. Prefira o campo "Banca organizadora".',
    }),
    defineField({
      name: 'vacancies',
      title: 'Vagas (campo legado)',
      type: 'number',
      group: 'legado',
      hidden: ({ document }) => typeof document?.vacanciesTotal === 'number',
      description: 'Mantido para importações antigas. Prefira "Total de vagas".',
    }),
    defineField({
      name: 'legacyId',
      title: 'ID de origem (legado)',
      type: 'string',
      group: 'legado',
      readOnly: true,
    }),
  ],
  orderings: [
    {
      title: 'Mais recentes',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
    {
      title: 'Título (A–Z)',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }],
    },
    {
      title: 'Salário (maior primeiro)',
      name: 'salaryDesc',
      by: [{ field: 'salaryMax', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
      media: 'mainImage',
      status: 'status',
      stateUf: 'stateUf',
      banca: 'banca',
      publishedAt: 'publishedAt',
    },
    prepare(selection: any) {
      const { title, slug, media, status, stateUf, banca, publishedAt } = selection || {};
      const date = publishedAt
        ? new Date(publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : 'sem data';
      const statusLabel =
        status === 'aberto'
          ? '🟢 Aberto'
          : status === 'previsto'
            ? '🟡 Previsto'
            : status === 'em_andamento'
              ? '🔵 Em andamento'
              : status === 'encerrado'
                ? '⚫ Encerrado'
                : '—';
      return {
        title: title || 'Sem título',
        media,
        subtitle: [statusLabel, stateUf, banca, date, slug].filter(Boolean).join(' • '),
      };
    },
  },
});
