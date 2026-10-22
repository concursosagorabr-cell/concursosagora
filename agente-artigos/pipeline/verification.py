from __future__ import annotations

import json
import re
from datetime import date, datetime, timezone
from typing import Any

from pipeline.config import Settings
from pipeline.models import ExtractedArticle, GeneratedArticle
from pipeline.text import clean_whitespace, normalize, parse_br_date, title_similarity

CRITICAL_FACTS = {
    "organ",
    "status",
    "vacancies_total",
    "salary_min",
    "salary_max",
    "registration_fee",
    "enrollment_start_date",
    "enrollment_end_date",
    "exam_date",
    "banca",
    "state_uf",
    "city_name",
    "education_level",
    "is_cr_only",
    "has_exemption",
}

# Estes campos podem ser inferidos a partir do conjunto da fonte; ainda assim
# ficam registrados como "inferred" no relatório para revisão humana.
ALLOW_INFERRED = {"sphere"}

MONTHS = {
    1: "janeiro",
    2: "fevereiro",
    3: "marco",
    4: "abril",
    5: "maio",
    6: "junho",
    7: "julho",
    8: "agosto",
    9: "setembro",
    10: "outubro",
    11: "novembro",
    12: "dezembro",
}

UF_NAMES = {
    "AC": "Acre",
    "AL": "Alagoas",
    "AP": "Amapá",
    "AM": "Amazonas",
    "BA": "Bahia",
    "CE": "Ceará",
    "DF": "Distrito Federal",
    "ES": "Espírito Santo",
    "GO": "Goiás",
    "MA": "Maranhão",
    "MT": "Mato Grosso",
    "MS": "Mato Grosso do Sul",
    "MG": "Minas Gerais",
    "PA": "Pará",
    "PB": "Paraíba",
    "PR": "Paraná",
    "PE": "Pernambuco",
    "PI": "Piauí",
    "RJ": "Rio de Janeiro",
    "RN": "Rio Grande do Norte",
    "RS": "Rio Grande do Sul",
    "RO": "Rondônia",
    "RR": "Roraima",
    "SC": "Santa Catarina",
    "SP": "São Paulo",
    "SE": "Sergipe",
    "TO": "Tocantins",
}

BLOCKING_MARKERS = (
    "sem respaldo",
    "link externo sem respaldo",
    "inscricoes abertas",
    "vagas efetivas",
    "apenas cadastro",
    "somente cadastro",
    "status invalido",
    "categorias inexistentes",
    "quantidade de vagas sem respaldo",
    "valor monetario sem respaldo",
    "data sem respaldo",
    "requisitos ou publico alvo sem respaldo",
    "especialidades sem respaldo",
    "edital sem respaldo",
    "fonte oficial nao identificada",
    "fonte nao oficial",
    "diverge do fato",
    "contradiz",
    "niveis sem respaldo",
    "fact-check bloqueado",
)


def _around(text: str, start: int, end: int, radius: int = 190) -> str:
    left = max(0, start - radius)
    right = min(len(text), end + radius)
    prefix = text[left:start]
    suffix = text[end:right]
    sentence_start = max(prefix.rfind(". "), prefix.rfind("! "), prefix.rfind("? "), prefix.rfind("\n"))
    if sentence_start >= 0:
        left += sentence_start + 2
    sentence_end = -1
    for marker in (". ", "! ", "? ", "\n"):
        position = suffix.find(marker)
        if position >= 0 and (sentence_end < 0 or position < sentence_end):
            sentence_end = position
    if sentence_end >= 0:
        right = end + sentence_end + 1
    snippet = clean_whitespace(text[left:right])
    if left:
        snippet = "..." + snippet
    if right < len(text):
        snippet = snippet + "..."
    return snippet[:600]


def _find_snippet(text: str, needle: str) -> str | None:
    if not needle:
        return None
    raw = clean_whitespace(text)
    index = raw.casefold().find(str(needle).casefold())
    if index >= 0:
        return _around(raw, index, index + len(str(needle)))
    normalized_needle = normalize(str(needle))
    if not normalized_needle:
        return None
    for sentence in re.split(r"(?<=[.!?])\s+|\n+", raw):
        if normalized_needle in normalize(sentence):
            return clean_whitespace(sentence)[:500]
    return None


