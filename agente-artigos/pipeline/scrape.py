from __future__ import annotations

import logging
import random
import time
import urllib.robotparser
from dataclasses import dataclass, field
from datetime import datetime, timezone
from urllib.parse import urlparse

from bs4 import BeautifulSoup
from scrapling.fetchers import FetcherSession

from pipeline.config import Settings

log = logging.getLogger(__name__)


class RobotsDenied(RuntimeError):
    """A URL foi bloqueada pelo robots.txt da fonte."""


class FetchError(RuntimeError):
    """Falha definitiva ao buscar uma URL."""


@dataclass
class ScrapedPage:
    url: str
    status: int
    html: str
    soup: BeautifulSoup
    text: str
    fetched_at: str
    headers: dict = field(default_factory=dict)
    encoding: str | None = None


def decode_response_body(response) -> str:
    """Decodifica o corpo bruto do Scrapling sem depender do parser interno.

    O parser do Scrapling 0.5 pode devolver caracteres mojibake em páginas
    UTF-8; o body bruto é a fonte confiável.
    """
    body = getattr(response, "body", None)
    if isinstance(body, bytes) and body:
        candidates = ["utf-8-sig", "utf-8", getattr(response, "encoding", None), "cp1252", "latin-1"]
        for encoding in candidates:
            if not encoding:
                continue
            try:
                text = body.decode(str(encoding))
            except (UnicodeDecodeError, LookupError):
                continue
            if text.count("\ufffd") <= 1:
                return text
        return body.decode("utf-8", errors="replace")
    html_content = getattr(response, "html_content", "") or ""
    return str(html_content)


def domain_allowed(url: str, allowed_domains: list[str]) -> bool:
    if not allowed_domains:
        return True
    netloc = urlparse(url).netloc.lower().split("@")[-1]
    netloc = netloc.split(":")[0]
    for domain in allowed_domains:
        domain = domain.lower().strip()
        if netloc == domain or netloc.endswith("." + domain):
            return True
    return False


class Scraper:
    """Fetcher HTTP educado, com robots.txt e atraso entre requisições."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.session = None
        self._cm = None
        self._robots: dict[str, urllib.robotparser.RobotFileParser] = {}
        self._last_request: dict[str, float] = {}
        self._cache: dict[str, ScrapedPage] = {}

    def __enter__(self) -> "Scraper":
        self._cm = FetcherSession(impersonate="chrome")
        self.session = self._cm.__enter__()
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        if self._cm is not None:
            self._cm.__exit__(exc_type, exc, tb)
        self.session = None
        self._cm = None

    def _polite_wait(self, url: str) -> None:
        origin = "{0.scheme}://{0.netloc}".format(urlparse(url))
        last = self._last_request.get(origin)
        delay = max(0.2, float(self.settings.request_delay))
        if last is not None:
            elapsed = time.monotonic() - last
            if elapsed < delay:
                time.sleep(delay - elapsed + random.uniform(0, 0.25))
        self._last_request[origin] = time.monotonic()

    def _raw_request(self, url: str):
        if self.session is None:
            raise FetchError("Scraper não inicializado. Use o context manager 'with Scraper(...)'.")
        last_error: Exception | None = None
        for attempt in range(3):
            try:
                self._polite_wait(url)
                response = self.session.get(
                    url,
                    stealthy_headers=True,
                    timeout=self.settings.fetch_timeout,
                )
                status = int(getattr(response, "status", 0) or 0)
                if status in {429, 500, 502, 503, 504}:
                    time.sleep(1.5 * (attempt + 1))
                    continue
                return response
            except Exception as exc:  # noqa: BLE001 - queremos capturar falhas de rede variadas
                last_error = exc
                time.sleep(1.0 * (attempt + 1))
        raise FetchError(f"Falha ao buscar {url}: {last_error}")

    def _robots_for(self, url: str) -> urllib.robotparser.RobotFileParser:
        parsed = urlparse(url)
        origin = f"{parsed.scheme}://{parsed.netloc}"
        cached = self._robots.get(origin)
        if cached is not None:
            return cached

        parser = urllib.robotparser.RobotFileParser()
        parser.set_url(origin + "/robots.txt")
        try:
            response = self._raw_request(origin + "/robots.txt")
            status = int(getattr(response, "status", 0) or 0)
            if status == 404:
                parser.allow_all = True
            elif status in {401, 403}:
                parser.disallow_all = True
            elif 200 <= status < 300:
                parser.parse(decode_response_body(response).splitlines())
            else:
                parser.allow_all = True
        except Exception as exc:  # noqa: BLE001
            log.warning("robots.txt indisponível em %s: %s", origin, exc)
            parser.allow_all = True
        self._robots[origin] = parser
        return parser

    def fetch(self, url: str) -> ScrapedPage:
        cached = self._cache.get(url)
        if cached is not None:
            return cached
        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"}:
            raise FetchError(f"URL inválida: {url}")
        if self.settings.respect_robots:
            parser = self._robots_for(url)
            if not parser.can_fetch("*", url):
                raise RobotsDenied(f"robots.txt não permite acessar {url}")
        response = self._raw_request(url)
        status = int(getattr(response, "status", 0) or 0)
        if status >= 400:
            raise FetchError(f"HTTP {status} em {url}")
        html = decode_response_body(response)
        soup = BeautifulSoup(html, "lxml")
        text = " ".join(soup.get_text(" ", strip=True).split())
        headers = {str(k).lower(): str(v) for k, v in dict(getattr(response, "headers", {}) or {}).items()}
        page = ScrapedPage(
            url=str(getattr(response, "url", url) or url),
            status=status,
            html=html,
            soup=soup,
            text=text,
            fetched_at=datetime.now(timezone.utc).isoformat(),
            headers=headers,
            encoding=getattr(response, "encoding", None),
        )
        self._cache[url] = page
        return page