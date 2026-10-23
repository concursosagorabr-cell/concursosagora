# Concursos Agora — Pipeline editorial

Pipeline de coleta oficial e redação assistida para o portal Concursos Agora.
Ele usa **Scrapling** para ler páginas públicas, extrai fatos de forma
determinística e usa **Groq** apenas para redigir a matéria no caminho
automático. O resultado é sempre um **rascunho no Sanity** para revisão humana.
O caminho manual (`pipeline manual`) permite que o assistente/editor escreva o
bundle sem Groq, e a rotina diária (`pipeline daily`) apenas monta a fila de
pautas — não redige e não publica.

> **Modo seguro:** `AUTO_PUBLISH` é ignorado pelo runner. Nenhum documento é
> publicado automaticamente; o pipeline cria somente IDs `drafts.<slug>` com
> `reviewStatus = "pending"`.

## Regra de verificação (obrigatória)

- Só fonte oficial (órgão, banca ou diário oficial) pode gerar artigo.
- Cada fato crítico precisa de um trecho literal da fonte (ficha de evidências).
- Fato crítico sem evidência, conflito ou afirmação de alto risco sem respaldo
  bloqueia a criação do rascunho.
- Portais de imprensa e agregadores são apenas descoberta; nunca confirmam
  número, data, salário ou status.
- `AUTO_PUBLISH` é ignorado e a publicação continua humana.

Detalhes e a avaliação dos 10 portais sugeridos: `docs/verificacao-editorial.md` e
`docs/fontes-de-dados.md`.

## O que o pipeline faz

1. Descobre concursos e notícias nas fontes oficiais configuradas.
2. Verifica `robots.txt` e respeita as restrições de acesso.
3. Extrai título, datas, órgão, banca, vagas, salários, taxa, UF e demais fatos
   por regras determinísticas.
4. Pede ao Groq uma matéria em JSON, usando os fatos extraídos como fonte
   autoritativa.
5. Valida números, datas, valores, status, categorias e alegações de alto risco.
6. Se a nota ficar abaixo do mínimo, tenta reparos automáticos; se ainda ficar
   abaixo, **não cria o rascunho**.
7. Evita duplicidades por URL, hash de conteúdo, slug e título, e aplica um
   cooldown de **15 dias** por concurso (`contestKey`).
8. Cria o rascunho no Sanity com `reviewStatus = "pending"` e registra a
   execução no SQLite local.

## Fontes do MVP

| Fonte | Situação | Página inicial |
| --- | --- | --- |
| INSS | ativa | `https://www.gov.br/inss/pt-br/assuntos/noticias` |
| Vunesp | ativa | `https://www.vunesp.com.br/busca/concurso/inscricoes%20abertas` |
| FGV Conhecimento | ativa | `https://conhecimento.fgv.br/concursos` |
| DOU | importação local (desativada por padrão) | XML/ZIP oficial em `data/dou/` |

### DOU: arquivo oficial, não scraping

O `robots.txt` do DOU retorna:

```text
User-agent: *
Disallow: /
```

Por isso o pipeline **não lê o HTML do `in.gov.br`**. O conector
`dou_inlabs` importa o XML/ZIP oficial baixado manualmente no Portal de Dados
Abertos ou no INLABS (quando disponível) e extrai as matérias localmente. Não há
login automático, CAPTCHA, contorno de Cloudflare ou qualquer proteção
anti-bot.

O INLABS legado (`inlabs.in.gov.br/logar.php` e o endpoint de download)
retornou HTTP 404 na verificação de 22/10/2026. O caminho operacional é baixar
o pacote no Portal de Dados Abertos com a conta gov.br e apontar o arquivo com
`--dou-file`. A fonte continua `enabled: false` em `sources.yaml` para não
entrar em `run --source all` sem um arquivo explícito.

A FGV entrou como terceira fonte do MVP porque a listagem de concursos em
andamento é estática, pública e permitida pelo `robots.txt`. Cebraspe e IDECAN
não são usados porque dependem de JavaScript/Cloudflare.

## Estrutura

