from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)

# Posts problemáticos identificados
slugs_problemas = [
    "suzano-publica-edital-de-concurso-com-73-vagas-e-salarios-de-ate-r-12-mil",
    "prefeitura-de-barra-bonita-mantem-inscricoes-abertas-para-concurso-publico-e-processo-seletivo",
    "residencia-medica-no-centro-universitario-padre-albino-tem-32-vagas-e-inscricoes-abertas",
    "hospital-regional-de-presidente-prudente-abre-101-vagas-para-residencia-medica",
    "faculdade-de-medicina-de-marilia-abre-inscricoes-para-residencia-medica-2027",
    "residencia-medica-2027-abre-inscricoes-na-faculdade-de-medicina-de-botucatu-unesp",
    "exame-de-suficiencia-n-3-2026-do-cfc-segue-em-andamento",
    "processo-seletivo-publico-da-abdi-tem-cronograma-previsto-e-contato-da-fgv",
    "enam-2026-2-tem-cronograma-previsto-e-contato-da-fgv-para-interessados",
    "fgv-divulga-informacoes-sobre-a-2-edicao-do-exame-de-qualificacao-tecnica-eqt-2026",
    "seduc-sp-abre-processo-seletivo-para-docentes-da-educacao-basica",
    "seduc-sp-abre-processo-seletivo-para-docentes-de-ensino-medio-tecnico",
]

print("URLs oficiais dos posts problemáticos:\n")
for slug in slugs_problemas:
    post = sanity.query('*[_id == $id][0]', {"id": slug}, perspective="raw")
    if post:
        source_urls = post.get('sourceUrls', [])
        organ = post.get('organ', '')
        status = post.get('status', '')
        banca = post.get('banca', '')
        print(f"=== {slug} ===")
        print(f"  status: {status} | banca: {banca} | organ: {organ}")
        for src in source_urls:
            print(f"  URL: {src.get('url')}")
            print(f"    title: {src.get('title')}")
        print()
    else:
        print(f"=== {slug} ===")
        print("  POST NÃO ENCONTRADO\n")