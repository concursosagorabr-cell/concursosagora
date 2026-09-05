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
│   │   ├── concursos/              # Diretório Central de Concursos (Explorador com Filtros Vivos) 🏛️
│   │   │   ├── page.tsx            # Página do Explorador com busca facetada e CollectionPage Schema
│   │   │   ├── [nivel]/[uf]/       # Rotas Programáticas por Escolaridade + Estado (ex: /concursos/nivel-medio/sp) 🎯
│   │   │   └── salario-acima-de-10-mil/ # Rota Programática de Altos Salários (R$ 10.000+) 💰
│   │   ├── banca/[slug]/           # Rotas Programáticas por Banca Organizadora (FGV, Cebraspe, Vunesp...) 🏢
│   │   ├── post/[slug]/            # Página do artigo completo (com Schema JobPosting, FAQPage e NewsArticle) 📰
│   │   ├── categoria/[slug]/       # Página de categoria (com agrupamento por sinônimos e paginação 10 em 10)
│   │   ├── concursos-abertos/[uf]/ # Página programática por estado (/concursos-abertos/sp)
│   │   ├── hub/                    # Index de Hubs de Conteúdo (Guias Pilares de SEO)
│   │   │   └── [slug]/             # Páginas Pilares (Pillar Pages) por área e municípios
│   │   ├── search/                 # Busca global por palavras-chave
│   │   ├── sitemap.ts              # Sitemap XML dinâmico com todas as rotas programáticas
│   │   └── api/
│   │       ├── categories/
│   │       │   └── resolve/
│   │       │       └── route.ts    # API de resolução de categorias ⚙️
│   │       ├── newsletter/
│   │       │   └── route.ts        # API de captação de e-mails da Newsletter e Alertas VIP (Brevo) ✉️
│   │       └── revalidate/
│   │           └── route.ts        # Revalidação On-Demand (ISR) segura via webhook Sanity 🛡️
│   ├── components/
│   │   ├── ContestExplorer.tsx     # Explorador com busca facetada reativa (Salário, Escolaridade, UF, Banca) 🎛️
│   │   ├── SegmentedAlertBox.tsx   # Captura de leads VIP segmentada por nicho (WhatsApp, Telegram e E-mail) 🔔
│   │   ├── HeroCarousel.tsx        # Carrossel responsivo com auto-play (5s), swipe e controles manuais 🎠
│   │   ├── CookieBanner.tsx        # Banner e modal de consentimento de cookies (LGPD / Consent Mode v2) 🍪
│   │   ├── Newsletter.tsx          # Widget de inscrição em alertas de concursos com integração Brevo
│   │   ├── InArticleCTA.tsx        # Bloco "Leia Também" contextual inserido no artigo — reduz bounce rate 📌
│   │   ├── Header.tsx              # Cabeçalho com logo oficial otimizado, RegionBar + Navbar
│   │   ├── Navbar.tsx              # Menu desktop otimizado com link para Explorar Vagas
│   │   ├── MobileMenu.tsx          # Drawer mobile acessível (WCAG) com suporte a inert e foco seguro 📱
│   │   ├── RegionBar.tsx           # Atalhos diretos para as 27 UFs
│   │   ├── SearchBar.tsx           # Campo de busca progressiva (SSR amigável e acessível) 🔍
│   │   ├── PostCard.tsx            # Card de concurso na listagem com badges de salário e vagas
│   │   ├── CategoryCard.tsx        # Card de link direto para a categoria
│   │   ├── Sidebar.tsx             # Barra lateral contextual com posts da área e newsletter
│   │   ├── RelatedPosts.tsx        # Grid de 3 matérias relacionadas no rodapé do artigo
│   │   ├── PostHubWidget.tsx       # Widget de linkagem interna bidirecional (Hub SEO)
│   │   ├── AuthorCard.tsx          # Card do autor no rodapé do artigo com redes sociais verificáveis e EEAT ✍️
│   │   ├── Footer.tsx              # Rodapé com logo oficial e links por região
│   │   ├── Pagination.tsx          # Paginação com botões numéricos e indicadores de matérias
│   │   └── PortableText.tsx        # Renderizador de Portable Text do Sanity com suporte a tabelas
│   ├── lib/
│   │   ├── sanity.ts               # Cliente Sanity com métodos em cache (ISR)
│   │   ├── queries.ts              # Queries GROQ completas e projeções com novos campos estruturados
│   │   └── consent.ts              # Utilitários de cookies e sincronização com Google Consent Mode v2
│   ├── types/
│   │   └── index.ts                # Tipos TypeScript atualizados (Post com salaryMax, educationLevel, banca, etc.)
│   └── utils/
│       ├── bancas.ts               # Mapeamento e perfil detalhado das 9 principais bancas examinadoras 🏢
│       ├── status.ts               # Cálculo dinâmico de status do concurso (Aberto/Encerrado)
│       ├── categories.ts           # Deduplicação, filtro de puras e mapeamento de sinônimos/aliases 🧩
│       ├── hubs.ts                 # Definição e configuração dos Hubs de Conteúdo (Silos SEO)
│       └── imageAlt.ts             # Geração de alt texts contextuais e descritivos para acessibilidade e SEO 🖼️
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

