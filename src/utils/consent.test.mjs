import test from 'node:test';
import assert from 'node:assert/strict';
import { getConsentCookie, setConsentCookie } from '../lib/consent.ts';

test('getConsentCookie retorna null quando document.cookie está vazio', () => {
  global.document = { cookie: '' };
  assert.equal(getConsentCookie(), null);
});

test('setConsentCookie salva escolhas e getConsentCookie lê corretamente', () => {
  let simulatedCookie = '';
  global.document = {
    get cookie() {
      return simulatedCookie;
    },
    set cookie(val) {
      simulatedCookie = val.split(';')[0];
    },
  };

  setConsentCookie({ analytics: true, marketing: false });
  const consent = getConsentCookie();
  assert.deepEqual(consent, { analytics: true, marketing: false });
});

test('getConsentCookie retorna null para JSON inválido no cookie', () => {
  global.document = { cookie: 'ca_consent=invalido' };
  assert.equal(getConsentCookie(), null);
});
