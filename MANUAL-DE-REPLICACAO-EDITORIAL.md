# Manual de replicação editorial — Concursos Agora

**Versão:** 1.0  
**Data:** 23/10/2026  
**Base de código:** commit `f281fcc` + alterações locais ainda não commitadas  
**Objetivo:** permitir reconstruir o ambiente, reproduzir a produção de artigos e manter a mesma qualidade editorial e o mesmo nível de rastreabilidade factual.

> Este documento é um plano de backup e replicação. Ele não contém tokens, senhas nem chaves de API. Os segredos ficam nos arquivos `.env.local` e em um gerenciador de senhas, nunca no Git.

---

## 1. Resumo executivo

O Concursos Agora produz matérias sobre concursos públicos a partir de **fontes oficiais**, com três princípios não negociáveis:

1. **Fonte oficial apenas.** Órgão público, banca organizadora ou diário oficial. Portais de imprensa e agregadores servem, no máximo, para descobrir uma URL oficial; nunca confirmam número, data, salário ou status.
2. **Evidência literal por fato.** Cada fato crítico da matéria precisa de um trecho que exista literalmente no texto-fonte. Sem trecho, o rascunho não é criado.
3. **Publicação humana.** O pipeline cria somente `drafts.*` com `reviewStatus = "pending"`. Nenhum documento é publicado automaticamente; `AUTO_PUBLISH` é ignorado.

O resultado de referência foi a execução de **22/10/2026**: **10 rascunhos** criados, todos com `reviewStatus=pending` e `aiAssisted=true`, **16 posts publicados preservados**, **10 URLs oficiais distintas**, **10/10 com fact-check 100/100 e evidência 100/100**, entre 204 e 281 palavras.

A qualidade não vem de “pedir ao modelo para não errar”. Vem de um fluxo em que o modelo (ou o redator humano) só reescreve fatos já extraídos e cada número é validado por código antes de virar rascunho.

---

## 2. Arquitetura em uma página

```text
Fontes oficiais
(INSS, Vunesp, FGV, DOU)
        │
        ▼
Descoberta + robots.txt + atraso entre requisições
        │
        ▼
Extração determinística de título, datas, órgão, banca,
vagas, salários, taxa, UF, cidade, escolaridade e status
        │
        ▼
Ficha de evidências
(trecho literal + URL + confiança por fato)
        │
        ▼
Redação
(assistente/editor humano OU Groq)
        │
        ▼
Validação editorial + auditoria de evidências
(números, datas, status, links, categorias, alegações de risco)
        │
        ▼
Deduplicação por URL, hash, slug, título e concurso
(cooldown de 15 dias por contestKey)
        │
        ▼
Sanity: drafts.<slug> com reviewStatus=pending
        │
        ▼
Revisão humana no Studio
        │
        ▼
Publicação manual
```

### Componentes

| Componente | Papel | Onde está |
|---|---|---|
| Frontend público | Exibe as matérias publicadas | `concursosagora-main/` |
| Sanity Studio + schemas | CMS, campos editoriais e revisão | `concursos-sanity-backend/` |
| Pipeline editorial | Coleta, extração, validação, dedupe e rascunhos | `agente-artigos/` |
| Fila diária | Descobre pautas e monta a triagem, sem redigir nem publicar | `agente-artigos/pipeline/daily.py` |
| Bundle manual | Matéria escrita pelo assistente/editor, validada pelo pipeline | `agente-artigos/pipeline/manual.py` |
| Estado local | Histórico de execuções e auditoria | `agente-artigos/data/pipeline.db` |
| Agendamento | Gera a fila todos os dias às 08:00 | Windows Task Scheduler |

---

## 3. Repositórios, pastas e fontes

### 3.1 Repositórios GitHub do projeto

| Repositório | URL | Caminho local | O que contém | Obrigatório para replicar? |
|---|---|---|---|---|
| Monorepo completo | <https://github.com/concursosagorabr-cell/concursosagoraprojetocompleto> | `C:\Users\cleber.jose\Documents\concursosagora` | Frontend, Sanity Studio, pipeline, docs, scripts e testes | **Sim** |
| Frontend standalone | <https://github.com/concursosagorabr-cell/concursosagora> | `concursosagora-main/` (no monorepo atual) | Portal Next.js 15 publicado na Vercel | Não, se o monorepo já estiver completo; útil para deploy separado do frontend |

O backend Sanity (`concursos-sanity-backend/`) e o pipeline editorial (`agente-artigos/`) são subpastas do monorepo, não repositórios separados.

O remote atual do checkout é:

```text
origin  https://github.com/concursosagorabr-cell/concursosagoraprojetocompleto.git
```

Confirme com `git remote -v`. O repositório standalone do frontend é citado no `README.md` da raiz; o checkout local atual usa o monorepo.

### 3.2 Repositórios GitHub de terceiros usados

| Repositório | URL | O que foi usado | Dependência direta? |
|---|---|---|---|
| Scrapling | <https://github.com/D4Vinci/Scrapling> | `FetcherSession`, headers de navegador, retries e cache | Sim (`requirements.txt`) |
| lxml | <https://github.com/lxml/lxml> | Parser HTML do Beautiful Soup | Sim (`requirements.txt`) |
| PyYAML | <https://github.com/yaml/pyyaml> | Leitura de `sources.yaml` | Sim (`requirements.txt`) |
| python-dotenv | <https://github.com/theskumar/python-dotenv> | Leitura de `.env.local` | Sim (`requirements.txt`) |
| Sanity Studio | <https://github.com/sanity-io/sanity> | Studio, schemas e CLI | Sim (`package.json`) |
| Sanity Client | <https://github.com/sanity-io/client> | `@sanity/client` no frontend e no backend | Sim (`package.json`) |
| Portable Text React | <https://github.com/portabletext/react> | Renderização do corpo no frontend | Sim (`package.json`) |
| Next.js | <https://github.com/vercel/next.js> | Frontend, App Router, ISR e rotas | Sim (`package.json`) |
| Tailwind CSS | <https://github.com/tailwindlabs/tailwindcss> | Estilo do frontend | Sim (`package.json`) |
| React | <https://github.com/facebook/react> | Componentes do frontend e do Studio | Sim (`package.json`) |
| TypeScript | <https://github.com/microsoft/TypeScript> | Tipagem do frontend e do Studio | Sim (`package.json`) |
| Node.js | <https://github.com/nodejs/node> | Runtime do frontend e do Studio | Sim (ambiente) |
| Git | <https://github.com/git/git> | Versionamento e backup | Sim (ambiente) |
| OpenCode | <https://github.com/anomalyco/opencode> (anteriormente `sst/opencode`) | Ambiente do agente usado para editar código, rodar comandos e validar | Sim, para reproduzir o fluxo assistido; um editor humano pode substituir |

As dependências transitivas exatas estão em `concursosagora-main/package-lock.json`, `concursos-sanity-backend/package-lock.json` e `agente-artigos/requirements.txt`. Se precisar de uma reconstrução reprodutível, use os lockfiles e versões fixas.

> O OpenCode é o harness do agente, não uma biblioteca do pipeline. A produção editorial continua funcionando se um humano escrever o bundle e rodar `python -m pipeline manual`; o OpenCode só acelera edição, conferência e execução.

### 3.3 Pastas que importam

```text
concursosagora/
├── concursosagora-main/          # Next.js 15 + Tailwind CSS v4 + Sanity Client
├── concursos-sanity-backend/     # Sanity Studio 6 + schemas + scripts
├── agente-artigos/               # pipeline editorial em Python
│   ├── pipeline/                 # código do pipeline
│   ├── docs/                     # políticas, fontes e rotina diária
│   ├── scripts/                  # rotina diária e agendamento Windows
│   ├── tests/                    # 75 testes offline
│   ├── data/                     # runs, fila, bundles, SQLite (ignorado pelo Git)
│   ├── sources.yaml              # fontes oficiais monitoradas
│   └── requirements.txt          # dependências Python
└── MANUAL-DE-REPLICACAO-EDITORIAL.md
```

