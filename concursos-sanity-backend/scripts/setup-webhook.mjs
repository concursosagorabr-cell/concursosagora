/**
 * Cria/atualiza o webhook do Sanity que invalida o cache ISR do frontend
 * sempre que uma matéria, categoria ou autor for alterado.
 *
 * Uso: npm run setup:webhook
 */
import { projectId, dataset, requireToken } from './lib.mjs';

const token = requireToken();
const frontendUrl = (process.env.FRONTEND_URL || 'https://www.concursosagora.com.br').replace(/\/$/, '');
const secret = process.env.SANITY_REVALIDATE_SECRET;

if (!secret) {
  throw new Error('SANITY_REVALIDATE_SECRET não configurado em .env.local.');
}

const HOOK_NAME = 'Revalidar frontend (Concursos Agora)';
const API = `https://api.sanity.io/v2025-02-19/hooks/projects/${projectId}`;

const projection = `{
  "tags": ["posts", "categories", "sitemap"],
  "paths": select(
    _type == "post" => ["/", "/noticias", "/concursos", "/post/" + coalesce(slug.current, _id)],
    _type == "category" => ["/", "/noticias", "/concursos", "/categoria/" + coalesce(slug.current, _id)],
    ["/"]
  )
}`;

const rule = {
  on: ['create', 'update', 'delete'],
  filter: '_type in ["post", "category", "author"]',
  projection,
};

const payload = {
  type: 'document',
  name: HOOK_NAME,
  url: `${frontendUrl}/api/revalidate`,
  dataset,
  description: 'Invalida o cache ISR de matérias, categorias e autores.',
  rule,
  // Estes campos ficam no nível raiz na API de webhooks (não dentro de rule).
  apiVersion: 'v2021-10-04',
  httpMethod: 'POST',
  includeDrafts: false,
  headers: {
    Authorization: `Bearer ${secret}`,
  },
};

async function request(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
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

const list = await request(API, { method: 'GET' });
if (!list.response.ok) {
  throw new Error(`Falha ao listar webhooks (HTTP ${list.response.status}): ${JSON.stringify(list.body)}`);
}

const hooks = Array.isArray(list.body) ? list.body : [];
const existing = hooks.find((hook) => hook.name === HOOK_NAME);

if (existing) {
  // O endpoint PATCH não aceita o campo "type"; os demais campos são atualizáveis.
  const { type: _type, ...updatePayload } = payload;
  const { response, body } = await request(`${API}/${existing.id}`, {
    method: 'PATCH',
    body: JSON.stringify(updatePayload),
  });
  if (!response.ok) {
    throw new Error(`Falha ao atualizar webhook (HTTP ${response.status}): ${JSON.stringify(body)}`);
  }
  console.log(`Webhook atualizado: ${existing.id} -> ${payload.url}`);
} else {
  const { response, body } = await request(API, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Falha ao criar webhook (HTTP ${response.status}): ${JSON.stringify(body)}`);
  }
  console.log(`Webhook criado: ${body?.id || '(sem id)'} -> ${payload.url}`);
}

console.log('Filtro:', rule.filter);
console.log('Eventos: create, update, delete');
