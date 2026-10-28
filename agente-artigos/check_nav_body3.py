import os, requests
from dotenv import dotenv_values

env = {}
for f in [r"C:\Users\cleber.jose\Documents\concursosagora\concursosagora-main\.env.local", r"C:\Users\cleber.jose\Documents\concursosagora\agente-artigos\.env.local"]:
    if os.path.exists(f): env.update(dotenv_values(f))

pid = "nav-brasil-abre-concurso-com-128-vagas-para-navegacao-aerea"
url = f"https://{env['NEXT_PUBLIC_SANITY_PROJECT_ID']}.api.sanity.io/v2024-07-01/data/query/{env['NEXT_PUBLIC_SANITY_DATASET']}?query=*[_id%20%3D%3D%20%22{pid}%22][0]%7B_id%2C+body%5B%5D%7B...%7D%7D"
headers = {"Authorization": f"Bearer {env['SANITY_API_TOKEN']}", "Content-Type": "application/json"}
resp = requests.get(url, headers=headers)
print(f"Status: {resp.status_code}")
print(resp.text[:3000])