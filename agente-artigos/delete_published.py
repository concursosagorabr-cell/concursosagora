from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)

# IDs dos posts publicados com status "encerrado" que devem ser removidos
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

print(f"Deletando {len(posts_para_deletar)} posts publicados...")
for pid in posts_para_deletar:
    try:
        response = sanity.delete_document(pid)
        print(f"  DELETADO: {pid}")
    except Exception as e:
        print(f"  ERRO ao deletar {pid}: {e}")

print("Concluído.")