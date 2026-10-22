import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'subscriber',
  title: 'Assinante da newsletter',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'E-mail',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Ativo', value: 'active' },
          { title: 'Descadastrado', value: 'unsubscribed' },
          { title: 'E-mail inválido / bounce', value: 'bounced' },
        ],
        layout: 'radio',
      },
      initialValue: 'active',
    }),
    defineField({
      name: 'source',
      title: 'Origem do cadastro',
      type: 'string',
      description: 'Ex.: website_sidebar, artigo, alerta WhatsApp.',
    }),
    defineField({
      name: 'subscribedAt',
      title: 'Cadastrado em',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  orderings: [
    { title: 'Mais recentes', name: 'subscribedDesc', by: [{ field: 'subscribedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'email', subtitle: 'source', status: 'status', subscribedAt: 'subscribedAt' },
    prepare({ title, subtitle, status, subscribedAt }) {
      const date = subscribedAt ? new Date(subscribedAt).toLocaleDateString('pt-BR') : '';
      return {
        title: title || 'Assinante',
        subtitle: [status, subtitle, date].filter(Boolean).join(' • '),
      };
    },
  },
});
