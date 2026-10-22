# Scrapling no Concursos Agora — viabilidade e arquitetura

> Análise feita em 20/10/2026, com teste real do Scrapling 0.5 contra fontes
> oficiais de concursos. Este documento é uma proposta técnica; nada aqui
> autoriza burlar termos de uso, paywalls, CAPTCHAs ou proteções anti-bot.
>
> **Atualização da implementação (20/10/2026):** o MVP em produção usa INSS,
> Vunesp e FGV Conhecimento. O DOU foi desativado porque
> `https://www.in.gov.br/robots.txt` responde `User-agent: *` / `Disallow: /`;
> nenhuma tentativa de contorno foi feita. A FGV entrou como terceira fonte
> porque a listagem de concursos em andamento é estática, pública e permitida.
> O pipeline real está em `../agente-artigos` e cria somente rascunhos
> `drafts.*` com `reviewStatus=pending`.

## 1. Veredito

| Camada | Viabilidade | Motivo |
|---|---|---|
| **Coleta de fontes oficiais** (gov.br, INSS, DOU, Vunesp, bancas) | **Alta** | Scrapling 0.5 fez requisições HTTP 200, com TLS/headers de navegador, parsing CSS e Markdown em todas as fontes testadas. |
| **Monitoramento de novas pautas** | **Alta** | Spiders com concorrência, AutoThrottle, `robots_txt_obey` e export JSON atendem exatamente o caso. |
| **Sites que dependem de JavaScript** (ex.: Cebraspe) | **Média** | A versão HTTP trouxe apenas o shell da página. É necessário `StealthyFetcher`/navegador, com custo maior e atenção aos termos de uso. |
| **Geração automática de artigos** | **Média** | Scrapling coleta e limpa o conteúdo, mas **não escreve** nem verifica fatos. Precisa de Groq + extração determinística + fact-check + revisão humana. |
| **Publicação 100% automática** | **Baixa / não recomendada** | Risco de erro factual, duplicidade, conteúdo raso e penalização por *scaled content abuse* no Google. Manter `AUTO_PUBLISH=false`. |
| **Burlar login, paywall, CAPTCHA ou bloqueio** | **Não recomendado** | Risco jurídico e de ToS. Usar apenas fontes públicas e permitidas. |

**Conclusão:** o Scrapling é excelente para a **camada de coleta**. Ele não substitui
o pipeline editorial anti-alucinação; ele alimenta esse pipeline. O ganho real é
transformar “olhar sites oficiais manualmente” em um **monitor de fontes** que
entrega fatos estruturados e um rascunho para revisão.

---

## 2. O que foi testado de verdade

Ambiente: Python 3.12.6, Scrapling 0.5 (lançado em 17/10/2026), instalação
`scrapling[fetchers]` + `scrapling[rag]`.

### 2.1 Requisições HTTP (`FetcherSession`)

| Fonte | HTTP | Título | Markdown | Observação |
|---|---:|---|---:|---|
| `gov.br/inss/pt-br` | 200 | “INSS — Instituto Nacional do Seguro Social” | 146.046 chars | Página rica; links e menus no Markdown. |
| `gov.br/inss/pt-br/assuntos/noticias` | 200 | “Notícias — INSS” | 148.591 chars | Boa para descobrir pautas. |
| `cebraspe.org.br/concursos/` | 200 | “Cebraspe” | 43 chars | **Shell JavaScript**; HTTP puro não vê o conteúdo. |
| `vunesp.com.br` | 200 | “Fundação Vunesp” | 11.196 chars | Boa para concursos/notícias. |
| `in.gov.br` (redireciona para Imprensa Nacional) | 200 | “Imprensa Nacional” | 2.015 chars | Portal do DOU; para edições específicas, usar busca/PDF. |

### 2.2 Spider com `robots.txt`, AutoThrottle e limite por domínio

Spider de teste contra a página de notícias do INSS:

```text
robots.txt: 200
página: 200
items_scraped: 1
requests_count: 1
robots_disallowed_count: 0
concurrent_requests_per_domain: 1
autothrottle: delay inicial 5,00s -> 2,52s
elapsed_seconds: 5,28
```

Isso confirma o fluxo que interessa ao portal: **respeitar robots.txt, limitar
requisições por domínio e desacelerar automaticamente**.

### 2.3 O que não foi testado

