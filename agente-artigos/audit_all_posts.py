from pipeline.config import load_settings
from pipeline.sanity import SanityClient

settings = load_settings()
sanity = SanityClient(settings)

# Buscar todos os posts completos
posts = sanity.query('*[_type == "post"] | order(publishedAt desc)', perspective="raw")

print(f"Total posts: {len(posts)}")
print()

problemas = []

for post in posts:
    slug = post.get('slug', {}).get('current', '')
    status = post.get('status', '')
    stateUf = post.get('stateUf', '')
    banca = post.get('banca', '')
    organ = post.get('organ', '')
    salary_min = post.get('salaryMin')
    salary_max = post.get('salaryMax')
    vacancies = post.get('vacanciesTotal')
    enrollment_end = post.get('enrollmentEndDate')
    exam_date = post.get('examDate')
    city = post.get('cityName', '')
    sphere = post.get('sphere', '')
    education = post.get('educationLevel', [])
    contest_status = post.get('contestStatus', '')
    is_cr_only = post.get('isCrOnly', False)
    has_exemption = post.get('hasExemption', False)
    registration_fee = post.get('registrationFee')
    
    # Verificações de consistência
    erros = []
    
    # 1. Status "aberto" mas sem data de fim de inscrição
    if status == 'aberto' and not enrollment_end:
        erros.append("status=aberto mas enrollmentEndDate vazio")
    
    # 2. Status "previsto" mas com enrollmentEndDate preenchido
    if status == 'previsto' and enrollment_end:
        erros.append("status=previsto mas tem enrollmentEndDate")
    
    # 3. Salário min > salário max
    if salary_min and salary_max and salary_min > salary_max:
        erros.append(f"salaryMin ({salary_min}) > salaryMax ({salary_max})")
    
    # 4. Vagas zeradas ou negativas
    if vacancies is not None and vacancies <= 0:
        erros.append(f"vacanciesTotal <= 0 ({vacancies})")
    
    # 5. Esfera federal mas stateUf não é "Nacional" ou estado válido
    if sphere == 'FEDERAL' and stateUf and stateUf != 'Nacional':
        # Pode ser válido se for concurso federal em um estado específico
        pass
    
    # 6. Banca vazia em concurso aberto/previsto
    if status in ['aberto', 'previsto'] and not banca:
        erros.append("banca vazia")
    
    # 7. Órgão vazio
    if not organ:
        erros.append("organ vazio")
    
    # 8. ContestStatus inconsistente com status
    if status == 'aberto' and contest_status in ['comissao_formada', 'autorizado', 'aguardando_autorizacao']:
        erros.append(f"contestStatus={contest_status} inconsistente com status=aberto")
    if status == 'previsto' and contest_status in ['inscricoes_abertas', 'provas_aplicadas', 'resultado_publicado']:
        erros.append(f"contestStatus={contest_status} inconsistente com status=previsto")
    
    # 9. isCrOnly=True mas vacanciesTotal > 0
    if is_cr_only and vacancies and vacancies > 0:
        erros.append(f"isCrOnly=true mas vacanciesTotal={vacancies}")
    
    # 10. registrationFee ausente em concurso aberto
    if status == 'aberto' and registration_fee is None:
        erros.append("registrationFee vazio em concurso aberto")
    
    if erros:
        problemas.append({
            'slug': slug,
            'status': status,
            'stateUf': stateUf,
            'banca': banca,
            'organ': organ,
            'erros': erros
        })
    
    # Print resumo
    print(f"{slug}")
    print(f"  status={status} | stateUf={stateUf} | banca={banca} | sphere={sphere}")
    print(f"  organ={organ} | salario={salary_min}-{salary_max} | vagas={vacancies}")
    print(f"  insc_end={enrollment_end} | prova={exam_date} | city={city}")
    print(f"  contestStatus={contest_status} | isCrOnly={is_cr_only} | hasExemption={has_exemption}")
    if erros:
        print(f"  ERROS: {', '.join(erros)}")
    print()

print(f"\n=== RESUMO: {len(problemas)} posts com problemas ===")
for p in problemas:
    print(f"\n{p['slug']} ({p['status']}, {p['stateUf']})")
    for e in p['erros']:
        print(f"  - {e}")