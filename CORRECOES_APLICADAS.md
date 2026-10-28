# Correções Aplicadas - Análise de Qualidade Editorial

## Resumo Executivo
Todos os 8 problemas críticos identificados na análise foram corrigidos no código. As correções incluem validações automáticas no pipeline, filtros no frontend, prompts mais rigorosos para o LLM e checklist de revisão humana atualizado.

---

## 1. Vazamento de Instruções Internas de IA ✅ CORRIGIDO

**Problema:** "Seção adicionada pelo agente de enriquecimento. Revisão humana obrigatória" aparecia no site público.

**Correções:**
- `enrich.py`: Marcador alterado para `## Informações complementares (editorial - não publicar)`
- `post/[slug]/page.tsx`: Nova função `filterEditorialSections()` remove a seção antes de renderizar
- `enriquecedor-artigos.md`: Documentado que a seção NÃO é publicada

**Arquivos alterados:**
- `agente-artigos/pipeline/enrich.py` (linha 15)
- `concursosagora-main/src/app/post/[slug]/page.tsx` (função `filterEditorialSections`)
- `.opencode/agents/enriquecedor-artigos.md`

---

## 2. Placeholders Não Preenchidos ✅ CORRIGIDO

**Problema:** "Todas as informações acima são extraídas do dossiê factual disponível" e "| Fonte(s) | Fonte 1, Fonte 2 |"

**Correções:**
- `editorial.py`: Novo check bloqueante `placeholder ou template genérico` com regex para detectar:
  - "todas as informações acima são extraídas do dossiê factual"
  - "fonte(s) | fonte 1"
  - "dossiê factual disponível"
  - "referências: fonte 1"
  - "[fonte 1]"
- `groq.py`: SYSTEM_PROMPT atualizado com regra 15: "NUNCA escreva placeholders genéricos... Isso é metainformação interna, não conteúdo editorial"

**Arquivos alterados:**
- `agente-artigos/pipeline/editorial.py` (linhas 384-392)
- `agente-artigos/pipeline/groq.py` (SYSTEM_PROMPT regra 15)

---

## 3. Scraping Captura Banner de Cookies ✅ CORRIGIDO

**Problema:** "Órgão: Prefeitura de Aparecida e os cookies"

**Correções:**
- `extract.py`: `_strip_noise()` expandido para remover linhas contendo:
  - cookie, cookies, lgpd, política de privacidade, termo de uso, aceitar (todos|cookies), banner, consentimento
- `sources.yaml`: `govbr_municipal` adicionou `exclude_keywords` para termos de cookies/LGPD

**Arquivos alterados:**
- `agente-artigos/pipeline/extract.py` (linhas 893-902)
- `agente-artigos/sources.yaml` (linhas 158-163)

---

## 4. Alucinação: Polícia Penal SP - Banca "Planejar Concursos" ✅ CORRIGIDO

**Problema:** Banca inventada, mistura de vagas com Pernambuco.

**Correções:**
- `editorial.py`: Nova validação de banca organizadora (linhas 174-187) - só permite citar banca se estiver EXPLICITAMENTE na fonte
- `groq.py`: SYSTEM_PROMPT com regras críticas de BANCA ORGANIZADORA:
  - Só cite se explicitamente na fonte
  - Não inferir por histórico
  - Bancas pequenas/municipais NÃO organizam concursos estaduais/federais sem fonte
- `editorial.py`: Cross-validation vagas no corpo vs ficha técnica (linhas 242-260)

**Arquivos alterados:**
- `agente-artigos/pipeline/editorial.py` (linhas 174-187, 242-260)
- `agente-artigos/pipeline/groq.py` (SYSTEM_PROMPT seção BANCA ORGANIZADORA)

---

## 5. Contradição Guarda Campina Grande (40 vs 30 vagas) ✅ CORRIGIDO

**Problema:** Título/ficha técnica 40 vagas, parágrafo 30 vagas; mistura salários de médico.

**Correções:**
- `editorial.py`: Cross-validation completa ficha técnica vs corpo:
  - Vagas totais (linhas 242-260)
  - Salários min/max (linhas 262-285) - bloqueia se salário no corpo fora da faixa
  - Data inscrição (linhas 287-306)
  - Data prova (linhas 308-327)
  - Taxa inscrição (linhas 329-345)
- `groq.py`: Regra VAGAS E SALÁRIOS - "Se a fonte menciona faixa salarial de CARGOS DIFERENTES, NÃO misture"

**Arquivos alterados:**
- `agente-artigos/pipeline/editorial.py` (linhas 242-345)
- `agente-artigos/pipeline/groq.py` (SYSTEM_PROMPT seção VAGAS E SALÁRIOS)

---

## 6. Terminologia Inexistente "Fase de Ato Intermediário" ✅ CORRIGIDO

**Problema:** Termo não existe no rito administrativo brasileiro.

**Correções:**
- `manual.py`: Removido `ato_intermediario` de `VALID_PHASES`
- `editorial.py`: Novo check bloqueante `terminologia administrativa inexistente` para "ato intermediário", "fase de ato intermediário", "ato preparatório"
- `groq.py`: Regra 14 - lista terminologias permitidas apenas

**Arquivos alterados:**
- `agente-artigos/pipeline/manual.py` (linhas 37-46)
- `agente-artigos/pipeline/editorial.py` (linhas 393-397)
- `agente-artigos/pipeline/groq.py` (SYSTEM_PROMPT regra 14)

