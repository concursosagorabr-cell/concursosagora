from __future__ import annotations

import hashlib
import json
import logging
import re
from datetime import date, datetime, timedelta
from typing import Any
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup, Tag

from pipeline.models import Candidate, ExtractedArticle, SourceConfig
from pipeline.scrape import Scraper, domain_allowed
from pipeline.verification import build_fact_evidence
from pipeline.text import (
    business_day_for_dou,
    clean_whitespace,
    extract_banca,
    extract_city,
    extract_education_levels,
    extract_uf,
    normalize,
    parse_br_date,
    parse_iso_datetime,
    parse_money,
    previous_business_day,
    slugify,
)

log = logging.getLogger(__name__)


def _text(node: Tag | None) -> str:
    if node is None:
        return ""
    return clean_whitespace(node.get_text(" ", strip=True))


def _node_paragraphs(node: Tag | None) -> str:
    if node is None:
        return ""
    parts: list[str] = []
    for child in node.find_all(["h1", "h2", "h3", "h4", "p", "li", "blockquote"], recursive=True):
        value = clean_whitespace(child.get_text(" ", strip=True))
        if not value:
            continue
        if parts and (value == parts[-1] or value in parts[-1]):
            continue
        parts.append(value)
    if parts:
        return "\n\n".join(parts)
    return clean_whitespace(node.get_text("\n", strip=True))


def _meta(soup: BeautifulSoup, *, name: str | None = None, prop: str | None = None) -> str:
    attrs = {}
    if name:
        attrs["name"] = name
    if prop:
        attrs["property"] = prop
    node = soup.find("meta", attrs=attrs)
    return clean_whitespace(node.get("content", "")) if node else ""


def _json_ld(soup: BeautifulSoup) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = script.string or script.get_text()
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        items = data if isinstance(data, list) else data.get("@graph", [data])
        for item in items if isinstance(items, list) else [items]:
            if isinstance(item, dict):
                result.append(item)
    return result


def _article_type(item: dict[str, Any]) -> str:
    value = item.get("@type", "")
    if isinstance(value, list):
        return " ".join(str(x) for x in value)
    return str(value)


def _json_ld_article(soup: BeautifulSoup) -> dict[str, Any]:
    for item in _json_ld(soup):
        if any(tag in _article_type(item) for tag in ("Article", "NewsArticle", "BlogPosting")):
            return item
    return {}


def _first_image_from_json_ld(item: dict[str, Any]) -> str | None:
    image = item.get("image")
    if isinstance(image, str):
        return image
    if isinstance(image, list) and image:
        first = image[0]
        if isinstance(first, str):
            return first
        if isinstance(first, dict):
            return first.get("url")
    if isinstance(image, dict):
        return image.get("url")
    return None


def _hash_article(title: str, body: str) -> str:
    payload = f"{normalize(title)}\n{normalize(body)[:20000]}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _link_kwargs(source: SourceConfig) -> tuple[list[str], list[str]]:
    return (
        [normalize(x) for x in source.include_keywords if x],
        [normalize(x) for x in source.exclude_keywords if x],
    )


def _is_candidate_link(url: str, source: SourceConfig) -> bool:
    if not domain_allowed(url, source.allowed_domains):
        return False
    parsed = urlparse(url)
    relative = parsed.path + (("?" + parsed.query) if parsed.query else "")
    if source.link_pattern:
        try:
            if not re.search(source.link_pattern, parsed.path):
                return False
        except re.error:
            return False
    return bool(relative)


def _candidate_score(text: str, source: SourceConfig) -> float:
    normalized = normalize(text)
    include, _ = _link_kwargs(source)
    return float(sum(3 for keyword in include if keyword and keyword in normalized))


# ---------------------------------------------------------------------------
# Descoberta
# ---------------------------------------------------------------------------


def discover(
    scraper: Scraper,
    source: SourceConfig,
    limit: int = 10,
    dou_date: date | None = None,
) -> list[Candidate]:
    if source.type == "govbr_news":
        return _discover_govbr(scraper, source, limit)
    if source.type == "vunesp":
        return _discover_vunesp(scraper, source, limit)
    if source.type == "fgv":
        return _discover_fgv(scraper, source, limit)
    if source.type == "dou":
        return _discover_dou(scraper, source, limit, dou_date)
    raise ValueError(f"Tipo de fonte não suportado: {source.type}")


