/**
 * Utilitários de consentimento de cookies — LGPD (Lei nº 13.709/2018)
 * Gerencia leitura, escrita e sincronização com Google Consent Mode v2.
 */

export interface ConsentChoices {
  analytics: boolean; // Google Analytics, Speed Insights
  marketing: boolean; // Publicidade personalizada (futuro)
}

const COOKIE_NAME = 'ca_consent';
const COOKIE_DAYS = 365;

/** Lê as escolhas salvas no cookie de consentimento. Retorna null se ainda não houve escolha. */
export function getConsentCookie(): ConsentChoices | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)'),
  );
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

/** Persiste as escolhas do usuário por 1 ano. */
export function setConsentCookie(choices: ConsentChoices): void {
  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_DAYS);
  document.cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(choices))}`,
    `expires=${expires.toUTCString()}`,
    'path=/',
    'SameSite=Lax',
    'Secure',
  ].join('; ');
}

/**
 * Atualiza o Google Consent Mode v2 com as escolhas do usuário.
 * Deve ser chamado após o usuário fazer ou restaurar uma escolha.
 */
export function updateGtagConsent(choices: ConsentChoices): void {
  if (typeof window === 'undefined') return;
  const fn = (window as unknown as Record<string, unknown>).gtag as (
    ...args: unknown[]
  ) => void;
  if (typeof fn !== 'function') return;
  fn('consent', 'update', {
    analytics_storage: choices.analytics ? 'granted' : 'denied',
    ad_storage: choices.marketing ? 'granted' : 'denied',
    ad_user_data: choices.marketing ? 'granted' : 'denied',
    ad_personalization: choices.marketing ? 'granted' : 'denied',
    functionality_storage: 'granted',
    personalization_storage: choices.marketing ? 'granted' : 'denied',
    security_storage: 'granted',
  });
}
