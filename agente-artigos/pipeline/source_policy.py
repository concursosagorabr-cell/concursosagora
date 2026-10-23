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

# Diários oficiais que podem ser usados para localizar o ato oficial.
# O DOU tem uma política própria no registro abaixo; os demais nomes ficam
# aqui para classificação de URLs de portais oficiais.
OFFICIAL_GAZETTE_DOMAINS = (
    "in.gov.br",
    "imprensanacional.gov.br",
)


@dataclass(frozen=True)
class SourcePolicy:
    """Política operacional de uma fonte.

    ``usage`` responde para que a fonte serve; ``automation`` responde como ela
    pode ser acessada. Nenhum campo aqui substitui os termos de uso ou o
    direito autoral: o registro é uma decisão editorial e técnica conservadora.
    """

    id: str
    name: str
    domains: tuple[str, ...]
    tier: str
    kind: str
    usage: str
    automation: str
    terms: str
    notes: str
    official: bool
    can_generate_article: bool


# Registro central das fontes analisadas em 22/10/2026.
# - ``usage=verification``: pode sustentar fato, desde que a evidência literal
#   esteja no texto e a fonte seja oficial.
# - ``usage=discovery``: serve para descobrir pauta; nunca confirma fato.
# - ``usage=internal``: base própria; não é verificação independente.
# - ``automation``: official_open_data, sitemap_only, manual_only, internal
#   ou disabled.
SOURCE_POLICIES: tuple[SourcePolicy, ...] = (
    SourcePolicy(
        id="dou",
        name="Diário Oficial da União",
        domains=("in.gov.br", "imprensanacional.gov.br", "inlabs.in.gov.br"),
        tier="official_primary",
        kind="Diário oficial",
        usage="verification",
        automation="official_open_data",
        terms="Dados abertos oficiais; robots.txt bloqueia HTML; não fazer crawling",
        notes=(
            "Fonte primária para atos federais. Importar XML/ZIP oficial do DOU. "
            "O portal in.gov.br responde Disallow: / no robots.txt; não usar o "
            "adaptador HTML. Atos estaduais/municipais exigem diário oficial "
            "próprio e site da banca."
        ),
        official=True,
        can_generate_article=True,
    ),
    SourcePolicy(
        id="concursos_agora",
        name="Concursos Agora",
        domains=("concursosagora.com.br",),
        tier="internal",
        kind="Portal próprio",
        usage="internal",
        automation="internal",
        terms="Conteúdo próprio",
        notes=(
            "Usar banco/Sanity e URLs canônicas para índice e histórico. "
            "Não é verificação independente de um fato e não deve ser raspado "
            "como fonte externa."
        ),
        official=False,
        can_generate_article=False,
    ),
    SourcePolicy(
        id="pci_concursos",
        name="PCI Concursos",
        domains=("pciconcursos.com.br",),
        tier="aggregator",
        kind="Agregador",
        usage="discovery",
        automation="sitemap_only",
        terms="Sem termo específico localizado; copyright padrão; não copiar",
        notes=(
            "Boa cobertura para descobrir editais. Robots permite grande parte, "
            "mas bloqueia /pdf/, /ct/, painéis e downloads. Usar apenas título, "
            "URL e data como pista; confirmar no órgão ou na banca."
        ),
        official=False,
        can_generate_article=False,
    ),
    SourcePolicy(
        id="concursos_no_brasil",
        name="Concursos no Brasil",
        domains=("concursosnobrasil.com.br",),
        tier="aggregator",
        kind="Agregador",
        usage="discovery",
        automation="manual_only",
        terms=(
            "Termos proíbem copiar, reproduzir, publicar, distribuir ou "
            "armazenar conteúdo em banco de dados sem consentimento"
        ),
        notes=(
            "Não integrar automaticamente. Leitura manual como pista ou pedido "
            "formal de licença. O robots permissivo não autoriza reutilização."
        ),
        official=False,
        can_generate_article=False,
    ),
    SourcePolicy(
        id="ache_concursos",
        name="Ache Concursos",
        domains=("acheconcursos.com.br",),
        tier="aggregator",
        kind="Agregador",
        usage="discovery",
        automation="manual_only",
        terms=(
            "Termos proíbem uso comercial ou publicação de conteúdo sem "
            "autorização; exceção restrita a uso pessoal/acadêmico"
        ),
        notes=(
            "Não reutilizar em portal comercial sem autorização expressa. "
            "Fotos, vídeos, áudios, logomarcas e gráficos também exigem licença."
        ),
        official=False,
        can_generate_article=False,
    ),
    SourcePolicy(
        id="jc_concursos",
        name="JC Concursos",
        domains=("jcconcursos.com.br", "jcconcursos.uol.com.br"),
        tier="journalism",
        kind="Jornalismo",
        usage="discovery",
        automation="sitemap_only",
        terms="Sem licença de reprodução localizada; copyright padrão",
        notes=(
            "Boa fonte de pauta e contexto. Não copiar texto, fotos ou títulos; "
            "confirmar números, datas e status na fonte oficial."
        ),
        official=False,
        can_generate_article=False,
    ),
    SourcePolicy(
        id="noticias_concursos",
        name="Notícias Concursos",
        domains=("noticiasconcursos.com.br",),
        tier="journalism",
        kind="Blog de notícias",
        usage="discovery",
        automation="manual_only",
        terms=(
            "Termos vedam uso comercial sem autorização; robots bloqueia "
            "ClaudeBot/anthropic-ai, CCBot, PerplexityBot, Scrapy e outros"
        ),
        notes=(
            "Não colocar em pipeline automatizado deste agente. Uso manual ou "
            "autorização expressa. Não contornar o bloqueio de robôs."
        ),
        official=False,
        can_generate_article=False,
    ),
    SourcePolicy(
        id="mega_concursos",
        name="Mega Concursos",
        domains=("megaconcursos.com", "megaconcursos.com.br"),
        tier="aggregator",
        kind="Portal regional",
        usage="discovery",
        automation="sitemap_only",
        terms="Sem termo específico localizado; copyright padrão",
        notes=(
            "Útil para pauta regional (Sudeste/Sul). Robots permite conteúdo, "
            "mas bloqueia área administrativa, uploads, busca e páginas de "
            "pagamento. Confirmar na fonte oficial."
        ),
        official=False,
        can_generate_article=False,
    ),
    SourcePolicy(
        id="qconcursos_folha",
        name="Qconcursos / Folha Dirigida",
        domains=("folha.qconcursos.com", "qconcursos.com"),
        tier="journalism",
        kind="Jornalismo",
        usage="discovery",
        automation="sitemap_only",
        terms="Termos atrás de Cloudflare (403); copyright; não contornar bloqueio",
        notes=(
            "Boa fonte de pauta. A página de termos retornou 403 na verificação; "
            "tratar como conteúdo protegido e não automatizar cópia."
        ),
        official=False,
        can_generate_article=False,
    ),
    SourcePolicy(
        id="iscom_radar",
        name="ISCOM Radar de Concursos",
        domains=("iscom.com.br",),
        tier="journalism",
        kind="Portal de nicho",
        usage="discovery",
        automation="sitemap_only",
        terms="Sem termo específico localizado; copyright padrão",
        notes=(
            "Nicho de comunicação social e produção cultural. Robots permite "
            "todo o site; usar apenas como pista e confirmar no órgão/banca."
        ),
        official=False,
        can_generate_article=False,
    ),
    # Fontes já classificadas pelo pipeline, mas fora da lista principal.
    SourcePolicy(
        id="g1",
        name="G1 Concursos",
        domains=("g1.globo.com",),
        tier="journalism",
        kind="Jornalismo",
        usage="discovery",
        automation="manual_only",
        terms="Termos Globo; sem licença de reprodução localizada",
        notes="Apenas pauta e contexto; nunca prova de fato.",
        official=False,
        can_generate_article=False,
    ),
    SourcePolicy(
        id="correio_braziliense",
        name="Correio Braziliense",
        domains=("correiobraziliense.com.br",),
        tier="journalism",
        kind="Jornalismo",
        usage="discovery",
        automation="sitemap_only",
        terms="Termos do jornal; copyright",
        notes="Apenas pauta; atenção a paywall e não contornar bloqueios.",
        official=False,
        can_generate_article=False,
    ),
    SourcePolicy(
        id="concursos_em_pauta",
        name="Concursos em Pauta",
        domains=("concursosempauta.com.br",),
        tier="journalism",
        kind="Jornalismo",
        usage="discovery",
        automation="disabled",
        terms="DNS não resolveu na verificação",
        notes="Não usar até revisão.",
        official=False,
        can_generate_article=False,
    ),
)