def _discover_govbr(scraper: Scraper, source: SourceConfig, limit: int) -> list[Candidate]:
    include, exclude = _link_kwargs(source)
    candidates: dict[str, Candidate] = {}
    for start_url in source.start_urls:
        page = scraper.fetch(start_url)
        for anchor in page.soup.find_all("a", href=True):
            href = (anchor.get("href") or "").strip()
            if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
                continue
            url = urljoin(page.url, href).split("#")[0]
            if not _is_candidate_link(url, source):
                continue
            text = _text(anchor)
            haystack = normalize(urlparse(url).path + " " + text)
            if exclude and any(keyword in haystack for keyword in exclude):
                continue
            if include and not any(keyword in haystack for keyword in include):
                continue
            if url in candidates:
                continue
            candidates[url] = Candidate(
                url=url,
                source_id=source.id,
                title=text or None,
                score=_candidate_score(haystack, source),
                metadata={"discovered_from": start_url},
            )
    ordered = sorted(candidates.values(), key=lambda item: (-item.score, item.url))
    return ordered[: max(0, limit)]


def _discover_vunesp(scraper: Scraper, source: SourceConfig, limit: int) -> list[Candidate]:
    if limit <= 0:
        return []
    listing_url = source.start_urls[0]
    page = scraper.fetch(listing_url)
    links: list[str] = []
    seen: set[str] = set()
    for anchor in page.soup.find_all("a", href=True):
        href = (anchor.get("href") or "").strip()
        url = urljoin(page.url, href).split("#")[0]
        if not _is_candidate_link(url, source):
            continue
        if url in seen:
            continue
        seen.add(url)
        links.append(url)

    max_details = min(source.max_candidates, max(limit * 4, 4))
    candidates: list[Candidate] = []
    preferred = [normalize(x) for x in source.preferred_keywords if x]
    for url in links[:max_details]:
        try:
            article = extract_article(scraper, source, Candidate(url=url, source_id=source.id))
        except Exception as exc:  # noqa: BLE001
            log.warning("Vunesp: não foi possível ler %s: %s", url, exc)
            continue
        title = article.title
        organ = str(article.facts.get("organ") or "")
        vacancies = int(article.facts.get("vacancies_total") or 0)
        haystack = normalize(title + " " + organ)
        score = sum(4 for word in preferred if word and word in haystack)
        if "publico" in haystack or "federal" in haystack:
            score += 3
        if vacancies:
            score += min(vacancies, 500) / 100
        if "vestibular" in haystack:
            score -= 5
        candidates.append(
            Candidate(
                url=url,
                source_id=source.id,
                title=title,
                summary=article.summary,
                score=score,
                metadata={"organ": organ, "vacancies": vacancies, "code": url.rstrip("/").split("/")[-1]},
            )
        )
    candidates.sort(key=lambda item: (-item.score, item.url))
    return candidates[:limit]


def _discover_fgv(scraper: Scraper, source: SourceConfig, limit: int) -> list[Candidate]:
    if limit <= 0:
        return []
    page = scraper.fetch(source.start_urls[0])
    container = page.soup.select_one(".view-concursos-em-andamento")
    if container is None:
        raise ValueError("Lista de concursos em andamento da FGV não encontrada.")
    preferred = [normalize(x) for x in source.preferred_keywords if x]
    candidates: list[Candidate] = []
    for row in container.select(".views-row"):
        anchor = row.select_one(".views-field-title a") or row.find("a", href=True)
        if anchor is None:
            continue
        href = (anchor.get("href") or "").strip()
        if not href:
            continue
        url = urljoin(page.url, href).split("#")[0]
        if not _is_candidate_link(url, source):
            continue
        path = urlparse(url).path.lower()
        if path.rstrip("/") in {"/concursos", "/concursos/nosso-portfolio"}:
            continue
        title = _text(anchor)
        row_text = _text(row)
        haystack = normalize(title + " " + row_text)
        score = sum(4 for word in preferred if word and word in haystack)
        if re.search(r"policia|tribunal|ministerio|prefeitura|universidade|federal|concurso publico", haystack):
            score += 3
        if "exame" in haystack and "concurso" not in haystack:
            score -= 3
        candidates.append(
            Candidate(
                url=url,
                source_id=source.id,
                title=title or None,
                score=score,
                metadata={"row_text": row_text[:500]},
            )
        )
    candidates.sort(key=lambda item: (-item.score, item.url))
    return candidates[:limit]


def _dou_date_from_arg(value: date | str | None) -> date:
    if isinstance(value, date):
        return value
    if value:
        parsed = parse_br_date(value)
        if parsed:
            return date.fromisoformat(parsed)
    return business_day_for_dou()


