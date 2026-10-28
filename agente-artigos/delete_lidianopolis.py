import os, requests
from dotenv import dotenv_values

env = {}
for f in [r"C:\Users\cleber.jose\Documents\concursosagora\concursosagora-main\.env.local", r"C:\Users\cleber.jose\Documents\concursosagora\agente-artigos\.env.local"]:
    if os.path.exists(f): env.update(dotenv_values(f))

pid = "prefeitura-de-lidianopolis-abre-inscricoes-para-concurso-publico-2026"
url = f"https://{env['NEXT_PUBLIC_SANITY_PROJECT_ID']}.api.sanity.io/v2024-07-01/data/mutate/{env['NEXT_PUBLIC_SANITY_DATASET']}"
headers = {"Authorization": f"Bearer {env['SANITY_API_TOKEN']}", "Content-Type": "application/json"}
mutation = {"mutations": [{"delete": {"id": pid}}]}

resp = requests.post(url, headers=headers, json={"mutations": [{"delete": {"id": pid}}]})
print(f"Deletando Lidianopolis: {resp.status_code} - {resp.text[:200]}")