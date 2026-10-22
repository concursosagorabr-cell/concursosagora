from __future__ import annotations

import unittest

from pipeline.extract import _extract_vacancies, extract_facts, infer_source_from_url
from pipeline.text import normalize


class ExtractionTest(unittest.TestCase):
    def test_vacancies_uses_the_total_when_text_mentions_parts(self):
        text = (
            "O MGI autorizou a nomeação para 194 novas vagas. Desse número, "
            "34 são vagas remanescentes e 160 vagas adicionais foram autorizadas."
        )
        self.assertEqual(_extract_vacancies(text, normalize(text)), 194)

    def test_inss_facts(self):
        facts = extract_facts(
            title="MGI autoriza 194 novas vagas para o INSS",
            text=(
                "O Ministério da Gestão e da Inovação em Serviços Públicos autorizou "
                "a nomeação de 194 novos servidores para o Instituto Nacional do Seguro "
                "Social (INSS). Desse número, 34 são vagas remanescentes do CPNU 2 e "
                "160 vagas adicionais foram autorizadas para analista do seguro social."
            ),
            organ_hint="Instituto Nacional do Seguro Social (INSS)",
            source_id="inss",
            default_sphere="FEDERAL",
        )
        self.assertEqual(facts["vacancies_total"], 194)
        self.assertEqual(facts["status"], "previsto")
        self.assertEqual(facts["sphere"], "FEDERAL")
        self.assertEqual(facts["state_uf"], "Nacional")

    def test_cr_only_only_when_there_are_no_effective_vacancies(self):
        cr_only = extract_facts(
            title="Concurso para cadastro de reserva",
            text=(
                "O concurso oferece vagas para formação de cadastro de reserva para "
                "os cargos de analista e técnico."
            ),
            organ_hint="Órgão de teste",
        )
        self.assertTrue(cr_only.get("is_cr_only"))

        with_effective = extract_facts(
            title="Concurso com vagas efetivas e cadastro de reserva",
            text=(
                "O concurso visa o preenchimento de vagas efetivas do quadro permanente, "
                "bem como a formação de cadastro de reserva."
            ),
            organ_hint="Órgão de teste",
        )
        self.assertNotIn("is_cr_only", with_effective)

    def test_source_inference(self):
        self.assertEqual(
            infer_source_from_url("https://conhecimento.fgv.br/concursos/pcpr26"), "fgv"
        )
        self.assertEqual(infer_source_from_url("https://www.vunesp.com.br/UFSP2602"), "vunesp")
        self.assertEqual(
            infer_source_from_url(
                "https://www.gov.br/inss/pt-br/assuntos/noticias/mgi-autoriza-194-novas-vagas-para-o-inss"
            ),
            "inss",
        )
        self.assertEqual(infer_source_from_url("https://www.in.gov.br/web/dou/-/teste"), "dou")
        self.assertIsNone(infer_source_from_url("https://example.com/noticia"))


if __name__ == "__main__":
    unittest.main()
