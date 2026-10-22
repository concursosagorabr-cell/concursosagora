import { defineField, defineType } from 'sanity';

export const BRAZILIAN_STATES = [
  { title: 'Acre (AC)', value: 'AC' },
  { title: 'Alagoas (AL)', value: 'AL' },
  { title: 'Amapá (AP)', value: 'AP' },
  { title: 'Amazonas (AM)', value: 'AM' },
  { title: 'Bahia (BA)', value: 'BA' },
  { title: 'Ceará (CE)', value: 'CE' },
  { title: 'Distrito Federal (DF)', value: 'DF' },
  { title: 'Espírito Santo (ES)', value: 'ES' },
  { title: 'Goiás (GO)', value: 'GO' },
  { title: 'Maranhão (MA)', value: 'MA' },
  { title: 'Mato Grosso (MT)', value: 'MT' },
  { title: 'Mato Grosso do Sul (MS)', value: 'MS' },
  { title: 'Minas Gerais (MG)', value: 'MG' },
  { title: 'Pará (PA)', value: 'PA' },
  { title: 'Paraíba (PB)', value: 'PB' },
  { title: 'Paraná (PR)', value: 'PR' },
  { title: 'Pernambuco (PE)', value: 'PE' },
  { title: 'Piauí (PI)', value: 'PI' },
  { title: 'Rio de Janeiro (RJ)', value: 'RJ' },
  { title: 'Rio Grande do Norte (RN)', value: 'RN' },
  { title: 'Rio Grande do Sul (RS)', value: 'RS' },
  { title: 'Rondônia (RO)', value: 'RO' },
  { title: 'Roraima (RR)', value: 'RR' },
  { title: 'Santa Catarina (SC)', value: 'SC' },
  { title: 'São Paulo (SP)', value: 'SP' },
  { title: 'Sergipe (SE)', value: 'SE' },
  { title: 'Tocantins (TO)', value: 'TO' },
  { title: 'Nacional', value: 'Nacional' },
];

export const EDUCATION_LEVELS = [
  { title: 'Fundamental', value: 'fundamental' },
  { title: 'Médio', value: 'medio' },
  { title: 'Técnico', value: 'tecnico' },
  { title: 'Superior', value: 'superior' },
];

export const CONTEST_STATUS = [
  { title: 'Aberto', value: 'aberto' },
  { title: 'Previsto / aguardando edital', value: 'previsto' },
  { title: 'Em andamento', value: 'em_andamento' },
  { title: 'Encerrado', value: 'encerrado' },
];

export const CONTEST_PHASE = [
  { title: 'Aguardando autorização', value: 'aguardando_autorizacao' },
  { title: 'Autorizado', value: 'autorizado' },
  { title: 'Comissão formada', value: 'comissao_formada' },
  { title: 'Ato intermediário', value: 'ato_intermediario' },
  { title: 'Edital publicado', value: 'edital_publicado' },
  { title: 'Inscrições abertas', value: 'inscricoes_abertas' },
  { title: 'Provas aplicadas', value: 'provas_aplicadas' },
  { title: 'Resultado publicado', value: 'resultado_publicado' },
  { title: 'Encerrado', value: 'encerrado' },
];

export const SPHERES = [
  { title: 'Federal', value: 'FEDERAL' },
  { title: 'Estadual', value: 'ESTADUAL' },
  { title: 'Distrital', value: 'DISTRITAL' },
  { title: 'Municipal', value: 'MUNICIPAL' },
  { title: 'Nacional', value: 'NACIONAL' },
];

/** Campos compartilhados entre os documentos do portal. */
export const commonFields = [
  defineField({
    name: 'title',
    title: 'Título',
    type: 'string',
    validation: (Rule) => Rule.required().min(8).max(160),
  }),
  defineField({
    name: 'slug',
    title: 'Slug (URL)',
    type: 'slug',
    options: {
      source: 'title',
      maxLength: 96,
      isUnique: (slug, context) => context.defaultIsUnique(slug, context),
    },
    validation: (Rule) => Rule.required(),
  }),
];
