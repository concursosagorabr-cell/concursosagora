# Verificação editorial e política de fontes

## Objetivo

O pipeline só pode criar rascunho quando cada fato crítico da matéria estiver
sustentado por um trecho literal de uma fonte oficial. O modelo de linguagem
reescreve; ele não é autoridade factual.

A publicação continua manual: todo documento nasce como `drafts.*` com
`reviewStatus=pending`. `AUTO_PUBLISH=true` é ignorado.

## Regra de ouro

1. **Fonte oficial obrigatória.** Órgão público, banca organizadora ou diário
   oficial. Notícia de portal de imprensa ou agregador não gera artigo.
2. **Evidência por fato.** Para vagas, salário, taxa, datas, status, órgão,
   banca, UF, município, escolaridade e cadastro de reserva, o pipeline guarda
   o trecho exato da fonte.
3. **Fato crítico sem evidência bloqueia o rascunho.** Não há compensação por
   texto bonito ou por nota alta de estilo.
4. **Conflito bloqueia.** Se duas fontes oficiais divergirem, o rascunho não é
   criado até resolução humana.
5. **Nada de segunda mão como verdade.** Portais secundários servem para
   descobrir uma URL oficial, nunca para confirmar um número.
6. **`robots.txt` é obrigatório.** Não contornamos CAPTCHA, login, paywall ou
   bloqueio antibot. `robots.txt` permissivo também não é licença de conteúdo.

## Camadas de fonte

| Camada | Exemplos | Pode gerar fato? | Uso |
|---|---|---|---|
| `official_primary` | gov.br, in.gov.br, banca (Vunesp, FGV, Cebraspe) | Sim | Artigo e evidência |
| `official_secondary` | página oficial de notícias/apoio do órgão | Sim, com cautela | Artigo e evidência |
| `journalism` | G1, JC Concursos, Folha Dirigida, Correio Braziliense | Não | Descoberta e corroboração |
| `aggregator` | PCI Concursos, Concursos no Brasil, Ache Concursos | Não | Descoberta |

O campo `sourceUrls` do Sanity registra `kind`, `usage` e o trecho de
evidência. A ficha completa fica em `factSheet`.

## Situação das fontes sugeridas

Verificação feita em **22/10/2026** em `robots.txt`, página inicial e termos de
uso, sem burlar proteções. O registro executável está em
`pipeline/source_policy.py`; a matriz completa está em
`docs/fontes-de-dados.md`.

| Portal | Observação | Decisão |
|---|---|---|
| PCI Concursos | Permite grande parte; bloqueia `/pdf/`, `/ct/`, painéis e downloads; sem licença específica localizada | Apenas descoberta; abrir a fonte oficial |
| Concursos no Brasil | Termos proíbem cópia, reprodução, distribuição e banco de dados sem consentimento | **Manual apenas**; não integrar |
| JC Concursos | `Allow: /`; sem licença de reprodução localizada | Apenas descoberta; confirmar no oficial |
| Folha Dirigida / QConcursos | Termos retornaram 403 via Cloudflare; conteúdo protegido | Apenas metadados de sitemap; não contornar |
| Ache Concursos | Termos vedam uso comercial/publicação sem autorização; exceção restrita a pessoal/acadêmico | **Manual apenas**; não integrar |
| G1 Concursos | Sem regra `User-agent: *` explícita na consulta; termos Globo | Apenas descoberta |
| Correio Braziliense | `Allow: *`; bloqueia `/busca/`; atenção a paywall | Apenas descoberta |
| DOU / in.gov.br | `User-agent: *` + `Disallow: /`; INLABS legado 404 em 22/10/2026 | **Importação local de XML/ZIP oficial**; não ler o HTML |
| Concursos em Pauta | DNS não resolveu na verificação | **Não usar** até revisão |
| Notícias Concursos | Termos vedam uso comercial; robots bloqueia `ClaudeBot`, `anthropic-ai`, `CCBot`, `Scrapy` e outros | **Manual apenas**; não colocar no pipeline |
| Mega Concursos | Sem licença específica localizada; robots bloqueia área administrativa, uploads, busca e pagamento | Apenas descoberta |
| ISCOM Radar de Concursos | Sem licença específica localizada; robots permite o site | Apenas descoberta |

