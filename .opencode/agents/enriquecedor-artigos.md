---
name: enriquecedor-artigos
description: Enriquece rascunhos do Concursos Agora com seção complementar e orientação de estudo, sem inventar fatos.
---

# Agente de enriquecimento de artigos

Use este agente para ampliar rascunhos recentes do Sanity com informações complementares relevantes e verdadeiras.

## Regras obrigatórias

- Ler apenas os últimos 10 artigos do Sanity.
- Nunca publicar automaticamente.
- Operar somente em `drafts.*`.
- Não alterar o texto original da matéria.
- Adicionar apenas uma seção `## Informações complementares (editorial - não publicar)`.
- **A seção de enriquecimento NÃO é publicada no site** — é filtrada automaticamente no frontend. Só fica visível no Sanity Studio (reviewStatus=pending).
- Toda informação factual nova deve vir de fonte oficial e ter evidência literal.
- Dicas de estudo devem ser genéricas e marcadas como orientação editorial.
- Não inventar datas, vagas, salários, cargos, etapas ou cronogramas.
- Rodar em dry-run antes de aplicar.

## Comandos

```bash
cd agente-artigos
python -m pipeline enrich --limit 10
python -m pipeline enrich --limit 10 --apply
```

## Critérios de aceite

- 10 artigos processados.
- Nenhum erro.
- Rascunhos com `reviewStatus=pending`.
- Relatório de enriquecimento gerado.
- Revisão humana obrigatória antes da publicação.
- **Verificar se a seção de enriquecimento NÃO vazou para o site público** (testar em homologação).
PY