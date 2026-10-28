import os, requests
from dotenv import dotenv_values

env = {}
for f in [r"C:\Users\cleber.jose\Documents\concursosagora\concursosagora-main\.env.local", r"C:\Users\cleber.jose\Documents\concursosagora\agente-artigos\.env.local"]:
    if os.path.exists(f): env.update(dotenv_values(f))

url = f"https://{env['NEXT_PUBLIC_SANITY_PROJECT_ID']}.api.sanity.io/v2024-07-01/data/mutate/{env['NEXT_PUBLIC_SANITY_DATASET']}"
headers = {"Authorization": f"Bearer {env['SANITY_API_TOKEN']}", "Content-Type": "application/json"}

# O _id da categoria saude é F3ojn3UduC3sXTNh0oc88J
# Posts para remover a categoria saude:
posts_para_remover_saude = [
    # Encerrados - não devem aparecer em "Saúde"
    "hospital-regional-de-presidente-prudente-abre-101-vagas-para-residencia-medica",
    "faculdade-de-medicina-de-marilia-abre-inscricoes-para-residencia-medica-2027",
    # Municipal amplo encerrado
    "prefeitura-de-barra-bonita-mantem-inscricoes-abertas-para-concurso-publico-e-processo-seletivo",
    # Poderia remover também se quiser só residência/concursos específicos de saúde:
    # "suzano-publica-edital-de-concurso-com-73-vagas-e-salarios-de-ate-r-12-mil",  # Tem vagas de saúde, manter
]

saude_ref = {"_ref": "F3ojn3UduC3sXTNh0oc88J", "_type": "reference"}

for pid in posts_para_remover_saude:
    # Patch: remover a categoria da array
    mutation = {
        "mutations": [{
            "patch": {
                "id": pid,
                "unset": ["categories[-1]"]  # Isso não funciona direto, precisa fazer replace
            }
        }]
    }
    # Melhor: buscar o post, remover a categoria, fazer replace
    # Vou fazer via query + patch
    
print("Vou fazer de forma diferente - buscar cada post e remover a ref da saude")