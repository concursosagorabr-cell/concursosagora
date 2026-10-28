from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)

# Buscar posts com referência à categoria saude
posts = sanity.query('*[_type == "post" && "category-saude" in categories[]._ref] | order(publishedAt desc)[0..20]', perspective='raw')
for p in posts:
    slug = p.get('slug', {}).get('current', '')
    title = p.get('title', '')
    status = p.get('status', '')
    cats = [c.get('_ref', '') for c in p.get('categories', [])]
    print(f'{slug}: {title[:70]} | status={status} | cats={cats}')

print(f"\nTotal: {len(posts)} posts")