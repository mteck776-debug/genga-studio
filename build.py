import glob,os
root=os.path.dirname(os.path.abspath(__file__))
s=root+'/src/'
html=open(s+'index.src.html',encoding='utf8').read()
css=open(s+'style.css',encoding='utf8').read()
js='\n'.join(open(f,encoding='utf8').read() for f in sorted(glob.glob(s+'[01]*.js')))
html=html.replace('/*CSS*/',css).replace('/*JS*/',js)
os.makedirs(root+'/dist',exist_ok=True)
open(root+'/dist/genga-studio.html','w',encoding='utf8').write(html)
open(root+'/index.html','w',encoding='utf8').write('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{padding:0}[hidden]{display:none!important}body{margin:0;font-size:14px}img{max-width:100%}</style></head><body>'+html+'</body></html>')
print(len(html)//1024,'KB')
