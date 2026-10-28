from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from pipeline.postador import (
    PostadorError,
    build_post_document,
    normalize_item,
    parse_date_value,
    parse_int_value,
    parse_salary_range,
    run_post_bundle,
)
from pipeline.sanity import SanityClient, SanityContext
from tests.helpers import make_settings


def make_context() -> SanityContext:
    return SanityContext(
        posts=[],
        authors=[
            {"_id": "author-amanda", "name": "Amanda Marques", "slug": "amanda-marques"},
            {"_id": "author-gleice", "name": "Gleice Melo", "slug": "gleice-melo"},
        ],
        categories=[
            {
                "_id": "cat-legislativo",
                "title": "Legislativo",
                "slug": "legislativo",
                "group": "area",
            },
            {
                "_id": "cat-federal",
                "title": "Federal",
                "slug": "federal",
                "group": "area",
            },
            {
                "_id": "cat-abertos",
                "title": "Concursos Abertos",
                "slug": "concursos-abertos",
                "group": "status",
            },
        ],
    )


def sample_item() -> dict:
    return {
        "title": "Concurso Câmara dos Deputados: 184 vagas para Analista",
        "excerpt": "Edital do Cebraspe tem 184 vagas e salário de R$ 32 mil.",
        "body_markdown": (
            "A Câmara dos Deputados publicou edital de concurso público.\n\n"
            "## Ficha Técnica Oficial\n\n"
            "- **Órgão:** Câmara dos Deputados\n"
            "- **Vagas:** 184\n\n"
            "## Link Oficial\n\n"
            "[Página oficial](https://www.cebraspe.org.br/concursos/)"
        ),
        "author_slug": "amanda-marques",
        "status": "aberto",
        "contest_status": "inscricoes_abertas",
        "organ": "Câmara dos Deputados",
        "sphere": "FEDERAL",
        "banca": "Cebraspe",
        "state_uf": "Nacional",
        "education_level": ["superior"],
        "vacancies_total": 184,
        "salary_min": 32070.88,
        "salary_max": 32070.88,
        "registration_fee": 130.0,
        "enrollment_start_date": "2026-10-15",
        "enrollment_end_date": "2026-11-17",
        "exam_date": "2027-01-17",
        "categories": ["legislativo", "federal", "concursos-abertos"],
        "source_urls": [
            {
                "title": "Página oficial",
                "url": "https://www.cebraspe.org.br/concursos/",
                "type": "official",
                "kind": "official_primary",
                "usage": "facts",
            }
        ],
        "seo": {
            "meta_title": "Concurso Câmara: 184 vagas",
            "meta_description": "Edital do Cebraspe tem 184 vagas e salário de R$ 32 mil.",
            "keywords": ["câmara", "cebraspe"],
        },
    }


class PostadorParsingTest(unittest.TestCase):
    def test_dates(self):
        self.assertEqual(parse_date_value("2026-10-15"), "2026-10-15")
        self.assertEqual(parse_date_value("15/10/2026"), "2026-10-15")
        self.assertEqual(parse_date_value("15 de outubro de 2026"), "2026-10-15")
        self.assertEqual(parse_date_value("2026-10-15T12:00:00-03:00"), "2026-10-15")
        self.assertIsNone(parse_date_value(""))

    def test_numbers(self):
        self.assertEqual(parse_int_value("66 imediatas + 118 CR (Total: 184)"), 184)
        self.assertEqual(parse_int_value("66 + 118"), 184)
        self.assertEqual(parse_int_value("184 vagas"), 184)
        self.assertEqual(parse_salary_range("R$ 32.070,88"), (32070.88, 32070.88))
        self.assertEqual(
            parse_salary_range("R$ 20.000,00 a R$ 30.000,00"),
            (20000.0, 30000.0),
        )

    def test_markdown_table_is_converted_to_bullets(self):
        raw = sample_item()
        raw["body_markdown"] = (
            "A Câmara publicou o edital.\n\n"
            "## Ficha Técnica Oficial\n\n"
            "| Campo | Valor |\n"
            "| --- | --- |\n"
            "| Órgão | Câmara dos Deputados |\n"
            "| Vagas | 184 |\n\n"
            "## Link Oficial\n\n"
            "Página oficial."
        )
        item = normalize_item(raw, 1)
        self.assertIn("- **Órgão:** Câmara dos Deputados", item["body_markdown"])
        self.assertIn("- **Vagas:** 184", item["body_markdown"])
        self.assertNotIn("| Campo |", item["body_markdown"])

    def test_normalize_item(self):
        item = normalize_item(sample_item(), 1)
        self.assertEqual(item["slug"], "concurso-camara-dos-deputados-184-vagas-para-analista")
        self.assertEqual(item["enrollment_start_date"], "2026-10-15")
        self.assertEqual(item["exam_date"], "2027-01-17")
        self.assertEqual(item["salary_min"], 32070.88)
        self.assertEqual(item["salary_max"], 32070.88)
        self.assertEqual(item["categories"], ["legislativo", "federal", "concursos-abertos"])
        self.assertLessEqual(len(item["seo"]["metaTitle"]), 70)
        self.assertLessEqual(len(item["seo"]["metaDescription"]), 160)


