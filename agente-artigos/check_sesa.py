from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)

# Buscar o post da SESA-SP
posts = sanity.query('*[_type == "post" && title match "*SESA-SP*" || title match "*Secretaria*Saude*SP*"] | order(publishedAt desc)[0..5]', perspective='raw')
for p in posts:
    slug = p.get('slug', {}).get('current', '')
    title = p.get('title', '')
    cats = [c.get('_ref', '') for c in p.get('categories', [])]
    print(f'{slug}: {title[:70]} | cats={cats}')