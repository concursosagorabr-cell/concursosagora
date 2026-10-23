from __future__ import annotations

import difflib
import re
import unicodedata
from datetime import date, datetime, timedelta
from typing import Iterable

_MONTHS = {
    "janeiro": 1,
    "fevereiro": 2,
    "marco": 3,
    "março": 3,
    "abril": 4,
    "maio": 5,
    "junho": 6,
    "julho": 7,
    "agosto": 8,
    "setembro": 9,
    "outubro": 10,
    "novembro": 11,
    "dezembro": 12,
}

_UF_BY_NAME = {
    "acre": "AC",
    "alagoas": "AL",
    "amapa": "AP",
    "amapá": "AP",
    "amazonas": "AM",
    "bahia": "BA",
    "ceara": "CE",
    "ceará": "CE",
    "distrito federal": "DF",
    "espirito santo": "ES",
    "espírito santo": "ES",
    "goias": "GO",
    "goiás": "GO",
    "maranhao": "MA",
    "maranhão": "MA",
    "mato grosso do sul": "MS",
    "mato grosso": "MT",
    "minas gerais": "MG",
    "para": "PA",
    "pará": "PA",
    "paraiba": "PB",
    "paraíba": "PB",
    "parana": "PR",
    "paraná": "PR",
    "pernambuco": "PE",
    "piaui": "PI",
    "piauí": "PI",
    "rio de janeiro": "RJ",
    "rio grande do norte": "RN",
    "rio grande do sul": "RS",
    "rondonia": "RO",
    "rondônia": "RO",
    "roraima": "RR",
    "santa catarina": "SC",
    "sao paulo": "SP",
    "são paulo": "SP",
    "sergipe": "SE",
    "tocantins": "TO",
}

_CITY_UF = {
    "salvador": "BA",
    "recife": "PE",
    "fortaleza": "CE",
    "natal": "RN",
    "joao pessoa": "PB",
    "maceio": "AL",
    "aracaju": "SE",
    "teresina": "PI",
    "sao luis": "MA",
    "belem": "PA",
    "manaus": "AM",
    "porto velho": "RO",
    "rio branco": "AC",
    "macapa": "AP",
    "boa vista": "RR",
    "palmas": "TO",
    "cuiba": "MT",
    "campo grande": "MS",
    "goiania": "GO",
    "brasilia": "DF",
    "belo horizonte": "MG",
    "vitoria": "ES",
    "rio de janeiro": "RJ",
    "sao paulo": "SP",
    "curitiba": "PR",
    "florianopolis": "SC",
    "porto alegre": "RS",
}

_UF_CODES = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
]

_KNOWN_BANCAS = [
    "cebraspe",
    "cespe",
    "fgv",
    "fundacao getulio vargas",
    "fundação getulio vargas",
    "vunesp",
    "fcc",
    "fundacao carlos chagas",
    "fundação carlos chagas",
    "ibfc",
    "aocp",
    "idecan",
    "quadrix",
    "consulplan",
    "iades",
    "selecon",
    "fepese",
    "fundatec",
    "legalle",
    "objetiva",
    "reales",
    "reiss",
    "instituto access",
    "instituto aocp",
    "ibade",
    "idib",
    "funcern",
    "ufg",
]


def strip_accents(value: str) -> str:
    """Remove acentos preservando o restante do texto."""
    return "".join(
        char
        for char in unicodedata.normalize("NFD", value)
        if unicodedata.category(char) != "Mn"
    )


def normalize(value: str) -> str:
    """Normaliza texto para comparação (minúsculo, sem acento, sem pontuação)."""
    value = strip_accents((value or "").lower())
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def clean_whitespace(value: str) -> str:
    value = (value or "").replace("\xa0", " ").replace("\u200b", "")
    lines = [" ".join(line.split()) for line in value.replace("\r", "\n").split("\n")]
    return "\n".join(line for line in lines if line).strip()


def slugify(value: str, max_length: int = 96) -> str:
    """Gera slug ASCII com hífens."""
    value = strip_accents((value or "").lower())
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value[:max_length].rstrip("-")


def title_similarity(left: str, right: str) -> float:
    return difflib.SequenceMatcher(None, normalize(left), normalize(right)).ratio()


def word_count(markdown: str) -> int:
    """Conta palavras ignorando marcações Markdown."""
    text = re.sub(r"```.*?```", " ", markdown or "", flags=re.S)
    text = re.sub(r"[#>*_`\[\]()~-]", " ", text)
    text = re.sub(r"https?://\S+", " ", text)
    return len([token for token in text.split() if any(ch.isalnum() for ch in token)])


