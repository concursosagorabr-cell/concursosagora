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

## Situação dos 10 portais sugeridos

Verificação feita em 21/10/2026 apenas em `robots.txt` e na página inicial,
sem burlar proteções.

| Portal | `robots.txt` observado | Decisão |
|---|---|---|
| PCI Concursos | Permite grande parte; bloqueia `/pdf/`, `/ct/`, painéis e downloads | Apenas descoberta; abrir a fonte oficial |
| Concursos no Brasil | WordPress; bloqueia `wp-admin`, login e busca | Apenas descoberta |
| JC Concursos | `Allow: /` | Apenas descoberta; conferir termos |
| Folha Dirigida / QConcursos | Permite leitura; bloqueia JSON/JS e CDN | Apenas descoberta; atenção a paywall |
| Ache Concursos | Permite conteúdo; bloqueia área premium, fórum e downloads | Apenas descoberta |
| G1 Concursos | Sem regra `User-agent: *` explícita na consulta | Apenas descoberta; termos Globo |
| Correio Braziliense | `Allow: *`; bloqueia `/busca/` | Apenas descoberta; atenção a paywall |
| DOU / in.gov.br | `User-agent: *` + `Disallow: /` | **Desativado**; não coletar |
| Concursos em Pauta | DNS não resolveu na verificação | **Não usar** até revisão |
| Notícias Concursos | WordPress; bloqueia admin, login, busca e XML-RPC | Apenas descoberta |

Consequência prática: os portais acima não entram como `usage: article`.
Eles podem ser usados por um editor para localizar uma URL oficial, mas a
extração e a redação partem do órgão ou da banca.

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
- O Studio hospedado foi reimplantado em 21/10/2026 e já exibe os campos de
  verificação. Os dados antigos que não têm esses campos continuam válidos para
  leitura, mas aparecem sem a ficha de evidências.
