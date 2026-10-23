from __future__ import annotations

import json
import logging
import re
from typing import Any
from urllib.parse import urlparse

from pipeline.config import Settings
from pipeline.groq import (
    GroqClient,
    GroqError,
    SYSTEM_PROMPT,
    build_repair_prompt,
    build_user_prompt,
)
from pipeline.models import ExtractedArticle, GeneratedArticle
from pipeline.text import clean_whitespace, normalize, parse_br_date, slugify, word_count
from pipeline.verification import blocking_warnings, build_fact_evidence, verify_article

log = logging.getLogger(__name__)

VALID_STATUS = {"aberto", "previsto", "em_andamento", "encerrado"}
VALID_EDUCATION = {"fundamental", "medio", "tecnico", "superior"}
CLICKBAIT = (
    "você não vai acreditar",
    "voce nao vai acreditar",
    "confira agora",
    "veja só",
    "veja so",
    "chocante",
    "imperdível",
    "imperdivel",
)


class EditorialError(RuntimeError):
    pass


def _as_text(value: Any, limit: int | None = None) -> str:
    text = clean_whitespace(str(value or ""))
    if limit and len(text) > limit:
        text = text[:limit].rstrip(" .,;:")
    return text


def _as_list(value: Any, limit: int = 10) -> list[str]:
    if isinstance(value, str):
        values = [value]
    elif isinstance(value, list):
        values = [str(item) for item in value if item is not None]
    else:
        values = []
    seen: set[str] = set()
    result: list[str] = []
    for item in values:
        cleaned = clean_whitespace(item)
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            result.append(cleaned)
        if len(result) >= limit:
            break
    return result


def _facts_text(facts: dict[str, Any]) -> str:
    return json.dumps(facts, ensure_ascii=False, sort_keys=True)


