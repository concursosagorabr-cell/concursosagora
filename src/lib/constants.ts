// FIX: Padronização canônica de domínio com www - 2026-09-06
export const SITE_URL = 'https://www.concursosagora.com.br';
export const SITE_NAME = 'Concursos Agora';

export const SITE_CONFIG = {
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: 'O portal definitivo de notícias sobre concursos públicos no Brasil.',
} as const;

export const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    label: 'Instagram (@concursosagora_)',
    href: 'https://www.instagram.com/concursosagora_/',
    icon: 'instagram' as const,
  },
  {
    name: 'Facebook',
    label: 'Facebook Oficial',
    href: 'https://www.facebook.com/profile.php?id=61592443961535',
    icon: 'facebook' as const,
  },
  {
    name: 'X',
    label: 'X (@ConcursosAgora1)',
    href: 'https://x.com/ConcursosAgora1',
    icon: 'x' as const,
  },
  {
    name: 'Threads',
    label: 'Threads',
    href: 'https://www.threads.com/@concursosagorabr?hl=pt-br',
    icon: 'threads' as const,
  },
  {
    name: 'Telegram',
    label: 'Telegram VIP (@concursosagorabr)',
    href: 'https://t.me/concursosagorabr',
    icon: 'telegram' as const,
  },
  {
    name: 'YouTube',
    label: 'YouTube (@ConcursosAgora)',
    href: 'https://www.youtube.com/@ConcursosAgora',
    icon: 'youtube' as const,
  },
] as const;

export type SocialIconType = typeof SOCIAL_LINKS[number]['icon'];

export const Z_INDEX = {
  header: 50,
  mobileMenu: 100,
  cookieBannerFloat: 150,
  cookieBanner: 200,
  cookieModal: 300,
} as const;
