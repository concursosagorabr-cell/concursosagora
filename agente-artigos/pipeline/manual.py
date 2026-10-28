from __future__ import annotations

import hashlib
import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

from pipeline.config import Settings, load_settings
from pipeline.dedupe import (
    contest_key_from_url,
    find_duplicate,
    normalize_slug_candidate,
    normalize_url,
)
from pipeline.editorial import finalize_generated_article
from pipeline.models import ExtractedArticle, GeneratedArticle
from pipeline.runner import _build_document
from pipeline.sanity import SanityClient, SanityContext
from pipeline.text import clean_whitespace
from pipeline.verification import CRITICAL_FACTS

log = logging.getLogger(__name__)

OFFICIAL_HOST_SUFFIXES = (
    ".gov.br",
    "fgv.br",
    "vunesp.com.br",
    "cebraspe.org.br",
    ".jus.br",
    ".leg.br",
    ".mp.br",
)
VALID_PHASES = {
    "aguardando_autorizacao",
    "autorizado",
    "comissao_formada",
    "edital_publicado",
    "inscricoes_abertas",
    "provas_aplicadas",
    "resultado_publicado",
    "encerrado",
}


class ManualError(RuntimeError):
    pass


@dataclass
class ManualItemResult:
    index: int
    title: str = ""
    slug: str = ""
    status: str = "error"
    message: str = ""
    sanity_id: str | None = None
    contest_key: str = ""
    source_url: str = ""
    source_urls: list[str] = field(default_factory=list)
    score: int | None = None
    word_count: int | None = None
    verification_score: int | None = None
    warnings: list[str] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return {
            "index": self.index,
            "title": self.title,
            "slug": self.slug,
            "status": self.status,
            "message": self.message,
            "sanity_id": self.sanity_id,
            "contest_key": self.contest_key,
            "source_url": self.source_url,
            "source_urls": self.source_urls,
            "score": self.score,
            "word_count": self.word_count,
            "verification_score": self.verification_score,
            "warnings": self.warnings,
        }


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _is_official_url(url: str) -> bool:
    host = (urlsplit(normalize_url(url)).hostname or "").lower()
    return any(host == suffix.lstrip(".") or host.endswith(suffix) for suffix in OFFICIAL_HOST_SUFFIXES)


def _quote_present(quote: str, source_text: str) -> bool:
    needle = clean_whitespace(quote).casefold()
    haystack = clean_whitespace(source_text).casefold()
    return bool(needle) and needle in haystack


def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _build_evidence_report(
    article: ExtractedArticle,
    evidence: dict[str, Any],
) -> dict[str, Any]:
    """Monta a ficha de evidências a partir de trechos literais fornecidos.

    Diferente da extração automática, aqui a origem do trecho é declarada pelo
    autor e conferida literalmente contra o texto-fonte do bundle. Uma citação
    que não exista no texto-fonte interrompe o item.
    """
    source_url = str(article.metadata.get("evidence_url") or article.url)
    source_title = str(article.metadata.get("evidence_title") or article.title)
    facts_report: dict[str, Any] = {}
    missing: list[str] = []
    critical_missing: list[str] = []
    supported = 0

    for key, value in article.facts.items():
        if value in (None, "", []):
            continue
        # Um booleano falso não é um fato a provar: a ausência do campo já
        # representa "não" e evita exigir uma citação negativa da fonte.
        if value is False and key in {"is_cr_only", "has_exemption"}:
            continue
        raw_quote = evidence.get(key)
        quotes: list[str] = []
        if isinstance(raw_quote, str):
            quotes = [raw_quote]
        elif isinstance(raw_quote, list):
            quotes = [str(item) for item in raw_quote if item]
        items: list[dict[str, Any]] = []
        for quote in quotes:
            if not _quote_present(quote, article.full_text):
                raise ManualError(
                    f"evidência de '{key}' não aparece literalmente no texto-fonte: {quote[:120]!r}"
                )
            items.append(
                {
                    "quote": clean_whitespace(quote)[:600],
                    "method": "manual_literal",
                    "confidence": 97,
                    "sourceUrl": source_url,
                    "sourceTitle": source_title,
                }
            )
        if items:
            status = "supported"
            confidence = max(int(item["confidence"]) for item in items)
            supported += 1
        elif key == "sphere":
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
        "checkedAt": _now(),
        "method": "manual_literal_editorial_v1",
        "sourceUrl": source_url,
        "sourceTitle": source_title,
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


