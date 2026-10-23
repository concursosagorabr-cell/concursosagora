from __future__ import annotations

import tempfile
import unittest
import zipfile
from pathlib import Path
from types import SimpleNamespace

from pipeline.config import Settings
from pipeline.dou_open_data import (
    DouOpenDataError,
    find_dou_archive,
    parse_dou_archive,
    parse_dou_xml,
)
from pipeline.extract import discover, extract_article
from pipeline.models import SourceConfig


ARTICLE_XML = """<?xml version="1.0" encoding="utf-8"?>
<root>
  <article id="artigo-1" urlTitle="mgi-autoriza-194-vagas-inss">
    <identifica>PORTARIA Nº 1.234, DE 22 DE OUTUBRO DE 2026</identifica>
    <ementa>Autoriza a nomeação de 194 candidatos para o INSS.</ementa>
    <texto>
      <p>Ao todo, são 194 novas vagas para o INSS.</p>
      <p>O Ministério da Gestão e da Inovação em Serviços Públicos autorizou a nomeação de 194 novos servidores para o Instituto Nacional do Seguro Social (INSS).</p>
      <p>Desse total, 34 são vagas remanescentes do CPNU 2 e 160 são vagas adicionais autorizadas pelo Decreto 13.064, de 9 de julho de 2026.</p>
      <p>As nomeações são para o cargo de analista do seguro social.</p>
    </texto>
    <pubDate>2026-10-22</pubDate>
    <artType>Portaria</artType>
    <hierarchyStr>Ministério da Gestão e da Inovação em Serviços Públicos/Gabinete</hierarchyStr>
  </article>
</root>
"""

NAMESPACED_XML = """<?xml version="1.0" encoding="utf-8"?>
<materia xmlns="urn:dou:teste">
  <titulo>Edital de concurso público para analista</titulo>
  <body>
    <p>O órgão abre concurso público com 20 vagas para analista.</p>
    <p>As inscrições estarão abertas conforme o cronograma do edital.</p>
  </body>
  <publicationDate>22/10/2026</publicationDate>
  <section>Seção 3</section>
  <artType>Edital</artType>
  <hierarchyStr>Tribunal de Exemplo/Secretaria</hierarchyStr>
</materia>
"""


def _settings(tmp: Path) -> Settings:
    return Settings(
        sanity_project_id="test",
        sanity_dataset="production",
        sanity_api_version="2026-07-25",
        sanity_token="token",
        sanity_read_token="",
        groq_keys=["test-key"],
        groq_model="openai/gpt-oss-120b",
        frontend_url="",
        min_content_words=40,
        data_dir=tmp,
        dou_import_dir=tmp,
    )


def _source() -> SourceConfig:
    return SourceConfig(
        id="dou",
        name="Diário Oficial da União",
        type="dou_inlabs",
        enabled=True,
        tier="official_primary",
        usage="article",
        section="do3",
        include_keywords=["concurso", "vagas", "nomeacao", "analista"],
        default_organ="Instituto Nacional do Seguro Social (INSS)",
        default_sphere="FEDERAL",
    )


