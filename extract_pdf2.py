import re,zlib
p=r"C:\Users\Elton Sales\Downloads\NasRuas de ITZ — Gestão de Clientes & Social Media.pdf"
data=open(p,'rb').read()
for m in re.finditer(rb'stream\r?\n', data):
    start=m.end()
    end=data.find(b'endstream', start)
    if end<0: continue
    raw=data[start:end]
    try: d=zlib.decompress(raw)
    except Exception: d=raw
    # print only text-ish
    if b'Tj' in d or b'TJ' in d:
        print('---STREAM---')
        print(d.decode('latin1','replace')[:3000])