def _entity_matches(value: str, fact: str) -> bool:
    left, right = normalize(value), normalize(fact)
    if not left or not right:
        return True
    if left == right or left in right or right in left:
        return True
    left_tokens = [token for token in left.split() if len(token) >= 3]
    right_tokens = set(right.split())
    return bool(left_tokens) and sum(1 for token in left_tokens if token in right_tokens) >= max(1, len(left_tokens) // 2)


def _source_digits(article: ExtractedArticle, facts: dict[str, Any]) -> str:
    return re.sub(r"\D", "", article.full_text + " " + _facts_text(facts))


def validate_output(
    data: dict[str, Any],
    article: ExtractedArticle,
    settings: Settings,
    category_slugs: list[str],
    *,
    min_words: int | None = None,
) -> tuple[list[str], int]:
    """Valida forma, tamanho e números críticos contra a fonte e os fatos."""
    warnings: list[str] = []
    score = 100
    min_words = min_words or settings.min_content_words
    title = _as_text(data.get("title"))
    excerpt = _as_text(data.get("excerpt"))
    body = str(data.get("body_markdown") or "")
    editorial_text = " ".join([title, excerpt, body])
    words = word_count(body)
    source_digits = _source_digits(article, article.facts)
    facts_json = _facts_text(article.facts)

    if not title:
        warnings.append("título ausente")
        score -= 30
    elif len(title) < 30:
        warnings.append(f"título curto ({len(title)} caracteres)")
        score -= 5
    elif len(title) > 160:
        warnings.append(f"título longo ({len(title)} caracteres; máximo do Sanity é 160)")
        score -= 8
    if any(term in normalize(title) for term in CLICKBAIT):
        warnings.append("título com apelo de clickbait")
        score -= 6

    if not excerpt:
        warnings.append("resumo ausente")
        score -= 10
    elif not 60 <= len(excerpt) <= 300:
        warnings.append(f"resumo fora da faixa editorial ({len(excerpt)} caracteres)")
        score -= 4

    if not body.strip():
        warnings.append("corpo ausente")
        score -= 40
    elif words < max(80, int(min_words * 0.6)):
        warnings.append(f"corpo muito curto ({words} palavras; meta {min_words})")
        score -= 25
    elif words < min_words:
        warnings.append(f"corpo abaixo da meta ({words} palavras; meta {min_words})")
        score -= 6

    # Valores monetários só podem aparecer se estiverem na fonte/fatos.
    for token in re.findall(r"R\$\s*[\d.]+,\d{2}", editorial_text):
        digits = re.sub(r"\D", "", token)
        if digits and digits not in source_digits:
            warnings.append(f"valor monetário sem respaldo na fonte: {token}")
            score -= 8

    # Contagem de vagas.
    for match in re.finditer(
        r"\b(\d{1,3}(?:\.\d{3})*|\d+)\s+(?:vagas|postos|oportunidades)\b", editorial_text, flags=re.I
    ):
        digits = re.sub(r"\D", "", match.group(1))
        if digits and digits not in source_digits:
            warnings.append(f"quantidade de vagas sem respaldo na fonte: {match.group(0)}")
            score -= 8

    # Datas por extenso numérico.
    fact_iso_dates = {
        str(value)
        for value in article.facts.values()
        if isinstance(value, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", value)
    }
    for token in re.findall(r"\b\d{1,2}/\d{1,2}/\d{2,4}\b", editorial_text):
        if token in article.full_text or token in facts_json:
            continue
        parsed_token = parse_br_date(token)
        if parsed_token and parsed_token in fact_iso_dates:
            continue
        warnings.append(f"data sem respaldo na fonte: {token}")
        score -= 8

    # Salário/remuneração não podem ser deduzidos.
    if re.search(r"sal[aá]rio|remunera[cç][aã]o|vencimento", normalize(editorial_text)):
        if "salary_min" not in article.facts and "salary_max" not in article.facts:
            if not re.search(r"R\$\s*[\d.]+,\d{2}", article.full_text):
                warnings.append("texto menciona salário/remuneração sem valor na fonte")
                score -= 6

    if settings.fact_check_two_source_rule and article.source_tier not in {"official_primary", "official_secondary"}:
        warnings.append("fonte não oficial: uma fonte independente adicional é obrigatória")
        score -= 12

    # Status e texto precisam concordar; o modelo não pode "abrir" inscrições
    # que a fonte não confirmou.
    normalized_body = normalize(" ".join([title, excerpt, body]))
    fact_status = str(article.facts.get("status") or "").lower()
    model_status = _as_text(data.get("status")).lower()
    if model_status and fact_status and model_status != fact_status:
        warnings.append(f"campo 'status' diverge do fato extraído: {model_status} != {fact_status}")
        score -= 15
    for field, fact_key, label in (
        ("organ", "organ", "órgão"),
        ("banca", "banca", "banca"),
        ("state_uf", "state_uf", "UF"),
        ("city_name", "city_name", "município"),
    ):
        value = _as_text(data.get(field))
        fact_value = _as_text(article.facts.get(fact_key))
        if value and fact_value and not _entity_matches(value, fact_value):
            warnings.append(f"campo '{label}' diverge do fato extraído: {value}")
            score -= 8
    education = _as_list(data.get("education_level"))
    fact_education = {str(item).lower() for item in article.facts.get("education_level") or []}
    if education and fact_education and not {item.lower() for item in education}.issubset(fact_education):
        warnings.append("campo 'education_level' contém níveis sem respaldo na fonte")
        score -= 6
    if fact_status in VALID_STATUS and fact_status != "aberto":
        open_pattern = (
            r"inscricoes abertas|inscricao aberta|abriu (?:as )?inscricoes|"
            r"abre (?:as )?inscricoes|abertura (?:das |de )?inscricoes|"
            r"inscricoes (?:estao|seguem) abertas|"
            r"prazo de inscricao|recebe inscricoes|recebendo inscricoes"
        )
        # "ainda não há abertura de inscrições" é uma negação, não uma afirmação.
        affirmative = False
        for match in re.finditer(open_pattern, normalized_body):
            prefix = normalized_body[max(0, match.start() - 50) : match.start()]
            if re.search(r"\b(?:nao|sem|nem)\b", prefix):
                continue
            affirmative = True
            break
        if affirmative:
            warnings.append(
                f"texto afirma inscrições abertas, mas o status determinado é '{fact_status}'"
            )
            score -= 20
    if article.facts.get("is_cr_only") is False:
        if re.search(
            r"apenas (?:a )?(?:formacao de )?(?:para )?cadastro de reserva|"
            r"somente (?:a )?(?:formacao de )?(?:para )?cadastro de reserva|"
            r"exclusivamente (?:a )?(?:formacao de )?(?:para )?cadastro de reserva",
            normalized_body,
        ):
            warnings.append("texto diz que há apenas cadastro de reserva, mas a fonte indica vagas efetivas")
            score -= 10
    if article.facts.get("is_cr_only") is True:
        if re.search(r"vagas efetivas|preenchimento de vagas efetivas", normalized_body):
            warnings.append("texto menciona vagas efetivas, mas o fato indica apenas cadastro de reserva")
            score -= 10
    if re.search(r"vagas efetivas", normalized_body) and re.search(
        r"(?:apenas|somente|exclusivamente).{0,40}cadastro de reserva",
        normalized_body,
    ):
        warnings.append("texto contradiz vagas efetivas com cadastro de reserva exclusivo")
        score -= 15

    # Requisitos, especialidades e atribuições ao edital são alegações de alto
    # risco: só podem aparecer se estiverem no texto-fonte.
    source_normalized = normalize(article.full_text + " " + facts_json)
    claim_checks = [
        (
            "requisitos ou público-alvo",
            r"\bpodem participar\b|\bpoderao participar\b|\brecem formados?\b|"
            r"\bregistro profissional\b|\bconselho regional\b|\bdiploma\b|"
            r"\bexperiencia\b|\bidade minima\b|\bescolaridade\b|"
            r"\bnao ha restricao\b|\bsem restricao\b",
        ),
        (
            "especialidades",
            r"\bespecialidade\b|\bespecialidades\b",
        ),
        (
            "edital",
            r"\bedital\b|\beditais\b",
        ),
        (
            "cronograma, etapas ou resultados",
            r"\bcronograma\b|\betapas?\b|\bfases?\b|\bprovas?\b|\bgabarito\b|"
            r"\bresultado\b|\bhomologa[cç][aã]o\b|\bconvoca[cç][aã]o\b",
        ),
        (
            "citação literal",
            r"[\"“”][^\"“”]{40,}[\"“”]",
        ),
    ]
    for label, pattern in claim_checks:
        if re.search(pattern, normalized_body) and not re.search(pattern, source_normalized):
            warnings.append(f"texto menciona {label} sem respaldo no texto-fonte")
            score -= 4

    # Opinião, previsão e metainformação não são fatos. Previs?o e etapas
    # futuras bloqueiam; opini?o/metainformação apenas reduzem a nota editorial.
    assertion_checks = [
        (
            "previsão ou prognóstico",
            r"\bprevisao indica\b|\bespera-se\b|\bestima-se\b|\bprovavelmente\b|"
            r"\bdeve ocorrer\b|\bdevera ocorrer\b|\bem breve\b",
            True,
        ),
        (
            "etapas futuras",
            r"\bproximas etapas\b|\bfuturas etapas\b|\bproximas fases\b|\bproximos passos\b",
            True,
        ),
    ]
    for label, pattern, blocking in assertion_checks:
        if re.search(pattern, normalized_body) and not re.search(pattern, source_normalized):
            suffix = "sem respaldo no texto-fonte" if blocking else "que exigem confirmação"
            warnings.append(f"texto contém {label} {suffix}")
            score -= 8 if blocking else 4

    opinion_pattern = (
        r"\bdemonstra compromisso\b|\boportunidade relevante\b|"
        r"\breconhecid[oa]s? nacionalmente\b|\bdemanda crescente\b|"
        r"\btramites administrativos habituais\b|\btransparencia e igualdade\b|"
        r"\bnao perder nenhuma informacao\b|\brepresenta uma oportunidade\b"
    )
    if re.search(opinion_pattern, normalized_body) and not re.search(opinion_pattern, source_normalized):
        warnings.append("texto contém opinião ou conclusão genérica; revise antes de publicar")
        score -= 6

    # Links externos só podem apontar para o domínio da fonte oficial ou do portal.
    allowed_hosts = {
        urlparse(value).netloc.lower()
        for value in (article.url, article.canonical_url, settings.frontend_url)
        if value and urlparse(value).netloc
    }
    link_text = " ".join([title, excerpt, body])
    for raw_url in sorted(set(re.findall(r"https?://[^\s)\]>]+", link_text))):
        url = raw_url.rstrip(".,;:!?")
        host = urlparse(url).netloc.lower()
        if host and host not in allowed_hosts:
            warnings.append(f"link externo sem respaldo na fonte: {url}")
            score -= 6

    status = _as_text(data.get("status")).lower()
    if status and status not in VALID_STATUS:
        warnings.append(f"status inválido retornado pelo modelo: {status}")
        score -= 3
    education = _as_list(data.get("education_level"))
    invalid_education = [x for x in education if x.lower() not in VALID_EDUCATION]
    if invalid_education:
        warnings.append("nível de escolaridade inválido: " + ", ".join(invalid_education))
        score -= 3
    categories = _as_list(data.get("category_slugs"))
    invalid_categories = [x for x in categories if x not in category_slugs]
    if invalid_categories:
        warnings.append("categorias inexistentes: " + ", ".join(invalid_categories))
        score -= 3
    if not _as_list(data.get("keywords")):
        warnings.append("palavras-chave ausentes")
        score -= 2
    if body.count("não divulgado") + body.count("nao divulgado") > 5:
        warnings.append("excesso de dados 'não divulgado'")
        score -= 3

    return warnings, max(0, min(100, score))


def _normalize_generated(
    data: dict[str, Any],
    article: ExtractedArticle,
    settings: Settings,
    category_slugs: list[str],
    warnings: list[str],
    score: int,
    usage: dict[str, Any],
    *,
    model: str | None = None,
) -> GeneratedArticle:
    title = _as_text(data.get("title"), limit=160)
    if len(title) < 8:
        title = _as_text(article.title, limit=160) or "Novo concurso publicado"
    body = str(data.get("body_markdown") or "").strip()
    # Alguns modelos devolvem o título em H1; o Portable Text não tem H1.
    body = re.sub(r"^\s*#\s+.+?\n+", "", body)
    excerpt = _as_text(data.get("excerpt"), limit=300)
    if not excerpt:
        excerpt = _as_text(re.sub(r"[#*_>`]", "", body)[:240], limit=240)
    seo_description = _as_text(data.get("seo_description"), limit=155) or excerpt[:155]
    keywords = _as_list(data.get("keywords"), limit=8)
    categories = [slug for slug in _as_list(data.get("category_slugs")) if slug in category_slugs]
    status = _as_text(data.get("status")).lower()
    if status not in VALID_STATUS:
        status = "previsto"
    education = [x.lower() for x in _as_list(data.get("education_level")) if x.lower() in VALID_EDUCATION]
    organ = _as_text(data.get("organ"), limit=160) or None
    banca = _as_text(data.get("banca"), limit=120) or None
    state_uf = _as_text(data.get("state_uf"), limit=20) or None
    city_name = _as_text(data.get("city_name"), limit=80) or None
    slug = slugify(title, 96) or f"concurso-{article.text_hash[:10]}"
    return GeneratedArticle(
        title=title,
        slug=slug,
        excerpt=excerpt,
        body_markdown=body,
        seo_description=seo_description,
        keywords=keywords,
        category_slugs=categories,
        status=status,
        education_level=education,
        organ=organ,
        banca=banca,
        state_uf=state_uf,
        city_name=city_name,
        model=model or settings.groq_model,
        usage=usage,
        warnings=warnings,
        score=score,
        body_word_count=word_count(body),
        raw=data,
    )


def _target_word_range(article: ExtractedArticle, settings: Settings) -> tuple[int, int]:
    """Fontes curtas não devem ser infladas com inferências para atingir 200 palavras."""
    source_length = len(article.full_text)
    if source_length < 600:
        min_words = min(settings.min_content_words, 160)
        return min_words, min(300, min_words + 80)
    if source_length < 1200:
        min_words = min(settings.min_content_words, 180)
        return min_words, min(420, min_words + 100)
    return settings.min_content_words, 700


def finalize_generated_article(
    data: dict[str, Any],
    article: ExtractedArticle,
    settings: Settings,
    category_slugs: list[str],
    *,
    usage: dict[str, Any] | None = None,
    model: str | None = None,
    min_words: int | None = None,
    extra_warnings: list[str] | None = None,
) -> GeneratedArticle:
    """Valida uma matéria já escrita e aplica fatos determinísticos.

    Reutilizado pelo caminho automático (Groq) e pelo caminho manual, para que
    as duas rotas tenham exatamente as mesmas regras editoriais e de evidência.
    """
    warnings, score = validate_output(
        data,
        article,
        settings,
        category_slugs,
        min_words=min_words,
    )
    for warning in extra_warnings or []:
        if warning not in warnings:
            warnings.append(warning)
    generated = _normalize_generated(
        data,
        article,
        settings,
        category_slugs,
        warnings,
        score,
        usage or {},
        model=model,
    )

    # Fatos determinísticos têm precedência sobre campos inferidos pelo modelo.
    if article.facts.get("status") in VALID_STATUS:
        generated.status = str(article.facts["status"])
    if article.facts.get("education_level"):
        generated.education_level = [
            str(x).lower()
            for x in article.facts["education_level"]
            if str(x).lower() in VALID_EDUCATION
        ]
    if article.facts.get("organ"):
        generated.organ = str(article.facts["organ"])
    if article.facts.get("banca"):
        generated.banca = str(article.facts["banca"])
    if article.facts.get("state_uf"):
        generated.state_uf = str(article.facts["state_uf"])
    if article.facts.get("city_name"):
        generated.city_name = str(article.facts["city_name"])
    if not generated.category_slugs and article.facts.get("source_categories"):
        generated.category_slugs = [str(x) for x in article.facts["source_categories"]]
    verification = verify_article(article, generated, settings)
    generated.verification = verification
    generated.blocking = list(verification.get("blocking") or [])
    for warning in verification.get("warnings") or []:
        if warning not in generated.warnings:
            generated.warnings.append(warning)
    return generated


def generate_article(
    client: GroqClient,
    settings: Settings,
    article: ExtractedArticle,
    category_slugs: list[str],
) -> GeneratedArticle:
    """Gera, valida e, se necessário, repara a matéria antes de criar o rascunho."""
    facts = {key: value for key, value in article.facts.items() if value not in (None, "", [])}
    if not article.fact_evidence:
        build_fact_evidence(article)
    min_words, max_words = _target_word_range(article, settings)
    user_prompt = build_user_prompt(
        article,
        facts,
        category_slugs,
        min_words=min_words,
        max_words=max_words,
        max_source_chars=settings.max_source_chars,
    )
    try:
        response = client.chat(SYSTEM_PROMPT, user_prompt)
    except GroqError as exc:
        raise EditorialError(str(exc)) from exc

    data = response.data
    warnings, score = validate_output(
        data, article, settings, category_slugs, min_words=min_words
    )
    attempts = 0
    current_usage = response.usage
    while (
        score < settings.fact_check_min_score or blocking_warnings(warnings)
    ) and attempts < settings.fact_check_max_repair_attempts:
        attempts += 1
        log.warning(
            "Fact-check %s/%s para %s; solicitando reparo (%s)",
            score,
            settings.fact_check_min_score,
            article.url,
            "; ".join(warnings[:3]),
        )
        repair_prompt = build_repair_prompt(
            article,
            facts,
            data,
            warnings,
            max_source_chars=settings.max_source_chars,
        )
        try:
            repaired = client.chat(SYSTEM_PROMPT, repair_prompt, temperature=0.1)
        except GroqError as exc:
            warnings.append(f"reparo automático falhou: {exc}")
            break
        new_warnings, new_score = validate_output(
            repaired.data, article, settings, category_slugs, min_words=min_words
        )
        # Aceita o reparo apenas se ele melhorar a nota ou remover avisos críticos.
        if new_score >= score or len(new_warnings) < len(warnings):
            data = repaired.data
            warnings = new_warnings
            score = new_score
            current_usage = repaired.usage
        else:
            warnings.append("reparo automático não melhorou a validação; mantida a primeira versão")
            break

    notes = [warning for warning in warnings if warning.startswith("reparo automático")]
    return finalize_generated_article(
        data,
        article,
        settings,
        category_slugs,
        usage=current_usage,
        min_words=min_words,
        extra_warnings=notes,
    )
