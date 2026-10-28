from __future__ import annotations

import json
import logging
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pipeline.config import Settings, load_sources
from pipeline.dedupe import contest_key_from_url, find_duplicate, normalize_slug_candidate
from pipeline.editorial import generate_article
from pipeline.extract import discover, extract_article, infer_source_from_url
from pipeline.groq import GroqClient
from pipeline.models import (
    Candidate,
    ExtractedArticle,
    GeneratedArticle,
    ItemResult,
    RunStats,
    SourceConfig,
)
from pipeline.portable_text import markdown_to_portable_text
from pipeline.sanity import SanityClient, SanityContext, fix_datetime_of_source, infer_area_slugs
from pipeline.scrape import Scraper
from pipeline.state import StateStore
from pipeline.text import dedupe_preserve_order, normalize, slugify
from pipeline.verification import fact_sheet

log = logging.getLogger(__name__)

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


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _clip_words(text: str, limit: int) -> str:
    """Corta um texto no limite sem quebrar a última palavra."""
    value = " ".join((text or "").split())
    if len(value) <= limit:
        return value
    cut = value[:limit].rsplit(" ", 1)[0].rstrip(" .,;:-")
    return cut or value[:limit]


def _new_run_id() -> str:
    return datetime.now(timezone.utc).strftime("run-%Y%m%d-%H%M%S-") + secrets.token_hex(2)


def _contest_phase(status: str, article: ExtractedArticle) -> str:
    normalized = normalize(article.title + " " + article.body_text)
    if status == "aberto":
        return "inscricoes_abertas" if article.facts.get("enrollment_start_date") or article.facts.get("enrollment_end_date") else "edital_publicado"
    if status == "em_andamento":
        return "provas_aplicadas"
    if status == "encerrado":
        return "encerrado"
    if "autoriz" in normalized:
        return "autorizado"
    if "comissao" in normalized:
        return "comissao_formada"
    if "edital" in normalized:
        return "edital_publicado"
    return "aguardando_autorizacao"


def _category_candidates(
    context: SanityContext,
    source: SourceConfig | None,
    article: ExtractedArticle,
    generated: GeneratedArticle,
) -> list[str]:
    status = generated.status or str(article.facts.get("status") or "previsto")
    uf = generated.state_uf or str(article.facts.get("state_uf") or "")
    sphere = str(article.facts.get("sphere") or "")
    values: list[str] = []
    if status == "aberto":
        values.append("concursos-abertos")
    values.extend(infer_area_slugs(article, generated))
    if uf and uf != "Nacional":
        values.append(slugify(uf))
    if sphere == "FEDERAL":
        values.extend(["federal", "nacional"])
    elif sphere == "NACIONAL":
        values.append("nacional")
    elif sphere == "MUNICIPAL":
        values.append("prefeituras")
    if source:
        values.extend(source.default_categories)
    values.extend(generated.category_slugs)
    # Remove slugs que não existem e garante pelo menos uma categoria.
    valid: list[str] = []
    for value in dedupe_preserve_order(values):
        category = context.category_by_slug(value)
        if category and category.get("slug"):
            valid.append(str(category["slug"]))
    if not valid:
        for fallback in ("nacional", "federal", "concursos-abertos"):
            category = context.category_by_slug(fallback)
            if category and category.get("slug"):
                valid.append(str(category["slug"]))
                break
    return valid[:4]


