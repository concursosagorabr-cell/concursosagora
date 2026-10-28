import os, requests
from dotenv import dotenv_values

env = {}
for f in [r"C:\Users\cleber.jose\Documents\concursosagora\concursosagora-main\.env.local", r"C:\Users\cleber.jose\Documents\concursosagora\agente-artigos\.env.local"]:
    if os.path.exists(f): env.update(dotenv_values(f))

url = f"https://{env['NEXT_PUBLIC_SANITY_PROJECT_ID']}.api.sanity.io/v2024-07-01/data/mutate/{env['NEXT_PUBLIC_SANITY_DATASET']}"
headers = {"Authorization": f"Bearer {env['SANITY_API_TOKEN']}", "Content-Type": "application/json"}

pid = "secretaria-de-saude-de-sp-abre-inscricoes-para-1405-vagas-de-residencia-medica-2027"
cat_ref = "9752fb90-83f4-4932-a66f-80b112ad68aa"

query_url = f"https://{env['NEXT_PUBLIC_SANITY_PROJECT_ID']}.api.sanity.io/v2024-07-01/data/query/{env['NEXT_PUBLIC_SANITY_DATASET']}?query=*[_id%20%3D%3D%20%22{pid}%22][0]%7Bcategories%7D"
resp = requests.get(query_url, headers=headers)
print(f"Query status: {resp.status_code}")
data = resp.json()
print(f"Query result: {data}")

result = data.get("result")
if not result:
    print(f"Result is None, full data: {data}")
else:
    categories = result.get("categories", [])
    new_cats = [c for c in categories if c.get("_ref") != "9752fb90-83f4-4932-a66f-80b112ad68aa"]
    print(f"Categories: {categories}")
    print(f"New cats: {new_cats}")
    
    mutation = {"mutations": [{"patch": {"id": pid, "set": {"categories": new_cats}}}]}
    resp2 = requests.post(url, headers=headers, json=mutation, timeout=30)
    if resp2.status_code == 200:
        print(f"[OK] {pid}: categoria removida")
    else:
        print(f"[ERRO] {pid}: {resp2.status_code} - {resp2.text[:200]}")