- `StealthyFetcher`/navegador real: exige `scrapling install` (Chromium e
  dependências, ~centenas de MB). Fica para a fase 2, somente nas fontes que
  realmente precisam.
- PDFs de diários oficiais: Scrapling baixa o PDF, mas a extração de texto
  precisa de `pypdf`/`pdfplumber` e, em PDFs escaneados, OCR (Tesseract).
- MCP server: útil para pesquisa assistida, não para o agendador de produção.

---

## 3. O que o Scrapling é (e o que não é)

**É:**

- framework Python de scraping (HTTP + navegador + spiders);
- parser rápido com CSS/XPath/texto/regex e *adaptive selectors*;
- crawler com concorrência, AutoThrottle, retries, pausa/retomada e export
  JSON/JSONL/CSV/XML;
- capaz de gerar Markdown limpo para RAG (`page.markdown()`);
- licença BSD-3-Clause, uso comercial permitido, sem custo de licença;
- projeto ativo: ~88 mil estrelas, versão 0.5, atualizado em outubro/2026.

**Não é:**

- um gerador de artigos;
- um verificador de fatos;
- um publicador no Sanity;
- uma autorização para ignorar termos de uso ou direitos autorais;
- um substituto para revisão humana em conteúdo jurídico/factual.

---

## 4. Onde usar e onde evitar

### Usar

- **DOU / Imprensa Nacional**: atos oficiais, editais, portarias, nomeações.
- **gov.br** (INSS, PF, PRF, ministérios, secretarias estaduais).
- **Sites oficiais de bancas** (Vunesp, FCC, IBFC, AOCP, IDECAN, Planejar etc.),
  preferindo páginas estáticas, RSS ou APIs públicas.
- **Diários oficiais estaduais/municipais** que publiquem HTML/PDF público.
- **Sites de prefeituras** para concursos municipais.

### Evitar ou tratar com cuidado

- **Agregadores de notícias** (G1, Folha Dirigida, PCI Concursos): use apenas
  como pista; não copie texto nem imagens.
- **Redes sociais**: scraping de Instagram/X/Facebook viola termos e é instável.
- **Cebraspe e sites com Cloudflare**: só com autorização/ToS compatível. O
  `StealthyFetcher` resolve tecnicamente, mas não resolve a licença.
- **Áreas logadas, paywall, captcha**: não usar.
- **Dados pessoais**: LGPD se aplica; não colete CPF, e-mail, telefone ou dados
  de candidatos. Foque em atos institucionais.

---

## 5. Arquitetura recomendada

```text
┌──────────────────────────────┐
│ Fontes oficiais (allowlist)  │
│ DOU, gov.br, bancas, DOEs    │
└──────────────┬───────────────┘
               │ Scrapling Spider (HTTP; navegador só se necessário)
               ▼
┌──────────────────────────────┐
│ Snapshot bruto               │
│ HTML/Markdown + metadados    │
│ hash, URL, data de coleta    │
└──────────────┬───────────────┘
               │ extração determinística (regex/PDF)
               ▼
┌──────────────────────────────┐
│ Fatos estruturados           │
│ órgão, banca, UF, vagas,     │
│ salário, datas, status       │
└──────────────┬───────────────┘
               │ dedup + regra de 2 fontes
               ▼
┌──────────────────────────────┐
│ Groq (redação)               │
│ JSON estrito, sem inventar   │
└──────────────┬───────────────┘
               │ fact-check + reparo
               ▼
┌──────────────────────────────┐
│ Sanity (rascunho)            │
│ reviewStatus = pending       │
└──────────────┬───────────────┘
               │ editor aprova no Studio
               ▼
┌──────────────────────────────┐
│ Publicação + webhook ISR     │
│ /api/revalidate              │
└──────────────────────────────┘
```

O frontend já tem o endpoint `/api/categories/resolve` para o robô Python
consultar categorias existentes e sugerir novas. Use-o antes de gravar no Sanity.

---

## 6. Pipeline em sete etapas

### 1. Descoberta

- Lista fixa de fontes em `sources.yaml` (allowlist).
- Cada fonte tem `id`, `name`, `start_urls`, `allowed_domains`, `official`,
  `interval_hours`, `parser` e `enabled`.
- Nunca descubra links fora dos domínios permitidos.

### 2. Coleta