def _number_variants(value: Any) -> list[str]:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return []
    if float(value).is_integer():
        number = int(value)
        return [str(number), f"{number:,}".replace(",", ".")]
    raw = f"{float(value):.2f}"
    return [raw, raw.replace(".", ",")]


def _number_snippet(text: str, value: Any, *, context: str = "") -> tuple[str | None, str]:
    raw = clean_whitespace(text)
    for variant in _number_variants(value):
        match = re.search(rf"(?<![\d.,]){re.escape(variant)}(?![\d.,])", raw)
        if not match:
            continue
        snippet = _around(raw, match.start(), match.end())
        if context and normalize(context) not in normalize(snippet):
            return snippet, "number_without_context"
        return snippet, "regex"
    return None, "not_found"


def _date_variants(value: str) -> list[str]:
    try:
        parsed = date.fromisoformat(str(value)[:10])
    except (TypeError, ValueError):
        return []
    return [
        parsed.strftime("%d/%m/%Y"),
        f"{parsed.day}/{parsed.month}/{parsed.year}",
        parsed.isoformat(),
        f"{parsed.day} de {MONTHS[parsed.month]} de {parsed.year}",
        parsed.strftime("%d/%m"),
        f"{parsed.day}/{parsed.month}",
    ]


def _date_snippet(text: str, value: str) -> str | None:
    raw = clean_whitespace(text)
    for variant in _date_variants(value):
        match = re.search(re.escape(variant), raw, flags=re.I)
        if match:
            return _around(raw, match.start(), match.end())
    return None


def _bool_snippet(key: str, text: str) -> str | None:
    patterns = {
        "is_cr_only": r"cadastro de reserva|forma[cç][aã]o de cadastro",
        "has_exemption": r"isen[cç][aã]o|isento de taxa|gratuidade",
    }
    pattern = patterns.get(key)
    if not pattern:
        return None
    match = re.search(pattern, text, flags=re.I)
    if match:
        return _around(text, match.start(), match.end())
    return None


def _status_snippet(status: str, text: str) -> str | None:
    patterns = {
        "aberto": (
            r"inscri[cç][oõ]es abertas|inscri[cç][aã]o aberta|abertura das inscri[cç][oõ]es|"
            r"per[ií]odo de inscri[cç][oõ]es|recebe inscri[cç][oõ]es|prazo de inscri[cç][aã]o|"
            r"inscri[cç][oõ]es\s*:"
        ),
        "em_andamento": r"em andamento|provas aplicadas|gabarito|resultado preliminar|fase de provas",
        "encerrado": r"encerrado|homologa[cç][aã]o|resultado final|gabarito definitivo",
        "previsto": r"autoriz|comiss[aã]o|previsto|aguardando|estudos|an[uú]ncio",
    }
    pattern = patterns.get(status)
    if not pattern:
        return None
    match = re.search(pattern, text, flags=re.I)
    if match:
        return _around(text, match.start(), match.end())
    return None


