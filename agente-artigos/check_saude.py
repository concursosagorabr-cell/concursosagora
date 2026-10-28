from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)
context = sanity.get_context()

# Verificar categorias
for cat in context.categories:
    slug = cat.get('slug', '')
    if 'saude' in slug.lower() or 'sus' in slug.lower():
        print(f'Categoria saúde: {slug} = {cat.get("title")}')

print()

# Verificar posts com categoria saude/sus
posts = sanity.query('*[_type == "post" && references(*[_type == "category" && slug in ["saude", "saude-sus"][0]._id)] | order(publishedAt desc)[0..10]', perspective='raw')
for p in posts:
    slug = p.get('slug', {}).get('current', '')
    title = p.get('title', '')
    cats = [c.get('_ref', '') for c in p.get('categories', [])]
    print(f'{slug}: {title[:60]} | cats={cats}')