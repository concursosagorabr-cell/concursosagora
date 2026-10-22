# Monitor de fontes oficiais + OpenHands (PoC)

Este experimento implementa a primeira etapa recomendada para o Concursos Agora:
um **monitor determinístico de retificações** que só chama um LLM quando o hash
de uma fonte oficial muda.

Ele é isolado do runner de produção:

- não publica;
- não escreve no Sanity;
- não usa browser aberto nem terminal;
- não acessa URLs fora da watchlist;
- respeita `robots.txt` pelo `pipeline.scrape.Scraper`;
- mantém `AUTO_PUBLISH=false` e revisão humana obrigatória.

## Fluxo

```text
watchlist.yaml
      │
      ▼
Scraper (robots + delay + cache)
      │
      ▼
snapshot + hash + diff
      │
      ├── sem mudança ──► fim (zero LLM)
      │
      └── mudança ──────► change-report.json
                              │
                              ▼
                    worker.py (OpenHands opcional)
                              │
                              ▼
                    research-report.json
                              │
                              ▼
                    validate.py (quotes + URLs)
                              │
                              ▼
                 revisão humana / pipeline atual
```

## 1. Monitor determinístico

Use o venv atual do pipeline; não há dependência nova.

```powershell
cd "C:\Users\cleber.jose\Documents\Nova pasta\agente-artigos"

# copie a watchlist de exemplo
Copy-Item experiments\openhands_monitor\watchlist.example.yaml experiments\openhands_monitor\watchlist.yaml

# primeira execução: cria a linha de base
python -m experiments.openhands_monitor.monitor `
  --watchlist experiments\openhands_monitor\watchlist.yaml `
  --data-dir data\openhands_monitor

# execuções seguintes: só grava relatório se algo mudou
python -m experiments.openhands_monitor.monitor `
  --watchlist experiments\openhands_monitor\watchlist.yaml `
  --data-dir data\openhands_monitor
```

Para testar um único concurso:

```powershell
python -m experiments.openhands_monitor.monitor `
  --watchlist experiments\openhands_monitor\watchlist.yaml `
  --watch-id sesa-2027 `
  --data-dir data\openhands_monitor
```

Saídas:

- `data/openhands_monitor/snapshots/<id>.json`: último snapshot;
- `data/openhands_monitor/snapshots/<id>.previous.json`: snapshot anterior quando mudou;
- `data/openhands_monitor/changes/<id>-<timestamp>.json`: relatório de mudança;
- `data/openhands_monitor/last-run.json`: resumo da execução.

O relatório contém `added`, `removed`, `diff`, `added_links`, `removed_links` e
`signals` (retificação, prazo, vagas, data, valor). Ele **não** interpreta a
mudança; isso é opcional na etapa seguinte.

## 2. Worker OpenHands (opcional)

O worker recebe apenas o relatório e o snapshot. Ele não navega, não executa
comandos e não escreve no Sanity. A resposta é forçada para o schema
`ResearchReport` via `response_schema` do SDK e depois validada por código.

Crie um venv separado:

```powershell
cd "C:\Users\cleber.jose\Documents\Nova pasta\agente-artigos"
python -m venv G:\opencode-work\openhands-venv
G:\opencode-work\openhands-venv\Scripts\pip install -r experiments\openhands_monitor\requirements-openhands.txt
```

Configure o modelo (exemplo; ajuste ao provedor que você usa):

```powershell
$env:OPENHANDS_LLM_MODEL = "groq/openai/gpt-oss-120b"
$env:OPENHANDS_LLM_API_KEY = $env:GROQ_API_KEY
# opcional:
# $env:OPENHANDS_LLM_BASE_URL = "https://..."
# $env:OPENHANDS_CAPABILITY_OVERRIDES = '{"supports_prompt_cache_key": false}'
```

O worker desliga automaticamente `supports_prompt_cache_key` para modelos
`groq/*`. O SDK envia esse parâmetro por padrão e a Groq o rejeita com
`property 'prompt_cache_key' is unsupported`. Para outro provedor que também
rejeite o parâmetro, use `--capability-overrides` com JSON.

Primeiro veja o prompt sem chamar o modelo:

```powershell
G:\opencode-work\openhands-venv\Scripts\python -m experiments.openhands_monitor.worker `
  data\openhands_monitor\changes\sesa-2027-20260101T000000Z.json `
  --dry-run
```

Depois execute:

```powershell
G:\opencode-work\openhands-venv\Scripts\python -m experiments.openhands_monitor.worker `
  data\openhands_monitor\changes\sesa-2027-20260101T000000Z.json
```

Saídas:

- `<relatorio>.research.json`: relatório estruturado do agente;
- `<relatorio>.research.validation.json`: validação determinística.

O worker retorna código `2` se alguma quote não existir literalmente no snapshot
ou se alguma URL não for oficial. Nesse caso, o relatório não deve ser usado.

## 3. Validação independente

```powershell
python -m experiments.openhands_monitor.validate `
  data\openhands_monitor\changes\sesa-2027-20260101T000000Z.research.json `
  --data-dir data\openhands_monitor
```

O validador confere:

- `watch_id` e `content_hash` contra o snapshot;
- cada `quote` contra o texto baixado;
- cada URL contra a lista de fontes oficiais;
- bloqueio de `documento.vunesp.com.br`;
- presença de `requires_human_review=true`.

O campo de resumo do schema é `overview` (não `summary`, que é reservado pelo
SDK). O worker foi testado de ponta a ponta em 21/10/2026 com um relatório
sintético da SESA: a Groq retornou `changes[0].quote = "Vagas: 1.405"` e a
validação determinística aceitou a quote.

## Limitações atuais

- O monitor compara o texto da página e os links; ainda não baixa o conteúdo
  interno de PDFs. A próxima etapa é adicionar hash de PDF e extração por página.
- O worker não tem ferramentas de navegação. Isso é intencional: o corpus é
  fechado e auditável.
- O worker não substitui o validador. Ele só classifica o diff.
- Nada aqui deve ser conectado ao runner de produção antes de um golden set com
  SESA, UNIP, PMS, INSS e Guarda.
