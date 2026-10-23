from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from pipeline.config import Settings, load_settings, load_sources
from pipeline.dedupe import contest_key_from_url, find_duplicate
from pipeline.extract import discover, extract_article
from pipeline.models import Candidate, ExtractedArticle, SourceConfig
from pipeline.sanity import SanityClient, SanityContext
from pipeline.scrape import Scraper
from pipeline.text import slugify

log = logging.getLogger(__name__)

DAILY_QUEUE_VERSION = 1


@dataclass
class DailyItem:
    source_id: str
    source_name: str
    url: str
    title: str = ""
    published_at: str | None = None
    discovery_score: float = 0.0
    contest_key: str = ""
    status: str = "queued"
    reason: str = ""
    source_tier: str = ""
    summary: str = ""
    source_text: str = ""
    facts: dict[str, Any] = field(default_factory=dict)
    evidence: dict[str, str] = field(default_factory=dict)
    verification: dict[str, Any] = field(default_factory=dict)
    extracted_title: str = ""

    def as_dict(self) -> dict[str, Any]:
        return {
            "source_id": self.source_id,
            "source_name": self.source_name,
            "url": self.url,
            "title": self.title,
            "extracted_title": self.extracted_title,
            "published_at": self.published_at,
            "discovery_score": self.discovery_score,
            "contest_key": self.contest_key,
            "status": self.status,
            "reason": self.reason,
            "source_tier": self.source_tier,
            "summary": self.summary,
            "source_text": self.source_text,
            "facts": self.facts,
            "evidence": self.evidence,
            "verification": self.verification,
        }


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat()


def _synthetic_article(candidate: Candidate, source: SourceConfig) -> ExtractedArticle:
    return ExtractedArticle(
        source_id=source.id,
        source_name=source.name,
        url=candidate.url,
        canonical_url=candidate.official_url or candidate.url,
        title=candidate.title or "",
        published_at=candidate.published_at,
        summary=candidate.summary or "",
        body_text="",
        image_url=None,
        image_alt=None,
        facts={},
        text_hash="",
        fetched_at=_iso(_now()),
        metadata={},
        source_tier=source.tier,
    )


def _duplicate_reason(
    context: SanityContext,
    candidate: Candidate,
    source: SourceConfig,
    settings: Settings,
) -> tuple[str, dict[str, Any] | None]:
    article = _synthetic_article(candidate, source)
    contest_key = contest_key_from_url(candidate.url)
    duplicate, reason, matched = find_duplicate(
        context.posts,
        article,
        candidate.title or "",
        slugify(candidate.title or candidate.url, 96),
        contest_key=contest_key,
        cooldown_days=settings.contest_cooldown_days,
        extra_urls=[candidate.url],
    )
    return (reason, matched) if duplicate else ("", None)


def _select_sources(
    settings: Settings,
    requested: str | None,
) -> list[SourceConfig]:
    sources = [source for source in load_sources(settings.sources_file) if source.enabled]
    if requested and requested.strip().lower() not in {"all", "*"}:
        wanted = {item.strip().lower() for item in requested.split(",") if item.strip()}
        sources = [source for source in sources if source.id.lower() in wanted]
    return [source for source in sources if source.can_generate_article]


def _pending_drafts(sanity: SanityClient) -> list[dict[str, Any]]:
    drafts = sanity.query(
        '*[_id in path("drafts.**") && _type == "post"] | order(_createdAt asc) {'
        '_id, title, "slug": slug.current, reviewStatus, _createdAt, _updatedAt, '
        'publishedAt, contestKey, "categories": categories[]->slug.current'
        '}',
        perspective="raw",
    )
    return list(drafts or [])


