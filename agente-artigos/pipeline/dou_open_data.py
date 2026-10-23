from __future__ import annotations

import hashlib
import html
import logging
import re
import zipfile
from dataclasses import asdict, dataclass
from datetime import date
from pathlib import Path
from typing import Any
from urllib.parse import quote
from xml.etree import ElementTree as ET

log = logging.getLogger(__name__)

DOU_DETAIL_URL = "https://www.in.gov.br/web/dou/-/"
DOU_EDITION_URL = "https://www.in.gov.br/leiturajornal"
DOU_OPEN_DATA_PAGE = "https://www.in.gov.br/acesso-a-informacao/dados-abertos/base-de-dados"

ARTICLE_TAGS = {"article", "materia", "documento", "document", "materia"}
PARAGRAPH_TAGS = {"p", "paragrafo", "paragraph"}
TEXT_TAGS = {"texto", "text", "body", "articlebody", "conteudo"}


class DouOpenDataError(RuntimeError):
    """Arquivo oficial do DOU ausente, inválido ou não suportado."""


@dataclass(frozen=True)
class DouArticle:
    """Uma matéria do DOU importada de XML/ZIP oficial.

    O texto abaixo não substitui a versão certificada em PDF. Ele serve para
    extração determinística e para a ficha de evidências do pipeline.
    """

    id: str
    title: str
    summary: str
    body_text: str
    published_at: str | None
    art_type: str
    hierarchy: str
    section: str
    edition_date: str | None
    url: str
    source_file: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, value: dict[str, Any]) -> "DouArticle":
        allowed = {field for field in cls.__dataclass_fields__}
        return cls(**{key: value.get(key) for key in allowed})


def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1].lower()


def _key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (value or "").lower())


