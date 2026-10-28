from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from pathlib import Path

import yaml
from dotenv import dotenv_values

from pipeline.models import SourceConfig

PACKAGE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = PACKAGE_DIR.parent
WORKSPACE_DIR = PROJECT_DIR.parent
FRONTEND_DIR = WORKSPACE_DIR / "concursosagora-main"
DEFAULT_ENV_FILES = [FRONTEND_DIR / ".env.local", PROJECT_DIR / ".env.local"]
DEFAULT_SOURCES_FILE = PROJECT_DIR / "sources.yaml"

GROQ_KEY_PATTERN = re.compile(r"gsk_[A-Za-z0-9]+")


class ConfigError(RuntimeError):
    pass


@dataclass
class Settings:
    sanity_project_id: str
    sanity_dataset: str
    sanity_api_version: str
    sanity_token: str
    sanity_read_token: str
    groq_keys: list[str]
    groq_model: str
    frontend_url: str
    auto_publish: bool = False
    min_content_words: int = 300  # Aumentado para garantir conteúdo substancial
    max_articles_per_run: int = 10
    fact_check_min_score: int = 92  # Mais rigoroso
    fact_check_two_source_rule: bool = True
    fact_check_max_repair_attempts: int = 2
    require_official_source: bool = True
    require_fact_evidence: bool = True
    block_on_fact_conflict: bool = True
    verification_min_score: int = 97  # Mais rigoroso
    contest_cooldown_days: int = 15
    scrape_interval_hours: int = 2
    fetch_timeout: int = 60
    request_delay: float = 1.0
    respect_robots: bool = True
    max_source_chars: int = 14000
    # Novas configurações de qualidade
    strict_cross_validation: bool = True  # Validação cruzada ficha técnica vs corpo
    reject_stale_news: bool = True  # Rejeita notícias velhas republicadas no presente
    max_news_age_days: int = 30  # Notícias mais velhas que isso precisam revisão manual
    data_dir: Path = field(default_factory=lambda: PROJECT_DIR / "data")
    sources_file: Path = field(default_factory=lambda: DEFAULT_SOURCES_FILE)
    dou_import_dir: Path = field(default_factory=lambda: PROJECT_DIR / "data" / "dou")
    env: dict[str, str] = field(default_factory=dict)

    @property
    def sanity_configured(self) -> bool:
        return bool(self.sanity_project_id and self.sanity_dataset and self.sanity_token)

    @property
    def groq_configured(self) -> bool:
        return bool(self.groq_keys and self.groq_model)

    def validate_sanity(self) -> None:
        missing = [
            name
            for name, value in (
                ("NEXT_PUBLIC_SANITY_PROJECT_ID", self.sanity_project_id),
                ("NEXT_PUBLIC_SANITY_DATASET", self.sanity_dataset),
                ("SANITY_API_TOKEN", self.sanity_token),
            )
            if not value
        ]
        if missing:
            raise ConfigError(f"Variáveis Sanity ausentes: {', '.join(missing)}")

    def validate_groq(self) -> None:
        if not self.groq_keys:
            raise ConfigError("Nenhuma chave Groq encontrada (GROQ_API_KEY/GROQ_API_KEYS/GROQ_WRITER_KEYS).")


def _read_env_files(env_files: list[Path] | None = None) -> dict[str, str]:
    env: dict[str, str] = {}
    for path in env_files or DEFAULT_ENV_FILES:
        if not path.exists():
            continue
        for key, value in dotenv_values(path, encoding="utf-8").items():
            if value is not None:
                env[key] = value
    # Variáveis do sistema têm precedência (CI, containers, execução manual).
    for key, value in os.environ.items():
        if value and key not in env:
            env[key] = value
    return env


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on", "sim"}


def _as_int(value: str | None, default: int) -> int:
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return default


def _as_float(value: str | None, default: float) -> float:
    try:
        return float(str(value).replace(",", ".").strip())
    except (TypeError, ValueError):
        return default


def _groq_keys(env: dict[str, str]) -> list[str]:
    keys: list[str] = []
    for name in ("GROQ_WRITER_KEYS", "GROQ_API_KEYS", "GROQ_API_KEY", "GROQ_VIGILANTE_KEYS"):
        keys.extend(GROQ_KEY_PATTERN.findall(env.get(name, "") or ""))
    # Também aceita chaves separadas por vírgula sem o prefixo gsk_.
    for name in ("GROQ_API_KEY", "GROQ_API_KEYS"):
        raw = env.get(name, "") or ""
        for token in re.split(r"[\s,;]+", raw):
            token = token.strip().strip('"').strip("'")
            if token and token not in keys:
                keys.append(token)
    seen: set[str] = set()
    unique: list[str] = []
    for key in keys:
        if key not in seen:
            seen.add(key)
            unique.append(key)
    return unique


