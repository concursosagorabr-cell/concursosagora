import os, requests
from dotenv import dotenv_values

env = {}
for f in [r"C:\Users\cleber.jose\Documents\concursosagora\concursosagora-main\.env.local", r"C:\Users\cleber.jose\Documents\concursosagora\agente-artigos\.env.local"]:
    if os.path.exists(f): env.update(dotenv_values(f))

pid = "nav-brasil-abre-concurso-com-128-vagas-para-navegacao-aerea"
url = f"https://{env['NEXT_PUBLIC_SANITY_PROJECT_ID']}.api.sanity.io/v2024-07-01/data/query/{env['NEXT_PUBLIC_SANITY_DATASET']}?query=*[_id%20%3D%3D%20%22{pid}%22][0]%7Bbody%7D"
headers = {"Authorization": f"Bearer {env['SANITY_API_TOKEN']}", "Content-Type": "application/json"}
resp = requests.get(url, headers=headers)
data = resp.json()
result = data.get("result", {})
body = result.get("body", [])

# Find and print all enrich blocks
for i, block in enumerate(body):
    if block.get("_type") == "block":
        text = "".join([c.get("text", "") for c in block.get("children", [])])
        if "enriquecimento" in text.lower() or "revisão" in text.lower() or "enriquecimento" in text.lower() or "agente" in text.lower():
            print(f"BLOCO {i}: {text[:500]}")
            print(f"  _key: {block.get('_key')}")
            print()

# Also check for blocks with "enrich" in _key
for i, block in enumerate(body):
    if "enrich" in block.get("_key", "").lower():
        print(f"BLOCO ENRICH {i}: _key={block.get('_key')}")
        text = "".join([c.get("text", "") for c in block.get("children", [])])
        print(f"  Texto: {text[:500]}")
        print()