"""Monitor determinístico de fontes oficiais.

Uso principal:

    python -m experiments.openhands_monitor.monitor \
        --watchlist experiments/openhands_monitor/watchlist.example.yaml \
        --data-dir data/openhands_monitor

O script:
1. baixa apenas URLs explícitas da watchlist, respeitando robots.txt;
2. extrai o texto principal e os links de retificação/errata/edital;
3. compara com o snapshot anterior por hash;
4. grava um ``change-report.json`` somente quando algo muda.

Não há LLM, browser ou escrita no Sanity nesta etapa. O relatório é a entrada
opcional do ``worker.py`` (OpenHands) e do ``validate.py``.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from difflib import unified_diff
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

import yaml

from pipeline.config import PROJECT_DIR, load_settings
from pipeline.scrape import FetchError, RobotsDenied, Scraper, domain_allowed
from pipeline.source_policy import is_official_url
from pipeline.text import clean_whitespace, normalize

from .io_utils import FORBIDDEN_HOSTS, read_json, write_json


DEFAULT_WATCHLIST = PROJECT_DIR / "experiments" / "openhands_monitor" / "watchlist.yaml"
EXAMPLE_WATCHLIST = PROJECT_DIR / "experiments" / "openhands_monitor" / "watchlist.example.yaml"
DEFAULT_DATA_DIR = PROJECT_DIR / "data" / "openhands_monitor"

LINK_PATTERNS_DEFAULT = ("retifica", "errata", "edital", "aditivo", "comunicado", "homologa")
SIGNAL_PATTERNS = {
    "retificacao": re.compile(r"retifica|errata|aditivo|comunicado", re.I),
    "prazo": re.compile(r"prazo|inscri|pagamento|homologa|gabarito|resultado", re.I),
    "vagas": re.compile(r"\bvagas?\b|preenchimento|cadastro de reserva", re.I),
    "data": re.compile(r"\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b"),
    "valor": re.compile(r"R\$\s?\d", re.I),
}


@dataclass(frozen=True)
class WatchItem:
    id: str
    source_id: str
    url: str
    allowed_domains: list[str] = field(default_factory=list)
    text_selectors: list[str] = field(default_factory=list)
    link_patterns: list[str] = field(default_factory=lambda: list(LINK_PATTERNS_DEFAULT))
    max_links: int = 20
    notes: str | None = None


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def canonical_text(value: str) -> str:
    """Texto canônico para hash: sem acento, pontuação ou espaços variáveis."""
    return normalize(clean_whitespace(value))


def text_units(value: str) -> list[str]:
    """Divide o texto em frases/linhas para um diff legível."""
    cleaned = clean_whitespace(value)
    if not cleaned:
        return []
    parts = re.split(r"(?<=[.!?])\s+|\n+", cleaned)
    return [part.strip() for part in parts if part.strip()]


def extract_text(page, selectors: list[str]) -> tuple[str, str | None]:
    """Extrai o primeiro seletor que tiver conteúdo; senão usa a página inteira."""
    for selector in selectors:
        elements = page.soup.select(selector)
        chunks = [clean_whitespace(element.get_text(" ", strip=True)) for element in elements]
        chunks = [chunk for chunk in chunks if chunk]
        if chunks:
            return clean_whitespace("\n".join(chunks)), selector
    return clean_whitespace(page.text), None


def extract_links(page, base_url: str, patterns: list[str], max_links: int) -> list[dict[str, str]]:
    """Coleta links cujo texto ou href casa com os padrões editoriais."""
    compiled = [re.compile(pattern, re.I) for pattern in patterns if pattern]
    found: dict[str, dict[str, str]] = {}
    for anchor in page.soup.find_all("a", href=True):
        href = urljoin(base_url, str(anchor["href"]).strip())
        if not href.startswith(("http://", "https://")):
            continue
        host = urlparse(href).netloc.lower().split(":")[0]
        if any(host == forbidden or host.endswith("." + forbidden) for forbidden in FORBIDDEN_HOSTS):
            continue
        label = clean_whitespace(anchor.get_text(" ", strip=True)) or href
        if compiled and not any(pattern.search(label) or pattern.search(href) for pattern in compiled):
            continue
        found.setdefault(href, {"href": href, "label": label})
        if len(found) >= max_links:
            break
    return sorted(found.values(), key=lambda item: (item["href"], item["label"]))


def snapshot_from_page(watch: WatchItem, page) -> dict[str, Any]:
    if not is_official_url(page.url):
        raise ValueError(f"URL final não classificada como oficial: {page.url}")
    if watch.allowed_domains and not domain_allowed(page.url, watch.allowed_domains):
        raise ValueError(f"URL final fora dos domínios permitidos: {page.url}")

    text, selector_used = extract_text(page, watch.text_selectors)
    if not text:
        raise ValueError(f"Texto vazio em {page.url}")

    links = extract_links(page, page.url, watch.link_patterns, watch.max_links)
    links_hash = sha256_text(json.dumps(links, ensure_ascii=False, sort_keys=True))
    return {
        "version": 1,
        "watch_id": watch.id,
        "source_id": watch.source_id,
        "requested_url": watch.url,
        "url": page.url,
        "fetched_at": now_iso(),
        "status": page.status,
        "official": is_official_url(page.url),
        "content_type": page.headers.get("content-type", ""),
        "selector_used": selector_used,
        "text": text,
        "text_hash": sha256_text(canonical_text(text)),
        "links": links,
        "links_hash": links_hash,
    }


def detect_signals(added: list[str], removed: list[str]) -> list[str]:
    haystack = "\n".join(added + removed)
    return [name for name, pattern in SIGNAL_PATTERNS.items() if pattern.search(haystack)]


def diff_snapshots(
    previous: dict[str, Any] | None,
    current: dict[str, Any],
    watch: WatchItem,
) -> dict[str, Any]:
    """Compara dois snapshots e devolve o relatório de mudança (sem LLM)."""
    if previous is None:
        return {
            "version": 1,
            "watch_id": watch.id,
            "source_id": watch.source_id,
            "url": current["url"],
            "checked_at": current["fetched_at"],
            "previous_checked_at": None,
            "baseline": True,
            "changed": False,
            "text_changed": False,
            "links_changed": False,
            "old_text_hash": None,
            "new_text_hash": current["text_hash"],
            "old_links_hash": None,
            "new_links_hash": current["links_hash"],
            "added": [],
            "removed": [],
            "added_links": [],
            "removed_links": [],
            "diff": [],
            "signals": [],
            "snapshot_path": f"snapshots/{watch.id}.json",
            "previous_snapshot_path": None,
            "requires_human_review": True,
            "llm_required": False,
            "warnings": ["Primeiro snapshot criado; esta execução é apenas a linha de base."],
        }

    old_units = text_units(str(previous.get("text") or ""))
    new_units = text_units(str(current.get("text") or ""))
    diff_lines = list(
        unified_diff(old_units, new_units, fromfile="antes", tofile="depois", lineterm="", n=2)
    )
    added = [line[1:] for line in diff_lines if line.startswith("+") and not line.startswith("+++")]
    removed = [line[1:] for line in diff_lines if line.startswith("-") and not line.startswith("---")]

    old_links = {item["href"]: item for item in previous.get("links", []) if item.get("href")}
    new_links = {item["href"]: item for item in current.get("links", []) if item.get("href")}
    added_links = [new_links[href] for href in sorted(new_links.keys() - old_links.keys())]
    removed_links = [old_links[href] for href in sorted(old_links.keys() - new_links.keys())]

    text_changed = previous.get("text_hash") != current.get("text_hash")
    links_changed = previous.get("links_hash") != current.get("links_hash")
    changed = text_changed or links_changed
    signals = detect_signals(added, removed) if changed else []

    return {
        "version": 1,
        "watch_id": watch.id,
        "source_id": watch.source_id,
        "url": current["url"],
        "checked_at": current["fetched_at"],
        "previous_checked_at": previous.get("fetched_at"),
        "baseline": False,
        "changed": changed,
        "text_changed": text_changed,
        "links_changed": links_changed,
        "old_text_hash": previous.get("text_hash"),
        "new_text_hash": current.get("text_hash"),
        "old_links_hash": previous.get("links_hash"),
        "new_links_hash": current.get("links_hash"),
        "added": added[:100],
        "removed": removed[:100],
        "added_links": added_links[:50],
        "removed_links": removed_links[:50],
        "diff": diff_lines[:300],
        "signals": signals,
        "snapshot_path": f"snapshots/{watch.id}.json",
        "previous_snapshot_path": f"snapshots/{watch.id}.previous.json",
        "requires_human_review": True,
        "llm_required": changed,
        "warnings": [] if changed else ["Nenhuma mudança detectada."],
    }


def load_watchlist(path: Path) -> list[WatchItem]:
    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    defaults = dict(raw.get("defaults") or {})
    entries = raw.get("watches") or raw.get("watch") or []
    watches: list[WatchItem] = []
    seen: set[str] = set()
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        merged = {**defaults, **entry}
        watch_id = str(merged.get("id") or "").strip()
        url = str(merged.get("url") or "").strip()
        if not watch_id or not url:
            raise ValueError("Cada watch precisa de 'id' e 'url'.")
        if watch_id in seen:
            raise ValueError(f"Watch duplicado: {watch_id}")
        seen.add(watch_id)
        if not url.startswith("https://"):
            raise ValueError(f"URL precisa ser HTTPS: {url}")
        if not is_official_url(url):
            raise ValueError(f"URL não classificada como oficial: {url}")
        host = urlparse(url).netloc.lower().split(":")[0]
        allowed = [str(item).strip() for item in (merged.get("allowed_domains") or [host]) if str(item).strip()]
        if not domain_allowed(url, allowed):
            raise ValueError(f"URL fora dos domínios permitidos: {url}")
        watches.append(
            WatchItem(
                id=watch_id,
                source_id=str(merged.get("source_id") or host),
                url=url,
                allowed_domains=allowed,
                text_selectors=[str(item) for item in (merged.get("text_selectors") or [])],
                link_patterns=[str(item) for item in (merged.get("link_patterns") or LINK_PATTERNS_DEFAULT)],
                max_links=int(merged.get("max_links") or 20),
                notes=(str(merged.get("notes")).strip() if merged.get("notes") else None),
            )
        )
    if not watches:
        raise ValueError(f"Nenhum watch válido em {path}")
    return watches


def run_watch(watch: WatchItem, scraper: Scraper, data_dir: Path, dry_run: bool) -> dict[str, Any]:
    snapshot_path = data_dir / "snapshots" / f"{watch.id}.json"
    previous = read_json(snapshot_path)
    page = scraper.fetch(watch.url)
    current = snapshot_from_page(watch, page)
    report = diff_snapshots(previous, current, watch)
    report["watch_id"] = watch.id

    if not dry_run:
        if previous is not None and report["changed"]:
            previous_path = data_dir / "snapshots" / f"{watch.id}.previous.json"
            write_json(previous_path, previous)
            stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
            report_path = data_dir / "changes" / f"{watch.id}-{stamp}.json"
            write_json(report_path, report)
            report["report_path"] = str(report_path.relative_to(data_dir))
        write_json(snapshot_path, current)

    return {
        "watch_id": watch.id,
        "source_id": watch.source_id,
        "url": watch.url,
        "status": "baseline" if report["baseline"] else ("changed" if report["changed"] else "unchanged"),
        "changed": report["changed"],
        "baseline": report["baseline"],
        "text_changed": report["text_changed"],
        "links_changed": report["links_changed"],
        "signals": report["signals"],
        "added": report["added"][:10],
        "removed": report["removed"][:10],
        "added_links": report["added_links"][:10],
        "removed_links": report["removed_links"][:10],
        "report_path": report.get("report_path"),
        "warnings": report["warnings"],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Monitor determinístico de fontes oficiais.")
    parser.add_argument("--watchlist", type=Path, default=None)
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--watch-id", action="append", default=[], help="Executa apenas estes IDs.")
    parser.add_argument("--dry-run", action="store_true", help="Não grava snapshots nem relatórios.")
    parser.add_argument("--json", action="store_true", help="Imprime o resumo em JSON.")
    args = parser.parse_args(argv)

    watchlist_path = args.watchlist
    if watchlist_path is None:
        watchlist_path = DEFAULT_WATCHLIST if DEFAULT_WATCHLIST.exists() else EXAMPLE_WATCHLIST
    if not watchlist_path.exists():
        print(f"Watchlist não encontrada: {watchlist_path}", file=sys.stderr)
        return 1

    try:
        watches = load_watchlist(watchlist_path)
    except (OSError, ValueError, yaml.YAMLError) as exc:
        print(f"Watchlist inválida: {exc}", file=sys.stderr)
        return 1

    selected = set(args.watch_id)
    if selected:
        watches = [watch for watch in watches if watch.id in selected]
        missing = selected - {watch.id for watch in watches}
        if missing:
            print(f"Watch IDs não encontrados: {', '.join(sorted(missing))}", file=sys.stderr)
            return 1

    settings = load_settings()
    settings.respect_robots = True
    summary: dict[str, Any] = {
        "started_at": now_iso(),
        "finished_at": None,
        "watchlist": str(watchlist_path),
        "dry_run": args.dry_run,
        "watches": [],
        "errors": [],
    }

    with Scraper(settings) as scraper:
        for watch in watches:
            try:
                summary["watches"].append(run_watch(watch, scraper, args.data_dir, args.dry_run))
            except RobotsDenied as exc:
                summary["errors"].append({"watch_id": watch.id, "url": watch.url, "error": f"robots.txt: {exc}"})
            except (FetchError, ValueError, OSError) as exc:
                summary["errors"].append({"watch_id": watch.id, "url": watch.url, "error": str(exc)})

    summary["finished_at"] = now_iso()
    if not args.dry_run:
        write_json(args.data_dir / "last-run.json", summary)

    if args.json:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    else:
        for item in summary["watches"]:
            print(f"[{item['status']}] {item['watch_id']} ({item['url']})")
            for signal in item["signals"]:
                print(f"  sinal: {signal}")
            for line in item["added"][:5]:
                print(f"  + {line[:180]}")
            for line in item["removed"][:5]:
                print(f"  - {line[:180]}")
            if item.get("report_path"):
                print(f"  relatório: {item['report_path']}")
        for error in summary["errors"]:
            print(f"[erro] {error['watch_id']}: {error['error']}", file=sys.stderr)

    return 0 if not summary["errors"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
