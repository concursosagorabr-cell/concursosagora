from __future__ import annotations

import unittest

from pipeline.verification import build_fact_evidence, fact_sheet, verify_article
from tests.helpers import make_article, make_generated, make_settings


class FactEvidenceTest(unittest.TestCase):
    def test_critical_facts_are_supported_by_source_quotes(self):
        article = make_article(
            facts={
                "organ": "Instituto Nacional do Seguro Social (INSS)",
                "vacancies_total": 194,
                "status": "previsto",
                "state_uf": "Nacional",
                "sphere": "FEDERAL",
            },
            title="MGI autoriza 194 novas vagas para o INSS",
            body_text=(
                "O Ministério da Gestão e da Inovação em Serviços Públicos autorizou "
                "a nomeação de 194 servidores para o Instituto Nacional do Seguro Social (INSS). "
                "A medida foi publicada no Diário Oficial da União."
            ),
        )
        report = build_fact_evidence(article)
        self.assertEqual(report["criticalMissing"], [])
        self.assertEqual(report["score"], 100)
        self.assertTrue(report["facts"]["vacancies_total"]["evidence"])
        self.assertTrue(report["facts"]["organ"]["evidence"])
        self.assertTrue(report["facts"]["status"]["evidence"])

    def test_state_uf_gets_evidence_from_confirmed_city(self):
        article = make_article(
            facts={"state_uf": "BA", "city_name": "Salvador"},
            title="Concurso da Prefeitura de Salvador",
            body_text="A Prefeitura Municipal do Salvador publicou o concurso.",
        )
        report = build_fact_evidence(article)
        state = report["facts"]["state_uf"]
        self.assertEqual(state["status"], "inferred")
        self.assertTrue(state["evidence"])
        self.assertEqual(state["evidence"][0]["method"], "city-to-uf")
        self.assertEqual(report["criticalMissing"], [])

    def test_missing_critical_evidence_blocks(self):
        article = make_article(
            facts={"status": "aberto", "vacancies_total": 606},
            title="Processo seletivo",
            body_text="O processo seletivo foi divulgado pela instituição.",
        )
        generated = make_generated(
            status="aberto",
            raw={"status": "aberto"},
            score=100,
        )
        report = verify_article(article, generated, make_settings())
        self.assertIn("fato crítico sem evidência na fonte: status", report["blocking"])
        self.assertIn("fato crítico sem evidência na fonte: vacancies_total", report["blocking"])
        self.assertFalse(report["ready"])

    def test_non_official_source_blocks(self):
        article = make_article(
            facts={"status": "aberto"},
            title="Processo seletivo com inscrições abertas",
            body_text="As inscrições estão abertas.",
            source_tier="journalism",
        )
        generated = make_generated(status="aberto", raw={"status": "aberto"})
        report = verify_article(article, generated, make_settings())
        self.assertIn("fonte oficial não identificada; artigo não pode ser gerado", report["blocking"])
        self.assertFalse(report["ready"])

    def test_status_divergence_blocks(self):
        article = make_article(
            facts={"status": "previsto", "organ": "INSS"},
            title="INSS tem 194 vagas previstas",
            body_text="O MGI autorizou 194 vagas para o INSS.",
        )
        generated = make_generated(
            status="aberto",
            raw={"status": "aberto", "organ": "INSS"},
            warnings=[],
        )
        report = verify_article(article, generated, make_settings())
        self.assertTrue(any("status" in item and "diverge" in item for item in report["blocking"]))
        self.assertFalse(report["ready"])

    def test_blocking_warning_blocks_even_with_high_score(self):
        article = make_article(
            facts={"status": "aberto"},
            title="Processo seletivo com inscrições abertas",
            body_text="As inscrições estão abertas no site oficial.",
        )
        generated = make_generated(
            status="aberto",
            raw={"status": "aberto"},
            warnings=["data sem respaldo na fonte: 31/12/2030"],
            score=100,
        )
        report = verify_article(article, generated, make_settings())
        self.assertIn("data sem respaldo na fonte: 31/12/2030", report["blocking"])
        self.assertFalse(report["ready"])

    def test_fact_sheet_is_serializable(self):
        article = make_article(
            facts={"status": "previsto", "vacancies_total": 10},
            title="Concurso com 10 vagas previstas",
            body_text="O órgão autorizou 10 vagas e o concurso está previsto.",
        )
        report = build_fact_evidence(article)
        rows = fact_sheet(report)
        self.assertTrue(rows)
        self.assertTrue(all(row["key"] for row in rows))
        self.assertTrue(all(row["_type"] == "factCheck" for row in rows))


if __name__ == "__main__":
    unittest.main()