class PostadorDocumentTest(unittest.TestCase):
    def setUp(self):
        self.settings = make_settings()
        self.client = SanityClient(self.settings)
        self.context = make_context()

    def test_build_draft(self):
        item = normalize_item(sample_item(), 1)
        document, meta = build_post_document(
            item,
            context=self.context,
            sanity=self.client,
            publish=False,
            force=False,
            dry_run=True,
            run_id="postador-test",
        )
        self.assertEqual(document["_id"], "drafts." + meta["slug"])
        self.assertEqual(document["_type"], "post")
        self.assertEqual(document["reviewStatus"], "pending")
        self.assertFalse(document["aiAssisted"])
        self.assertEqual(document["author"]["_ref"], "author-amanda")
        self.assertEqual(len(document["categories"]), 3)
        self.assertEqual(document["status"], "aberto")
        self.assertEqual(document["contestStatus"], "inscricoes_abertas")
        self.assertEqual(document["salaryMin"], 32070.88)
        self.assertEqual(document["stateUf"], "Nacional")
        self.assertNotIn("location", document)
        self.assertEqual(document["sourceUrls"][0]["_type"], "sourceReference")
        self.assertTrue(document["body"])
        self.assertEqual(document["body"][0]["_type"], "block")

    def test_build_published(self):
        item = normalize_item(sample_item(), 1)
        document, meta = build_post_document(
            item,
            context=self.context,
            sanity=self.client,
            publish=True,
            force=False,
            dry_run=False,
            run_id="postador-test",
        )
        self.assertEqual(document["_id"], meta["slug"])
        self.assertEqual(document["reviewStatus"], "approved")

    def test_unknown_author_is_rejected(self):
        raw = sample_item()
        raw["author_slug"] = "nao-existe"
        item = normalize_item(raw, 1)
        with self.assertRaises(PostadorError):
            build_post_document(
                item,
                context=self.context,
                sanity=self.client,
                publish=False,
                force=False,
                dry_run=True,
                run_id="postador-test",
            )

    def test_slug_is_made_unique(self):
        self.context.posts = [
            {
                "_id": "drafts.concurso-camara-dos-deputados-184-vagas-para-analista",
                "slug": "concurso-camara-dos-deputados-184-vagas-para-analista",
                "title": "Outro post",
            }
        ]
        item = normalize_item(sample_item(), 1)
        document, meta = build_post_document(
            item,
            context=self.context,
            sanity=self.client,
            publish=False,
            force=False,
            dry_run=True,
            run_id="postador-test",
        )
        self.assertTrue(meta["slug"].endswith("-2"))
        self.assertEqual(document["_id"], "drafts." + meta["slug"])


class PostadorRunTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.settings = make_settings(
            data_dir=self.root / "data",
            frontend_url="https://www.example.com",
            env={"SANITY_REVALIDATE_SECRET": "secret"},
        )
        self.client = SanityClient(self.settings)
        self.context = make_context()
        self.bundle_path = self.root / "bundle.json"

    def tearDown(self):
        self.temp.cleanup()

    def write_bundle(self, count: int = 1) -> None:
        bundle = {"run_id": "postador-test", "articles": [sample_item() for _ in range(count)]}
        self.bundle_path.write_text(json.dumps(bundle, ensure_ascii=False), encoding="utf-8")

    def test_dry_run_validates_and_writes_summary(self):
        self.write_bundle(count=2)
        summary = run_post_bundle(
            self.bundle_path,
            settings=self.settings,
            sanity=self.client,
            context=self.context,
        )
        self.assertEqual(summary["total"], 2)
        self.assertEqual(summary["dry_run"], 1)
        self.assertEqual(summary["skipped"], 1)
        self.assertEqual(summary["created"], 0)
        self.assertEqual(summary["errors"], 0)
        self.assertEqual(summary["items"][1]["status"], "skipped_duplicate")
        self.assertTrue(Path(summary["summary_path"]).exists())

    def test_allow_duplicate_creates_unique_slugs(self):
        self.write_bundle(count=2)
        summary = run_post_bundle(
            self.bundle_path,
            allow_duplicate=True,
            settings=self.settings,
            sanity=self.client,
            context=self.context,
        )
        self.assertEqual(summary["dry_run"], 2)
        self.assertEqual(summary["skipped"], 0)
        self.assertNotEqual(summary["items"][0]["slug"], summary["items"][1]["slug"])

    def test_existing_post_is_skipped_by_default(self):
        self.write_bundle()
        self.context.posts = [
            {
                "_id": "concurso-camara-dos-deputados-184-vagas-para-analista",
                "slug": "concurso-camara-dos-deputados-184-vagas-para-analista",
                "title": sample_item()["title"],
                "publishedAt": "2026-10-15T12:00:00.000Z",
            }
        ]
        with patch.object(SanityClient, "create_or_replace") as mocked:
            summary = run_post_bundle(
                self.bundle_path,
                publish=True,
                settings=self.settings,
                sanity=self.client,
                context=self.context,
            )
        self.assertEqual(summary["skipped"], 1)
        self.assertEqual(summary["published"], 0)
        self.assertEqual(summary["items"][0]["status"], "skipped_duplicate")
        self.assertTrue(summary["items"][0]["url"].startswith("https://www.example.com/post/"))
        mocked.assert_not_called()

    def test_update_existing_post_preserves_slug_and_date(self):
        self.write_bundle()
        existing_id = "concurso-camara-dos-deputados-184-vagas-para-analista"
        self.context.posts = [
            {
                "_id": existing_id,
                "slug": existing_id,
                "title": sample_item()["title"],
                "publishedAt": "2026-10-15T12:00:00.000Z",
            }
        ]
        with (
            patch.object(SanityClient, "create_or_replace", return_value={"id": existing_id}) as mocked,
            patch.object(SanityClient, "webhook_revalidate", return_value=True),
        ):
            summary = run_post_bundle(
                self.bundle_path,
                update=True,
                settings=self.settings,
                sanity=self.client,
                context=self.context,
            )
        self.assertEqual(summary["updated"], 1)
        self.assertEqual(summary["skipped"], 0)
        document = mocked.call_args.args[0]
        self.assertEqual(document["_id"], existing_id)
        self.assertEqual(document["slug"]["current"], existing_id)
        self.assertEqual(document["publishedAt"], "2026-10-15T12:00:00.000Z")
        self.assertEqual(document["reviewStatus"], "approved")
        self.assertTrue(mocked.call_args.kwargs["allow_published"])

    def test_update_preserves_existing_main_image_when_omitted(self):
        self.write_bundle()
        existing_id = "concurso-camara-dos-deputados-184-vagas-para-analista"
        existing_image = {
            "_type": "image",
            "asset": {
                "_type": "reference",
                "_ref": "image-abc123-1880x1253-jpg",
            },
            "alt": "Imagem existente do post",
            "credit": "Pexels",
        }
        self.context.posts = [
            {
                "_id": existing_id,
                "slug": existing_id,
                "title": sample_item()["title"],
                "publishedAt": "2026-10-15T12:00:00.000Z",
                "mainImage": existing_image,
            }
        ]
        with (
            patch.object(
                SanityClient, "create_or_replace", return_value={"id": existing_id}
            ) as mocked,
            patch.object(SanityClient, "webhook_revalidate", return_value=True),
        ):
            summary = run_post_bundle(
                self.bundle_path,
                update=True,
                settings=self.settings,
                sanity=self.client,
                context=self.context,
            )
        document = mocked.call_args.args[0]
        self.assertEqual(document["mainImage"], existing_image)
        self.assertTrue(
            any(
                "imagem principal existente preservada" in warning
                for warning in summary["items"][0]["warnings"]
            )
        )

    def test_update_preserves_existing_author_when_omitted(self):
        self.write_bundle()
        bundle = json.loads(self.bundle_path.read_text(encoding="utf-8"))
        bundle["articles"][0].pop("author_slug", None)
        self.bundle_path.write_text(
            json.dumps(bundle, ensure_ascii=False), encoding="utf-8"
        )
        existing_id = "concurso-camara-dos-deputados-184-vagas-para-analista"
        self.context.posts = [
            {
                "_id": existing_id,
                "slug": existing_id,
                "title": sample_item()["title"],
                "publishedAt": "2026-10-15T12:00:00.000Z",
                "author": {
                    "_id": "author-gleice",
                    "name": "Gleice Melo",
                    "slug": "gleice-melo",
                },
            }
        ]
        with (
            patch.object(
                SanityClient, "create_or_replace", return_value={"id": existing_id}
            ) as mocked,
            patch.object(SanityClient, "webhook_revalidate", return_value=True),
        ):
            summary = run_post_bundle(
                self.bundle_path,
                update=True,
                settings=self.settings,
                sanity=self.client,
                context=self.context,
            )
        document = mocked.call_args.args[0]
        self.assertEqual(document["author"]["_ref"], "author-gleice")
        self.assertTrue(
            any(
                "autor existente preservado" in warning
                for warning in summary["items"][0]["warnings"]
            )
        )

    def test_update_explicit_author_overrides_existing(self):
        self.write_bundle()
        existing_id = "concurso-camara-dos-deputados-184-vagas-para-analista"
        self.context.posts = [
            {
                "_id": existing_id,
                "slug": existing_id,
                "title": sample_item()["title"],
                "publishedAt": "2026-10-15T12:00:00.000Z",
                "author": {
                    "_id": "author-gleice",
                    "name": "Gleice Melo",
                    "slug": "gleice-melo",
                },
            }
        ]
        with (
            patch.object(
                SanityClient, "create_or_replace", return_value={"id": existing_id}
            ) as mocked,
            patch.object(SanityClient, "webhook_revalidate", return_value=True),
        ):
            run_post_bundle(
                self.bundle_path,
                update=True,
                settings=self.settings,
                sanity=self.client,
                context=self.context,
            )
        document = mocked.call_args.args[0]
        self.assertEqual(document["author"]["_ref"], "author-amanda")

    def test_update_published_warns_about_stale_draft(self):
        self.write_bundle()
        published_id = "concurso-camara-dos-deputados-184-vagas-para-analista"
        draft_id = f"drafts.{published_id}"
        self.context.posts = [
            {
                "_id": published_id,
                "slug": published_id,
                "title": sample_item()["title"],
                "publishedAt": "2026-10-15T12:00:00.000Z",
            },
            {
                "_id": draft_id,
                "slug": published_id,
                "title": sample_item()["title"],
                "publishedAt": "2026-10-20T12:00:00.000Z",
            },
        ]
        with (
            patch.object(SanityClient, "create_or_replace", return_value={"id": published_id}),
            patch.object(SanityClient, "webhook_revalidate", return_value=True),
        ):
            summary = run_post_bundle(
                self.bundle_path,
                update=True,
                settings=self.settings,
                sanity=self.client,
                context=self.context,
            )
        self.assertEqual(summary["updated"], 1)
        warnings = summary["items"][0]["warnings"]
        self.assertTrue(any("rascunho" in warning for warning in warnings))

    def test_force_overwrites_existing_draft_slug(self):
        self.write_bundle()
        slug = "concurso-camara-dos-deputados-184-vagas-para-analista"
        self.context.posts = [
            {
                "_id": f"drafts.{slug}",
                "slug": slug,
                "title": sample_item()["title"],
                "publishedAt": "2026-10-15T12:00:00.000Z",
            }
        ]
        with patch.object(
            SanityClient, "create_or_replace", return_value={"id": f"drafts.{slug}"}
        ) as mocked:
            summary = run_post_bundle(
                self.bundle_path,
                apply=True,
                force=True,
                settings=self.settings,
                sanity=self.client,
                context=self.context,
            )
        self.assertEqual(summary["created"], 1)
        self.assertEqual(summary["skipped"], 0)
        document = mocked.call_args.args[0]
        self.assertEqual(document["_id"], f"drafts.{slug}")
        self.assertFalse(mocked.call_args.kwargs["allow_published"])

    def test_apply_creates_drafts(self):
        self.write_bundle()
        with patch.object(SanityClient, "create_draft", return_value={"id": "drafts.test"}) as mocked:
            summary = run_post_bundle(
                self.bundle_path,
                apply=True,
                settings=self.settings,
                sanity=self.client,
                context=self.context,
            )
        self.assertEqual(summary["created"], 1)
        self.assertEqual(summary["items"][0]["sanity_id"], "drafts.test")
        document = mocked.call_args.args[0]
        self.assertTrue(document["_id"].startswith("drafts."))
        self.assertEqual(document["reviewStatus"], "pending")

    def test_publish_creates_published_post_and_revalidates(self):
        self.write_bundle()
        with (
            patch.object(SanityClient, "create_or_replace", return_value={"id": "test"}) as mocked,
            patch.object(SanityClient, "webhook_revalidate", return_value=True),
        ):
            summary = run_post_bundle(
                self.bundle_path,
                publish=True,
                settings=self.settings,
                sanity=self.client,
                context=self.context,
            )
        self.assertEqual(summary["published"], 1)
        self.assertTrue(summary["revalidated"])
        self.assertTrue(summary["items"][0]["url"].startswith("https://www.example.com/post/"))
        document = mocked.call_args.args[0]
        self.assertFalse(document["_id"].startswith("drafts."))
        self.assertEqual(document["reviewStatus"], "approved")
        self.assertTrue(mocked.call_args.kwargs["allow_published"])


if __name__ == "__main__":
    unittest.main()