```text
pipeline/
  cli.py           comandos doctor, sources, discover, verify, run, daily, manual, stats, delete-draft
  config.py        leitura de .env, sources.yaml e Settings
  daily.py         fila editorial diária sem Groq e sem gravar no Sanity
  manual.py        validação de bundle escrito manualmente e criação de rascunhos
  scrape.py        Scrapling, robots.txt, atraso entre requisições e decodificação
  extract.py       descoberta e extração por fonte; fatos determinísticos
  dou_open_data.py importação local de XML/ZIP oficial do DOU
  source_policy.py registro de fontes, termos e automação permitida
  text.py          normalização, slugs, datas, valores, UF e cidade
  groq.py          cliente Groq, prompts e leitura do JSON
  editorial.py     validação, score, reparos e normalização da matéria
  portable_text.py conversão de Markdown para Portable Text
  sanity.py        consultas, categorias, imagens e criação de rascunhos
  dedupe.py        deduplicação por URL, hash, slug e título
  state.py         estado local em SQLite
  runner.py        orquestração de uma execução
sources.yaml       fontes oficiais, domínios, palavras-chave e limites
tests/             testes unitários sem rede
scripts/           rotina diária e agendamento no Windows
docs/              políticas, fontes e rotina editorial
data/              runs, fila diária, SQLite, cache e XML/ZIP do DOU (ignorado pelo git)
```

## Instalação

Requisitos: Python 3.11 ou superior. No ambiente atual, o venv fica em
`G:\opencode-work\scrapling-venv` para não ocupar espaço em `C:`.

```powershell
python -m venv G:\opencode-work\scrapling-venv
G:\opencode-work\scrapling-venv\Scripts\python.exe -m pip install -r requirements.txt
```

Credenciais são lidas, nesta ordem, de:

1. `../concursosagora-main/.env.local`
2. `.env.local` deste projeto (sobrescreve o anterior)

Variáveis relevantes:

```dotenv
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-07-25
SANITY_API_TOKEN=...
GROQ_API_KEY=...
GROQ_MODEL=openai/gpt-oss-120b
AUTO_PUBLISH=false
FACT_CHECK_MIN_SCORE=90
REQUIRE_OFFICIAL_SOURCE=true
REQUIRE_FACT_EVIDENCE=true
BLOCK_ON_FACT_CONFLICT=true
VERIFICATION_MIN_SCORE=95
DOU_IMPORT_DIR=data/dou
```

Nunca faça commit de `.env.local` nem de tokens. O `.gitignore` já cobre esses
arquivos e a pasta `data/`.

## Uso

```powershell
# Diagnóstico de Sanity, fontes, Groq e modo seguro
python -m pipeline doctor
python -m pipeline doctor --test-groq

# Lista as fontes configuradas
python -m pipeline sources

# Lista o registro de políticas das fontes analisadas
python -m pipeline sources --registry

# Apenas descobre candidatos, sem redigir nem gravar
python -m pipeline discover --source inss --limit 5
python -m pipeline discover --source vunesp --limit 5
python -m pipeline discover --source fgv --limit 5

# DOU: importa um XML/ZIP oficial baixado manualmente
python -m pipeline discover --source dou --dou-file data/dou/DO3-2026-10-22.zip --date 22-10-2026 --limit 10
python -m pipeline run --source dou --dou-file data/dou/DO3-2026-10-22.zip --date 22-10-2026 --limit 1 --dry-run

# Extrai fatos e evidências de uma URL oficial, sem redigir nem gravar
python -m pipeline verify --source vunesp --url https://www.vunesp.com.br/UFSP2602

# Monta a fila editorial do dia (sem Groq e sem gravar no Sanity)
python -m pipeline daily --sources all --limit 8 --max-extract 12
.\scripts\daily.ps1

# Valida um bundle escrito manualmente; sem --apply, é só dry-run
python -m pipeline manual --bundle data/manual_articles/bundle_2026-10-23.json
python -m pipeline manual --bundle data/manual_articles/bundle_2026-10-23.json --apply

# Testa uma URL específica sem gravar nada
python -m pipeline run --url "https://conhecimento.fgv.br/concursos/pcpr26" --dry-run

# Cria rascunhos para revisão (um por fonte)
python -m pipeline run --source inss --limit 1
python -m pipeline run --source vunesp --limit 1
python -m pipeline run --source fgv --limit 1

# Estado local
python -m pipeline stats

# Remove um rascunho específico (somente IDs drafts.*)
python -m pipeline delete-draft --id "drafts.exemplo" --yes
```

`--url` pode ser repetido. Se a fonte não for informada, o pipeline tenta
inferi-la pelo domínio. `--json` imprime o resumo estruturado.

## Rotina diária

A rotina diária está detalhada em `docs/rotina-diaria.md`. O resumo é:

1. **08:00 — fila automática**: `python -m pipeline daily` (ou
   `scripts/daily.ps1`) descobre candidatos oficiais, aplica URL/hash/slug/
   título e o cooldown de 15 dias por concurso, extrai fatos com evidência
   literal e grava `data/daily/AAAA-MM-DD/queue.{json,md}`. Não chama Groq e
   não grava no Sanity.
