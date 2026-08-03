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
│   │   ├── page.tsx                # Home — Carrossel de destaques + grid de concursos paginados
│   │   ├── globals.css             # Estilos globais + Tailwind CSS v4
│   │   ├── icon.png                # Ícone do aplicativo / Favicon (192x192)
│   │   ├── apple-icon.png          # Ícone Apple Touch (192x192)
│   │   ├── post/[slug]/            # Página do artigo completo
│   │   ├── categoria/[slug]/       # Página de categoria
│   │   ├── hub/                    # Index de Hubs de Conteúdo (Silos de SEO) 🎯
│   │   │   └── [slug]/             # Páginas Pilares (Pillar Pages) por área e municípios
│   │   ├── search/                 # Busca global
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
│   │   ├── Header.tsx              # Cabeçalho com logo oficial otimizado, RegionBar + Navbar
│   │   ├── Navbar.tsx              # Menu desktop com dropdowns (Regiões, Estados, Carreiras, Categorias)
│   │   ├── MobileMenu.tsx          # Drawer mobile com 27 UFs e seções colapsáveis
│   │   ├── RegionBar.tsx           # Atalhos diretos para as 27 UFs (/categoria/[slug])
│   │   ├── SearchBar.tsx           # Campo de busca rápida
│   │   ├── PostCard.tsx            # Card de concurso na listagem
│   │   ├── CategoryCard.tsx        # Card de link direto para a categoria
│   │   ├── Sidebar.tsx             # Barra lateral com posts recentes/categorias/newsletter
│   │   ├── Footer.tsx              # Rodapé com logo oficial e links por região
│   │   ├── Pagination.tsx          # Paginação de listagens
│   │   └── PortableText.tsx        # Renderizador de Portable Text do Sanity
│   ├── lib/
│   │   ├── sanity.ts               # Cliente Sanity configurado
│   │   ├── queries.ts              # Queries GROQ otimizadas
│   │   └── consent.ts              # Utilitários de cookies e sincronização com Google Consent Mode v2
│   ├── types/
│   │   └── index.ts                # Tipos TypeScript (Post, Category, Author, Consent)
│   └── utils/
│       ├── status.ts               # Cálculo dinâmico de status do concurso (Aberto/Encerrado)
│       └── categories.ts           # Deduplicação de categorias
├── vercel.json                     # Configuração de deploy da Vercel (região gru1 - São Paulo)
├── .env.example                    # Modelo de variáveis de ambiente
└── package.json
```

---

## 🚀 Funcionalidades Principais Implementadas

### 🎠 1. Carrossel Hero Responsivo (`HeroCarousel.tsx`)
- Exibe as **4 matérias mais recentes** na primeira página da Home.
- **Auto-rotation** de 5 segundos gerenciado por temporizador que pausa e reinicia ao interagir.
- **Suporte a Gestos em Dispositivos Móveis**: Navegação fluida via swipe horizontal no celular (`onTouchStart`/`onTouchEnd`).
- **Navegação Manual**: Botões de seta (Anterior/Próximo) e indicadores de pontos (dots) sempre visíveis e acessíveis em todas as resoluções.

### 🍪 2. Conformidade LGPD & Google Consent Mode v2 (`CookieBanner.tsx` e `consent.ts`)
- Sistema de consentimento de cookies em conformidade com a **Lei Geral de Proteção de Dados (Lei nº 13.709/2018)**.
- **Integração Nível 2 com Google Consent Mode v2**: Inicia com todos os consentimentos bloqueados (`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization` como `denied`) antes de carregar scripts de rastreamento.
- **Modal de Personalização**: Permite ao visitante escolher quais categorias aceitar (Essenciais, Análise, Marketing).
- **Botão Flutuante**: Ícone 🍪 no canto inferior para que o usuário possa revisar suas preferências a qualquer momento.

### ✉️ 3. Captação de E-mails via Brevo (`/api/newsletter`)
- Integração server-side com a API REST v3 da **Brevo** (Sendinblue).
- **Segurança da Chave**: A `BREVO_API_KEY` (`xkeysib-...`) é mantida estritamente no servidor, garantindo privacidade dos dados.
- **Proteção contra Abuso (Rate Limiting)**: Limite de 3 submissões por minuto por IP.
- **Filtro de Domínios Descartáveis**: Bloqueia e-mails temporários (Yopmail, Tempmail, Mailinator, etc.).
- **Estados Visuais**: Apresenta estados claros de carregamento, sucesso, e-mail já cadastrado e tratamento de erros.

### 📊 4. Métricas e Análise de Desempenho
- **Google Analytics 4**: Integrado nativamente via `next/script` (`G-YX2KZMH82Y`).
- **Vercel Web Analytics (`@vercel/analytics`)**: Coleta de visualizações de páginas, visitantes únicos e dispositivos.
- **Vercel Speed Insights (`@vercel/speed-insights`)**: Monitoramento contínuo das métricas Core Web Vitals (LCP, INP, CLS).

### 🎯 6. Hubs de Conteúdo & Silos de SEO (`/hub` e `/hub/[slug]`)
- **Páginas Pilares (Pillar Pages)**: Organização em silos de SEO para aumentar tempo de permanência e autoridade global no Google.
- **7 Hubs Estruturados**: Municipais & Prefeituras, Carreiras Policiais, Tribunais & Judiciário, Bancários & Finanças, Fiscais & Controle, Saúde & SUS, Educação & Docência.
- **Linkagem Interna Bidirecional**: Widget `PostHubWidget` injetado em cada artigo ligando-o ao seu Hub correspondente e transferindo PageRank.
- **Sub-silos & Estados**: Navegação direta para os 26 estados + DF e categorias secundárias.
- **Schema.org**: `CollectionPage` + `BreadcrumbList` em todas as páginas pilares.
- **Sitemap XML**: URLs de hubs incluídas automaticamente com alta prioridade (`0.9`).

---

## 📄 Rotas e Endpoints

| Rota | Tipo | Descrição |
|---|---|---|
| `/` | Dynamic (SSR) | Home com Carrossel de Destaques e feed paginado |
| `/post/[slug]` | SSG + Revalidação 60s | Matéria completa do concurso |
| `/categoria/[slug]` | SSG | Listagem de concursos por categoria |
| `/search?q=termo` | Dynamic | Busca global por título, conteúdo ou categoria |
| `/sitemap.xml` | Static | Sitemap XML dinâmico |
| `/api/categories/resolve` | API Route | Endpoint para o robô Python consultar categorias |
| `/api/newsletter` | API Route (POST) | Endpoint seguro para cadastro de leitores na Brevo |

---

## ⚙️ Variáveis de Ambiente

Crie o arquivo `frontend/.env.local` (ou configure no painel da Vercel):

```env
# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=mcc3s7d1
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-07-25
SANITY_API_TOKEN=skESugwi5EBz6Wh...

# Google Analytics 4
NEXT_PUBLIC_GA_ID=G-YX2KZMH82Y

# Brevo (Newsletter & Alertas)
BREVO_API_KEY=xkeysib-577df478ea259...
# BREVO_LIST_ID=2 # Opcional: ID de lista específica na Brevo
```

> **Atenção Vercel:** As variáveis `BREVO_API_KEY`, `SANITY_API_TOKEN` e `NEXT_PUBLIC_GA_ID` devem ser adicionadas em **Project Settings → Environment Variables** na Vercel.

---

## 🛠️ Comandos de Desenvolvimento

```powershell
# Instalar dependências
npm install

# Iniciar servidor local
npm run dev

# Checar tipos TypeScript
npx tsc --noEmit

# Build de produção
npm run build

# Executar build de produção
npm run start
```
