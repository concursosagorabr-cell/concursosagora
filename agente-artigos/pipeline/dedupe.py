from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pipeline.models import ExtractedArticle
from pipeline.text import title_similarity

TRACKING_PARAMS = {
    "fbclid",
    "gclid",
    "gbraid",
    "wbraid",
    "mc_cid",
    "mc_eid",
    "igshid",
    "ref",
    "referrer",
    "source",
}

TRACKING_PREFIXES = ("utm_", "pk_", "mtm_", "hsa_")


def _is_tracking_param(name: str) -> bool:
    key = name.strip().lower()
    return key in TRACKING_PARAMS or key.startswith(TRACKING_PREFIXES)


def normalize_url(url: str) -> str:
    """Normaliza URLs para comparar a mesma fonte sem variações de rastreio.

    Não remove caminhos nem parâmetros funcionais: a URL normalizada continua
    apontando para o mesmo documento. Apenas scheme/host, fragmento, barra
    final, parâmetros de campanha e parâmetros repetidos são padronizados.
    """
    raw = str(url or "").strip()
    if not raw:
        return ""
    if "://" not in raw:
        raw = "https://" + raw.lstrip("/")
    parts = urlsplit(raw)
    scheme = (parts.scheme or "https").lower()
    host = (parts.hostname or "").lower().strip(".")
    if host.startswith("www."):
        host = host[4:]
    if not host:
        return ""
    port = parts.port
    if port and not ((scheme == "http" and port == 80) or (scheme == "https" and port == 443)):
        netloc = f"{host}:{port}"
    else:
        netloc = host
    path = re.sub(r"/{2,}", "/", parts.path or "")
    if path != "/":
        path = path.rstrip("/")
    query_pairs = [
        (key, value)
        for key, value in parse_qsl(parts.query, keep_blank_values=True)
        if not _is_tracking_param(key)
    ]
    query = urlencode(sorted(query_pairs), doseq=True)
    return urlunsplit((scheme, netloc, path, query, ""))


def _clean_slug(value: str) -> str:
    return re.sub(r"[^a-z0-9._-]+", "", value.strip().lower()).strip(".-_")


def contest_key_from_url(url: str) -> str:
    """Extrai uma chave estável do concurso a partir da URL oficial.

    A chave é usada para o intervalo mínimo entre matérias sobre o mesmo
    certame. Quando não há um identificador confiável, devolve string vazia:
    é melhor não bloquear do que juntar concursos diferentes na mesma chave.
    """
    normalized = normalize_url(url)
    if not normalized:
        return ""
    parts = urlsplit(normalized)
    host = parts.hostname or ""
    segments = [segment for segment in parts.path.split("/") if segment]

    if host.endswith("fgv.br") or host.endswith("fgv.io"):
        lower = [segment.lower() for segment in segments]
        if lower and lower[0] in {"concursos", "processoseletivo"} and len(lower) >= 2:
            slug = _clean_slug(lower[1])
            return f"fgv:{slug}" if slug else ""
        if lower and lower[0] == "exames" and len(lower) >= 2:
            exam = _clean_slug(lower[1])
            edition = _clean_slug(lower[2]) if len(lower) >= 3 else ""
            if exam:
                return f"fgv:{exam}:{edition}" if edition else f"fgv:{exam}"
        if lower and lower[0] == "cpnu2":
            return "fgv:cpnu2"
        return ""

    if host.endswith("vunesp.com.br"):
        for segment in segments:
            code = _clean_slug(segment)
            if code and re.search(r"[a-z]", code) and re.search(r"\d", code):
                return f"vunesp:{code.upper()}"
        return ""

    if host.endswith("cebraspe.org.br") or host.endswith("cebraspe.org"):
        for index, segment in enumerate(segments):
            if segment.lower() in {"concurso", "concursos"} and index + 1 < len(segments):
                code = _clean_slug(segments[index + 1])
                if code:
                    return f"cebraspe:{code}"
        return ""

    # Fontes governamentais e demais bancas: usa host + caminho, que é estável
    # para a página do certame e não colide com outros concursos do mesmo site.
    if host == "gov.br" or host.endswith(".gov.br"):
        lower = [segment.lower() for segment in segments]
        # Notícias de portais gov.br têm URL por matéria. Usar só os primeiros
        # segmentos agruparia todas as notícias do órgão na mesma chave e o
        # cooldown bloquearia pautas diferentes por 15 dias.
        if "noticias" in lower:
            path = "/".join(segments)
            return f"govbr:{host}/{path}" if path else f"govbr:{host}"
        path = "/".join(segments[:4])
        return f"govbr:{host}/{path}" if path else f"govbr:{host}"
    return ""


