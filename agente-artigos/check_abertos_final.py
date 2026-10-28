from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)

# Verificar posts com categoria concursos-abertos
posts = sanity.query('*[_type == "post" && "9752fb90-83f4-4932-a66f-80b112ad68aa" in categories[]._ref] | order(publishedAt desc)[0..20]', perspective='raw')
print("=== POSTS COM CATEGORIA concursos-abertos ===")
for p in posts:
    slug = p.get('slug', {}).get('current', '')
    title = p.get('title', '')
    status = p.get('status', '')
    cats = [c.get('_ref', '') for c in p.get('categories', [])]
    print(f'{slug}: {title[:60]} | status={status} | cats={cats}')

print(f"\nTotal: {len(posts)} posts")

# Verificar SESA-SP
posts2 = sanity.query('*[_type == "post" && slug.current match "*secretaria*saude*sp*"][0..5]', perspective='raw')
print("\n=== POSTS SECRETARIA SAUDE SP ===")
for p in posts2:
    slug = p.get('slug', {}).get('current', '')
    title = p.get('title', '')
    cats = [c.get('_ref', '') for c in p.get('categories', [])]
    print(f'{slug}: {title[:60]} | cats={cats}')