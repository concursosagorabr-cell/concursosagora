from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)

# Verificar TODOS os posts que têm "rs" no stateUf
posts = sanity.query('*[_type == "post" && stateUf == "RS"] | order(publishedAt desc)[0..20]', perspective='raw')
print("=== POSTS COM stateUf=RS ===")
for p in posts:
    slug = p.get('slug', {}).get('current', '')
    title = p.get('title', '')
    status = p.get('status', '')
    cats = [c.get('_ref', '') for c in p.get('categories', [])]
    print(f'{slug}: {title[:60]} | status={status} | cats={cats}')

print()

# Verificar posts com "rio grande do sul" no título ou órgão
posts2 = sanity.query('*[_type == "post" && (title match "*Rio Grande do Sul*" || organ match "*Rio Grande do Sul*" || organ match "*RS*")] | order(publishedAt desc)[0..10]', perspective='raw')
print("=== POSTS COM 'Rio Grande do Sul' NO TÍTULO/ÓRGÃO ===")
for p in posts2:
    slug = p.get('slug', {}).get('current', '')
    title = p.get('title', '')
    status = p.get('status', '')
    stateUf = p.get('stateUf', '')
    cats = [c.get('_ref', '') for c in p.get('categories', [])]
    print(f'{slug}: {title[:60]} | status={status} | stateUf={stateUf} | cats={cats}')