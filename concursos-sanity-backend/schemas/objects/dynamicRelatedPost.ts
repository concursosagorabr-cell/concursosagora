import { defineField, defineType } from 'sanity';

/**
 * Bloco gerado pelo pipeline editorial para inserir uma matéria relacionada
 * dentro do corpo do Portable Text. É somente leitura no Studio.
 */
export default defineType({
  name: 'dynamicRelatedPost',
  title: 'Matéria relacionada (automático)',
  type: 'object',
  readOnly: true,
  fields: [
    defineField({ name: 'data', title: 'Dados', type: 'object', fields: [
      defineField({ name: 'title', title: 'Título', type: 'string' }),
      defineField({ name: 'slug', title: 'Slug', type: 'string' }),
      defineField({ name: 'excerpt', title: 'Resumo', type: 'text' }),
      defineField({ name: 'publishedAt', title: 'Publicado em', type: 'datetime' }),
      defineField({ name: 'mainImage', title: 'Imagem', type: 'image' }),
    ] }),
  ],
  preview: {
    select: { title: 'data.title', subtitle: 'data.slug' },
    prepare({ title, subtitle }) {
      return { title: title || 'Matéria relacionada', subtitle };
    },
  },
});