### 🏛️ 9. Diretório Central de Vagas & Explorador Interativo (`/concursos` e `ContestExplorer.tsx`)
- **Busca Facetada Dinâmica**: Filtros instantâneos combináveis por Nível de Escolaridade (Fundamental, Médio, Superior), Faixa Salarial (até 5k, 5k-10k, 10k+, 15k+), Estado/UF (27 unidades da federação), Banca Organizadora e Status (somente abertos).
- **Sem Recarregamento de Página**: Atualização fluida do grid de vagas com badges informativas de remuneração, vagas e prazos de encerramento.

### 🎯 10. Matrizes Programáticas de SEO (Micro-Diretórios de Cauda Longa)
- **Por Escolaridade + Estado (`/concursos/[nivel]/[uf]`)**: 81 landing pages indexáveis (ex: `/concursos/nivel-medio/sp`, `/concursos/nivel-superior/rj`) com FAQs e ItemList Schema.
- **Por Banca Organizadora (`/banca/[slug]`)**: Guias completos para 9 bancas examinadoras (FGV, Cebraspe, Vunesp, FCC, IBFC, AOCP, Fundatec, Quadrix e Cesgranrio) com perfil de prova e dicas de aprovação.
- **Altos Salários (`/concursos/salario-acima-de-10-mil`)**: Landing page para editais com remuneração de elite (R$ 10.000+).

### 💼 11. Google Jobs & Rich Snippets (`JobPosting` Schema)
- Injeção automática de dados estruturados Schema.org `@type: "JobPosting"` nas páginas de artigos (`/post/[slug]`), habilitando a exibição nos cards nativos de vagas do Google Search.
- Suporte a `@type: "CollectionPage"`, `@type: "ItemList"` e `@type: "FAQPage"`.

### 🔔 12. Captura de Leads VIP Segmentada (`SegmentedAlertBox.tsx`)
- Lead magnet contextual com opções de entrada direta em grupos de WhatsApp, canal VIP do Telegram e alertas personalizados por e-mail no nicho específico da página.

### ♿ 13. Acessibilidade (Conformidade WCAG 2.1 Nível AA/AAA)
- **Tipografia e Zoom Escalável (WCAG 1.4.4 AA):** Eliminação de micro-textos inferiores a 12px em todos os componentes (`text-xs` mínimo escalável em `rem`), assegurando legibilidade e suporte a zoom de até 200% sem perda de conteúdo ou sobreposição.
- **Redução de Movimento (`prefers-reduced-motion` - WCAG 2.3.3 AAA):** Regra CSS global em `globals.css` que anula transições e animações quando solicitado pelo sistema do usuário, combinada com classes utilitárias `motion-reduce:animate-none` em elementos visuais contínuos (como o badge pulsante `animate-ping`).
- **Contraste de Cores Otimizado (WCAG 1.4.3 AA):** Revisão cromática garantindo contraste superior a 4.5:1 para texto normal e superior a 7:1 em botões, tags e metadados de leitura rápida.
- **Busca Progressiva e Acessível (`SearchBar.tsx`):** Campo de pesquisa habilitado imediatamente no SSR sem bloqueios que pudessem desorientar usuários de leitores de tela.
- **Textos Alternativos Descritivos (`imageAlt.ts` - WCAG 1.1.1 A):** Geração contextual de `alt` para imagens de editais e órgãos públicos, descrevendo o contexto visual em vez de apenas repetir o título da página.

### 🌐 14. Barra Superior de Plantão Otimizada (`RegionBar.tsx`)
- **Destaque de Alto Tráfego:** Exibição imediata dos estados com maior volume de buscas no Google e maior número de vagas no Brasil (`🇧🇷 NACIONAL`, `SP`, `RJ`, `MG`, `DF`, `BA`, `PR`, `RS`).
- **Botão Discreto `+ Estados ▾`:** Menu compacto com popover responsivo que agrupa todos os demais estados pelas macrorregiões do Brasil (Nordeste, Centro-Oeste, Sul & Sudeste, Norte), eliminando qualquer corte horizontal ou barra de rolagem quebrada em telas de notebooks (1366px, 1280px).
- **Interatividade Acessível:** Fechamento automático ao clicar fora (`useRef` + `mousedown`) ou pressionar `Escape`.

