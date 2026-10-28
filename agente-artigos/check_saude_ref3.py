from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)

# O _id da categoria saude é F3ojn3UduC3sXTNh0oc88J
posts = sanity.query('*[_type == "post" && "F3ojn3UduC3sXTNh0oc88J" in categories[]._ref] | order(publishedAt desc)[0..20]', perspective='raw')
for p in posts:
    slug = p.get('slug', {}).get('current', '')
    title = p.get('title', '')
    status = p.get('status', '')
    cats = [c.get('_ref', '') for c in p.get('categories', [])]
    print(f'{slug}: {title[:70]} | status={status} | cats={cats}')

print(f"\nTotal: {len(posts)} posts")