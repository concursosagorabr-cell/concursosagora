from __future__ import annotations

import unittest

from pipeline.sanity import infer_area_slugs
from tests.helpers import make_article, make_generated


class AreaInferenceTest(unittest.TestCase):
    def test_ti_requires_a_whole_word(self):
        article = make_article(title="Notícias do INSS sobre atendimento")
        generated = make_generated(title="Notícias do INSS", body_markdown="Atendimento ao público.")
        self.assertNotIn("tecnologia", infer_area_slugs(article, generated))

        ti_article = make_article(title="Concurso de TI para analista")
        ti_generated = make_generated(title="Concurso de TI", body_markdown="Vagas para analista de TI.")
        self.assertIn("tecnologia", infer_area_slugs(ti_article, ti_generated))

    def test_security_and_health(self):
        police = make_article(title="Concurso da Polícia Civil")
        self.assertIn("seguranca", infer_area_slugs(police, make_generated()))

        health = make_article(title="Residência médica em hospital universitário")
        self.assertIn("saude", infer_area_slugs(health, make_generated()))

    def test_police_judiciary_is_not_the_judicial_branch(self):
        article = make_article(
            title="Polícia Civil do Paraná",
            body_text="Vagas para Agente de Polícia Judiciária e Delegado.",
        )
        areas = infer_area_slugs(article, make_generated())
        self.assertIn("seguranca", areas)
        self.assertNotIn("judiciario", areas)

    def test_social_security_is_not_public_security(self):
        article = make_article(
            title="INSS tem novas vagas para analista do seguro social",
            body_text="A medida reforça o atendimento aos segurados e agentes públicos.",
        )
        areas = infer_area_slugs(article, make_generated())
        self.assertNotIn("seguranca", areas)
        self.assertIn("administracao", areas)

    def test_medical_residency_is_not_education(self):
        article = make_article(
            title="UNIFESP abre residência médica",
            body_text="A Escola Paulista de Medicina da Universidade Federal de São Paulo oferece vagas.",
        )
        areas = infer_area_slugs(article, make_generated())
        self.assertIn("saude", areas)
        self.assertNotIn("educacao", areas)

    def test_teacher_and_tribunal_are_still_detected(self):
        teacher = make_article(title="Concurso para professor da universidade")
        self.assertIn("educacao", infer_area_slugs(teacher, make_generated()))

        tribunal = make_article(title="Tribunal de Justiça abre concurso para juiz")
        self.assertIn("judiciario", infer_area_slugs(tribunal, make_generated()))


if __name__ == "__main__":
    unittest.main()
