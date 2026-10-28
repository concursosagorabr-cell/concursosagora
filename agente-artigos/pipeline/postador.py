from __future__ import annotations

import argparse
import json
import logging
import re
import sys
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

from pipeline.config import ConfigError, Settings, load_settings
from pipeline.dedupe import normalize_slug_candidate
from pipeline.portable_text import markdown_to_portable_text
from pipeline.sanity import SanityClient, SanityContext, SanityError
from pipeline.text import (
    clean_whitespace,
    dedupe_preserve_order,
    normalize,
    slugify,
    strip_accents,
    title_similarity,
    word_count,
)

log = logging.getLogger(__name__)

VALID_STATUSES = {"aberto", "previsto", "em_andamento", "encerrado"}
VALID_PHASES = {
    "aguardando_autorizacao",
    "autorizado",
    "comissao_formada",
    "ato_intermediario",
    "edital_publicado",
    "inscricoes_abertas",
    "provas_aplicadas",
    "resultado_publicado",
    "encerrado",
}
VALID_SPHERES = {"FEDERAL", "ESTADUAL", "DISTRITAL", "MUNICIPAL", "NACIONAL"}
VALID_EDUCATION = {"fundamental", "medio", "tecnico", "superior"}
VALID_SOURCE_TYPES = {"official", "secondary"}
VALID_SOURCE_KINDS = {"official_primary", "official_secondary", "journalism", "aggregator"}
VALID_SOURCE_USAGES = {"facts", "discovery", "corroboration"}
VALID_UFS = {
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
    "Nacional",
}

MESES = {
    "janeiro": 1,
    "fevereiro": 2,
    "marco": 3,
    "abril": 4,
    "maio": 5,
    "junho": 6,
    "julho": 7,
    "agosto": 8,
    "setembro": 9,
    "outubro": 10,
    "novembro": 11,
    "dezembro": 12,
}

NUMBER_RE = re.compile(r"\d[\d.,]*")


class PostadorError(RuntimeError):
    """Erro de validação ou de gravação do postador."""


@dataclass
class PostItemResult:
    index: int
    title: str = ""
    slug: str = ""
    status: str = "error"
    message: str = ""
    sanity_id: str | None = None
    url: str = ""
    author: str = ""
    categories: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    word_count: int = 0
    document: dict[str, Any] | None = None

    def as_dict(self, *, include_document: bool = False) -> dict[str, Any]:
        data = {
            "index": self.index,
            "title": self.title,
            "slug": self.slug,
            "status": self.status,
            "message": self.message,
            "sanity_id": self.sanity_id,
            "url": self.url,
            "author": self.author,
            "categories": self.categories,
            "warnings": self.warnings,
            "word_count": self.word_count,
        }
        if include_document:
            data["document"] = self.document
        return data


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _today() -> date:
    return datetime.now(timezone.utc).date()


def _clip_words(text: str, limit: int) -> str:
    value = " ".join((text or "").split())
    if len(value) <= limit:
        return value
    cut = value[:limit].rsplit(" ", 1)[0].rstrip(" .,;:-")
    return cut or value[:limit]


def _split_table_row(line: str) -> list[str]:
    value = line.strip()
    if value.startswith("|"):
        value = value[1:]
    if value.endswith("|"):
        value = value[:-1]
    return [cell.strip() for cell in value.split("|")]


def _markdown_tables_to_bullets(markdown: str) -> tuple[str, int]:
    """Converte tabelas Markdown simples em bullets compatíveis com Portable Text."""
    lines = markdown.split("\n")
    output: list[str] = []
    converted = 0
    index = 0
    while index < len(lines):
        line = lines[index]
        if (
            "|" in line
            and index + 1 < len(lines)
            and re.match(r"^\s*\|?\s*:?-{2,}", lines[index + 1])
        ):
            headers = _split_table_row(line)
            separators = _split_table_row(lines[index + 1])
            if len(headers) >= 2 and len(separators) >= 2:
                row_index = index + 2
                rows: list[list[str]] = []
                while (
                    row_index < len(lines)
                    and "|" in lines[row_index]
                    and lines[row_index].strip()
                ):
                    rows.append(_split_table_row(lines[row_index]))
                    row_index += 1
                if rows:
                    key_value_headers = (
                        len(headers) == 2
                        and normalize(headers[0])
                        in {"campo", "item", "rotulo", "label", "informacao", "descricao"}
                        and normalize(headers[1])
                        in {"valor", "value", "conteudo", "informacao", "descricao"}
                    )
                    for row in rows:
                        if key_value_headers and len(row) >= 2:
                            key = row[0].strip()
                            value = row[1].strip()
                            if key and value:
                                output.append(f"- **{key}:** {value}")
                            continue
                        parts: list[str] = []
                        for column, cell in enumerate(row):
                            cell = cell.strip()
                            if not cell:
                                continue
                            header = headers[column] if column < len(headers) else ""
                            parts.append(f"**{header}:** {cell}" if header else cell)
                        if parts:
                            output.append("- " + "; ".join(parts))
                    converted += 1
                    index = row_index
                    continue
        output.append(line)
        index += 1
    return "\n".join(output), converted


def _first(item: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in item and item[key] not in (None, "", [], {}):
            return item[key]
    return None


def _is_http_url(value: str) -> bool:
    try:
        parsed = urlsplit(value)
    except ValueError:
        return False
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def parse_date_value(value: Any) -> str | None:
    """Aceita YYYY-MM-DD, DD/MM/YYYY e '15 de outubro de 2026'."""
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    text = clean_whitespace(str(value))
    if not text:
        return None
    iso_datetime = re.match(r"(\d{4}-\d{2}-\d{2})[T ]", text)
    if iso_datetime:
        text = iso_datetime.group(1)
    try:
        iso = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", text)
        if iso:
            return date(int(iso.group(1)), int(iso.group(2)), int(iso.group(3))).isoformat()
        br = re.fullmatch(r"(\d{1,2})/(\d{1,2})/(\d{4})", text)
        if br:
            return date(int(br.group(3)), int(br.group(2)), int(br.group(1))).isoformat()
        long_date = re.fullmatch(
            r"(\d{1,2})\s+de\s+([A-Za-zÀ-ÿ]+)\s+de\s+(\d{4})",
            text,
            flags=re.IGNORECASE,
        )
        if long_date:
            month = MESES.get(strip_accents(long_date.group(2).lower()))
            if month:
                return date(int(long_date.group(3)), month, int(long_date.group(1))).isoformat()
    except ValueError as exc:
        raise PostadorError(f"data inválida: {value!r}") from exc
    raise PostadorError(
        f"data inválida: {value!r} (use YYYY-MM-DD, DD/MM/YYYY ou '15 de outubro de 2026')"
    )


def parse_datetime_value(value: Any) -> str:
    if value is None or value == "":
        return _now()
    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, date):
        parsed = datetime(
            value.year,
            value.month,
            value.day,
            12,
            0,
            tzinfo=timezone(timedelta(hours=-3)),
        )
    else:
        text = clean_whitespace(str(value))
        try:
            parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        except ValueError:
            parsed_date = parse_date_value(text)
            parsed = datetime.fromisoformat(f"{parsed_date}T12:00:00-03:00")
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone(timedelta(hours=-3)))
    return parsed.isoformat()