def _dou_candidate_score(item: dict[str, Any], source: SourceConfig) -> float:
    title = clean_whitespace(str(item.get("title") or ""))
    art_type = clean_whitespace(str(item.get("artType") or ""))
    content = clean_whitespace(str(item.get("content") or ""))
    hierarchy = clean_whitespace(str(item.get("hierarchyStr") or ""))
    head = normalize(title + " " + art_type)
    everything = normalize(" ".join([title, art_type, content, hierarchy]))
    include, exclude = _link_kwargs(source)
    if exclude and any(keyword in head for keyword in exclude):
        return 0.0
    if include and not any(keyword in everything for keyword in include):
        if not (re.search(r"\bconcurso\b", everything) and re.search(r"\bedital\b", head)):
            return 0.0
    score = 0.0
    if "concurso publico" in everything:
        score += 5
    if "processo seletivo" in everything:
        score += 4
    if re.search(r"provimento de vagas|preenchimento de vagas|\bvagas\b", everything):
        score += 3
    if re.search(r"abertura|inscricoes|inscricao", everything):
        score += 2
    if re.search(r"edital de concurso publico|edital de processo seletivo", head):
        score += 3
    if re.search(r"universidade|instituto federal|ministerio|tribunal|prefeitura|conselho", everything):
        score += 1
    if re.search(r"resultado final|homologacao|convocacao|retificacao|errata|prorrogacao", everything):
        score -= 5
    if re.search(r"sub judice|decisao judicial", everything):
        score -= 3
    return score


def _discover_dou(
    scraper: Scraper,
    source: SourceConfig,
    limit: int,
    dou_date: date | None,
) -> list[Candidate]:
    if limit <= 0:
        return []
    target_date = _dou_date_from_arg(dou_date)
    base_url = source.start_urls[0].rstrip("/")
    url = f"{base_url}?secao={source.section}&data={target_date.strftime('%d-%m-%Y')}"
    page = scraper.fetch(url)
    match = re.search(
        r'<script id="params" type="application/json">\s*(\{.*?\})\s*</script>',
        page.html,
        flags=re.S,
    )
    if not match:
        raise ValueError("Não foi possível localizar o JSON da edição do DOU.")
    payload = json.loads(match.group(1))
    items = payload.get("jsonArray") or []
    candidates: list[Candidate] = []
    for item in items:
        if not isinstance(item, dict) or not item.get("urlTitle"):
            continue
        score = _dou_candidate_score(item, source)
        if score <= 0:
            continue
        detail_url = "https://www.in.gov.br/web/dou/-/" + str(item["urlTitle"])
        candidates.append(
            Candidate(
                url=detail_url,
                source_id=source.id,
                title=clean_whitespace(str(item.get("title") or "")) or None,
                published_at=parse_iso_datetime(str(item.get("pubDate") or "")),
                summary=clean_whitespace(str(item.get("content") or ""))[:400] or None,
                score=score,
                metadata={
                    "list_item": item,
                    "edition_date": target_date.isoformat(),
                    "art_type": item.get("artType"),
                    "hierarchy": item.get("hierarchyStr"),
                },
            )
        )
    candidates.sort(key=lambda item: (-item.score, item.url))
    return candidates[:limit]


# ---------------------------------------------------------------------------
# Extração de artigo
# ---------------------------------------------------------------------------


def extract_article(scraper: Scraper, source: SourceConfig, candidate: Candidate) -> ExtractedArticle:
    if source.type == "govbr_news":
        article = _extract_govbr(scraper, source, candidate)
    elif source.type == "vunesp":
        article = _extract_vunesp(scraper, source, candidate)
    elif source.type == "fgv":
        article = _extract_fgv(scraper, source, candidate)
    elif source.type == "dou":
        article = _extract_dou(scraper, source, candidate)
    else:
        raise ValueError(f"Tipo de fonte nao suportado: {source.type}")
    article.source_tier = source.tier
    if not article.fact_evidence:
        build_fact_evidence(article)
    return article