def parse_br_date(value: str | None) -> str | None:
    """Converte datas brasileiras/ISO para YYYY-MM-DD."""
    if not value:
        return None
    raw = clean_whitespace(value)
    raw = raw.replace("º", "").replace("°", "")

    iso = re.search(r"\b(\d{4})-(\d{2})-(\d{2})\b", raw)
    if iso:
        try:
            return date(int(iso.group(1)), int(iso.group(2)), int(iso.group(3))).isoformat()
        except ValueError:
            return None

    short = re.search(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b", raw)
    if short:
        day, month, year = (int(short.group(1)), int(short.group(2)), int(short.group(3)))
        if year < 100:
            year += 2000
        try:
            return date(year, month, day).isoformat()
        except ValueError:
            return None

    long_form = re.search(
        r"\b(\d{1,2})\s*(?:de\s+)?([a-zçãéíóúâêôà]+)\s*(?:de\s+)?(\d{4})\b",
        strip_accents(raw.lower()),
    )
    if long_form:
        month_name = long_form.group(2)
        month = _MONTHS.get(month_name) or _MONTHS.get(strip_accents(month_name))
        if month:
            try:
                return date(int(long_form.group(3)), month, int(long_form.group(1))).isoformat()
            except ValueError:
                return None
    return None


def parse_iso_datetime(value: str | None) -> str | None:
    """Normaliza uma data/hora para ISO-8601 UTC ou retorna None."""
    if not value:
        return None
    raw = clean_whitespace(value)
    # dd/mm/yyyy hh:mm
    brute = re.search(
        r"\b(\d{1,2})/(\d{1,2})/(\d{2,4})(?:\s+(\d{1,2})[h:](\d{2}))?\b", raw
    )
    if brute:
        day, month, year = (int(brute.group(1)), int(brute.group(2)), int(brute.group(3)))
        if year < 100:
            year += 2000
        hour = int(brute.group(4) or 12)
        minute = int(brute.group(5) or 0)
        try:
            return datetime(year, month, day, hour, minute).isoformat()
        except ValueError:
            return None

    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return parsed.isoformat()
    except ValueError:
        pass

    parsed_date = parse_br_date(raw)
    if parsed_date:
        return f"{parsed_date}T12:00:00"
    return None


def parse_money(value: str) -> float | None:
    """Converte '12.345,67' ou '12345.67' em float."""
    if not value:
        return None
    raw = re.sub(r"[^\d,.]", "", value)
    if not raw:
        return None
    if "," in raw and "." in raw:
        raw = raw.replace(".", "").replace(",", ".")
    elif "," in raw:
        raw = raw.replace(",", ".")
    try:
        number = float(raw)
    except ValueError:
        return None
    return number if number > 0 else None


def extract_uf(text: str) -> str | None:
    """Extrai a UF mais provável de um texto, priorizando nomes de estados."""
    raw = (text or "").lower()
    normalized = normalize(text)
    # Nomes completos têm prioridade porque siglas aparecem em contextos ambíguos.
    for name in sorted(_UF_BY_NAME, key=len, reverse=True):
        if name == "para":
            # "para" sem acento é preposto; só aceita a UF com contexto.
            if re.search(r"(?:estado do|no|do)\s+par[áa]\b", raw):
                return "PA"
            continue
        if name in raw:
            return _UF_BY_NAME[name]
    # Siglas devem estar em maiúsculas no texto original.
    for match in re.finditer(r"\b([A-Z]{2})\b", text or ""):
        if match.group(1) in _UF_CODES:
            return match.group(1)
    for city in sorted(_CITY_UF, key=len, reverse=True):
        if re.search(rf"\b{re.escape(city)}\b", normalized):
            return _CITY_UF[city]
    return None


def extract_city(text: str) -> str | None:
    patterns = [
        r"(?:prefeitura|municipio|município)\s+(?:municipal\s+)?(?:de|do|da)\s+([A-ZÀ-Ú][\wÀ-ú' ]{2,60})",
        r"([A-ZÀ-Ú][\wÀ-ú' ]{2,60})\s*[-/]\s*[A-Z]{2}\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text or "", flags=re.I)
        if match:
            candidate = clean_whitespace(match.group(1))
            candidate = re.split(r"[.,;:!?]", candidate, maxsplit=1)[0]
            candidate = re.sub(r"\s+\b(?:19|20)\d{2}\b.*$", "", candidate)
            candidate = re.split(
                r"\s+(?=(?:Informações|Informacoes|O|A|Os|As|Concurso|Processo|"
                r"Inscrições|Inscricoes|Vagas|Podem|Serão|Serao|Estão|Estao|"
                r"Com|Para|Por|Ainda|Neste|No|Na)\b)",
                candidate,
                maxsplit=1,
                flags=re.I,
            )[0]
            candidate = re.split(
                r"\s+(?:torna|realiza|abre|informa|publica|por meio|através|atraves)\b",
                candidate,
                maxsplit=1,
                flags=re.I,
            )[0]
            candidate = clean_whitespace(candidate)
            if len(candidate) > 60:
                candidate = candidate[:60].rsplit(" ", 1)[0].strip()
            if 2 <= len(candidate) <= 60:
                return candidate.title()
    return None


def extract_banca(text: str) -> str | None:
    normalized = normalize(text)
    for banca in _KNOWN_BANCAS:
        if normalize(banca) in normalized:
            return banca
    return None


def extract_education_levels(text: str) -> list[str]:
    normalized = normalize(text)
    levels: list[str] = []
    if re.search(r"\bsuperior|nivel superior|graduacao|bacharel|licenciatura\b", normalized):
        levels.append("superior")
    if re.search(r"\bmedio|nivel medio|ensino medio\b", normalized):
        levels.append("medio")
    if re.search(r"\btecnico|nivel tecnico|curso tecnico\b", normalized):
        levels.append("tecnico")
    if re.search(r"\bfundamental|nivel fundamental\b", normalized):
        levels.append("fundamental")
    return levels


def previous_business_day(reference: date | None = None) -> date:
    ref = reference or date.today()
    candidate = ref - timedelta(days=1)
    while candidate.weekday() >= 5:
        candidate -= timedelta(days=1)
    return candidate


def business_day_for_dou(now: datetime | None = None) -> date:
    """DOU costuma estar disponível a partir do início da manhã."""
    now = now or datetime.now()
    if now.weekday() < 5 and now.hour >= 8:
        return now.date()
    return previous_business_day(now.date())


def dedupe_preserve_order(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            result.append(value)
    return result