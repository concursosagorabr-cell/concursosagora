"""Schema Pydantic do relatório de pesquisa.

Este módulo só é importado quando o worker OpenHands é executado. O monitor
determinístico e o validador não dependem de Pydantic.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class Fact(BaseModel):
    key: str = Field(description="Identificador curto do fato, ex.: vacancies_total.")
    value: str = Field(description="Valor factual encontrado no texto novo.")
    quote: str = Field(description="Trecho literal do texto novo que sustenta o valor.")
    page: int | None = Field(default=None, description="Página do PDF, se aplicável.")
    source_url: str = Field(description="URL oficial do snapshot.")
    status: Literal["supported", "conflict", "missing"] = Field(
        description="supported = quote resolve; conflict = fontes divergem; missing = sem evidência."
    )


class Change(BaseModel):
    field: str = Field(description="Campo alterado, ex.: registration_end.")
    old: str | None = Field(default=None, description="Valor anterior, se conhecido.")
    new: str | None = Field(default=None, description="Valor novo, se conhecido.")
    quote: str = Field(description="Trecho literal do texto novo que sustenta a mudança.")
    page: int | None = Field(default=None, description="Página do PDF, se aplicável.")
    source_url: str = Field(description="URL oficial do snapshot.")
    kind: str = Field(default="retificacao", description="retificacao, prazo, vagas, data, etc.")
    status: Literal["supported", "conflict", "missing"] = Field(
        description="supported = mudança comprovada; conflict = divergência; missing = sem evidência."
    )


class ConflictSource(BaseModel):
    url: str
    quote: str
    page: int | None = None


class Conflict(BaseModel):
    field: str = Field(description="Campo em conflito.")
    values: list[str] = Field(description="Valores divergentes encontrados.")
    sources: list[ConflictSource] = Field(description="Fontes e quotes de cada valor.")
    recommendation: str = Field(description="Ex.: omitir o campo até revisão humana.")


class ResearchReport(BaseModel):
    watch_id: str
    source_url: str
    content_hash: str = Field(description="Mesmo text_hash do snapshot.")
    checked_at: str
    overview: str = Field(description="Resumo objetivo do que mudou e do que não foi comprovado.")
    facts: list[Fact] = Field(default_factory=list)
    changes: list[Change] = Field(default_factory=list)
    conflicts: list[Conflict] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    requires_human_review: bool = True
