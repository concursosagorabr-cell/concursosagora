from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)

# Buscar posts com categoria "saude" 
posts = sanity.query('*[_type == "post" && "saude" in categories[].slug] | order(publishedAt desc)[0..15]', perspective='raw')
for p in posts:
    slug = p.get('slug', {}).get('current', '')
    title = p.get('title', '')
    status = p.get('status', '')
    cats = [c.get('slug', '') for c in p.get('categories', [])]
    print(f'{slug}: {title[:70]} | status={status} | cats={cats}')

# Também buscar por referência direta
print("\n--- Busca por referência ---")
posts2 = sanity.query('*[_type == "post" && "saude" in categories[]._ref] | order(publishedAt desc)[0..15]', perspective='raw')
for p in posts2:
    slug = p.get('slug', {}).get('current', '')
    title = p.get('title', '')
    status = p.get('status', '')
    cats = [c.get('_ref', '') for c in p.get('categories', [])]
    print(f'{slug}: {title[:70]} | status={status} | cats={cats}')