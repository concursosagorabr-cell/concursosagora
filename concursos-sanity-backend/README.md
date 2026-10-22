# Concursos Agora — Backend Sanity

Studio e automações do CMS do portal **Concursos Agora**.
Projeto Sanity: `wobukj4j` • Dataset: `production`.

**Studio publicado:** <https://concursos-agora.sanity.studio/>

O frontend Next.js fica no repositório irmão `../concursosagora-main` e consome o mesmo dataset.

---

## 1. O que existe aqui

| Item | Descrição |
|---|---|
| `sanity.config.ts` | Configuração do Studio (estrutura, Vision, preview de URLs). |
| `schemas/documents/post.ts` | Matéria/concurso com todos os campos usados pelo frontend. |
| `schemas/documents/category.ts` | Categorias (áreas, UFs, regiões e situações). |
| `schemas/documents/author.ts` | Autores com bio e redes sociais. |
| `schemas/documents/imageLibrary.ts` | Banco de imagens usado pelo pipeline. |
| `schemas/documents/subscriber.ts` | Assinantes da newsletter. |
| `schemas/documents/siteSettings.ts` | Configurações gerais e SEO padrão. |
| `structure.ts` | Menu do Studio separado por status, conteúdo e configurações. |
| `scripts/` | Manutenção, normalização, backup, CORS e webhook. |
| `docs/scrapling-pipeline.md` | Análise de viabilidade e arquitetura do robô de coleta/redação com Scrapling. |

---

## 2. Instalação

```powershell
cd concursos-sanity-backend
npm install
Copy-Item .env.example .env.local
# preencha SANITY_API_TOKEN e SANITY_REVALIDATE_SECRET
npm run dev
```

O Studio local abre em `http://localhost:3333`.

---

## 3. Variáveis de ambiente

```env
SANITY_STUDIO_PROJECT_ID=wobukj4j
SANITY_STUDIO_DATASET=production
SANITY_API_TOKEN=sk...          # token com permissão de edição/escrita
SANITY_REVALIDATE_SECRET=...    # mesmo valor configurado na Vercel
FRONTEND_URL=https://www.concursosagora.com.br
```

> Nunca versione `.env.local`. O `.gitignore` já bloqueia o arquivo.

---

## 4. Scripts de manutenção

Todos usam `.env.local` e são **idempotentes** (podem ser executados novamente).

```powershell
# Simular sem gravar
$env:DRY_RUN='1'; npm run normalize:posts

# Corrigir categorias sem slug (ex.: "Concursos Abertos")
npm run fix:categories

# Preencher campos ausentes nas matérias (imagem, categoria, UF, salário...)
npm run normalize:posts

# Normalizar autores e URLs sociais
npm run patch:authors

# Criar configurações do site (não sobrescreve se já existir)
npm run seed:settings

# Backup completo do dataset em backups/*.ndjson
npm run export:dataset

# Criar/atualizar o webhook de revalidação do frontend
npm run setup:webhook

# Ajustar CORS (produção + localhost) para o Studio
npm run configure:cors
```

### O que `normalize:posts` preenche

- `slug`, `publishedAt` e `author` ausentes;
- `stateUf`, `sphere`, `organ` e `cityName` inferidos do texto/UF;
- `banca` ↔ `examBoard` e `vacanciesTotal` ↔ `vacancies`;
- `educationLevel` a partir de palavras-chave;
- `salaryMax` a partir de valores em reais no texto;
- `excerpt` a partir do primeiro parágrafo;
- `categories` quando a matéria estiver sem categoria;
- `mainImage` a partir da biblioteca de imagens (por UF ou Nacional);
- `alt` da imagem principal quando estiver vazio.

Nenhum campo já preenchido é sobrescrito.

---

## 5. Deploy do Studio

O Studio já está publicado em <https://concursos-agora.sanity.studio/>.
Para publicar uma nova versão:

