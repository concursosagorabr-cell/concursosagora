from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any

from pipeline.portable_text import markdown_to_portable_text
from pipeline.sanity import SanityClient, SanityError
from pipeline.text import clean_whitespace

log = logging.getLogger(__name__)

ENRICHMENT_MARKER = "## Informações complementares"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _candidate_ids(post: dict[str, Any]) -> list[str]:
    post_id = str(post.get("_id") or "").strip()
    ids = [post_id] if post_id else []
    if post_id and not post_id.startswith("drafts."):
        ids.append(f"drafts.{post_id}")
    return ids


def _draft_id(post: dict[str, Any]) -> str:
    post_id = str(post.get("_id") or "").strip()
    if post_id.startswith("drafts."):
        return post_id
    slug_value = post.get("slug")
    if isinstance(slug_value, dict):
        slug = str(slug_value.get("current") or "").strip()
    else:
        slug = str(slug_value or "").strip()
    if not slug:
        slug = post_id.replace("drafts.", "") or "post"
    return f"drafts.{slug}"


def _portable_text_to_plain(blocks: list[dict[str, Any]]) -> str:
    parts: list[str] = []
    for block in blocks or []:
        for child in block.get("children") or []:
            text = child.get("text")
            if text:
                parts.append(str(text))
    return " ".join(parts)


def _fact_line(label: str, value: Any) -> str | None:
    if value in (None, "", []):
        return None
    return f"- **{label}:** {value}"


def _source_lines(post: dict[str, Any]) -> list[str]:
    lines: list[str] = []
    for source in post.get("sourceUrls") or []:
        if not isinstance(source, dict):
            continue
        title = str(source.get("title") or "Fonte oficial").strip()
        url = str(source.get("url") or "").strip()
        if url:
            lines.append(f"- [{title}]({url})")
    return lines


def build_enrichment_markdown(post: dict[str, Any]) -> str:
    """Monta uma seção adicional conservadora, sem fatos novos."""
    lines = [ENRICHMENT_MARKER, ""]
    summary_lines: list[str] = []
    summary_lines.extend(
        item
        for item in (
            _fact_line("Órgão", post.get("organ")),
            _fact_line("Banca organizadora", post.get("banca")),
            _fact_line("Unidade federativa", post.get("stateUf")),
            _fact_line("Município", post.get("cityName")),
            _fact_line("Vagas", post.get("vacanciesTotal")),
            _fact_line("Remuneração mínima (R$)", post.get("salaryMin")),
            _fact_line("Remuneração máxima (R$)", post.get("salaryMax")),
            _fact_line("Taxa de inscrição (R$)", post.get("registrationFee")),
            _fact_line("Início das inscrições", post.get("enrollmentStartDate")),
            _fact_line("Fim das inscrições", post.get("enrollmentEndDate")),
        )
        if item
    )

    if summary_lines:
        lines.append("### Resumo confirmado")
        lines.extend(summary_lines)
        lines.append("")

    lines.append("### Orientação de estudo")
    lines.append("- Consulte o edital e o conteúdo programático publicados na página oficial da banca.")
    lines.append("- Priorize questões anteriores da banca organizadora e revise os temas do edital.")
    lines.append("- Acompanhe comunicados oficiais para alterações de cronograma ou de locais de prova.")
    lines.append("- Verifique os requisitos de investidura e a documentação antes da convocação.")
    lines.append("")

    source_lines = _source_lines(post)
    if source_lines:
        lines.append("### Fontes oficiais")
        lines.extend(source_lines)
        lines.append("")

    return "\n".join(lines).strip()


def already_enriched(body: list[dict[str, Any]]) -> bool:
    plain = _portable_text_to_plain(body)
    return "Informações complementares" in plain or "agente de enriquecimento" in plain


def _rekey_blocks(blocks: list[dict[str, Any]], prefix: str) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for index, block in enumerate(blocks):
        copied = json.loads(json.dumps(block))
        copied["_key"] = f"{prefix}-{index}"
        result.append(copied)
    return result