### 3.4 Outros serviços e runtimes

| Serviço/runtime | Uso no Concursos Agora | Referência |
|---|---|---|
| Beautiful Soup 4 | Parse do HTML | <https://www.crummy.com/software/BeautifulSoup/> |
| Sanity Content Lake | API de consulta e mutação usada pelo pipeline | <https://www.sanity.io/docs> |
| Groq API | Redação automática opcional | <https://console.groq.com/docs> |
| Python | Runtime do pipeline | <https://www.python.org/> |
| PowerShell + Task Scheduler | Rotina diária no Windows | documentação da Microsoft |
| GitHub | Hospedagem dos repositórios e backup do código | <https://github.com/> |

Os repositórios GitHub das bibliotecas e frameworks estão na seção 3.2; as dependências transitivas exatas estão nos lockfiles.

### 3.5 Fontes oficiais ativas

| Fonte | Tipo | Página inicial | Uso |
|---|---|---|---|
| INSS | `govbr_news` | `https://www.gov.br/inss/pt-br/assuntos/noticias` | Artigo e evidência |
| Vunesp | `vunesp` | `https://www.vunesp.com.br/busca/concurso/inscricoes%20abertas` | Artigo e evidência |
| FGV Conhecimento | `fgv` | `https://conhecimento.fgv.br/concursos` | Artigo e evidência |
| DOU | `dou_inlabs` | XML/ZIP oficial em `data/dou/` | Artigo e evidência, por importação local |

O DOU **não é raspado**: o `robots.txt` do `in.gov.br` retorna `User-agent: * / Disallow: /`. O conector lê XML/ZIP oficial baixado manualmente. A fonte fica `enabled: false` por padrão para não entrar em `run --source all` sem um arquivo explícito.

A matriz completa das 10 fontes analisadas (incluindo portais que só podem ser usados para descoberta) está em `agente-artigos/docs/fontes-de-dados.md` e no registro executável `agente-artigos/pipeline/source_policy.py`.

---

## 4. Skills editoriais (playbooks)

Estas são as capacidades que precisam ser reproduzidas. Elas estão codificadas no repositório, não na memória de um chat.

### SK-01 — Descoberta de fonte oficial

**Objetivo:** encontrar pautas em páginas oficiais, sem depender de agregadores.

**Entradas:** `sources.yaml`, página inicial da fonte, palavras-chave de inclusão/exclusão.

**Saídas:** lista de candidatos com URL, título, data e score de descoberta.

**Arquivos:** `pipeline/extract.py`, `pipeline/scrape.py`, `sources.yaml`.

**Critério de aceite:** URL dentro dos domínios permitidos; `robots.txt` permite; a página abre sem login, CAPTCHA ou paywall.

**Falha comum:** usar portal de imprensa como se fosse fonte primária. Não fazer isso: imprensa e agregador só apontam para a URL oficial.

---

### SK-02 — Extração determinística de fatos

**Objetivo:** transformar a página oficial em fatos estruturados, sem interpretação do modelo.

**Entradas:** HTML/texto da página oficial.

**Saídas:** `ExtractedArticle` com `facts` (status, órgão, banca, UF, cidade, vagas, salários, taxa, datas, escolaridade, cadastro de reserva) e `body_text`.

**Arquivos:** `pipeline/extract.py`, `pipeline/text.py`, `pipeline/models.py`.

**Critério de aceite:** cada fato tem valor e, quando crítico, um trecho literal correspondente.

**Falha comum:** inferir salário, vagas ou data a partir de texto ambíguo. O correto é deixar o campo vazio e registrar a ausência.

---

### SK-03 — Ficha de evidências

**Objetivo:** provar cada fato crítico com um trecho que exista literalmente na fonte.

**Entradas:** fatos extraídos + texto-fonte.

**Saídas:** `article.verification` e `article.fact_evidence`, com `quote`, `sourceUrl`, `sourceTitle`, `method` e `confidence`.

**Arquivos:** `pipeline/verification.py`, `pipeline/manual.py`.

**Critério de aceite:** `criticalMissing` vazio; nota de evidência >= 95; nenhum bloqueio.

**Falha comum:** aceitar uma paráfrase como evidência. A citação precisa existir no texto, não apenas “combinar” com ele.

---

### SK-04 — Redação factual

**Objetivo:** escrever uma matéria jornalística clara usando somente fatos e trechos permitidos.

**Entradas:** fatos, evidências, texto-fonte, categorias existentes.

**Saídas:** título, resumo, corpo em Markdown, SEO, keywords, status, órgão, banca, UF, cidade e escolaridade.

**Arquivos:** `pipeline/editorial.py`, `pipeline/groq.py` (caminho automático), bundle manual (caminho preferido).

**Critério de aceite:** título de 30 a 160 caracteres; resumo de 60 a 300; corpo geralmente de 180 a 400 palavras (mínimo configurável de 200 no caminho manual); nenhuma afirmação sem respaldo.

**Falha comum:** “encher” o texto com contexto genérico, opinião, previsão ou “próximas etapas” que a fonte não traz. O validador bloqueia ou penaliza.

---

### SK-05 — Validação editorial

**Objetivo:** reprovar números, datas, valores, status, links, categorias e alegações de alto risco sem respaldo.

**Entradas:** matéria escrita + fatos + texto-fonte + categorias do Sanity.

**Saídas:** `warnings`, `score` e lista de bloqueios.

**Arquivos:** `pipeline/editorial.py`, `pipeline/verification.py`.

**Critério de aceite:** fact-check >= 90; evidência >= 95; `blocking` vazio; `ready=True`.

**Falha comum:** baixar o limiar para “passar” um texto ruim. O correto é corrigir o texto ou a evidência; nunca relaxar a trava.

---

### SK-06 — Deduplicação e cooldown

**Objetivo:** impedir URL repetida, matéria duplicada e cobertura do mesmo concurso antes de 15 dias.

**Entradas:** posts e rascunhos existentes no Sanity + candidato novo.

**Saídas:** `duplicate` com motivo e documento correspondente, ou liberação para criar.

**Arquivos:** `pipeline/dedupe.py`.

**Critério de aceite:** nenhuma URL normalizada repetida; nenhum `contestKey` coberto nos últimos 15 dias; título com similaridade < 90%.

**Falha comum:** achar que o cooldown é uma sugestão. Ele é uma trava de código. Depois de 15 dias, a nova matéria só é permitida se trouxer informação relevante nova — essa parte é julgamento humano, não do código.

---

### SK-07 — Criação de rascunho no Sanity

**Objetivo:** gravar a matéria como `drafts.*`, com toda a rastreabilidade, sem publicar.

**Entradas:** documento validado.

**Saídas:** documento `drafts.<slug>` com `reviewStatus=pending`, `aiAssisted=true`, `sourceUrls`, `factSheet`, `verificationReport`, `contestKey`, `contentHash`, `pipelineRunId`.

**Arquivos:** `pipeline/runner.py`, `pipeline/sanity.py`, `pipeline/manual.py`.

**Critério de aceite:** `_id` começa com `drafts.`; `reviewStatus=pending`; `verificationStatus=verified`; nenhum post publicado é alterado.

**Falha comum:** tentar “corrigir” um rascunho sobrescrevendo o documento. O pipeline usa `createIfNotExists`; rascunho existente não é sobrescrito.

---

### SK-08 — Operação diária

**Objetivo:** manter uma cadência previsível de pauta, redação, revisão e publicação.

**Entradas:** fontes oficiais e fila do dia anterior.

**Saídas:** `queue.json`, `queue.md`, log, bundles e rascunhos.

**Arquivos:** `pipeline/daily.py`, `scripts/daily.ps1`, `scripts/register-daily-task.ps1`, `docs/rotina-diaria.md`.

**Critério de aceite:** fila gerada às 08:00 sem Groq e sem escrita no Sanity; triagem de 3 a 5 pautas por dia; nenhum rascunho parado por mais de 7 dias sem decisão.