def _build_document(
    settings: Settings,
    sanity: SanityClient,
    context: SanityContext,
    source: SourceConfig | None,
    article: ExtractedArticle,
    generated: GeneratedArticle,
    run_id: str,
    *,
    allow_uploads: bool,
    used_image_refs: set[str],
    contest_key: str | None = None,
    requested_categories: list[str] | None = None,
) -> dict[str, Any]:
    author = sanity.resolve_author(context)
    if not author:
        raise RuntimeError("Nenhum autor cadastrado no Sanity; não é possível criar o rascunho.")
    if requested_categories is not None:
        # Caminho manual: as categorias declaradas pelo autor são soberanas e
        # não devem ser misturadas com as inferidas pelo texto.
        category_slugs = []
        for value in dedupe_preserve_order(requested_categories):
            category = context.category_by_slug(value)
            if category and category.get("slug"):
                category_slugs.append(str(category["slug"]))
        if not category_slugs:
            raise RuntimeError("Nenhuma categoria válida declarada para o rascunho manual.")
    else:
        category_slugs = _category_candidates(context, source, article, generated)
    category_refs = sanity.resolve_categories(context, category_slugs)
    if not category_refs:
        raise RuntimeError("Nenhuma categoria válida encontrada no Sanity.")

    image = sanity.select_image(
        context,
        article,
        generated,
        allow_upload=allow_uploads,
        used_refs=used_image_refs,
    )
    if image and image.get("asset", {}).get("_ref"):
        used_image_refs.add(str(image["asset"]["_ref"]))

    body = markdown_to_portable_text(generated.body_markdown)
    if not body:
        body = [
            {
                "_type": "block",
                "_key": "block-0",
                "style": "normal",
                "markDefs": [],
                "children": [{"_type": "span", "_key": "span-0", "text": generated.body_markdown, "marks": []}],
            }
        ]

    slug = normalize_slug_candidate(generated.slug, context.existing_slugs)
    verification = generated.verification or article.verification or {}
    source_kind = article.source_tier or "official_primary"
    source_type = "official" if source_kind in {"official_primary", "official_secondary"} else "secondary"
    first_evidence = ""
    for items in (article.fact_evidence or {}).values():
        if items:
            first_evidence = str(items[0].get("quote") or "")
            break
    source_urls = [
        {
            "_type": "sourceReference",
            "_key": "src-0",
            "title": f"{article.source_name}: {article.title}"[:200],
            "url": article.url,
            "type": source_type,
            "kind": source_kind,
            "usage": "facts",
            "evidence": first_evidence[:600] or None,
            "checkedAt": _now(),
        }
    ]
    published_at = fix_datetime_of_source(article.published_at)
    state_uf = generated.state_uf or str(article.facts.get("state_uf") or "")
    if state_uf not in VALID_UFS:
        state_uf = ""
    city = generated.city_name or str(article.facts.get("city_name") or "")
    location = f"{city} - {state_uf}" if city and state_uf and state_uf != "Nacional" else (state_uf if state_uf and state_uf != "Nacional" else None)

    education = [level for level in generated.education_level if level in {"fundamental", "medio", "tecnico", "superior"}]
    document: dict[str, Any] = {
        "_id": f"drafts.{slug}",
        "_type": "post",
        "title": generated.title,
        "slug": {"_type": "slug", "current": slug},
        "excerpt": generated.excerpt,
        "body": body,
        "status": generated.status if generated.status in {"aberto", "previsto", "em_andamento", "encerrado"} else "previsto",
        "contestStatus": _contest_phase(generated.status, article),
        "publishedAt": published_at,
        "author": {"_type": "reference", "_ref": author["_id"]},
        "categories": category_refs,
        "reviewStatus": "pending",
        "aiAssisted": True,
        "sourceUrls": source_urls,
        "contentHash": article.text_hash,
        "lastCheckedAt": _now(),
        "pipelineRunId": run_id,
        "verificationStatus": "verified" if verification.get("ready") else "blocked",
        "verificationScore": verification.get("score"),
        "verificationReport": {
            "_type": "verificationReport",
            "checkedAt": verification.get("checkedAt") or _now(),
            "method": verification.get("method") or "deterministic_source_evidence_v1",
            "score": verification.get("score"),
            "requiredScore": verification.get("requiredScore"),
            "sourceTier": verification.get("sourceTier") or source_kind,
            "officialSource": bool(verification.get("officialSource")),
            "totalFacts": verification.get("totalFacts"),
            "supportedFacts": verification.get("supportedFacts"),
            "criticalMissing": verification.get("criticalMissing") or [],
            "blocking": verification.get("blocking") or [],
            "warnings": verification.get("warnings") or [],
        },
        "factSheet": fact_sheet(verification),
        "seo": {
            "metaTitle": _clip_words(generated.title, 70),
            "metaDescription": _clip_words(generated.seo_description or generated.excerpt, 160),
            "keywords": generated.keywords,
            "noIndex": False,
        },
    }
    if image:
        document["mainImage"] = image
    if generated.organ:
        document["organ"] = generated.organ[:160]
    if article.facts.get("sphere") in {"FEDERAL", "ESTADUAL", "DISTRITAL", "MUNICIPAL", "NACIONAL"}:
        document["sphere"] = article.facts["sphere"]
    if generated.banca:
        document["banca"] = generated.banca[:120]
    if state_uf:
        document["stateUf"] = state_uf
    if city:
        document["cityName"] = city[:100]
    if location:
        document["location"] = location[:160]
    if education:
        document["educationLevel"] = education
    for field, source_field in (
        ("vacanciesTotal", "vacancies_total"),
        ("salaryMin", "salary_min"),
        ("salaryMax", "salary_max"),
        ("registrationFee", "registration_fee"),
    ):
        value = article.facts.get(source_field)
        if isinstance(value, (int, float)) and not isinstance(value, bool) and value >= 0:
            document[field] = value
    if contest_key:
        document["contestKey"] = contest_key
    for field, source_field in (
        ("enrollmentStartDate", "enrollment_start_date"),
        ("enrollmentEndDate", "enrollment_end_date"),
        ("examDate", "exam_date"),
    ):
        value = article.facts.get(source_field)
        if isinstance(value, str) and value:
            document[field] = value
    if article.facts.get("has_exemption") is True:
        document["hasExemption"] = True
    if article.facts.get("is_cr_only") is True:
        document["isCrOnly"] = True
    return document


