import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'category',
  title: 'Categoria',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Nome',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(60),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 60,
        isUnique: (slug, context) => context.defaultIsUnique(slug, context),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Descrição',
      type: 'text',
      rows: 3,
      description: 'Texto curto usado em listagens e no SEO da página de categoria.',
    }),
    defineField({
      name: 'group',
      title: 'Agrupamento',
      type: 'string',
      options: {
        list: [
          { title: 'Carreira / Área temática', value: 'carreira' },
          { title: 'Área técnica (sinônimos legados)', value: 'area' },
          { title: 'Estado (UF)', value: 'estado' },
          { title: 'Região', value: 'regiao' },
          { title: 'Situação / tipo', value: 'status' },
          { title: 'Instituição / órgão', value: 'instituicao' },
          { title: 'Banca', value: 'banca' },
        ],
        layout: 'dropdown',
      },
      description: 'Ajuda a organizar o menu e o Studio. Não altera as URLs. Use "Carreira" para menus de navegação principal (ex: Fiscal, Tribunais, Policial, Saúde, Educação).',
    }),
  ],
  orderings: [
    { title: 'Nome (A–Z)', name: 'titleAsc', by: [{ field: 'title', direction: 'asc' }] },
    { title: 'Mais recentes', name: 'createdDesc', by: [{ field: '_createdAt', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'title', subtitle: 'slug.current', description: 'description' },
    prepare({ title, subtitle, description }) {
      return { title: title || 'Categoria', subtitle: subtitle || description || '' };
    },
  },
});
