# make raw/ run offline: drop Google Analytics, point same-origin absolute URLs at "/"
import re
for f in ['raw/index.html','raw/slot-booking.html','raw/squads.html','raw/memory/index.html']:
    s=open(f,encoding='utf8').read()
    s=re.sub(r'<!-- Google Analytics -->\s*','',s)
    s=re.sub(r'<script async src="https://www\.googletagmanager\.com/gtag/js\?id=[^"]*"></script>\s*','',s)
    s=re.sub(r'<script>\s*window\.dataLayer.*?</script>\s*','',s,flags=re.S)
    s=s.replace('https://jithinrp.com/','/')
    open(f,'w',encoding='utf8').write(s)
    print(f,'gtag left:',s.count('gtag'))
