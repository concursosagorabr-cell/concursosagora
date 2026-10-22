"""Utilitários de I/O compartilhados pelo monitor, validador e worker.

Este módulo não importa Scrapling nem OpenHands, para permitir que o worker
rode em um venv separado sem as dependências do pipeline.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

FORBIDDEN_HOSTS = ("documento.vunesp.com.br",)


def read_json(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def write_json(path: Path, payload: dict[str, Any] | list[Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(path)
