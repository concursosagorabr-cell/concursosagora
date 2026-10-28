import os, requests
from dotenv import dotenv_values

env = {}
for f in [r"C:\Users\cleber.jose\Documents\concursosagora\concursosagora-main\.env.local", r"C:\Users\cleber.jose\Documents\concursosagora\agente-artigos\.env.local"]:
    if os.path.exists(f): env.update(dotenv_values(f))

pid = "prefeitura-de-barra-bonita-mantem-inscricoes-abertas-para-concurso-publico-e-processo-seletivo"
patch = {
    "status": "encerrado",
    "contestStatus": "provas_aplicadas",
    "enrollmentEndDate": "2026-10-02",
    "examDate": "2026-10-18",
    "vacanciesTotal": 1
}

url = f"https://{env['NEXT_PUBLIC_SANITY_PROJECT_ID']}.api.sanity.io/v2024-07-01/data/mutate/{env['NEXT_PUBLIC_SANITY_DATASET']}"
headers = {"Authorization": f"Bearer {env['SANITY_API_TOKEN']}", "Content-Type": "application/json"}
mutation = {"mutations": [{"patch": {"id": pid, "set": patch}}]}

resp = requests.post(url, headers={"Authorization": f"Bearer {env['SANITY_API_TOKEN']}", "Content-Type": "application/json"}, json={"mutations": [{"patch": {"id": pid, "set": patch}}]})
print(resp.status_code, resp.text[:200])