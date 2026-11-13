# Cache, ISR e revalidação (Sanity → frontend)

Este documento descreve como o portal mantém home, listagens, categorias e hubs
sempre atualizados depois de uma publicação/edição no Sanity.

## 1. Como o cache está organizado

| Camada | O que guarda | Como expira |
|---|---|---|
| **Render da rota** | `/post/[slug]` (60 s), `/concursos` (180 s), `/categoria/[slug]`, `/hub/[slug]` (60 s), `/concursos-abertos/[uf]`, `/banca/[slug]` (300 s) | `export const revalidate` ou `revalidatePath` |
| **Data Cache** (`unstable_cache` em `src/lib/sanity.ts`) | consultas GROQ (posts, contagem, categorias, sitemap, feed...) | TTL próprio (180–3600 s) via `revalidate` **ou** `revalidateTag` |
| **Home** | renderizada a cada request (`dynamic = 'force-dynamic'`) | sempre fresca, desde que o Data Cache esteja limpo |
| **Data do topo** | `RegionBar` | renderizada **somente no cliente**, após a montagem |

Regra de ouro: publicar no Sanity não pode depender do TTL. O webhook precisa
disparar `revalidateTag` **e** `revalidatePath` imediatamente.

## 2. Endpoint `POST /api/revalidate`

Arquivo: `src/app/api/revalidate/route.ts`.

Autenticação (qualquer uma das opções):

- `Authorization: Bearer $SANITY_REVALIDATE_SECRET`
- `x-revalidate-secret: $SANITY_REVALIDATE_SECRET`
- assinatura `sanity-webhook-signature` (HMAC-SHA256 com o mesmo segredo)
- `{"secret": "..."}` no corpo JSON (compatibilidade)

Nunca envie o segredo em query string.

### Formato A — documento do Sanity (recomendado)

```json
{
  "_id": "concurso-guarda-de-campinas-sp-2026",
  "_type": "post",
  "title": "Concurso Guarda de Campinas: 100 vagas...",
  "slug": "concurso-guarda-de-campinas-sp-2026",
  "stateUf": "SP",
  "banca": "Vunesp",
  "educationLevel": ["medio"],
  "authorSlug": "amanda-nunes",
  "categories": [{ "slug": "sp", "title": "SP" }]
}
```

O endpoint calcula as tags e rotas afetadas:

- sempre: `posts`, `recent-posts`, `top-posts`, `directory-posts`,
  `high-salary-posts`, `sitemap`, `sitemap-news`, `feed` e as rotas
  `/`, `/noticias`, `/concursos`, `/hub`, `/concursos/salario-acima-de-10-mil`,
  `/sitemap.xml`, `/news-sitemap.xml`, `/feed.xml`;
- do documento: `/post/<slug>`, `post:<slug>`, `/categoria/<slug>` + aliases,
  `/hub/<slug>` (quando o título/categorias casam com um hub),
  `/categoria/<uf>`, `/concursos-abertos/<uf>`, `/concursos/<nivel>/<uf>`,
  `/banca/<slug>` e `/autor/<slug>`;
- documentos `category`/`author`: tags `categories`, `category:<slug>`,
  `authors`, `author:<slug>`.

O documento é reconsultado no Sanity (`useCdn: false`) para resolver referências
de categoria/autor antes de montar o plano.

### Formato B — tags/paths explícitos (pipeline Python)

```json
{ "tags": ["posts"], "paths": ["/", "/noticias", "/post/<slug>"] }
```

Sem `tags`/`paths`, o endpoint aplica o pacote completo de listagens.

## 3. Webhook do Sanity (produção)

O script `concursos-sanity-backend/scripts/setup-webhook.mjs` cria/atualiza o
webhook via API de Hooks do Sanity.

Pré-requisitos em `concursos-sanity-backend/.env.local`:

```env
SANITY_API_TOKEN=sk...            # token com permissão de administrar hooks
SANITY_REVALIDATE_SECRET=...      # MESMO valor configurado na Vercel
FRONTEND_URL=https://www.concursosagora.com.br
```

Aplicar:

```powershell
cd concursos-sanity-backend
npm run setup:webhook:dry   # confere o payload (segredos são ocultados)
npm run setup:webhook
```

Configuração resultante:

- URL: `https://www.concursosagora.com.br/api/revalidate`
- Dataset: `production`
- Eventos: `create`, `update`, `delete`
- Filtro: `_type in ["post", "category", "author"]`
- Projeção: documento com `_id`, `_type`, `title`, `slug`, `stateUf`,
  `banca`, `educationLevel`, `authorSlug` e `categories[]{slug,title}`
- Header: `Authorization: Bearer $SANITY_REVALIDATE_SECRET`
- `includeDrafts: false`

> Se o segredo for rotacionado na Vercel, rode `npm run setup:webhook`
> novamente. Webhook com segredo antigo devolve 401 e o site fica preso no
> snapshot anterior.

## 4. Verificação rápida

```powershell
# 1. O endpoint está autenticando?
curl.exe -i -X POST https://www.concursosagora.com.br/api/revalidate `
  -H "Authorization: Bearer $env:SANITY_REVALIDATE_SECRET" `
  -H "Content-Type: application/json" `
  -d '{\"paths\":[\"/noticias\"]}'

# 2. Apex redireciona para www com 308?
curl.exe -I https://concursosagora.com.br/

# 3. Home responde sem cache de página e com a data de hoje?
curl.exe -s https://www.concursosagora.com.br/ | Select-String "Plantão de Editais"
```

Se o `POST` retornar 200, mas a home continuar antiga, verifique nesta ordem:

1. `SANITY_REVALIDATE_SECRET` está definido na Vercel (Production **e** Preview)?
2. O valor é idêntico ao usado no webhook (`npm run setup:webhook`)?
3. O domínio acessado é `www.concursosagora.com.br` (apex é 308)?
4. Os logs do webhook no Sanity mostram entrega 2xx?
5. Algum proxy/CDN externo está cacheando HTML? O Next responde
   `Cache-Control: private, no-cache, no-store` na home dinâmica.

## 5. Data do topo ("Plantão de Editais")

`src/components/RegionBar.tsx` calcula a data em `useEffect`, depois da
hidratação, no fuso `America/Sao_Paulo`. O HTML cacheado não contém mais uma
data fixa, então uma página antiga no cache nunca mostra "ontem" no cabeçalho.
O contador de matérias (`X matérias publicadas`) continua vindo do Sanity e é
atualizado pelas tags de cache.
