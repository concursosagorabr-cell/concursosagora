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

# Patches baseados APENAS em evidência literal do verify
patches = [
    # 1. Suzano - status=aberto (edital publicado), salary_max NÃO tem evidência exata, sphere=municipal
    {
        "id": "suzano-publica-edital-de-concurso-com-73-vagas-e-salarios-de-ate-r-12-mil",
        "patch": {
            "status": "aberto",
            "sphere": "MUNICIPAL",
            "enrollmentEndDate": "2026-11-25",
            "examDate": "2026-12-13",
            "contestStatus": "edital_publicado",
            # salaryMax REMOVIDO - não tem evidência exata (só "até R$ 12 mil")
        }
    },
    # 2. Barra Bonita - banca=OM Concursos, status=aberto, insc_end=2026-10-05
    {
        "id": "prefeitura-de-barra-bonita-mantem-inscricoes-abertas-para-concurso-publico-e-processo-seletivo",
        "patch": {
            "banca": "OM Concursos",
            "status": "aberto",
            "sphere": "MUNICIPAL",
            "enrollmentEndDate": "2026-10-05",
            "contestStatus": "inscricoes_abertas",
            "stateUf": "SP",
            "cityName": "Barra Bonita"
        }
    },
    # 3. Padre Albino - 32 vagas, insc 13/10-24/11, status=aberto (inscrições abertas)
    {
        "id": "residencia-medica-no-centro-universitario-padre-albino-tem-32-vagas-e-inscricoes-abertas",
        "patch": {
            "vacanciesTotal": 32,
            "enrollmentStartDate": "2026-10-13",
            "enrollmentEndDate": "2026-11-24",
            "status": "aberto",
            "contestStatus": "inscricoes_abertas",
            "vacanciesByRole": [
                {"role": "Medicina Intensiva", "vacancies": 3},
                {"role": "Medicina da Família e Comunidade", "vacancies": 6},
                {"role": "Radiologia e Diagnóstico por Imagem", "vacancies": 9}
            ]
        }
    },
    # 4. Hospital Prudente - 101 vagas, status=encerrado (Período Encerrado)
    {
        "id": "hospital-regional-de-presidente-prudente-abre-101-vagas-para-residencia-medica",
        "patch": {
            "vacanciesTotal": 101,
            "status": "encerrado",
            "contestStatus": "inscricoes_encerradas"
        }
    },
    # 5. FAMEMA Marília - 107 vagas, status=encerrado
    {
        "id": "faculdade-de-medicina-de-marilia-abre-inscricoes-para-residencia-medica-2027",
        "patch": {
            "vacanciesTotal": 107,
            "status": "encerrado",
            "contestStatus": "inscricoes_encerradas"
        }
    },
    # 6. Botucatu UNESP - 201 vagas, insc 20/10-06/11, status=aberto
    {
        "id": "residencia-medica-2027-abre-inscricoes-na-faculdade-de-medicina-de-botucatu-unesp",
        "patch": {
            "vacanciesTotal": 201,
            "enrollmentStartDate": "2026-10-20",
            "enrollmentEndDate": "2026-11-06",
            "status": "aberto",
            "contestStatus": "inscricoes_abertas"
        }
    },
    # 7. CFC Exame Suficiência - organ=CFC, status=em_andamento, hasExemption=true
    {
        "id": "exame-de-suficiencia-n-3-2026-do-cfc-segue-em-andamento",
        "patch": {
            "organ": "Conselho Federal de Contabilidade",
            "status": "em_andamento",
            "contestStatus": "provas_aplicadas",
            "hasExemption": True,
            "sphere": "FEDERAL",
            "stateUf": "Nacional"
        }
    },
    # 8. ABDI - organ=ABDI, status=previsto, city=Brasília
    {
        "id": "processo-seletivo-publico-da-abdi-tem-cronograma-previsto-e-contato-da-fgv",
        "patch": {
            "organ": "Agência Brasileira de Desenvolvimento Industrial (ABDI)",
            "status": "previsto",
            "contestStatus": "cronograma_previsto",
            "cityName": "Brasília",
            "stateUf": "DF",
            "sphere": "FEDERAL"
        }
    },
    # 9. ENAM - organ=CNJ, status=previsto
    {
        "id": "enam-2026-2-tem-cronograma-previsto-e-contato-da-fgv-para-interessados",
        "patch": {
            "organ": "Conselho Nacional de Justiça",
            "status": "previsto",
            "contestStatus": "cronograma_previsto",
            "sphere": "FEDERAL",
            "stateUf": "Nacional"
        }
    },
    # 10. EQT - organ=CFC, status=em_andamento
    {
        "id": "fgv-divulga-informacoes-sobre-a-2-edicao-do-exame-de-qualificacao-tecnica-eqt-2026",
        "patch": {
            "organ": "Conselho Federal de Contabilidade",
            "status": "em_andamento",
            "contestStatus": "gabarito_divulgado",
            "sphere": "FEDERAL",
            "stateUf": "Nacional"
        }
    },
    # 11. SEDUC-SP Ed Básica - isCrOnly=true, status=em_andamento, vagas=0 (cadastro reserva)
    {
        "id": "seduc-sp-abre-processo-seletivo-para-docentes-da-educacao-basica",
        "patch": {
            "isCrOnly": True,
            "vacanciesTotal": 0,
            "status": "em_andamento",
            "contestStatus": "resultado_preliminar_prova_pratica"
        }
    },
    # 12. SEDUC-SP Ensino Técnico - isCrOnly=true, status=em_andamento
    {
        "id": "seduc-sp-abre-processo-seletivo-para-docentes-de-ensino-medio-tecnico",
        "patch": {
            "isCrOnly": True,
            "vacanciesTotal": 0,
            "status": "em_andamento",
            "contestStatus": "resultado_preliminar_prova_discursiva"
        }
    },
]

print(f"Patchando {len(patches)} posts com dados verificados...\n")
for item in patches:
    pid = item["id"]
    patch_data = item["patch"]
    
    # Sanity patch: set operations
    mutations = []
    for key, value in patch_data.items():
        mutations.append({"patch": {"id": pid, "set": {key: value}}})
    
    # Combine into single mutation for efficiency
    mutation = {"mutations": [{"patch": {"id": pid, "set": patch_data}}]}
    
    try:
        resp = requests.post(url, headers=headers, json=mutation, timeout=30)
        if resp.status_code == 200:
            print(f"  [OK] ATUALIZADO: {pid}")
            for k, v in patch_data.items():
                print(f"    {k} = {v}")
        else:
            print(f"  [ERRO] {resp.status_code}: {pid} - {resp.text[:300]}")
    except Exception as e:
        print(f"  [EXCECAO] {pid} - {e}")

print("\nConcluído.")