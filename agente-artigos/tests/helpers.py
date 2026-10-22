from __future__ import annotations

from pathlib import Path

from pipeline.config import Settings
from pipeline.models import ExtractedArticle, GeneratedArticle


def make_settings(**overrides) -> Settings:
    values = {
        "sanity_project_id": "test",
        "sanity_dataset": "production",
        "sanity_api_version": "2026-07-25",
        "sanity_token": "token",
        "sanity_read_token": "",
        "groq_keys": ["test-key"],
        "groq_model": "openai/gpt-oss-120b",
        "frontend_url": "",
        "min_content_words": 80,
        "fact_check_two_source_rule": False,
        "data_dir": Path("data"),
    }
    values.update(overrides)
    return Settings(**values)


def make_article(
    *,
    facts: dict | None = None,
    title: str = "Notícia oficial sobre concurso público",
    summary: str = "",
    body_text: str = "",
    source_id: str = "test",
    source_tier: str = "official_primary",
) -> ExtractedArticle:
    return ExtractedArticle(
        source_id=source_id,
        source_name="Fonte oficial",
        url="https://example.com/noticia",
        canonical_url="https://example.com/noticia",
        title=title,
        published_at="2026-10-20T12:00:00+00:00",
        summary=summary or title,
        body_text=body_text or summary or title,
        image_url=None,
        image_alt=None,
        facts=facts or {},
        text_hash="a" * 64,
        fetched_at="2026-10-20T12:00:00+00:00",
        source_tier=source_tier,
    )


def make_generated(**overrides) -> GeneratedArticle:
    values = {
        "title": "Título de teste sobre concurso público",
        "slug": "titulo-de-teste",
        "excerpt": "Resumo de teste.",
        "body_markdown": "Corpo de teste.",
        "seo_description": "Descrição de teste.",
        "keywords": ["concurso"],
        "category_slugs": [],
        "status": "previsto",
        "education_level": [],
        "organ": None,
        "banca": None,
        "state_uf": None,
        "city_name": None,
        "model": "openai/gpt-oss-120b",
        "usage": {},
        "warnings": [],
        "score": 100,
        "body_word_count": 3,
        "raw": {},
    }
    values.update(overrides)
    return GeneratedArticle(**values)


def long_body(prefix: str = "") -> str:
    base = (
        "O órgão oficial divulgou informações sobre o processo seletivo e orientou os "
        "candidatos a acompanharem os canais oficiais. A publicação traz dados sobre "
        "vagas, datas e procedimentos previstos no comunicado. Novas atualizações serão "
        "divulgadas oportunamente pela instituição responsável. "
    )
    return (prefix + " " + base).strip()
