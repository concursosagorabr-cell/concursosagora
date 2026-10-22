import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'siteSettings',
  title: 'Configurações do site',
  type: 'document',
  fields: [
    defineField({
      name: 'siteTitle',
      title: 'Nome do site',
      type: 'string',
      initialValue: 'Concursos Agora',
    }),
    defineField({
      name: 'siteDescription',
      title: 'Descrição',
      type: 'text',
      rows: 3,
      initialValue:
        'Notícias em tempo real sobre concursos públicos no Brasil, editais abertos, inscrições, materiais de estudo e dicas para sua aprovação.',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: false },
    }),
    defineField({
      name: 'contactEmail',
      title: 'E-mail de contato',
      type: 'string',
      initialValue: 'concursosagorabr@gmail.com',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'whatsappUrl',
      title: 'Link do grupo/canal no WhatsApp',
      type: 'url',
    }),
    defineField({
      name: 'telegramUrl',
      title: 'Link do canal no Telegram',
      type: 'url',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Redes sociais',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'socialLink',
          fields: [
            defineField({
              name: 'platform',
              title: 'Plataforma',
              type: 'string',
              options: {
                list: ['Instagram', 'Facebook', 'X / Twitter', 'YouTube', 'LinkedIn', 'TikTok'],
              },
            }),
            defineField({ name: 'url', title: 'URL', type: 'url' }),
          ],
          preview: {
            select: { title: 'platform', subtitle: 'url' },
          },
        },
      ],
    }),
    defineField({
      name: 'adsenseClientId',
      title: 'ID do Google AdSense',
      type: 'string',
      description: 'Formato: ca-pub-0000000000000000.',
    }),
    defineField({
      name: 'defaultSeo',
      title: 'SEO padrão',
      type: 'seo',
    }),
  ],
  preview: {
    select: { title: 'siteTitle' },
  },
});
