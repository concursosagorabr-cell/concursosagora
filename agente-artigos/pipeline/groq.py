from __future__ import annotations

import json
import logging
import re
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

from pipeline.config import Settings
from pipeline.models import ExtractedArticle
from pipeline.text import normalize

log = logging.getLogger(__name__)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = """Você é editor do portal Concursos Agora, especializado em concursos públicos e processos seletivos no Brasil.

REGRAS EDITORIAIS OBRIGATÓRIAS - VIOLAÇÃO BLOQUEIA PUBLICAÇÃO:
1. Escreva em português do Brasil, com tom jornalístico claro, direto e útil.
2. Use SOMENTE os fatos extraídos e o texto-fonte fornecidos. NUNCA invente números, datas, salários, vagas, cargos, órgãos, bancas, links ou nomes.
3. Números, datas e valores monetários SÓ podem aparecer se estiverem LITERALMENTE nos fatos ou no texto-fonte.
4. Não copie parágrafos do texto oficial; reescreva com linguagem própria.
5. Se um dado importante não estiver disponível, escreva "não divulgado" ou omita. NÃO ESTIME.
6. Não faça promessas, não dê dicas de aprovação como garantia e não invente prazos.
7. O texto é um rascunho para revisão humana. Não diga que é um rascunho nem mencione IA.
8. NUNCA escreva "conforme o fato extraído", "segundo os fatos", "de acordo com o texto-fonte" ou qualquer referência ao processo interno de coleta/redação.
9. Não descreva fases, etapas, provas ou certificados como se fossem um cronograma, a menos que a fonte os apresente explicitamente dessa forma. Liste apenas o que foi publicado.
10. Se o status não for "aberto", é PROIBIDO escrever "lança", "lançou", "abre", "abriu", "inscrições abertas", "inscrição aberta"; prefira "está em andamento", "segue" ou "foi autorizado", conforme o caso.
11. Não interprete "cadastro de reserva" como "não há vagas imediatas" se a fonte não afirmar isso; limite-se a "formação de cadastro de reserva".
12. Não acrescente requisitos, escolaridade, idade, experiência, registro profissional, especialidades, número de provas/fases, cronograma, resultados ou links que não estejam EXPLÍCITOS no texto-fonte. Não atribua informações ao "edital" se ele não for citado.
13. NUNCA use terminologia administrativa inexistente: "ato intermediário", "fase de ato intermediário", "ato preparatório" não existem no rito de concursos. Use apenas: autorização, comissão formada, termo de referência, contratação de banca, edital publicado, inscrições abertas, provas aplicadas, resultado, homologação.
14. NUNCA misture editais diferentes: se a fonte fala de um concurso específico, não traga salários/vagas/cargos de outro edital do mesmo órgão.
15. NUNCA escreva placeholders genéricos: "todas as informações acima são extraídas do dossiê factual", "fonte 1, fonte 2", "referências: fonte 1", "dossiê factual disponível". Isso é metainformação interna, não conteúdo editorial.
16. Não escreva opinião, previsão, promessa, frase de efeito ou conclusão genérica ("demonstra compromisso", "oportunidade relevante", "garantir", "assegurar", "trâmites habituais", "próximas etapas", "em breve", "espera-se"). Se a fonte não afirma, omita.
17. Responda SOMENTE com um objeto JSON válido, sem cercas de código e sem comentários.

BANCA ORGANIZADORA - REGRA CRÍTICA:
- Só cite a banca se ela estiver EXPLICITAMENTE no texto-fonte ou nos fatos extraídos.
- Não infira banca por "histórico" (ex: "Polícia Penal SP sempre usa FGV/Vunesp" → NÃO escreva FGV/Vunesp sem fonte).
- Bancas pequenas/municipais (ex: Planejar Concursos, IDECAN, IBFC) NÃO organizam concursos de grande porte estaduais/federais sem fonte explícita.

VAGAS E SALÁRIOS - REGRA CRÍTICA:
- O número total de vagas deve vir dos fatos extraídos (vacancies_total).
- Salário mínimo/máximo só se estiverem nos fatos (salary_min/salary_max).
- Se a fonte menciona faixa salarial de CARGOS DIFERENTES (ex: médico vs guarda), NÃO misture. Especifique o cargo ou omita.

STATUS E CRONOGRAMA - REGRA CRÍTICA:
- O campo "status" do JSON deve ser EXATAMENTE o status extraído (aberto|previsto|em_andamento|encerrado).
- Se a fonte diz "edital publicado em maio, inscrições encerradas em julho", o status NÃO é "previsto" nem "aberto" — é "em_andamento" ou "encerrado".
- Não republicar notícia velha no presente: se as provas já ocorreram, use tempo passado e status correto."""

