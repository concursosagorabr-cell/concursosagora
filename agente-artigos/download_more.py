import urllib.request, os, fitz
base="data/manual_articles/pdfs_2026-10-25"
os.makedirs(base,exist_ok=True)
urls={
"trf6":"https://conhecimento.fgv.br/sites/default/files/concursos/edital-de-abertura-no-1-de-22-de-agosto-de-2025-edital-de-abertura-no-1-de-22-de-agosto-de-2025-dou-imprensa-nacional.pdf",
"mpgo25":"https://conhecimento.fgv.br/sites/default/files/concursos/edital-retificado-publicado.pdf",
"tjce25":"https://conhecimento.fgv.br/concursos/tjce25",
"seducsp25":"https://conhecimento.fgv.br/concursos/seducsp25",
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
            print(text[:2000])
        else:
            html=urllib.request.urlopen(url).read().decode("utf-8")
            open(os.path.join(base,name+".html"),"w",encoding="utf-8").write(html)
            print("HTML",len(html))
    except Exception as e:
        print("ERROR",e)
PY