class DouOpenDataTest(unittest.TestCase):
    def test_parse_article_xml(self):
        articles = parse_dou_xml(
            ARTICLE_XML,
            section="do3",
            edition_date="2026-10-22",
            source_file="exemplo.xml",
        )
        self.assertEqual(len(articles), 1)
        article = articles[0]
        self.assertIn("PORTARIA", article.title)
        self.assertIn("194", article.body_text)
        self.assertEqual(article.published_at, "2026-10-22")
        self.assertEqual(article.art_type, "Portaria")
        self.assertIn("Ministério da Gestão", article.hierarchy)
        self.assertEqual(article.section, "do3")
        self.assertEqual(article.url, "https://www.in.gov.br/web/dou/-/mgi-autoriza-194-vagas-inss")
        self.assertEqual(article.source_file, "exemplo.xml")

    def test_parse_namespaced_xml_and_body(self):
        articles = parse_dou_xml(NAMESPACED_XML, section="S03", edition_date="2026-10-22")
        self.assertEqual(len(articles), 1)
        article = articles[0]
        self.assertEqual(article.title, "Edital de concurso público para analista")
        self.assertIn("20 vagas", article.body_text)
        self.assertEqual(article.section, "do3")
        self.assertEqual(article.published_at, "2026-10-22")

    def test_parse_class_based_dou_markup(self):
        xml = """<article id="a1"><body>
          <p class="identifica">PORTARIA Nº 2, DE 22 DE OUTUBRO DE 2026</p>
          <p class="ementa">Autoriza concurso público com 10 vagas.</p>
          <p class="texto">O órgão autoriza concurso público para analista.</p>
        </body><pubDate>22/10/2026</pubDate><artType>Portaria</artType></article>"""
        articles = parse_dou_xml(xml, section="do3", edition_date="2026-10-22")
        self.assertEqual(len(articles), 1)
        self.assertIn("PORTARIA", articles[0].title)
        self.assertIn("10 vagas", articles[0].summary)
        self.assertIn("autoriza concurso", articles[0].body_text)

    def test_parse_metadata_item_fields(self):
        xml = """<article><body><p>O órgão autoriza concurso público com 15 vagas.</p></body>
          <metadata>
            <item name="urlTitle">concurso-teste</item>
            <item name="pubDate">2026-10-22</item>
            <item name="artType">Edital</item>
            <item name="hierarchyStr">Órgão de Teste</item>
          </metadata>
        </article>"""
        articles = parse_dou_xml(xml, section="do3", edition_date="2026-10-22")
        self.assertEqual(len(articles), 1)
        self.assertEqual(articles[0].url, "https://www.in.gov.br/web/dou/-/concurso-teste")
        self.assertEqual(articles[0].published_at, "2026-10-22")
        self.assertEqual(articles[0].art_type, "Edital")
        self.assertEqual(articles[0].hierarchy, "Órgão de Teste")

    def test_parse_archive_zip_and_filter_date(self):
        with tempfile.TemporaryDirectory() as tmp:
            archive = Path(tmp) / "DO3-2026-10-22.zip"
            with zipfile.ZipFile(archive, "w") as bundle:
                bundle.writestr("article-1.xml", ARTICLE_XML)
                bundle.writestr("article-2.xml", NAMESPACED_XML)
            all_articles = parse_dou_archive(archive, section="do3")
            self.assertEqual(len(all_articles), 2)
            filtered = parse_dou_archive(archive, section="do3", target_date="2026-10-22")
            self.assertEqual(len(filtered), 2)

    def test_parse_archive_rejects_non_xml(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "DO3-2026-10-22.pdf"
            path.write_bytes(b"%PDF-1.4")
            with self.assertRaises(DouOpenDataError):
                parse_dou_archive(path)

    def test_find_dou_archive_prefers_date(self):
        with tempfile.TemporaryDirectory() as tmp:
            first = Path(tmp) / "DO3-2026-10-21.zip"
            second = Path(tmp) / "DO3-2026-10-22.zip"
            first.write_bytes(b"x")
            second.write_bytes(b"x")
            found = find_dou_archive(tmp, target_date="2026-10-22")
            self.assertEqual(found, second)

    def test_discover_and_extract_without_network(self):
        with tempfile.TemporaryDirectory() as tmp:
            archive = Path(tmp) / "DO3-2026-10-22.zip"
            with zipfile.ZipFile(archive, "w") as bundle:
                bundle.writestr("article-1.xml", ARTICLE_XML)
            scraper = SimpleNamespace(settings=_settings(Path(tmp)))
            source = _source()
            candidates = discover(
                scraper,
                source,
                limit=5,
                dou_date=None,
                dou_file=archive,
            )
            self.assertEqual(len(candidates), 1)
            candidate = candidates[0]
            self.assertEqual(candidate.source_id, "dou")
            self.assertEqual(candidate.metadata["dou_article"]["title"], ARTICLE_XML.split("<identifica>")[1].split("</identifica>")[0])

            article = extract_article(scraper, source, candidate)
            self.assertEqual(article.metadata["type"], "dou_open_data")
            self.assertIn("194", article.body_text)
            self.assertEqual(article.facts.get("vacancies_total"), 194)
            self.assertIn("INSS", article.facts.get("organ", ""))

    def test_discover_reports_missing_archive(self):
        with tempfile.TemporaryDirectory() as tmp:
            scraper = SimpleNamespace(settings=_settings(Path(tmp)))
            with self.assertRaises(DouOpenDataError):
                discover(scraper, _source(), limit=5, dou_file=Path(tmp) / "nao-existe.zip")


if __name__ == "__main__":
    unittest.main()
