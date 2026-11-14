"""Compose an app-guide video: 1080x1920, 30 fps. The phone recording (record.js) sits centred in a rounded phone frame
on a soft teal/gold background, a title strip on top, bilingual captions at the bottom; an opening card (2.5 s) and a
closing card (4 s); narration at full level over a soft nasheed; loudness -14 LUFS.
    python3 compose.py A|B        -> out/App_Guide_Short.mp4 | out/App_Guide_Walkthrough.mp4
Needs: work/times_<S>.json (align.py), work/rec_<S>/ (record.js)."""
import bisect, json, math, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
os.environ.setdefault('NOOR_PROJECT', HERE)
sys.path.insert(0, os.path.abspath(os.path.join(HERE, '../../engine')))
import cfg, lib as L
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
from captions import CAPTIONS

REPO = os.path.abspath(os.path.join(HERE, '../../../..'))
W, H, FPS = 1080, 1920, 30
OPEN, CLOSE = 2.5, 4.0
TEAL, DEEP, GOLD, CREAM = (15, 61, 62), (8, 34, 36), (201, 162, 75), (250, 236, 200)
# layout: title strip, phone (screen 644x1392 inside a 14 px bezel), the watermark's band (watermark.py puts it at
# 0.865 H, about y 1603-1719), then the captions
PB = 14; SW, SH = 644, 1392; PW, PH = SW + 2 * PB, SH + 2 * PB
PX, PY = (W - PW) // 2, 176; SX, SY = PX + PB, PY + PB
CAP_Y, CAP_H = 1722, 194
MONT6 = L.FD + 'montserrat/package/files/montserrat-latin-600-normal.woff'
MONT7 = L.FD + 'montserrat/package/files/montserrat-latin-700-normal.woff'
TITLE_EN, TITLE_UR = 'How to use Noor-ul-Hasrat', 'نورالحسرت ایپ کیسے استعمال کریں'
L.setup(W, H)

def run(cmd, **kw): return subprocess.run(cmd, check=True, **kw)
def tight(im): bb = im.getchannel('A').getbbox(); return im.crop(bb) if bb else im
def text_img(t, path, size, color=(255, 255, 255), stroke=2):
    f = L.font(path, size); d = ImageDraw.Draw(Image.new('L', (1, 1))); bb = d.textbbox((0, 0), t, font=f, stroke_width=stroke)
    im = Image.new('RGBA', (bb[2] - bb[0] + 8, bb[3] - bb[1] + 8), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((4 - bb[0], 4 - bb[1]), t, font=f, fill=color + (255,), stroke_width=stroke, stroke_fill=(0, 0, 0, 170)); return im
def fit(im, maxw):
    return im if im.width <= maxw else im.resize((maxw, int(im.height * maxw / im.width)), Image.LANCZOS)
def put(base, im, cx, cy): base.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))
def ur_clean(t):
    """The Nastaliq font has no '"', ':' or '—': quotes go, a colon or dash becomes the Urdu comma."""
    t = t.replace('"', '').replace(' —', '،').replace('—', '،').replace(':', '،')
    t = re.sub(r'\s*،\s*', '، ', t); t = re.sub(r'(، )+', '، ', t); t = re.sub(r'،\s*۔', '۔', t)
    return t.strip().rstrip('،').strip()
def ur(t, size, color=CREAM): return tight(L.urdu(ur_clean(t), size, color, True, L.URDU_B))

def background():
    g = np.asarray(L.vgrad([(0, (18, 72, 72)), (0.45, TEAL), (1, DEEP)]), dtype=float)
    glow = np.asarray(L.rgrad(W / 2, PY + PH * 0.42, (120, 98, 46), (0, 0, 0), 900), dtype=float)
    bg = Image.fromarray(np.clip(g + glow * 0.55, 0, 255).astype('uint8')).convert('RGBA')
    d = ImageDraw.Draw(bg, 'RGBA')
    for i in range(3):   # faint gold arcs around the phone
        r = 520 + i * 110; d.arc((W / 2 - r, PY + PH / 2 - r, W / 2 + r, PY + PH / 2 + r), 200, 340, fill=GOLD + (28,), width=2)
    return bg

