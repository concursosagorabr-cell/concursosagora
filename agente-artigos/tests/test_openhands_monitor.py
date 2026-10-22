from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from experiments.openhands_monitor.monitor import (
    WatchItem,
    canonical_text,
    diff_snapshots,
    load_watchlist,
    sha256_text,
)
from experiments.openhands_monitor.validate import validate_report_data
from experiments.openhands_monitor.worker import (
    default_capability_overrides,
    parse_capability_overrides,
)


def snapshot(text: str, *, watch_id: str = "sesa-2027") -> dict:
    return {
        "version": 1,
        "watch_id": watch_id,
        "source_id": "vunesp",
        "requested_url": "https://www.vunesp.com.br/SESA2601",
        "url": "https://www.vunesp.com.br/SESA2601",
        "fetched_at": "2026-10-21T12:00:00+00:00",
        "status": 200,
        "official": True,
        "text": text,
        "text_hash": sha256_text(canonical_text(text)),
        "links": [],
        "links_hash": sha256_text("[]"),
    }


def report_for(snap: dict, *, quote: str = "Vagas: 1.405") -> dict:
    return {
        "watch_id": snap["watch_id"],
        "source_url": snap["url"],
        "content_hash": snap["text_hash"],
        "checked_at": snap["fetched_at"],
        "overview": "Mudança de vagas.",
        "facts": [
            {
                "key": "vacancies_total",
                "value": "1.405",
                "quote": quote,
                "page": None,
                "source_url": snap["url"],
                "status": "supported",
            }
        ],
        "changes": [
            {
                "field": "vacancies_total",
                "old": "1.385",
                "new": "1.405",
                "quote": quote,
                "page": None,
                "source_url": snap["url"],
                "kind": "vagas",
                "status": "supported",
            }
        ],
        "conflicts": [],
        "warnings": [],
        "requires_human_review": True,
    }


class MonitorTest(unittest.TestCase):
    def test_load_watchlist_rejects_secondary_portal(self):
        content = """
watches:
  - id: exemplo
    url: https://www.pciconcursos.com.br/noticia/exemplo
"""
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "watchlist.yaml"
            path.write_text(content, encoding="utf-8")
            with self.assertRaises(ValueError):
                load_watchlist(path)

    def test_diff_detects_vacancy_change(self):
        watch = WatchItem(
            id="sesa-2027",
            source_id="vunesp",
            url="https://www.vunesp.com.br/SESA2601",
            allowed_domains=["www.vunesp.com.br", "vunesp.com.br"],
        )
        old = snapshot("Inscrições: 20/10 a 05/11. Vagas: 1.385.")
        new = snapshot("Inscrições: 20/10 a 05/11. Vagas: 1.405.")
        result = diff_snapshots(old, new, watch)
        self.assertTrue(result["changed"])
        self.assertTrue(result["text_changed"])
        self.assertEqual(result["old_text_hash"], old["text_hash"])
        self.assertEqual(result["new_text_hash"], new["text_hash"])
        self.assertTrue(any("1.405" in line for line in result["added"]))
        self.assertIn("vagas", result["signals"])

    def test_validate_accepts_supported_literal_quote(self):
        snap = snapshot("Programa de Residência Médica 2027. Vagas: 1.405.")
        result = validate_report_data(report_for(snap), snap)
        self.assertTrue(result["valid"], result["errors"])
        self.assertEqual(result["checked_quotes"], 2)

    def test_validate_rejects_unresolved_quote(self):
        snap = snapshot("Programa de Residência Médica 2027. Vagas: 1.405.")
        result = validate_report_data(report_for(snap, quote="Vagas: 1.385"), snap)
        self.assertFalse(result["valid"])
        self.assertEqual(len(result["unresolved_quotes"]), 2)

    def test_validate_rejects_forbidden_domain(self):
        snap = snapshot("Programa de Residência Médica 2027. Vagas: 1.405.")
        report = report_for(snap)
        report["facts"][0]["source_url"] = "https://documento.vunesp.com.br/arquivo.pdf"
        result = validate_report_data(report, snap)
        self.assertFalse(result["valid"])
        self.assertTrue(any("URL proibida" in error for error in result["errors"]))

    def test_validate_normalizes_whitespace_for_quote(self):
        snap = snapshot("Programa de Residência Médica 2027.\nVagas:   1.405.")
        result = validate_report_data(report_for(snap, quote="Vagas: 1.405"), snap)
        self.assertTrue(result["valid"], result["errors"])

    def test_groq_disables_prompt_cache_key(self):
        self.assertEqual(
            default_capability_overrides("groq/openai/gpt-oss-120b"),
            {"supports_prompt_cache_key": False},
        )
        self.assertEqual(default_capability_overrides("openai/gpt-4"), {})
        self.assertEqual(
            parse_capability_overrides('{"supports_prompt_cache_key": false}'),
            {"supports_prompt_cache_key": False},
        )


if __name__ == "__main__":
    unittest.main()