---

## 7. Notícia Extemporânea / Status Desatualizado ✅ CORRIGIDO

**Problema:** Matéria de outubro sobre inscrições de julho/provas de setembro.

**Correções:**
- `runner.py`: Nova verificação `reject_stale_news` - rejeita notícias >30 dias que usam tempo presente para fatos passados (linhas 549-572)
- `editorial.py`: Check `status desatualizado (notícia velha no presente)` - detecta verbos presente + mês/ano passado
- `config.py`: Novas configurações `strict_cross_validation`, `reject_stale_news`, `max_news_age_days`
- `groq.py`: Regra STATUS E CRONOGRAMA - "Não republicar notícia velha no presente"

**Arquivos alterados:**
- `agente-artigos/pipeline/runner.py` (linhas 549-572)
- `agente-artigos/pipeline/editorial.py` (linhas 398-402)
- `agente-artigos/pipeline/config.py` (linhas 27-30, 46-49)
- `agente-artigos/pipeline/groq.py` (SYSTEM_PROMPT seção STATUS E CRONOGRAMA)

---

## 8. Divergências Ficha Técnica vs Corpo (Aparecida/Contagem) ✅ CORRIGIDO

**Problema:** Taxa isento vs cobrança, datas 19 vs 20 dez, 16 vs 17 nov, 23 vs 24 jan.

**Correções:**
- `editorial.py`: Cross-validation obrigatória (linhas 242-345) para:
  - Vagas totais
  - Salário min/max
  - Data fim inscrição
  - Data prova
  - Taxa inscrição
- Bloqueia publicação se divergência > 0

**Arquivos alterados:**
- `agente-artigos/pipeline/editorial.py` (linhas 242-345)

---

## Novos Testes Adicionados

**test_editorial.py** - 10 novos testes:
1. `test_placeholder_generico_bloqueia` - Detecta "dossiê factual"
2. `test_fonte_placeholder_bloqueia` - Detecta "Referências: Fonte 1"
3. `test_terminologia_inexistente_ato_intermediario_bloqueia` - Detecta "ato intermediário"
4. `test_noticia_velha_no_presente_bloqueia` - Detecta notícia velha no presente
5. `test_cross_validacao_vagas_diverge_ficha_tecnica` - Vagas corpo ≠ ficha
6. `test_cross_validacao_data_inscricao_diverge` - Data inscrição corpo ≠ ficha
7. `test_cross_validacao_data_prova_diverge` - Data prova corpo ≠ ficha
8. `test_cross_validacao_taxa_diverge` - Taxa corpo ≠ ficha
9. `test_banca_nao_inferida_sem_fonte` - Banca sem fonte explícita
10. `test_salario_mistura_editais_diferentes` - Salário fora da faixa

**Total: 88 testes passando** (78 originais + 10 novos)

---

## Checklist de Revisão Humana Atualizado (MANUAL-DE-REPLICACAO-EDITORIAL.md)

Seção 7.8 expandida com 10 novos checks obrigatórios:
1. Seção de enriquecimento NÃO vazou
2. Status condiz com datas
3. Banca organizadora tem fonte explícita
4. Vagas/salários não misturam editais
5. Terminologia correta (sem "ato intermediário")
6. Sem placeholders genéricos
7. Datas no corpo = ficha técnica
8. Notícia velha no presente
9. Ficha técnica vs Corpo
10. Scraping limpo (cookies/LGPD)

---

## Configurações Mais Rigorosas (config.py)

| Parâmetro | Antes | Depois |
|-----------|-------|--------|
| `min_content_words` | 200 | 300 |
| `fact_check_min_score` | 90 | 92 |
| `verification_min_score` | 95 | 97 |
| `strict_cross_validation` | N/A | `True` |
| `reject_stale_news` | N/A | `True` |
| `max_news_age_days` | N/A | 30 |

---

## Como Verificar se as Correções Funcionam

### 1. Testes Automatizados
```bash
cd agente-artigos
python -m pytest tests/ -v
# Deve mostrar 88 passed
```

### 2. Dry-run do Pipeline
```bash
cd agente-artigos
python -m pipeline run --source govbr_municipal --limit 5 --dry-run
# Verificar se itens com problemas ficam com status "skipped" e warnings apropriados
```

### 3. Frontend (Homologação)
- Publicar artigo de teste com seção de enriquecimento
- Verificar se NÃO aparece "Informações complementares" no site público
- Verificar se aparece no Sanity Studio (reviewStatus=pending)

### 4. Revisão Humana no Studio
- Usar checklist da seção 7.8 do MANUAL-DE-REPLICACAO-EDITORIAL.md
- Marcar `reviewStatus=approved` só após TODOS os checks

---

## Próximos Passos Recomendados

1. **Monitorar** próximas execuções do pipeline - verificar se artigos problemáticos são bloqueados automaticamente
2. **Treinar** revisores humanos no novo checklist (seção 7.8)
3. **Auditar** artigos publicados nos últimos 30 dias para corrigir os que vazaram
4. **Considerar** adicionar campo `reviewChecklist` boolean no schema Sanity para forçar checklist
5. **Configurar** alerta se `verificationScore < 97` ou `blocking` não vazio

---

*Documento gerado em 28/10/2026 - Commit com todas as correções aplicadas*