def build_article(item: dict[str, Any]) -> ExtractedArticle:
    source = dict(item.get("source") or {})
    facts = dict(item.get("facts") or {})
    url = str(source.get("url") or "").strip()
    canonical = str(source.get("canonical_url") or url).strip()
    text = str(source.get("source_text") or item.get("source_text") or "").strip()
    if not text:
        raise ManualError("campo 'source.source_text' é obrigatório")
    if not url or not normalize_url(url):
        raise ManualError("campo 'source.url' é obrigatório e deve ser uma URL válida")
    if not _is_official_url(url):
        raise ManualError(f"fonte não oficial: {url}")
    if len(text) < 250:
        raise ManualError("texto-fonte muito curto para sustentar a matéria (mínimo 250 caracteres)")
    title = str(source.get("title") or item.get("title") or "").strip()
    if len(title) < 8:
        raise ManualError("campo 'source.title' ausente ou curto")
    article = ExtractedArticle(
        source_id=str(source.get("id") or "manual"),
        source_name=str(source.get("name") or "Fonte oficial"),
        url=url,
        canonical_url=canonical or url,
        title=title,
        published_at=source.get("published_at"),
        summary=str(source.get("summary") or ""),
        body_text=text,
        image_url=None,
        image_alt=None,
        facts=facts,
        text_hash=_sha256(clean_whitespace(text).casefold()),
        fetched_at=_now(),
        metadata={
            "page_title": title,
            "evidence_url": source.get("evidence_url") or url,
            "evidence_title": source.get("evidence_title") or title,
            "manual": True,
        },
        source_tier=str(source.get("tier") or "official_primary"),
        verification={},
    )
    _build_evidence_report(article, dict(item.get("evidence") or {}))
    return article


def _document_sources(item: dict[str, Any], article: ExtractedArticle) -> list[dict[str, Any]]:
    now = _now()
    declared = item.get("sources")
    raw_sources: list[dict[str, Any]]
    if isinstance(declared, list) and declared:
        raw_sources = [dict(source) for source in declared if isinstance(source, dict)]
    else:
        raw_sources = [
            {
                "title": f"{article.source_name}: {article.title}",
                "url": article.url,
                "kind": article.source_tier,
                "usage": "facts",
                "evidence": next(
                    (
                        items[0]["quote"]
                        for items in article.fact_evidence.values()
                        if items
                    ),
                    "",
                ),
            }
        ]
    sources: list[dict[str, Any]] = []
    for index, source in enumerate(raw_sources):
        url = str(source.get("url") or "").strip()
        if not url or not normalize_url(url):
            raise ManualError(f"URL de fonte inválida no item: {url!r}")
        if not _is_official_url(url):
            raise ManualError(f"fonte não oficial no bundle: {url}")
        kind = str(source.get("kind") or "official_primary")
        if kind not in {"official_primary", "official_secondary"}:
            raise ManualError(f"kind de fonte não oficial: {kind}")
        sources.append(
            {
                "_type": "sourceReference",
                "_key": f"src-{index}",
                "title": str(source.get("title") or article.title)[:200],
                "url": url,
                "type": "official",
                "kind": kind,
                "usage": str(source.get("usage") or "facts"),
                "evidence": (str(source.get("evidence") or "").strip()[:600] or None),
                "checkedAt": now,
            }
        )
    return sources


