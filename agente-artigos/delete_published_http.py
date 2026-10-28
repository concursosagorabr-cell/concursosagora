import os
import requests
from dotenv import dotenv_values

# Carregar credenciais
env_files = [
    r"C:\Users\cleber.jose\Documents\concursosagora\concursosagora-main\.env.local",
    r"C:\Users\cleber.jose\Documents\concursosagora\agente-artigos\.env.local"
]
env = {}
for f in env_files:
    if os.path.exists(f):
        env.update(dotenv_values(f))

project_id = env.get("NEXT_PUBLIC_SANITY_PROJECT_ID")
dataset = env.get("NEXT_PUBLIC_SANITY_DATASET", "production")
token = env.get("SANITY_API_TOKEN")

if not all([project_id, dataset, token]):
    print("Credenciais não encontradas")
    exit(1)

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

posts_para_deletar = [
    "prefeitura-de-bariri-anuncia-concurso-publico-com-vagas-para-varios-niveis-de-escolaridade",
    "prefeitura-de-aparecida-abre-inscricoes-para-novo-concurso-publico",
    "pgm-e-camara-do-rio-abrem-concurso-com-45-vagas-de-nivel-superior",
    "agesan-rs-abre-concurso-com-11-vagas-para-saneamento",
    "nittrans-abre-concurso-com-59-vagas-em-niteroi",
    "cprm-abre-concurso-com-115-vagas-para-geociencias",
    "pm-de-sao-paulo-abre-concurso-com-165-vagas-para-aluno-oficial",
    "tce-pe-abre-concurso-com-59-vagas-de-nivel-superior",
    "mpes-abre-concurso-com-5-vagas-para-promotor-de-justica-substituto",
    "tjms-abre-concurso-com-15-vagas-para-juiz-substituto",
    "ebserh-abre-concurso-com-152-vagas-para-medicos-em-todo-o-pais",
    "pernambuco-abre-30-vagas-para-juiz-substituto-no-tjpe",
    "tjsc-abre-concurso-para-cargos-de-nivel-medio-e-superior",
    "prefeitura-de-macae-abre-concurso-com-191-vagas-para-a-area-da-saude",
    "dataprev-abre-concurso-com-212-vagas-para-tecnologia-da-informacao",
    "processo-seletivo-da-fempar-2027-segue-em-andamento-com-vagas-para-medicina",
]

url = f"https://{project_id}.api.sanity.io/v2024-07-01/data/mutate/{dataset}"

print(f"Deletando {len(posts_para_deletar)} posts publicados via HTTP API...")
for pid in posts_para_deletar:
    mutation = {
        "mutations": [
            {"delete": {"id": pid}}
        ]
    }
    try:
        resp = requests.post(url, headers=headers, json=mutation, timeout=30)
        if resp.status_code == 200:
            print(f"  DELETADO: {pid}")
        else:
            print(f"  ERRO {resp.status_code} ao deletar {pid}: {resp.text}")
    except Exception as e:
        print(f"  EXCEÇÃO ao deletar {pid}: {e}")

print("Concluído.")