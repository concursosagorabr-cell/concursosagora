import os, requests
from dotenv import dotenv_values

env = {}
for f in [r"C:\Users\cleber.jose\Documents\concursosagora\concursosagora-main\.env.local", r"C:\Users\cleber.jose\Documents\concursosagora\agente-artigos\.env.local"]:
    if os.path.exists(f): env.update(dotenv_values(f))

pid = "nav-brasil-abre-concurso-com-128-vagas-para-navegacao-aerea"
url = f"https://{env['NEXT_PUBLIC_SANITY_PROJECT_ID']}.api.sanity.io/v2024-07-01/data/mutate/{env['NEXT_PUBLIC_SANITY_DATASET']}"
headers = {"Authorization": f"Bearer {env['SANITY_API_TOKEN']}", "Content-Type": "application/json"}

# Primeiro buscar o body atual
query_url = f"https://{env['NEXT_PUBLIC_SANITY_PROJECT_ID']}.api.sanity.io/v2024-07-01/data/query/{env['NEXT_PUBLIC_SANITY_DATASET']}?query=*[_id%20%3D%3D%20%22{pid}%22][0]%7Bbody%7D"
resp = requests.get(query_url, headers=headers)
print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    body = data.get("result", {}).get("body", [])
    print(f"Body atual: {len(body)} blocos")
    for i, block in enumerate(body):
        if block.get("_type") == "block":
            text = "".join([c.get("text", "") for c in block.get("children", [])])
            if "agente de enriquecimento" in text.lower() or "revisão humana" in text.lower():
                print(f"Bloco {i} tem texto vazado: {text[:200]}")