- `FetcherSession` para HTML estático.
- `StealthyFetcher`/`StealthySession` somente quando o HTML vier vazio e a
  fonte permitir automação.
- `robots_txt_obey = True`, `autothrottle_enabled = True`,
  `concurrent_requests_per_domain = 1`, `download_delay >= 1s`.
- User-Agent identificável com URL/contato do portal.
- Salvar snapshot bruto e hash SHA-256 do conteúdo.

### 3. Extração determinística

- Título, data de publicação, órgão, banca, UF, esfera.
- Vagas, salário mínimo/máximo, taxa, isenção.
- Datas de inscrição e prova.
- Escolaridade, cargos, requisitos.
- Anexos (edital, retificação, comunicado).
- **Números e datas nunca vêm do LLM**; vêm do texto oficial e passam por
  validação de formato/faixa.

### 4. Deduplicação

- Chave do evento: `órgão + banca + ano + cargo`.
- Hash do conteúdo + similaridade de título (ex.: 0,9).
- URL canônica da fonte.
- Se já existe matéria publicada, atualizar em vez de criar duplicata.
- O dataset atual tem duas matérias quase idênticas sobre o INSS; o pipeline
  deve evitar que isso se repita.

### 5. Redação com Groq

- Modelo já configurado no ambiente: `GROQ_MODEL=groq/openai/gpt-oss-120b`.
- Entrada: fatos estruturados + trechos curtos das fontes.
- Saída: JSON com `title`, `slug`, `excerpt`, `body` (Portable Text), `seo`,
  `categories`, `sourceUrls`.
- Prompt obrigatório: “não invente; se o dado não estiver nos fatos, escreva
  ‘não divulgado’ e não estime”.
- Gerar conteúdo original; não copiar parágrafos do edital.
- `MIN_CONTENT_WORDS=200` como piso, mas o ideal editorial é 400–800 palavras
  com análise útil (cronograma, requisitos, comparativo, dicas).

### 6. Fact-check

- `FACT_CHECK_TWO_SOURCE_RULE=true`: números críticos precisam de duas fontes
  independentes (ou uma oficial + confirmação em outro documento oficial).
- `FACT_CHECK_MIN_SCORE=90`: score abaixo disso volta para reparo.
- `FACT_CHECK_MAX_REPAIR_ATTEMPTS=2`.
- Verificações determinísticas:
  - soma de vagas por cargo = total;
  - salário dentro da faixa publicada;
  - datas coerentes (fim ≥ início; prova após inscrição);
  - status compatível com as datas (`aberto`, `previsto`, `em_andamento`,
    `encerrado`);
  - URL oficial ainda responde 200;
  - categoria/UF existem no Sanity.
- Se falhar, o documento fica como rascunho e entra na fila de revisão.

### 7. Sanity + revisão humana

- Criar `_id: drafts.<slug>` (rascunho), nunca publicar direto.
- `reviewStatus: 'pending'`, `aiAssisted: true`, `sourceUrls`, `contentHash`,
  `lastCheckedAt`, `pipelineRunId`.
- O editor revisa no Studio, corrige e publica.
- A publicação dispara o webhook já configurado e revalida o ISR.

---

## 7. Estrutura de projeto sugerida

```text
agente-artigos/
├── sources.yaml
├── pyproject.toml
├── spiders/
│   ├── official_news.py
│   └── banca_pages.py
├── extractors/
│   ├── dates.py
│   ├── money.py
│   ├── vacancies.py
│   └── pdf.py
├── pipeline/
│   ├── dedupe.py
│   ├── writer.py          # Groq
│   ├── fact_check.py
│   └── sanity.py
├── prompts/
│   ├── writer_pt_br.md
│   └── fact_check.md
├── storage/
│   ├── raw/
│   └── state.db           # SQLite do ambiente atual
└── tests/
```

### `sources.yaml` (exemplo)

```yaml
sources:
  - id: inss
    name: INSS
    official: true
    start_urls:
      - https://www.gov.br/inss/pt-br/assuntos/noticias
    allowed_domains: [gov.br]
    interval_hours: 2
    parser: govbr_news

  - id: vunesp
    name: Fundação Vunesp
    official: true
    start_urls:
      - https://www.vunesp.com.br/
    allowed_domains: [vunesp.com.br]
    interval_hours: 6
    parser: banca_list

  - id: cebraspe
    name: Cebraspe
    official: true
    enabled: false          # habilitar só após validar ToS/navegador
    start_urls:
      - https://www.cebraspe.org.br/concursos/
    allowed_domains: [cebraspe.org.br]
    interval_hours: 6
    parser: banca_list
```

