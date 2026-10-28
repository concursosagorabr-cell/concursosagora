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

    def test_placeholder_generico_bloqueia(self):
        article = make_article(
            facts={"status": "previsto", "organ": "INSS"},
            title="INSS tem vagas previstas",
            body_text="O MGI autorizou novas vagas para o INSS.",
        )
        warnings, score = validate_output(
            _data(
                title="INSS tem vagas previstas",
                body_markdown="Todas as informações acima são extraídas do dossiê factual disponível. " + long_body() * 3,
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertTrue(any("placeholder" in warning or "template genérico" in warning for warning in warnings))
        self.assertLess(score, 90)

    def test_fonte_placeholder_bloqueia(self):
        article = make_article(
            facts={"status": "previsto", "organ": "INSS"},
            title="INSS tem vagas previstas",
            body_text="O MGI autorizou novas vagas para o INSS.",
        )
        warnings, score = validate_output(
            _data(
                title="INSS tem vagas previstas para analista",
                body_markdown="Referências: Fonte 1, Fonte 2. " + long_body() * 3,
                excerpt="Resumo adequado do artigo.",
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertTrue(any("placeholder" in warning or "template genérico" in warning for warning in warnings))
        self.assertLess(score, 90)

    def test_terminologia_inexistente_ato_intermediario_bloqueia(self):
        article = make_article(
            facts={"status": "previsto", "organ": "INSS"},
            title="INSS tem vagas previstas",
            body_text="O MGI autorizou novas vagas para o INSS.",
        )
        warnings, score = validate_output(
            _data(
                title="INSS avança para fase de ato intermediário",
                body_markdown="O concurso avançou para a fase de ato intermediário. " + long_body() * 3,
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertTrue(any("terminologia administrativa inexistente" in warning or "ato intermediário" in warning for warning in warnings))
        self.assertLess(score, 90)

    def test_noticia_velha_no_presente_bloqueia(self):
        article = make_article(
            facts={"status": "encerrado", "organ": "Prefeitura de Campina Grande"},
            title="Guarda de Campina Grande abre 40 vagas",
            body_text="A prefeitura publicou edital em maio, inscrições encerraram em julho, provas em janeiro.",
        )
        warnings, score = validate_output(
            _data(
                title="Prefeitura de Campina Grande abre concurso com 40 vagas",
                body_markdown="A prefeitura de Campina Grande abre inscrições para 40 vagas de guarda municipal em outubro. " + long_body() * 3,
                status="previsto",
                excerpt="Resumo adequado do artigo.",
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        # Deve bloquear por: status diverge + afirma inscrições abertas com status encerrado
        self.assertTrue(any("status" in warning and "diverge" in warning for warning in warnings))
        self.assertTrue(any("inscrições abertas" in warning and "encerrado" in warning for warning in warnings))
        self.assertLess(score, 90)

    def test_cross_validacao_vagas_diverge_ficha_tecnica(self):
        article = make_article(
            facts={"status": "aberto", "vacancies_total": 40},
            title="Guarda de Campina Grande abre 40 vagas",
            body_text="O edital prevê 40 vagas para guarda municipal.",
        )
        warnings, score = validate_output(
            _data(
                title="Guarda de Campina Grande abre 30 vagas",
                body_markdown="O certame abre 30 vagas para guarda municipal. " + long_body() * 3,
                status="aberto",
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertTrue(any("vagas no corpo" in warning and "diverge da ficha técnica" in warning for warning in warnings))
        self.assertLess(score, 90)

    def test_cross_validacao_data_inscricao_diverge(self):
        article = make_article(
            facts={"status": "aberto", "enrollment_end_date": "2026-11-16"},
            title="Concurso com inscrições até 16/11",
            body_text="As inscrições vão até 16 de novembro.",
        )
        warnings, score = validate_output(
            _data(
                title="Concurso com inscrições até 17/11",
                body_markdown="O prazo de inscrição encerra em 17/11/2026. " + long_body() * 3,
                status="aberto",
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertTrue(any("data de inscrição" in warning and "diverge da ficha técnica" in warning for warning in warnings))
        self.assertLess(score, 90)

    def test_cross_validacao_data_prova_diverge(self):
        article = make_article(
            facts={"status": "aberto", "exam_date": "2027-01-23"},
            title="Concurso com prova em 23/01",
            body_text="A prova será aplicada em 23 de janeiro.",
        )
        warnings, score = validate_output(
            _data(
                title="Concurso com prova em 24/01",
                body_markdown="A prova objetiva será em 24/01/2027. " + long_body() * 3,
                status="aberto",
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertTrue(any("data de prova" in warning and "diverge da ficha técnica" in warning for warning in warnings))
        self.assertLess(score, 90)

    def test_cross_validacao_taxa_diverge(self):
        article = make_article(
            facts={"status": "aberto", "registration_fee": 100.0},
            title="Concurso com taxa de R$ 100,00",
            body_text="A taxa de inscrição é de R$ 100,00.",
        )
        warnings, score = validate_output(
            _data(
                title="Concurso com taxa diferente",
                body_markdown="A taxa de inscrição custa R$ 120,00. " + long_body() * 3,
                status="aberto",
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertTrue(any("taxa no corpo" in warning and "diverge da ficha técnica" in warning for warning in warnings))
        self.assertLess(score, 90)

    def test_banca_nao_inferida_sem_fonte(self):
        article = make_article(
            facts={"status": "previsto", "organ": "Polícia Penal SP", "banca": None},
            title="Polícia Penal SP terá concurso",
            body_text="A Polícia Penal de São Paulo autorizou novo concurso.",
        )
        warnings, score = validate_output(
            _data(
                title="Polícia Penal SP abre 700 vagas com banca Planejar Concursos",
                body_markdown="A banca organizadora será a Planejar Concursos. " + long_body() * 3,
                status="previsto",
                banca="Planejar Concursos",
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        self.assertTrue(any("banca organizadora diverge" in warning or "banca organizadora sem respaldo" in warning for warning in warnings))
        self.assertLess(score, 90)

    def test_salario_mistura_editais_diferentes(self):
        article = make_article(
            facts={"status": "aberto", "salary_min": 1535.84, "salary_max": 1535.84, "organ": "Prefeitura de Campina Grande", "city_name": "Campina Grande"},
            title="Guarda de Campina Grande - salário inicial",
            body_text="O salário inicial para guarda municipal é de R$ 1.535,84.",
        )
        warnings, score = validate_output(
            _data(
                title="Guarda de Campina Grande tem salários de até R$ 9.652,80",
                body_markdown="O certame terá vagas de nível médio, técnico e superior com salário de até R$ 9.652,80. " + long_body() * 3,
                status="aberto",
            ),
            article,
            make_settings(),
            [],
            min_words=80,
        )
        # O salário 9652.80 é muito maior que o máximo de 1535.84
        self.assertTrue(any("salário no corpo" in warning and "fora da faixa" in warning for warning in warnings))
        self.assertLess(score, 90)


if __name__ == "__main__":
    unittest.main()
