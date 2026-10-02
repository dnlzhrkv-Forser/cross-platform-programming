import subprocess, json, re, os, sys
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
subprocess.run(['python3','/mnt/skills/public/docx/scripts/office/soffice.py','--headless','--convert-to','pdf','--outdir','/tmp/rp',ROOT+'/report.docx'],capture_output=True)
n=int(re.search(r'Pages:\s+(\d+)',subprocess.run(['pdfinfo','/tmp/rp/report.pdf'],capture_output=True,text=True).stdout).group(1))
titles=re.findall(r"H1\('([^']+)'\)",open(ROOT+'/05_toolchain/scripts/build_report.js',encoding='utf-8').read())
pages={}
txt=[subprocess.run(['pdftotext','-f',str(i),'-l',str(i),'-layout','/tmp/rp/report.pdf','-'],capture_output=True,text=True).stdout for i in range(1,n+1)]
for t in titles:
    for i in range(2,n):            # пропускаємо обкладинку та сторінку змісту
        if re.search(r'^\s*'+re.escape(t)+r'\s*$',txt[i],re.M): pages[t]=i+1; break
json.dump(pages,open(ROOT+'/05_toolchain/toc.json','w'),ensure_ascii=False,indent=1); print(n,len(titles),len(pages))