def _parse_token(token: str) -> float | None:
    token = token.strip().strip(".,")
    if not token:
        return None
    if "," in token and "." in token:
        normalized = token.replace(".", "").replace(",", ".")
    elif "," in token:
        normalized = token.replace(",", ".")
    elif "." in token:
        parts = token.split(".")
        if len(parts) > 2 or (len(parts) == 2 and len(parts[1]) == 3):
            normalized = token.replace(".", "")
        else:
            normalized = token
    else:
        normalized = token
    try:
        return float(normalized)
    except ValueError:
        return None


def _numbers_in(value: Any) -> list[float]:
    if isinstance(value, bool):
        return []
    if isinstance(value, (int, float)):
        return [float(value)]
    numbers: list[float] = []
    for token in NUMBER_RE.findall(str(value or "")):
        parsed = _parse_token(token)
        if parsed is not None:
            numbers.append(parsed)
    return numbers


def parse_int_value(value: Any) -> int | None:
    if value is None or value == "" or isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value if value >= 0 else None
    if isinstance(value, float):
        return int(round(value)) if value >= 0 else None
    text = str(value)
    normalized = normalize(text)
    numbers = _numbers_in(text)
    if not numbers:
        return None
    if "total" in normalized:
        match = re.search(r"total[^\d]*(\d[\d.,]*)", normalized)
        if match:
            parsed = _parse_token(match.group(1))
            if parsed is not None:
                return int(round(parsed))
    if "+" in text and len(numbers) > 1:
        return int(round(sum(numbers)))
    return int(round(numbers[0]))


def parse_float_value(value: Any) -> float | None:
    if value is None or value == "" or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value) if value >= 0 else None
    numbers = _numbers_in(value)
    if not numbers:
        return None
    return max(0.0, numbers[0])


def parse_salary_range(value: Any) -> tuple[float | None, float | None]:
    if value is None or value == "" or isinstance(value, bool):
        return None, None
    if isinstance(value, (int, float)):
        number = float(value)
        return (number, number) if number >= 0 else (None, None)
    numbers = _numbers_in(value)
    if not numbers:
        return None, None
    normalized = normalize(str(value))
    if len(numbers) >= 2 and re.search(r"\b(a|ate)\b", normalized):
        return numbers[0], numbers[1]
    return numbers[0], numbers[0]


def _coerce_bool(value: Any) -> bool | None:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return value
    text = normalize(str(value))
    if text in {"1", "true", "sim", "yes", "y"}:
        return True
    if text in {"0", "false", "nao", "no", "n"}:
        return False
    return None


