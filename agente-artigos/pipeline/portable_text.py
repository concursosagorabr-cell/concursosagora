from __future__ import annotations

import re
from typing import Any


def _key(prefix: str, index: int) -> str:
    return f"{prefix}-{index}"


def _span(text: str, index: int, marks: list[str] | None = None) -> dict[str, Any]:
    return {
        "_type": "span",
        "_key": f"span-{index}",
        "text": text,
        "marks": marks or [],
    }


def _inline(text: str, mark_defs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Converte negrito, itálico, código e links em spans do Portable Text."""
    text = text or ""
    spans: list[dict[str, Any]] = []
    pattern = re.compile(
        r"(\*\*.+?\*\*|__.+?__|\*[^*]+?\*|_[^_]+?_|`[^`]+`|\[[^\]]+\]\([^)]+\))"
    )
    position = 0
    index = 0
    for match in pattern.finditer(text):
        if match.start() > position:
            spans.append(_span(text[position : match.start()], index))
            index += 1
        token = match.group(0)
        marks: list[str] = []
        content = token
        if token.startswith("**") and token.endswith("**"):
            marks = ["strong"]
            content = token[2:-2]
        elif token.startswith("__") and token.endswith("__"):
            marks = ["strong"]
            content = token[2:-2]
        elif token.startswith("*") and token.endswith("*"):
            marks = ["em"]
            content = token[1:-1]
        elif token.startswith("_") and token.endswith("_"):
            marks = ["em"]
            content = token[1:-1]
        elif token.startswith("`") and token.endswith("`"):
            marks = ["code"]
            content = token[1:-1]
        elif token.startswith("["):
            link = re.match(r"\[([^\]]+)\]\(([^)]+)\)", token)
            if link:
                label, href = link.group(1), link.group(2).strip()
                key = _key("link", len(mark_defs))
                mark_defs.append(
                    {
                        "_type": "link",
                        "_key": key,
                        "href": href,
                        "blank": href.startswith("http"),
                    }
                )
                marks = [key]
                content = label
        if content:
            spans.append(_span(content, index, marks))
            index += 1
        position = match.end()
    if position < len(text):
        spans.append(_span(text[position:], index))
    return spans or [_span(text, 0)]


def markdown_to_portable_text(markdown: str) -> list[dict[str, Any]]:
    """Conversor mínimo e previsível de Markdown para Portable Text.

    Suporta títulos ##/###, parágrafos, citações e listas com marcadores ou
    numeradas. Não tenta interpretar tabelas, imagens ou HTML.
    """
    blocks: list[dict[str, Any]] = []
    mark_defs: list[dict[str, Any]] = []
    paragraph: list[str] = []
    list_kind: str | None = None
    list_items: list[str] = []

    def flush_paragraph() -> None:
        nonlocal paragraph
        content = " ".join(part.strip() for part in paragraph if part.strip()).strip()
        if content:
            blocks.append(
                {
                    "_type": "block",
                    "_key": _key("block", len(blocks)),
                    "style": "normal",
                    "markDefs": [],
                    "children": _inline(content, mark_defs),
                }
            )
        paragraph = []

    def flush_list() -> None:
        nonlocal list_items, list_kind
        if not list_items:
            list_kind = None
            return
        for item in list_items:
            if not item.strip():
                continue
            blocks.append(
                {
                    "_type": "block",
                    "_key": _key("block", len(blocks)),
                    "style": "normal",
                    "listItem": list_kind or "bullet",
                    "level": 1,
                    "markDefs": [],
                    "children": _inline(item.strip(), mark_defs),
                }
            )
        list_items = []
        list_kind = None

    for raw_line in (markdown or "").replace("\r\n", "\n").split("\n"):
        line = raw_line.rstrip()
        stripped = line.strip()
        if not stripped:
            flush_paragraph()
            flush_list()
            continue

        heading = re.match(r"^(#{1,4})\s+(.+)$", stripped)
        if heading:
            flush_paragraph()
            flush_list()
            level = len(heading.group(1))
            style = {1: "h2", 2: "h2", 3: "h3", 4: "h4"}.get(level, "normal")
            blocks.append(
                {
                    "_type": "block",
                    "_key": _key("block", len(blocks)),
                    "style": style,
                    "markDefs": [],
                    "children": _inline(heading.group(2).strip(), mark_defs),
                }
            )
            continue

        quote = re.match(r"^>\s*(.+)$", stripped)
        if quote:
            flush_paragraph()
            flush_list()
            blocks.append(
                {
                    "_type": "block",
                    "_key": _key("block", len(blocks)),
                    "style": "blockquote",
                    "markDefs": [],
                    "children": _inline(quote.group(1).strip(), mark_defs),
                }
            )
            continue

        bullet = re.match(r"^[-*+]\s+(.+)$", stripped)
        numbered = re.match(r"^\d+[.)]\s+(.+)$", stripped)
        if bullet or numbered:
            flush_paragraph()
            kind = "bullet" if bullet else "number"
            if list_kind and list_kind != kind:
                flush_list()
            list_kind = kind
            list_items.append((bullet or numbered).group(1).strip())
            continue

        if list_kind:
            flush_list()
        paragraph.append(stripped)

    flush_paragraph()
    flush_list()

    # Remove markDefs que não foram usados por nenhum span.
    used = {
        mark
        for block in blocks
        for child in block.get("children", [])
        for mark in child.get("marks", [])
    }
    if mark_defs:
        mark_defs = [item for item in mark_defs if item["_key"] in used]
        for block in blocks:
            if block.get("style") == "normal":
                block["markDefs"] = []
    # Links precisam estar no markDefs do bloco onde aparecem.
    by_key = {item["_key"]: item for item in mark_defs}
    for block in blocks:
        keys = {
            mark
            for child in block.get("children", [])
            for mark in child.get("marks", [])
            if mark in by_key
        }
        if keys:
            block["markDefs"] = [by_key[key] for key in sorted(keys)]

    return blocks