### 🛡️ 15. Blindagem Editorial Anti-404 e Saneamento de Badges
- **Saneamento de Badges (`HeroCarousel.tsx` e `PostCard.tsx`):** Aplicação de `getPureCategories` para garantir que apenas áreas e carreiras apareçam nos badges primários dos cards, evitando duplicação visual de siglas de UF.
- **Erradicação Total de Páginas Vazias (Zero Soft 404):** Publicação de matérias aprofundadas com dados 100% reais de 2026 cobrindo todas as 27 UFs e todas as 58 categorias do Sanity.
- **Menu Mobile Sem Armadilhas de Foco (`MobileMenu.tsx`):** Uso do atributo nativo `inert` e controle reativo de `aria-hidden` quando o drawer estiver fechado, prevenindo que leitores de tela naveguem por links invisíveis.

### 🛡️ 14. Segurança & Cabeçalhos HTTP (Nota A+ / OWASP)
- **Content-Security-Policy (CSP) Estrito:** Configurado diretamente nos cabeçalhos HTTP no `next.config.ts`, restringindo a execução de scripts, conexões e fontes apenas para origens confiáveis (Sanity CDN, Google Fonts, GA4, Vercel).
- **Ocultação de Fingerprinting:** Supressão do cabeçalho `X-Powered-By: Next.js` via `poweredByHeader: false`.
- **Revalidação ISR Blindada (`/api/revalidate`):** Endpoint de purge de cache On-Demand protegido obrigatoriamente pela variável `SANITY_REVALIDATE_SECRET`, com rejeição imediata (HTTP 500/401) e zero segredos estáticos no código-fonte.

### ✍️ 15. Perfis Editoriais Humanizados & EEAT (`AuthorCard.tsx`)
- Card de identificação profissional no rodapé dos artigos exibindo a especialidade editorial do jornalista (ex: Especialista em Carreiras Jurídicas, Carreiras Policiais, etc.).
- Links sociais diretos e verificáveis (LinkedIn, X/Twitter, Instagram, Facebook) com `rel="noopener noreferrer"`.

---

## 📄 Rotas e Endpoints

| Rota | Tipo | Descrição |
|---|---|---|
| `/` | Dynamic (SSR) | Home com Carrossel de Destaques e feed paginado (10 em 10) |
| `/concursos` | SSG + ISR 180s | Diretório Central e Explorador Interativo de Concursos Públicos |
| `/concursos/[nivel]/[uf]` | SSG + ISR 300s | Páginas Programáticas de Escolaridade + Estado (81 combinações) |
| `/banca/[slug]` | SSG + ISR 300s | Páginas Programáticas por Banca Examinadora (9 bancas) |
| `/concursos/salario-acima-de-10-mil` | SSG + ISR 300s | Página Programática para Concursos com Salários R$ 10k+ |
| `/post/[slug]` | SSG + ISR 60s | Matéria completa com Schema JobPosting (Google Jobs), FAQPage e NewsArticle |
| `/categoria/[slug]` | SSG + Paginação | Listagem de concursos por categoria (com resolvedor de sinônimos) |
| `/concursos-abertos/[uf]` | SSG + ISR 300s | Página programática por estado (/concursos-abertos/sp) |
| `/hub` | SSG | Index de Hubs de Conteúdo (Guias Pilares) |
| `/hub/[slug]` | SSG | Guia Pilar definitivo por área/setor |
| `/search?q=termo` | Dynamic | Busca global por título, conteúdo ou categoria |
| `/sitemap.xml` | Static | Sitemap XML dinâmico com todas as rotas programáticas |
| `/api/categories/resolve` | API Route | Endpoint para o robô Python consultar categorias |
| `/api/newsletter` | API Route (POST) | Endpoint seguro para cadastro de leitores e alertas na Brevo |
| `/api/revalidate` | API Route (GET/POST) | Revalidação On-Demand (ISR) blindada com `SANITY_REVALIDATE_SECRET` |

---

## ⚙️ Variáveis de Ambiente

Crie o arquivo `frontend/.env.local` (ou configure no painel da Vercel):

```env
# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=mcc3s7d2
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-07-25
SANITY_API_TOKEN=skESugwi5EBz6Wh...

# Segredo de Revalidação On-Demand (ISR)
SANITY_REVALIDATE_SECRET=seu_segredo_de_revalidacao_aqui

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

# Executar suite de testes unitários (Vitest)
npm test

# Executar linter ESLint
npm run lint

# Checar tipos TypeScript (não requer conexão com Google Fonts)
npx tsc --noEmit

# Build de produção (requer acesso à internet para download de fontes)
npm run build

# Executar build de produção
npm run start
```
