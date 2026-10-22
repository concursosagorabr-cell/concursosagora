from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class SourceConfig:
    """Configuração de uma fonte oficial de concursos."""

    id: str
    name: str
    type: str
    enabled: bool = True
    start_urls: list[str] = field(default_factory=list)
    allowed_domains: list[str] = field(default_factory=list)
    link_pattern: str | None = None
    include_keywords: list[str] = field(default_factory=list)
    exclude_keywords: list[str] = field(default_factory=list)
    preferred_keywords: list[str] = field(default_factory=list)
    default_categories: list[str] = field(default_factory=list)
    default_organ: str | None = None
    default_sphere: str | None = None
    section: str = "do3"
    max_candidates: int = 20
    options: dict[str, Any] = field(default_factory=dict)
    tier: str = "official_primary"
    usage: str = "article"
    official_domains: list[str] = field(default_factory=list)
    notes: str | None = None

    @property
    def is_official(self) -> bool:
        return self.tier in {"official_primary", "official_secondary"}

    @property
    def can_generate_article(self) -> bool:
        return self.is_official and self.usage == "article"


@dataclass
class Candidate:
    """Item de fonte descoberto, ainda sem artigo completo."""

    url: str
    source_id: str
    title: str | None = None
    published_at: str | None = None
    summary: str | None = None
    score: float = 0.0
    metadata: dict[str, Any] = field(default_factory=dict)
    official_url: str | None = None
    discovered_via: str | None = None
    corroborating_urls: list[str] = field(default_factory=list)


@dataclass
class ExtractedArticle:
    """Artigo-fonte limpo e fatos determinísticos extraídos."""

    source_id: str
    source_name: str
    url: str
    canonical_url: str
    title: str
    published_at: str | None
    summary: str
    body_text: str
    image_url: str | None
    image_alt: str | None
    facts: dict[str, Any]
    text_hash: str
    fetched_at: str
    metadata: dict[str, Any] = field(default_factory=dict)
    source_tier: str = "official_primary"
    fact_evidence: dict[str, list[dict[str, Any]]] = field(default_factory=dict)
    verification: dict[str, Any] = field(default_factory=dict)

    @property
    def full_text(self) -> str:
        return "\n\n".join(x for x in (self.summary, self.body_text) if x).strip()


@dataclass
class GeneratedArticle:
    """Saída editorial do modelo, já validada."""

    title: str
    slug: str
    excerpt: str
    body_markdown: str
    seo_description: str
    keywords: list[str]
    category_slugs: list[str]
    status: str | None
    education_level: list[str]
    organ: str | None
    banca: str | None
    state_uf: str | None
    city_name: str | None
    model: str
    usage: dict[str, Any]
    warnings: list[str]
    score: int
    body_word_count: int
    raw: dict[str, Any] = field(default_factory=dict)
    blocking: list[str] = field(default_factory=list)
    verification: dict[str, Any] = field(default_factory=dict)


@dataclass
class ItemResult:
    """Resultado do processamento de um candidato."""

    url: str
    source_id: str
    status: str
    message: str = ""
    slug: str | None = None
    sanity_id: str | None = None
    article_title: str | None = None
    warnings: list[str] = field(default_factory=list)
    fact_check_score: int | None = None
    content_hash: str | None = None
    facts: dict[str, Any] = field(default_factory=dict)
    generated: dict[str, Any] = field(default_factory=dict)
    verification: dict[str, Any] = field(default_factory=dict)


@dataclass
class RunStats:
    """Resumo de uma execução do pipeline."""

    run_id: str
    started_at: str
    finished_at: str | None = None
    discovered: int = 0
    processed: int = 0
    created: int = 0
    skipped: int = 0
    duplicates: int = 0
    errors: int = 0
    dry_run: bool = False
    items: list[ItemResult] = field(default_factory=list)