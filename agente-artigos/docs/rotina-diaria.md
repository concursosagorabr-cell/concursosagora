# Rotina diária de produção e publicação

Esta rotina separa **preparação automática** de **redação** e **publicação
humana**. O pipeline nunca publica: ele descobre fontes oficiais, aplica as
travas de duplicidade e cooldown, extrai fatos com trechos literais e monta a
fila do dia. A redação é feita em um bundle manual (sem Groq) e a publicação
continua sendo uma decisão humana no Sanity Studio.

## Princípios

- **Fonte oficial apenas**: órgão, banca ou diário oficial. Portais de imprensa
  e agregadores não confirmam fatos.
- **Nada é publicado automaticamente**: todo documento novo nasce como
  `drafts.<slug>` com `reviewStatus = "pending"`.
- **Duas travas obrigatórias**:
  1. a mesma URL de origem não pode ser reutilizada;
  2. o mesmo concurso não pode ser coberto de novo antes de **15 dias**
     (`CONTEST_COOLDOWN_DAYS`). Depois desse prazo, uma nova matéria só é
     permitida se trouxer informação relevante nova.
- **Evidência literal**: cada fato crítico precisa de um trecho que exista no
  texto-fonte. O validador do bundle compara a citação com o `source_text`.
- **Revisão humana antes de publicar**: números, datas, valores, status e
  links precisam ser conferidos no edital ou na página oficial.

## Horário sugerido

| Horário | Etapa | Responsável |
| --- | --- | --- |
| 08:00 | Gerar a fila do dia | tarefa agendada / assistente |
| 08:15 | Triagem dos itens `ready` e `needs_review` | assistente |
| 08:30–11:30 | Redação dos bundles | assistente |
| 14:00 | Validação e criação dos rascunhos | assistente |
| 14:30–16:00 | Revisão editorial no Studio | revisor humano |
| 16:00 | Publicação manual dos aprovados | revisor humano |
| 17:30 | Enriquecimento automático dos rascunhos recentes | tarefa agendada / assistente |
| 17:00 | Fechamento: pendentes, stale e erros | assistente |

O horário é uma referência. O importante é manter a cadência e nunca pular a
revisão humana.

## Etapa 1 — Gerar a fila do dia

```powershell
# Fila completa (INSS, Vunesp e FGV), com extração de fatos
.\scripts\daily.ps1

# Ou diretamente pelo pipeline
python -m pipeline daily --sources all --limit 8 --max-extract 12
```

A rotina grava:

```text
data/daily/AAAA-MM-DD/queue.json   # fila estruturada, com fatos e evidências
data/daily/AAAA-MM-DD/queue.md     # versão para leitura e triagem
data/daily/logs/AAAA-MM-DD.log     # log da execução agendada
```

Ela **não chama Groq** e **não grava no Sanity**.

Status possíveis:

- `ready`: fatos críticos com evidência e nota acima do mínimo. Pode redigir.
- `needs_review`: falta evidência para algum fato crítico. Conferir a fonte
  antes de usar.
- `duplicate`: URL, hash, slug, título ou concurso já coberto. Não redigir.
- `queued`: descoberto, mas o limite diário de extração foi atingido.
- `error`: falha de coleta/extração. Registrar e tentar de novo no dia seguinte.

## Etapa 2 — Triagem

1. Abra `queue.md` e leia o resumo.
2. Priorize `ready`; use `needs_review` só depois de conferir a fonte.
3. Escolha no máximo 3 a 5 pautas por dia para manter a qualidade.
4. Confirme que o `contest_key` não aparece em nenhum rascunho ou post dos
   últimos 15 dias. A fila já aplica essa trava, mas a conferência visual é
   rápida.
5. Se um item `needs_review` for importante, abra a página oficial e complete
   os fatos que faltam. Não invente o que a fonte não diz.

## Etapa 3 — Redigir o bundle (sem Groq)

