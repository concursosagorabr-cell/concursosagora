import os, requests
from dotenv import dotenv_values

env = {}
for f in [r"C:\Users\cleber.jose\Documents\concursosagora\concursosagora-main\.env.local", r"C:\Users\cleber.jose\Documents\concursosagora\agente-artigos\.env.local"]:
    if os.path.exists(f): env.update(dotenv_values(f))

url = f"https://{env['NEXT_PUBLIC_SANITY_PROJECT_ID']}.api.sanity.io/v2024-07-01/data/mutate/{env['NEXT_PUBLIC_SANITY_DATASET']}"
headers = {"Authorization": f"Bearer {env['SANITY_API_TOKEN']}", "Content-Type": "application/json"}

# O _id da categoria "concursos-abertos" é 9752fb90-83f4-4932-a66f-80b112ad68aa
# Posts que NÃO são concursos públicos (são residências médicas ou processos seletivos) - remover a categoria
posts_para_remover_concursos_abertos = [
    "residencia-medica-no-centro-universitario-padre-albino-tem-32-vagas-e-inscricoes-abertas",
    "residencia-medica-2027-abre-inscricoes-na-faculdade-de-medicina-de-botucatu-unesp",
    "universidade-paulista-abre-inscricoes-para-residencia-medica-com-24-vagas",
    "secretaria-de-saude-de-sp-abre-inscricoes-para-1405-vagas-de-residencia-medica-2027",
    "unifesp-abre-inscricoes-para-606-vagas-de-residencia-medica-2026-2027",
    "huem-abre-102-vagas-para-residencia-medica-2027-taxa-e-de-r-1-000",
    "inb-abre-processo-seletivo-com-cadastro-de-reserva-para-nivel-medio-e-superior",
]

concursos_abertos_ref = "9752fb90-83f4-4932-a66f-80b112ad68aa"

def remover_categoria(pid, cat_ref):
    query_url = f"https://{env['NEXT_PUBLIC_SANITY_PROJECT_ID']}.api.sanity.io/v2024-07-01/data/query/{env['NEXT_PUBLIC_SANITY_DATASET']}?query=*[_id%20%3D%3D%20%22{pid}%22][0]%7Bcategories%7D"
    resp = requests.get(query_url, headers=headers)
    if resp.status_code != 200:
        print(f"  Erro ao buscar {pid}: {resp.status_code}")
        return
    
    data = resp.json()
    result = data.get("result", {})
    categories = result.get("categories", [])
    
    new_cats = [c for c in categories if c.get("_ref") != cat_ref]
    
    if len(new_cats) == len(categories):
        print(f"  {pid}: categoria não encontrada")
        return
    
    mutation = {"mutations": [{"patch": {"id": pid, "set": {"categories": new_cats}}}]}
    resp2 = requests.post(url, headers=headers, json=mutation, timeout=30)
    if resp2.status_code == 200:
        print(f"  [OK] {pid}: categoria removida ({len(categories)} -> {len(new_cats)})")
    else:
        print(f"  [ERRO] {pid}: {resp2.status_code} - {resp2.text[:200]}")

print("Removendo categoria 'concursos-abertos' de residências/processos seletivos...\n")
for pid in posts_para_remover_concursos_abertos:
    remover_categoria(pid, concursos_abertos_ref)

print("\nConcluído.")