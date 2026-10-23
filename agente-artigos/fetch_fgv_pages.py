import urllib.request, re, sys
for slug in sys.argv[1:]:
    url=f"https://conhecimento.fgv.br/concursos/{slug}"
    try:
        html=urllib.request.urlopen(url).read().decode("utf-8")
    except Exception as e:
        print("\n====",slug,"PAGE_ERROR",e); continue
    # title
    m=re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S)
    title=m.group(1).strip() if m else ""
    print("\n====",slug)
    print("TITLE:", title)
    # edital pdfs
    links=re.findall(r'href="([^"]+)"', html)
    ed=[l for l in links if "edital" in l.lower() and l.lower().endswith(".pdf")]
    for l in ed[:3]:
        print("  ",l)
PY