def _extract_govbr(
    scraper: Scraper, source: SourceConfig, candidate: Candidate
) -> ExtractedArticle:
    page = scraper.fetch(candidate.url)
    soup = page.soup
    article = soup.find("article") or soup
    data = _json_ld_article(soup)

    title = ""
    if isinstance(article, Tag):
        title = _text(article.find("h1"))
    title = title or _text(soup.find("h1")) or clean_whitespace(str(data.get("headline") or ""))
    if not title:
        title = clean_whitespace(soup.title.get_text(" ", strip=True) if soup.title else "")

    summary_node = None
    if isinstance(article, Tag):
        summary_node = article.select_one(".documentDescription") or article.select_one(
            "[property='rnews:description']"
        )
    summary = _text(summary_node) or clean_whitespace(str(data.get("description") or ""))
    summary = summary or _meta(soup, name="description") or _meta(soup, prop="og:description")

    body_node = None
    if isinstance(article, Tag):
        body_node = (
            article.select_one("[property='rnews:articleBody']")
            or article.select_one("#parent-fieldname-text")
            or article
        )
    body = _node_paragraphs(body_node)
    body = _strip_noise(body)

    published = ""
    if isinstance(article, Tag):
        published = _text(article.select_one(".documentPublished .value"))
        if not published:
            published = _text(article.select_one(".documentByLine"))
    published = published or str(data.get("datePublished") or "")
    published_at = parse_iso_datetime(published)

    image_url = ""
    image_alt = ""
    if isinstance(article, Tag):
        image = article.select_one("#media img") or article.select_one("img")
        if image:
            image_url = image.get("src") or ""
            image_alt = clean_whitespace(image.get("alt") or "")
    if not image_url:
        image_url = _first_image_from_json_ld(data) or _meta(soup, prop="og:image")
    if image_url:
        image_url = urljoin(page.url, image_url)

    organ = source.default_organ or _guess_organ(title + " " + summary, page.text)
    facts = extract_facts(
        title=title,
        text="\n\n".join([summary, body]),
        organ_hint=organ,
        source_id=source.id,
        default_sphere=source.default_sphere,
    )
    return ExtractedArticle(
        source_id=source.id,
        source_name=source.name,
        url=candidate.url,
        canonical_url=page.url,
        title=title,
        published_at=published_at,
        summary=summary,
        body_text=body,
        image_url=image_url or None,
        image_alt=image_alt or None,
        facts=facts,
        text_hash=_hash_article(title, body),
        fetched_at=page.fetched_at,
        metadata={"type": "govbr_news"},
    )


def _extract_vunesp(
    scraper: Scraper, source: SourceConfig, candidate: Candidate
) -> ExtractedArticle:
    page = scraper.fetch(candidate.url)
    soup = page.soup
    art = soup.select_one("article.concurso") or soup

    page_title = clean_whitespace(soup.title.get_text(" ", strip=True) if soup.title else "")
    left, organ = page_title, ""
    if "|" in page_title:
        parts = [clean_whitespace(x) for x in page_title.split("|") if clean_whitespace(x)]
        if parts:
            left = parts[0]
            organ = parts[-1] if len(parts) > 1 else ""

    h3 = _text(art.select_one("h3.course-title")) if isinstance(art, Tag) else ""
    h3 = re.sub(r"^Concurso\s*\|\s*", "", h3, flags=re.I).strip()
    title = h3 or left

    info = _text(art.select_one(".course-informations")) if isinstance(art, Tag) else ""
    description = ""
    if isinstance(art, Tag):
        description = _node_paragraphs(art.select_one(".course-description"))
    body = "\n\n".join(part for part in (info, description) if part)
    summary = description[:300].strip() if description else info

    image_url = _meta(soup, prop="og:image") or _meta(soup, name="twitter:image")
    if image_url:
        image_url = urljoin(page.url, image_url)

    facts = extract_facts(
        title=title + " " + page_title,
        text=body,
        organ_hint=organ or None,
        source_id=source.id,
        default_sphere=None,
    )
    facts["banca"] = facts.get("banca") or "Vunesp"
    vacancies = _first_int(r"vagas?\s*:\s*(\d[\d\.]*)", info)
    if vacancies is not None:
        facts["vacancies_total"] = vacancies
    _apply_vunesp_dates(art, facts)

    if facts.get("vacancies_total") and facts.get("enrollment_end_date"):
        try:
            end = date.fromisoformat(str(facts["enrollment_end_date"]))
            facts["status"] = "aberto" if end >= date.today() else "em_andamento"
        except ValueError:
            pass

    return ExtractedArticle(
        source_id=source.id,
        source_name=source.name,
        url=candidate.url,
        canonical_url=page.url,
        title=title,
        published_at=None,
        summary=summary,
        body_text=body,
        image_url=image_url or None,
        image_alt=None,
        facts=facts,
        text_hash=_hash_article(title, body),
        fetched_at=page.fetched_at,
        metadata={
            "type": "vunesp",
            "code": urlparse(page.url).path.rstrip("/").split("/")[-1],
            "info": info,
            "page_title": page_title,
        },
    )


