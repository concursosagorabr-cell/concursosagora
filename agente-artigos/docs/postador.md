# Postador de artigos do usuário

O postador recebe artigos **já escritos** e grava no Sanity no formato do portal. Ele não faz checagem factual, não reescreve a matéria e não publica sem uma flag explícita.

- Script leve: `agente-artigos/postar.py`
- Módulo: `agente-artigos/pipeline/postador.py`
- Comando equivalente no CLI completo: `python -m pipeline post`
- Agente OpenCode: `.opencode/agents/agente-postador.md`

## Início rápido

```powershell
cd agente-artigos

# 1. Veja autores e categorias existentes
python postar.py --list-categories --json

# 2. Valide o bundle sem gravar
python postar.py --bundle data/postador/meu-artigo.json --json

# 3. Crie rascunhos (reviewStatus=pending)
python postar.py --bundle data/postador/meu-artigo.json --apply

# 4. Publique direto (reviewStatus=approved)
python postar.py --bundle data/postador/meu-artigo.json --publish
```

O script `postar.py` importa apenas `pipeline.postador`, `pipeline.sanity`, `pipeline.config`, `pipeline.portable_text` e `pipeline.dedupe`. Ele **não carrega o Scrapling**, então funciona em um ambiente mínimo com `PyYAML` e `python-dotenv`.

## Modos

| Flag | O que faz | Grava? |
|---|---|---|
| nenhuma | Dry-run: valida tudo e mostra o que seria feito | Não |
| `--apply` | Cria rascunhos `drafts.<slug>` com `reviewStatus=pending` | Sim |
| `--publish` | Cria o documento publicado `<slug>` com `reviewStatus=approved` | Sim |
| `--update` | Atualiza um post existente no lugar, preservando slug/URL, data, autor e imagem principal (quando omitidos) | Sim |
| `--update --publish` | Atualiza e, se o existente for rascunho, publica | Sim |
| `--allow-duplicate` | Cria um novo post mesmo com título/slug parecido (slug único) | Depende de `--apply`/`--publish` |
| `--force` | Sobrescreve o documento com o slug exato informado | Depende do modo |

`--update` e `--allow-duplicate` são mutuamente exclusivos.

## Formato do bundle

O bundle é um JSON com um array `articles`:

```json
{
  "run_id": "postador-2026-10-28-camara",
  "default_author_slug": "amanda-marques",
  "articles": [
    {
      "title": "Título para o CMS",
      "excerpt": "Linha fina / subtítulo",
      "body_markdown": "Corpo em Markdown...",
      "author_slug": "amanda-marques",
      "published_at": "2026-10-28T12:00:00-03:00",
      "status": "aberto",
      "contest_status": "inscricoes_abertas",
      "organ": "Câmara dos Deputados",
      "banca": "Cebraspe",
      "sphere": "FEDERAL",
      "state_uf": "Nacional",
      "city_name": "",
      "education_level": ["superior"],
      "vacancies_total": 184,
      "salary_min": 32070.88,
      "salary_max": 32070.88,
      "registration_fee": 130.00,
      "has_exemption": false,
      "is_cr_only": false,
      "enrollment_start_date": "2026-10-15",
      "enrollment_end_date": "2026-11-17",
      "exam_date": "2027-01-17",
      "categories": ["legislativo", "federal", "concursos-abertos"],
      "source_urls": [
        {
          "title": "Página oficial",
          "url": "https://www.cebraspe.org.br/concursos/",
          "type": "official",
          "kind": "official_primary",
          "usage": "facts"
        }
      ],
      "seo": {
        "meta_title": "Concurso Câmara: 184 vagas e R$ 32 mil",
        "meta_description": "Edital da Câmara tem 184 vagas para Analista Legislativo, salário de R$ 32.070,88 e provas em 26 capitais.",
        "keywords": ["concurso câmara dos deputados", "analista legislativo", "cebraspe"]
      }
    }
  ]
}
```

Também é aceito um único objeto de artigo (sem o array `articles`) ou um array JSON direto de artigos.

### Campos

