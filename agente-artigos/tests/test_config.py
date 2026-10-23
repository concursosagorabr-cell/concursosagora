from __future__ import annotations

import unittest
from pathlib import Path

from pipeline.config import load_sources

PROJECT = Path(__file__).resolve().parent.parent


class SourcesConfigTest(unittest.TestCase):
    def test_mvp_sources_and_dou_policy(self):
        sources = {source.id: source for source in load_sources(PROJECT / "sources.yaml")}
        self.assertTrue(sources["inss"].enabled)
        self.assertTrue(sources["vunesp"].enabled)
        self.assertTrue(sources["fgv"].enabled)
        self.assertFalse(sources["dou"].enabled)
        self.assertEqual(sources["fgv"].start_urls, ["https://conhecimento.fgv.br/concursos"])
        self.assertEqual(sources["dou"].type, "dou_inlabs")
        self.assertEqual(sources["dou"].start_urls, [])
        self.assertEqual(sources["dou"].options.get("import_dir"), "data/dou")


if __name__ == "__main__":
    unittest.main()
