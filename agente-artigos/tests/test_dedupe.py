from __future__ import annotations

import unittest
from datetime import datetime, timezone

from pipeline.dedupe import (
    contest_key_from_url,
    find_duplicate,
    find_recent_contest_coverage,
    normalize_url,
    post_contest_keys,
)
from tests.helpers import make_article

NOW = datetime(2026, 10, 22, 12, 0, tzinfo=timezone.utc)


def post(url: str, **overrides):
    values = {
        "_id": "post-1",
        "title": "Concurso anterior",
        "slug": "concurso-anterior",
        "sourceUrls": [{"_type": "sourceReference", "url": url}],
        "publishedAt": "2026-10-10T12:00:00+00:00",
        "contentHash": "b" * 64,
    }
    values.update(overrides)
    return values


class NormalizeUrlTest(unittest.TestCase):
    def test_removes_tracking_and_trailing_slash(self):
        self.assertEqual(
            normalize_url("HTTPS://WWW.Conhecimento.FGV.br/concursos/tjap26/?utm_source=x&b=2&a=1#top"),
            "https://conhecimento.fgv.br/concursos/tjap26?a=1&b=2",
        )

    def test_keeps_distinct_paths(self):
        self.assertNotEqual(
            normalize_url("https://conhecimento.fgv.br/concursos/tjap26"),
            normalize_url("https://conhecimento.fgv.br/concursos/tjpb26"),
        )


class ContestKeyTest(unittest.TestCase):
    def test_fgv_concurso(self):
        self.assertEqual(
            contest_key_from_url("https://conhecimento.fgv.br/concursos/tjap26"),
            "fgv:tjap26",
        )

    def test_fgv_exame_with_edition(self):
        self.assertEqual(
            contest_key_from_url("https://conhecimento.fgv.br/exames/enac/4exame"),
            "fgv:enac:4exame",
        )

    def test_fgv_processo_seletivo(self):
        self.assertEqual(
            contest_key_from_url("https://conhecimento.fgv.br/processoseletivo/inb2026"),
            "fgv:inb2026",
        )

    def test_vunesp_code(self):
        self.assertEqual(
            contest_key_from_url("https://www.vunesp.com.br/HRPP2602"),
            "vunesp:HRPP2602",
        )

    def test_unknown_url_has_no_key(self):
        self.assertEqual(contest_key_from_url("https://example.com/noticia"), "")

    def test_govbr_news_uses_full_article_path(self):
        first = contest_key_from_url(
            "https://www.gov.br/inss/pt-br/assuntos/noticias/"
            "mgi-autoriza-194-novas-vagas-para-o-inss"
        )
        second = contest_key_from_url(
            "https://www.gov.br/inss/pt-br/assuntos/noticias/"
            "inss-publica-resultado-de-concurso"
        )
        self.assertEqual(
            first,
            "govbr:gov.br/inss/pt-br/assuntos/noticias/"
            "mgi-autoriza-194-novas-vagas-para-o-inss",
        )
        self.assertNotEqual(first, second)

    def test_govbr_contest_page_keeps_short_stable_path(self):
        self.assertEqual(
            contest_key_from_url(
                "https://www.gov.br/gestao/pt-br/concursos/2026/exemplo"
            ),
            "govbr:gov.br/gestao/pt-br/concursos/2026",
        )

    def test_post_keys_include_explicit_and_derived(self):
        keys = post_contest_keys(
            {
                "contestKey": "fgv:tjap26",
                "sourceUrls": [
                    {"url": "https://conhecimento.fgv.br/concursos/tjap26"},
                    {"url": "https://conhecimento.fgv.br/concursos/tjpb26"},
                ],
            }
        )
        self.assertIn("fgv:tjap26", keys)
        self.assertIn("fgv:tjpb26", keys)


class CooldownTest(unittest.TestCase):
    def test_blocks_same_contest_within_15_days(self):
        recent = find_recent_contest_coverage(
            [post("https://conhecimento.fgv.br/concursos/tjap26")],
            "fgv:tjap26",
            cooldown_days=15,
            now=NOW,
        )
        self.assertIsNotNone(recent)

    def test_allows_same_contest_after_15_days(self):
        recent = find_recent_contest_coverage(
            [
                post(
                    "https://conhecimento.fgv.br/concursos/tjap26",
                    publishedAt="2026-10-01T12:00:00+00:00",
                )
            ],
            "fgv:tjap26",
            cooldown_days=15,
            now=NOW,
        )
        self.assertIsNone(recent)

    def test_does_not_block_other_contest(self):
        recent = find_recent_contest_coverage(
            [post("https://conhecimento.fgv.br/concursos/tjpb26")],
            "fgv:tjap26",
            cooldown_days=15,
            now=NOW,
        )
        self.assertIsNone(recent)

    def test_find_duplicate_reports_contest_reason(self):
        article = make_article(
            facts={"status": "aberto", "organ": "TJAP", "state_uf": "AP"},
            title="TJAP abre concurso para juiz substituto",
            body_text="O Tribunal de Justiça do Amapá abriu concurso.",
        )
        article.url = "https://conhecimento.fgv.br/sites/default/files/concursos/tjap.pdf"
        article.canonical_url = article.url
        duplicate, reason, matched = find_duplicate(
            [post("https://conhecimento.fgv.br/concursos/tjap26")],
            article,
            "TJAP abre concurso para juiz substituto",
            "tjap-abre-concurso",
            contest_key="fgv:tjap26",
            cooldown_days=15,
            now=NOW,
        )
        self.assertTrue(duplicate)
        self.assertIn("mesmo concurso", reason)
        self.assertIsNotNone(matched)


if __name__ == "__main__":
    unittest.main()