**Falha comum:** transformar a fila em publicação automática. Ela é só preparação.

---

### SK-09 — Auditoria e backup

**Objetivo:** conseguir provar o que foi publicado, de onde veio e como restaurar.

**Entradas:** bundles, relatórios, export do Sanity, código e segredos.

**Saídas:** backup versionado e relatório de verificação.

**Arquivos:** `data/manual_runs/`, `data/manual_articles/`, `data/daily/`, `concursos-sanity-backend/backups/`.

**Critério de aceite:** é possível reconstruir um artigo a partir do bundle (texto-fonte + fatos + evidências + matéria) sem depender da página original.

**Falha comum:** confiar só no Git. `data/` e `.env.local` são ignorados pelo Git; precisam de backup separado.

---

### SK-10 — Revisão humana

**Objetivo:** decidir se o rascunho pode ser publicado.

**Entradas:** rascunho no Studio.

**Saídas:** `approved` + publicação manual, ou `rejected` com motivo.

**Critério de aceite:** o revisor conferiu a fonte oficial, o `factSheet`, o `verificationReport` e os dados do concurso.

**Falha comum:** publicar para “corrigir depois”. Não publique sem conferir; o custo de uma correção pública é maior.

---

## 5. Ferramentas, versões e ambiente

### 5.1 Versões verificadas em 23/10/2026

| Ferramenta | Versão | Uso |
|---|---|---|
| Python | 3.12.6 | Runtime do pipeline |
| Scrapling | 0.5 | Fetcher HTTP |
| Beautiful Soup 4 | 4.15.0 | Parse HTML |
| lxml | 6.1.3 | Parser HTML |
| PyYAML | 6.0.3 | Leitura de `sources.yaml` |
| python-dotenv | 1.2.4 | Leitura de `.env.local` |
| Node.js | v22.16.0 | Frontend e Studio |
| npm | 10.9.2 | Dependências Node |
| Git | 2.49.0 | Versionamento |
| Sanity API | `2026-07-25` | Content Lake |
| Groq | modelo padrão `openai/gpt-oss-120b` | Redação automática opcional |

O venv usado neste ambiente fica em `G:\opencode-work\scrapling-venv`. Ele não é versionado; recrie com os comandos da seção 8.

### 5.2 Ferramentas do agente (OpenCode)

O trabalho foi feito no OpenCode, com ferramentas de leitura/escrita de arquivos, shell, busca e edição. As principais:

| Ferramenta | Uso neste projeto |
|---|---|
| `read` | Ler código, docs, schemas e relatórios |
| `write` / `edit` | Criar e corrigir código, docs e bundles |
| `glob` / `grep` | Localizar arquivos, símbolos e trechos |
| `shell` | Rodar testes, pipeline, Git e PowerShell |
| `webfetch` / `websearch` | Conferir fontes e documentação oficial |
| `subagent` | Pesquisas paralelas e exploração de código |
| `browser` | Pré-visualizar arquivos e abrir páginas, quando necessário |
| `question` | Decisões pontuais com o usuário |

**Skills de vídeo do ambiente** (`hyperframes`, `hyperframes-*`, `general-video`, `media-use`, `criar-video-drawflow`) **não fazem parte da produção de artigos**. Elas existem para vídeo/animação. A skill `opencode` serve para entender o harness; a skill `report` serve para abrir issues. Nenhuma delas substitui as regras editoriais deste repositório.

> Para replicar a produção editorial, copie o repositório e os documentos. Não dependa de uma skill externa ou de memória de conversa.

### 5.3 O que é código e o que é modelo

| Etapa | Determinística? | Quem decide |
|---|---|---|
| Descoberta | Sim | Código |
| Extração de fatos | Sim | Código |
| Evidência literal | Sim | Código |
| Redação | Não | Assistente/editor ou Groq |
| Validação de números/datas/status | Sim | Código |
| Deduplicação/cooldown | Sim | Código |
| Publicação | Não | Humano |

Essa separação é o principal mecanismo anti-alucinação: o modelo não é autoridade factual; ele só reescreve o que já foi extraído e comprovado.

---

## 6. Contrato editorial

### 6.1 Regra de ouro

1. Só fonte oficial gera artigo.
2. Cada fato crítico precisa de trecho literal.
3. Fato crítico sem evidência bloqueia o rascunho.
4. Conflito entre fontes oficiais bloqueia até resolução humana.
5. Portal de imprensa/agregador nunca confirma número, data, salário ou status.
6. `robots.txt` é obrigatório; não contornar CAPTCHA, login, paywall ou antibot.
7. `AUTO_PUBLISH` é ignorado; a publicação é sempre humana.

### 6.2 Especificações de formato

| Campo | Regra |
|---|---|
| Título | 30 a 160 caracteres; sem clickbait; órgão + fato principal |
| Resumo (`excerpt`) | 60 a 300 caracteres; objetivo |
| Corpo | 180 a 400 palavras em geral; mínimo de 200 no caminho manual |
| SEO description | Até 155 caracteres |
| Keywords | Até 8 |
| Categorias | 1 a 4 slugs existentes no Sanity |
| Status | `aberto`, `previsto`, `em_andamento` ou `encerrado` |
| Datas | ISO no bundle (`AAAA-MM-DD`); o Sanity exibe `DD/MM/AAAA` |
| Valores | Número no bundle; texto em reais somente se estiver na fonte |
| Fonte | URL oficial, distinta de qualquer URL já usada |
| `contestKey` | Estável e único por certame |

### 6.3 Regras de redação

- Abra com o fato principal e o órgão.
- Explique o que foi publicado, quem é afetado e o que muda.
- Use subtítulos `##` somente quando houver mais de dois blocos.
- Liste datas, valores e requisitos **somente** se estiverem nos fatos.
- Se um dado não existe, omita ou escreva “não divulgado” com parcimônia.
- Não copie parágrafos do texto oficial; reescreva.
- Não escreva opinião, previsão, promessa, frase de efeito ou conclusão genérica.
- Não atribua informação ao “edital” se o edital não for citado na fonte.
- Não descreva etapas, provas ou cronograma como se estivessem confirmados.
- Se o status não for `aberto`, não escreva “inscrições abertas”, “abriu inscrições” ou equivalente.
- Não trate “cadastro de reserva” como “não há vagas” se a fonte não disser isso.
- Não acrescente requisitos, escolaridade, idade, experiência, registro profissional ou especialidades sem respaldo.
- Não inclua links externos que não sejam da fonte oficial ou do portal.
- Feche com uma frase objetiva, sem opinião.

### 6.4 Alegações de alto risco

O validador trata como risco e pode bloquear:

- número de vagas, valor monetário, data ou link sem respaldo;
- status divergente do fato extraído;
- “inscrições abertas” quando o status não é `aberto`;
- “vagas efetivas” quando o fato é “somente cadastro de reserva”;
- “apenas cadastro de reserva” quando há vagas efetivas;
- requisitos, público-alvo, escolaridade, especialidades ou edital sem respaldo;
- cronograma, etapas, provas, gabarito, resultado, homologação ou convocação sem respaldo;
- citação literal longa sem respaldo;
- previsão/prognóstico (“espera-se”, “provavelmente”, “deve ocorrer”, “em breve”);
- “próximas etapas” ou “próximos passos” sem respaldo;
- opinião/conclusão genérica (“demonstra compromisso”, “oportunidade relevante”);
- link externo fora do domínio da fonte/portal.

### 6.5 Fatos críticos

O conjunto `CRITICAL_FACTS` em `pipeline/verification.py` inclui:

```text
organ
status
vacancies_total
salary_min
salary_max
registration_fee
enrollment_start_date
enrollment_end_date
exam_date
banca
state_uf
city_name
education_level
is_cr_only
has_exemption
```

`sphere` pode ser inferida, mas fica registrada como `inferred` para revisão. Booleanos `false` (`is_cr_only`, `has_exemption`) não exigem citação negativa; a ausência do campo já representa “não”.

### 6.6 Como a evidência é conferida

