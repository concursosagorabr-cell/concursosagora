from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)

# Buscar posts com categoria "saude" no slug
posts = sanity.query('*[_type == "post" && "saude" in categories[].slug] | order(publishedAt desc)[0..15]', perspective='raw')
for p in posts:
    slug = p.get('slug', {}).get('current', '')
    title = p.get('title', '')
    status = p.get('status', '')
    cats = [c.get('slug', '') for c in p.get('categories', [])]
    print(f'{slug}: {title[:70]} | status={status} | cats={cats}')