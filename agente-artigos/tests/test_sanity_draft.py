from __future__ import annotations

import unittest

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


if __name__ == "__main__":
    unittest.main()