def post_contest_keys(post: dict[str, Any]) -> set[str]:
    keys: set[str] = set()
    explicit = str(post.get("contestKey") or "").strip().lower()
    if explicit:
        keys.add(explicit)
    for source in post.get("sourceUrls") or []:
        if isinstance(source, dict):
            key = contest_key_from_url(str(source.get("url") or ""))
            if key:
                keys.add(key)
    return keys


def _post_reference_date(post: dict[str, Any]) -> datetime | None:
    for field in ("publishedAt", "_updatedAt", "_createdAt"):
        value = post.get(field)
        if not value:
            continue
        try:
            parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except ValueError:
            continue
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    return None


def find_recent_contest_coverage(
    existing_posts: list[dict[str, Any]],
    contest_key: str,
    *,
    cooldown_days: int = 15,
    now: datetime | None = None,
) -> dict[str, Any] | None:
    """Retorna o post mais recente do mesmo concurso dentro do cooldown.

    Posts sem data são tratados como recentes (bloqueiam), porque não há como
    provar que estão fora da janela. Posts mais antigos que o cooldown são
    permitidos: a nova matéria pode trazer informação relevante.
    """
    key = str(contest_key or "").strip().lower()
    if not key:
        return None
    reference = now or datetime.now(timezone.utc)
    if reference.tzinfo is None:
        reference = reference.replace(tzinfo=timezone.utc)
    cutoff = reference - timedelta(days=max(0, int(cooldown_days)))
    matches: list[tuple[datetime, dict[str, Any]]] = []
    for post in existing_posts:
        if key not in post_contest_keys(post):
            continue
        published = _post_reference_date(post)
        if published is None:
            return post
        if published >= cutoff:
            matches.append((published, post))
    if not matches:
        return None
    matches.sort(key=lambda item: item[0], reverse=True)
    return matches[0][1]


def collect_source_urls(post: dict[str, Any]) -> set[str]:
    urls: set[str] = set()
    for source in post.get("sourceUrls") or []:
        if isinstance(source, dict) and source.get("url"):
            normalized = normalize_url(str(source["url"]))
            if normalized:
                urls.add(normalized)
    return urls


def find_duplicate(
    existing_posts: list[dict[str, Any]],
    article: ExtractedArticle,
    title: str,
    slug: str,
    *,
    title_threshold: float = 0.9,
    contest_key: str | None = None,
    cooldown_days: int = 15,
    extra_urls: list[str] | None = None,
    now: datetime | None = None,
) -> tuple[bool, str, dict[str, Any] | None]:
    """Compara URL, hash, slug, concurso recente e título contra posts e rascunhos."""
    article_urls = {
        normalize_url(url)
        for url in [article.url, article.canonical_url, *(extra_urls or [])]
        if normalize_url(url)
    }
    for post in existing_posts:
        post_slug = str((post.get("slug") or "")).strip()
        if post_slug and post_slug == slug:
            return True, "slug já existe no Sanity", post
        if post.get("contentHash") and post["contentHash"] == article.text_hash:
            return True, "hash de conteúdo já existe no Sanity", post
        if collect_source_urls(post) & article_urls:
            return True, "URL de origem já existe no Sanity", post
    if contest_key:
        recent = find_recent_contest_coverage(
            existing_posts,
            contest_key,
            cooldown_days=cooldown_days,
            now=now,
        )
        if recent is not None:
            return (
                True,
                f"mesmo concurso já coberto nos últimos {cooldown_days} dias",
                recent,
            )
    for post in existing_posts:
        existing_title = str(post.get("title") or "")
        if existing_title and title:
            similarity = title_similarity(existing_title, title)
            if similarity >= title_threshold:
                return True, f"título muito semelhante ({similarity:.0%}) a um post existente", post
    return False, "", None


def normalize_slug_candidate(slug: str, existing_slugs: set[str], base_slug: str | None = None) -> str:
    """Garante slug único para o rascunho sem tocar nos posts existentes."""
    base = base_slug or slug
    if slug and slug not in existing_slugs:
        return slug
    for suffix in range(2, 100):
        candidate = f"{base[:90]}-{suffix}"
        if candidate not in existing_slugs:
            return candidate
    return f"{base[:80]}-{abs(hash(base)) % 100000}"
