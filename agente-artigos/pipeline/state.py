from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pipeline.models import ItemResult, RunStats


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class StateStore:
    """Estado local simples para evitar repetir trabalho e permitir auditoria."""

    def __init__(self, path: Path):
        self.path = path
        path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(path))
        self.conn.row_factory = sqlite3.Row
        self._init()

    def _init(self) -> None:
        self.conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS runs (
                run_id TEXT PRIMARY KEY,
                source_id TEXT,
                started_at TEXT NOT NULL,
                finished_at TEXT,
                status TEXT,
                stats_json TEXT
            );
            CREATE TABLE IF NOT EXISTS items (
                url TEXT PRIMARY KEY,
                source_id TEXT,
                title TEXT,
                slug TEXT,
                content_hash TEXT,
                status TEXT,
                sanity_id TEXT,
                run_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                error TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_items_hash ON items(content_hash);
            CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
            """
        )
        self.conn.commit()

    def close(self) -> None:
        self.conn.close()

    def start_run(self, run_id: str, source_id: str) -> None:
        self.conn.execute(
            "INSERT OR REPLACE INTO runs(run_id, source_id, started_at, status) VALUES (?, ?, ?, ?)",
            (run_id, source_id, _now(), "running"),
        )
        self.conn.commit()

    def finish_run(self, stats: RunStats) -> None:
        self.conn.execute(
            "UPDATE runs SET finished_at=?, status=?, stats_json=? WHERE run_id=?",
            (
                stats.finished_at or _now(),
                "completed" if not stats.errors else "completed_with_errors",
                json.dumps(stats.__dict__, ensure_ascii=False, default=str),
                stats.run_id,
            ),
        )
        self.conn.commit()

    def processed(self, url: str) -> bool:
        row = self.conn.execute(
            "SELECT status FROM items WHERE url=? AND status IN ('created','exists','duplicate')",
            (url,),
        ).fetchone()
        return row is not None

    def record(self, result: ItemResult, run_id: str, content_hash: str | None = None) -> None:
        now = _now()
        self.conn.execute(
            """
            INSERT INTO items(url, source_id, title, slug, content_hash, status, sanity_id, run_id, created_at, updated_at, error)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(url) DO UPDATE SET
                title=excluded.title,
                slug=excluded.slug,
                content_hash=excluded.content_hash,
                status=excluded.status,
                sanity_id=excluded.sanity_id,
                run_id=excluded.run_id,
                updated_at=excluded.updated_at,
                error=excluded.error
            """,
            (
                result.url,
                result.source_id,
                result.article_title or "",
                result.slug or "",
                content_hash or result.content_hash or "",
                result.status,
                result.sanity_id or "",
                run_id,
                now,
                now,
                result.message if result.status == "error" else "",
            ),
        )
        self.conn.commit()

    def stats(self) -> dict[str, Any]:
        counts = {
            row["status"]: row["count"]
            for row in self.conn.execute(
                "SELECT status, COUNT(*) AS count FROM items GROUP BY status"
            ).fetchall()
        }
        runs = self.conn.execute("SELECT COUNT(*) AS count FROM runs").fetchone()["count"]
        return {"items_by_status": counts, "runs": runs}