def _write_markdown(
    path: Path,
    *,
    day: str,
    generated_at: str,
    cooldown_days: int,
    items: list[DailyItem],
    pending: list[dict[str, Any]],
    stale_days: int,
    errors: list[str],
) -> None:
    ready = [item for item in items if item.status == "ready"]
    review = [item for item in items if item.status == "needs_review"]
    duplicates = [item for item in items if item.status == "duplicate"]
    failures = [item for item in items if item.status == "error"]
    pending_posts = [post for post in pending if post.get("reviewStatus") == "pending"]
    cutoff = _now() - timedelta(days=stale_days)
    stale: list[dict[str, Any]] = []
    for post in pending_posts:
        raw = str(post.get("_createdAt") or "")
        try:
            created = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            continue
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        if created < cutoff:
            stale.append(post)

    lines = [
        f"# Fila editorial diária — {day}",
        "",
        f"Gerada em {generated_at} (UTC).",
        f"Cooldown por concurso: **{cooldown_days} dias**.",
        "",
        "## Resumo",
        "",
        f"- Prontos para redigir: **{len(ready)}**",
        f"- Precisam de conferência: **{len(review)}**",
        f"- Duplicados/bloqueados: **{len(duplicates)}**",
        f"- Erros de extração: **{len(failures)}**",
        f"- Rascunhos pendentes no Sanity: **{len(pending_posts)}**",
        f"- Rascunhos pendentes com mais de {stale_days} dias: **{len(stale)}**",
        "",
    ]
    if errors:
        lines.extend(["## Falhas de coleta", ""])
        lines.extend(f"- {error}" for error in errors)
        lines.append("")

    lines.extend(
        [
            "## Fila",
            "",
            "| # | Status | Fonte | Concurso | Título | Evidência |",
            "|---|--------|-------|----------|--------|-----------|",
        ]
    )
    for index, item in enumerate(items, 1):
        score = item.verification.get("score")
        score_text = f"{score}/100" if score is not None else "—"
        title = (item.extracted_title or item.title or "(sem título)").replace("|", "\\|")
        lines.append(
            f"| {index} | {item.status} | {item.source_name} | "
            f"`{item.contest_key or '—'}` | [{title}]({item.url}) | {score_text} |"
        )
    lines.append("")

    for label, group in (
        ("Prontos para redigir", ready),
        ("Precisam de conferência", review),
    ):
        if not group:
            continue
        lines.extend([f"## {label}", ""])
        for index, item in enumerate(group, 1):
            score = item.verification.get("score")
            score_text = f"{score}/100" if score is not None else "—"
            lines.extend(
                [
                    f"### {index}. {item.extracted_title or item.title}",
                    "",
                    f"- Fonte: [{item.source_name}]({item.url})",
                    f"- Concurso: `{item.contest_key or 'não identificado'}`",
                    f"- Evidência: {score_text} "
                    f"({item.verification.get('supportedFacts', 0)}/"
                    f"{item.verification.get('totalFacts', 0)} fatos com trecho literal)",
                ]
            )
            missing = item.verification.get("criticalMissing") or []
            if missing:
                lines.append("- Fatos críticos sem evidência: " + ", ".join(missing))
            if item.facts:
                lines.append("- Fatos extraídos:")
                for key, value in item.facts.items():
                    if value in (None, "", []):
                        continue
                    lines.append(f"  - `{key}`: {value}")
            lines.append("")

    if duplicates:
        lines.extend(["## Duplicados ou bloqueados", ""])
        for item in duplicates:
            lines.append(f"- [{item.title or item.url}]({item.url}) — {item.reason}")
        lines.append("")

    if pending_posts:
        lines.extend(["## Rascunhos aguardando revisão humana", ""])
        for post in pending_posts:
            age = ""
            raw = str(post.get("_createdAt") or "")
            try:
                created = datetime.fromisoformat(raw.replace("Z", "+00:00"))
                if created.tzinfo is None:
                    created = created.replace(tzinfo=timezone.utc)
                age = f" ({(_now() - created).days} dias)"
            except ValueError:
                pass
            lines.append(
                f"- `{post.get('_id')}` — {post.get('title') or '(sem título)'}{age}"
            )
        lines.append("")

    lines.extend(
        [
            "## Próximos passos",
            "",
            "1. Escolher os itens com status `ready` (ou conferir os `needs_review` na fonte).",
            "2. Redigir o bundle do dia com `source_text`, `facts` e `evidence` literais.",
            "3. Validar sem gravar:",
            "",
            "   ```powershell",
            "   python -m pipeline manual --bundle data/manual_articles/bundle-AAAA-MM-DD.json",
            "   ```",
            "",
            "4. Criar os rascunhos:",
            "",
            "   ```powershell",
            "   python -m pipeline manual --bundle data/manual_articles/bundle-AAAA-MM-DD.json --apply",
            "   ```",
            "",
            "5. Revisar e publicar manualmente no Studio. O pipeline nunca publica.",
            "",
        ]
    )
    path.write_text("\n".join(lines), encoding="utf-8")