def enrich_post(sanity: SanityClient, post: dict[str, Any], *, force: bool = False) -> dict[str, Any]:
    post_id = str(post.get("_id") or "")
    draft_id = _draft_id(post)
    if not post_id:
        raise SanityError("Post sem _id; não é possível enriquecer.")

    source_doc = None
    source_id = post_id
    for candidate in _candidate_ids(post):
        candidate_doc = sanity.query('*[_id == $id][0]', {"id": candidate}, perspective="raw")
        if isinstance(candidate_doc, dict) and candidate_doc:
            source_doc = candidate_doc
            source_id = candidate
            break
    if not isinstance(source_doc, dict) or not source_doc:
        raise SanityError(f"Documento não encontrado no Sanity: {post_id}")
    post_id = source_id
    draft_id = _draft_id(source_doc)

    body = list(source_doc.get("body") or [])
    if already_enriched(body) and not force:
        return {
            "post_id": post_id,
            "draft_id": draft_id,
            "status": "skipped",
            "reason": "já enriquecido",
            "created": False,
        }

    section = build_enrichment_markdown(source_doc)
    new_blocks = _rekey_blocks(markdown_to_portable_text(section), "enrich")
    if not new_blocks:
        raise SanityError("Não foi possível converter a seção de enriquecimento.")
    enriched_body = body + new_blocks

    draft_doc = sanity.query('*[_id == $id][0]', {"id": draft_id}, perspective="raw")
    if isinstance(draft_doc, dict) and draft_doc:
        sanity.patch_document(draft_id, {"body": enriched_body})
        return {
            "post_id": post_id,
            "draft_id": draft_id,
            "status": "patched",
            "reason": "rascunho existente atualizado",
            "created": False,
        }

    draft = dict(source_doc)
    draft.pop("_rev", None)
    draft.pop("_createdAt", None)
    draft.pop("_updatedAt", None)
    draft["_id"] = draft_id
    draft["body"] = enriched_body
    draft["reviewStatus"] = "pending"
    draft["aiAssisted"] = True
    sanity.create_draft(draft)
    return {
        "post_id": post_id,
        "draft_id": draft_id,
        "status": "created",
        "reason": "rascunho criado a partir do post",
        "created": True,
    }


def run_enrichment(
    *,
    settings: Any,
    sanity: SanityClient,
    limit: int = 10,
    apply: bool = False,
    force: bool = False,
) -> dict[str, Any]:
    context = sanity.get_context()
    posts = list(context.posts or [])[: max(1, limit)]
    items: list[dict[str, Any]] = []
    errors: list[str] = []
    applied = 0

    for post in posts:
        post_id = str(post.get("_id") or "")
        title = str(post.get("title") or post_id)
        try:
            if apply:
                result = enrich_post(sanity, post, force=force)
            else:
                body = None
                for candidate in _candidate_ids(post):
                    candidate_body = sanity.query('*[_id == $id][0]', {"id": candidate}, perspective="raw")
                    if isinstance(candidate_body, dict) and candidate_body:
                        body = candidate_body
                        break
                body_list = list((body or {}).get("body") or []) if isinstance(body, dict) else []
                result = {
                    "post_id": post_id,
                    "draft_id": _draft_id(post),
                    "status": "dry_run",
                    "reason": "validado; nada gravado",
                    "created": False,
                    "already_enriched": already_enriched(body_list),
                }
            items.append({"title": title, **result})
            if apply and result.get("status") in {"patched", "created"}:
                applied += 1
        except Exception as exc:  # noqa: BLE001
            log.error("Falha ao enriquecer %s: %s", post_id, exc)
            errors.append(f"{post_id}: {exc}")
            items.append({"title": title, "post_id": post_id, "status": "error", "reason": str(exc)})

    return {
        "limit": limit,
        "apply": apply,
        "total": len(posts),
        "applied": applied,
        "errors": len(errors),
        "error_messages": errors,
        "items": items,
    }