def load_settings(env_files: list[Path] | None = None, sources_file: Path | None = None) -> Settings:
    env = _read_env_files(env_files)
    model = (env.get("GROQ_MODEL") or "openai/gpt-oss-120b").strip()
    if model.startswith("groq/"):
        model = model[len("groq/") :]
    data_dir = Path(env.get("PIPELINE_DATA_DIR") or (PROJECT_DIR / "data")).expanduser()
    return Settings(
        sanity_project_id=(env.get("NEXT_PUBLIC_SANITY_PROJECT_ID") or "").strip(),
        sanity_dataset=(env.get("NEXT_PUBLIC_SANITY_DATASET") or "production").strip(),
        sanity_api_version=(env.get("NEXT_PUBLIC_SANITY_API_VERSION") or "2026-07-25").strip(),
        sanity_token=(env.get("SANITY_API_TOKEN") or env.get("SANITY_API_READ_TOKEN") or "").strip(),
        sanity_read_token=(env.get("SANITY_API_READ_TOKEN") or "").strip(),
        groq_keys=_groq_keys(env),
        groq_model=model or "openai/gpt-oss-120b",
        frontend_url=(env.get("FRONTEND_URL") or env.get("NEXT_PUBLIC_SITE_URL") or "").strip(),
        auto_publish=_as_bool(env.get("AUTO_PUBLISH"), False),
        min_content_words=_as_int(env.get("MIN_CONTENT_WORDS"), 200),
        max_articles_per_run=_as_int(env.get("MAX_ARTICLES_PER_RUN"), 10),
        fact_check_min_score=_as_int(env.get("FACT_CHECK_MIN_SCORE"), 90),
        fact_check_two_source_rule=_as_bool(env.get("FACT_CHECK_TWO_SOURCE_RULE"), True),
        fact_check_max_repair_attempts=_as_int(env.get("FACT_CHECK_MAX_REPAIR_ATTEMPTS"), 2),
        require_official_source=_as_bool(env.get("REQUIRE_OFFICIAL_SOURCE"), True),
        require_fact_evidence=_as_bool(env.get("REQUIRE_FACT_EVIDENCE"), True),
        block_on_fact_conflict=_as_bool(env.get("BLOCK_ON_FACT_CONFLICT"), True),
        verification_min_score=_as_int(env.get("VERIFICATION_MIN_SCORE"), 95),
        contest_cooldown_days=_as_int(env.get("CONTEST_COOLDOWN_DAYS"), 15),
        scrape_interval_hours=_as_int(env.get("SCRAPE_INTERVAL_HOURS"), 2),
        fetch_timeout=_as_int(env.get("PIPELINE_FETCH_TIMEOUT"), 60),
        request_delay=_as_float(env.get("PIPELINE_REQUEST_DELAY"), 1.0),
        respect_robots=_as_bool(env.get("PIPELINE_RESPECT_ROBOTS"), True),
        max_source_chars=_as_int(env.get("PIPELINE_MAX_SOURCE_CHARS"), 14000),
        data_dir=data_dir,
        sources_file=sources_file or DEFAULT_SOURCES_FILE,
        dou_import_dir=Path(env.get("DOU_IMPORT_DIR") or (data_dir / "dou")).expanduser(),
        env=env,
    )


def load_sources(path: Path | None = None) -> list[SourceConfig]:
    source_path = path or DEFAULT_SOURCES_FILE
    if not source_path.exists():
        raise ConfigError(f"Arquivo de fontes não encontrado: {source_path}")
    raw = yaml.safe_load(source_path.read_text(encoding="utf-8")) or {}
    entries = raw.get("sources", raw if isinstance(raw, list) else [])
    sources: list[SourceConfig] = []
    seen: set[str] = set()
    for entry in entries:
        if not isinstance(entry, dict) or not entry.get("id"):
            continue
        source_id = str(entry["id"]).strip()
        if source_id in seen:
            raise ConfigError(f"Fonte duplicada em sources.yaml: {source_id}")
        seen.add(source_id)
        sources.append(
            SourceConfig(
                id=source_id,
                name=str(entry.get("name") or source_id),
                type=str(entry.get("type") or "").strip(),
                enabled=bool(entry.get("enabled", True)),
                start_urls=list(entry.get("start_urls") or []),
                allowed_domains=list(entry.get("allowed_domains") or []),
                link_pattern=entry.get("link_pattern"),
                include_keywords=[str(x) for x in entry.get("include_keywords") or []],
                exclude_keywords=[str(x) for x in entry.get("exclude_keywords") or []],
                preferred_keywords=[str(x) for x in entry.get("preferred_keywords") or []],
                default_categories=[str(x) for x in entry.get("default_categories") or []],
                default_organ=entry.get("default_organ"),
                default_sphere=entry.get("default_sphere"),
                section=str(entry.get("section") or "do3"),
                max_candidates=int(entry.get("max_candidates") or 20),
                options=dict(entry.get("options") or {}),
                tier=str(entry.get("tier") or "official_primary").strip(),
                usage=str(entry.get("usage") or "article").strip(),
                official_domains=[str(x) for x in entry.get("official_domains") or []],
                notes=(str(entry.get("notes")).strip() if entry.get("notes") else None),
            )
        )
    for source in sources:
        if source.tier not in {"official_primary", "official_secondary", "journalism", "aggregator"}:
            raise ConfigError(f"Tier inválido para a fonte {source.id}: {source.tier}")
        if source.usage not in {"article", "discovery"}:
            raise ConfigError(f"Uso inválido para a fonte {source.id}: {source.usage}")
        if source.usage == "article" and not source.is_official:
            raise ConfigError(
                f"A fonte {source.id} é {source.tier} e não pode gerar artigos; use usage=discovery."
            )
    return sources