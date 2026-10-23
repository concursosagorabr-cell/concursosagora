import urllib.request, re
slug="tcepe"
html=urllib.request.urlopen(f"https://conhecimento.fgv.br/concursos/{slug}").read().decode("utf-8")
links=re.findall(r'href="([^"]+)"', html)
for l in links:
    if "edital" in l.lower() and l.lower().endswith(".pdf"):
        print(l)
PY