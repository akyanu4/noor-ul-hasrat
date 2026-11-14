"""Real thumbnails for the mocked i.ytimg.com requests: a frame at ~6 s of each rendered Short, 480x854 jpg.
YouTube id -> Short name comes from every project's project.json youtube.published/drafts; the app's watermarked
re-upload ids (js/family.js WATERMARKED) map back to the same Short. Output: work/thumbs/<id>.jpg + work/thumbs/_fallback.jpg"""
import glob, json, os, re, subprocess
from PIL import Image, ImageStat
HERE = os.path.dirname(os.path.abspath(__file__)); PROJ = os.path.dirname(HERE); REPO = os.path.abspath(os.path.join(HERE, '../../../..'))
OUT = os.path.join(HERE, 'work', 'thumbs'); os.makedirs(OUT, exist_ok=True)
src = open(os.path.join(REPO, 'js/family.js'), encoding='utf-8').read()
wm = dict(re.findall(r"'?([\w-]{11})'?:\s*'([\w-]{11})'", src[src.index('var WATERMARKED'):src.index('function toItems')]))
ids = {}
for pj in sorted(glob.glob(os.path.join(PROJ, '*/project.json'))):
    d = os.path.dirname(pj); yt = json.load(open(pj)).get('youtube', {})
    for k in ('published', 'drafts'):
        for name, vid in (yt.get(k) or {}).items():
            if not isinstance(vid, str): continue
            f = [p for p in (f'{d}/out/{name}_wm.mp4', f'{d}/out/{name}.mp4') if os.path.exists(p)]
            if f and not name.startswith('Full'): ids[vid] = f
for a, b in wm.items():
    if a in ids: ids[b] = ids[a]
n = 0
for vid, f in ids.items():
    dst = os.path.join(OUT, vid + '.jpg')
    if os.path.exists(dst): continue
    best = (-1, None)
    f = [x for x in f if subprocess.run(['ffprobe', '-v', 'error', x], capture_output=True).returncode == 0][:1]   # skip a file still being written
    if not f: continue
    f = f[0]
    for ss in (6, 8, 10, 4.5, 12, 15, 20, 25, 30):          # ~6 s, but skip a dark moment (a title card or a fade)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(ss), '-i', f, '-frames:v', '1', '-vf', 'scale=480:854:force_original_aspect_ratio=increase,crop=480:854', '-q:v', '3', dst], check=False)
        if not os.path.exists(dst): continue
        m = ImageStat.Stat(Image.open(dst).convert('L')).mean[0]
        if m >= 50: best = (m, None); break
        if m > best[0]: best = (m, open(dst, 'rb').read())
    if best[1]: open(dst, 'wb').write(best[1])
    n += 1
fb = os.path.join(OUT, '_fallback.jpg')
if not os.path.exists(fb):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'gradients=s=480x854:c0=0x0f5e5a:c1=0x1c7c6f:x0=0:y0=0:x1=480:y1=854:d=1', '-frames:v', '1',
                    '-vf', "drawbox=x=40:y=300:w=400:h=254:color=0xc9a24b@0.35:t=3", fb], check=True)
print(len(ids), 'ids,', n, 'new thumbnails in', OUT)