No caminho manual, `pipeline/manual.py` normaliza espaços e compara a citação com o `source_text` em caixa baixa. Se a citação não existir literalmente, o item é rejeitado com erro. No caminho automático, `pipeline/verification.py` procura o número/data/termo e captura uma janela de contexto como trecho.

A nota de evidência é:

```text
100 - 22 × (fatos críticos sem evidência) - 2 × (outros fatos sem evidência)
```

O mínimo padrão é **95/100**. Qualquer bloqueio derruba o rascunho mesmo com nota alta.

---

## 7. Como o pipeline funciona por dentro

### 7.1 Descoberta

`pipeline/extract.py` implementa conectores por tipo de fonte:

- `govbr_news`: lista de notícias do INSS, com palavras-chave e exclusões;
- `vunesp`: listagem de inscrições abertas e códigos de concurso;
- `fgv`: listagem de concursos, processos seletivos e exames;
- `dou_inlabs`: importação local de XML/ZIP oficial.

`pipeline/scrape.py` usa `FetcherSession(impersonate="chrome")`, respeita `robots.txt`, faz atraso entre requisições, tenta novamente em 429/5xx e decodifica o corpo bruto para evitar mojibake.

### 7.2 Extração

O extrator lê título, resumo, corpo, imagem e metadados, e então aplica regras determinísticas para:

- status (`aberto`, `previsto`, `em_andamento`, `encerrado`);
- órgão, banca, UF e cidade;
- vagas totais, salários e taxa;
- datas de inscrição e prova;
- escolaridade;
- cadastro de reserva e isenção.

Quando o texto é ambíguo, o campo fica vazio. O pipeline prefere um fato ausente a um fato inventado.

### 7.3 Evidência

`build_fact_evidence` monta a ficha automática. `pipeline/manual.py` monta a ficha manual a partir das citações declaradas no bundle. Em ambos os casos, o resultado vai para:

- `verificationReport` (nota, fatos totais, fatos com evidência, críticos ausentes, bloqueios, avisos);
- `factSheet` (uma linha por fato, com `quote` e `sourceUrl`);
- `sourceUrls` (fonte oficial com `kind`, `usage`, `evidence` e `checkedAt`).

### 7.4 Redação

Há dois caminhos:

**Manual (preferido):** o assistente/editor escreve o bundle com `source_text`, `facts`, `evidence` e `article`. O pipeline valida e cria o rascunho. Não chama Groq.

**Automático:** `pipeline run` chama o Groq com o prompt de `pipeline/groq.py`, usando fatos e evidências como fonte autoritativa. Se a nota ficar abaixo do mínimo, tenta até dois reparos; se ainda falhar, não cria o rascunho.

O caminho manual é preferido quando se quer máxima qualidade e controle editorial. O caminho automático é útil para volume e para testar a esteira.

### 7.5 Validação

`pipeline/editorial.py` começa com 100 pontos e desconta por:

- título ausente/curto/longo ou clickbait;
- resumo ausente ou fora da faixa;
- corpo ausente/curto;
- valor monetário, vagas ou data sem respaldo;
- status divergente;
- órgão, banca, UF, cidade ou escolaridade divergentes;
- “inscrições abertas” incompatível com o status;
- contradição entre cadastro de reserva e vagas efetivas;
- requisitos, especialidades, edital, cronograma, etapas, provas, resultado ou citação sem respaldo;
- previsão, etapas futuras, opinião ou conclusão genérica;
- link externo fora do domínio permitido;
- status, escolaridade ou categoria inválidos;
- keywords ausentes;
- excesso de “não divulgado”.

O mínimo é **90/100**. O pipeline tenta reparos no caminho automático; no manual, o editor corrige o bundle e roda de novo.

### 7.6 Deduplicação e cooldown

`pipeline/dedupe.py` compara o candidato com todos os posts e rascunhos:

1. slug exato;
2. hash de conteúdo;
3. interseção de URLs normalizadas;
4. `contestKey` coberto nos últimos **15 dias**;
5. similaridade de título >= 90%.

A normalização de URL remove `www`, fragmento, barra final, parâmetros de rastreio (`utm_*`, `fbclid`, etc.) e ordena a query. Parâmetros funcionais e caminho são preservados.

Chaves de concurso:

| URL | Chave |
|---|---|
| `fgv.br/concursos/tjap26` | `fgv:tjap26` |
| `fgv.br/processoseletivo/inb2026` | `fgv:inb2026` |
| `fgv.br/exames/enac/4exame` | `fgv:enac:4exame` |
| `fgv.br/cpnu2` | `fgv:cpnu2` |
| `vunesp.com.br/SESA2601` | `vunesp:SESA2601` |
| `cebraspe.org.br/concurso/...` | `cebraspe:<codigo>` |
| notícia `gov.br/.../noticias/...` | `govbr:<host>/<caminho completo>` |
| outra página `gov.br` | `govbr:<host>/<4 primeiros segmentos>` |
| URL desconhecida | vazio (o bundle manual exige `contest_key` explícito) |

**Importante:** o código só aplica a janela de 15 dias. A regra “depois de 15 dias, só se houver informação relevante nova” é editorial e humana. O código não julga relevância.

### 7.7 Criação do rascunho

`pipeline/runner.py` monta o documento e `pipeline/sanity.py` grava. O documento tem:

| Campo | Conteúdo |
|---|---|
| `_id` | `drafts.<slug>` |
| `_type` | `post` |
| `title`, `slug`, `excerpt`, `body` | Conteúdo |
| `status`, `contestStatus` | Situação e fase |
| `organ`, `sphere`, `banca`, `stateUf`, `cityName`, `location` | Dados do concurso |
| `educationLevel`, `vacanciesTotal`, `salaryMin`, `salaryMax`, `registrationFee` | Dados estruturados |
| `hasExemption`, `isCrOnly`, `enrollmentStartDate`, `enrollmentEndDate`, `examDate` | Dados estruturados |
| `publishedAt` | No manual, data/hora da criação do rascunho |
| `author`, `categories`, `mainImage`, `seo` | Publicação |
| `reviewStatus` | `pending` |
| `aiAssisted` | `true` |
| `sourceUrls` | Fontes oficiais com evidência |
| `contentHash` | Hash do texto-fonte |
| `lastCheckedAt`, `pipelineRunId` | Auditoria |
| `contestKey` | Chave de deduplicação |
| `verificationStatus`, `verificationScore`, `verificationReport`, `factSheet` | Verificação |

O método `create_draft` só aceita `_id` com prefixo `drafts.`. `patch_document` e `delete_document` também só aceitam `drafts.*`. Não existe chamada de publicação no pipeline.

### 7.8 Revisão humana

