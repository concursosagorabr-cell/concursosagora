from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)

# Verificar TODOS os posts com status=aberto
posts = sanity.query('*[_type == "post" && status == "aberto"] | order(publishedAt desc)[0..20]', perspective='raw')
print("=== TODOS POSTS COM status=aberto ===")
for p in posts:
    slug = p.get('slug', {}).get('current', '')
    title = p.get('title', '')
    cats = [c.get('_ref', '') for c in p.get('categories', [])]
    print(f'{slug}: {title[:60]} | cats={cats}')

print(f"\nTotal: {len(posts)} posts abertos")