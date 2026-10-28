from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)

pid = "secretaria-de-saude-de-sp-abre-inscricoes-para-1405-vagas-de-residencia-medica-2027"

# Buscar o documento completo
post = sanity.query('*[_id == $id][0]', {"id": pid}, perspective="raw")
if not post:
    print("Post não encontrado")
else:
    categories = post.get("categories", [])
    print(f"Categorias atuais: {categories}")
    
    # Remover a categoria concursos-abertos
    new_cats = [c for c in categories if c.get("_ref") != "9752fb90-83f4-4932-a66f-80b112ad68aa"]
    print(f"Novas categorias: {new_cats}")
    
    # Patch
    patch_result = sanity.patch_document(pid, {"categories": new_cats})
    print(f"Patch result: {patch_result}")