### Spider base (Scrapling 0.5)

```python
from scrapling.spiders import Spider, Response


class OfficialNewsSpider(Spider):
    name = "official_news"
    robots_txt_obey = True
    autothrottle_enabled = True
    concurrent_requests_per_domain = 1
    download_delay = 1.0

    def __init__(self, source: dict):
        super().__init__()
        self.source = source
        self.start_urls = source["start_urls"]
        self.allowed_domains = set(source["allowed_domains"])

    async def parse(self, response: Response):
        # Ajustar os seletores por fonte.
        for card in response.css("article, .noticia, .card"):
            link = card.css("a::attr(href)").get()
            if not link:
                continue
            yield response.follow(link, callback=self.parse_article)

    async def parse_article(self, response: Response):
        yield {
            "source_id": self.source["id"],
            "url": response.url,
            "status": response.status,
            "title": response.css("h1::text").get("").strip(),
            "published_at": response.css("time::attr(datetime)").get(),
            "markdown": response.markdown(),
            "content_hash": None,  # calcular no pipeline
        }
```

> Ajuste os seletores para cada fonte. Não use seletores genéricos em produção:
> eles capturam menus, rodapés e recomendações.

### CLI e MCP

```bash
# apenas HTTP (sem navegador)
pip install "scrapling[fetchers]"
pip install "scrapling[rag]"        # page.markdown()

# navegador/stealth (só para fontes autorizadas)
scrapling install

# teste manual de uma página
scrapling extract get "https://www.gov.br/inss/pt-br/assuntos/noticias" inss.md

# MCP para pesquisa assistida (não para o cron de produção)
pip install "scrapling[ai]"
scrapling-mcp
```

---

## 8. Contrato JSON entre coleta, redação e Sanity

```json
{
  "source": {
    "id": "inss",
    "name": "INSS",
    "url": "https://www.gov.br/inss/pt-br/assuntos/noticias/...",
    "official": true,
    "published_at": "2026-10-20T10:00:00-03:00",
    "document_id": "DOU-2026-10-20-123",
    "checked_at": "2026-10-20T13:00:00-03:00"
  },
  "facts": {
    "organ": "Instituto Nacional do Seguro Social (INSS)",
    "banca": "A definir",
    "sphere": "FEDERAL",
    "state_uf": "Nacional",
    "city_name": null,
    "status": "previsto",
    "contest_status": "ato_intermediario",
    "vacancies_total": null,
    "salary_min": null,
    "salary_max": 9100,
    "registration_fee": null,
    "education_level": ["superior"],
    "enrollment_start": null,
    "enrollment_end": null,
    "exam_date": null,
    "categories": ["nacional", "federal"]
  },
  "article": {
    "title": "...",
    "slug": "...",
    "excerpt": "...",
    "body": [],
    "seo": {},
    "source_urls": ["..."]
  },
  "checks": {
    "score": 96,
    "two_source_rule": true,
    "warnings": [],
    "blocking_errors": []
  }
}
```

---

## 9. Mapeamento para o schema Sanity

| JSON | Sanity (`post`) |
|---|---|
| `article.title` | `title` |
| `article.slug` | `slug.current` |
| `article.excerpt` | `excerpt` |
| `article.body` | `body` (Portable Text) |
| `facts.organ` | `organ` |
| `facts.banca` | `banca` |
| `facts.sphere` | `sphere` |
| `facts.state_uf` | `stateUf` |
| `facts.city_name` | `cityName` |
| `facts.status` | `status` |
| `facts.contest_status` | `contestStatus` |
| `facts.vacancies_total` | `vacanciesTotal` |
| `facts.salary_min/max` | `salaryMin` / `salaryMax` |
| `facts.education_level` | `educationLevel` |
| `facts.enrollment_start/end` | `enrollmentStartDate` / `enrollmentEndDate` |
| `facts.exam_date` | `examDate` |
| `facts.categories` | `categories` (referências) |
| `source.*` | `sourceUrls` |
| `checks.score` | `reviewStatus` (pending/approved) |
| hash | `contentHash` |
| data da checagem | `lastCheckedAt` |
| execução | `pipelineRunId` |