def _extract_fgv(
    scraper: Scraper, source: SourceConfig, candidate: Candidate
) -> ExtractedArticle:
    page = scraper.fetch(candidate.url)
    soup = page.soup
    main = soup.select_one("main") or soup.select_one(".region-content") or soup
    page_title = clean_whitespace(soup.title.get_text(" ", strip=True) if soup.title else "")
    title = _text(soup.find("h1")) or candidate.title or page_title.split("|")[0].strip()
    summary = _meta(soup, name="description") or _meta(soup, prop="og:description")

    raw_main = clean_whitespace(main.get_text("\n", strip=True))
    if title and title in raw_main:
        raw_main = raw_main[raw_main.find(title) + len(title) :]
    raw_main = re.split(r"Arquivos do concurso", raw_main, maxsplit=1, flags=re.I)[0]
    body = clean_whitespace(raw_main)
    body = _strip_noise(body)
    # Mantém um resumo das atualizações recentes sem baixar PDFs nem listar dezenas de arquivos.
    updates: list[str] = []
    for anchor in main.find_all("a", href=True):
        label = _text(anchor)
        href = str(anchor.get("href") or "")
        if len(label) < 8 or label in updates:
            continue
        if ".pdf" in href.lower() or "portal.conhecimento.fgv.br" in href:
            updates.append(label)
    if updates:
        body += "\n\nÚltimas atualizações divulgadas no portal:\n" + "\n".join(
            f"- {label}" for label in updates[:8]
        )
    if not summary:
        summary = body[:400]

    organ = _fgv_organ_from_title(title, page_title)
    facts = extract_facts(
        title=title + " " + page_title,
        text=summary + "\n\n" + body,
        organ_hint=organ,
        source_id=source.id,
        default_sphere=None,
    )
    facts["banca"] = "FGV"
    page_normalized = normalize(page_title + " " + body)
    if "inscricoes abertas" in page_normalized:
        facts["status"] = "aberto"
    elif re.search(r"gabarito|prova objetiva|resultado|em andamento", page_normalized):
        facts["status"] = "em_andamento"
    elif "encerrado" in page_normalized:
        facts["status"] = "encerrado"
    if "nacional unificado" in normalize(title):
        facts["organ"] = "Ministério da Gestão e da Inovação em Serviços Públicos (MGI)"
        facts["sphere"] = "FEDERAL"
        facts["state_uf"] = "Nacional"
    if not facts.get("state_uf") and facts.get("sphere") in {"FEDERAL", "NACIONAL"}:
        facts["state_uf"] = "Nacional"

    image_url = _meta(soup, prop="og:image") or _meta(soup, name="twitter:image")
    if image_url:
        image_url = urljoin(page.url, image_url)
    published = _meta(soup, prop="article:published_time") or _meta(soup, prop="article:modified_time")
    if not published:
        time_node = soup.find("time", attrs={"datetime": True})
        published = time_node.get("datetime", "") if time_node else ""
    return ExtractedArticle(
        source_id=source.id,
        source_name=source.name,
        url=candidate.url,
        canonical_url=page.url,
        title=title,
        published_at=parse_iso_datetime(published),
        summary=summary,
        body_text=body,
        image_url=image_url or None,
        image_alt=None,
        facts=facts,
        text_hash=_hash_article(title, body),
        fetched_at=page.fetched_at,
        metadata={"type": "fgv", "page_title": page_title},
    )


def _fgv_organ_from_title(title: str, page_title: str) -> str | None:
    text = clean_whitespace(title or page_title)
    if "nacional unificado" in normalize(text):
        return "Ministério da Gestão e da Inovação em Serviços Públicos (MGI)"
    match = re.search(
        r"(?:Concurso Público|Processo Seletivo)(?:\s+de\s+Residência)?\s+(?:para|da|do|de)\s+(.+)$",
        text,
        flags=re.I,
    )
    if not match:
        return None
    organ = match.group(1)
    organ = re.sub(r"\s*\((?:19|20)\d{2}\)\s*$", "", organ)
    organ = re.sub(r"\s+\b(?:19|20)\d{2}\b\s*$", "", organ)
    organ = re.split(
        r"\s+-\s+(?:Juiz|Guarda|Analista|Professor|Papiloscopista|Delegado|Agente|INB\b)",
        organ,
        maxsplit=1,
        flags=re.I,
    )[0]
    organ = re.sub(r"^(?:a|o|as|os)\s+", "", organ, flags=re.I).strip(" .-")
    return organ[:180] or None


