from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlparse

# Fontes oficiais: a informação nasce aqui.
OFFICIAL_SUFFIXES = (
    ".gov.br",
    ".jus.br",
    ".leg.br",
    ".mp.br",
    ".def.br",
    ".mil.br",
    ".edu.br",
)

# Bancas organizadoras. A página da banca é a fonte primária do certame,
# mesmo quando o domínio não termina em .gov.br.
OFFICIAL_BANCA_DOMAINS = (
    "vunesp.com.br",
    "conhecimento.fgv.br",
    "fgv.br",
    "cebraspe.org.br",
    "cesgranrio.org.br",
    "concursosfcc.com.br",
    "ibfc.org.br",
    "aocp.com.br",
    "idecan.org.br",
    "quadrix.org.br",
    "consulplan.net",
    "iades.com.br",
    "selecon.org.br",
    "fepese.org.br",
    "fundatec.org.br",
    "legalleconcursos.com.br",
    "objetivas.com.br",
    "ibade.org.br",
    "idib.org.br",
    "funcern.br",
)

# Portais que podem ajudar a descobrir uma notícia, mas nunca substituem a
# fonte oficial. Alguns têm robots.txt permissivo; isso não autoriza copiar
# conteúdo nem publicar sem conferência na fonte primária.
SECONDARY_PORTALS = (
    ("pciconcursos.com.br", "aggregator", "PCI Concursos"),
    ("concursosnobrasil.com.br", "aggregator", "Concursos no Brasil"),
    ("jcconcursos.com.br", "journalism", "JC Concursos"),
    ("folha.qconcursos.com", "journalism", "Folha Dirigida"),
    ("acheconcursos.com.br", "aggregator", "Ache Concursos"),
    ("g1.globo.com", "journalism", "G1 Concursos"),
    ("correiobraziliense.com.br", "journalism", "Correio Braziliense"),
    ("noticiasconcursos.com.br", "journalism", "Notícias Concursos"),
    ("concursosempauta.com.br", "journalism", "Concursos em Pauta"),
)

# Não são fontes jornalísticas de fatos, mas ajudam a localizar o ato oficial.
OFFICIAL_GAZETTE_DOMAINS = (
    "in.gov.br",
    "imprensanacional.gov.br",
)


@dataclass(frozen=True)
class SourceClass:
    tier: str
    label: str
    host: str
    official: bool


def _host(url: str) -> str:
    return urlparse(url).netloc.lower().split("@")[-1].split(":")[0]


def _matches(host: str, domain: str) -> bool:
    domain = domain.lower().strip()
    return bool(domain) and (host == domain or host.endswith("." + domain))


def classify_url(url: str) -> SourceClass:
    """Classifica uma URL sem fazer requisições de rede."""
    host = _host(url)
    for domain in OFFICIAL_GAZETTE_DOMAINS:
        if _matches(host, domain):
            return SourceClass("official_primary", "Diário oficial", host, True)
    for domain in OFFICIAL_BANCA_DOMAINS:
        if _matches(host, domain):
            return SourceClass("official_primary", "Banca organizadora", host, True)
    if host.endswith(OFFICIAL_SUFFIXES):
        return SourceClass("official_primary", "Órgão público", host, True)
    for domain, tier, label in SECONDARY_PORTALS:
        if _matches(host, domain):
            return SourceClass(tier, label, host, False)
    return SourceClass("unknown", "Fonte não classificada", host, False)


def is_official_url(url: str) -> bool:
    return classify_url(url).official


def official_link(url: str, allowed_domains: list[str] | None = None) -> bool:
    """Aceita links oficiais, com uma lista explícita de domínios da fonte."""
    if is_official_url(url):
        return True
    host = _host(url)
    return any(_matches(host, domain) for domain in (allowed_domains or []))
