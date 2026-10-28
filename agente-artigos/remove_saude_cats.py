import os, requests
from dotenv import dotenv_values

env = {}
for f in [r"C:\Users\cleber.jose\Documents\concursosagora\concursosagora-main\.env.local", r"C:\Users\cleber.jose\Documents\concursosagora\agente-artigos\.env.local"]:
    if os.path.exists(f): env.update(dotenv_values(f))

url = f"https://{env['NEXT_PUBLIC_SANITY_PROJECT_ID']}.api.sanity.io/v2024-07-01/data/mutate/{env['NEXT_PUBLIC_SANITY_DATASET']}"
headers = {"Authorization": f"Bearer {env['SANITY_API_TOKEN']}", "Content-Type": "application/json"}

# Buscar o post, remover a categoria saude, fazer patch
def remover_categoria_saude(pid):
    # Buscar o post atual
    query_url = f"https://{env['NEXT_PUBLIC_SANITY_PROJECT_ID']}.api.sanity.io/v2024-07-01/data/query/{env['NEXT_PUBLIC_SANITY_DATASET']}?query=*[_id%20%3D%3D%20%22{pid}%22][0]%7Bcategories%7D"
    resp = requests.get(query_url, headers=headers)
    if resp.status_code != 200:
        print(f"Erro ao buscar {pid}: {resp.status_code}")
        return
    
    data = resp.json()
    result = data.get("result", {})
    categories = result.get("categories", [])
    
    # Filtrar para remover a categoria saude (F3ojn3UduC3sXTNh0oc88J)
    new_cats = [c for c in categories if c.get("_ref") != "F3ojn3UduC3sXTNh0oc88J"]
    
    if len(new_cats) == len(categories):
        print(f"  {pid}: categoria saude não encontrada")
        return
    
    # Fazer patch para substituir a array
    mutation = {"mutations": [{"patch": {"id": pid, "set": {"categories": new_cats}}}]}
    resp2 = requests.post(url, headers=headers, json=mutation, timeout=30)
    if resp2.status_code == 200:
        print(f"  [OK] {pid}: categoria saude removida ({len(categories)} -> {len(new_cats)})")
    else:
        print(f"  [ERRO] {pid}: {resp2.status_code} - {resp2.text[:200]}")

posts = [
    "hospital-regional-de-presidente-prudente-abre-101-vagas-para-residencia-medica",
    "faculdade-de-medicina-de-marilia-abre-inscricoes-para-residencia-medica-2027",
    "prefeitura-de-barra-bonita-mantem-inscricoes-abertas-para-concurso-publico-e-processo-seletivo",
]

print("Removendo categoria 'saude' dos posts inadequados...\n")
for pid in posts:
    remover_categoria_saude(pid)

print("\nConcluído.")