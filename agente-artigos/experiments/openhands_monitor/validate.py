"""Validador determinístico do relatório de pesquisa.

O relatório pode vir do worker OpenHands ou ser escrito à mão. Este módulo não
confia no texto do relatório: cada ``quote`` precisa existir literalmente no
snapshot baixado pelo monitor, e cada URL precisa ser oficial.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from pipeline.source_policy import is_official_url

from .io_utils import FORBIDDEN_HOSTS, read_json, write_json


def normalize_quote(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").replace("\xa0", " ").replace("\u200b", "")).strip()


def quote_in_text(quote: str, text: str) -> bool:
    normalized_quote = normalize_quote(quote)
    if not normalized_quote:
        return False
    return normalized_quote in normalize_quote(text)


def _iter_urls(value: Any, key: str | None = None):
    if isinstance(value, dict):
        for child_key, child_value in value.items():
            yield from _iter_urls(child_value, child_key)
    elif isinstance(value, list):
        for item in value:
            yield from _iter_urls(item, key)
    elif isinstance(value, str) and key in {"url", "source_url", "href"}:
        yield value


def _url_is_forbidden(url: str) -> bool:
    host = urlparse(url).netloc.lower().split("@")[-1].split(":")[0]
    return any(host == forbidden or host.endswith("." + forbidden) for forbidden in FORBIDDEN_HOSTS)


def validate_report_data(report: dict[str, Any], snapshot: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    checked_quotes = 0
    unresolved_quotes: list[dict[str, str]] = []

    def check_quote(quote: str, context: str, *, required: bool = True) -> None:
        nonlocal checked_quotes
        if not quote:
            if required:
                errors.append(f"{context}: quote ausente.")
            return
        checked_quotes += 1
        if not quote_in_text(quote, str(snapshot.get("text") or "")):
            unresolved_quotes.append({"context": context, "quote": quote})
            errors.append(f"{context}: quote não encontrada no snapshot.")

    required_fields = (
        "watch_id",
        "source_url",
        "content_hash",
        "checked_at",
        "overview",
        "facts",
        "changes",
        "conflicts",
        "warnings",
        "requires_human_review",
    )
    for field_name in required_fields:
        if field_name not in report:
            errors.append(f"Campo obrigatório ausente: {field_name}.")

    if report.get("watch_id") != snapshot.get("watch_id"):
        errors.append("watch_id do relatório não corresponde ao snapshot.")
    if report.get("content_hash") != snapshot.get("text_hash"):
        errors.append("content_hash do relatório não corresponde ao snapshot.")
    if report.get("requires_human_review") is not True:
        errors.append("requires_human_review precisa ser true.")
    if not str(report.get("overview") or "").strip():
        errors.append("overview não pode ser vazio.")

    source_host = urlparse(str(report.get("source_url") or "")).netloc.lower()
    snapshot_host = urlparse(str(snapshot.get("url") or "")).netloc.lower()
    if source_host and snapshot_host and source_host != snapshot_host:
        errors.append("source_url do relatório não pertence ao domínio do snapshot.")

    for url in _iter_urls(report):
        if _url_is_forbidden(url):
            errors.append(f"URL proibida no relatório: {url}")
        elif not is_official_url(url):
            errors.append(f"URL não oficial no relatório: {url}")

    facts = report.get("facts") or []
    if not isinstance(facts, list):
        errors.append("facts precisa ser uma lista.")
        facts = []
    for index, fact in enumerate(facts, 1):
        if not isinstance(fact, dict):
            errors.append(f"facts[{index}]: item inválido.")
            continue
        status = str(fact.get("status") or "").strip()
        if status not in {"supported", "conflict", "missing"}:
            errors.append(f"facts[{index}]: status inválido ({status!r}).")
        for key in ("key", "value", "source_url"):
            if not str(fact.get(key) or "").strip():
                errors.append(f"facts[{index}]: campo {key} vazio.")
        check_quote(
            str(fact.get("quote") or ""),
            f"facts[{index}] ({fact.get('key', '?')})",
            required=status == "supported",
        )

    changes = report.get("changes") or []
    if not isinstance(changes, list):
        errors.append("changes precisa ser uma lista.")
        changes = []
    for index, change in enumerate(changes, 1):
        if not isinstance(change, dict):
            errors.append(f"changes[{index}]: item inválido.")
            continue
        status = str(change.get("status") or "").strip()
        if status not in {"supported", "conflict", "missing"}:
            errors.append(f"changes[{index}]: status inválido ({status!r}).")
        if not str(change.get("field") or "").strip():
            errors.append(f"changes[{index}]: field vazio.")
        if not str(change.get("source_url") or "").strip():
            errors.append(f"changes[{index}]: source_url vazio.")
        check_quote(
            str(change.get("quote") or ""),
            f"changes[{index}] ({change.get('field', '?')})",
            required=status == "supported",
        )

    conflicts = report.get("conflicts") or []
    if not isinstance(conflicts, list):
        errors.append("conflicts precisa ser uma lista.")
        conflicts = []
    for index, conflict in enumerate(conflicts, 1):
        if not isinstance(conflict, dict):
            errors.append(f"conflicts[{index}]: item inválido.")
            continue
        if not str(conflict.get("field") or "").strip():
            errors.append(f"conflicts[{index}]: field vazio.")
        values = conflict.get("values") or []
        if not isinstance(values, list) or len(values) < 2:
            warnings.append(f"conflicts[{index}]: menos de dois valores distintos.")
        sources = conflict.get("sources") or []
        if not isinstance(sources, list) or len(sources) < 2:
            warnings.append(f"conflicts[{index}]: menos de duas fontes.")
        for source_index, source in enumerate(sources if isinstance(sources, list) else [], 1):
            if not isinstance(source, dict):
                errors.append(f"conflicts[{index}].sources[{source_index}]: item inválido.")
                continue
            check_quote(
                str(source.get("quote") or ""),
                f"conflicts[{index}].sources[{source_index}]",
            )

    if report.get("requires_human_review") is True and not conflicts and not changes:
        warnings.append("Relatório sem changes/conflicts; revisar se a mudança é apenas textual.")

    return {
        "valid": not errors,
        "errors": errors,
        "warnings": warnings,
        "checked_quotes": checked_quotes,
        "unresolved_quotes": unresolved_quotes,
        "watch_id": report.get("watch_id"),
        "snapshot_url": snapshot.get("url"),
        "snapshot_checked_at": snapshot.get("fetched_at"),
    }


def resolve_snapshot_path(report: dict[str, Any], report_path: Path, data_dir: Path | None) -> Path:
    explicit = report.get("snapshot_path")
    if explicit:
        path = Path(str(explicit))
        if path.is_absolute():
            return path
        base = data_dir or (report_path.parent.parent if report_path.parent.name == "changes" else report_path.parent)
        return base / path
    base = data_dir or (report_path.parent.parent if report_path.parent.name == "changes" else report_path.parent)
    return base / "snapshots" / f"{report.get('watch_id')}.json"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Valida quotes e URLs de um relatório de pesquisa.")
    parser.add_argument("report", type=Path)
    parser.add_argument("--snapshot", type=Path, default=None)
    parser.add_argument("--data-dir", type=Path, default=None)
    parser.add_argument("--out", type=Path, default=None)
    args = parser.parse_args(argv)

    report = read_json(args.report)
    if report is None:
        print(f"Relatório inválido ou ausente: {args.report}", file=sys.stderr)
        return 1
    snapshot_path = args.snapshot or resolve_snapshot_path(report, args.report, args.data_dir)
    snapshot = read_json(snapshot_path)
    if snapshot is None:
        print(f"Snapshot ausente ou inválido: {snapshot_path}", file=sys.stderr)
        return 1

    result = validate_report_data(report, snapshot)
    output_path = args.out or args.report.with_suffix(".validation.json")
    write_json(output_path, result)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["valid"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
