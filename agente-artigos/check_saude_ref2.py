from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)

# Verificar a categoria saude
cat = sanity.query('*[_type == "category" && slug == "saude"][0]', perspective='raw')
print(f'Categoria saude: {cat}')

# Verificar se existe category-saude como _id
cat2 = sanity.query('*[_type == "category" && _id == "category-saude"][0]', perspective='raw')
print(f'Categoria _id=category-saude: {cat2}')

# Listar todas as categorias com seus _ids
cats = sanity.query('*[_type == "category"] | order(title asc)', perspective='raw')
for c in cats:
    print(f'{c.get("_id")}: slug={c.get("slug")} title={c.get("title")}')