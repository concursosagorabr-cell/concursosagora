from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)

# Verificar posts do RS (category-rs)
posts_rs = sanity.query('*[_type == "post" && "category-rs" in categories[]._ref] | order(publishedAt desc)[0..10]', perspective='raw')
print("=== POSTS RS ===")
for p in posts_rs:
    slug = p.get('slug', {}).get('current', '')
    title = p.get('title', '')
    status = p.get('status', '')
    cats = [c.get('_ref', '') for c in p.get('categories', [])]
    print(f'{slug}: {title[:60]} | status={status} | cats={cats}')

print()

# Verificar posts do CE (category-ce)
posts_ce = sanity.query('*[_type == "post" && "category-ce" in categories[]._ref] | order(publishedAt desc)[0..10]', perspective='raw')
print("=== POSTS CE ===")
for p in posts_ce:
    slug = p.get('slug', {}).get('current', '')
    title = p.get('title', '')
    status = p.get('status', '')
    cats = [c.get('_ref', '') for c in p.get('categories', [])]
    print(f'{slug}: {title[:60]} | status={status} | cats={cats}')

print()

# Verificar posts "concursos-abertos" (9752fb90-83f4-4932-a66f-80b112ad68aa)
posts_abertos = sanity.query('*[_type == "post" && "9752fb90-83f4-4932-a66f-80b112ad68aa" in categories[]._ref && status == "aberto"] | order(publishedAt desc)[0..10]', perspective='raw')
print("=== POSTS ABERTOS ===")
for p in posts_abertos:
    slug = p.get('slug', {}).get('current', '')
    title = p.get('title', '')
    cats = [c.get('_ref', '') for c in p.get('categories', [])]
    print(f'{slug}: {title[:60]} | cats={cats}')