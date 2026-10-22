import { defineField, defineType } from 'sanity';

/**
 * Banco de imagens usado pelo pipeline editorial para escolher fotos
 * por estado, área e palavras-chave.
 */
export default defineType({
  name: 'imageLibrary',
  title: 'Biblioteca de imagens',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Título / descrição',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Imagem',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Categoria',
      type: 'string',
      description: 'Ex.: SP, Segurança Pública, Nacional, Saúde.',
    }),
    defineField({
      name: 'tags',
      title: 'Tags de busca',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'source',
      title: 'Fonte / crédito',
      type: 'string',
      description: 'Ex.: Pexels / Unsplash Curado.',
    }),
    defineField({
      name: 'active',
      title: 'Ativa no rodízio',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'notes',
      title: 'Observações',
      type: 'text',
      rows: 2,
    }),
  ],
  orderings: [
    { title: 'Título (A–Z)', name: 'titleAsc', by: [{ field: 'title', direction: 'asc' }] },
    { title: 'Categoria', name: 'categoryAsc', by: [{ field: 'category', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title', subtitle: 'category', media: 'image', active: 'active', source: 'source' },
    prepare({ title, subtitle, media, active, source }) {
      return {
        title: title || 'Imagem',
        subtitle: [subtitle, active === false ? 'inativa' : null, source].filter(Boolean).join(' • '),
        media,
      };
    },
  },
});