def _bundle_sources(item: dict[str, Any], article: ExtractedArticle) -> list[str]:
    return [source["url"] for source in _document_sources(item, article)]


def process_item(
    item: dict[str, Any],
    index: int,
    settings: Settings,
    sanity: SanityClient,
    context: SanityContext,
    run_id: str,
    *,
    apply: bool,
    used_image_refs: set[str],
) -> tuple[ManualItemResult, dict[str, Any] | None]:
    result = ManualItemResult(index=index)
    article = build_article(item)
    result.title = str((item.get("article") or {}).get("title") or article.title)
    result.source_url = article.url
    result.contest_key = str(item.get("contest_key") or contest_key_from_url(article.url)).strip().lower()
    if not result.contest_key:
        raise ManualError(
            "não foi possível determinar contest_key; informe o campo no bundle"
        )

    data = dict(item.get("article") or {})
    if not data:
        raise ManualError("campo 'article' é obrigatório")
    raw_categories = data.get("category_slugs")
    if not isinstance(raw_categories, list) or not raw_categories:
        raise ManualError("campo 'article.category_slugs' é obrigatório e deve ser uma lista")
    declared_categories: list[str] = []
    for raw_category in raw_categories:
        category = context.category_by_slug(str(raw_category))
        if not category or not category.get("slug"):
            raise ManualError(f"categoria inexistente no Sanity: {raw_category!r}")
        declared_categories.append(str(category["slug"]))
    data["category_slugs"] = declared_categories
    generated: GeneratedArticle = finalize_generated_article(
        data,
        article,
        settings,
        context.category_slugs,
        usage={"mode": "manual"},
        model="manual-editorial",
    )
    result.score = generated.score
    result.word_count = generated.body_word_count
    result.verification_score = int(generated.verification.get("score") or 0)
    result.warnings = list(generated.warnings)

    if generated.score < settings.fact_check_min_score:
        raise ManualError(
            f"fact-check {generated.score}/100 abaixo do mínimo {settings.fact_check_min_score}: "
            + "; ".join(generated.warnings[:5])
        )
    if generated.blocking:
        raise ManualError("verificação bloqueou: " + "; ".join(generated.blocking[:5]))
    if not generated.verification.get("ready"):
        raise ManualError(
            "verificação não liberou o rascunho: "
            + "; ".join(generated.blocking or generated.verification.get("warnings") or ["evidência insuficiente"])
        )
    if generated.body_word_count < settings.min_content_words:
        raise ManualError(
            f"corpo com {generated.body_word_count} palavras; mínimo {settings.min_content_words}"
        )

    slang = normalize_slug_candidate(generated.slug, context.existing_slugs)
    result.slug = slang
    sources = _bundle_sources(item, article)
    result.source_urls = sources
    duplicate, reason, matched = find_duplicate(
        context.posts,
        article,
        generated.title,
        slang,
        contest_key=result.contest_key,
        cooldown_days=settings.contest_cooldown_days,
        extra_urls=sources,
    )
    if duplicate:
        raise ManualError(
            f"duplicado: {reason}"
            + (f" ({matched.get('_id')})" if matched and matched.get("_id") else "")
        )

    document = _build_document(
        settings,
        sanity,
        context,
        None,
        article,
        generated,
        run_id,
        allow_uploads=False,
        used_image_refs=used_image_refs,
        contest_key=result.contest_key,
        requested_categories=declared_categories,
    )
    document["_id"] = f"drafts.{slang}"
    document["slug"] = {"_type": "slug", "current": slang}
    document["sourceUrls"] = _document_sources(item, article)
    document["publishedAt"] = _now()
    document["contestKey"] = result.contest_key
    document["reviewStatus"] = "pending"
    document["aiAssisted"] = True
    phase = str(item.get("contest_phase") or "").strip()
    if phase:
        if phase not in VALID_PHASES:
            raise ManualError(f"contest_phase inválido: {phase}")
        document["contestStatus"] = phase

    if apply:
        response = sanity.create_draft(document)
        result.sanity_id = str(response.get("id") or document["_id"])
        result.status = "created"
        result.message = "rascunho criado no Sanity com reviewStatus=pending"
        context.posts.append(
            {
                "_id": result.sanity_id,
                "title": document.get("title"),
                "slug": slang,
                "contentHash": document.get("contentHash"),
                "sourceUrls": document.get("sourceUrls"),
                "contestKey": result.contest_key,
                "publishedAt": document.get("publishedAt"),
                "reviewStatus": "pending",
                "status": document.get("status"),
            }
        )
    else:
        result.status = "dry_run"
        result.message = (
            f"validado: {generated.body_word_count} palavras, fact-check {generated.score}/100, "
            f"verificação {generated.verification.get('score')}/100; nada gravado"
        )
        context.posts.append(
            {
                "_id": document["_id"],
                "title": document.get("title"),
                "slug": slang,
                "contentHash": document.get("contentHash"),
                "sourceUrls": document.get("sourceUrls"),
                "contestKey": result.contest_key,
                "publishedAt": document.get("publishedAt"),
                "reviewStatus": "pending",
                "status": document.get("status"),
            }
        )
    return result, document


