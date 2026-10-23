# Registro de fontes e política de uso

Verificação feita em **22/10/2026**. Termos de uso, `robots.txt` e endpoints
podem mudar; a fonte de verdade continua sendo o site oficial e o ato publicado.

## Regra operacional

- `usage=verification`: a fonte pode sustentar fato, desde que o trecho literal
  esteja no texto e a fonte seja oficial.
- `usage=discovery`: serve só para descobrir pauta. Não confirma número, data,
  salário, status ou cronograma.
- `usage=internal`: base própria; não é verificação independente.
- `official_open_data`: importar XML/ZIP ou base oficial, sem scraping do HTML.
- `sitemap_only`: no máximo ler metadados e URLs de sitemap para monitoramento;
  não copiar matérias, fotos ou tabelas.
- `manual_only`: não automatizar. Leitura humana ou autorização escrita.
- `disabled`: fora do pipeline até nova revisão.

O registro executável fica em `pipeline/source_policy.py` e pode ser consultado
com:

```powershell
python -m pipeline sources --registry
```

## Matriz das 10 fontes analisadas

| Fonte | Classificação | Uso | Automação permitida | Decisão |
| --- | --- | --- | --- | --- |
| Diário Oficial da União (DOU) | `official_primary` | `verification` | `official_open_data` | Fonte primária federal. Importar XML/ZIP oficial; não ler o HTML do `in.gov.br`. |
| Concursos Agora | `internal` | `internal` | `internal` | Banco/URLs próprias. Não é verificação independente. |
| PCI Concursos | `aggregator` | `discovery` | `sitemap_only` | Pista de pauta. Robots bloqueia PDFs, CT, painéis e downloads; não copiar. |
| Concursos no Brasil | `aggregator` | `discovery` | `manual_only` | Termos proíbem cópia, reprodução e banco de dados sem consentimento. Não integrar. |
| Ache Concursos | `aggregator` | `discovery` | `manual_only` | Termos vedam uso comercial/publicação sem autorização; exceção restrita a uso pessoal/acadêmico. |
| JC Concursos | `journalism` | `discovery` | `sitemap_only` | Boa pauta e contexto. Sem licença de reprodução localizada; confirmar no oficial. |
| Notícias Concursos | `journalism` | `discovery` | `manual_only` | Termos vedam uso comercial; robots bloqueia `ClaudeBot`, `anthropic-ai`, `CCBot`, `Scrapy` e outros. |
| Mega Concursos | `aggregator` | `discovery` | `sitemap_only` | Pauta regional. Robots bloqueia área administrativa, uploads, busca e pagamento; confirmar no oficial. |
| Qconcursos / Folha Dirigida | `journalism` | `discovery` | `sitemap_only` | Termos atrás de Cloudflare (403). Não contornar bloqueio; usar só metadados. |
| ISCOM Radar de Concursos | `journalism` | `discovery` | `sitemap_only` | Nicho de comunicação social. Robots permite o site; usar como pista. |

## DOU: por que não há scraping

O `robots.txt` de `https://www.in.gov.br/robots.txt` responde:

```text
User-agent: *
Disallow: /
```

Além disso, a página oficial de **Base de Dados de Publicações do DOU** informa
que as publicações são disponibilizadas em XML compactado em ZIP, com acesso
pelo Portal Brasileiro de Dados Abertos. O acesso ao catálogo novo pode exigir
login gov.br. O INLABS legado (`inlabs.in.gov.br/logar.php` e o endpoint de
download) retornou **HTTP 404** na verificação de 22/10/2026.

Fluxo seguro:

1. Baixar o XML/ZIP oficial no Portal de Dados Abertos/INLABS.
2. Colocar o arquivo em `data/dou/` (ou usar outro caminho com `--dou-file`).
3. Rodar `discover`/`run` com `--source dou --dou-file ...`.

```powershell
python -m pipeline discover --source dou `
  --dou-file data/dou/DO3-2026-10-22.zip `
  --date 22-10-2026 --limit 10

python -m pipeline run --source dou `
  --dou-file data/dou/DO3-2026-10-22.zip `
  --date 22-10-2026 --limit 1 --dry-run
```

O conector aceita XML individual ou ZIP com vários XMLs, detecta os campos
comuns do DOU (`identifica`, `ementa`, `texto`, `pubDate`, `artType`,
`hierarchyStr`, `urlTitle`) e monta a URL oficial da matéria. O PDF não é
extraído; para fatos críticos, a conferência final é no ato oficial.

## Fontes oficiais complementares

- Sites de órgãos (`*.gov.br`, `*.jus.br`, `*.leg.br`, `*.mp.br`) e páginas de
  bancas organizadoras reconhecidas pelo pipeline.
- Diários oficiais estaduais e municipais, quando o ato não for federal.
- A banca é a fonte primária do certame; o DOU cobre apenas o âmbito federal.
- O portal Concursos Agora pode indexar e contextualizar, mas não substitui a
  fonte oficial.

## Limites e pendências

- **Concursos no Brasil, Ache Concursos e Notícias Concursos**: automação
  bloqueada por termos/robots. Só usar manualmente ou com autorização.
- **Qconcursos/Folha Dirigida**: página de termos retornou 403; não contornar.
  A automação fica limitada a metadados de sitemap, se isso for autorizado.
- **PCI, JC, Mega e ISCOM**: não há licença específica localizada. O uso no
  pipeline é somente descoberta; não copiar texto, foto, título ou tabela.
- **DOU/INLABS**: o endpoint legado está indisponível; a importação é local e
  manual até existir uma API oficial estável ou autorização de acesso.
- **Base dos Dados (DOU)**: cobertura histórica 2019–2024; serve para análise,
  não para notícia diária.
