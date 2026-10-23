import urllib.request, os, fitz
base="data/manual_articles/pdfs_2026-10-25"
os.makedirs(base,exist_ok=True)
urls={
"ebserh26":"https://conhecimento.fgv.br/sites/default/files/concursos/edital-no-02-area-medica-edital-retificado-2-24.02.2026.pdf",
"tjmsjuiz25":"https://conhecimento.fgv.br/sites/default/files/concursos/tjms-juiz-edital-de-abertura-13.08.pdf",
"mpes25promotor":"https://conhecimento.fgv.br/sites/default/files/concursos/mpes-edital_06.10.pdf",
"tcepe":"https://conhecimento.fgv.br/sites/default/files/concursos/3a-retificacao-tce-pe-edital-de-abertura-17.07.2025.pdf",
"cfopmesp26":"https://conhecimento.fgv.br/sites/default/files/concursos/10.-minuta-do-edital-1.321.25-v_final-site-pmesp-e-fgv.pdf",
}
for name,url in urls.items():
    print("====",name)
    path=os.path.join(base,name+".pdf")
    urllib.request.urlretrieve(url,path)
    doc=fitz.open(path)
    text="\n".join(p.get_text() for p in doc)
    open(os.path.join(base,name+".txt"),"w",encoding="utf-8").write(text)
    print("PAGES",doc.page_count,"CHARS",len(text))
PY