USER_TEMPLATE = """FONTE: {source_name}
URL: {url}
DATA DA FONTE: {published_at}
ÓRGÃO INFORMADO: {organ}

FATOS EXTRAÍDOS DETERMINISTICAMENTE (prevalecem sobre qualquer inferência):
{facts_json}

EVIDENCIA NA FONTE (trechos literais; use apenas o que estiver aqui):
{evidence_json}

REGRAS DE STATUS (obrigatórias):
- O status atual é "{status}". Se ele não for "aberto", é proibido escrever "inscrições abertas", "inscrição aberta", "abriu inscrições", "abertura das inscrições", "inscrições estão abertas" ou equivalente.
- Datas de atendimento, contato, publicação ou atualização NÃO são datas de inscrição. Não use essas datas para afirmar abertura de prazo.
- Só diga "apenas cadastro de reserva" ou "somente cadastro de reserva" se is_cr_only for true.
- O campo "status" do JSON deve ser exatamente "{status}".

CATEGORIAS EXISTENTES NO PORTAL (use apenas estes slugs):
{categories}

TEXTO-FONTE:
{source_text}

TAREFA:
Produza uma matéria original de {min_words} a {max_words} palavras sobre o tema acima. Se o texto-fonte for curto, escreva uma matéria curta e objetiva; não invente contexto, etapas ou requisitos para atingir o tamanho máximo.
Estrutura sugerida do body_markdown:
- abre com o fato principal e o órgão;
- explica o que foi publicado, quem é afetado e quais são os próximos passos;
- usa subtítulos ## quando houver mais de dois blocos;
- inclui lista de datas/requisitos somente se estiverem nos fatos;
- fecha com uma frase objetiva, sem opinião.

Retorne exatamente este JSON:
{{
  "title": "título jornalístico de 50 a 120 caracteres, sem clickbait",
  "excerpt": "resumo de 120 a 220 caracteres",
  "body_markdown": "matéria em Markdown, sem título H1, com parágrafos separados por \\n\\n",
  "seo_description": "descrição de até 155 caracteres",
  "keywords": ["até 8 palavras-chave"],
  "category_slugs": ["slugs existentes, no máximo 4"],
  "status": "aberto|previsto|em_andamento|encerrado",
  "education_level": ["fundamental|medio|tecnico|superior"],
  "organ": "nome do órgão ou null",
  "banca": "nome da banca ou null",
  "state_uf": "UF ou Nacional ou null",
  "city_name": "município ou null"
}}"""

REPAIR_TEMPLATE = """A matéria abaixo foi reprovada parcialmente no fact-check automático.

FATOS PERMITIDOS:
{facts_json}

EVIDENCIA NA FONTE (trechos literais; use apenas o que estiver aqui):
{evidence_json}

REGRAS DE STATUS (obrigatórias):
- O status atual é "{status}". Se ele não for "aberto", é proibido escrever "inscrições abertas", "inscrição aberta", "abriu inscrições", "abertura das inscrições", "inscrições estão abertas" ou equivalente.
- Datas de atendimento, contato, publicação ou atualização NÃO são datas de inscrição.
- Só diga "apenas cadastro de reserva" ou "somente cadastro de reserva" se is_cr_only for true.
- O campo "status" do JSON deve ser exatamente "{status}".

TEXTO-FONTE:
{source_text}

MATÉRIA ATUAL (JSON):
{current_json}

PROBLEMAS ENCONTRADOS:
{warnings}

TAREFA:
Reescreva a matéria corrigindo TODOS os problemas. Remova qualquer número, data, valor ou afirmação que não esteja nos fatos/texto-fonte. Mantenha o restante do texto útil e no mesmo formato JSON. Não inclua explicações fora do JSON."""


class GroqError(RuntimeError):
    pass


@dataclass
class GroqResponse:
    data: dict[str, Any]
    usage: dict[str, Any]
    content: str
    key_attempt: int


