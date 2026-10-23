import sys
t=open(sys.argv[1],encoding="utf-8").read()
for kw in ["vaga","taxa","inscri","prova","remuner","subs","sal"]:
    hits=[l.strip() for l in t.splitlines() if kw.lower() in l.lower()]
    print("\n==",kw,len(hits))
    for h in hits[:8]:
        print(" ",h[:220])
PY