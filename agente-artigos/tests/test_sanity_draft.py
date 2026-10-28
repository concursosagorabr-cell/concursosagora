from __future__ import annotations

import unittest
from unittest.mock import patch

from pipeline.sanity import SanityClient, SanityError
from tests.helpers import make_settings


class SanityDraftGuardTest(unittest.TestCase):
    def test_create_draft_rejects_non_draft_id_without_network(self):
        client = SanityClient(make_settings())
        with self.assertRaises(SanityError):
            client.create_draft({"_id": "post-publicado", "_type": "post"})

    def test_patch_and_delete_reject_non_draft_id_without_network(self):
        client = SanityClient(make_settings())
        with self.assertRaises(SanityError):
            client.patch_document("post-publicado", {"title": "x"})
        with self.assertRaises(SanityError):
            client.delete_document("post-publicado")

    def test_patch_published_allows_explicit_override(self):
        client = SanityClient(make_settings())
        with patch.object(client, "_request", return_value={"results": []}) as mocked:
            client.patch_document(
                "post-publicado",
                {"title": "x"},
                allow_published=True,
            )
        self.assertTrue(mocked.called)


if __name__ == "__main__":
    unittest.main()
