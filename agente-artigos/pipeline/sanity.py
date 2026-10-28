from __future__ import annotations

import json
import logging
import re
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pipeline.config import Settings
from pipeline.models import ExtractedArticle, GeneratedArticle
from pipeline.text import normalize, slugify

log = logging.getLogger(__name__)

AREA_LABELS = {
    "saude": "SaÃºde",
    "educacao": "EducaÃ§Ã£o",
    "seguranca": "SeguranÃ§a PÃºblica",
    "administracao": "AdministraÃ§Ã£o",
    "fiscal": "Fiscal",
    "judiciario": "JudiciÃ¡rio",
    "tecnologia": "Tecnologia",
    "financas": "FinanÃ§as",
    "infraestrutura": "Infraestrutura",
    "prefeituras": "Prefeituras",
    "nacional": "Nacional",
}


class SanityError(RuntimeError):
    pass


@dataclass
class SanityContext:
    posts: list[dict[str, Any]] = field(default_factory=list)
    authors: list[dict[str, Any]] = field(default_factory=list)
    categories: list[dict[str, Any]] = field(default_factory=list)
    images: list[dict[str, Any]] = field(default_factory=list)

    @property
    def existing_slugs(self) -> set[str]:
        slugs: set[str] = set()
        for post in self.posts:
            slug = str(post.get("slug") or "").strip()
            if slug:
                slugs.add(slug)
        return slugs

    @property
    def category_slugs(self) -> list[str]:
        return [str(category.get("slug") or "") for category in self.categories if category.get("slug")]

    def category_by_slug(self, slug: str) -> dict[str, Any] | None:
        key = slugify(slug)
        for category in self.categories:
            if slugify(str(category.get("slug") or "")) == key:
                return category
        normalized = normalize(slug)
        for category in self.categories:
            if normalize(str(category.get("title") or "")) == normalized:
                return category
        return None


class SanityClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.project_id = settings.sanity_project_id
        self.dataset = settings.sanity_dataset
        self.api_version = settings.sanity_api_version
        self.token = settings.sanity_token
        self.base_url = f"https://{self.project_id}.api.sanity.io/v{self.api_version}"
        self.data_url = f"{self.base_url}/data"
        self.asset_url = f"{self.base_url}/assets/images"
        self.asset_cache_path = settings.data_dir / "assets.json"

    def _headers(self, content_type: str = "application/json") -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": content_type,
            "Accept": "application/json",
            "User-Agent": "ConcursosAgoraPipeline/0.1",
        }

    def _request(
        self,
        method: str,
        url: str,
        *,
        body: bytes | None = None,
        content_type: str = "application/json",
        timeout: int = 90,
    ) -> dict[str, Any]:
        request = urllib.request.Request(
            url,
            data=body,
            headers=self._headers(content_type),
            method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                raw = response.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as exc:
            message = exc.read().decode("utf-8", errors="replace")
            raise SanityError(f"Sanity HTTP {exc.code}: {message[:700]}") from exc
        except urllib.error.URLError as exc:
            raise SanityError(f"Falha de rede no Sanity: {exc}") from exc
        if not raw.strip():
            return {}
        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            raise SanityError(f"Resposta nÃ£o-JSON do Sanity: {raw[:300]}") from exc

    def query(
        self,
        query: str,
        params: dict[str, Any] | None = None,
        *,
        perspective: str = "previewDrafts",
    ) -> Any:
        encoded = urllib.parse.urlencode({"perspective": perspective})
        url = f"{self.data_url}/query/{self.dataset}?{encoded}"
        payload = json.dumps({"query": query, "params": params or {}}).encode("utf-8")
        response = self._request("POST", url, body=payload)
        if "result" not in response:
            raise SanityError(f"Resposta inesperada do Sanity: {str(response)[:400]}")
        return response["result"]

    def get_context(self) -> SanityContext:
        query = """{
          "posts": *[_type == "post"] | order(publishedAt desc) {
            _id,
            _createdAt,
            _updatedAt,
            title,
            "slug": slug.current,
            contentHash,
            sourceUrls,
            publishedAt,
            reviewStatus,
            status,
            "author": author->{_id, name, "slug": slug.current},
            organ,
            banca,
            stateUf,
            cityName,
            contestKey
          },
          "authors": *[_type == "author"] | order(name asc) {
            _id,
            name,
            "slug": slug.current
          },
          "categories": *[_type == "category"] | order(title asc) {
            _id,
            title,
            "slug": slug.current,
            group
          },
          "images": *[_type == "imageLibrary" && active != false] {
            _id,
            title,
            category,
            tags,
            source,
            "image": image.asset._ref
          }
        }"""
        result = self.query(query)
        return SanityContext(
            posts=list(result.get("posts") or []),
            authors=list(result.get("authors") or []),
            categories=list(result.get("categories") or []),
            images=[image for image in result.get("images") or [] if image.get("image")],
        )

    def ping(self) -> dict[str, Any]:
        result = self.query(
            """{
              "posts": count(*[_type == "post" && !(_id in path("drafts.**"))]),
              "drafts": count(*[_id in path("drafts.**")]),
              "categories": count(*[_type == "category"])
            }""",
            perspective="raw",
        )
        return dict(result or {})

    def resolve_author(self, context: SanityContext, preferred_slug: str | None = None) -> dict[str, Any] | None:
        if not context.authors:
            return None
        if preferred_slug:
            for author in context.authors:
                if slugify(str(author.get("slug") or "")) == slugify(preferred_slug):
                    return author
        # Prefere a redaÃ§Ã£o, quando existir.
        for author in context.authors:
            if "redacao" in normalize(str(author.get("name") or "")):
                return author
        return context.authors[0]

    def resolve_categories(
        self,
        context: SanityContext,
        requested_slugs: list[str],
        *,
        fallback: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        selected: list[dict[str, Any]] = []
        seen: set[str] = set()
        for slug in requested_slugs + (fallback or []):
            key = slugify(slug)
            if key in seen:
                continue
            category = context.category_by_slug(slug)
            if category and category.get("_id") not in {item.get("_id") for item in selected}:
                selected.append(category)
                seen.add(key)
        if not selected and context.categories:
            selected.append(context.categories[0])
        refs: list[dict[str, Any]] = []
        for index, category in enumerate(selected[:4]):
            refs.append(
                {
                    "_type": "reference",
                    "_ref": category["_id"],
                    "_key": f"cat-{index}",
                }
            )
        return refs

    def _load_asset_cache(self) -> dict[str, Any]:
        if not self.asset_cache_path.exists():
            return {}
        try:
            return json.loads(self.asset_cache_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return {}

    def _save_asset_cache(self, cache: dict[str, Any]) -> None:
        self.asset_cache_path.parent.mkdir(parents=True, exist_ok=True)
        self.asset_cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")

    def upload_image_from_url(self, url: str, *, title: str, credit: str) -> dict[str, Any] | None:
        if not url:
            return None
        cache = self._load_asset_cache()
        cached = cache.get(url)
        if cached and cached.get("_ref"):
            return cached
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": "ConcursosAgoraPipeline/0.1 (+https://www.concursosagora.com.br)",
                "Accept": "image/avif,image/webp,image/png,image/jpeg,*/*",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                data = response.read(8 * 1024 * 1024 + 1)
                content_type = (response.headers.get("Content-Type") or "image/jpeg").split(";")[0].strip()
        except Exception as exc:  # noqa: BLE001
            log.warning("NÃ£o foi possÃ­vel baixar a imagem %s: %s", url, exc)
            return None
        if len(data) > 8 * 1024 * 1024:
            log.warning("Imagem ignorada por exceder 8 MB: %s", url)
            return None
        if not content_type.startswith("image/"):
            log.warning("ConteÃºdo nÃ£o Ã© imagem (%s): %s", content_type, url)
            return None
        extension = {"image/png": "png", "image/webp": "webp", "image/gif": "gif"}.get(content_type, "jpg")
        filename = f"{slugify(title, 60) or 'fonte'}-{abs(hash(url)) % 100000}.{extension}"
        asset_url = f"{self.asset_url}/{self.dataset}?filename={urllib.parse.quote(filename)}"
        try:
            response = self._request(
                "POST",
                asset_url,
                body=data,
                content_type=content_type,
                timeout=120,
            )
        except SanityError as exc:
            log.warning("Falha ao enviar imagem ao Sanity: %s", exc)
            return None
        document = response.get("document") or {}
        asset_id = document.get("_id")
        if not asset_id:
            log.warning("Sanity nÃ£o retornou id do asset de imagem: %s", str(response)[:300])
            return None
        result = {
            "_type": "image",
            "asset": {"_type": "reference", "_ref": asset_id},
            "alt": title,
            "credit": credit,
        }
        cache[url] = result
        self._save_asset_cache(cache)
        return result

    def select_image(
        self,
        context: SanityContext,
        article: ExtractedArticle,
        generated: GeneratedArticle,
        *,
        allow_upload: bool = True,
        used_refs: set[str] | None = None,
    ) -> dict[str, Any] | None:
        used_refs = used_refs or set()
        if allow_upload and article.image_url:
            uploaded = self.upload_image_from_url(
                article.image_url,
                title=article.image_alt or generated.title,
                credit=article.source_name,
            )
            if uploaded:
                return uploaded

        if not context.images:
            return None
        facts = article.facts
        state = str(facts.get("state_uf") or "")
        areas = infer_area_slugs(article, generated)
        haystack = normalize(
            " ".join(
                [
                    article.title,
                    article.summary,
                    generated.title,
                    " ".join(generated.keywords),
                    str(facts.get("organ") or ""),
                    generated.body_markdown[:2500],
                ]
            )
        )
        scored: list[tuple[float, dict[str, Any]]] = []
        for image in context.images:
            score = 0.0
            category = normalize(str(image.get("category") or ""))
            tags = [normalize(str(tag)) for tag in image.get("tags") or []]
            if state and state not in {"Nacional", "BR"}:
                if category == normalize(state) or normalize(state) in tags:
                    score += 6
            for area in areas:
                label = AREA_LABELS.get(area)
                if label and category == normalize(label):
                    score += 4
            if category in {"nacional", "brasil"} and str(facts.get("sphere") or "") in {"FEDERAL", "NACIONAL"}:
                score += 2
            for tag in tags:
                if len(tag) >= 4 and tag in haystack:
                    score += 1
            ref = str(image.get("image") or "")
            if ref in used_refs:
                score -= 100
            scored.append((score, image))
        scored.sort(key=lambda item: (-item[0], str(item[1].get("title") or ""), str(item[1].get("_id") or "")))
        if not scored:
            return None
        chosen = scored[0][1]
        ref = str(chosen.get("image") or "")
        if not ref:
            return None
        return {
            "_type": "image",
            "asset": {"_type": "reference", "_ref": ref},
            "alt": f"Imagem ilustrativa sobre {generated.title}",
            "credit": str(chosen.get("source") or "Banco de imagens"),
        }

    def create_draft(self, document: dict[str, Any]) -> dict[str, Any]:
        document_id = str(document.get("_id") or "")
        if not document_id.startswith("drafts."):
            raise SanityError(
                f"Por segurança, create_draft só aceita IDs 'drafts.*'; recebido: {document_id!r}"
            )
        url = f"{self.data_url}/mutate/{self.dataset}?returnIds=true"
        payload = json.dumps({"mutations": [{"createIfNotExists": document}]}).encode("utf-8")
        response = self._request("POST", url, body=payload)
        # A API retorna transactionId e results; o id do documento é o que nos interessa.
        results = response.get("results") or []
        if results and isinstance(results[0], dict) and results[0].get("id"):
            created_id = str(results[0]["id"])
        else:
            created_id = document_id
        if not created_id.startswith("drafts."):
            raise SanityError(
                f"Sanity retornou um ID sem o prefixo 'drafts.': {created_id!r}"
            )
        return {"id": created_id, "response": response}

    def create_or_replace(
        self,
        document: dict[str, Any],
        *,
        allow_published: bool = False,
    ) -> dict[str, Any]:
        """Cria ou substitui um documento do tipo post.

        O pipeline editorial normal usa apenas ``create_draft``. Este método é
        exclusivo do postador de artigos escritos pelo usuário e só aceita
        documentos ``_type == "post"``. Para sobrescrever um documento
        publicado é preciso passar ``allow_published=True`` explicitamente.
        """
        if document.get("_type") != "post":
            raise SanityError(
                f"create_or_replace só aceita documentos _type='post'; recebido: {document.get('_type')!r}"
            )
        document_id = str(document.get("_id") or "")
        if not document_id:
            raise SanityError("create_or_replace exige um _id.")
        if not document_id.startswith("drafts.") and not allow_published:
            raise SanityError(
                "create_or_replace recusou sobrescrever um documento publicado; "
                "use allow_published=True somente quando a substituição for intencional."
            )
        url = f"{self.data_url}/mutate/{self.dataset}?returnIds=true"
        payload = json.dumps({"mutations": [{"createOrReplace": document}]}).encode("utf-8")
        response = self._request("POST", url, body=payload)
        results = response.get("results") or []
        if results and isinstance(results[0], dict) and results[0].get("id"):
            saved_id = str(results[0]["id"])
        else:
            saved_id = document_id
        return {"id": saved_id, "response": response}

    def patch_document(
        self,
        document_id: str,
        fields: dict[str, Any],
        *,
        allow_published: bool = False,
    ) -> dict[str, Any]:
        if not str(document_id).startswith("drafts.") and not allow_published:
            raise SanityError(
                "Por segurança, patch_document só aceita IDs 'drafts.*'; "
                f"para publicados, use allow_published=True. Recebido: {document_id!r}"
            )
        url = f"{self.data_url}/mutate/{self.dataset}"
        payload = json.dumps(
            {"mutations": [{"patch": {"id": document_id, "set": fields}}]}
        ).encode("utf-8")
        return self._request("POST", url, body=payload)

    def delete_document(self, document_id: str) -> dict[str, Any]:
        if not str(document_id).startswith("drafts."):
            raise SanityError(
                f"Por segurança, delete_document só aceita IDs 'drafts.*'; recebido: {document_id!r}"
            )
        url = f"{self.data_url}/mutate/{self.dataset}"
        payload = json.dumps({"mutations": [{"delete": {"id": document_id}}]}).encode("utf-8")
        return self._request("POST", url, body=payload)

    def webhook_revalidate(self, secret: str) -> bool:
        site = self.settings.frontend_url.rstrip("/")
        if not site or not secret:
            return False
        # O endpoint /api/revalidate aceita apenas POST e recebe o segredo no
        # cabeçalho Authorization, nunca na query string.
        url = f"{site}/api/revalidate"
        payload = json.dumps({"tags": ["posts"]}).encode("utf-8")
        request = urllib.request.Request(
            url,
            data=payload,
            method="POST",
            headers={
                "Authorization": f"Bearer {secret}",
                "Content-Type": "application/json",
                "User-Agent": "ConcursosAgoraPipeline/0.1",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return 200 <= response.status < 300
        except Exception as exc:  # noqa: BLE001
            log.warning("Revalidação do frontend falhou: %s", exc)
            return False


def infer_area_slugs(article: ExtractedArticle, generated: GeneratedArticle) -> list[str]:
    haystack = normalize(
        " ".join(
            [
                article.title,
                article.summary,
                article.body_text[:3000],
                generated.title,
                generated.body_markdown[:3000],
            ]
        )
    )
    areas: list[str] = []
    rules = {
        "saude": r"saude|medic|enfermeir|hospital|sus|residencia medica|odont|farmac|psicolog",
        "educacao": r"educacao|professor|docente|pedagog|magisterio|secretaria de educacao",
        "seguranca": r"policia|seguranca publica|delegado|guarda municipal|penal|penitenciari|bombeir|agente de policia",
        "administracao": r"administrativ|analista|assistente|tecnico administrativo|gestao",
        "fiscal": r"fiscal|auditor|tributari|receita|arrecadacao",
        "judiciario": r"tribunal|poder judiciario|justica|ministerio publico|promotor|juiz",
        "tecnologia": r"tecnologia|informatica|software|\bdados\b|desenvolvimento|\bti\b",
        "financas": r"financ|banco|contabil|economi",
        "infraestrutura": r"engenharia|obras|rodovia|infraestrutura|arquitet",
        "prefeituras": r"prefeitura|camara municipal|municipal",
    }
    for area, pattern in rules.items():
        if re.search(pattern, haystack):
            areas.append(area)
    return areas


def fix_datetime_of_source(value: str | None) -> str:
    if value:
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc).isoformat()
        except ValueError:
            pass
    return datetime.now(timezone.utc).isoformat()
