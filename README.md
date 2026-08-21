# Frontend — Concursos Agora

Portal público de concursos públicos brasileiros, construído com **Next.js 15** (App Router) e **Tailwind CSS v4**.
Consome dados do [Sanity CMS](https://sanity.io) via queries GROQ em tempo real e oferece uma experiência moderna, responsiva e otimizada para SEO, LGPD e monitoramento de métricas.

---

## 🗂️ Estrutura do Projeto

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Layout raiz (GA4, Consent Mode v2, Speed Insights, Vercel Analytics, Header, Footer)
│   │   ├── page.tsx                # Home — Carrossel de destaques + grid de concursos paginados (10 em 10)
│   │   ├── globals.css             # Estilos globais + Tailwind CSS v4
│   │   ├── icon.png                # Ícone do aplicativo / Favicon (192x192)
│   │   ├── apple-icon.png          # Ícone Apple Touch (192x192)
│   │   ├── post/[slug]/            # Página do artigo completo
│   │   ├── categoria/[slug]/       # Página de categoria (com agrupamento por sinônimos e paginação 10 em 10)
│   │   ├── hub/                    # Index de Hubs de Conteúdo (Guias Pilares de SEO) 🎯
│   │   │   └── [slug]/             # Páginas Pilares (Pillar Pages) por área e municípios
│   │   ├── search/                 # Busca global por palavras-chave
│   │   ├── sitemap.ts              # Sitemap XML automático
│   │   └── api/
│   │       ├── categories/
│   │       │   └── resolve/
│   │       │       └── route.ts    # API de resolução de categorias ⚙️
│   │       └── newsletter/
│   │           └── route.ts        # API de captação de e-mails da Newsletter (Brevo) ✉️
│   ├── components/
│   │   ├── HeroCarousel.tsx        # Carrossel responsivo com auto-play (5s), swipe e controles manuais 🎠
│   │   ├── CookieBanner.tsx        # Banner e modal de consentimento de cookies (LGPD / Consent Mode v2) 🍪
│   │   ├── Newsletter.tsx          # Widget de inscrição em alertas de concursos com integração Brevo
│   │   ├── InArticleCTA.tsx        # Bloco "Leia Também" contextual inserido no artigo — reduz bounce rate 📌
│   │   ├── Header.tsx              # Cabeçalho com logo oficial otimizado, RegionBar + Navbar
│   │   ├── Navbar.tsx              # Menu desktop otimizado (Regiões, Estados, Carreiras, Guias de Concursos)
│   │   ├── MobileMenu.tsx          # Drawer mobile com seções filtradas e redes sociais
│   │   ├── RegionBar.tsx           # Atalhos diretos para as 27 UFs (/categoria/[slug])
│   │   ├── SearchBar.tsx           # Campo de busca rápida
│   │   ├── PostCard.tsx            # Card de concurso na listagem com categorias deduplicadas
│   │   ├── CategoryCard.tsx        # Card de link direto para a categoria
│   │   ├── Sidebar.tsx             # Barra lateral contextual: mostra posts da mesma categoria no artigo, ou posts recentes + newsletter na home
│   │   ├── RelatedPosts.tsx        # Grid de 3 matérias relacionadas no rodapé do artigo
│   │   ├── PostHubWidget.tsx       # Widget de linkagem interna bidirecional (Hub SEO)
│   │   ├── AuthorCard.tsx          # Card do autor no rodapé do artigo
│   │   ├── Footer.tsx              # Rodapé com logo oficial e links por região
│   │   ├── Pagination.tsx          # Paginação com botões numéricos e indicadores de matérias
│   │   └── PortableText.tsx        # Renderizador de Portable Text do Sanity
│   ├── lib/
│   │   ├── sanity.ts               # Cliente Sanity configurado
│   │   ├── queries.ts              # Queries GROQ otimizadas (incluindo relatedPostsQuery por categoria + fallback)
│   │   └── consent.ts              # Utilitários de cookies e sincronização com Google Consent Mode v2
│   ├── types/
│   │   └── index.ts                # Tipos TypeScript (Post, Category, Author, Consent)
│   └── utils/
│       ├── status.ts               # Cálculo dinâmico de status do concurso (Aberto/Encerrado)
│       ├── categories.ts           # Deduplicação, filtro de puras e mapeamento de sinônimos/aliases 🧩
│       └── hubs.ts                 # Definição e configuração dos Hubs de Conteúdo (Silos SEO)
├── vercel.json                     # Configuração de deploy da Vercel (região gru1 - São Paulo)
├── .env.example                    # Modelo de variáveis de ambiente
└── package.json
```

---

## 🚀 Funcionalidades e Melhorias Recentes

### 📌 1. Redução de Bounce Rate — Sprint de Agosto/2026

Conjunto de melhorias implementadas com base na análise do Vercel Analytics (557 visitantes, 81% bounce rate):

- **`InArticleCTA.tsx` (novo)**: Bloco "📌 Veja também: Mais sobre [Categoria]" exibido logo após o conteúdo do artigo, com cards visuais dos posts relacionados. Mantém o leitor no site após terminar de ler.
- **`relatedPostsQuery` por categoria**: A query de posts relacionados agora filtra pela **mesma categoria** do post atual, com `relatedPostsFallbackQuery` de complemento caso não haja 3 posts suficientes. Antes, retornava apenas os 3 mais recentes sem relevância.
- **Sidebar contextual**: Na página de artigo, a Sidebar exibe **"📌 Mais sobre [Categoria]"** com os posts relacionados da mesma área. Na home/categoria, continua exibindo "Últimas Notícias".
- **⏱️ Tempo estimado de leitura**: Calculado dinamicamente (aprox. 200 palavras/min) e exibido no cabeçalho do post.
- **📘 Botão de compartilhamento no Facebook**: Adicionado ao lado do WhatsApp e X/Twitter no cabeçalho do artigo.
- **🔍 Meta tags para Google Discover**: `keywords` com categorias do post, `modifiedTime` e `tags` OG (`article:tag`) para aumentar chances de aparecer no feed do Google Discover.
- **Placeholder WhatsApp/Telegram**: Comentário estruturado no `post/[slug]/page.tsx` para ativar o banner de captura assim que os grupos forem criados.

### 🧩 2. Resolução e Unificação de Sinônimos de Categorias (`getCategoryAliases`)
- **Agrupamento Automático**: Unifica slugs/títulos equivalentes vindo do Sanity CMS (ex: `financas`, `bancaro-financas`, `bancaria-e-financeira` ou `administracao` / `administrativa`).
- **Zero Notícias Isoladas**: Garantia de que ao acessar qualquer variação no menu ou link, todas as matérias daquela área temática sejam carregadas juntas.

### 🧹 3. Menu Consolidado e Filtragem de Categorias Puras (`getPureCategories`)
- **Eliminação de Redundâncias**: Remoção de siglas de UF (AC, AL, SP...) e regiões dos menus gerais de categorias, pois já possuem dropdowns dedicados em **Estados** e **Regiões**.
- **Nomenclatura Amigável**: Substituição do termo técnico *"Hubs SEO"* por **"Guias de Concursos"** para melhor usabilidade dos leitores.
- **Estrutura Limpa**: Menu organizado em: `Início`, `🟢 Abertas`, `Previstos`, `Regiões`, `Estados`, `Carreiras` (com todas as áreas do Sanity) e `Guias de Concursos`.

### 📄 4. Paginação de 10 em 10 Matérias (`Pagination.tsx`)
- Suporte a navegação por páginas numéricas (`1`, `2`, `3`...), botões `Anterior`/`Próxima` e contador *"Exibindo X–Y de Z matérias"* tanto na Home Page quanto nas páginas de Categoria.

### 🎠 5. Carrossel Hero Responsivo (`HeroCarousel.tsx`)
- Exibe as **4 matérias mais recentes** na primeira página da Home.
- **Auto-rotation** de 5 segundos gerenciado por temporizador que pausa e reinicia ao interagir.
- **Suporte a Gestos em Dispositivos Móveis**: Navegação fluida via swipe horizontal no celular (`onTouchStart`/`onTouchEnd`).

### 🍪 6. Conformidade LGPD & Google Consent Mode v2 (`CookieBanner.tsx` e `consent.ts`)
- Sistema de consentimento de cookies em conformidade com a **Lei Geral de Proteção de Dados (Lei nº 13.709/2018)**.
- **Integração Nível 2 com Google Consent Mode v2**: Inicia com todos os consentimentos bloqueados (`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization` como `denied`) antes de carregar scripts de rastreamento.

### ✉️ 7. Captação de E-mails via Brevo (`/api/newsletter`)
- Integração server-side com a API REST v3 da **Brevo** (Sendinblue).
- **Segurança da Chave**: A `BREVO_API_KEY` (`xkeysib-...`) é mantida estritamente no servidor.
- **Proteção contra Abuso (Rate Limiting)**: Limite de 3 submissões por minuto por IP e filtro de domínios descartáveis.

### 🎯 8. Hubs de Conteúdo & Silos de SEO (`/hub` e `/hub/[slug]`)
- **Páginas Pilares (Pillar Pages)**: Organização em silos de SEO para aumentar tempo de permanência e autoridade global no Google.
- **7 Hubs Estruturados**: Municipais & Prefeituras, Carreiras Policiais, Tribunais & Judiciário, Bancários & Finanças, Fiscais & Controle, Saúde & SUS, Educação & Docência.
- **Schema.org**: `CollectionPage` + `BreadcrumbList` em todas as páginas pilares.

---

## 📄 Rotas e Endpoints

| Rota | Tipo | Descrição |
|---|---|---|
| `/` | Dynamic (SSR) | Home com Carrossel de Destaques e feed paginado (10 em 10) |
| `/post/[slug]` | SSG + Revalidação 60s | Matéria completa do concurso |
| `/categoria/[slug]` | SSG + Paginação | Listagem de concursos por categoria (com resolvedor de sinônimos) |
| `/hub` | SSG | Index de Hubs de Conteúdo (Guias Pilares) |
| `/hub/[slug]` | SSG | Guia Pilar definitivo por área/setor |
| `/search?q=termo` | Dynamic | Busca global por título, conteúdo ou categoria |
| `/sitemap.xml` | Static | Sitemap XML dinâmico |
| `/api/categories/resolve` | API Route | Endpoint para o robô Python consultar categorias |
| `/api/newsletter` | API Route (POST) | Endpoint seguro para cadastro de leitores na Brevo |

---

## ⚙️ Variáveis de Ambiente

Crie o arquivo `frontend/.env.local` (ou configure no painel da Vercel):

```env
# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=mcc3s7d2
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-07-25
SANITY_API_TOKEN=skESugwi5EBz6Wh...

# Google Analytics 4
NEXT_PUBLIC_GA_ID=G-YX2KZMH82Y

# Brevo (Newsletter & Alertas)
BREVO_API_KEY=xkeysib-577df478ea259...
```

---

## 🛠️ Comandos de Desenvolvimento

```powershell
# Instalar dependências
npm install

# Iniciar servidor local
npm run dev

# Checar tipos TypeScript (não requer conexão com Google Fonts)
npx tsc --noEmit

# Build de produção (requer acesso à internet para download de fontes)
npm run build

# Executar build de produção
npm run start
```
