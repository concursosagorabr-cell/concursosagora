from __future__ import annotations

import unittest

from pipeline.editorial import validate_output
from tests.helpers import long_body, make_article, make_settings


def _data(**overrides):
    values = {
        "title": "Órgão publica comunicado oficial sobre processo seletivo",
        "excerpt": "Comunicado oficial traz informações sobre o processo seletivo em andamento.",
        "body_markdown": long_body() * 3,
        "status": "previsto",
        "category_slugs": [],
        "keywords": ["concurso"],
        "education_level": [],
    }
    values.update(overrides)
    return values


class EditorialValidationTest(unittest.TestCase):
    def test_affirmative_open_status_conflict_is_flagged(self):
        article = make_article(
            facts={"status": "previsto", "organ": "INSS", "state_uf": "Nacional"},
            title="INSS tem 194 novas vagas previstas",
            body_text="O MGI autorizou 194 novas vagas para o INSS.",
        )
        warnings, score = validate_output(
            _data(title="INSS abre inscrições para 194 novas vagas"),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertTrue(any("inscrições abertas" in warning for warning in warnings))
        self.assertLess(score, 90)

    def test_negated_open_status_is_not_flagged(self):
        article = make_article(
            facts={"status": "previsto", "organ": "INSS", "state_uf": "Nacional"},
            title="INSS tem 194 novas vagas previstas",
            body_text="O MGI autorizou 194 novas vagas para o INSS.",
        )
        warnings, score = validate_output(
            _data(
                title="INSS tem 194 novas vagas previstas",
                body_markdown="Ainda não há abertura de inscrições. " + long_body() * 3,
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertFalse(any("inscrições abertas" in warning for warning in warnings))
        self.assertGreaterEqual(score, 90)

    def test_iso_fact_date_is_accepted_in_brazilian_format(self):
        article = make_article(
            facts={
                "status": "aberto",
                "enrollment_start_date": "2026-10-07",
                "enrollment_end_date": "2026-10-30",
            },
            title="Processo seletivo com inscrições abertas",
            body_text="As inscrições vão de 07/10 a 30/10.",
        )
        warnings, _ = validate_output(
            _data(
                title="Processo seletivo tem inscrições abertas",
                body_markdown="As inscrições vão de 07/10/2026 a 30/10/2026. " + long_body() * 3,
                status="aberto",
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertFalse(any("data sem respaldo" in warning for warning in warnings))

    def test_unsupported_edital_claim_is_flagged(self):
        article = make_article(
            facts={"status": "aberto"},
            title="Processo seletivo",
            body_text="O processo seletivo está com inscrições abertas.",
        )
        warnings, _ = validate_output(
            _data(
                title="Processo seletivo está com inscrições abertas",
                body_markdown="O edital informa as regras. " + long_body() * 3,
                status="aberto",
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertTrue(any("edital sem respaldo" in warning for warning in warnings))

    def test_cr_only_contradiction_is_flagged(self):
        article = make_article(
            facts={"status": "em_andamento", "is_cr_only": True},
            title="Concurso para cadastro de reserva",
            body_text="O concurso oferece vagas para formação de cadastro de reserva.",
        )
        warnings, _ = validate_output(
            _data(
                title="Concurso tem vagas efetivas e cadastro de reserva",
                body_markdown="O certame oferece vagas efetivas. " + long_body() * 3,
                status="em_andamento",
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertTrue(any("vagas efetivas" in warning for warning in warnings))

    def test_effective_vacancies_plus_exclusive_cr_is_flagged(self):
        article = make_article(
            facts={"status": "em_andamento"},
            title="Concurso com vagas efetivas e cadastro de reserva",
            body_text="O concurso oferece vagas efetivas e cadastro de reserva.",
        )
        warnings, _ = validate_output(
            _data(
                title="Concurso com vagas efetivas e cadastro de reserva",
                body_markdown=(
                    "O concurso oferece vagas efetivas e mantém apenas a formação de cadastro de reserva. "
                    + long_body() * 3
                ),
                status="em_andamento",
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertTrue(any("contradiz" in warning for warning in warnings))

    def test_external_link_is_flagged(self):
        article = make_article(
            facts={"status": "aberto"},
            title="Processo seletivo",
            body_text="O processo seletivo está com inscrições abertas.",
        )
        warnings, _ = validate_output(
            _data(
                title="Processo seletivo está com inscrições abertas",
                body_markdown="Consulte [o edital](https://site-inventado.example/edital). " + long_body() * 3,
                status="aberto",
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertTrue(any("link externo sem respaldo" in warning for warning in warnings))

    def test_official_source_link_is_allowed(self):
        article = make_article(
            facts={"status": "aberto"},
            title="Processo seletivo",
            body_text="O processo seletivo está com inscrições abertas.",
        )
        warnings, _ = validate_output(
            _data(
                title="Processo seletivo está com inscrições abertas",
                body_markdown="Consulte [a fonte](https://example.com/noticia). " + long_body() * 3,
                status="aberto",
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertFalse(any("link externo sem respaldo" in warning for warning in warnings))


    def test_forecast_without_source_is_blocking(self):
        article = make_article(
            facts={"status": "previsto", "organ": "INSS"},
            title="INSS tem vagas previstas",
            body_text="O MGI autorizou novas vagas para o INSS.",
        )
        warnings, _ = validate_output(
            _data(
                title="INSS tem vagas previstas",
                body_markdown="A previs\u00e3o indica que as contrata\u00e7\u00f5es ocorrer\u00e3o em breve. " + long_body() * 3,
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertTrue(any("previs\u00e3o" in warning for warning in warnings))

    def test_future_steps_without_source_is_blocking(self):
        article = make_article(
            facts={"status": "em_andamento"},
            title="Concurso em andamento",
            body_text="O concurso est\u00e1 em andamento.",
        )
        warnings, _ = validate_output(
            _data(
                title="Concurso em andamento",
                body_markdown="As pr\u00f3ximas etapas incluem novos comunicados. " + long_body() * 3,
                status="em_andamento",
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertTrue(any("etapas futuras" in warning for warning in warnings))

    def test_opinion_is_flagged_without_being_a_factual_block(self):
        article = make_article(
            facts={"status": "previsto", "organ": "INSS"},
            title="INSS tem vagas previstas",
            body_text="O MGI autorizou novas vagas para o INSS.",
        )
        warnings, _ = validate_output(
            _data(
                title="INSS tem vagas previstas",
                body_markdown="A iniciativa demonstra compromisso com a popula\u00e7\u00e3o. " + long_body() * 3,
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertTrue(any("opini\u00e3o" in warning for warning in warnings))


if __name__ == "__main__":
    unittest.main()