def _extract_dou(
    scraper: Scraper, source: SourceConfig, candidate: Candidate
) -> ExtractedArticle:
    page = scraper.fetch(candidate.url)
    soup = page.soup
    item = candidate.metadata.get("list_item") or {}
    texto = soup.select_one(".texto-dou") or soup.select_one("article#materia")
    if texto is None:
        raise ValueError(f"Conteúdo do DOU não encontrado em {candidate.url}")

    identifica = [
        clean_whitespace(node.get_text(" ", strip=True))
        for node in soup.select(".texto-dou .identifica")
        if clean_whitespace(node.get_text(" ", strip=True))
    ]
    item_title = clean_whitespace(str(item.get("title") or candidate.title or ""))
    title = identifica[0] if identifica else item_title
    if len(title) < 8 and item_title:
        title = item_title
    if len(title) < 8:
        heading = soup.select_one("h2")
        title = _text(heading) or title
    summary = ""
    first_par = soup.select_one(".texto-dou .dou-paragraph")
    if first_par:
        summary = _text(first_par)
    summary = summary or clean_whitespace(str(item.get("content") or ""))[:300]
    body = texto.get_text("\n", strip=True)
    body = clean_whitespace(body)
    body = _strip_noise(body)

    header_text = ""
    header = soup.select_one("article#materia")
    if header:
        header_text = clean_whitespace(header.get_text(" ", strip=True))
    published_match = re.search(r"Publicado em:\s*(\d{2}/\d{2}/\d{4})", header_text)
    published_raw = published_match.group(1) if published_match else str(item.get("pubDate") or "")
    published_at = parse_iso_datetime(published_raw)

    organ_match = re.search(r"Órgão:\s*(.*?)(?:EDITAL|AVISO|PORTARIA|RESOLUÇÃO|DECRETO|$)", header_text)
    organ = clean_whitespace(organ_match.group(1)) if organ_match else ""
    hierarchy = clean_whitespace(str(item.get("hierarchyStr") or ""))
    if not organ and hierarchy:
        organ = clean_whitespace(hierarchy.split("/")[-1])
    art_type = clean_whitespace(str(item.get("artType") or candidate.metadata.get("art_type") or ""))
    facts = extract_facts(
        title=title + " " + hierarchy,
        text=body,
        organ_hint=organ or None,
        source_id=source.id,
        default_sphere=source.default_sphere,
    )
    facts["art_type"] = art_type
    facts["hierarchy"] = hierarchy

    return ExtractedArticle(
        source_id=source.id,
        source_name=source.name,
        url=candidate.url,
        canonical_url=page.url,
        title=title,
        published_at=published_at,
        summary=summary,
        body_text=body,
        image_url=None,
        image_alt=None,
        facts=facts,
        text_hash=_hash_article(title, body),
        fetched_at=page.fetched_at,
        metadata={
            "type": "dou",
            "art_type": art_type,
            "hierarchy": hierarchy,
            "edition_date": candidate.metadata.get("edition_date"),
            "header": header_text[:1000],
        },
    )


def _strip_noise(text: str) -> str:
    lines = []
    for line in clean_whitespace(text).split("\n"):
        stripped = line.strip()
        if not stripped:
            continue
        if re.fullmatch(r"(Compartilhe|Compartilhe por.*|Categoria|Publicado em.*|ASCOM|Ascom)", stripped, flags=re.I):
            continue
        lines.append(stripped)
    return "\n\n".join(lines)


def _guess_organ(text: str, page_text: str) -> str | None:
    haystack = f"{text} {page_text[:3000]}"
    patterns = [
        r"Instituto Nacional do Seguro Social \(INSS\)",
        r"Universidade Federal [A-ZÀ-Ú][\wÀ-ú ]+",
        r"Instituto Federal [A-ZÀ-Ú][\wÀ-ú ]+",
        r"Ministério [A-ZÀ-Ú][\wÀ-ú ]+",
        r"Tribunal [A-ZÀ-Ú][\wÀ-ú ]+",
        r"Prefeitura (?:Municipal )?de [A-ZÀ-Ú][\wÀ-ú ]+",
    ]
    for pattern in patterns:
        match = re.search(pattern, haystack, flags=re.I)
        if match:
            return clean_whitespace(match.group(0))
    return None


def _first_int(pattern: str, text: str) -> int | None:
    match = re.search(pattern, text or "", flags=re.I)
    if not match:
        return None
    try:
        return int(re.sub(r"[^\d]", "", match.group(1)))
    except (TypeError, ValueError):
        return None