Crie `data/manual_articles/bundle_AAAA-MM-DD.json` com a lista `articles`.
Cada item tem este formato mínimo:

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
        "source_text": "Texto integral ou trecho suficientemente longo da página oficial, contendo literalmente as citações usadas em evidence."
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
        "is_cr_only": false
      },
      "evidence": {
        "status": "trecho literal que comprova o status",
        "organ": "trecho literal com o nome do órgão",
        "vacancies_total": "trecho literal com o número de vagas",
        "salary_min": "trecho literal com o valor",
        "enrollment_end_date": "trecho literal com a data final"
      },
      "article": {
        "title": "Título de até 160 caracteres",
        "excerpt": "Resumo de 60 a 300 caracteres.",
        "body_markdown": "Corpo em Markdown, com 180 a 400 palavras em geral.",
        "seo_description": "Descrição de até 155 caracteres.",
        "keywords": ["concurso", "vagas", "edital"],
        "category_slugs": ["judiciario", "tj", "sp"]
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

Regras do bundle:

- `source.url` e todas as `sources[].url` precisam ser de domínio oficial
  (`.gov.br`, `fgv.br`, `vunesp.com.br`, `.jus.br`, `.leg.br`, `.mp.br` etc.).
- `source.source_text` precisa ter pelo menos 250 caracteres e conter
  literalmente cada citação de `evidence`.
- `facts` são a fonte autoritativa dos campos numéricos e de status. O corpo
  não pode contradizê-los.
- `article.category_slugs` precisa usar slugs existentes no Sanity. O caminho
  manual preserva exatamente as categorias declaradas, sem misturar as
  categorias inferidas automaticamente.
- `contest_phase` é opcional; use quando a fase automática não representar o
  momento do certame (por exemplo, `ato_intermediario` ou `encerrado`).
- `contest_key` é obrigatório e deve ser estável (ex.: `fgv:tjap26`).

## Etapa 4 — Validar e criar os rascunhos

```powershell
# Dry-run: valida tudo, não grava nada
python -m pipeline manual --bundle data/manual_articles/bundle_AAAA-MM-DD.json

# Aplicar: cria somente drafts.* com reviewStatus=pending
python -m pipeline manual --bundle data/manual_articles/bundle_AAAA-MM-DD.json --apply
```

O dry-run precisa terminar com `erros: 0`, fact-check mínimo de 90/100 e
verificação mínima de 95/100. Se algum item falhar, corrija o bundle e rode de
novo. O comando usa `createIfNotExists`: um rascunho existente não é
sobrescrito.

O resumo fica em:

```text
data/manual_runs/manual-AAAA-MM-DD-dry-run.json
data/manual_runs/manual-AAAA-MM-DD-apply.json
```

## Etapa 5 — Revisão humana e publicação

Abra o Studio: <https://concursos-agora.sanity.studio/>

Checklist do revisor:

- [ ] Título e resumo correspondem ao edital/página oficial.
- [ ] Número de vagas, salários, taxa e datas conferem com a fonte.
- [ ] Status (`aberto`, `previsto`, `em_andamento`, `encerrado`) está correto.
- [ ] Categorias, UF, cidade, órgão e banca estão corretos.
- [ ] Links de `sourceUrls` abrem a página oficial.
- [ ] Imagem e SEO estão adequados.
- [ ] `reviewStatus` foi alterado para `approved` somente depois da conferência.
- [ ] A publicação é feita manualmente no Studio.

Se algo estiver errado, altere `reviewStatus` para `rejected` e registre o
motivo. Não publique para "corrigir depois".

## Etapa 6 — Fechamento do dia

```powershell
# Rascunhos pendentes e idade
python -m pipeline daily --sources fgv --limit 1 --no-extract

# Estado local do pipeline
python -m pipeline stats
```

O `queue.md` mostra os rascunhos pendentes e destaca os que passaram de
`--stale-days` (padrão: 7 dias). Rascunho parado por muito tempo deve ser
revisado ou rejeitado; não deixe a fila crescer sem controle.

## Etapa 7 — Enriquecimento automático dos rascunhos

Depois da revisão inicial, o agente de enriquecimento amplia os rascunhos
recentes com uma seção `## Informações complementares`, contendo resumo
confirmado, orientação de estudo e fontes oficiais. Ele não altera o texto
original, não publica e só grava em `drafts.*`.

```powershell
# Dry-run
.\scripts\enrich.ps1

# Aplicar
.\scripts\enrich.ps1
```

Ou diretamente:

```powershell
python -m pipeline enrich --limit 10
python -m pipeline enrich --limit 10 --apply
```

O enriquecimento pode ser agendado para rodar depois da fila diária:

```powershell
.\scripts\register-enrichment-task.ps1 -Time "09:00"
```

## Agendamento no Windows

Registre a tarefa uma única vez:

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

## Solução de problemas

- **Fila vazia**: todas as fontes podem ter falhado ou todos os candidatos já
  estão cobertos. Veja `errors` no `queue.json` e o log do dia.
- **Muitos `duplicate`**: é o comportamento esperado quando a base já cobriu os
  concursos. O cooldown de 15 dias também bloqueia o mesmo `contest_key`.
- **`needs_review`**: falta trecho literal para um fato crítico. Abra a fonte,
  confira e complete o bundle; não relaxe a evidência.
- **Erro de categoria**: use apenas slugs existentes. Consulte a lista no
  Studio ou rode `python -m pipeline doctor` para confirmar o Sanity.
- **Rascunho antigo**: o pipeline não apaga nem publica. Use o Studio ou
  `python -m pipeline delete-draft --id "drafts.<slug>" --yes` com cuidado.
