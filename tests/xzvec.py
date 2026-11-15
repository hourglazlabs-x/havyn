import lzma, os, random, sys
out=sys.argv[1]; random.seed(7)
words=open('/home/claude/havyn/src/content.js','rb').read()
def save(name,raw,comp):
    open(f'{out}/{name}.raw','wb').write(raw); open(f'{out}/{name}.xz','wb').write(comp)
text=(words*6)[:900000]
rnd=bytes(random.getrandbits(8) for _ in range(300000))
mixed=b''.join((text[i:i+50000] if i%3 else rnd[:40000]) for i in range(0,3000000,50000))
save('text6',text,lzma.compress(text,preset=6))
save('text0',text,lzma.compress(text,preset=0))
save('text9e',text,lzma.compress(text,preset=9|lzma.PRESET_EXTREME))
save('random',rnd,lzma.compress(rnd))
save('mixed',mixed,lzma.compress(mixed,check=lzma.CHECK_SHA256))
save('none',text[:5000],lzma.compress(text[:5000],check=lzma.CHECK_NONE))
save('crc32',text[:70000],lzma.compress(text[:70000],check=lzma.CHECK_CRC32))
save('empty',b'',lzma.compress(b''))
save('one',b'A',lzma.compress(b'A'))
for lc,lp,pb in [(0,0,0),(4,0,4),(0,4,2),(1,3,1),(3,0,2)]:
    f=[{"id":lzma.FILTER_LZMA2,"preset":6,"lc":lc,"lp":lp,"pb":pb}]
    save(f'props{lc}{lp}{pb}',mixed[:700000],lzma.compress(mixed[:700000],filters=f))
f=[{"id":lzma.FILTER_LZMA2,"preset":1,"dict_size":4096}]
save('tinydict',text[:200000],lzma.compress(text[:200000],filters=f))
print('ok')