class GroqClient:
    def __init__(self, settings: Settings):
        if not settings.groq_keys:
            raise GroqError("Nenhuma chave Groq configurada.")
        self.settings = settings
        self.keys = list(settings.groq_keys)
        self.model = settings.groq_model

    def _payload(self, system: str, user: str, max_tokens: int, temperature: float) -> dict[str, Any]:
        return {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
            "top_p": 0.9,
            "max_tokens": max_tokens,
            "reasoning_effort": "low",
            "response_format": {"type": "json_object"},
        }

    def _post(self, payload: dict[str, Any], key: str, timeout: int = 150) -> dict[str, Any]:
        request = urllib.request.Request(
            GROQ_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "ConcursosAgoraPipeline/0.1",
            },
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8", errors="replace"))

    def chat(
        self,
        system: str,
        user: str,
        *,
        max_tokens: int = 4500,
        temperature: float = 0.25,
    ) -> GroqResponse:
        last_error = ""
        for key_index, key in enumerate(self.keys):
            payload = self._payload(system, user, max_tokens, temperature)
            for attempt in range(2):
                try:
                    response = self._post(payload, key)
                    choices = response.get("choices") or []
                    content = ""
                    if choices:
                        content = (choices[0].get("message") or {}).get("content") or ""
                    usage = response.get("usage") or {}
                    if not content.strip():
                        # Modelos de raciocínio podem gastar o orçamento antes de responder.
                        payload["max_tokens"] = max(6000, max_tokens * 2)
                        payload["reasoning_effort"] = "low"
                        continue
                    data = _parse_json_object(content)
                    return GroqResponse(data=data, usage=usage, content=content, key_attempt=key_index + 1)
                except urllib.error.HTTPError as exc:
                    body = exc.read().decode("utf-8", errors="replace")
                    last_error = f"HTTP {exc.code}: {body[:500]}"
                    # Chave inválida/limite: tenta a próxima chave.
                    if exc.code in {401, 403, 429}:
                        break
                    if exc.code == 400 and "reasoning_effort" in body:
                        payload.pop("reasoning_effort", None)
                        continue
                    if exc.code in {500, 502, 503, 504}:
                        time.sleep(1.5 * (attempt + 1))
                        continue
                    break
                except urllib.error.URLError as exc:
                    last_error = f"rede: {exc}"
                    time.sleep(1.5 * (attempt + 1))
                except (ValueError, json.JSONDecodeError) as exc:
                    last_error = f"JSON inválido: {exc}"
                    time.sleep(1.0)
        raise GroqError(f"Groq falhou após tentar as chaves disponíveis: {last_error}")


def _parse_json_object(content: str) -> dict[str, Any]:
    raw = content.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.I)
        raw = re.sub(r"\s*```$", "", raw)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find("{")
        end = raw.rfind("}")
        if start < 0 or end <= start:
            raise GroqError(f"Resposta sem objeto JSON: {content[:300]}")
        data = json.loads(raw[start : end + 1])
    if not isinstance(data, dict):
        raise GroqError("A resposta do modelo não é um objeto JSON.")
    return data




def _missing_terms(article: ExtractedArticle) -> list[str]:
    terms = [
        "edital",
        "cronograma",
        "especialidade",
        "prova",
        "etapa",
        "resultado",
        "gabarito",
        "homologa\u00e7\u00e3o",
        "convoca\u00e7\u00e3o",
        "taxa",
        "requisito",
        "escolaridade",
        "experi\u00eancia",
        "registro profissional",
    ]
    haystack = normalize(article.full_text)
    return [term for term in terms if normalize(term) not in haystack]


def _with_missing_terms(source_text: str, article: ExtractedArticle) -> str:
    missing = _missing_terms(article)
    if not missing:
        return source_text
    return (
        source_text
        + "\n\nTERMOS AUSENTES NA FONTE (proibido usar, inclusive como contexto geral): "
        + ", ".join(missing)
    )


def build_user_prompt(
    article: ExtractedArticle,
    facts: dict[str, Any],
    categories: list[str],
    *,
    min_words: int,
    max_words: int,
    max_source_chars: int,
) -> str:
    source_text = article.full_text
    if len(source_text) > max_source_chars:
        source_text = source_text[:max_source_chars] + "\n\n[texto truncado para caber no prompt]"
    source_text = _with_missing_terms(source_text, article)
    return USER_TEMPLATE.format(
        source_name=article.source_name,
        url=article.url,
        published_at=article.published_at or "não informada",
        organ=article.facts.get("organ") or "não informado",
        facts_json=json.dumps(facts, ensure_ascii=False, indent=2),
        evidence_json=json.dumps(article.fact_evidence, ensure_ascii=False, indent=2),
        status=article.facts.get("status") or "não determinado",
        categories=", ".join(categories) if categories else "(nenhuma)",
        source_text=source_text,
        min_words=min_words,
        max_words=max_words,
    )


def build_repair_prompt(
    article: ExtractedArticle,
    facts: dict[str, Any],
    current: dict[str, Any],
    warnings: list[str],
    *,
    max_source_chars: int,
) -> str:
    source_text = article.full_text
    if len(source_text) > max_source_chars:
        source_text = source_text[:max_source_chars] + "\n\n[texto truncado]"
    source_text = _with_missing_terms(source_text, article)
    return REPAIR_TEMPLATE.format(
        facts_json=json.dumps(facts, ensure_ascii=False, indent=2),
        evidence_json=json.dumps(article.fact_evidence, ensure_ascii=False, indent=2),
        status=article.facts.get("status") or "não determinado",
        source_text=source_text,
        current_json=json.dumps(current, ensure_ascii=False, indent=2),
        warnings="\n".join(f"- {warning}" for warning in warnings) or "- corrigir dados não comprovados",
    )
