# Concursos Agora — Pipeline editorial

Pipeline de coleta oficial e redação assistida para o portal Concursos Agora.
Ele usa **Scrapling** para ler páginas públicas, extrai fatos de forma
determinística e usa **Groq** apenas para redigir a matéria. O resultado é
sempre um **rascunho no Sanity** para revisão humana.

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

Detalhes e a avaliação dos 10 portais sugeridos: `docs/verificacao-editorial.md`.

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
7. Evita duplicidades por URL, hash de conteúdo e slug.
8. Cria o rascunho no Sanity com `reviewStatus = "pending"` e registra a
   execução no SQLite local.

## Fontes do MVP

| Fonte | Situação | Página inicial |
| --- | --- | --- |
| INSS | ativa | `https://www.gov.br/inss/pt-br/assuntos/noticias` |
| Vunesp | ativa | `https://www.vunesp.com.br/busca/concurso/inscricoes%20abertas` |
| FGV Conhecimento | ativa | `https://conhecimento.fgv.br/concursos` |
| DOU | desativada | `https://www.in.gov.br/leiturajornal` |

### Por que o DOU está desativado

O `robots.txt` do DOU retorna:

```text
User-agent: *
Disallow: /
```

O adaptador do DOU continua no código para quando existir uma API oficial
autorizada, mas a coleta fica desligada para não violar a restrição. Não há
tentativa de contornar CAPTCHA, login, Cloudflare ou qualquer proteção
anti-bot.

A FGV entrou como terceira fonte do MVP porque a listagem de concursos em
andamento é estática, pública e permitida pelo `robots.txt`. Cebraspe e IDECAN
não são usados porque dependem de JavaScript/Cloudflare.

## Estrutura

```text
pipeline/
  cli.py           comandos doctor, sources, discover, run, stats, delete-draft
  config.py        leitura de .env, sources.yaml e Settings
  scrape.py        Scrapling, robots.txt, atraso entre requisições e decodificação
  extract.py       descoberta e extração por fonte; fatos determinísticos
  text.py          normalização, slugs, datas, valores, UF e cidade
  groq.py          cliente Groq, prompts e leitura do JSON
  editorial.py     validação, score, reparos e normalização da matéria
  portable_text.py conversão de Markdown para Portable Text
  sanity.py        consultas, categorias, imagens e criação de rascunhos
  dedupe.py        deduplicação por URL, hash, slug e título
  state.py         estado local em SQLite
  runner.py        orquestração de uma execução
sources.yaml       fontes, domínios, palavras-chave e limites
tests/             testes unitários sem rede
data/              runs, SQLite e cache de imagens (ignorado pelo git)
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

# Apenas descobre candidatos, sem redigir nem gravar
python -m pipeline discover --source inss --limit 5
python -m pipeline discover --source vunesp --limit 5
python -m pipeline discover --source fgv --limit 5

# Extrai fatos e evidências de uma URL oficial, sem redigir nem gravar
python -m pipeline verify --source vunesp --url https://www.vunesp.com.br/UFSP2602

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
cadastro de reserva, inferência de fonte, validação editorial, Portable Text e
configuração das fontes. Eles não fazem chamadas de rede.

## Operação e limites

- Execute com intervalo sugerido de 2 horas (`SCRAPE_INTERVAL_HOURS`).
- Revise os rascunhos no Studio antes de publicar.
- Se um `robots.txt` mudar, desative a fonte em `sources.yaml`; não tente
  contornar a restrição.
- Fontes muito curtas geram matérias curtas de propósito. O pipeline reduz a
  meta de palavras para não preencher lacunas com invenções.
- Erros de rede, Groq ou Sanity ficam registrados em `summary.json` e no SQLite.
- O frontend e o webhook são independentes deste repositório; a publicação
  continua sendo uma ação humana no Studio.
