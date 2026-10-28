from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)

# Verificar como as categorias são armazenadas nos posts
posts = sanity.query('*[_type == "post"][0..5] | order(publishedAt desc)', perspective='raw')
for p in posts:
    slug = p.get('slug', {}).get('current', '')
    cats = p.get('categories', [])
    print(f'{slug}:')
    for c in cats:
        print(f'  cat: {c}')
    print()