Consequência prática: os portais acima não entram como `usage: article`.
Eles podem ser usados por um editor para localizar uma URL oficial, mas a
extração e a redação partem do órgão, da banca ou do diário oficial. O DOU é a
exceção operacional: é fonte primária, mas só entra por XML/ZIP oficial
importado manualmente, nunca por scraping do HTML.

O portal Concursos Agora é `internal`: serve para índice e histórico, não é
verificação independente.

## Fluxo

```
descoberta oficial
  -> extração determinística de fatos
  -> ficha de evidências (trecho literal por fato)
  -> redação pelo modelo usando somente fatos + evidências
  -> validação de números, datas, status, links e campos
  -> auditoria final (fonte oficial, fatos críticos, conflitos)
  -> rascunho Sanity com reviewStatus=pending
```

Se qualquer etapa de auditoria falhar, nenhum documento é criado. O resultado
fica no artefato da execução com o motivo do bloqueio.

## O que é bloqueante

- Fonte não oficial ou não classificada.
- Fato crítico presente nos fatos extraídos sem trecho de evidência.
- Status, órgão, banca, UF, município ou escolaridade divergente do fato.
- Número de vagas, valor monetário, data ou link sem respaldo na fonte.
- Afirmação de inscrições abertas, vagas efetivas, edital, cronograma, etapa,
  resultado ou citação literal sem respaldo.
- Conflito entre fontes oficiais.

A nota de verificação (`verificationScore`) mede evidência, não estilo. O
mínimo padrão é 95/100; a nota de redação (`fact_check_min_score`) continua
separada.

## Comandos

```powershell
# Inspecionar uma URL oficial: fatos, evidências e fatos críticos sem respaldo
python -m pipeline verify --source vunesp --url https://www.vunesp.com.br/UFSP2602

# Versão JSON, útil para auditoria
python -m pipeline verify --source inss --url https://www.gov.br/inss/... --json

# Testes offline
python -m unittest discover -s tests -v

# Registro de políticas das fontes
python -m pipeline sources --registry

# DOU: importação de XML/ZIP oficial, sem scraping
python -m pipeline discover --source dou --dou-file data/dou/DO3-2026-10-22.zip --date 22-10-2026
```

## Revisão humana no Studio

Ao abrir o rascunho, o editor deve conferir:

1. `factSheet`: cada linha tem `quote` e `sourceUrl`;
2. `verificationReport.blocking` deve estar vazio;
3. `verificationStatus` deve ser `verified`;
4. a URL oficial abre e o trecho existe;
5. o texto não acrescenta contexto, opinião ou previsão que não esteja na fonte.

O pipeline não aprova nem publica. `reviewStatus` só muda por decisão humana.

## Limitações conhecidas

- A ficha de evidências é determinística e conservadora; ela não entende
  ironia, negação complexa ou tabelas em PDF.
- PDFs de edital ainda não são extraídos nesta versão. Quando o dado crítico
  só existe no PDF, o fato fica sem evidência e o rascunho é bloqueado.
- A descoberta automática a partir dos portais secundários ainda não está
  habilitada; eles estão classificados e documentados para uso manual.
- O conector do DOU importa XML/ZIP oficial local. O INLABS legado está
  indisponível e o catálogo novo de dados abertos pode exigir login gov.br.
- O Studio hospedado foi reimplantado em 21/10/2026 e já exibe os campos de
  verificação. Os dados antigos que não têm esses campos continuam válidos para
  leitura, mas aparecem sem a ficha de evidências.
