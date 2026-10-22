from __future__ import annotations

import unittest

from pipeline.config import load_sources
from pipeline.source_policy import classify_url, is_official_url
from pipeline.config import PROJECT_DIR


class SourcePolicyTest(unittest.TestCase):
    def test_official_sources_are_classified_as_primary(self):
        self.assertEqual(
            classify_url("https://www.gov.br/inss/pt-br/assuntos/noticias/exemplo").tier,
            "official_primary",
        )
        self.assertTrue(is_official_url("https://www.vunesp.com.br/UFSP2602"))
        self.assertTrue(is_official_url("https://conhecimento.fgv.br/concursos/pcpr26"))

    def test_secondary_portals_are_never_official(self):
        for url in (
            "https://www.pciconcursos.com.br/noticias/exemplo",
            "https://www.concursosnobrasil.com.br/concurso/exemplo",
            "https://jcconcursos.com.br/noticia/exemplo",
            "https://folha.qconcursos.com/materia/exemplo",
            "https://g1.globo.com/trabalho-e-carreira/concursos-e-empregos/noticia/exemplo.ghtml",
        ):
            classification = classify_url(url)
            self.assertFalse(classification.official, url)
            self.assertIn(classification.tier, {"aggregator", "journalism"})

    def test_dou_is_official_but_must_respect_robots(self):
        self.assertTrue(is_official_url("https://www.in.gov.br/leiturajornal"))

    def test_all_article_sources_in_config_are_official(self):
        for source in load_sources(PROJECT_DIR / "sources.yaml"):
            self.assertIn(source.tier, {"official_primary", "official_secondary"})
            self.assertEqual(source.usage, "article")
            self.assertTrue(source.can_generate_article)


if __name__ == "__main__":
    unittest.main()
