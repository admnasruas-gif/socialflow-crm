import re,zlib
p=r"C:\Users\Elton Sales\Downloads\NasRuas de ITZ — Gestão de Clientes & Social Media.pdf"
data=open(p,'rb').read()
out=[]
for m in re.finditer(rb'stream\r?\n(.*?)endstream', data, re.S):
    raw=m.group(1)
    try:
        d=zlib.decompress(raw)
    except Exception:
        d=raw
    for mm in re.finditer(rb'\((?:\\.|[^()])*\)\s*Tj', d):
        out.append(mm.group(0).decode('latin-1','replace'))
    for mm in re.finditer(rb'\[(.*?)\]\s*TJ', d, re.S):
        out.append('TJ ' + mm.group(1).decode('latin-1','replace'))
print('\n'.join(out))
