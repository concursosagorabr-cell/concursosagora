from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)

# Verificar todas as categorias
for cat in sanity.get_context().categories:
    print(f'{cat.get("slug")}: {cat.get("title")}')