| Campo | Tipo | Obrigatório | Observações |
|---|---|---|---|
| `title` | string | Sim | 8 a 160 caracteres |
| `excerpt` | string | Sim | Até 300 caracteres |
| `body_markdown` | string | Sim | Markdown compatível com Portable Text |
| `slug` | string | Não | Se omitido, gerado a partir do título |
| `author_slug` | string | Não | Slug existente; se omitido, usa o autor padrão (em `--update`, preserva o autor do post existente) |
| `published_at` | ISO datetime | Não | Se omitido, usa agora; em `--update`, preserva a data existente |
| `status` | string | Não | `aberto`, `previsto`, `em_andamento`, `encerrado` |
| `contest_status` | string | Não | Fase do certame (ver abaixo) |
| `organ` | string | Não | Órgão responsável |
| `banca` | string | Não | Banca organizadora |
| `sphere` | string | Não | `FEDERAL`, `ESTADUAL`, `DISTRITAL`, `MUNICIPAL`, `NACIONAL` |
| `state_uf` | string | Não | UF ou `Nacional` |
| `city_name` | string | Não | Cidade |
| `education_level` | string[] | Não | `fundamental`, `medio`, `tecnico`, `superior` |
| `vacancies_total` | number | Não | Total de vagas |
| `vacancies_by_role` | object[] | Não | `role`, `vacancies`, `salary`, `requirements` |
| `salary_min` | number | Não | Salário mínimo/inicial |
| `salary_max` | number | Não | Salário máximo |
| `registration_fee` | number | Não | Taxa de inscrição |
| `has_exemption` | boolean | Não | Se há isenção |
| `is_cr_only` | boolean | Não | Se é só cadastro de reserva |
| `enrollment_start_date` | date | Não | `YYYY-MM-DD` |
| `enrollment_end_date` | date | Não | `YYYY-MM-DD` |
| `exam_date` | date | Não | `YYYY-MM-DD` |
| `categories` | string[] | Não | 1 a 4 slugs existentes |
| `source_urls` | object[] | Não | Somente URLs reais |
| `seo` | object | Não | `meta_title`, `meta_description`, `keywords`, `no_index`, `canonical_url` |
| `main_image` | object | Não | `url`, `alt`, `caption`, `credit`; em `--update`, se omitida, preserva a imagem existente |
| `contest_key` | string | Não | Chave de deduplicação do certame |
| `ai_assisted` | boolean | Não | Padrão `false` |

### `contest_status`

Valores aceitos:

- `aguardando_autorizacao`
- `autorizado`
- `comissao_formada`
- `ato_intermediario`
- `edital_publicado`
- `inscricoes_abertas`
- `provas_aplicadas`
- `resultado_publicado`
- `encerrado`

### `source_urls`

Cada item:

```json
{
  "title": "Página oficial",
  "url": "https://...",
  "type": "official",
  "kind": "official_primary",
  "usage": "facts",
  "evidence": "Trecho opcional",
  "checked_at": "2026-10-28T12:00:00-03:00"
}
```

- `type`: `official` ou `secondary`
- `kind`: `official_primary`, `official_secondary`, `journalism` ou `aggregator`
- `usage`: `facts`, `discovery` ou `corroboration`

Se o artigo não trouxer a URL, omita `source_urls`. **Não invente URLs.**

### `seo`

```json
{
  "meta_title": "Até 70 caracteres",
  "meta_description": "Até 160 caracteres",
  "keywords": ["termo 1", "termo 2"],
  "no_index": false,
  "canonical_url": "https://..."
}
```

Se `meta_title` ou `meta_description` forem omitidos, o postador usa o título/excerpt cortados nos limites.

### `main_image`

```json
{
  "url": "https://...",
  "alt": "Texto alternativo",
  "caption": "Legenda",
  "credit": "Foto: ..."
}
```

A imagem é baixada e enviada ao Sanity somente em `--apply`/`--publish`/`--update`. No dry-run, ela não é enviada.

## Markdown e Portable Text

O conversor `pipeline/portable_text.py` entende:

- Parágrafos
- `##` e `###`
- Listas com `-`
- Negrito `**texto**`
- Itálico `*texto*`
- Código `` `texto` ``
- Links `[texto](url)`

Não entende tabelas, HTML, imagens ou blocos de código. Converta tabelas em listas:

```markdown
## Ficha Técnica Oficial

- **Órgão:** Câmara dos Deputados
- **Banca Organizadora:** Cebraspe
- **Vagas:** 184
- **Remuneração Inicial:** R$ 32.070,88
```

## Exemplo completo

Este é o artigo da Câmara dos Deputados convertido para o bundle. O link oficial não foi incluído porque o texto de origem não trazia a URL.

