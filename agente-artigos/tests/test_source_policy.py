from __future__ import annotations

import unittest

from pipeline.config import load_sources
from pipeline.source_policy import (
    SOURCE_POLICIES,
    classify_url,
    is_official_url,
    policy_for_id,
    policy_for_url,
)
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
            "https://noticiasconcursos.com.br/noticia/exemplo",
            "https://www.megaconcursos.com/noticia/exemplo",
        ):
            classification = classify_url(url)
            self.assertFalse(classification.official, url)
            self.assertIn(classification.tier, {"aggregator", "journalism"})

    def test_dou_is_official_but_must_use_official_open_data(self):
        classification = classify_url("https://www.in.gov.br/leiturajornal")
        self.assertTrue(classification.official)
        self.assertEqual(classification.policy_id, "dou")
        policy = policy_for_url("https://www.in.gov.br/web/dou/-/portaria-exemplo")
        self.assertIsNotNone(policy)
        assert policy is not None
        self.assertEqual(policy.automation, "official_open_data")
        self.assertTrue(policy.can_generate_article)
        self.assertIn("robots", policy.terms)

    def test_registry_has_the_ten_sources_analyzed(self):
        expected = {
            "dou",
            "concursos_agora",
            "pci_concursos",
            "concursos_no_brasil",
            "ache_concursos",
            "jc_concursos",
            "noticias_concursos",
            "mega_concursos",
            "qconcursos_folha",
            "iscom_radar",
        }
        self.assertTrue(expected.issubset({policy.id for policy in SOURCE_POLICIES}))

    def test_secondary_sources_can_never_generate_articles(self):
        for policy in SOURCE_POLICIES:
            if policy.id == "concursos_agora":
                continue
            if policy.id == "dou":
                continue
            self.assertFalse(policy.official, policy.id)
            self.assertFalse(policy.can_generate_article, policy.id)
            self.assertIn(policy.usage, {"discovery", "internal"}, policy.id)

    def test_restricted_sources_are_manual_only(self):
        for source_id in ("concursos_no_brasil", "ache_concursos", "noticias_concursos"):
            policy = policy_for_id(source_id)
            self.assertIsNotNone(policy)
            assert policy is not None
            self.assertEqual(policy.automation, "manual_only", source_id)
            self.assertFalse(policy.can_generate_article, source_id)

    def test_own_site_is_internal_not_independent_verification(self):
        policy = policy_for_url("https://www.concursosagora.com.br/post/exemplo")
        self.assertIsNotNone(policy)
        assert policy is not None
        self.assertEqual(policy.tier, "internal")
        self.assertEqual(policy.usage, "internal")
        self.assertFalse(policy.can_generate_article)

    def test_all_article_sources_in_config_are_official(self):
        for source in load_sources(PROJECT_DIR / "sources.yaml"):
            if source.usage == "article":
                self.assertIn(source.tier, {"official_primary", "official_secondary"})
                self.assertTrue(source.can_generate_article)
            else:
                self.assertIn(source.tier, {"journalism", "aggregator"})
                self.assertEqual(source.usage, "discovery")
                self.assertFalse(source.can_generate_article)


if __name__ == "__main__":
    unittest.main()