POLICY_BY_ID: dict[str, SourcePolicy] = {policy.id: policy for policy in SOURCE_POLICIES}
_POLICY_BY_DOMAIN = sorted(
    ((domain, policy) for policy in SOURCE_POLICIES for domain in policy.domains),
    key=lambda item: len(item[0]),
    reverse=True,
)

# Compatibilidade com o classificador antigo. A fonte de verdade agora é
# SOURCE_POLICIES; esta lista é apenas uma visão derivada para consumidores
# que ainda procuram o formato (domínio, tier, rótulo).
SECONDARY_PORTALS = tuple(
    (policy.domains[0], policy.tier, policy.name)
    for policy in SOURCE_POLICIES
    if not policy.official and policy.tier in {"aggregator", "journalism"}
)


@dataclass(frozen=True)
class SourceClass:
    tier: str
    label: str
    host: str
    official: bool
    policy_id: str | None = None


def _host(url: str) -> str:
    return urlparse(url).netloc.lower().split("@")[-1].split(":")[0]


def _matches(host: str, domain: str) -> bool:
    domain = domain.lower().strip()
    return bool(domain) and (host == domain or host.endswith("." + domain))


def policy_for_id(source_id: str) -> SourcePolicy | None:
    return POLICY_BY_ID.get(source_id)


def policy_for_url(url: str) -> SourcePolicy | None:
    host = _host(url)
    if not host:
        return None
    for domain, policy in _POLICY_BY_DOMAIN:
        if _matches(host, domain):
            return policy
    return None


def classify_url(url: str) -> SourceClass:
    """Classifica uma URL sem fazer requisições de rede."""
    host = _host(url)
    policy = policy_for_url(url)
    if policy is not None:
        return SourceClass(policy.tier, policy.name, host, policy.official, policy.id)
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