```json
{
  "run_id": "postador-camara-dos-deputados-2026-10-28",
  "default_author_slug": "amanda-marques",
  "articles": [
    {
      "title": "Concurso Câmara dos Deputados: Edital com 184 vagas para Analista, salário de R$ 32 mil e Guia Completo de Estudos",
      "excerpt": "Certame organizado pelo Cebraspe contempla diversas especialidades de nível superior com provas em todas as capitais; veja raio-x das disciplinas e como pontuar alto.",
      "body_markdown": "A Câmara dos Deputados publicou edital de concurso público visando ao preenchimento de 66 vagas imediatas e 118 para formação de cadastro de reserva para o cargo de Analista Legislativo. A carreira exige nível superior na especialidade concorrida e oferece remuneração inicial de R$ 32.070,88 para jornada de 40 horas semanais em Brasília/DF.\n\nCom aplicação descentralizada em todas as capitais brasileiras sob responsabilidade do Cebraspe, o certame atrai concorrentes de alta performance de todo o país.\n\n## Ficha Técnica Oficial\n\n- **Órgão:** Câmara dos Deputados\n- **Banca Organizadora:** Cebraspe\n- **Cargo:** Analista Legislativo (diversas especialidades)\n- **Vagas:** 66 imediatas + 118 Cadastro Reserva (Total: 184)\n- **Escolaridade:** Nível Superior com diploma na área específica\n- **Remuneração Inicial:** R$ 32.070,88\n- **Período de Inscrição:** 15 de outubro a 17 de novembro de 2026 (até as 18h)\n- **Taxa de Inscrição:** R$ 130,00\n- **Data de Aplicação das Provas:** 17 de janeiro de 2027\n- **Locais de Prova:** 26 capitais estaduais e Distrito Federal\n- **Lotação dos Aprovados:** Brasília / DF\n\n## Cargos e Áreas de Atuação\n\nO edital contempla vagas imediatas e cadastro nas seguintes áreas:\n\n- **Comunicação Social:** Divulgação Institucional, Jornalismo e Relações Públicas.\n- **Documentação e Informação:** Arquivologia e Biblioteconomia.\n- **Engenharia:** Civil, Elétrica, Eletrônica/Telecomunicações e Mecânica.\n- **Cultura e História:** Museólogo.\n- **Apoio Técnico:** Registro e Redação Legislativa.\n\n## 🎯 Guia Tático de Estudos: Como Gabaritar a Prova da Câmara\n\nConcursos legislativos federais possuem um corte elevadíssimo. Não basta dominar a matéria básica; é preciso acertar as peculiaridades que a maioria dos candidatos negligencia:\n\n### 1. O \"Coração\" da Prova: Processo Legislativo e Regimento Interno (RICD)\n\n**Constituição Federal (Arts. 59 a 69):** O processo legislativo constitucional deve estar memorizado. Foque nas regras de tramitação de Emendas Constitucionais (quóruns, turnos, iniciativa), Medidas Provisórias (prazos, comissões mistas, perda de eficácia) e Leis Delegadas.\n\n**Regimento Interno da Câmara dos Deputados (RICD):** Este é o maior divisor de águas. O Cebraspe costuma cobrar a dinâmica das Comissões Permanentes (especialmente CCJC), competência conclusiva de comissões (art. 24, II do RICD), pedido de urgência regimental e recursos ao Plenário. Monte um fluxo visual de tramitação de um Projeto de Lei ordinário da apresentação à sanção.\n\n### 2. Português Cebraspe: Foco em Reescritura e Coesão\n\nA banca não costuma focar em decoreba gramatical isolada. As questões exigem identificar se a substituição de um conectivo preserva o sentido original e a correção gramatical.\n\nDomine as regras do Manual de Redação da Presidência da República e a norma padrão para textos formais, pois o jargão parlamentar permeia os enunciados.\n\n### 3. Gestão de Risco Cebraspe\n\nNo modelo tradicional da banca, cada marcação errada costuma anular uma resposta certa.\n\nEm certames legislativos com remuneração acima de R$ 30 mil, a nota de corte líquida supera facilmente 75% a 80%. Portanto, não chutar no escuro é regra de sobrevivência: deixe em branco apenas aquilo em que você realmente não possui pista textual ou lógica.\n\n### 4. A Discursiva Define a Nomeação\n\nPratique semanalmente a redação técnica voltada a estudos de caso da sua área de especialidade.\n\nO Cebraspe pontua pesadamente a apresentação de tópicos na ordem exigida pelo comando da questão. Estruture suas respostas exatamente espelhando os subitens do enunciado (Padrão de Resposta / Espelho de Correção).\n\n## Link Oficial do Certame\n\nAcesse o edital na íntegra, comunicados e página de inscrição:\n\nPágina Oficial da Câmara dos Deputados no Cebraspe",
      "status": "aberto",
      "contest_status": "inscricoes_abertas",
      "organ": "Câmara dos Deputados",
      "sphere": "FEDERAL",
      "banca": "Cebraspe",
      "state_uf": "Nacional",
      "education_level": ["superior"],
      "vacancies_total": 184,
      "salary_min": 32070.88,
      "salary_max": 32070.88,
      "registration_fee": 130.00,
      "enrollment_start_date": "2026-10-15",
      "enrollment_end_date": "2026-11-17",
      "exam_date": "2027-01-17",
      "categories": ["legislativo", "federal", "concursos-abertos"],
      "seo": {
        "meta_title": "Concurso Câmara dos Deputados: 184 vagas e R$ 32 mil",
        "meta_description": "Edital da Câmara dos Deputados tem 184 vagas para Analista Legislativo, salário de R$ 32.070,88 e provas em 26 capitais. Veja o guia de estudos.",
        "keywords": ["concurso câmara dos deputados", "analista legislativo", "cebraspe", "184 vagas", "salário r$ 32 mil"]
      }
    }
  ]
}
```

