"""Atalho para o postador de artigos escritos pelo usuário.

Uso:
    python postar.py --list-categories --json
    python postar.py --bundle data/postador/meu-artigo.json
    python postar.py --bundle data/postador/meu-artigo.json --apply
    python postar.py --bundle data/postador/meu-artigo.json --publish
    python postar.py --bundle data/postador/meu-artigo.json --update
    python postar.py --bundle data/postador/meu-artigo.json --allow-duplicate --publish

Este atalho importa apenas ``pipeline.postador`` e evita carregar o Scrapling,
que é necessário somente para a coleta automática de fontes.
"""

from __future__ import annotations

import sys

from pipeline.postador import main


def _configure_console() -> None:
    """Garante UTF-8 no Windows, inclusive quando a saída é redirecionada."""
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass


if __name__ == "__main__":
    _configure_console()
    raise SystemExit(main())