No Studio (<https://concursos-agora.sanity.studio/>), o revisor deve:

1. abrir o rascunho;
2. conferir `factSheet`: cada linha tem `quote` e `sourceUrl`;
3. conferir `verificationReport.blocking` (deve estar vazio);
4. conferir `verificationStatus` (`verified`);
5. abrir a URL oficial e confirmar que o trecho existe;
6. conferir título, resumo, corpo, status, órgão, banca, UF, cidade, categorias, imagem e SEO;
7. alterar `reviewStatus` para `approved` somente depois da conferência;
8. publicar manualmente.

Se algo estiver errado, marcar `rejected` e registrar o motivo. Não publicar para corrigir depois.

### 7.9 Fila diária

`pipeline daily`:

- lê Sanity com `previewDrafts` (inclui rascunhos);
- descobre candidatos nas fontes habilitadas;
- aplica dedupe/cooldown;
- extrai fatos e evidências dos itens selecionados;
- grava `data/daily/AAAA-MM-DD/queue.json` e `queue.md`;
- lista rascunhos pendentes e destaca os mais antigos que `--stale-days` (padrão 7);
- **não chama Groq** e **não grava no Sanity**.

Status:

| Status | Significado | Ação |
|---|---|---|
| `ready` | Fatos críticos com evidência e nota suficiente | Pode redigir |
| `needs_review` | Falta evidência para algum fato crítico | Conferir a fonte antes de usar |
| `duplicate` | URL, hash, slug, título ou concurso já coberto | Não redigir |
| `queued` | Descoberto, mas o limite de extração foi atingido | Deixar para o próximo dia |
| `error` | Falha de coleta/extração | Ver log e tentar de novo |

---

## 8. Replicação passo a passo

### 8.1 Pré-requisitos

- Windows 10/11 com PowerShell 5.1 ou superior;
- Python 3.11+ (o ambiente atual usa 3.12.6);
- Node.js 20+ (o ambiente atual usa 22.16.0);
- Git;
- acesso ao projeto Sanity e um token com permissão de escrita;
- acesso às fontes oficiais pela internet;
- espaço em disco para o venv e para `data/`.

### 8.2 Clonar e instalar

```powershell
cd C:\Users\cleber.jose\Documents
git clone https://github.com/concursosagorabr-cell/concursosagoraprojetocompleto.git concursosagora
cd concursosagora
```

Crie o venv fora do disco `C:` se ele estiver apertado:

```powershell
python -m venv G:\opencode-work\scrapling-venv
G:\opencode-work\scrapling-venv\Scripts\python.exe -m pip install -r agente-artigos\requirements.txt
```

Instale o frontend e o Studio:

```powershell
cd concursosagora-main
npm install

cd ..\concursos-sanity-backend
npm install
```

### 8.3 Configurar segredos

O pipeline lê, nesta ordem:

1. `concursosagora-main/.env.local`
2. `agente-artigos/.env.local` (sobrescreve o anterior)

Variáveis mínimas:

```dotenv
NEXT_PUBLIC_SANITY_PROJECT_ID=<project-id>
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-07-25
SANITY_API_TOKEN=<token-de-escrita>
SANITY_API_READ_TOKEN=<token-de-leitura-opcional>
GROQ_API_KEY=<chave-opcional>
GROQ_MODEL=openai/gpt-oss-120b
AUTO_PUBLISH=false
FACT_CHECK_MIN_SCORE=90
VERIFICATION_MIN_SCORE=95
REQUIRE_OFFICIAL_SOURCE=true
REQUIRE_FACT_EVIDENCE=true
BLOCK_ON_FACT_CONFLICT=true
CONTEST_COOLDOWN_DAYS=15
MIN_CONTENT_WORDS=200
PIPELINE_RESPECT_ROBOTS=true
PIPELINE_REQUEST_DELAY=1.0
PIPELINE_FETCH_TIMEOUT=60
PIPELINE_MAX_SOURCE_CHARS=14000
DOU_IMPORT_DIR=data/dou
FRONTEND_URL=https://www.concursosagora.com.br
```

Nunca faça commit de `.env.local`. Use um gerenciador de senhas para guardar os valores.

### 8.4 Validar o ambiente

```powershell
cd agente-artigos
G:\opencode-work\scrapling-venv\Scripts\python.exe -m pipeline doctor
G:\opencode-work\scrapling-venv\Scripts\python.exe -m pipeline sources
G:\opencode-work\scrapling-venv\Scripts\python.exe -m pipeline sources --registry
```

Testes offline:

```powershell
G:\opencode-work\scrapling-venv\Scripts\python.exe -m compileall -q pipeline
G:\opencode-work\scrapling-venv\Scripts\python.exe -m unittest discover -s tests -v
```

Resultado esperado: **75 testes OK** e `compileall OK`.

### 8.5 Sanity: schema e Studio

```powershell
cd ..\concursos-sanity-backend
npm run schema:validate
npm run build
npm run deploy -- --url concursos-agora --yes
```

O Studio usa o host `concursos-agora` e o projeto/dataset configurados em `sanity.config.ts` e `sanity.cli.ts`. Se estiver reconstruindo do zero, rode também:

```powershell
npm run configure:cors
npm run setup:webhook
```

### 8.6 Primeira fila

```powershell
cd ..\agente-artigos
.\scripts\daily.ps1
```

Ou:

```powershell
G:\opencode-work\scrapling-venv\Scripts\python.exe -m pipeline daily --sources all --limit 8 --max-extract 12
```

Abra `data/daily/AAAA-MM-DD/queue.md` e faça a triagem.

### 8.7 Primeiro bundle manual

1. Escolha um item `ready` (ou um `needs_review` que você conferiu na fonte).
2. Abra a URL oficial.
3. Salve o texto-fonte relevante (mínimo 250 caracteres).
4. Preencha `facts` e `evidence` com citações literais.
5. Escreva `article` (título, resumo, corpo, SEO, keywords, categorias).
6. Defina `contest_key` e `sources`.

Modelo mínimo na seção 9. O bundle completo de referência está em `data/manual_articles/bundle_2026-10-22.json` (ignorado pelo Git; faça backup separado).

### 8.8 Dry-run e aplicação

```powershell
G:\opencode-work\scrapling-venv\Scripts\python.exe -m pipeline manual --bundle data\manual_articles\bundle_AAAA-MM-DD.json
```

O dry-run precisa terminar com:

- `errors: 0`;
- fact-check >= 90 em todos os itens;
- evidência >= 95;
- `blocking` vazio;
- `ready=True`.

Se estiver tudo certo:

```powershell
G:\opencode-work\scrapling-venv\Scripts\python.exe -m pipeline manual --bundle data\manual_articles\bundle_AAAA-MM-DD.json --apply
```

O comando cria somente `drafts.*` com `reviewStatus=pending`. O resumo fica em `data/manual_runs/<run_id>-dry-run.json` ou `-apply.json`.

### 8.9 Revisão e publicação

Abra o Studio, siga o checklist da seção 7.8 e publique manualmente. O pipeline não publica.

### 8.10 Agendar a fila

```powershell
.\scripts\register-daily-task.ps1 -Time "08:00"
```

Conferir:

```powershell
Get-ScheduledTask -TaskName "Concursos Agora - Fila Editorial"
```

Rodar manualmente:

```powershell
Start-ScheduledTask -TaskName "Concursos Agora - Fila Editorial"
```

Remover:

```powershell
Unregister-ScheduledTask -TaskName "Concursos Agora - Fila Editorial" -Confirm:$false
```

A tarefa só monta a fila. Ela não chama Groq, não cria rascunhos e não publica.

---

## 9. Bundle manual: referência completa

### 9.1 Exemplo

```json
{
  "run_id": "manual-2026-10-23",
  "articles": [
    {
      "contest_key": "fgv:exemplo26",
      "contest_phase": "edital_publicado",
      "source": {
        "id": "fgv",
        "name": "FGV Conhecimento",
        "url": "https://conhecimento.fgv.br/concursos/exemplo26",
        "title": "Edital do concurso de exemplo",
        "summary": "Resumo objetivo da página oficial.",
        "source_text": "Texto integral ou trecho suficientemente longo da página oficial, contendo literalmente as citações usadas em evidence. O texto precisa ter pelo menos 250 caracteres.",
        "tier": "official_primary"
      },
      "facts": {
        "status": "aberto",
        "organ": "Órgão responsável",
        "banca": "FGV",
        "state_uf": "SP",
        "city_name": "São Paulo",
        "sphere": "ESTADUAL",
        "vacancies_total": 100,
        "salary_min": 5000.0,
        "salary_max": 12000.0,
        "registration_fee": 100.0,
        "enrollment_start_date": "2026-11-01",
        "enrollment_end_date": "2026-12-01",
        "exam_date": "2027-01-15",
        "education_level": ["superior"],
        "is_cr_only": false,
        "has_exemption": true
      },
      "evidence": {
        "status": "trecho literal que comprova o status",
        "organ": "trecho literal com o nome do órgão",
        "banca": "trecho literal com o nome da banca",
        "state_uf": "trecho literal com a UF",
        "city_name": "trecho literal com o município",
        "vacancies_total": "trecho literal com o número de vagas",
        "salary_min": "trecho literal com o valor mínimo",
        "salary_max": "trecho literal com o valor máximo",
        "registration_fee": "trecho literal com a taxa",
        "enrollment_start_date": "trecho literal com a data de início",
        "enrollment_end_date": "trecho literal com a data final",
        "exam_date": "trecho literal com a data da prova",
        "education_level": ["trecho literal com a escolaridade"],
        "has_exemption": "trecho literal com a isenção"
      },
      "article": {
        "title": "Título de até 160 caracteres",
        "excerpt": "Resumo de 60 a 300 caracteres.",
        "body_markdown": "Corpo em Markdown, com 180 a 400 palavras em geral.",
        "seo_description": "Descrição de até 155 caracteres.",
        "keywords": ["concurso", "vagas", "edital"],
        "category_slugs": ["judiciario", "tj", "sp"],
        "status": "aberto",
        "organ": "Órgão responsável",
        "banca": "FGV",
        "state_uf": "SP",
        "city_name": "São Paulo",
        "education_level": ["superior"]
      },
      "sources": [
        {
          "title": "Página oficial do concurso",
          "url": "https://conhecimento.fgv.br/concursos/exemplo26",
          "kind": "official_primary",
          "usage": "facts",
          "evidence": "Trecho literal usado como base."
        }
      ]
    }
  ]
}
```

### 9.2 Campos obrigatórios e regras

| Campo | Obrigatório? | Regra |
|---|---|---|
| `run_id` | Recomendado | Nome do run; usado nos relatórios |
| `articles` | Sim | Lista não vazia |
| `contest_key` | Sim | Estável, único, minúsculo; ex.: `fgv:tjap26` |
| `source.url` | Sim | URL oficial |
| `source.source_text` | Sim | >= 250 caracteres; contém todas as citações |
| `source.title` | Sim | >= 8 caracteres |
| `facts` | Sim | Fonte autoritativa dos campos |
| `evidence` | Sim | Uma citação literal por fato crítico |
| `article.title` | Sim | 30–160 caracteres |
| `article.excerpt` | Sim | 60–300 caracteres |
| `article.body_markdown` | Sim | >= 200 palavras no caminho manual |
| `article.seo_description` | Recomendado | <= 155 caracteres |
| `article.keywords` | Recomendado | Até 8 |
| `article.category_slugs` | Sim | 1–4 slugs existentes |
| `sources` | Recomendado | Todas oficiais; `kind` official_primary/secondary |
| `contest_phase` | Opcional | Um dos valores válidos |

Valores válidos de `contest_phase`:

```text
aguardando_autorizacao
autorizado
comissao_formada
ato_intermediario
edital_publicado
inscricoes_abertas
provas_aplicadas
resultado_publicado
encerrado
```

### 9.3 Erros comuns do bundle

| Erro | Causa | Correção |
|---|---|---|
| `fonte não oficial` | URL fora dos sufixos aceitos | Usar `.gov.br`, `.jus.br`, `.leg.br`, `.mp.br`, `fgv.br`, `vunesp.com.br` ou `cebraspe.org.br` |
| `texto-fonte muito curto` | Menos de 250 caracteres | Salvar mais conteúdo oficial |
| `evidência de 'x' não aparece literalmente` | Citação parafraseada ou com trecho alterado | Copiar o trecho exato |
| `categoria inexistente no Sanity` | Slug errado | Consultar o Studio ou `doctor` |
| `duplicado: URL de origem já existe` | URL já usada | Escolher outra URL oficial ou esperar |
| `mesmo concurso já coberto nos últimos 15 dias` | Cooldown | Esperar ou comprovar informação nova após o prazo |
| `fact-check abaixo do mínimo` | Texto com dados sem respaldo, opinião etc. | Corrigir o texto; não baixar o limiar |
| `verificação bloqueou` | Fato crítico sem evidência ou divergência | Completar a evidência ou corrigir o fato |

---

## 10. Comandos de operação

### 10.1 Diagnóstico

```powershell
python -m pipeline doctor
python -m pipeline doctor --test-groq
python -m pipeline doctor --fetch-source fgv
python -m pipeline sources
python -m pipeline sources --registry
python -m pipeline stats
```

### 10.2 Descoberta e verificação

```powershell
python -m pipeline discover --source inss --limit 5
python -m pipeline discover --source vunesp --limit 5
python -m pipeline discover --source fgv --limit 5

python -m pipeline verify --source fgv --url https://conhecimento.fgv.br/concursos/tjap26
python -m pipeline verify --source vunesp --url https://www.vunesp.com.br/SESA2601 --json

python -m pipeline run --url "https://conhecimento.fgv.br/concursos/pcpr26" --dry-run
```

### 10.3 Fila diária

```powershell
python -m pipeline daily --sources all --limit 8 --max-extract 12
python -m pipeline daily --sources fgv --limit 5 --no-extract
.\scripts\daily.ps1
```

### 10.4 Bundle manual

```powershell
python -m pipeline manual --bundle data\manual_articles\bundle_2026-10-23.json
python -m pipeline manual --bundle data\manual_articles\bundle_2026-10-23.json --apply
```

### 10.5 DOU

```powershell
python -m pipeline discover --source dou --dou-file data\dou\DO3-2026-10-22.zip --date 22-10-2026 --limit 10
python -m pipeline run --source dou --dou-file data\dou\DO3-2026-10-22.zip --date 22-10-2026 --limit 1 --dry-run
```

### 10.6 Limpeza

```powershell
python -m pipeline delete-draft --id "drafts.exemplo" --yes
```

Use com cuidado: só remove rascunhos, nunca posts publicados.

---

## 11. Qualidade: notas, bloqueios e diagnóstico

### 11.1 Duas notas diferentes

| Nota | O que mede | Mínimo | Onde |
|---|---|---|---|
| Fact-check | Forma, tamanho, números, datas, status, alegações | 90 | `editorial.py` |
| Evidência | Cobertura literal dos fatos críticos | 95 | `verification.py` |

Um texto pode ter 100/100 de forma e ser bloqueado por falta de evidência. A nota de evidência é a trava principal.

### 11.2 O que fazer quando o dry-run falha

1. Leia o `message` do item no resumo.
2. Se for evidência, volte à fonte e copie o trecho exato.
3. Se for número/data, confira o valor no texto-fonte e no `facts`.
4. Se for status, confira a fase real do certame.
5. Se for categoria, consulte os slugs existentes.
6. Se for duplicidade, escolha outra pauta ou aguarde o cooldown.
7. Rode o dry-run de novo.
8. Só use `--apply` com `errors: 0`.

### 11.3 O que não fazer

- Não baixar `FACT_CHECK_MIN_SCORE` para fazer um texto passar.
- Não baixar `VERIFICATION_MIN_SCORE`.
- Não remover uma citação porque “o texto está bom”.
- Não publicar um rascunho com `verificationStatus=blocked`.
- Não reutilizar URL para “aproveitar” uma pauta.
- Não cobrir o mesmo concurso antes de 15 dias.
- Não usar portal de imprensa como fonte de número.
- Não contornar `robots.txt`, CAPTCHA, login ou paywall.

---

## 12. Caso real: os 10 artigos de 22/10/2026

### 12.1 Temas

| # | Concurso | `contestKey` | Fonte |
|---|---|---|---|
| 1 | TJAP — Juiz Substituto | `fgv:tjap26` | `https://conhecimento.fgv.br/concursos/tjap26` |
| 2 | TJPB — Analista Judiciário | `fgv:tjpb26` | `https://conhecimento.fgv.br/concursos/tjpb26` |
| 3 | TJSC — Juiz Substituto | `fgv:tjscjuiz26` | `https://conhecimento.fgv.br/concursos/tjscjuiz26` |
| 4 | TRF5 — Juiz Federal Substituto | `fgv:trf5juiz26` | `https://conhecimento.fgv.br/concursos/trf5juiz26` |
| 5 | SEPLAG-RJ — EPPGG/APO | `fgv:seplagrj` | `https://conhecimento.fgv.br/concursos/seplagrj` |
| 6 | SES-TO | `fgv:sesto26` | `https://conhecimento.fgv.br/concursos/sesto26` |
| 7 | INB — cadastro de reserva | `fgv:inb2026` | `https://conhecimento.fgv.br/processoseletivo/inb2026` |
| 8 | ENAC 2026.2 | `fgv:enac:2026.2` | `https://conhecimento.fgv.br/exames/enac/4exame` |
| 9 | CPNU 2 — anulação | `fgv:cpnu2` | `https://conhecimento.fgv.br/cpnu2` |
| 10 | HUEM — Residência Médica 2027 | `fgv:huem26` | `https://conhecimento.fgv.br/reshuem26` |

### 12.2 Método

1. A página oficial da FGV foi aberta e o texto relevante foi salvo em arquivo local.
2. Um script (`data/manual_articles/bundle_2026-10-22_src/`) montou o bundle, verificando:
   - texto-fonte com pelo menos 250 caracteres;
   - citação literal para cada fato;
   - `contest_key` único;
   - URL de fonte única.
3. O assistente escreveu os 10 artigos sem chamar Groq.
4. O pipeline rodou `manual` em dry-run e depois `--apply`.
5. Todos os itens passaram com fact-check 100/100 e evidência 100/100.
6. Os 10 rascunhos foram criados como `drafts.*`, `reviewStatus=pending`, `aiAssisted=true`.
7. Nenhum dos 16 posts publicados foi alterado.

### 12.3 Resultado

| Métrica | Valor |
|---|---|
| Rascunhos criados | 10 |
| Posts publicados preservados | 16 |
| URLs oficiais distintas | 10 |
| Fact-check | 100/100 em todos |
| Evidência | 100/100 em todos |
| Palavras | 204–281 |
| Categorias | Conferidas contra o bundle |
| Publicação automática | Nenhuma |

### 12.4 Artefatos

- Bundle aplicado: `agente-artigos/data/manual_articles/bundle_2026-10-22.json`
- Relatório final: `agente-artigos/data/manual_runs/manual-2026-10-22-final-report.md`
- Relatório JSON: `agente-artigos/data/manual_runs/manual-2026-10-22-final-report.json`
- Verificação final: `agente-artigos/data/manual_runs/verify_final_2026-10-22.json`
- Scripts de montagem: `agente-artigos/data/manual_articles/bundle_2026-10-22_src/`

> Esses arquivos estão em `data/`, que é ignorado pelo Git. Eles são parte do backup editorial e devem ser copiados separadamente.

### 12.5 Lições

- A FGV foi escolhida porque as páginas são estáticas, oficiais, ricas em fatos e acessíveis, o que facilita a captura de evidência literal.
- O bundle com `source_text` embutido é autossuficiente: a auditoria não depende de a página continuar igual.
- O caminho manual com validação determinística produz menos retrabalho do que o caminho automático para pautas de alto risco.
- A maior parte do tempo foi gasta em conferir fonte e evidência, não em “escrever bonito”. É exatamente onde deve estar.

---

## 13. Backup e recuperação

### 13.1 O que precisa ser backupado

| Item | Onde | Por quê | Frequência |
|---|---|---|---|
| Código | repositório Git | Reconstruir pipeline, frontend e Studio | A cada mudança |
| Segredos | `.env.local` / gerenciador de senhas | Sanity, Groq, Brevo, webhook | A cada rotação |
| Dataset Sanity | export NDJSON/tar.gz | Conteúdo, drafts, categorias, autores | Semanal/mensal |
| Bundles manuais | `agente-artigos/data/manual_articles/` | Fonte + fatos + evidências + matéria | A cada lote |
| Relatórios | `agente-artigos/data/manual_runs/` | Auditoria e prova de validação | A cada lote |
| Fila diária | `agente-artigos/data/daily/` | Histórico de descoberta e triagem | Diária/semanal |
| SQLite | `agente-artigos/data/pipeline.db` | Histórico de execuções | Semanal |
| Cache de imagens | `agente-artigos/data/assets.json` | Evitar reupload | Semanal |
| Schemas/Studio | `concursos-sanity-backend/` | Reimplantar o Studio | A cada mudança |
| Tarefa agendada | Windows Task Scheduler | Recriar a rotina | Após configurar |
| Configuração de deploy | Vercel/Sanity | Reimplantar frontend/Studio | A cada mudança |

### 13.2 Backup do código

```powershell
cd C:\Users\cleber.jose\Documents\concursosagora
git status
git add .
git commit -m "Backup do pipeline editorial e documentação"
git push origin main
```

> No momento da redação deste manual, havia alterações locais não commitadas. Confirme com `git status` antes de considerar o GitHub como backup. Se o objetivo for um snapshot imutável, crie uma tag:
>
> ```powershell
> git tag -a editorial-2026-10-23 -m "Snapshot do pipeline editorial"
> git push origin editorial-2026-10-23
> ```

### 13.3 Backup do dataset Sanity

Backup de documentos em NDJSON (script do repositório):

```powershell
cd concursos-sanity-backend
npm run export:dataset
```

O arquivo vai para `backups/dataset-production-<timestamp>.ndjson`.

Para um backup completo, incluindo assets, use o CLI do Sanity:

```powershell
npx sanity dataset export production backups\dataset-production-completo.tar.gz
```

Guarde o arquivo fora do repositório e com acesso restrito.

### 13.4 Backup dos dados editoriais

```powershell
cd C:\Users\cleber.jose\Documents\concursosagora
Compress-Archive `
  -Path agente-artigos\data\manual_articles, `
        agente-artigos\data\manual_runs, `
        agente-artigos\data\daily, `
        agente-artigos\data\pipeline.db, `
        agente-artigos\data\assets.json `
  -DestinationPath backup-editorial-2026-10-23.zip
```

Feche processos que estejam usando o SQLite antes de copiar. Se preferir, copie a pasta `data/` inteira.

### 13.5 Backup dos segredos

Guarde em um gerenciador de senhas:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_SANITY_API_VERSION`
- `SANITY_API_TOKEN`
- `SANITY_API_READ_TOKEN`
- `GROQ_API_KEY` (se usar o caminho automático)
- `GROQ_MODEL`
- `SANITY_REVALIDATE_SECRET`
- `BREVO_API_KEY` (se usar newsletter)
- `FRONTEND_URL`
- `DOU_IMPORT_DIR`

Não guarde esses valores em documentos, issues, prints ou mensagens.

### 13.6 Backup da tarefa agendada

```powershell
Export-ScheduledTask -TaskName "Concursos Agora - Fila Editorial" |
  Out-File -Encoding UTF8 tarefa-fila-editorial.xml
```

Para restaurar em outra máquina, o caminho mais simples é rodar novamente:

```powershell
.\scripts\register-daily-task.ps1 -Time "08:00"
```

### 13.7 Ordem de restauração

1. Clonar o repositório e checkout da tag/commit correto.
2. Restaurar os `.env.local` a partir do gerenciador de senhas.
3. Criar o venv e instalar `requirements.txt`.
4. Rodar `npm install` no frontend e no Studio.
5. Restaurar o dataset Sanity (se necessário).
6. Restaurar a pasta `data/` (bundles, relatórios, fila, SQLite).
7. Rodar `python -m pipeline doctor`.
8. Rodar `python -m unittest discover -s tests -v`.
9. Rodar um dry-run de um bundle conhecido.
10. Reimplantar o Studio (`npm run deploy`).
11. Reconfigurar CORS/webhook, se necessário.
12. Registrar a tarefa agendada.
13. Fazer uma fila de teste e conferir o Studio.

### 13.8 Cenários de desastre

| Cenário | Impacto | Recuperação |
|---|---|---|
| Máquina perdida | Perde código, dados locais e tarefa | Git + backup de `data/` + segredos + recriar tarefa |
| Dataset Sanity perdido/corrompido | Perde conteúdo e drafts | Importar backup NDJSON/tar.gz; conferir assets |
| Token vazado | Risco de escrita indevida | Revogar token, criar novo, atualizar `.env.local`, auditar logs |
| Bundle perdido | Perde a prova de evidência | Recriar a partir da fonte oficial; se a página mudou, usar backup do bundle |
| Pipeline quebrado | Fila para de rodar | `doctor`, testes, logs, `git bisect`; voltar para tag estável |
| Fonte mudou/robots bloqueou | Coleta falha | Desativar fonte em `sources.yaml`; usar outra oficial; não contornar |
| Rascunho publicado por engano | Conteúdo inadequado no ar | Despublicar no Studio, restaurar versão anterior, revalidar; registrar incidente |
| SQLite corrompido | Perde histórico local | Restaurar backup; o pipeline manual não depende dele |

### 13.9 Segurança e conformidade

- Não versionar `.env.local`, tokens, backups ou dados pessoais.
- Usar token Sanity com o menor escopo possível.
- Rotacionar tokens periodicamente e após qualquer suspeita.
- Respeitar `robots.txt`, termos de uso e direito autoral.
- Não copiar textos, fotos ou tabelas de portais; reescrever a partir de fatos oficiais.
- Não contornar CAPTCHA, login, paywall ou bloqueio antibot.
- Tratar dados de newsletter conforme a LGPD.
- Restringir acesso aos backups do Sanity, que podem conter drafts e dados internos.

---

## 14. Checklist de replicação

### Ambiente

- [ ] Repositório clonado no commit/tag correto.
- [ ] Python 3.11+ instalado.
- [ ] Venv criado e `requirements.txt` instalado.
- [ ] Node.js e npm instalados.
- [ ] `npm install` no frontend e no Studio.
- [ ] `.env.local` restaurado com Sanity e, se necessário, Groq.
- [ ] `python -m pipeline doctor` sem erros.
- [ ] `python -m unittest discover -s tests -v` com 75 testes OK.

### Sanity

- [ ] Schema validado (`npm run schema:validate`).
- [ ] Studio buildado e publicado.
- [ ] CORS configurado.
- [ ] Webhook de revalidação configurado.
- [ ] Autor, categorias e biblioteca de imagens existem.
- [ ] Token com permissão de escrita funciona.

### Operação

- [ ] `sources.yaml` revisado.
- [ ] `robots.txt` das fontes conferido.
- [ ] Fila diária gerada.
- [ ] Itens `ready` triados.
- [ ] Itens `needs_review` conferidos na fonte.
- [ ] Bundle do dia escrito.
- [ ] Dry-run com `errors: 0`.
- [ ] Fact-check >= 90 e evidência >= 95.
- [ ] `blocking` vazio.
- [ ] `--apply` executado.
- [ ] Rascunhos conferidos no Studio.
- [ ] Publicação manual feita.
- [ ] Tarefa agendada registrada.

### Backup

- [ ] Código commitado e enviado ao GitHub.
- [ ] Tag de snapshot criada (opcional).
- [ ] Dataset Sanity exportado.
- [ ] Bundles e relatórios copiados.
- [ ] `data/pipeline.db` copiado.
- [ ] Segredos guardados no gerenciador de senhas.
- [ ] Tarefa agendada exportada ou recriável.
- [ ] Restauração testada em ambiente separado.

---

## 15. Limitações conhecidas

- **PDFs de edital** ainda não são extraídos automaticamente. Quando o dado crítico só existe no PDF, o fato fica sem evidência e o rascunho é bloqueado. O caminho manual pode incluir o texto do PDF no `source_text`.
- **Páginas com JavaScript/Cloudflare** não são suportadas. Cebraspe e IDECAN, por exemplo, ficam fora do MVP.
- **A ficha automática é conservadora** e não entende ironia, negação complexa ou tabelas. Ela pode bloquear um fato verdadeiro; a revisão humana resolve.
- **A descoberta automática** cobre INSS, Vunesp e FGV. O DOU é importação local. Outras fontes exigem novo conector ou uso manual de `--url`.
- **O cooldown não julga relevância.** Depois de 15 dias, o código libera; o editor precisa decidir se há informação nova relevante.
- **O caminho manual exige fonte textual.** Se a página não puder ser salva, não há como provar a evidência.
- **Imagens:** o caminho manual não faz upload; escolhe da biblioteca do Sanity. Se não houver imagem adequada, o revisor adiciona manualmente.
- **A fila pode ficar só em duplicados** quando a base já cobriu os concursos disponíveis. Isso é esperado; expanda fontes ou cadastre URLs oficiais específicas.
- **A tarefa agendada é específica do Windows.** Em Linux/macOS, use cron/systemd com o mesmo comando.
- **Os testes são offline.** Eles não garantem que uma fonte externa continua igual; `doctor` e `verify` cobrem isso.

---

## 16. Referências internas

| Documento | Conteúdo |
|---|---|
| `README.md` (raiz) | Visão geral do monorepo |
| `agente-artigos/README.md` | Instalação, comandos e arquitetura do pipeline |
| `agente-artigos/docs/verificacao-editorial.md` | Política de fontes e verificação |
| `agente-artigos/docs/fontes-de-dados.md` | Matriz das 10 fontes analisadas |
| `agente-artigos/docs/rotina-diaria.md` | SOP da rotina diária |
| `agente-artigos/sources.yaml` | Fontes oficiais monitoradas |
| `agente-artigos/pipeline/` | Código do pipeline |
| `agente-artigos/tests/` | 75 testes offline |
| `concursos-sanity-backend/README.md` | Studio, schemas, scripts e deploy |
| `concursos-sanity-backend/schemas/documents/post.ts` | Schema da matéria |
| `concursosagora-main/README.md` | Frontend, rotas e SEO |

### Repositórios GitHub (resumo)

- **Monorepo do projeto:** <https://github.com/concursosagorabr-cell/concursosagoraprojetocompleto>
- **Frontend standalone:** <https://github.com/concursosagorabr-cell/concursosagora>
- **Scrapling:** <https://github.com/D4Vinci/Scrapling>
- **Sanity Studio:** <https://github.com/sanity-io/sanity>
- **Sanity Client:** <https://github.com/sanity-io/client>
- **Next.js:** <https://github.com/vercel/next.js>
- **Tailwind CSS:** <https://github.com/tailwindlabs/tailwindcss>
- **OpenCode (ambiente do agente):** <https://github.com/anomalyco/opencode> (anteriormente `sst/opencode`)

A lista completa, com o papel de cada repositório e as demais dependências, está nas seções **3.1** e **3.2**.

### Glossário

- **Bundle:** JSON com fonte, fatos, evidências e matéria, consumido por `pipeline manual`.
- **Cooldown:** janela mínima de 15 dias para cobrir o mesmo `contestKey`.
- **Contest key:** identificador estável do certame, usado no cooldown.
- **Draft:** documento `drafts.*` no Sanity, ainda não publicado.
- **Evidência:** trecho literal da fonte que sustenta um fato.
- **Fact sheet:** lista de fatos com valor, status, confiança e citação.
- **Fila:** `queue.json`/`queue.md` gerados por `pipeline daily`.
- **GROQ:** linguagem de consulta do Sanity (não confundir com a API Groq).
- **Portable Text:** formato de corpo rich text do Sanity.
- **`reviewStatus`:** `pending`, `approved` ou `rejected`.
- **`verificationStatus`:** `verified`, `needs_review` ou `blocked`.

---

## 17. Manutenção deste manual

Atualize este documento quando:

- mudar um limiar (`FACT_CHECK_MIN_SCORE`, `VERIFICATION_MIN_SCORE`, `CONTEST_COOLDOWN_DAYS`);
- mudar o schema do Sanity;
- adicionar ou remover fonte;
- mudar o fluxo diário ou o agendamento;
- mudar a política de evidências;
- mudar a versão do Python, Scrapling, Sanity ou Groq;
- descobrir uma nova falha recorrente.

Registre a data e a versão no topo. O objetivo é que outra pessoa (ou outra instância do assistente) consiga retomar a produção sem depender desta conversa.
