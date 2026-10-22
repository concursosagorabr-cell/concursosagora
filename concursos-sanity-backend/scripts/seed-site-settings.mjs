/**
 * Cria o documento singleton de configurações do site, se ainda não existir.
 * Uso: npm run seed:settings
 */
import { client, isDryRun, requireToken } from './lib.mjs';

requireToken();

const existing = await client.fetch(`*[_id == "siteSettings"][0]._id`);

if (existing) {
  console.log('siteSettings já existe; nada foi sobrescrito.');
  process.exit(0);
}

const doc = {
  _id: 'siteSettings',
  _type: 'siteSettings',
  siteTitle: 'Concursos Agora',
  siteDescription:
    'Notícias em tempo real sobre concursos públicos no Brasil, editais abertos, inscrições, materiais de estudo e dicas para sua aprovação.',
  contactEmail: 'concursosagorabr@gmail.com',
  telegramUrl: 'https://t.me/concursosagorabr',
  socialLinks: [
    { _key: 'instagram', platform: 'Instagram', url: 'https://www.instagram.com/concursosagora_/' },
    { _key: 'facebook', platform: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61592443961535' },
    { _key: 'x', platform: 'X / Twitter', url: 'https://x.com/ConcursosAgora1' },
    { _key: 'youtube', platform: 'YouTube', url: 'https://www.youtube.com/@ConcursosAgora' },
  ],
  defaultSeo: {
    metaTitle: 'Concursos Agora — Portal de Notícias e Editais de Concursos Públicos',
    metaDescription:
      'Notícias em tempo real sobre concursos públicos no Brasil, editais abertos, inscrições, materiais de estudo e dicas para sua aprovação.',
    noIndex: false,
  },
};

if (isDryRun) {
  console.log('DRY RUN: siteSettings seria criado.');
} else {
  await client.createIfNotExists(doc);
  console.log('siteSettings criado com sucesso.');
}
