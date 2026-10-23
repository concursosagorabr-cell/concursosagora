import urllib.request, os, fitz
base="data/manual_articles/pdfs_2026-10-24"
os.makedirs(base,exist_ok=True)
urls={
"tjrsnotarial26":"https://conhecimento.fgv.br/sites/default/files/concursos/edital-001-2026-tjrs-notarial-e-registral-retificado-15_09.pdf",
"ebserh26":"https://conhecimento.fgv.br/sites/default/files/concursos/edital-no-02-area-medica-edital-retificado-2-24.02.2026.pdf",
"tjmsjuiz25":"https://conhecimento.fgv.br/sites/default/files/concursos/tjms-juiz-edital-de-abertura-13.08.pdf",
"mpes25promotor":"https://conhecimento.fgv.br/sites/default/files/concursos/mpes-edital_06.10.pdf",
"tcepe":"https://conhecimento.fgv.br/sites/default/files/concursos/3a-retificacao-tce-pe-edital-de-abertura-17.07.2025.pdf",
"cfopmesp26":"https://conhecimento.fgv.br/sites/default/files/concursos/10.-minuta-do-edital-1.321.25-v_final-site-pmesp-e-fgv.pdf",
"tjce25":"https://conhecimento.fgv.br/concursos/tjce25",
"seducsp25":"https://conhecimento.fgv.br/concursos/seducsp25",
"trf6":"https://conhecimento.fgv.br/sites/default/files/concursos/edital-de-abertura-no-1-de-22-de-agosto-de-2025-edital-de-abertura-no-1-de-22-de-agosto-de-2025-dou-imprensa-nacional.pdf",
"mpgo25":"https://conhecimento.fgv.br/sites/default/files/concursos/edital-retificado-publicado.pdf",
}
for name,url in urls.items():
    print("====",name,url)
    try:
        if url.endswith(".pdf"):
            path=os.path.join(base,name+".pdf")
            urllib.request.urlretrieve(url,path)
            doc=fitz.open(path)
            text="\n".join(p.get_text() for p in doc)
            open(os.path.join(base,name+".txt"),"w",encoding="utf-8").write(text)
            print("PAGES",doc.page_count,"CHARS",len(text))
            print(text[:2500])
        else:
            html=urllib.request.urlopen(url).read().decode("utf-8")
            open(os.path.join(base,name+".html"),"w",encoding="utf-8").write(html)
            print("HTML",len(html))
    except Exception as e:
        print("ERROR",e)
PY