import urllib.request, os, fitz
base="data/manual_articles/pdfs_2026-10-25"
os.makedirs(base,exist_ok=True)
urls={
"trf6":"https://conhecimento.fgv.br/sites/default/files/concursos/edital-no-1-de-22-de-agosto-de-2025-edital-no-1-de-22-de-agosto-de-2025-dou-imprensa-nacional.pdf",
"seducsp25":"https://conhecimento.fgv.br/sites/default/files/concursos/edital-pss-educacao-profissional-e-tecnica-retificado-006.pdf",
}
for name,url in urls.items():
    print("====",name,url)
    path=os.path.join(base,name+".pdf")
    urllib.request.urlretrieve(url,path)
    doc=fitz.open(path)
    text="\n".join(p.get_text() for p in doc)
    open(os.path.join(base,name+".txt"),"w",encoding="utf-8").write(text)
    print("PAGES",doc.page_count,"CHARS",len(text))
    print(text[:2500])
PY