def title_strip(bg):
    d = ImageDraw.Draw(bg, 'RGBA')
    d.rectangle((0, 0, W, PY - 12), fill=(6, 30, 32, 150)); d.line((W * 0.22, PY - 12, W * 0.78, PY - 12), fill=GOLD + (170,), width=2)
    put(bg, fit(text_img(TITLE_EN, MONT7, 46, (246, 226, 170)), 1000), W / 2, 50)
    put(bg, fit(ur(TITLE_UR, 35), 1000), W / 2, 116)

def phone_shadow(bg):
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle((PX + 6, PY + 18, PX + PW + 6, PY + PH + 22), 78, fill=(0, 0, 0, 170))
    bg.alpha_composite(sh.filter(ImageFilter.GaussianBlur(26)))

def bezel():
    im = Image.new('RGBA', (PW, PH), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, PW - 1, PH - 1), 74, fill=(14, 17, 20, 255), outline=(201, 162, 75, 200), width=3)
    d.rounded_rectangle((5, 5, PW - 6, PH - 6), 70, outline=(60, 66, 72, 255), width=2)
    hole = Image.new('L', (PW, PH), 0); ImageDraw.Draw(hole).rounded_rectangle((PB, PB, PB + SW - 1, PB + SH - 1), 56, fill=255)
    a = im.getchannel('A'); a.paste(0, mask=hole); im.putalpha(a)
    return im

def foreground():
    """Everything around the screen, as one full-frame layer with a transparent rounded hole where the screen shows."""
    fg = background(); phone_shadow(fg); title_strip(fg); fg.alpha_composite(bezel(), (PX, PY))
    hole = Image.new('L', (W, H), 0); ImageDraw.Draw(hole).rounded_rectangle((SX, SY, SX + SW - 1, SY + SH - 1), 56, fill=255)
    a = fg.getchannel('A'); a.paste(0, mask=hole); fg.putalpha(a); return fg

def icon(size):
    ic = Image.open(os.path.join(REPO, 'icons/icon-512.png')).convert('RGBA').resize((size, size), Image.LANCZOS)
    m = Image.new('L', (size, size), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, size - 1, size - 1), int(size * 0.22), fill=255)
    ic.putalpha(Image.composite(ic.getchannel('A'), Image.new('L', ic.size, 0), m)); return ic

def card(kind):
    bg = background(); d = ImageDraw.Draw(bg)
    halo = Image.new('RGBA', (W, H), (0, 0, 0, 0)); cy = 700 if kind == 'open' else 640
    ImageDraw.Draw(halo).ellipse((W / 2 - 330, cy - 330, W / 2 + 330, cy + 330), fill=GOLD + (90,)); bg.alpha_composite(halo.filter(ImageFilter.GaussianBlur(70)))
    if kind == 'open':
        put(bg, icon(400), W / 2, cy)
        put(bg, fit(text_img(TITLE_EN, MONT7, 64, (246, 226, 170), 3), 980), W / 2, 1035)
        d.line((W * 0.3, 1105, W * 0.7, 1105), fill=GOLD + (200,), width=3)
        put(bg, fit(ur(TITLE_UR, 56), 980), W / 2, 1190)
    else:
        put(bg, icon(300), W / 2, cy)
        put(bg, fit(text_img('Free  ·  noor-ul-hasrat.vercel.app', MONT7, 46, (246, 226, 170), 3), 1000), W / 2, 880)
        put(bg, fit(ur('مفت ، سب کے لیے', 48), 900), W / 2, 975)
        d.line((W * 0.3, 1060, W * 0.7, 1060), fill=GOLD + (200,), width=3)
        put(bg, fit(text_img('Produced by GiraffeTech', MONT6, 40, (236, 228, 210), 2), 900), W / 2, 1120)
    return bg