```powershell
npm run schema:validate
npm run build

# Opção A: login interativo
npx sanity login          # conta concursosagorabr@gmail.com
npm run deploy -- --url concursos-agora --yes

# Opção B: token de automação (sem prompt)
$env:SANITY_AUTH_TOKEN='sk...'
npx sanity deploy --url concursos-agora --yes
```

O `sanity.cli.ts` já define o host `concursos-agora` e o `appId`
`cq0be3f2nj0xtai3m7ixz4ji`, então não é necessário criar o host novamente.
Depois do deploy, o Studio aparece no painel do projeto em **sanity.io/manage**.

> O token usado nos scripts também funciona para deploy e para a Management API
> neste projeto. Em produção, prefira um token dedicado com o menor escopo possível.

---

## 6. Webhook de revalidação (ISR)

O webhook **já está ativo** no projeto (`oikztPesccwjTtZ9`), com entregas
`200` verificadas após atualizações reais no dataset.
O frontend expõe `POST /api/revalidate` protegido por `SANITY_REVALIDATE_SECRET`.
O script `npm run setup:webhook` cria/atualiza o webhook com:

- **Filtro:** `_type in ["post","category","author"]`
- **Eventos:** create, update, delete
- **Destino:** `https://www.concursosagora.com.br/api/revalidate`
- **Corpo:** `{ tags: [...], paths: [...] }` (projeção GROQ)
- **Autenticação:** header `Authorization: Bearer <SANITY_REVALIDATE_SECRET>`
- **API do filtro/projeção:** `v2021-10-04`

Se precisar recriar, rode `npm run setup:webhook` (o script atualiza o existente
em vez de duplicar).

Teste manual do endpoint:

```powershell
$body = @{ tags = @('posts'); paths = @('/') } | ConvertTo-Json
Invoke-RestMethod -Method Post `
  -Uri 'https://www.concursosagora.com.br/api/revalidate' `
  -Headers @{ Authorization = "Bearer $env:SANITY_REVALIDATE_SECRET" } `
  -ContentType 'application/json' `
  -Body $body
```

---

## 7. Situação atual e pendências conhecidas

- **Studio:** publicado e schema validado (0 erros / 0 avisos).
- **Webhook:** ativo; tentativas reais retornaram HTTP 200.
- **Dataset:** 4 matérias, 63 categorias e 3 autores normalizados; backup em
  `backups/dataset-production-2026-10-20T07-13-33-468Z.ndjson`.
- **Frontend:** `npm run build` passou (216 páginas) e as rotas principais
  responderam 200 em teste local e em produção.
- **Brevo:** a chave `BREVO_API_KEY` não foi fornecida. Sem ela, o endpoint
  `/api/newsletter` grava o assinante no Sanity e retorna sucesso, mas não envia
  e-mail para a Brevo. O fluxo Sanity foi testado de ponta a ponta em produção.
- **Deploy do frontend:** o CLI da Vercel está sem token válido e não há
  `.vercel/project.json`; não foi possível publicar o frontend por aqui. As
  mudanças de canonical foram feitas e o build/testes passaram localmente; o
  deploy continua pendente. O site em produção já consome o dataset atualizado.
- **Conteúdo:** o dataset tem poucas matérias publicadas. O backend está pronto;
  a produção de novas pautas é o próximo passo do pipeline descrito em
  `docs/scrapling-pipeline.md`.
- **Duplicidade:** existem duas matérias quase idênticas sobre o INSS. Não foram
  apagadas para não destruir conteúdo editorial; o pipeline agora deduplica
  antes de criar novos rascunhos.
- **SEO:** o canonical foi padronizado em `https://www.concursosagora.com.br`
  nas páginas, sitemap, robots, feed e JSON-LD. Há teste de regressão em
  `src/utils/security.test.mjs`; o redirecionamento de `concursosagora.com.br`
  para `www` permanece no `vercel.json`.
- **Imagens:** a biblioteca tem 266 imagens ativas. O script de normalização usa
  as categorias `UF` e `Nacional`.