def _evidence_for_fact(
    key: str,
    value: Any,
    text: str,
    *,
    source_url: str,
    source_title: str,
) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []

    def add(quote: str | None, method: str, confidence: int) -> None:
        if quote:
            items.append(
                {
                    "quote": clean_whitespace(quote)[:600],
                    "method": method,
                    "confidence": confidence,
                    "sourceUrl": source_url,
                    "sourceTitle": source_title,
                }
            )

    if isinstance(value, bool):
        if value:
            add(_bool_snippet(key, text), "keyword", 90)
        return items

    if key in {"vacancies_total", "salary_min", "salary_max", "registration_fee"}:
        context = {
            "vacancies_total": "vaga",
            "salary_min": "salario",
            "salary_max": "salario",
            "registration_fee": "taxa",
        }[key]
        snippet, method = _number_snippet(text, value, context=context)
        add(snippet, method, 95 if method == "regex" else 55)
        return items

    if key in {"enrollment_start_date", "enrollment_end_date", "exam_date"}:
        add(_date_snippet(text, str(value)), "date", 95)
        return items

    if key == "status":
        add(_status_snippet(str(value), text), "keyword", 85)
        return items

    if key == "state_uf":
        uf = str(value)
        if uf == "Nacional":
            add(_find_snippet(text, "nacional"), "keyword", 75)
        else:
            match = re.search(rf"\b{re.escape(uf)}\b", text)
            quote = _around(text, match.start(), match.end()) if match else None
            if not quote:
                quote = _find_snippet(text, UF_NAMES.get(uf, ""))
            add(quote, "uf-code", 90)
        return items

    if key == "sphere":
        labels = {
            "FEDERAL": "federal",
            "ESTADUAL": "estadual",
            "DISTRITAL": "distrital",
            "MUNICIPAL": "municipal",
            "NACIONAL": "nacional",
        }
        label = labels.get(str(value).upper())
        add(_find_snippet(text, label) if label else None, "keyword", 70)
        return items

    if key == "education_level" and isinstance(value, list):
        for level in value:
            add(_find_snippet(text, str(level)), "keyword", 90)
        return items

    if isinstance(value, (list, tuple)):
        for item in value:
            add(_find_snippet(text, str(item)), "value", 90)
        return items

    needle = clean_whitespace(str(value))
    quote = _find_snippet(text, needle)
    if quote:
        add(quote, "literal", 95)
        return items

    # Nomes de órgãos podem aparecer de forma abreviada. Registra evidência
    # parcial em vez de aceitar silenciosamente um nome inventado.
    tokens = [token for token in normalize(needle).split() if len(token) >= 4]
    for token in tokens[:4]:
        quote = _find_snippet(text, token)
        if quote:
            add(quote, "partial", 65)
            break
    return items


def build_fact_evidence(article: ExtractedArticle) -> dict[str, Any]:
    """Constrói uma ficha de evidências determinística para os fatos extraídos."""
    text = "\n".join(
        [
            article.title,
            article.summary,
            article.body_text,
            article.source_name,
            str(article.metadata.get("page_title") or ""),
        ]
    )
    facts_report: dict[str, Any] = {}
    missing: list[str] = []
    critical_missing: list[str] = []
    supported = 0

    for key, value in article.facts.items():
        if value in (None, "", []):
            continue
        items = _evidence_for_fact(
            key,
            value,
            text,
            source_url=article.url,
            source_title=article.title,
        )
        if not items and key == "state_uf":
            city_name = article.facts.get("city_name")
            if city_name:
                city_items = _evidence_for_fact(
                    "city_name",
                    city_name,
                    text,
                    source_url=article.url,
                    source_title=article.title,
                )
                if city_items:
                    item = dict(city_items[0])
                    item["method"] = "city-to-uf"
                    item["confidence"] = 70
                    item["quote"] = f"Município: {city_name}. {item.get('quote', '')}"
                    items = [item]
        if items:
            status = "supported"
            if all(item.get("method") in {"keyword", "partial"} for item in items):
                status = "inferred" if key in ALLOW_INFERRED else "partial"
            if any(item.get("method") == "city-to-uf" for item in items):
                status = "inferred"
            confidence = max(int(item.get("confidence") or 0) for item in items)
            supported += 1
        elif key in ALLOW_INFERRED:
            status = "inferred"
            confidence = 50
        else:
            status = "missing"
            confidence = 0
            missing.append(key)
            if key in CRITICAL_FACTS:
                critical_missing.append(key)
        facts_report[key] = {
            "value": value,
            "status": status,
            "confidence": confidence,
            "evidence": items,
        }

    total = len(facts_report)
    score = max(0, 100 - 22 * len(critical_missing) - 2 * len(missing))
    report = {
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "method": "deterministic_source_evidence_v1",
        "sourceUrl": article.url,
        "sourceTitle": article.title,
        "sourceTier": article.source_tier,
        "officialSource": article.source_tier in {"official_primary", "official_secondary"},
        "score": score,
        "totalFacts": total,
        "supportedFacts": supported,
        "missing": missing,
        "criticalMissing": critical_missing,
        "facts": facts_report,
    }
    article.fact_evidence = {
        key: list(item["evidence"]) for key, item in facts_report.items() if item["evidence"]
    }
    article.verification = report
    return report


def _blocking_warning(warning: str) -> bool:
    normalized = normalize(warning)
    return any(marker in normalized for marker in BLOCKING_MARKERS)


def blocking_warnings(warnings: list[str]) -> list[str]:
    return [warning for warning in warnings if _blocking_warning(warning)]


