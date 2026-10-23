import urllib.request, re
url="https://conhecimento.fgv.br/concursos?page=3"
html=urllib.request.urlopen(url).read().decode("utf-8")
open("data/manual_articles/fgv_page4.html","w",encoding="utf-8").write(html)
seen=set()
for l in re.findall(r'href="(/[^"]+)"', html):
    if ("/concursos/" in l or "/exames/" in l or "/processoseletivo/" in l) and l not in seen:
        seen.add(l)
        print(l)
PY