def caption_png(urdu, english):
    im = Image.new('RGBA', (W, CAP_H), (0, 0, 0, 0))
    if not urdu and not english: return im
    u = fit(ur(urdu, 44), 1010) if urdu else None
    e = text_img(english, MONT6, 35, (255, 255, 255), 2)
    if e.width > 1010:   # two lines
        words = english.split(); best = None
        for k in range(1, len(words)):
            a, b = ' '.join(words[:k]), ' '.join(words[k:]); w_ = max(text_img(a, MONT6, 31).width, text_img(b, MONT6, 31).width)
            if best is None or w_ < best[0]: best = (w_, a, b)
        a, b = text_img(best[1], MONT6, 31), text_img(best[2], MONT6, 31)
        e = Image.new('RGBA', (max(a.width, b.width), a.height + b.height - 4), (0, 0, 0, 0)); e.alpha_composite(a, ((e.width - a.width) // 2, 0)); e.alpha_composite(b, ((e.width - b.width) // 2, a.height - 4))
        e = fit(e, 1010)
    uh = u.height if u else 0; tot = uh + 10 + e.height
    if tot > CAP_H - 8:  # keep it inside the band
        s = (CAP_H - 18) / tot; u = u.resize((int(u.width * s), int(u.height * s)), Image.LANCZOS) if u else None; e = e.resize((int(e.width * s), int(e.height * s)), Image.LANCZOS); uh = u.height if u else 0; tot = uh + 10 + e.height
    pw = max(u.width if u else 0, e.width) + 56; y0 = (CAP_H - tot) // 2
    pan = Image.new('RGBA', (W, CAP_H), (0, 0, 0, 0)); ImageDraw.Draw(pan).rounded_rectangle(((W - pw) / 2, y0 - 8, (W + pw) / 2, y0 + tot + 8), 22, fill=(0, 0, 0, 92))
    im.alpha_composite(pan)
    if u: im.alpha_composite(u, ((W - u.width) // 2, y0))
    im.alpha_composite(e, ((W - e.width) // 2, y0 + uh + 10))
    return im

def pauses(wav, noise='-36dB', d=0.12):
    err = subprocess.run(['ffmpeg', '-hide_banner', '-i', wav, '-af', f'silencedetect=noise={noise}:d={d}', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return list(zip([float(x) for x in re.findall(r'silence_start: ([\d.]+)', err)], [float(x) for x in re.findall(r'silence_end: ([\d.]+)', err)]))

def caption_times(sec, wav, times):
    """Each line's caption chunks get times inside the line: split by length, each boundary snapped to the nearest pause."""
    P = pauses(wav); out = []
    for (s, e), chunks in zip(times, CAPTIONS[sec]):
        inner = [p for p in P if p[0] > s + 0.2 and p[1] < e - 0.2]
        w = [max(4, len(c[0].replace(' ', ''))) for c in chunks]; tot = sum(w); st = [s]; acc = 0
        for k in range(1, len(chunks)):
            acc += w[k - 1]; tgt = s + (e - s) * acc / tot
            near = min(inner, key=lambda p: abs((p[0] + p[1]) / 2 - tgt), default=None)
            b = near[1] if near and abs((near[0] + near[1]) / 2 - tgt) < 1.6 and near[1] > st[-1] + 0.6 else tgt
            st.append(b)
        out += [(t, c) for t, c in zip(st, chunks)]
    return out

def main(sec):
    name = 'App_Guide_Short' if sec == 'A' else 'App_Guide_Walkthrough'
    wav = os.path.join(HERE, 'audio', 'voice_short.wav' if sec == 'A' else 'voice_long.wav')
    times = json.load(open(os.path.join(HERE, 'work', f'times_{sec}.json')))
    D = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], capture_output=True, text=True).stdout)
    T = OPEN + D + CLOSE
    wk = os.path.join(HERE, 'work', f'comp_{sec}'); os.makedirs(wk, exist_ok=True)
    rec = os.path.join(HERE, 'work', f'rec_{sec}'); tl = json.load(open(os.path.join(rec, 'timeline.json')))

    # --- still layers
    foreground().save(f'{wk}/fg.png'); card('open').convert('RGB').save(f'{wk}/open.png'); card('close').convert('RGB').save(f'{wk}/close.png')

    # --- the phone: for every output frame, the screencast frame shown at the matching wall time
    fr = tl['frames']; ts = [f[1] for f in fr]; segs = tl['segments']; N = int(math.ceil(D * FPS)); seq = []
    for k in range(N):
        t = k / FPS; sg = segs[0]
        for s in segs:
            if s['a'] <= t: sg = s
        i = max(0, bisect.bisect_right(ts, sg['wall'] + (t - sg['a'])) - 1); seq.append(fr[i][0])
    with open(f'{wk}/screen.txt', 'w') as f:
        k = 0
        while k < N:
            j = k
            while j + 1 < N and seq[j + 1] == seq[k]: j += 1
            f.write(f"file '{rec}/frames/{seq[k]}'\nduration {(j - k + 1) / FPS:.6f}\n"); k = j + 1
        f.write(f"file '{rec}/frames/{seq[-1]}'\n")

    # --- captions: one PNG per chunk, shown from its start to the next chunk's start
    ct = caption_times(sec, wav, times); blank = f'{wk}/cap_blank.png'; caption_png('', '').save(blank)
    ev = [(0.0, blank)]
    for i, (t, (u, e)) in enumerate(ct):
        p = f'{wk}/cap_{i:03d}.png'; caption_png(u, e).save(p); ev.append((OPEN + max(0.0, t - 0.12), p))
    ev.append((OPEN + D + 0.2, blank)); ev.append((T, blank))
    with open(f'{wk}/caps.txt', 'w') as f:
        for (t0, p), (t1, _) in zip(ev, ev[1:]):
            if t1 - t0 > 0.001: f.write(f"file '{p}'\nduration {t1 - t0:.4f}\n")
        f.write(f"file '{blank}'\n")
    json.dump([[round(t, 2), u, e] for t, (u, e) in ct], open(f'{wk}/captions.json', 'w'), ensure_ascii=False, indent=0)

    # --- audio: narration + nasheed (about -26 dB under the voice, -17 dB on the cards), faded; two-pass loudnorm to -14 LUFS
    music = cfg.MUSIC or os.path.join(HERE, '../2026-11-nizam-ul-amal-6/music/nasheed.mp3')
    lo, hi, r = 10 ** (-26 / 20), 10 ** (-17 / 20), 0.8
    vol = f"{lo}+({hi}-{lo})*max(clip(({OPEN + 0.2}-t)/{r}+0.5,0,1),clip((t-{OPEN + D - 0.2})/{r}+0.5,0,1))"
    mix = f'{wk}/mix.wav'
    af = (f"[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,adelay={int(OPEN * 1000)}:all=1,apad,atrim=0:{T}[v];"
          f"[1:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{T},volume='{vol}':eval=frame,afade=t=in:d=1.2,afade=t=out:st={T - 2.6}:d=2.6[m];"
          f"[v][m]amix=inputs=2:normalize=0:duration=first[a]")
    run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-stream_loop', '-1', '-i', music, '-filter_complex', af, '-map', '[a]', '-t', f'{T}', mix])
    meas = subprocess.run(['ffmpeg', '-hide_banner', '-i', mix, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = json.loads(meas[meas.rindex('{'):meas.rindex('}') + 1])
    final_a = f'{wk}/audio.wav'
    run(['ffmpeg', '-v', 'error', '-y', '-i', mix, '-af', f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000", final_a])

    # --- video
    out = os.path.join(cfg.OUT, name + '.mp4')
    vf = (f"[1:v]fps={FPS},scale={SW}:{SH}:flags=lanczos,setpts=PTS-STARTPTS+{OPEN}/TB[scr];"
          f"color=c=black:s={W}x{H}:r={FPS}:d={T}[base];[base][scr]overlay={SX}:{SY}:eof_action=repeat[a];[a][0:v]overlay=0:0[b];"
          f"[3:v]fps={FPS},format=rgba[cap];[b][cap]overlay=0:{CAP_Y}:eof_action=pass[c];"
          f"[4:v]format=rgba,fade=t=out:st={OPEN - 0.45}:d=0.5:alpha=1[o];[c][o]overlay=0:0:eof_action=pass[d];"
          f"[5:v]format=rgba,fade=t=in:st=0:d=0.6:alpha=1,setpts=PTS-STARTPTS+{OPEN + D}/TB[cl];[d][cl]overlay=0:0:eof_action=pass,format=yuv420p[v]")
    run(['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-framerate', str(FPS), '-t', f'{T}', '-i', f'{wk}/fg.png',
         '-f', 'concat', '-safe', '0', '-i', f'{wk}/screen.txt', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-f', 'concat', '-safe', '0', '-i', f'{wk}/caps.txt', '-loop', '1', '-framerate', str(FPS), '-t', f'{OPEN + 0.2}', '-i', f'{wk}/open.png',
         '-loop', '1', '-framerate', str(FPS), '-t', f'{CLOSE}', '-i', f'{wk}/close.png', '-i', final_a,
         '-filter_complex', vf, '-map', '[v]', '-map', '6:a', '-r', str(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p',
         '-c:a', 'aac', '-b:a', '192k', '-t', f'{T}', '-movflags', '+faststart', out])
    print('wrote', out, f'{T:.2f}s')

if __name__ == '__main__':
    main((sys.argv[1] if len(sys.argv) > 1 else 'A').upper())
