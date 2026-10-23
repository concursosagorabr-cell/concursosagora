import urllib.request, os, fitz
base="data/manual_articles/pdfs_2026-10-25"
os.makedirs(base,exist_ok=True)
urls={
"tcepe":"https://conhecimento.fgv.br/sites/default/files/concursos/3a-retificacao-tce-pe-edital-de-abertura-17.07.2025.pdf",
"tjrsnotarial26":"https://conhecimento.fgv.br/sites/default/files/concursos/edital-001-2026-tjrs-notarial-e-registral-retificado-15_09.pdf",
}
for name,url in urls.items():
    print("====",name,url)
    path=os.path.join(base,name+".pdf")
    urllib.request.urlretrieve(url,path)
    doc=fitz.open(path)
    text="\n".join(p.get_text() for p in doc)
    open(os.path.join(base,name+".txt"),"w",encoding="utf-8").write(text)
    print("PAGES",doc.page_count,"CHARS",len(text))
PY