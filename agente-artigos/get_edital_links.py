import urllib.request, re, sys
slugs=sys.argv[1:]
for slug in slugs:
    url=f"https://conhecimento.fgv.br/concursos/{slug}"
    try:
        html=urllib.request.urlopen(url).read().decode("utf-8")
    except Exception as e:
        print(slug, "PAGE_ERROR", e); continue
    # find pdf links containing edital
    links=re.findall(r'href="([^"]+\.pdf)"', html)
    edital=[l for l in links if "edital" in l.lower()]
    print("\n====", slug)
    print("page:", url)
    print("edital links:")
    for l in edital[:5]:
        print("  ", l)
PY