def _apply_vunesp_dates(art: Tag | BeautifulSoup, facts: dict[str, Any]) -> None:
    if not isinstance(art, Tag):
        return
    start_node = art.select_one(".course-informations .apply.from")
    end_node = art.select_one(".course-informations .apply.to")
    start = _day_month_to_iso(_text(start_node))
    end = _day_month_to_iso(_text(end_node))
    if start:
        facts["enrollment_start_date"] = start
    if end:
        facts["enrollment_end_date"] = end


def _day_month_to_iso(value: str) -> str | None:
    match = re.search(r"\b(\d{1,2})/(\d{1,2})\b", value or "")
    if not match:
        return None
    day, month = int(match.group(1)), int(match.group(2))
    today = date.today()
    year = today.year
    try:
        candidate = date(year, month, day)
    except ValueError:
        return None
    # Se a data já passou há muito tempo, provavelmente é do próximo ciclo.
    if candidate < today - timedelta(days=180):
        try:
            candidate = date(year + 1, month, day)
        except ValueError:
            return None
    return candidate.isoformat()


# ---------------------------------------------------------------------------
# Extração determinística de fatos
# ---------------------------------------------------------------------------


def extract_facts(
    *,
    title: str,
    text: str,
    organ_hint: str | None = None,
    source_id: str | None = None,
    default_sphere: str | None = None,
) -> dict[str, Any]:
    full = clean_whitespace("\n".join([title or "", text or ""]))
    normalized = normalize(full)
    facts: dict[str, Any] = {}

    if organ_hint:
        facts["organ"] = clean_whitespace(organ_hint)

    vacancies = _extract_vacancies(full, normalized)
    if vacancies is not None:
        facts["vacancies_total"] = vacancies

    salaries = _extract_salary_values(full)
    if salaries:
        facts["salary_min"] = min(salaries)
        facts["salary_max"] = max(salaries)

    fee = _extract_fee(full)
    if fee is not None:
        facts["registration_fee"] = fee

    _extract_dates(full, facts)
    _extract_status(normalized, facts, source_id)
    education = extract_education_levels(full)
    if education:
        facts["education_level"] = education
    banca = extract_banca(full)
    if banca:
        facts["banca"] = banca

    sphere = _infer_sphere(full, default_sphere)
    if sphere:
        facts["sphere"] = sphere
    uf = extract_uf(" ".join([organ_hint or "", full]))
    if not uf and sphere in {"FEDERAL", "NACIONAL"}:
        uf = "Nacional"
    if uf:
        facts["state_uf"] = uf
    city = extract_city(" ".join([organ_hint or "", full]))
    if city:
        facts["city_name"] = city

    if re.search(r"isencao|isenção", normalized):
        facts["has_exemption"] = True
    if (
        "cadastro de reserva" in normalized
        and not facts.get("vacancies_total")
        and not re.search(r"vagas efetivas|preenchimento de vagas|numero de vagas|numero de vagas", normalized)
    ):
        facts["is_cr_only"] = True
    return facts


def _extract_vacancies(full: str, normalized: str) -> int | None:
    values: list[int] = []
    fillers = {
        "novas",
        "novos",
        "de",
        "para",
        "com",
        "sao",
        "serao",
        "mil",
        "e",
        "ou",
        "remanescentes",
        "adicionais",
        "abertas",
    }
    for match in re.finditer(
        r"\b(\d{1,3}(?:\.\d{3})*|\d+)\s+((?:[a-z]+\s+){0,3})(vagas|postos|oportunidades)\b",
        normalized,
    ):
        between = match.group(2).split()
        if any(word not in fillers for word in between):
            continue
        raw = match.group(1).replace(".", "")
        try:
            value = int(raw)
        except ValueError:
            continue
        if "mil" in between and value < 1000:
            value *= 1000
        if 1 <= value <= 100000:
            values.append(value)
    for match in re.finditer(r"\bvagas?\s*:?\s*(\d{1,3}(?:\.\d{3})*|\d+)\b", normalized):
        try:
            value = int(match.group(1).replace(".", ""))
        except ValueError:
            continue
        if 1 <= value <= 100000:
            values.append(value)
    if not values:
        return None
    # O total costuma ser o maior número citado; evita "20 mil vagas" de atendimento
    # porque as fontes já passam por filtro editorial.
    return max(values)


def _extract_salary_values(full: str) -> list[float]:
    values: list[float] = []
    for match in re.finditer(r"R\$\s*([\d.]+,\d{2})", full):
        context = normalize(full[max(0, match.start() - 140) : match.end() + 80])
        if not re.search(r"salario|remuneracao|vencimento|subsidio|remuneratorio|ganho", context):
            continue
        value = parse_money(match.group(1))
        if value and 100 <= value <= 200000:
            values.append(value)
    return sorted(set(values))