Os campos `reviewStatus`, `aiAssisted`, `sourceUrls`, `contentHash`,
`lastCheckedAt` e `pipelineRunId` já foram adicionados ao schema do Studio.

---

## 10. Regras de qualidade e anti-alucinação

1. **Fato oficial > LLM.** O modelo não pode criar número, data, banca ou cargo.
2. **Toda matéria precisa de fonte oficial linkada.**
3. **Regra de duas fontes** para números críticos; se não houver, marcar
   “em apuração” e manter rascunho.
4. **Deduplicar antes de escrever.** Duas matérias do INSS já mostram o custo
   de não fazer isso.
5. **Nada de copiar e colar.** Resumo original, no máximo citação curta com
   crédito e link.
6. **Revisão humana obrigatória** enquanto `AUTO_PUBLISH=false`.
7. **Atualização, não republicação.** Se o edital mudou, atualize a matéria e
   registre `lastCheckedAt`.
8. **Correções visíveis.** O portal já tem política editorial e botão de
   reportar erro; o pipeline deve alimentar esse fluxo.

---

## 11. Agendamento e infraestrutura

| Opção | Quando usar | Observações |
|---|---|---|
| **GitHub Actions (cron)** | MVP, fontes estáticas, até 10 artigos/run | Grátis em repo público; runner tem 7 GB e 2 vCPUs. SQLite não persiste entre runs sem cache/artifact. |
| **VPS pequena (2 GB)** | Produção com SQLite + navegador | Melhor para `StealthyFetcher`, estado persistente e cron a cada 2h. |
| **Docker `pyd4vinci/scrapling`** | Produção isolada | Imagem já traz navegadores; monte volume para `storage/` e `state.db`. |
| **Vercel** | **Não usar para scraping** | Serverless tem timeout, pouco disco e IP compartilhado; o frontend deve só receber o webhook. |

O ambiente atual já aponta para:
`SCRAPE_INTERVAL_HOURS=2`, `MAX_ARTICLES_PER_RUN=10`,
`MIN_CONTENT_WORDS=200`, `AUTO_PUBLISH=false`, `FACT_CHECK_MIN_SCORE=90`,
`FACT_CHECK_TWO_SOURCE_RULE=true`.

---

## 12. Custos e esforço

- **Scrapling:** R$ 0 (BSD-3-Clause).
- **Groq:** custo baixo por artigo; o modelo `gpt-oss-120b` é adequado para
  rascunho em português. O custo real está no volume de tokens de entrada
  (texto oficial + instruções), não na biblioteca.
- **Proxies:** opcionais. Só fazem sentido se uma fonte pública bloquear IP de
  datacenter; comece sem proxy.
- **Infra:** GitHub Actions (grátis no repo público) ou VPS de ~US$ 5–10/mês.
- **Esforço:**
  - MVP com 3 fontes estáticas + JSON + rascunho no Sanity: **2–4 dias**;
  - pipeline completo com PDF, fact-check, revisão e agendamento: **1–2 semanas**;
  - operação contínua: **1–2 h/semana** para monitorar falhas e qualidade.

---

## 13. Direito, ética e SEO

### Direito autoral

- Fatos e dados oficiais não são protegidos como obra literária; **o texto, a
  headline, a foto e o layout são**.
- Escreva com suas palavras, cite a fonte e linke o original.
- Não copie o edital inteiro; publique resumo + link oficial.
- Fotos: use o banco `imageLibrary` (266 imagens) ou fontes com licença clara;
  não baixe foto de site de banca sem autorização.

### LGPD

- Não colete dados pessoais de candidatos.
- Não scrape perfis sociais, comentários ou listas de aprovados com dados
  pessoais sem base legal.
- Prefira atos institucionais e documentos públicos.

### Termos de uso

- Respeite `robots.txt`, `Crawl-delay` e termos.
- Identifique o bot: `ConcursosAgoraBot/1.0 (+https://www.concursosagora.com.br/contato)`.
- Se uma fonte proíbe automação, peça autorização ou use API/RSS oficial.
- `StealthyFetcher` não é salvo-conduto: ele contorna proteção técnica, o que
  pode violar contrato/ToS.

### SEO / Google

