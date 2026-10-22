from __future__ import annotations

from typing import Any

from pipeline.models import ExtractedArticle
from pipeline.text import normalize, title_similarity


def collect_source_urls(post: dict[str, Any]) -> set[str]:
    urls: set[str] = set()
    for source in post.get("sourceUrls") or []:
        if isinstance(source, dict) and source.get("url"):
            urls.add(str(source["url"]).strip().rstrip("/"))
    return urls


def find_duplicate(
    existing_posts: list[dict[str, Any]],
    article: ExtractedArticle,
    title: str,
    slug: str,
    *,
    title_threshold: float = 0.9,
) -> tuple[bool, str, dict[str, Any] | None]:
    """Compara URL, hash, slug e título contra posts publicados e rascunhos."""
    article_urls = {article.url.rstrip("/"), article.canonical_url.rstrip("/")}
    for post in existing_posts:
        post_slug = str((post.get("slug") or "")).strip()
        if post_slug and post_slug == slug:
            return True, "slug já existe no Sanity", post
        if post.get("contentHash") and post["contentHash"] == article.text_hash:
            return True, "hash de conteúdo já existe no Sanity", post
        if collect_source_urls(post) & article_urls:
            return True, "URL de origem já existe no Sanity", post
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