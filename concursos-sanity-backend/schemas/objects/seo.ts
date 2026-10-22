import { defineField, defineType } from 'sanity';

/**
 * Objeto de SEO reutilizável. O frontend usa o título/excerpt do documento,
 * mas estes campos permitem sobrescrever metadados sem alterar o conteúdo.
 */
export default defineType({
  name: 'seo',
  title: 'SEO e compartilhamento',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Título para SEO',
      type: 'string',
      description: 'Se vazio, o título da matéria é utilizado.',
      validation: (Rule) => Rule.max(70).warning('Acima de 70 caracteres pode ser truncado no Google.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Descrição para SEO',
      type: 'text',
      rows: 3,
      description: 'Se vazia, o resumo (excerpt) é utilizado.',
      validation: (Rule) => Rule.max(160).warning('Acima de 160 caracteres pode ser truncado no Google.'),
    }),
    defineField({
      name: 'keywords',
      title: 'Palavras-chave',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'noIndex',
      title: 'Não indexar no Google',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'URL canônica (opcional)',
      type: 'url',
      description: 'Use apenas quando a matéria for publicada originalmente em outro domínio.',
    }),
  ],
});
