import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'codeBlock',
  title: 'Bloco de código',
  type: 'object',
  fields: [
    defineField({
      name: 'language',
      title: 'Linguagem',
      type: 'string',
      initialValue: 'text',
      options: {
        list: ['text', 'javascript', 'typescript', 'json', 'bash', 'python', 'html', 'css', 'sql'],
      },
    }),
    defineField({
      name: 'code',
      title: 'Código',
      type: 'text',
      rows: 8,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: 'language', subtitle: 'code' },
    prepare({ title, subtitle }) {
      return { title: `Código (${title || 'text'})`, subtitle: String(subtitle || '').slice(0, 80) };
    },
  },
});
