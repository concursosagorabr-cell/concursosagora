from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)
context = sanity.get_context()
print(f"Total posts: {len(context.posts)}")
for p in context.posts[:20]:
    status = p.get('status', '')
    stateUf = p.get('stateUf', '')
    banca = p.get('banca', '')
    publishedAt = p.get('publishedAt', '')
    slug = p.get('slug', '')
    print(f"{status} | {stateUf} | {banca} | {publishedAt} | {slug}")