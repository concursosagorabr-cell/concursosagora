import os
import requests
from dotenv import dotenv_values

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

headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
url = f"https://{project_id}.api.sanity.io/v2024-07-01/data/mutate/{dataset}"

# Os 5 artigos FALSOS criados hoje (alucinações)
fakes = [
    "concurso-prf-2026-edital-publicado-com-1-500-vagas-salario-inicial-de-r-10-790-87",
    "concurso-tj-sp-2026-inscricoes-abertas-para-300-vagas-de-escrevente-salario-de-r-6-043-54",
    "concurso-pc-pr-2026-edital-com-400-vagas-para-delegado-e-investigador-salarios-ate-r-20-802-51",
    "concurso-inss-perito-medico-2026-governo-autoriza-600-vagas-salario-de-r-14-166-99",
    "concurso-trf-6-2026-comissao-formada-fgv-sera-banca-vagas-para-analista-r-13-994-78-e-tecnico-r",
    # Os 6 de "correção" que também eram fabricados
    "suzano-publica-edital-de-concurso-publico-com-73-vagas-e-salarios-de-ate-r-12-mil",
    "barra-bonita-inscricoes-abertas-para-concurso-publico-ate-05-10-2026",
    "cfc-exame-de-suficiencia-n-3-2026-segue-em-andamento",
    "abdi-processo-seletivo-publico-tem-cronograma-previsto-fgv-sera-banca",
    "enam-2026-2-6-exame-nacional-da-magistratura-tem-cronograma-previsto-fgv-organiza",
    "cfc-2-edicao-do-exame-de-qualificacao-tecnica-eqt-2026-tem-gabarito-preliminar-divulgado",
]

print(f"Deletando {len(fakes)} artigos FALSOS (publicados)...")
for pid in fakes:
    mutation = {"mutations": [{"delete": {"id": pid}}]}
    try:
        resp = requests.post(url, headers=headers, json=mutation, timeout=30)
        if resp.status_code == 200:
            print(f"  DELETADO: {pid}")
        else:
            print(f"  ERRO {resp.status_code}: {pid} - {resp.text[:200]}")
    except Exception as e:
        print(f"  EXCEÇÃO: {pid} - {e}")

print("Concluído.")