def _normalize_education(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        values = [value]
    elif isinstance(value, (list, tuple, set)):
        values = [str(item) for item in value]
    else:
        values = [str(value)]
    mapping = {
        "fundamental": "fundamental",
        "medio": "medio",
        "medio superior": "medio",
        "tecnico": "tecnico",
        "superior": "superior",
        "nivel superior": "superior",
        "ensino superior": "superior",
        "nivel medio": "medio",
        "ensino medio": "medio",
    }
    result: list[str] = []
    for item in values:
        key = normalize(item)
        level = mapping.get(key)
        if not level:
            if "superior" in key:
                level = "superior"
            elif "tecnico" in key:
                level = "tecnico"
            elif "medio" in key:
                level = "medio"
            elif "fundamental" in key:
                level = "fundamental"
        if level and level in VALID_EDUCATION:
            result.append(level)
    return dedupe_preserve_order(result)


def _normalize_uf(value: Any) -> str | None:
    if value is None or value == "":
        return None
    text = clean_whitespace(str(value))
    if normalize(text) in {"nacional", "brasil", "br", "nacional brasil"}:
        return "Nacional"
    uf = text.upper()
    return uf if uf in VALID_UFS else None


def _normalize_sphere(value: Any) -> str | None:
    if value is None or value == "":
        return None
    mapping = {
        "federal": "FEDERAL",
        "estadual": "ESTADUAL",
        "distrital": "DISTRITAL",
        "municipal": "MUNICIPAL",
        "nacional": "NACIONAL",
    }
    return mapping.get(normalize(str(value)))


def _normalize_source_urls(value: Any, *, article_title: str) -> tuple[list[dict[str, Any]], list[str]]:
    warnings: list[str] = []
    if value is None:
        return [], warnings
    if isinstance(value, str):
        value = [{"url": value}]
    if not isinstance(value, list):
        return [], ["source_urls ignorado: deve ser uma lista"]
    result: list[dict[str, Any]] = []
    for index, raw in enumerate(value):
        if isinstance(raw, str):
            raw = {"url": raw}
        if not isinstance(raw, dict):
            warnings.append(f"source_urls[{index}] ignorado: item inválido")
            continue
        url = str(raw.get("url") or "").strip()
        if not url or not _is_http_url(url):
            warnings.append(f"source_urls[{index}] ignorado: URL inválida")
            continue
        kind = str(raw.get("kind") or "official_primary").strip().lower().replace(" ", "_")
        if kind not in VALID_SOURCE_KINDS:
            warnings.append(f"source_urls[{index}] kind inválido: {kind!r}; usando official_primary")
            kind = "official_primary"
        source_type = str(raw.get("type") or "").strip().lower()
        source_type = {"oficial": "official", "secundaria": "secondary"}.get(source_type, source_type)
        if source_type not in VALID_SOURCE_TYPES:
            source_type = "official" if kind.startswith("official_") else "secondary"
        usage = str(raw.get("usage") or "").strip().lower()
        usage = {
            "fatos": "facts",
            "descoberta": "discovery",
            "corroboracao": "corroboration",
        }.get(usage, usage)
        if usage not in VALID_SOURCE_USAGES:
            usage = "facts" if source_type == "official" else "discovery"
        result.append(
            {
                "_type": "sourceReference",
                "_key": f"src-{index}",
                "title": str(raw.get("title") or article_title)[:200],
                "url": url,
                "type": source_type,
                "kind": kind,
                "usage": usage,
                "evidence": (str(raw.get("evidence") or "").strip()[:600] or None),
                "checkedAt": str(raw.get("checked_at") or raw.get("checkedAt") or _now()),
            }
        )
    return result, warnings


def _normalize_vacancies_by_role(value: Any) -> tuple[list[dict[str, Any]], list[str]]:
    warnings: list[str] = []
    if value is None:
        return [], warnings
    if not isinstance(value, list):
        return [], ["vacancies_by_role ignorado: deve ser uma lista"]
    result: list[dict[str, Any]] = []
    for index, raw in enumerate(value):
        if not isinstance(raw, dict):
            warnings.append(f"vacancies_by_role[{index}] ignorado: item inválido")
            continue
        role = clean_whitespace(str(raw.get("role") or raw.get("cargo") or ""))
        if not role:
            warnings.append(f"vacancies_by_role[{index}] ignorado: cargo ausente")
            continue
        item: dict[str, Any] = {
            "_type": "vacancyByRole",
            "_key": f"role-{index}",
            "role": role[:160],
        }
        vacancies = parse_int_value(_first(raw, "vacancies", "vagas"))
        if vacancies is not None:
            item["vacancies"] = vacancies
        salary = parse_float_value(_first(raw, "salary", "salario"))
        if salary is not None:
            item["salary"] = salary
        requirements = clean_whitespace(str(_first(raw, "requirements", "requisitos") or ""))
        if requirements:
            item["requirements"] = requirements[:300]
        result.append(item)
    return result, warnings


def _normalize_seo(value: Any, *, title: str, excerpt: str) -> tuple[dict[str, Any], list[str]]:
    warnings: list[str] = []
    raw = dict(value) if isinstance(value, dict) else {}
    if value is not None and not isinstance(value, dict):
        warnings.append("seo ignorado: deve ser um objeto")
    meta_title = clean_whitespace(str(_first(raw, "meta_title", "metaTitle") or ""))
    meta_description = clean_whitespace(str(_first(raw, "meta_description", "metaDescription") or ""))
    keywords_raw = raw.get("keywords") or []
    if isinstance(keywords_raw, str):
        keywords_raw = [part.strip() for part in keywords_raw.split(",")]
    keywords = dedupe_preserve_order(
        [clean_whitespace(str(item)) for item in keywords_raw if clean_whitespace(str(item))]
    )
    no_index_raw = raw.get("no_index") if "no_index" in raw else raw.get("noIndex")
    no_index = _coerce_bool(no_index_raw)
    seo: dict[str, Any] = {
        "metaTitle": _clip_words(meta_title or title, 70),
        "metaDescription": _clip_words(meta_description or excerpt or title, 160),
        "keywords": keywords,
        "noIndex": bool(no_index) if no_index is not None else False,
    }
    canonical = str(_first(raw, "canonical_url", "canonicalUrl") or "").strip()
    if canonical:
        if _is_http_url(canonical):
            seo["canonicalUrl"] = canonical
        else:
            warnings.append("seo.canonical_url inválida; ignorada")
    return seo, warnings


def _normalize_main_image(value: Any, *, title: str) -> tuple[dict[str, Any] | None, list[str]]:
    warnings: list[str] = []
    if value is None:
        return None, warnings
    if isinstance(value, str):
        value = {"url": value}
    if not isinstance(value, dict):
        return None, ["main_image ignorado: deve ser um objeto ou URL"]
    url = str(value.get("url") or "").strip()
    if not url or not _is_http_url(url):
        return None, ["main_image ignorado: URL inválida"]
    return (
        {
            "url": url,
            "alt": clean_whitespace(str(value.get("alt") or title))[:200],
            "caption": clean_whitespace(str(value.get("caption") or ""))[:300] or None,
            "credit": clean_whitespace(str(value.get("credit") or ""))[:200] or None,
        },
        warnings,
    )


def normalize_item(item: dict[str, Any], index: int) -> dict[str, Any]:
    if not isinstance(item, dict):
        raise PostadorError("item inválido: esperado um objeto")
    warnings: list[str] = []

    title = clean_whitespace(str(_first(item, "title", "titulo") or ""))
    if not title:
        raise PostadorError("campo 'title' é obrigatório")
    if len(title) < 8:
        raise PostadorError("campo 'title' deve ter pelo menos 8 caracteres")
    if len(title) > 160:
        warnings.append(f"título com {len(title)} caracteres; cortado para 160")
        title = _clip_words(title, 160)

    excerpt = clean_whitespace(
        str(_first(item, "excerpt", "subtitle", "linha_fina") or "")
    )
    if len(excerpt) > 300:
        warnings.append(f"excerpt com {len(excerpt)} caracteres; cortado para 300")
        excerpt = _clip_words(excerpt, 300)

    body_markdown = (
        str(_first(item, "body_markdown", "body") or "")
        .replace("\r\n", "\n")
        .replace("\r", "\n")
        .strip()
    )
    if not body_markdown:
        raise PostadorError("campo 'body_markdown' é obrigatório")
    body_markdown, converted_tables = _markdown_tables_to_bullets(body_markdown)
    if converted_tables:
        warnings.append(
            f"{converted_tables} tabela(s) Markdown convertida(s) em lista de bullets"
        )
    if "\t" in body_markdown:
        warnings.append(
            "o corpo contém tabulações; converta a ficha técnica em lista de bullets"
        )
    if re.search(r"<table\b", body_markdown, flags=re.IGNORECASE):
        warnings.append(
            "o corpo contém uma tabela HTML; converta para lista de bullets"
        )
    if body_markdown.startswith("# "):
        first_line = body_markdown.split("\n", 1)[0].lstrip("# ").strip()
        if normalize(first_line) == normalize(title):
            warnings.append(
                "o corpo começa com um título igual ao campo 'title'; remova essa linha para evitar duplicidade"
            )
    body_words = word_count(body_markdown)
    if body_words < 100:
        warnings.append(f"corpo com {body_words} palavras; o ideal é 300+")

    slug = slugify(str(_first(item, "slug") or title), 96)
    if not slug:
        raise PostadorError("não foi possível gerar um slug a partir do título")

    author_slug = clean_whitespace(str(_first(item, "author_slug", "author") or "")).lower() or None
    published_at_raw = _first(item, "published_at", "publishedAt")
    published_at = parse_datetime_value(published_at_raw)

    status_raw = normalize(str(item.get("status") or ""))
    status_map = {
        "aberto": "aberto",
        "previsto": "previsto",
        "aguardando edital": "previsto",
        "em andamento": "em_andamento",
        "andamento": "em_andamento",
        "encerrado": "encerrado",
    }
    status = status_map.get(status_raw, status_raw if status_raw in VALID_STATUSES else None)
    if status_raw and not status:
        warnings.append(f"status inválido: {item.get('status')!r}; será inferido")

    phase_raw = normalize(
        str(_first(item, "contest_status", "contestStatus", "contest_phase") or "")
    ).replace(" ", "_")
    contest_status = phase_raw if phase_raw in VALID_PHASES else None
    if phase_raw and not contest_status:
        warnings.append(
            f"contest_status inválido: {item.get('contest_status')!r}; será omitido"
        )

    organ = clean_whitespace(str(_first(item, "organ", "orgao") or ""))[:160] or None
    banca = clean_whitespace(str(_first(item, "banca") or ""))[:120] or None

    sphere = _normalize_sphere(_first(item, "sphere", "esfera"))
    if _first(item, "sphere", "esfera") and not sphere:
        warnings.append(f"sphere inválido: {_first(item, 'sphere', 'esfera')!r}; será omitido")

    state_uf = _normalize_uf(_first(item, "state_uf", "stateUf", "uf"))
    if _first(item, "state_uf", "stateUf", "uf") and not state_uf:
        warnings.append(
            f"state_uf inválido: {_first(item, 'state_uf', 'stateUf', 'uf')!r}; será omitido"
        )

    city_name = clean_whitespace(
        str(_first(item, "city_name", "cityName", "municipio") or "")
    )[:100] or None

    education_raw = _first(item, "education_level", "educationLevel", "escolaridade")
    education_level = _normalize_education(education_raw)
    if education_raw and not education_level:
        warnings.append("education_level não reconhecido; será omitido")

    vacancies_total = parse_int_value(
        _first(item, "vacancies_total", "vacanciesTotal", "vagas")
    )
    salary_min_raw = _first(item, "salary_min", "salaryMin")
    salary_max_raw = _first(item, "salary_max", "salaryMax")
    salary_min = parse_float_value(salary_min_raw) if salary_min_raw is not None else None
    salary_max = parse_float_value(salary_max_raw) if salary_max_raw is not None else None
    salary_raw = _first(item, "salary", "salario", "remuneracao", "remuneração")
    if salary_raw is not None and salary_min is None and salary_max is None:
        salary_min, salary_max = parse_salary_range(salary_raw)
    if salary_min is not None and salary_max is None:
        salary_max = salary_min
    if salary_max is not None and salary_min is None:
        salary_min = salary_max

    registration_fee = parse_float_value(
        _first(item, "registration_fee", "registrationFee", "taxa")
    )
    has_exemption = _coerce_bool(_first(item, "has_exemption", "hasExemption"))
    is_cr_only = _coerce_bool(_first(item, "is_cr_only", "isCrOnly"))

    enrollment_start_date = parse_date_value(
        _first(item, "enrollment_start_date", "enrollmentStartDate", "inscricao_inicio")
    )
    enrollment_end_date = parse_date_value(
        _first(item, "enrollment_end_date", "enrollmentEndDate", "inscricao_fim")
    )
    exam_date = parse_date_value(_first(item, "exam_date", "examDate", "data_prova"))

    categories_raw = _first(item, "categories", "category_slugs") or []
    if isinstance(categories_raw, str):
        categories_raw = [categories_raw]
    categories = dedupe_preserve_order(
        [
            clean_whitespace(str(value))
            for value in categories_raw
            if clean_whitespace(str(value))
        ]
    )
    if len(categories) > 4:
        warnings.append(
            f"{len(categories)} categorias informadas; o Sanity aceita no máximo 4 por post"
        )
        categories = categories[:4]

    source_urls, source_warnings = _normalize_source_urls(
        _first(item, "source_urls", "sourceUrls", "sources"),
        article_title=title,
    )
    warnings.extend(source_warnings)

    seo, seo_warnings = _normalize_seo(
        item.get("seo"),
        title=title,
        excerpt=excerpt,
    )
    warnings.extend(seo_warnings)

    main_image, image_warnings = _normalize_main_image(
        _first(item, "main_image", "mainImage"),
        title=title,
    )
    warnings.extend(image_warnings)

    vacancies_by_role, role_warnings = _normalize_vacancies_by_role(
        _first(item, "vacancies_by_role", "vacanciesByRole")
    )
    warnings.extend(role_warnings)

    contest_key = clean_whitespace(str(_first(item, "contest_key", "contestKey") or ""))
    contest_key = slugify(contest_key, 120) if contest_key else None

    ai_assisted = _coerce_bool(_first(item, "ai_assisted", "aiAssisted"))
    if ai_assisted is None:
        ai_assisted = False

    return {
        "index": index,
        "title": title,
        "excerpt": excerpt,
        "body_markdown": body_markdown,
        "slug": slug,
        "author_slug": author_slug,
        "published_at": published_at,
        "published_at_provided": published_at_raw is not None,
        "status": status,
        "contest_status": contest_status,
        "organ": organ,
        "banca": banca,
        "sphere": sphere,
        "state_uf": state_uf,
        "city_name": city_name,
        "education_level": education_level,
        "vacancies_total": vacancies_total,
        "vacancies_by_role": vacancies_by_role,
        "salary_min": salary_min,
        "salary_max": salary_max,
        "registration_fee": registration_fee,
        "has_exemption": has_exemption,
        "is_cr_only": is_cr_only,
        "enrollment_start_date": enrollment_start_date,
        "enrollment_end_date": enrollment_end_date,
        "exam_date": exam_date,
        "categories": categories,
        "source_urls": source_urls,
        "seo": seo,
        "main_image": main_image,
        "contest_key": contest_key,
        "ai_assisted": ai_assisted,
        "warnings": warnings,
    }


def _infer_status(item: dict[str, Any]) -> tuple[str, str | None]:
    today = _today()
    start = item.get("enrollment_start_date")
    end = item.get("enrollment_end_date")
    exam = item.get("exam_date")
    if exam:
        exam_date = date.fromisoformat(exam)
        if exam_date < today:
            return "em_andamento", "provas_aplicadas"
    if start:
        start_date = date.fromisoformat(start)
        if start_date > today:
            return "aberto", "edital_publicado"
    if start and end:
        start_date = date.fromisoformat(start)
        end_date = date.fromisoformat(end)
        if start_date <= today <= end_date:
            return "aberto", "inscricoes_abertas"
    if end:
        end_date = date.fromisoformat(end)
        if end_date < today:
            return "em_andamento", None
    return "previsto", None


def _resolve_author(
    context: SanityContext,
    sanity: SanityClient,
    preferred_slug: str | None,
    warnings: list[str],
) -> dict[str, Any]:
    if preferred_slug:
        for author in context.authors:
            if slugify(str(author.get("slug") or "")) == slugify(preferred_slug):
                return author
        available = ", ".join(str(author.get("slug") or "") for author in context.authors) or "(nenhum)"
        raise PostadorError(f"autor não encontrado: {preferred_slug!r}. Disponíveis: {available}")
    author = sanity.resolve_author(context)
    if not author:
        raise PostadorError("nenhum autor cadastrado no Sanity; crie um autor antes de postar")
    warnings.append(f"autor padrão usado: {author.get('name') or author.get('slug')}")
    return author


def _resolve_categories(
    context: SanityContext,
    sanity: SanityClient,
    requested: list[str],
    warnings: list[str],
) -> tuple[list[dict[str, Any]], list[str]]:
    valid: list[str] = []
    for value in requested:
        category = context.category_by_slug(value)
        if category and category.get("slug"):
            valid.append(str(category["slug"]))
        else:
            warnings.append(f"categoria inexistente no Sanity: {value!r}")
    valid = dedupe_preserve_order(valid)
    if not valid:
        for fallback in ("concursos-abertos", "nacional", "federal"):
            category = context.category_by_slug(fallback)
            if category and category.get("slug"):
                valid.append(str(category["slug"]))
        if valid:
            warnings.append(
                "nenhuma categoria válida informada; usando fallback: " + ", ".join(valid)
            )
    if not valid:
        raise PostadorError(
            "nenhuma categoria válida encontrada no Sanity; informe 'categories' no bundle"
        )
    refs = sanity.resolve_categories(context, valid)
    if not refs:
        raise PostadorError("não foi possível montar as referências de categoria")
    return refs, valid


def _find_existing_post(
    context: SanityContext,
    item: dict[str, Any],
    requested_slug: str,
) -> dict[str, Any] | None:
    """Encontra um post existente pelo slug exato ou por título praticamente igual."""
    candidates: list[tuple[float, dict[str, Any]]] = []
    for post in context.posts:
        post_slug = str(post.get("slug") or "")
        post_title = str(post.get("title") or "")
        score = 0.0
        if post_slug and post_slug == requested_slug:
            score = 1.0
        elif post_title:
            score = title_similarity(post_title, item["title"])
        if score >= 0.98:
            candidates.append((score, post))
    if not candidates:
        return None
    # Prefere o documento publicado (sem "drafts.") e, depois, a maior similaridade.
    candidates.sort(
        key=lambda pair: (
            0 if str(pair[1].get("_id") or "").startswith("drafts.") else 1,
            pair[0],
        ),
        reverse=True,
    )
    return candidates[0][1]


def _contest_key_warning(
    context: SanityContext,
    item: dict[str, Any],
    warnings: list[str],
    *,
    ignore_id: str | None = None,
) -> None:
    contest_key = item.get("contest_key")
    if not contest_key:
        return
    for post in context.posts:
        if ignore_id and str(post.get("_id") or "") == ignore_id:
            continue
        if str(post.get("contestKey") or "") == contest_key:
            warnings.append(f"contestKey {contest_key!r} já usado por {post.get('_id')}")
            break


def _remember_post(
    context: SanityContext,
    *,
    existing: dict[str, Any] | None,
    document_id: str,
    title: str,
    slug: str,
    published_at: str,
    review_status: str,
    status: str | None,
    contest_key: str | None,
) -> None:
    if existing:
        existing_id = str(existing.get("_id") or "")
        context.posts = [
            post
            for post in context.posts
            if str(post.get("_id") or "") != existing_id
        ]
    context.posts.append(
        {
            "_id": document_id,
            "title": title,
            "slug": slug,
            "publishedAt": published_at,
            "reviewStatus": review_status,
            "status": status,
            "contestKey": contest_key,
        }
    )


def build_post_document(
    item: dict[str, Any],
    *,
    context: SanityContext,
    sanity: SanityClient,
    publish: bool,
    force: bool,
    dry_run: bool,
    run_id: str,
    existing: dict[str, Any] | None = None,
    update: bool = False,
    allow_duplicate: bool = False,
) -> tuple[dict[str, Any], dict[str, Any]]:
    warnings = list(item.get("warnings") or [])
    existing_author = existing.get("author") if update and existing else None
    if existing_author and existing_author.get("_id") and not item.get("author_slug"):
        author = existing_author
        warnings.append(
            f"autor existente preservado: {author.get('name') or author.get('_id')}"
        )
    else:
        author = _resolve_author(context, sanity, item.get("author_slug"), warnings)
    category_refs, category_slugs = _resolve_categories(
        context, sanity, list(item.get("categories") or []), warnings
    )

    requested_slug = item["slug"]
    if update and existing:
        existing_id = str(existing.get("_id") or "")
        existing_is_draft = existing_id.startswith("drafts.")
        slug = str(existing.get("slug") or requested_slug)
        if publish and existing_is_draft:
            document_id = existing_id.removeprefix("drafts.")
            review_status = "approved"
        else:
            document_id = existing_id
            review_status = "approved" if not existing_is_draft else "pending"
        published_at = (
            item["published_at"]
            if item.get("published_at_provided")
            else str(existing.get("publishedAt") or item["published_at"])
        )
        warnings.append(f"atualizando post existente {existing_id} (slug {slug})")
    else:
        slug = requested_slug if force else normalize_slug_candidate(
            requested_slug, context.existing_slugs
        )
        document_id = f"{'' if publish else 'drafts.'}{slug}"
        review_status = "approved" if publish else "pending"
        published_at = item["published_at"]
        if allow_duplicate and existing:
            warnings.append(
                f"duplicata permitida: já existe {existing.get('_id')}; "
                f"criando novo post com slug {slug!r}"
            )

    _contest_key_warning(
        context,
        item,
        warnings,
        ignore_id=str(existing.get("_id")) if update and existing else None,
    )

    body = markdown_to_portable_text(item["body_markdown"])
    if not body:
        body = [
            {
                "_type": "block",
                "_key": "block-0",
                "style": "normal",
                "markDefs": [],
                "children": [
                    {
                        "_type": "span",
                        "_key": "span-0",
                        "text": item["body_markdown"],
                        "marks": [],
                    }
                ],
            }
        ]

    status = item.get("status")
    contest_status = item.get("contest_status")
    if not status:
        status, inferred_phase = _infer_status(item)
        warnings.append(f"status não informado; inferido como {status!r}")
        if not contest_status and inferred_phase:
            contest_status = inferred_phase
    if not contest_status:
        if status == "encerrado":
            contest_status = "encerrado"
        elif status == "em_andamento":
            contest_status = "provas_aplicadas"
        elif status == "aberto":
            contest_status = (
                "inscricoes_abertas"
                if item.get("enrollment_start_date") or item.get("enrollment_end_date")
                else "edital_publicado"
            )

    state_uf = item.get("state_uf")
    city = item.get("city_name")
    location = None
    if city and state_uf and state_uf != "Nacional":
        location = f"{city} - {state_uf}"
    elif state_uf and state_uf != "Nacional":
        location = state_uf

    document: dict[str, Any] = {
        "_id": document_id,
        "_type": "post",
        "title": item["title"],
        "slug": {"_type": "slug", "current": slug},
        "excerpt": item["excerpt"],
        "body": body,
        "status": status,
        "publishedAt": published_at,
        "author": {"_type": "reference", "_ref": author["_id"]},
        "categories": category_refs,
        "reviewStatus": review_status,
        "aiAssisted": bool(item.get("ai_assisted")),
        "pipelineRunId": run_id,
        "seo": item["seo"],
    }
    if contest_status:
        document["contestStatus"] = contest_status
    if item.get("organ"):
        document["organ"] = item["organ"]
    if item.get("sphere"):
        document["sphere"] = item["sphere"]
    if item.get("banca"):
        document["banca"] = item["banca"]
    if state_uf:
        document["stateUf"] = state_uf
    if city:
        document["cityName"] = city
    if location:
        document["location"] = location
    if item.get("education_level"):
        document["educationLevel"] = item["education_level"]
    if item.get("vacancies_total") is not None:
        document["vacanciesTotal"] = item["vacancies_total"]
    if item.get("vacancies_by_role"):
        document["vacanciesByRole"] = item["vacancies_by_role"]
    if item.get("salary_min") is not None:
        document["salaryMin"] = item["salary_min"]
    if item.get("salary_max") is not None:
        document["salaryMax"] = item["salary_max"]
    if item.get("registration_fee") is not None:
        document["registrationFee"] = item["registration_fee"]
    if item.get("has_exemption") is not None:
        document["hasExemption"] = item["has_exemption"]
    if item.get("is_cr_only") is not None:
        document["isCrOnly"] = item["is_cr_only"]
    if item.get("enrollment_start_date"):
        document["enrollmentStartDate"] = item["enrollment_start_date"]
    if item.get("enrollment_end_date"):
        document["enrollmentEndDate"] = item["enrollment_end_date"]
    if item.get("exam_date"):
        document["examDate"] = item["exam_date"]
    if item.get("source_urls"):
        document["sourceUrls"] = item["source_urls"]
    if item.get("contest_key"):
        document["contestKey"] = item["contest_key"]

    main_image = item.get("main_image")
    if main_image:
        if dry_run:
            warnings.append(
                "main_image não foi enviada no dry-run; ela será enviada no --apply/--publish"
            )
        else:
            uploaded = sanity.upload_image_from_url(
                main_image["url"],
                title=main_image.get("alt") or item["title"],
                credit=main_image.get("credit") or "Arquivo pessoal",
            )
            if uploaded:
                uploaded["alt"] = main_image.get("alt") or item["title"]
                if main_image.get("caption"):
                    uploaded["caption"] = main_image["caption"]
                if main_image.get("credit"):
                    uploaded["credit"] = main_image["credit"]
                document["mainImage"] = uploaded
            else:
                warnings.append(
                    "não foi possível baixar/enviar a imagem principal; o post será criado sem imagem"
                )
    elif update and existing and existing.get("mainImage"):
        # O bundle não trouxe uma imagem nova. Como o createOrReplace substitui
        # o documento inteiro, preserve a imagem já cadastrada no Sanity para
        # que uma atualização de texto/datas não apague a arte do post.
        document["mainImage"] = existing["mainImage"]
        warnings.append("imagem principal existente preservada")

    return document, {
        "warnings": warnings,
        "slug": slug,
        "author": author,
        "categories": category_slugs,
        "document_id": document_id,
        "review_status": review_status,
        "published_at": published_at,
        "updated": bool(update and existing),
    }


def process_item(
    item: dict[str, Any],
    index: int,
    *,
    settings: Settings,
    sanity: SanityClient,
    context: SanityContext,
    run_id: str,
    apply: bool,
    publish: bool,
    force: bool,
    update: bool = False,
    allow_duplicate: bool = False,
) -> tuple[PostItemResult, dict[str, Any] | None]:
    normalized = normalize_item(item, index)
    existing = _find_existing_post(context, normalized, normalized["slug"])

    if existing and not update and not allow_duplicate and not force:
        existing_id = str(existing.get("_id") or "")
        existing_slug = str(existing.get("slug") or normalized["slug"])
        result = PostItemResult(
            index=index,
            title=normalized["title"],
            slug=existing_slug,
            status="skipped_duplicate",
            message=(
                f"já existe um post com este título/slug: {existing_id} "
                f"(slug {existing_slug}). Use --update para atualizar o existente "
                "ou --allow-duplicate para criar outro."
            ),
            sanity_id=existing_id,
            word_count=word_count(normalized["body_markdown"]),
        )
        if existing_id and not existing_id.startswith("drafts.") and settings.frontend_url:
            result.url = f"{settings.frontend_url.rstrip('/')}/post/{existing_slug}"
        return result, None

    dry_run = not (apply or publish or update)
    document, meta = build_post_document(
        normalized,
        context=context,
        sanity=sanity,
        publish=publish,
        force=force,
        dry_run=dry_run,
        run_id=run_id,
        existing=existing,
        update=update,
        allow_duplicate=allow_duplicate,
    )
    normalized["status"] = document.get("status")
    normalized["contest_status"] = document.get("contestStatus")

    result = PostItemResult(
        index=index,
        title=normalized["title"],
        slug=meta["slug"],
        author=str(meta["author"].get("name") or meta["author"].get("slug") or ""),
        categories=list(meta["categories"]),
        warnings=list(meta["warnings"]),
        word_count=word_count(normalized["body_markdown"]),
        document=document,
    )
    if update and not existing:
        result.warnings.append(
            "nenhum post existente encontrado para atualizar; um novo post será criado"
        )
    if update and existing and not str(existing.get("_id") or "").startswith("drafts."):
        existing_slug = str(existing.get("slug") or meta["slug"])
        draft_id = f"drafts.{existing_slug}"
        if any(str(post.get("_id") or "") == draft_id for post in context.posts):
            result.warnings.append(
                f"existe um rascunho {draft_id} com o mesmo slug; ele não foi alterado "
                "e pode sobrescrever a atualização se for publicado"
            )

    if dry_run:
        result.status = "dry_run"
        result.message = (
            "validado; nada gravado (use --apply para rascunho, --publish para publicar "
            "ou --update para atualizar um post existente)"
        )
        _remember_post(
            context,
            existing=existing,
            document_id=str(document["_id"]),
            title=normalized["title"],
            slug=meta["slug"],
            published_at=meta["published_at"],
            review_status=meta["review_status"],
            status=normalized["status"],
            contest_key=normalized["contest_key"],
        )
        return result, document

    document_id = str(document["_id"])
    is_published_document = not document_id.startswith("drafts.")
    if update and existing:
        response = sanity.create_or_replace(
            document,
            allow_published=is_published_document,
        )
        result.status = "updated"
        result.message = "post existente atualizado no Sanity"
        if (
            publish
            and str(existing.get("_id") or "").startswith("drafts.")
            and is_published_document
        ):
            try:
                sanity.delete_document(str(existing["_id"]))
                result.warnings.append("rascunho antigo removido após a publicação")
            except SanityError as exc:
                result.warnings.append(
                    f"não foi possível remover o rascunho antigo: {exc}"
                )
    elif publish:
        response = sanity.create_or_replace(document, allow_published=True)
        result.status = "published"
        result.message = "publicado no Sanity com reviewStatus=approved"
    elif force:
        response = sanity.create_or_replace(document, allow_published=False)
        result.status = "created"
        result.message = "rascunho sobrescrito no Sanity com reviewStatus=pending"
    else:
        response = sanity.create_draft(document)
        result.status = "created"
        result.message = "rascunho criado no Sanity com reviewStatus=pending"

    result.sanity_id = str(response.get("id") or document_id)
    if is_published_document and settings.frontend_url:
        result.url = f"{settings.frontend_url.rstrip('/')}/post/{meta['slug']}"

    _remember_post(
        context,
        existing=existing,
        document_id=result.sanity_id,
        title=normalized["title"],
        slug=meta["slug"],
        published_at=meta["published_at"],
        review_status=meta["review_status"],
        status=normalized["status"],
        contest_key=normalized["contest_key"],
    )
    return result, document


def run_post_bundle(
    bundle_path: Path | str,
    *,
    apply: bool = False,
    publish: bool = False,
    force: bool = False,
    update: bool = False,
    allow_duplicate: bool = False,
    settings: Settings | None = None,
    sanity: SanityClient | None = None,
    context: SanityContext | None = None,
) -> dict[str, Any]:
    if update and allow_duplicate:
        raise PostadorError("--update e --allow-duplicate são mutuamente exclusivos")
    settings = settings or load_settings()
    settings.validate_sanity()
    path = Path(bundle_path).expanduser()
    if not path.exists():
        raise PostadorError(f"bundle não encontrado: {path}")
    try:
        bundle = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise PostadorError(f"bundle JSON inválido: {exc}") from exc

    bundle_meta: dict[str, Any] = {}
    if isinstance(bundle, list):
        items = bundle
    elif isinstance(bundle, dict):
        bundle_meta = bundle
        items = bundle.get("articles")
        if items is None and bundle.get("title"):
            items = [bundle]
        if not isinstance(items, list) or not items:
            raise PostadorError("o bundle precisa conter uma lista 'articles' não vazia")
    else:
        raise PostadorError("o bundle deve ser um objeto JSON ou uma lista de artigos")

    raw_run_id = str(
        bundle_meta.get("run_id") or f"postador-{datetime.now(timezone.utc):%Y%m%d-%H%M%S}"
    )
    run_id = slugify(raw_run_id, 80) or f"postador-{datetime.now(timezone.utc):%Y%m%d-%H%M%S}"
    default_author_slug = str(bundle_meta.get("default_author_slug") or "").strip() or None
    sanity = sanity or SanityClient(settings)
    context = context or sanity.get_context()
    apply = apply or publish

    results: list[PostItemResult] = []
    documents: list[dict[str, Any]] = []
    for index, item in enumerate(items, 1):
        if not isinstance(item, dict):
            results.append(
                PostItemResult(index=index, status="error", message="item inválido: esperado um objeto")
            )
            continue
        if default_author_slug and not (item.get("author_slug") or item.get("author")):
            item = dict(item)
            item["author_slug"] = default_author_slug
        try:
            result, document = process_item(
                item,
                index,
                settings=settings,
                sanity=sanity,
                context=context,
                run_id=run_id,
                apply=apply,
                publish=publish,
                force=force,
                update=update,
                allow_duplicate=allow_duplicate,
            )
            results.append(result)
            if document:
                documents.append(document)
        except Exception as exc:  # noqa: BLE001
            log.exception("Falha no item %s do postador", index)
            results.append(
                PostItemResult(
                    index=index,
                    title=str(item.get("title") or "")[:160],
                    status="error",
                    message=str(exc)[:1200],
                )
            )

    created = sum(1 for item in results if item.status == "created")
    published = sum(1 for item in results if item.status == "published")
    updated = sum(1 for item in results if item.status == "updated")
    skipped = sum(1 for item in results if item.status == "skipped_duplicate")
    dry_run = sum(1 for item in results if item.status == "dry_run")
    errors = sum(1 for item in results if item.status == "error")

    revalidated = False
    if (published or updated) and settings.frontend_url:
        secret = str(settings.env.get("SANITY_REVALIDATE_SECRET") or "").strip()
        if secret:
            revalidated = sanity.webhook_revalidate(secret)

    summary = {
        "run_id": run_id,
        "apply": apply,
        "publish": publish,
        "force": force,
        "update": update,
        "allow_duplicate": allow_duplicate,
        "bundle": str(path.resolve()),
        "total": len(results),
        "created": created,
        "published": published,
        "updated": updated,
        "skipped": skipped,
        "dry_run": dry_run,
        "errors": errors,
        "revalidated": revalidated,
        "items": [item.as_dict(include_document=False) for item in results],
        "documents": documents,
    }
    if update and publish:
        mode = "update-publish"
    elif update:
        mode = "update"
    elif publish:
        mode = "publish"
    elif apply:
        mode = "apply"
    else:
        mode = "dry-run"
    summary_path = settings.data_dir / "postador_runs" / f"{run_id}-{mode}.json"
    summary["summary_path"] = str(summary_path)
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2, default=str),
        encoding="utf-8",
    )
    return summary


