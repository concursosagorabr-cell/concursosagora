from __future__ import annotations

import unittest

from pipeline.enrich import (
    ENRICHMENT_MARKER,
    _rekey_blocks,
    already_enriched,
    build_enrichment_markdown,
)
from pipeline.portable_text import markdown_to_portable_text


class EnrichmentTest(unittest.TestCase):
    def test_build_section_uses_post_fields(self):
        post = {
            "organ": "Órgão Teste",
            "banca": "FGV",
            "stateUf": "SP",
            "cityName": "São Paulo",
            "vacanciesTotal": 10,
            "sourceUrls": [{"title": "Fonte", "url": "https://example.com"}],
        }
        markdown = build_enrichment_markdown(post)
        self.assertIn(ENRICHMENT_MARKER, markdown)
        self.assertIn("Órgão Teste", markdown)
        self.assertIn("Fonte", markdown)
        self.assertIn("Orientação de estudo", markdown)

    def test_already_enriched_detects_marker(self):
        blocks = markdown_to_portable_text(ENRICHMENT_MARKER)
        self.assertTrue(already_enriched(blocks))
        self.assertFalse(already_enriched([]))

    def test_rekey_blocks(self):
        blocks = markdown_to_portable_text("## Teste\n\nParágrafo")
        rekeyed = _rekey_blocks(blocks, "enrich")
        self.assertTrue(all(block["_key"].startswith("enrich-") for block in rekeyed))
        self.assertEqual(len(rekeyed), len(blocks))


if __name__ == "__main__":
    unittest.main()
