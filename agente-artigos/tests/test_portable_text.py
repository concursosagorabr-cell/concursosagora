from __future__ import annotations

import unittest

from pipeline.portable_text import markdown_to_portable_text


class PortableTextTest(unittest.TestCase):
    def test_headings_paragraphs_lists_and_bold(self):
        markdown = (
            "Abertura com **destaque**.\n\n"
            "## Seção\n"
            "Parágrafo da seção.\n\n"
            "- Primeiro item\n"
            "- Segundo item"
        )
        blocks = markdown_to_portable_text(markdown)
        styles = [block.get("style") for block in blocks]
        self.assertEqual(styles, ["normal", "h2", "normal", "normal", "normal"])
        self.assertEqual(blocks[1]["children"][0]["text"], "Seção")
        self.assertEqual(blocks[3]["listItem"], "bullet")
        marks = [mark for span in blocks[0]["children"] for mark in span.get("marks", [])]
        self.assertIn("strong", marks)

    def test_empty_markdown(self):
        self.assertEqual(markdown_to_portable_text(""), [])


if __name__ == "__main__":
    unittest.main()