def list_categories(settings: Settings, *, as_json: bool = False) -> int:
    settings.validate_sanity()
    sanity = SanityClient(settings)
    context = sanity.get_context()
    payload = {"authors": context.authors, "categories": context.categories}
    if as_json:
        print(json.dumps(payload, ensure_ascii=False, indent=2, default=str))
        return 0
    print("Autores:")
    if not context.authors:
        print("- (nenhum autor cadastrado)")
    for author in context.authors:
        print(f"- {author.get('slug')}\t{author.get('name')}")
    print("\nCategorias:")
    current_group = None
    for category in context.categories:
        group = str(category.get("group") or "sem grupo")
        if group != current_group:
            print(f"\n[{group}]")
            current_group = group
        print(f"- {category.get('slug')}\t{category.get('title')}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="postar.py",
        description=(
            "Postador de artigos já escritos pelo usuário: formata o conteúdo e "
            "cria rascunhos ou publica posts no Sanity."
        ),
    )
    parser.add_argument("--bundle", help="caminho do bundle JSON com os artigos")
    parser.add_argument("--apply", action="store_true", help="cria rascunhos no Sanity")
    parser.add_argument(
        "--publish",
        action="store_true",
        help="publica direto no Sanity (reviewStatus=approved)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="sobrescreve um post/rascunho com o mesmo slug",
    )
    parser.add_argument(
        "--update",
        action="store_true",
        help="atualiza um post existente encontrado pelo slug/título (preserva a URL)",
    )
    parser.add_argument(
        "--allow-duplicate",
        action="store_true",
        help="cria um novo post mesmo quando já existe um com o mesmo título/slug",
    )
    parser.add_argument(
        "--list-categories",
        action="store_true",
        help="lista autores e categorias disponíveis no Sanity",
    )
    parser.add_argument("--json", action="store_true", help="imprime o resultado em JSON")
    parser.add_argument(
        "--env-file",
        action="append",
        default=[],
        help="arquivo .env adicional (pode ser repetido)",
    )
    parser.add_argument("-v", "--verbose", action="store_true")
    parser.add_argument("-q", "--quiet", action="store_true")
    args = parser.parse_args(argv)

    level = logging.DEBUG if args.verbose else (logging.WARNING if args.quiet else logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(message)s",
        datefmt="%H:%M:%S",
        stream=sys.stderr,
    )

    try:
        env_files = [Path(item) for item in args.env_file] if args.env_file else None
        settings = load_settings(env_files=env_files)
        if args.list_categories:
            return list_categories(settings, as_json=args.json)
        if not args.bundle:
            parser.error("--bundle é obrigatório (ou use --list-categories)")
        summary = run_post_bundle(
            Path(args.bundle),
            apply=args.apply,
            publish=args.publish,
            force=args.force,
            update=args.update,
            allow_duplicate=args.allow_duplicate,
            settings=settings,
        )
    except (ConfigError, SanityError, PostadorError, ValueError) as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(summary, ensure_ascii=False, indent=2, default=str))
        return 0 if summary["errors"] == 0 else 1

    if summary["update"] and summary["publish"]:
        mode = "atualização + publicação no Sanity"
    elif summary["update"]:
        mode = "atualização de posts existentes no Sanity"
    elif summary["publish"]:
        mode = "publicado no Sanity"
    elif summary["apply"]:
        mode = "rascunhos no Sanity"
    else:
        mode = "dry-run (nada gravado)"
    print(f"Postador: {summary['total']} artigo(s)")
    print(f"Modo: {mode}")
    print(
        f"Criados: {summary['created']} | publicados: {summary['published']} | "
        f"atualizados: {summary['updated']} | ignorados: {summary['skipped']} | "
        f"validados: {summary['dry_run']} | erros: {summary['errors']}"
    )
    for item in summary["items"]:
        print(f"- [{item['status']}] {item['title'] or item['slug'] or item['index']}")
        if item.get("sanity_id"):
            print(f"  id: {item['sanity_id']}")
        if item.get("url"):
            print(f"  url: {item['url']}")
        if item.get("categories"):
            print(f"  categorias: {', '.join(item['categories'])}")
        if item.get("author"):
            print(f"  autor: {item['author']}")
        if item.get("message"):
            print(f"  {item['message']}")
        for warning in (item.get("warnings") or [])[:8]:
            print(f"  aviso: {warning}")
    if summary["publish"] or summary["update"]:
        print(
            "Revalidação do frontend: "
            + ("ok" if summary["revalidated"] else "não executada ou falhou")
        )
    print(f"Resumo: {summary['summary_path']}")
    return 0 if summary["errors"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
