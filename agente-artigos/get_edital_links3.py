import urllib.request, re, sys
for slug in sys.argv[1:]:
    url=f"https://conhecimento.fgv.br/concursos/{slug}"
    html=urllib.request.urlopen(url).read().decode("utf-8")
    links=re.findall(r'href="([^"]+)"', html)
    ed=[l for l in links if "edital" in l.lower() and l.lower().endswith(".pdf")]
    print("\n====",slug)
    for l in ed[:5]:
        print("  ",l)
PY