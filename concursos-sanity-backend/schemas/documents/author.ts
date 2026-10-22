import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'author',
  title: 'Autor',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nome',
      type: 'string',
      validation: (Rule) => Rule.required().min(3).max(80),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 80,
        isUnique: (slug, context) => context.defaultIsUnique(slug, context),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Cargo / especialidade',
      type: 'string',
      description: 'Ex.: Repórter Especial de Concursos & Roteiros de Estudo.',
    }),
    defineField({
      name: 'image',
      title: 'Foto',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Texto alternativo', type: 'string' })],
    }),
    defineField({
      name: 'bio',
      title: 'Biografia',
      type: 'array',
      of: [{ type: 'block', styles: [{ title: 'Normal', value: 'normal' }], lists: [] }],
    }),
    defineField({
      name: 'linkedinUrl',
      title: 'LinkedIn',
      type: 'url',
      validation: (Rule) => Rule.uri({ scheme: ['https'] }).warning('Use uma URL https.'),
    }),
    defineField({
      name: 'twitterUrl',
      title: 'X / Twitter',
      type: 'url',
      validation: (Rule) => Rule.uri({ scheme: ['https'] }).warning('Use uma URL https.'),
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram',
      type: 'url',
      validation: (Rule) => Rule.uri({ scheme: ['https'] }).warning('Use uma URL https.'),
    }),
    defineField({
      name: 'facebookUrl',
      title: 'Facebook',
      type: 'url',
      validation: (Rule) => Rule.uri({ scheme: ['https'] }).warning('Use uma URL https.'),
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'image' },
  },
});