def run_bundle(
    bundle_path: Path | str,
    *,
    apply: bool = False,
    settings: Settings | None = None,
) -> dict[str, Any]:
    settings = settings or load_settings()
    settings.validate_sanity()
    path = Path(bundle_path).expanduser()
    if not path.exists():
        raise ManualError(f"bundle não encontrado: {path}")
    bundle = json.loads(path.read_text(encoding="utf-8"))
    items = bundle.get("articles")
    if not isinstance(items, list) or not items:
        raise ManualError("o bundle precisa conter uma lista 'articles' não vazia")
    run_id = str(bundle.get("run_id") or f"manual-{datetime.now(timezone.utc):%Y%m%d-%H%M%S}")
    sanity = SanityClient(settings)
    context = sanity.get_context()
    used_image_refs: set[str] = set()
    results: list[ManualItemResult] = []
    documents: list[dict[str, Any]] = []

    for index, item in enumerate(items, 1):
        if not isinstance(item, dict):
            results.append(ManualItemResult(index=index, status="error", message="item inválido"))
            continue
        try:
            result, document = process_item(
                item,
                index,
                settings,
                sanity,
                context,
                run_id,
                apply=apply,
                used_image_refs=used_image_refs,
            )
            results.append(result)
            if document:
                documents.append(document)
        except Exception as exc:  # noqa: BLE001
            log.exception("Falha no item %s do bundle manual", index)
            results.append(
                ManualItemResult(
                    index=index,
                    title=str((item.get("article") or {}).get("title") or "")[:160],
                    status="error",
                    message=str(exc)[:1200],
                )
            )

    created = sum(1 for item in results if item.status == "created")
    dry_run = sum(1 for item in results if item.status == "dry_run")
    errors = sum(1 for item in results if item.status == "error")
    summary = {
        "run_id": run_id,
        "apply": apply,
        "bundle": str(path.resolve()),
        "total": len(results),
        "created": created,
        "dry_run": dry_run,
        "errors": errors,
        "cooldown_days": settings.contest_cooldown_days,
        "items": [item.as_dict() for item in results],
        "documents": [
            {
                "_id": document.get("_id"),
                "title": document.get("title"),
                "slug": (document.get("slug") or {}).get("current"),
                "contestKey": document.get("contestKey"),
                "sourceUrls": [source.get("url") for source in document.get("sourceUrls") or []],
            }
            for document in documents
        ],
    }
    mode = "apply" if apply else "dry-run"
    summary_path = settings.data_dir / "manual_runs" / f"{run_id}-{mode}.json"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2, default=str),
        encoding="utf-8",
    )
    summary["summary_path"] = str(summary_path)
    return summary