- Conteúdo gerado em massa sem valor é *scaled content abuse*.
- O diferencial precisa ser editorial: análise, cronograma, tabela de vagas,
  requisitos, comparativo, dicas, atualização e fonte.
- Marque `aiAssisted` para transparência interna; não precisa (e talvez não
  deva) estampar “feito por IA” no artigo, mas a responsabilidade editorial é
  humana.
- Corrija erros e atualize `lastCheckedAt`; o Google valoriza frescor com
  precisão, não com publicação em massa.

---

## 14. Roadmap recomendado

### Fase 0 — Prova de conceito (1 dia)

- [ ] Criar `agente-artigos/` com venv e `scrapling[fetchers,rag]`.
- [ ] Rodar `sources.yaml` com 3 fontes: INSS, Vunesp, DOU.
- [ ] Exportar JSON bruto + Markdown.
- [ ] Não chamar LLM, não gravar no Sanity.

### Fase 1 — Rascunho no Sanity (2–3 dias)

- [ ] Extrair fatos determinísticos.
- [ ] Deduplicar por URL/hash/título.
- [ ] Criar `drafts.<slug>` com `reviewStatus=pending`.
- [ ] Testar no Studio e publicar uma matéria de teste.

### Fase 2 — Redação e fact-check (2–3 dias)

- [ ] Prompt Groq com JSON estrito.
- [ ] Regra de duas fontes e score mínimo.
- [ ] Reparo automático (máx. 2 tentativas).
- [ ] Bloquear publicação se score < 90.

### Fase 3 — Operação (2 dias)

- [ ] Cron a cada 2h (GitHub Actions ou VPS).
- [ ] Logs, alerta de falha, métricas por fonte.
- [ ] `AUTO_PUBLISH=false` até 30 dias de qualidade comprovada.
- [ ] Revisar semanalmente falsos positivos e duplicatas.

---

## 15. Decisão recomendada

**Usar o Scrapling, sim — como monitor de fontes e extrator.** Não como
“gerador automático de artigos”. A combinação recomendada é:

```text
Scrapling (coleta) + extração determinística (fatos)
+ Groq (redação) + fact-check (2 fontes/score 90)
+ Sanity draft (revisão humana) + webhook ISR
```

Isso aproveita o melhor do Scrapling (velocidade, parsing, spiders, Markdown,
robots.txt) e mantém o padrão editorial que o portal já declara ter. Se o
objetivo for apenas “publicar muito conteúdo rápido”, o risco de qualidade e
SEO supera o ganho; se o objetivo é **cobrir concursos com precisão e
velocidade**, o Scrapling é a peça que falta.

---

## Referências

- Repositório: <https://github.com/D4Vinci/Scrapling>
- Documentação: <https://scrapling.readthedocs.io/en/latest/>
- Spiders: <https://scrapling.readthedocs.io/en/latest/spiders/architecture.html>
- MCP: <https://scrapling.readthedocs.io/en/latest/ai/mcp-server.html>
- PyPI: <https://pypi.org/project/scrapling/>
- Licença: BSD-3-Clause.

## Atualização: verificação por evidência (21/10/2026)

O pipeline de `../agente-artigos` passou a exigir fonte oficial e evidência
literal antes de criar qualquer `drafts.*`:

- `sourceUrls` registra `kind` (`official_primary`, `journalism`, etc.),
  `usage` (`facts`, `discovery`, `corroboration`) e o trecho de evidência.
- `verificationStatus` pode ser `verified`, `needs_review` ou `blocked`.
- `verificationScore` mede a ficha de evidências (mínimo 95 por padrão).
- `verificationReport` traz `blocking`, `criticalMissing`, `supportedFacts` e
  `totalFacts`.
- `factSheet` traz cada fato crítico com o trecho literal da fonte e a URL.

Portais de imprensa e agregadores (PCI, Concursos no Brasil, JC Concursos,
Folha Dirigida, Ache Concursos, G1, Correio Braziliense, Notícias Concursos e
Concursos em Pauta) são apenas descoberta. Eles nunca geram artigo. O DOU
continua desativado porque `https://www.in.gov.br/robots.txt` responde
`User-agent: *` / `Disallow: /`.

A política completa está em `../agente-artigos/docs/verificacao-editorial.md`.
O Studio local compila, o schema valida e o Studio hospedado foi reimplantado em
21/10/2026.
