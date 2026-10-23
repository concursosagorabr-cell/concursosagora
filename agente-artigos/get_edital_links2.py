import urllib.request, re, sys
slugs=sys.argv[1:]
for slug in slugs:
    url=f"https://conhecimento.fgv.br/concursos/{slug}"
    try:
        html=urllib.request.urlopen(url).read().decode("utf-8")
    except Exception as e:
        print("\n====",slug,"PAGE_ERROR",e); continue
    links=re.findall(r'href="([^"]+)"', html)
    edital=[l for l in links if "edital" in l.lower() and l.endswith(".pdf")]
    print("\n====",slug)
    print("page:",url)
    for l in edital[:3]:
        print("  ",l)
PY