def _same_entity(left: str | None, right: str | None) -> bool:
    if not left or not right:
        return True
    a, b = normalize(left), normalize(right)
    if a == b or a in b or b in a:
        return True
    if len(a) <= 6 and a in b:
        return True
    return title_similarity(left, right) >= 0.62


def _field_warnings(article: ExtractedArticle, generated: GeneratedArticle) -> list[str]:
    warnings: list[str] = []
    raw = generated.raw or {}
    facts = article.facts

    def check(field: str, fact_key: str, label: str) -> None:
        if not facts.get(fact_key):
            return
        raw_value = clean_whitespace(str(raw.get(field) or ""))
        if raw_value and not _same_entity(raw_value, str(facts[fact_key])):
            warnings.append(f"campo '{label}' diverge do fato extraído: {raw_value}")

    check("organ", "organ", "órgão")
    check("banca", "banca", "banca")
    check("state_uf", "state_uf", "UF")
    check("city_name", "city_name", "município")

    status = clean_whitespace(str(raw.get("status") or "")).lower()
    fact_status = str(facts.get("status") or "").lower()
    if status and fact_status and status != fact_status:
        warnings.append(f"campo 'status' diverge do fato extraído: {status} != {fact_status}")

    education = raw.get("education_level")
    if isinstance(education, list) and facts.get("education_level"):
        expected = {str(item).lower() for item in facts["education_level"]}
        received = {str(item).lower() for item in education}
        if not received.issubset(expected):
            warnings.append(
                "campo 'education_level' contém níveis sem respaldo: "
                + ", ".join(sorted(received - expected))
            )
    return warnings


def verify_article(
    article: ExtractedArticle,
    generated: GeneratedArticle,
    settings: Settings,
) -> dict[str, Any]:
    """Auditoria final: fonte, evidência, consistência e avisos bloqueantes."""
    evidence = article.verification or build_fact_evidence(article)
    blocking: list[str] = []
    warnings: list[str] = []

    if settings.require_official_source and article.source_tier not in {
        "official_primary",
        "official_secondary",
    }:
        blocking.append("fonte oficial não identificada; artigo não pode ser gerado")

    if settings.require_fact_evidence:
        for key in evidence.get("criticalMissing") or []:
            blocking.append(f"fato crítico sem evidência na fonte: {key}")

    for warning in blocking_warnings(generated.warnings):
        if warning not in blocking:
            blocking.append(warning)

    field_warnings = _field_warnings(article, generated)
    warnings.extend(field_warnings)
    for warning in field_warnings:
        if "diverge do fato" in normalize(warning):
            blocking.append(warning)

    conflicts = article.metadata.get("corroboration_conflicts") or []
    if conflicts and settings.block_on_fact_conflict:
        blocking.extend(str(item) for item in conflicts)

    score = max(0, min(100, int(evidence.get("score") or 0) - 4 * len(field_warnings)))
    ready = not blocking and score >= settings.verification_min_score
    report = {
        **evidence,
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "score": score,
        "blocking": blocking,
        "warnings": warnings,
        "ready": ready,
        "requiredScore": settings.verification_min_score,
        "officialSource": evidence.get("officialSource", False),
    }
    return report


def fact_sheet(report: dict[str, Any]) -> list[dict[str, Any]]:
    """Converte o relatório em uma lista adequada ao campo factSheet do Sanity."""
    rows: list[dict[str, Any]] = []
    for key, item in (report.get("facts") or {}).items():
        evidence = (item.get("evidence") or [{}])[0]
        key_slug = re.sub(r"[^a-z0-9]+", "-", key.lower()).strip("-")
        value = item.get("value")
        if not isinstance(value, str):
            value = json.dumps(value, ensure_ascii=False)
        rows.append(
            {
                "_type": "factCheck",
                "_key": f"fact-{key_slug}",
                "key": key,
                "value": value,
                "status": item.get("status"),
                "confidence": item.get("confidence"),
                "quote": evidence.get("quote"),
                "sourceUrl": evidence.get("sourceUrl") or report.get("sourceUrl"),
                "sourceTitle": evidence.get("sourceTitle") or report.get("sourceTitle"),
                "method": evidence.get("method"),
            }
        )
    return rows
