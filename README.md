# Frontend — Concursos Agora

Portal público de concursos públicos brasileiros, construído com **Next.js 15** (App Router) e **Tailwind CSS v4**.
Consome dados do [Sanity CMS](https://sanity.io) via queries GROQ em tempo real e oferece uma experiência moderna, responsiva e otimizada para SEO.

---

## 🗂️ Estrutura do Projeto

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Layout raiz com Header/Footer
│   │   ├── page.tsx                # Home — lista de concursos
│   │   ├── globals.css             # Estilos globais + Tailwind
│   │   ├── post/[slug]/            # Página do artigo
│   │   ├── categoria/[slug]/       # Página de categoria
│   │   ├── search/                 # Busca global
│   │   ├── sitemap.ts              # Sitemap XML automático
│   │   └── api/
│   │       └── categories/
│   │           └── resolve/
│   │               └── route.ts   # API de resolução de categorias ⚙️
│   ├── components/
│   │   ├── Header.tsx              # Cabeçalho com logo oficial, RegionBar + Navbar
│   │   ├── Navbar.tsx              # Menu desktop com dropdowns (Regiões, Estados, Carreiras, Categorias)
│   │   ├── MobileMenu.tsx          # Drawer mobile com 27 UFs e seções colapsáveis
│   │   ├── RegionBar.tsx           # Atalhos diretos para as 27 UFs (/categoria/[slug])
│   │   ├── SearchBar.tsx           # Campo de busca rápida
│   │   ├── PostCard.tsx            # Card de concurso na listagem
│   │   ├── CategoryCard.tsx        # Card de link direto para a categoria
│   │   ├── Sidebar.tsx             # Barra lateral com posts recentes/categorias
│   │   ├── Footer.tsx              # Rodapé com logo oficial e links por região
│   │   ├── Pagination.tsx          # Paginação de listagens
│   │   ├── PortableText.tsx        # Renderizador de Portable Text do Sanity
│   │   └── ...
│   ├── lib/
│   │   ├── sanity.ts               # Cliente Sanity configurado
│   │   └── queries.ts              # Todas as queries GROQ do projeto
│   ├── types/
│   │   └── index.ts                # Tipos TypeScript (Post, Category, Author)
│   └── utils/
│       ├── status.ts               # Cálculo de status do concurso (Aberto/Encerrado)
│       └── categories.ts           # Deduplicação de categorias
├── .env.local                      # Variáveis de ambiente (não commitado)
└── package.json
```

---

## 🔗 Como Este Módulo Interage com os Outros

```
Sanity CMS (mcc3s7d2 / production)
    │
    │  GROQ Queries via @sanity/client
    ▼
Frontend Next.js (este módulo)
    │
    │  POST /api/categories/resolve
    ▼
Backend Python (mcp wordpress/) — usa a API para resolver categorias antes de publicar
```

---

## 📄 Páginas e Rotas

| Rota | Tipo | Descrição |
|---|---|---|
| `/` | Dynamic (SSR) | Home — lista paginada de concursos ordenados por data |
| `/post/[slug]` | SSG + revalidação 60s | Artigo completo do concurso |
| `/categoria/[slug]` | SSG | Listagem paginada de posts por categoria |
| `/search?q=termo` | Dynamic | Busca global por título, conteúdo ou categoria |
| `/sitemap.xml` | Static | Sitemap automático de todos os posts e categorias |
| `/api/categories/resolve` | API Route | Resolução inteligente de categorias (GET/POST) |

---

## ⚙️ API Route — `/api/categories/resolve`

Endpoint usado pelo Backend Python para verificar categorias existentes antes de criar artigos, evitando duplicatas.

### `GET /api/categories/resolve`
Retorna todas as categorias com contagem de posts.

```json
{
  "categories": [
    { "_id": "abc", "title": "Saúde", "slug": "saude", "postCount": 12 }
  ],
  "total": 14
}
```

### `POST /api/categories/resolve`
Recebe título e conteúdo do artigo e retorna categorias compatíveis.

**Request:**
```json
{
  "title": "Concurso SEFAZ-RJ 2025 para Auditor Fiscal",
  "content": "O governo do Rio de Janeiro abriu edital...",
  "maxSuggestions": 3
}
```

**Response:**
```json
{
  "matched": [
    { "_id": "abc", "title": "Fiscal & Contábil", "slug": "fiscal-contabil", "score": 0.85, "postCount": 12 }
  ],
  "suggested": [
    { "title": "Rio de Janeiro", "slug": "rio-de-janeiro", "reason": "Estado detectado no texto" }
  ],
  "total_categories_in_sanity": 14
}
```

A lógica de matching usa similaridade semântica (Jaccard + substring) com threshold de 20% para `matched`. Só sugere novas categorias se nenhuma existente tiver score ≥ 70%.

---

## 🎯 Lógica de Status dos Concursos

O status (**Concurso Aberto** / **Concurso Encerrado**) é calculado dinamicamente via GROQ no servidor, sem precisar alterar documentos no Sanity. A prioridade é:

```
1. enrollmentEndDate preenchida? → usa essa data
        ↓ não
2. examDate preenchida?          → usa essa data
        ↓ não
3. Fallback: publishedAt + 12 meses
```

O campo GROQ `isExpired` e `statusLabel` são calculados na query e usados nos componentes:

```groq
"isExpired": select(
  defined(coalesce(enrollmentEndDate, examDate)) =>
    dateTime(coalesce(enrollmentEndDate, examDate)) < dateTime(now()),
  (dateTime(coalesce(publishedAt, _createdAt)) + 31536000) < dateTime(now())
),
"statusLabel": select(
  ... => "Concurso Encerrado",
  "Concurso Aberto"
)
```

---

## 🧭 Navegação

### Desktop
- **RegionBar** — barra preta no topo com atalhos por estado (SP, RJ, MG...) e região (Sudeste, Sul...)
- **Navbar** — menu horizontal com dropdowns de Regiões, Carreiras e Categorias do Sanity
- **SearchBar** — campo de busca com submit

### Mobile
- **MobileMenu** — drawer lateral com animação slide, seções colapsáveis (Status, Carreiras, Regiões, Categorias) e busca integrada
- Ícone hambúrguer e ícone de lupa no header abrem o drawer

---

## 🚀 Como Iniciar

### Pré-requisitos
- Node.js 18+
- Acesso ao Sanity CMS (Project ID `mcc3s7d2`)

### Instalação

```powershell
cd frontend
npm install
```

### Configurar variáveis de ambiente

Crie o arquivo `frontend/.env.local`:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=mcc3s7d2
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-07-25
SANITY_API_TOKEN=skESugwi5EBz6Wh...    # Token com permissão de leitura (para API Route)
```

### Executar em desenvolvimento

```powershell
npm run dev
```

Acesse: **[http://localhost:3000](http://localhost:3000)**

### Build de produção

```powershell
npm run build
npm run start
```

---

## 📦 Dependências Principais

| Pacote | Versão | Uso |
|---|---|---|
| `next` | ^15.2 | Framework React com App Router |
| `@sanity/client` | ^7.25 | Cliente GROQ para Sanity |
| `@sanity/image-url` | ^2.1 | URLs otimizadas de imagens do Sanity |
| `@portabletext/react` | ^7.0 | Renderização de Portable Text |
| `tailwindcss` | ^4 | Utilitários CSS |

---

## 🔧 Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | ✅ | ID do projeto Sanity |
| `NEXT_PUBLIC_SANITY_DATASET` | ✅ | Dataset (`production`) |
| `NEXT_PUBLIC_SANITY_API_VERSION` | ✅ | Versão da API Sanity |
| `SANITY_API_TOKEN` | ⚠️ Recomendado | Token para a API Route `/api/categories/resolve` |

> **Nota:** As variáveis `NEXT_PUBLIC_*` são expostas ao cliente (browser). O `SANITY_API_TOKEN` é usado apenas no servidor (API Route).