2. **Triagem e redação**: o assistente escolhe os itens `ready`, confere os
   `needs_review` e escreve um bundle manual em
   `data/manual_articles/bundle_AAAA-MM-DD.json`.
3. **Validação e rascunhos**: `python -m pipeline manual --bundle ...` (dry-run)
   e depois `--apply`. Só IDs `drafts.*` com `reviewStatus=pending` são criados.
4. **Revisão e publicação humanas**: o revisor confere a fonte no Studio e
   publica manualmente. O pipeline nunca publica.

Para agendar a fila no Windows:

```powershell
.\scripts\register-daily-task.ps1 -Time "08:00"
```

A tarefa só prepara a fila; redação, revisão e publicação continuam sendo
passos humanos.

## Controle editorial e validação

Antes de criar o rascunho, `editorial.py` verifica:

- presença e tamanho de título, resumo e corpo;
- números de vagas, valores monetários e datas contra a fonte e os fatos;
- datas ISO dos fatos convertidas para `DD/MM/AAAA`;
- status (`aberto`, `previsto`, `em_andamento`, `encerrado`) e coerência do
  texto com esse status;
- negações, como "ainda não há abertura de inscrições", que não devem ser
  tratadas como afirmação de abertura;
- contradições sobre cadastro de reserva versus vagas efetivas;
- menção a requisitos, especialidades ou edital sem respaldo no texto-fonte;
- categorias existentes, clickbait e excesso de "não divulgado".

A nota mínima padrão é **90/100**. O pipeline tenta até dois reparos; se a nota
continuar abaixo, o item é marcado como `skipped` e **nenhum rascunho é criado**.
A regra de duas fontes independentes agora só se aplica a fonte não oficial; fontes oficiais primárias são aceitas com evidência literal. O bloqueio principal é a auditoria de evidências.

A validação é determinística para números, datas, valores, links e status. Ela
não substitui a revisão humana de semântica, contexto e estilo.

### Auditoria de verificação

O pipeline cria `verificationReport` e `factSheet` no rascunho. A nota de
evidência precisa ser pelo menos `VERIFICATION_MIN_SCORE` (padrão 95) e não pode
haver `criticalMissing`, conflito ou aviso bloqueante. A ficha mostra o trecho
literal e a URL de cada fato crítico. O editor deve conferir a fonte antes de
aprovar; o pipeline nunca publica.

## Rascunhos no Sanity

Cada documento criado tem:

- `_id`: `drafts.<slug>`;
- `_type`: `post`;
- `reviewStatus`: `pending`;
- `aiAssisted`: `true`;
- `sourceUrls`: URL oficial consultada;
- `contentHash`: hash do texto-fonte;
- `pipelineRunId`: execução que gerou o rascunho;
- `publishedAt`, categorias, autor, imagem, fatos e SEO preenchidos quando
  disponíveis.

A criação usa `createIfNotExists`, então um rascunho existente não é
sobrescrito. O pipeline também evita duplicidades por URL, hash, slug e
similaridade de título. Nenhum `_id` sem o prefixo `drafts.` é criado.

Studio: `https://concursos-agora.sanity.studio/`

## Artefatos e estado local

Cada execução grava:

```text
data/runs/<run_id>/summary.json
data/runs/<run_id>/<slug>-<hash>.json   # resultado + documento completo
data/pipeline.db                        # estado e histórico
data/assets.json                        # cache de imagens enviadas
```

Os artefatos são úteis para auditoria: incluem fatos extraídos, avisos, nota,
matéria gerada e o documento que seria ou foi enviado ao Sanity.

## Testes

```powershell
python -m compileall -q pipeline
python -m unittest discover -s tests -v
```

Os testes cobrem normalização, UF/cidade, datas, vagas, fatos do INSS,
cadastro de reserva, inferência de fonte, validação editorial, Portable Text,
configuração das fontes, políticas de uso e importação local de XML/ZIP do DOU.
Eles não fazem chamadas de rede.

## Operação e limites

- Execute a fila editorial uma vez por dia (`pipeline daily` ou
  `scripts/daily.ps1`); o runner automático pode rodar com intervalo sugerido
  de 2 horas (`SCRAPE_INTERVAL_HOURS`).
- Revise os rascunhos no Studio antes de publicar. A publicação é sempre
  manual.
- Se um `robots.txt` mudar, desative a fonte em `sources.yaml`; não tente
  contornar a restrição.
- Fontes muito curtas geram matérias curtas de propósito. O pipeline reduz a
  meta de palavras para não preencher lacunas com invenções.
- Erros de rede, Groq ou Sanity ficam registrados em `summary.json` e no SQLite.
- O frontend e o webhook são independentes deste repositório; a publicação
  continua sendo uma ação humana no Studio.
