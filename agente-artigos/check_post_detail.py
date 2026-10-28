from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)

# Buscar um post específico completo
slug = "concurso-prf-2026-edital-publicado-com-1-500-vagas-salario-inicial-de-r-10-790-87"
post = sanity.query('*[_id == $id][0]', {"id": slug}, perspective="raw")
if post:
    for k, v in post.items():
        if v is not None and k not in ['_rev', '_createdAt', '_updatedAt', 'body']:
            print(f'{k}: {v}')
else:
    print("Post não encontrado")