def run_daily(
    *,
    settings: Settings | None = None,
    sources: str | None = None,
    limit: int = 8,
    max_extract: int = 12,
    stale_days: int = 7,
    extract: bool = True,
) -> dict[str, Any]:
    """Monta a fila editorial do dia sem chamar Groq e sem gravar no Sanity.

    A rotina diária é uma etapa de preparação: descobre candidatos oficiais,
    aplica as travas de URL/hash/concurso e extrai fatos com trechos literais.
    A redação e a publicação continuam sendo passos humanos (ou do assistente),
    sempre via bundle manual e revisão no Studio.
    """
    settings = settings or load_settings()
    settings.validate_sanity()
    sanity = SanityClient(settings)
    context = sanity.get_context()
    selected_sources = _select_sources(settings, sources)
    if not selected_sources:
        raise ValueError("Nenhuma fonte oficial habilitada para a rotina diária.")

    now_utc = _now()
    generated_at = _iso(now_utc)
    # O nome da pasta segue o dia local da redação, não o dia UTC.
    day = now_utc.astimezone().strftime("%Y-%m-%d")
    queue_dir = settings.data_dir / "daily" / day
    queue_dir.mkdir(parents=True, exist_ok=True)

    items: list[DailyItem] = []
    errors: list[str] = []
    extracted_count = 0

    with Scraper(settings) as scraper:
        for source in selected_sources:
            source_limit = min(max(1, limit), max(1, source.max_candidates))
            try:
                candidates = discover(scraper, source, limit=source_limit)
            except Exception as exc:  # noqa: BLE001
                message = f"{source.id}: falha na descoberta — {exc}"
                log.warning(message)
                errors.append(message)
                continue

            for candidate in candidates:
                contest_key = contest_key_from_url(candidate.url)
                item = DailyItem(
                    source_id=source.id,
                    source_name=source.name,
                    url=candidate.url,
                    title=candidate.title or "",
                    published_at=candidate.published_at,
                    discovery_score=candidate.score,
                    contest_key=contest_key,
                    source_tier=source.tier,
                )
                reason, matched = _duplicate_reason(context, candidate, source, settings)
                if reason:
                    item.status = "duplicate"
                    item.reason = reason + (
                        f" ({matched.get('_id')})" if matched and matched.get("_id") else ""
                    )
                    items.append(item)
                    continue

                if not extract:
                    items.append(item)
                    continue
                if extracted_count >= max(1, max_extract):
                    item.status = "queued"
                    item.reason = "limite diário de extração atingido"
                    items.append(item)
                    continue

                extracted_count += 1
                try:
                    article = extract_article(scraper, source, candidate)
                except Exception as exc:  # noqa: BLE001
                    item.status = "error"
                    item.reason = f"falha na extração: {exc}"
                    errors.append(f"{candidate.url}: {exc}")
                    items.append(item)
                    continue

                item.extracted_title = article.title
                item.summary = article.summary
                item.source_text = article.full_text
                item.facts = dict(article.facts or {})
                item.evidence = {
                    key: str((values or [{}])[0].get("quote") or "")
                    for key, values in (article.fact_evidence or {}).items()
                    if values
                }
                item.verification = {
                    "score": article.verification.get("score"),
                    "totalFacts": article.verification.get("totalFacts"),
                    "supportedFacts": article.verification.get("supportedFacts"),
                    "criticalMissing": article.verification.get("criticalMissing") or [],
                    "missing": article.verification.get("missing") or [],
                    "method": article.verification.get("method"),
                }
                item.contest_key = contest_key_from_url(article.canonical_url) or item.contest_key

                duplicate, duplicate_reason, matched = find_duplicate(
                    context.posts,
                    article,
                    article.title,
                    slugify(article.title, 96),
                    contest_key=item.contest_key,
                    cooldown_days=settings.contest_cooldown_days,
                    extra_urls=[article.url, article.canonical_url],
                )
                if duplicate:
                    item.status = "duplicate"
                    item.reason = duplicate_reason + (
                        f" ({matched.get('_id')})" if matched and matched.get("_id") else ""
                    )
                elif (
                    item.verification.get("criticalMissing")
                    or int(item.verification.get("score") or 0) < settings.verification_min_score
                ):
                    item.status = "needs_review"
                    item.reason = "evidência insuficiente para redigir sem conferência manual"
                else:
                    item.status = "ready"
                    item.reason = "fatos e trechos literais disponíveis"
                items.append(item)

    pending = _pending_drafts(sanity)
    queue = {
        "version": DAILY_QUEUE_VERSION,
        "generated_at": generated_at,
        "day": day,
        "cooldown_days": settings.contest_cooldown_days,
        "verification_min_score": settings.verification_min_score,
        "sources": [source.id for source in selected_sources],
        "limit_per_source": limit,
        "max_extract": max_extract,
        "stale_days": stale_days,
        "items": [item.as_dict() for item in items],
        "pending_drafts": pending,
        "errors": errors,
    }
    queue_path = queue_dir / "queue.json"
    queue_path.write_text(
        json.dumps(queue, ensure_ascii=False, indent=2, default=str),
        encoding="utf-8",
    )
    markdown_path = queue_dir / "queue.md"
    _write_markdown(
        markdown_path,
        day=day,
        generated_at=generated_at,
        cooldown_days=settings.contest_cooldown_days,
        items=items,
        pending=pending,
        stale_days=stale_days,
        errors=errors,
    )
    queue["queue_path"] = str(queue_path)
    queue["markdown_path"] = str(markdown_path)
    return queue
