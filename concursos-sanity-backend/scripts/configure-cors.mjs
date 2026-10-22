/**
 * Ajusta as origens CORS do projeto Sanity.
 * - Habilita credenciais nos domínios de produção (necessário para Studio embarcado).
 * - Garante as origens locais usadas no desenvolvimento.
 *
 * Uso: npm run configure:cors
 */
import { projectId, requireToken } from './lib.mjs';

const token = requireToken();
const API = `https://api.sanity.io/v2021-06-07/projects/${projectId}/cors`;

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
}

const list = await request(API);
if (!list.response.ok) {
  throw new Error(`Falha ao listar CORS (HTTP ${list.response.status}): ${JSON.stringify(list.body)}`);
}

const existing = Array.isArray(list.body) ? list.body : [];
const desired = [
  { origin: 'https://www.concursosagora.com.br', allowCredentials: true },
  { origin: 'https://concursosagora.com.br', allowCredentials: true },
  { origin: 'http://localhost:3333', allowCredentials: true },
  { origin: 'http://localhost:3000', allowCredentials: true },
];

for (const item of desired) {
  const found = existing.find((cors) => cors.origin === item.origin);
  if (found) {
    if (found.allowCredentials !== item.allowCredentials) {
      // A API não suporta PATCH em CORS: remove e recria com a configuração desejada.
      const removed = await request(`${API}/${found.id}`, { method: 'DELETE' });
      if (!removed.response.ok) {
        console.warn(`  ! ${item.origin}: falha ao remover (HTTP ${removed.response.status})`);
        continue;
      }
      const { response, body } = await request(API, {
        method: 'POST',
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        console.warn(`  ! ${item.origin}: HTTP ${response.status} ${JSON.stringify(body)}`);
      } else {
        console.log(`Recriado: ${item.origin} (credentials=${item.allowCredentials})`);
      }
    } else {
      console.log(`OK: ${item.origin}`);
    }
    continue;
  }

  const { response, body } = await request(API, {
    method: 'POST',
    body: JSON.stringify(item),
  });
  if (!response.ok) {
    console.warn(`  ! ${item.origin}: HTTP ${response.status} ${JSON.stringify(body)}`);
  } else {
    console.log(`Criado: ${item.origin}`);
  }
}