## Duplicatas

O postador compara o slug e o título com os posts existentes. Se a similaridade do título for pelo menos 98% ou o slug for exato, o item é marcado como `skipped_duplicate` e nada é gravado.

- Para atualizar o existente: `--update` (preserva slug/URL, `publishedAt` se o bundle não trouxer `published_at`, o autor se o bundle não trouxer `author_slug` e a imagem principal se o bundle não trouxer `main_image`).
- Para atualizar e publicar um rascunho existente: `--update --publish`.
- Para criar outro mesmo: `--allow-duplicate` (slug único).
- Para sobrescrever um slug exato: `--force`.

## Revalidação do frontend

Depois de publicar ou atualizar, o postador tenta chamar `/api/revalidate` se `SANITY_REVALIDATE_SECRET` estiver configurado. O resultado aparece no resumo (`revalidated`). Se falhar, o post já foi gravado; o frontend pode levar alguns minutos para atualizar.

## Resumo da execução

Cada execução grava um JSON em:

```
agente-artigos/data/postador_runs/<run_id>-<modo>.json
```

O resumo contém:

- `created`, `published`, `updated`, `skipped`, `dry_run`, `errors`
- `items` com título, slug, status, ID, URL, categorias, autor e avisos
- `documents` com os documentos completos enviados ao Sanity
- `summary_path`

O arquivo é gravado em UTF-8. No PowerShell, evite `python postar.py ... --json > arquivo.json`:
o operador `>` grava em UTF-16. Prefira ler o arquivo de resumo em
`data/postador_runs/` ou use `Out-File -Encoding utf8`.

## Solução de problemas

- **`ModuleNotFoundError: yaml` / `dotenv`:** instale `PyYAML` e `python-dotenv` ou use o venv do projeto.
- **`Variáveis Sanity ausentes`:** confira `agente-artigos/.env.local` e `concursosagora-main/.env.local`.
- **`Sanity HTTP 401/403`:** o `SANITY_API_TOKEN` não tem permissão de escrita.
- **Categoria inexistente:** rode `python postar.py --list-categories --json` e use o slug exato.
- **Autor não encontrado:** use um slug da lista ou omita `author_slug`.
- **`skipped_duplicate`:** o post já existe; use `--update` ou `--allow-duplicate` com autorização.
- **Revalidação falhou:** o post foi gravado; informe a URL e o aviso.

## Segurança

- O postador lê as credenciais de `.env.local` (nunca as imprime).
- O modo padrão é dry-run.
- `--apply` cria rascunhos com `reviewStatus=pending`.
- `--publish` publica com `reviewStatus=approved` e só deve ser usado com pedido explícito.
- `--update` altera um post existente e deve ser usado com pedido explícito.
- `--allow-duplicate` cria um novo post mesmo com título parecido e deve ser usado com pedido explícito.
