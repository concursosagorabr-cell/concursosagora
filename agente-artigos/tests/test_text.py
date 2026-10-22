from __future__ import annotations

import unittest

from pipeline.text import extract_city, extract_uf, normalize, parse_br_date, parse_iso_datetime, slugify


class TextHelpersTest(unittest.TestCase):
    def test_normalize_and_slugify(self):
        self.assertEqual(normalize("Polícia Civil do Paraná"), "policia civil do parana")
        self.assertEqual(slugify("Concurso Público 2026/2027"), "concurso-publico-2026-2027")

    def test_uf_does_not_match_the_preposition_para(self):
        self.assertIsNone(extract_uf("MGI autoriza 194 novas vagas para o INSS"))
        self.assertEqual(extract_uf("Estado do Pará"), "PA")
        self.assertEqual(extract_uf("Polícia Civil do Estado do Paraná"), "PR")

    def test_city_from_prefeitura(self):
        self.assertEqual(extract_city("Prefeitura Municipal do Salvador 2026"), "Salvador")
        self.assertEqual(extract_city("Concurso Público para a Prefeitura de Macaé"), "Macaé")
        self.assertEqual(
            extract_city("Prefeitura Municipal do Salvador Informações sobre o concurso"),
            "Salvador",
        )

    def test_parse_dates(self):
        self.assertEqual(parse_br_date("07/10/2026"), "2026-10-07")
        self.assertEqual(parse_br_date("9 de julho de 2026"), "2026-07-09")
        self.assertEqual(parse_br_date("2026-10-07"), "2026-10-07")
        self.assertEqual(parse_iso_datetime("2026-07-31T15:29:00"), "2026-07-31T15:29:00")


if __name__ == "__main__":
    unittest.main()