def _extract_fee(full: str) -> float | None:
    for match in re.finditer(r"R\$\s*([\d.]+,\d{2})", full):
        context = normalize(full[max(0, match.start() - 140) : match.end() + 80])
        if "taxa de inscricao" in context or "taxa" in context and "inscricao" in context:
            value = parse_money(match.group(1))
            if value and 0 < value <= 5000:
                return value
    return None


def _extract_dates(full: str, facts: dict[str, Any]) -> None:
    found: list[tuple[str, str]] = []
    for match in re.finditer(r"\b\d{1,2}/\d{1,2}/\d{2,4}\b", full):
        parsed = parse_br_date(match.group(0))
        if parsed:
            found.append((parsed, normalize(full[max(0, match.start() - 150) : match.end() + 120])))
    for match in re.finditer(
        r"\b\d{1,2}\s+de\s+[a-zçãéíóúâêôà]+\s+de\s+\d{4}\b", full, flags=re.I
    ):
        parsed = parse_br_date(match.group(0))
        if parsed:
            found.append((parsed, normalize(full[max(0, match.start() - 150) : match.end() + 120])))

    enroll: list[str] = []
    exams: list[str] = []
    for parsed, context in found:
        if "inscri" in context or "prazo" in context:
            enroll.append(parsed)
        elif "prova" in context or "avaliacao" in context:
            exams.append(parsed)
    if enroll:
        unique = sorted(set(enroll))
        if len(unique) == 1:
            facts["enrollment_end_date"] = unique[0]
        else:
            facts["enrollment_start_date"] = unique[0]
            facts["enrollment_end_date"] = unique[-1]
    if exams:
        facts["exam_date"] = sorted(set(exams))[0]


def _extract_status(normalized: str, facts: dict[str, Any], source_id: str | None) -> None:
    end = facts.get("enrollment_end_date")
    end_date = date.fromisoformat(end) if isinstance(end, str) else None
    has_open = bool(
        re.search(r"inscricoes abertas|inscricao aberta|abertura das inscricoes|periodo de inscricoes", normalized)
    )
    has_closed = bool(re.search(r"resultado final|homologacao|homologado|encerrado|gabarito definitivo", normalized))
    has_ongoing = bool(re.search(r"provas aplicadas|em andamento|andamento do concurso", normalized))
    has_planned = bool(re.search(r"autoriz|comissao|previsto|aguardando|estudos", normalized))

    if has_open or (end_date and end_date >= date.today() and not has_closed):
        facts["status"] = "aberto"
    elif has_closed:
        facts["status"] = "encerrado"
    elif has_ongoing:
        facts["status"] = "em_andamento"
    elif has_planned:
        facts["status"] = "previsto"
    elif source_id == "dou" and re.search(r"edital|abertura", normalized):
        facts["status"] = "aberto"
    else:
        facts["status"] = "previsto"


def _infer_sphere(text: str, default: str | None = None) -> str | None:
    normalized = normalize(text)
    if re.search(r"prefeitura|camara municipal|municipio de|municipal", normalized):
        return "MUNICIPAL"
    if re.search(r"governo do estado|secretaria de estado|estado (?:de|do|da)|estadual|policia civil", normalized):
        return "ESTADUAL"
    if re.search(r"distrito federal|\bgdf\b", normalized):
        return "DISTRITAL"
    if re.search(
        r"ministerio|universidade federal|instituto federal|autarquia federal|concurso publico nacional|"
        r"servico publico federal|\binss\b|\bpf\b|\bprf\b|federal|industrias nucleares|\binb\b|"
        r"nacional unificado|\bcpnu\b",
        normalized,
    ):
        return "FEDERAL"
    return default


def infer_source_from_url(url: str) -> str | None:
    parsed = urlparse(url)
    netloc = parsed.netloc.lower()
    path = parsed.path.lower()
    if "vunesp.com.br" in netloc:
        return "vunesp"
    if "conhecimento.fgv.br" in netloc:
        return "fgv"
    if "in.gov.br" in netloc or "/web/dou/-" in path:
        return "dou"
    if "gov.br" in netloc and "/inss/" in path:
        return "inss"
    return None


def parse_dou_date_arg(value: str | None) -> date | None:
    if not value:
        return None
    parsed = parse_br_date(value)
    if not parsed:
        raise ValueError("Data inválida. Use DD-MM-AAAA ou DD/MM/AAAA.")
    return date.fromisoformat(parsed)