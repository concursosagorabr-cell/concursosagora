import os, requests
from dotenv import dotenv_values

env = {}
for f in [r"C:\Users\cleber.jose\Documents\concursosagora\concursosagora-main\.env.local", r"C:\Users\cleber.jose\Documents\concursosagora\agente-artigos\.env.local"]:
    if os.path.exists(f): env.update(dotenv_values(f))

pid = "enap-anula-edital-do-cpnu-2-por-inconsistencias-nas-vagas-remanescentes"
url = f"https://{env['NEXT_PUBLIC_SANITY_PROJECT_ID']}.api.sanity.io/v2024-07-01/data/mutate/{env['NEXT_PUBLIC_SANITY_DATASET']}"
headers = {"Authorization": f"Bearer {env['SANITY_API_TOKEN']}", "Content-Type": "application/json"}

resp = requests.post(url, headers=headers, json={"mutations": [{"delete": {"id": pid}}]})
print(f"Deletando Enap/CPNU2: {resp.status_code} - {resp.text[:200]}")