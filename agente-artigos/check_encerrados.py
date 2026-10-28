from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)
context = sanity.get_context()
encerrados = [p for p in context.posts if p.get('status') == 'encerrado']
print(f'Total encerrados: {len(encerrados)}')
for p in encerrados:
    slug = p.get('slug', '')
    pid = p.get('_id', '')
    is_draft = str(pid).startswith('drafts.')
    print(f"  {slug} | draft={is_draft} | id={pid}")