def _clean(value: str) -> str:
    text = html.unescape(value or "").replace("\xa0", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _text(node: ET.Element) -> str:
    return _clean(" ".join(node.itertext()))


def _paragraphs(node: ET.Element) -> str:
    """Extrai parágrafos sem duplicar o texto do contêiner e do filho."""
    for tags in (PARAGRAPH_TAGS, TEXT_TAGS):
        parts: list[str] = []
        for child in node.iter():
            if _local(child.tag) not in tags:
                continue
            value = _text(child)
            if value and (not parts or value != parts[-1]):
                parts.append(value)
        if parts:
            return "\n\n".join(parts)
    return _text(node)


def _field(node: ET.Element, *names: str) -> str:
    """Localiza um campo por tag, classe, id ou atributo, sem namespace fixo."""
    wanted = {_key(name) for name in names}
    for child in node.iter():
        tokens = {_key(_local(child.tag))}
        tokens.update(_key(token) for token in (child.get("class") or "").split())
        tokens.update(_key(token) for token in (child.get("id") or "").split())
        if tokens & wanted:
            value = _text(child)
            if value:
                return value
        for attr, value in child.attrib.items():
            if _key(_local(attr)) in wanted and str(value).strip():
                return _clean(str(value))
            if _key(_local(attr)) in {"name", "key", "property"} and _key(str(value)) in wanted:
                content = child.get("content") or _text(child)
                if content:
                    return _clean(str(content))
    return ""


def _first_line(value: str) -> str:
    for line in (value or "").splitlines():
        line = _clean(line).strip(" -–—|")
        if line:
            return line
    return ""


def normalize_section(value: str | None) -> str:
    text = (value or "").strip().lower()
    match = re.search(r"(?:do|se[cç][aã]o|s)\s*0?([123])\b", text)
    if match:
        return f"do{match.group(1)}"
    if text in {"1", "2", "3"}:
        return f"do{text}"
    return "do3"


def _iso_date(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, date):
        return value.isoformat()
    text = str(value).strip()
    if not text:
        return None
    match = re.search(r"\b(\d{4})-(\d{2})-(\d{2})", text)
    if match:
        return f"{match.group(1)}-{match.group(2)}-{match.group(3)}"
    match = re.search(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b", text)
    if match:
        day, month, year = (int(match.group(1)), int(match.group(2)), int(match.group(3)))
        try:
            return date(year, month, day).isoformat()
        except ValueError:
            return None
    return None


def _date_from_text(text: str) -> str | None:
    return _iso_date(text)


def _article_nodes(root: ET.Element) -> list[ET.Element]:
    if _local(root.tag) in ARTICLE_TAGS:
        return [root]
    nodes = [node for node in root.iter() if _local(node.tag) in ARTICLE_TAGS]
    if nodes:
        return nodes
    return [root]


def _article_from_node(
    node: ET.Element,
    *,
    section: str,
    edition_date: str | None,
    source_file: str,
) -> DouArticle | None:
    title = _field(node, "identifica", "titulo", "title", "headline", "nome")
    body = _paragraphs(node)
    if not title:
        title = _first_line(body)
    if not title:
        return None

    if body.startswith(title):
        body = body[len(title) :].lstrip(" -–—:|\n")

    summary = _field(node, "ementa", "subtitulo", "summary", "description")
    if not summary:
        paragraphs = [part for part in body.split("\n\n") if part.strip()]
        if len(paragraphs) > 1:
            summary = paragraphs[0]

    url_title = _field(node, "urltitle", "url_title", "slug")
    raw_id = _field(node, "id", "identifier", "identificador")
    if not url_title and raw_id and re.search(r"[a-zA-Z]", raw_id) and " " not in raw_id:
        url_title = raw_id
    article_id = _key(url_title or raw_id) or hashlib.sha256(
        f"{title}\n{body[:1000]}".encode("utf-8")
    ).hexdigest()[:16]

    published_raw = _field(
        node,
        "pubdate",
        "publicationdate",
        "dataPublicacao",
        "published",
        "date",
    )
    published_at = _date_from_text(published_raw) or edition_date
    article_section = normalize_section(_field(node, "section", "secao", "jornal") or section)
    article_edition = edition_date

    if url_title:
        url = DOU_DETAIL_URL + quote(url_title.strip(), safe="-_.~")
    else:
        query_date = article_edition or ""
        url = (
            f"{DOU_EDITION_URL}?data={quote(query_date)}&secao={article_section}"
            f"#artigo-{article_id}"
        )

    return DouArticle(
        id=article_id,
        title=_clean(title)[:500],
        summary=_clean(summary)[:1200],
        body_text=body,
        published_at=published_at,
        art_type=_clean(_field(node, "arttype", "art_type", "tipo", "type"))[:120],
        hierarchy=_clean(
            _field(node, "hierarchystr", "hierarchy", "hierarquia", "orgao", "orgaosuperior")
        )[:300],
        section=article_section,
        edition_date=article_edition,
        url=url,
        source_file=source_file,
    )


def parse_dou_xml(
    payload: bytes | str,
    *,
    section: str = "do3",
    edition_date: str | date | None = None,
    source_file: str = "",
    target_date: str | date | None = None,
) -> list[DouArticle]:
    """Interpreta um XML de matéria ou de edição completa do DOU."""
    try:
        root = ET.fromstring(payload)
    except ET.ParseError as exc:
        raise DouOpenDataError(f"XML do DOU inválido em {source_file or 'arquivo'}: {exc}") from exc

    edition = _iso_date(edition_date)
    target = _iso_date(target_date)
    normalized_section = normalize_section(section)
    articles: list[DouArticle] = []
    seen: set[tuple[str, str, str | None]] = set()

    for node in _article_nodes(root):
        item = _article_from_node(
            node,
            section=normalized_section,
            edition_date=edition,
            source_file=source_file,
        )
        if item is None:
            continue
        signature = (item.title, item.body_text[:200], item.published_at)
        if signature in seen:
            continue
        seen.add(signature)
        if item.section != normalized_section:
            continue
        if target and item.published_at and item.published_at[:10] != target:
            continue
        articles.append(item)

    return articles


def parse_dou_archive(
    path: Path | str,
    *,
    section: str = "do3",
    edition_date: str | date | None = None,
    target_date: str | date | None = None,
) -> list[DouArticle]:
    """Lê um ZIP oficial (com vários XMLs) ou um XML individual."""
    archive = Path(path).expanduser()
    if not archive.exists():
        raise DouOpenDataError(f"Arquivo do DOU não encontrado: {archive}")
    edition = _iso_date(edition_date)
    target = _iso_date(target_date)

    if archive.suffix.lower() == ".xml":
        return parse_dou_xml(
            archive.read_bytes(),
            section=section,
            edition_date=edition,
            source_file=str(archive),
            target_date=target,
        )

    if archive.suffix.lower() != ".zip":
        raise DouOpenDataError(
            f"Formato não suportado: {archive.suffix}. Use o XML/ZIP oficial do DOU; "
            "PDF não é extraído por este conector."
        )

    try:
        with zipfile.ZipFile(archive) as bundle:
            names = [
                name
                for name in bundle.namelist()
                if name.lower().endswith(".xml") and not name.startswith("__MACOSX/")
            ]
            if not names:
                raise DouOpenDataError(f"O ZIP não contém XML: {archive}")
            articles: list[DouArticle] = []
            for name in names:
                try:
                    articles.extend(
                        parse_dou_xml(
                            bundle.read(name),
                            section=section,
                            edition_date=edition,
                            source_file=f"{archive}!{name}",
                            target_date=target,
                        )
                    )
                except DouOpenDataError as exc:
                    log.warning("XML do DOU ignorado em %s: %s", name, exc)
    except zipfile.BadZipFile as exc:
        raise DouOpenDataError(f"ZIP do DOU inválido: {archive}") from exc

    if not articles:
        raise DouOpenDataError(
            f"Nenhuma matéria do DOU encontrada em {archive}. "
            "Confira a seção, a data e o conteúdo do XML."
        )
    return sorted(articles, key=lambda item: (item.published_at or "", item.title))


def find_dou_archive(
    directory: Path | str,
    *,
    target_date: str | date | None = None,
    section: str = "do3",
) -> Path:
    """Localiza o ZIP/XML mais recente (ou o que casa com a data) na pasta."""
    base = Path(directory).expanduser()
    if not base.exists():
        raise DouOpenDataError(
            f"Pasta de importação do DOU não encontrada: {base}. "
            "Baixe o XML/ZIP oficial e coloque nela, ou use --dou-file."
        )
    candidates = sorted(
        [
            path
            for path in base.iterdir()
            if path.is_file() and path.suffix.lower() in {".zip", ".xml"}
        ],
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    if not candidates:
        raise DouOpenDataError(
            f"Nenhum XML/ZIP do DOU em {base}. Baixe o arquivo oficial em "
            f"{DOU_OPEN_DATA_PAGE} e use --dou-file, ou coloque-o nessa pasta."
        )

    target = _iso_date(target_date)
    if target:
        date_tokens = (
            target,
            target.replace("-", "_"),
            target.replace("-", ""),
            date.fromisoformat(target).strftime("%d-%m-%Y"),
        )
        exact = [
            path
            for path in candidates
            if any(token.lower() in path.name.lower() for token in date_tokens)
        ]
        if exact:
            return exact[0]
    return candidates[0]


def import_help(import_dir: Path | str) -> str:
    return (
        "O DOU não deve ser raspado pelo HTML (robots: Disallow: /). "
        f"Baixe o XML/ZIP oficial em {DOU_OPEN_DATA_PAGE} "
        f"(ou no INLABS, quando disponível) e importe com --dou-file. "
        f"Pasta padrão: {Path(import_dir).expanduser()}"
    )