class PipelineRunner:
    def __init__(
        self,
        settings: Settings,
        scraper: Scraper,
        sanity: SanityClient,
        state: StateStore,
        groq: GroqClient,
    ):
        self.settings = settings
        self.scraper = scraper
        self.sanity = sanity
        self.state = state
        self.groq = groq
        self.sources = {source.id: source for source in load_sources(settings.sources_file)}

    def run(
        self,
        *,
        source_id: str | None = None,
        urls: list[str] | None = None,
        limit: int | None = None,
        dou_date=None,
        dou_file: Path | str | None = None,
        dry_run: bool = False,
    ) -> RunStats:
        settings = self.settings
        limit = min(limit or settings.max_articles_per_run, settings.max_articles_per_run)
        targets: list[tuple[SourceConfig, list[Candidate]]] = []
        if urls:
            for url in urls:
                resolved = source_id or infer_source_from_url(url)
                if not resolved or resolved not in self.sources:
                    raise ValueError(
                        f"Não consegui inferir a fonte de {url}. Informe --source com uma das opções: "
                        + ", ".join(sorted(self.sources))
                    )
                source = self.sources[resolved]
                if source.type in {"dou_inlabs", "dou_open_data"}:
                    raise ValueError(
                        "O DOU deve ser importado pelo XML/ZIP oficial: use --source dou "
                        "com --dou-file. Não use --url, que tentaria ler o HTML bloqueado."
                    )
                if not source.enabled:
                    raise ValueError(
                        f"A fonte '{resolved}' está desativada em sources.yaml e não será coletada."
                    )
                targets.append((source, [Candidate(url=url, source_id=resolved)]))
        else:
            if not source_id:
                raise ValueError("Informe --source ou --url.")
            if source_id == "all":
                selected = [source for source in self.sources.values() if source.enabled]
            else:
                if source_id not in self.sources:
                    raise ValueError(f"Fonte desconhecida: {source_id}")
                selected = [self.sources[source_id]]
                local_dou_import = selected[0].type in {"dou_inlabs", "dou_open_data"} and dou_file
                if not selected[0].enabled and not local_dou_import:
                    raise ValueError(
                        f"A fonte '{source_id}' está desativada em sources.yaml e não será coletada."
                    )
            for source in selected:
                candidates = discover(
                    self.scraper,
                    source,
                    limit=limit,
                    dou_date=dou_date,
                    dou_file=dou_file,
                )
                # Remove URLs already processed in previous runs
                candidates = [c for c in candidates if not self.state.processed(c.url)]
                targets.append((source, candidates))

        run_id = _new_run_id()
        label = source_id or "urls"
        stats = RunStats(run_id=run_id, started_at=_now(), dry_run=dry_run)
        self.state.start_run(run_id, label)
        context = self.sanity.get_context()
        used_image_refs: set[str] = set()
        run_dir = settings.data_dir / "runs" / run_id
        run_dir.mkdir(parents=True, exist_ok=True)

        log.info(
            "Execução %s | fonte=%s | modo=%s | candidatos=%s",
            run_id,
            label,
            "dry-run" if dry_run else "rascunhos",
            sum(len(items) for _, items in targets),
        )

        processed_count = 0
        for source, candidates in targets:
            for candidate in candidates:
                if processed_count >= limit:
                    break
                stats.discovered += 1
                if self.state.processed(candidate.url):
                    log.info("Já processado; ignorando %s", candidate.url)
                    stats.skipped += 1
                    continue
                processed_count += 1
                stats.processed += 1
                try:
                    result, document = self._process_candidate(
                        source,
                        candidate,
                        context,
                        run_id,
                        dry_run=dry_run,
                        used_image_refs=used_image_refs,
                    )
                    stats.items.append(result)
                    if result.status == "created":
                        stats.created += 1
                        if document:
                            context.posts.append(
                                {
                                    "_id": document["_id"],
                                    "title": document.get("title"),
                                    "slug": document.get("slug", {}).get("current"),
                                    "contentHash": document.get("contentHash"),
                                    "sourceUrls": document.get("sourceUrls"),
                                    "contestKey": document.get("contestKey"),
                                }
                            )
                    elif result.status in {"duplicate", "exists"}:
                        stats.duplicates += 1
                        stats.skipped += 1
                    elif result.status in {"skipped", "dry_run"}:
                        stats.skipped += 1
                    elif result.status == "error":
                        stats.errors += 1
                    artifact = {
                        "run_id": run_id,
                        "source_id": source.id,
                        "url": candidate.url,
                        "result": result.__dict__,
                        "document": document,
                    }
                    artifact_path = run_dir / f"{result.slug or 'item'}-{abs(hash(candidate.url)) % 10000}.json"
                    artifact_path.write_text(
                        json.dumps(artifact, ensure_ascii=False, indent=2, default=str),
                        encoding="utf-8",
                    )
                except Exception as exc:  # noqa: BLE001
                    log.exception("Erro ao processar %s", candidate.url)
                    result = ItemResult(
                        url=candidate.url,
                        source_id=source.id,
                        status="error",
                        message=str(exc)[:1000],
                    )
                    stats.items.append(result)
                    stats.errors += 1
                    self.state.record(result, run_id)
                    error_artifact = {
                        "run_id": run_id,
                        "source_id": source.id,
                        "url": candidate.url,
                        "result": result.__dict__,
                        "traceback": str(exc),
                    }
                    (run_dir / f"error-{abs(hash(candidate.url)) % 10000}.json").write_text(
                        json.dumps(error_artifact, ensure_ascii=False, indent=2, default=str),
                        encoding="utf-8",
                    )
            if processed_count >= limit:
                break

        stats.finished_at = _now()
        self.state.finish_run(stats)
        summary_path = run_dir / "summary.json"
        summary_path.write_text(
            json.dumps(stats.__dict__, ensure_ascii=False, indent=2, default=str),
            encoding="utf-8",
        )
        log.info(
            "Fim %s | processados=%s criados=%s ignorados=%s duplicados=%s erros=%s | %s",
            run_id,
            stats.processed,
            stats.created,
            stats.skipped,
            stats.duplicates,
            stats.errors,
            summary_path,
        )
        return stats

    def _process_candidate(
        self,
        source: SourceConfig,
        candidate: Candidate,
        context: SanityContext,
        run_id: str,
        *,
        dry_run: bool,
        used_image_refs: set[str],
    ) -> tuple[ItemResult, dict[str, Any] | None]:
        log.info("Coletando %s", candidate.url)
        article = extract_article(self.scraper, source, candidate)
        if not source.can_generate_article:
            result = ItemResult(
                url=candidate.url,
                source_id=source.id,
                status="skipped",
                message="fonte de descoberta não pode gerar artigo; use a fonte oficial",
                article_title=article.title,
                content_hash=article.text_hash,
                facts=article.facts,
                verification=article.verification,
            )
            self.state.record(result, run_id, article.text_hash)
            return result, None
        if self.settings.require_official_source and article.source_tier not in {
            "official_primary",
            "official_secondary",
        }:
            result = ItemResult(
                url=candidate.url,
                source_id=source.id,
                status="skipped",
                message="fonte não oficial: fato precisa ser confirmado em fonte primária",
                article_title=article.title,
                content_hash=article.text_hash,
                facts=article.facts,
                verification=article.verification,
            )
            self.state.record(result, run_id, article.text_hash)
            return result, None
        if len(article.body_text) < 200 or len(article.title) < 8:
            result = ItemResult(
                url=candidate.url,
                source_id=source.id,
                status="skipped",
                message="conteúdo insuficiente após extração",
                article_title=article.title,
                content_hash=article.text_hash,
                facts=article.facts,
            )
            self.state.record(result, run_id, article.text_hash)
            return result, None

        # REJEITA NOTÍCIAS VELHAS REPUBLICADAS COMO NOVAS
        if self.settings.reject_stale_news and article.published_at:
            try:
                pub_date = datetime.fromisoformat(article.published_at.replace("Z", "+00:00"))
                age_days = (datetime.now(timezone.utc) - pub_date).days
                if age_days > self.settings.max_news_age_days:
                    # Verifica se o texto usa tempo presente para fatos passados
                    present_patterns = [
                        r"\b(abre|abriu|lança|lançou|publica|publicou|divulga|divulgou)\b",
                        r"\binscri[cç][oõ]es abertas\b",
                        r"\bper[ií]odo de inscri[cç][aã]o\b",
                    ]
                    text_check = article.title + " " + article.body_text
                    uses_present = any(re.search(p, text_check, flags=re.I) for p in present_patterns)
                    if uses_present:
                        result = ItemResult(
                            url=candidate.url,
                            source_id=source.id,
                            status="skipped",
                            message=f"notícia com {age_days} dias usa tempo presente para fatos passados (máx {self.settings.max_news_age_days} dias)",
                            article_title=article.title,
                            content_hash=article.text_hash,
                            facts=article.facts,
                        )
                        self.state.record(result, run_id, article.text_hash)
                        log.warning("Notícia velha rejeitada: %s (%s dias)", candidate.url, age_days)
                        return result, None
            except (ValueError, TypeError):
                pass  # Se não conseguir parsear a data, continua

        contest_key = contest_key_from_url(article.canonical_url or article.url)
        provisional_slug = slugify(article.title, 96) or f"concurso-{article.text_hash[:10]}"
        duplicate, reason, matched = find_duplicate(
            context.posts,
            article,
            article.title,
            provisional_slug,
            contest_key=contest_key,
            cooldown_days=self.settings.contest_cooldown_days,
        )
        if duplicate and reason.startswith(("URL", "hash", "slug", "mesmo concurso")):
            result = ItemResult(
                url=candidate.url,
                source_id=source.id,
                status="duplicate",
                message=reason,
                article_title=article.title,
                content_hash=article.text_hash,
                sanity_id=str((matched or {}).get("_id") or "") or None,
                facts=article.facts,
            )
            self.state.record(result, run_id, article.text_hash)
            log.info("Duplicado: %s (%s)", candidate.url, reason)
            return result, None

        log.info("Redigindo com %s", self.settings.groq_model)
        generated = generate_article(self.groq, self.settings, article, context.category_slugs)
        verification = generated.verification or article.verification or {}
        if generated.blocking or not verification.get("ready", False):
            result = ItemResult(
                url=candidate.url,
                source_id=source.id,
                status="skipped",
                message=(
                    "verificação bloqueou o rascunho: "
                    + "; ".join((generated.blocking or verification.get("blocking") or ["evidência insuficiente"])[:3])
                ),
                article_title=generated.title,
                slug=generated.slug,
                warnings=generated.warnings,
                fact_check_score=generated.score,
                content_hash=article.text_hash,
                facts=article.facts,
                verification=verification,
                generated={
                    "title": generated.title,
                    "excerpt": generated.excerpt,
                    "body_markdown": generated.body_markdown,
                    "status": generated.status,
                    "score": generated.score,
                    "word_count": generated.body_word_count,
                },
            )
            self.state.record(result, run_id, article.text_hash)
            log.warning(
                "Verificação bloqueou: %s (%s)",
                generated.title,
                "; ".join(generated.blocking[:3]) or "evidência insuficiente",
            )
            return result, None
        if generated.score < self.settings.fact_check_min_score:
            result = ItemResult(
                url=candidate.url,
                source_id=source.id,
                status="skipped",
                message=(
                    f"fact-check {generated.score}/100 abaixo do mínimo "
                    f"{self.settings.fact_check_min_score}; rascunho não criado"
                ),
                article_title=generated.title,
                slug=generated.slug,
                warnings=generated.warnings,
                fact_check_score=generated.score,
                content_hash=article.text_hash,
                facts=article.facts,
                verification=verification,
                generated={
                    "title": generated.title,
                    "excerpt": generated.excerpt,
                    "body_markdown": generated.body_markdown,
                    "status": generated.status,
                    "score": generated.score,
                    "word_count": generated.body_word_count,
                },
            )
            self.state.record(result, run_id, article.text_hash)
            log.warning(
                "Fact-check reprovado: %s (%s/100; mínimo %s)",
                generated.title,
                generated.score,
                self.settings.fact_check_min_score,
            )
            return result, None
        slug = normalize_slug_candidate(generated.slug, context.existing_slugs)
        duplicate, reason, matched = find_duplicate(
            context.posts,
            article,
            generated.title,
            slug,
            contest_key=contest_key,
            cooldown_days=self.settings.contest_cooldown_days,
        )
        if duplicate:
            result = ItemResult(
                url=candidate.url,
                source_id=source.id,
                status="duplicate",
                message=reason,
                article_title=generated.title,
                slug=slug,
                content_hash=article.text_hash,
                sanity_id=str((matched or {}).get("_id") or "") or None,
                facts=article.facts,
                verification=verification,
                generated={"title": generated.title, "score": generated.score},
            )
            self.state.record(result, run_id, article.text_hash)
            log.info("Duplicado após redação: %s (%s)", candidate.url, reason)
            return result, None

        document = _build_document(
            self.settings,
            self.sanity,
            context,
            source,
            article,
            generated,
            run_id,
            allow_uploads=not dry_run,
            used_image_refs=used_image_refs,
            contest_key=contest_key,
        )
        document["_id"] = f"drafts.{slug}"
        document["slug"] = {"_type": "slug", "current": slug}
        if dry_run:
            result = ItemResult(
                url=candidate.url,
                source_id=source.id,
                status="dry_run",
                message=f"validação {generated.score}/100; nada foi gravado no Sanity",
                article_title=generated.title,
                slug=slug,
                warnings=generated.warnings,
                fact_check_score=generated.score,
                content_hash=article.text_hash,
                facts=article.facts,
                verification=verification,
                generated={
                    "title": generated.title,
                    "excerpt": generated.excerpt,
                    "body_markdown": generated.body_markdown,
                    "status": generated.status,
                    "score": generated.score,
                    "word_count": generated.body_word_count,
                },
            )
            log.info("Dry-run OK: %s (%s palavras, score %s)", generated.title, generated.body_word_count, generated.score)
            return result, document

        response = self.sanity.create_draft(document)
        result = ItemResult(
            url=candidate.url,
            source_id=source.id,
            status="created",
            message="rascunho criado no Sanity com reviewStatus=pending",
            article_title=generated.title,
            slug=slug,
            sanity_id=str(response.get("id") or document["_id"]),
            warnings=generated.warnings,
            fact_check_score=generated.score,
            content_hash=article.text_hash,
            facts=article.facts,
            generated={
                "title": generated.title,
                "excerpt": generated.excerpt,
                "body_markdown": generated.body_markdown,
                "status": generated.status,
                "score": generated.score,
                "word_count": generated.body_word_count,
            },
        )
        self.state.record(result, run_id, article.text_hash)
        log.info("Rascunho criado: %s (%s)", result.sanity_id, generated.title)
        return result, document
