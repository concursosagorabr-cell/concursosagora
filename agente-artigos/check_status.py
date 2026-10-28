from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)
context = sanity.get_context()

slugs = [
    'prefeitura-de-barra-bonita-mantem-inscricoes-abertas-para-concurso-publico-e-processo-seletivo',
    'suzano-publica-edital-de-concurso-com-73-vagas-e-salarios-de-ate-r-12-mil'
]

for slug in slugs:
    post = sanity.query('*[_id == $id][0]', {'id': slug}, perspective='raw')
    if post:
        print(f'{slug}:')
        print(f'  status={post.get("status")} | contestStatus={post.get("contestStatus")} | sphere={post.get("sphere")}')
        print(f'  enrollmentEndDate={post.get("enrollmentEndDate")} | examDate={post.get("examDate")}')
        print(f'  vacanciesTotal={post.get("vacanciesTotal")}')
        print()