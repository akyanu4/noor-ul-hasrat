"""Render the pilot: backgrounds (SVG, drawn once), characters per frame (SVG), captions (PIL), audio mix (ffmpeg).
python3 render.py frames 10,30,50   -> contact sheet of those seconds
python3 render.py video [workers]   -> build/ali_and_the_thirsty_cat.mp4"""
import os, sys, json, math, io, subprocess
from multiprocessing import Pool
import cairosvg
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import chars as C, story

W, H, FPS = 1920, 1080, 24
GROUND = 960
os.makedirs('build/bg', exist_ok=True)
TL = json.load(open('build/timeline.json'))
SHOTS, TOTAL = TL['shots'], TL['total']
FONT = '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf'
FONT_R = '/usr/share/fonts/truetype/google-fonts/Poppins-SemiBold.ttf'
if not os.path.exists(FONT_R): FONT_R = FONT

def ease(x): x = max(0, min(1, x)); return x * x * (3 - 2 * x)
def lerp(a, b, x): return a + (b - a) * ease(x)

# ---------------------------------------------------------------- backgrounds
def sky(w, top='#7ec8f2', bot='#fff3c9'):
    return (f'<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bot}"/></linearGradient></defs>'
            f'<rect width="{w}" height="{H}" fill="url(#sk)"/>')

def cloud(x, y, s=1): return f'<g transform="translate({x},{y}) scale({s})" fill="#fff" opacity=".95"><ellipse cx="0" cy="0" rx="90" ry="40"/><ellipse cx="60" cy="-25" rx="60" ry="45"/><ellipse cx="-50" cy="-15" rx="55" ry="35"/><ellipse cx="110" cy="5" rx="55" ry="30"/></g>'

def house(x, w, h, col, roof='#c96f4a', dome=False):
    y = GROUND - 130 - h; S = 'stroke="#5b4636" stroke-width="5"'
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{col}" {S}/>'
    if dome: s += f'<path d="M{x+w/2-70},{y} A70,70 0 0 1 {x+w/2+70},{y}Z" fill="#f2f2f2" {S}/><rect x="{x+w/2-4}" y="{y-96}" width="8" height="28" fill="#d4a017"/>'
    else: s += f'<rect x="{x-12}" y="{y-22}" width="{w+24}" height="26" rx="6" fill="{roof}" {S}/>'
    for i in range(int(w // 120)):
        wx = x + 40 + i * 120
        s += f'<path d="M{wx},{y+h*0.62} L{wx},{y+h*0.3} A30,30 0 0 1 {wx+60},{y+h*0.3} L{wx+60},{y+h*0.62}Z" fill="#7fb7d9" {S}/>'
    s += f'<path d="M{x+w/2-40},{y+h} L{x+w/2-40},{y+h-110} A40,40 0 0 1 {x+w/2+40},{y+h-110} L{x+w/2+40},{y+h}Z" fill="#8a5a3b" {S}/>'
    return s

def tree(x, s=1, shade=True):
    S = 'stroke="#3b2a20" stroke-width="6"'
    g = f'<g transform="translate({x},{GROUND+20}) scale({s})">'
    if shade: g += '<ellipse cx="40" cy="30" rx="330" ry="46" fill="#3e7d3a" opacity=".35"/>'
    g += f'<path d="M-40,20 Q-30,-200 -60,-330 L60,-330 Q30,-200 40,20Z" fill="#8a5a3b" {S}/>'
    for cx, cy, r in ((-120, -420, 150), (110, -430, 160), (0, -560, 170), (-200, -330, 110), (210, -330, 120)):
        g += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#5aa64e" {S}/>'
    for cx, cy in ((-60, -480), (80, -520), (150, -380), (-150, -380)):
        g += f'<circle cx="{cx}" cy="{cy}" r="14" fill="#e4572e"/>'
    return g + '</g>'

def ground(w, grass='#8fd16a', road=True):
    s = f'<rect x="0" y="{GROUND-130}" width="{w}" height="{H}" fill="{grass}"/>'
    if road: s += f'<rect x="0" y="{GROUND-30}" width="{w}" height="{H}" fill="#e8d3a6"/><rect x="0" y="{GROUND-34}" width="{w}" height="8" fill="#cdb488"/>'
    return s

def bush(x, s=1): return f'<g transform="translate({x},{GROUND-120}) scale({s})"><circle cx="0" cy="0" r="50" fill="#4f9a45" stroke="#3b2a20" stroke-width="5"/><circle cx="55" cy="10" r="42" fill="#4f9a45" stroke="#3b2a20" stroke-width="5"/><circle cx="-50" cy="12" r="38" fill="#4f9a45" stroke="#3b2a20" stroke-width="5"/></g>'

def flowers(x0, w, n=10):
    s = ''
    for i in range(n):
        x = x0 + (i * 137) % w; y = GROUND - 40 - (i * 53) % 70; c = ('#ff6f91', '#ffd23f', '#ffffff', '#c77dff')[i % 4]
        s += f'<line x1="{x}" y1="{y}" x2="{x}" y2="{y+30}" stroke="#3e7d3a" stroke-width="4"/><circle cx="{x}" cy="{y}" r="10" fill="{c}" stroke="#3b2a20" stroke-width="3"/>'
    return s

def bg_svg(name):
    if name == 'street':
        w = 3400
        s = sky(w, '#6fbbe9', '#fff1c2') + cloud(500, 160) + cloud(1600, 120, 1.2) + cloud(2700, 180)
        s += ground(w)
        for i, (wd, h, col, dome) in enumerate(((420, 300, '#f6d6a8', False), (360, 360, '#f3b6a0', False), (520, 280, '#f9f1e1', True), (380, 340, '#cfe3c1', False), (440, 300, '#f6d6a8', False), (400, 330, '#e6c8f0', False), (420, 290, '#f3b6a0', False))):
            s += house(60 + i * 480, wd, h, col, dome=dome)
        s += bush(300) + bush(1350, 1.1) + bush(2500)
        return w, s
    if name == 'park':
        w = 2600
        s = sky(w, '#6fbbe9', '#fff1c2') + cloud(300, 150) + cloud(1300, 110, 1.1) + cloud(2200, 170)
        s += f'<path d="M0,{GROUND-120} Q600,{GROUND-260} 1300,{GROUND-140} T{w},{GROUND-150} L{w},{H} L0,{H}Z" fill="#7cc35b"/>'
        s += ground(w) + flowers(80, w - 200, 18) + tree(1560, 1.05) + bush(400) + bush(2350)
        return w, s
    if name == 'home':
        w = 1920; S = 'stroke="#5b4636" stroke-width="6"'
        s = sky(w, '#7ec8f2', '#ffe9c4') + cloud(300, 140) + cloud(1500, 110)
        s += ground(w, '#8fd16a', road=False) + f'<rect x="0" y="{GROUND-40}" width="{w}" height="{H}" fill="#e3c99b"/>'
        s += f'<rect x="700" y="230" width="1220" height="{GROUND-270}" fill="#f7e3c3" {S}/><rect x="680" y="210" width="1260" height="40" rx="8" fill="#c96f4a" {S}/>'
        s += f'<path d="M1180,{GROUND-40} L1180,520 A130,130 0 0 1 1440,520 L1440,{GROUND-40}Z" fill="#2E8B57" {S}/><circle cx="1405" cy="700" r="12" fill="#f2c94c" {S}/>'
        s += f'<path d="M1310,390 L1310,{GROUND-40}" stroke="#1f6b42" stroke-width="5"/>'
        for wx in (820, 1580):
            s += f'<path d="M{wx},640 L{wx},430 A70,70 0 0 1 {wx+140},430 L{wx+140},640Z" fill="#9fd0ec" {S}/><path d="M{wx+70},360 L{wx+70},640 M{wx},520 L{wx+140},520" stroke="#5b4636" stroke-width="5"/>'
        for px in (1090, 1530):
            s += f'<path d="M{px-40},{GROUND-40} L{px-30},{GROUND-120} L{px+30},{GROUND-120} L{px+40},{GROUND-40}Z" fill="#c9693f" {S}/><circle cx="{px-20}" cy="{GROUND-150}" r="34" fill="#4f9a45" {S}/><circle cx="{px+22}" cy="{GROUND-160}" r="32" fill="#4f9a45" {S}/><circle cx="{px}" cy="{GROUND-190}" r="30" fill="#4f9a45" {S}/>'
        s += tree(220, 0.9, shade=False) + flowers(40, 600, 7)
        return w, s
    if name in ('title', 'moral', 'end'):
        w = 1920
        s = sky(w, '#8fd3fb', '#fff6d6') + cloud(260, 170, 1.1) + cloud(1620, 140, 1.2) + cloud(980, 90, .8)
        s += f'<path d="M0,{GROUND-80} Q480,{GROUND-260} 960,{GROUND-120} T1920,{GROUND-140} L1920,{H} L0,{H}Z" fill="#8fd16a"/>' + flowers(60, 1800, 16)
        return w, s
    raise KeyError(name)

_bg = {}
def bg(name):
    if name not in _bg:
        f = f'build/bg/{name}.png'
        if not os.path.exists(f):
            w, s = bg_svg(name)
            cairosvg.svg2png(bytestring=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{H}">{s}</svg>'.encode(), write_to=f)
        _bg[name] = Image.open(f).convert('RGB')
    return _bg[name]

# ---------------------------------------------------------------- timing helpers
def shot_at(t):
    for s in SHOTS:
        if s['t0'] <= t < s['t1']: return s
    return SHOTS[-1]

def mouth(t, who):
    for s in SHOTS:
        for b in s['beats']:
            k = b.get('who') if b['kind'] == 'say' else ('CAT' if b.get('name', '').startswith('meow') else None)
            if k == who and b['t'] <= t < b['t'] + b['d']:
                i = int((t - b['t']) * FPS); e = b['env']
                return e[i] if i < len(e) else 0
    return 0

def speaking(t, who): return mouth(t, who) > 0.05 or any(b['kind'] == 'say' and b['who'] == who and b['t'] <= t < b['t'] + b['d'] for s in SHOTS for b in s['beats'])

def beat(shot, i): return shot['beats'][i]

def blink(t, seed): x = (t + seed * 1.37) % 3.6; return 1.0 if x < 0.12 else 0.0

def caption(t):
    for s in SHOTS:
        for b in s['beats']:
            if b['kind'] == 'say' and b['t'] <= t < b['t'] + b['d'] + 0.15 and s['name'] not in ('title', 'moral'): return b['who'], b['text']
    return None

# ---------------------------------------------------------------- scenes: return (bg name, camera(x, zoom), svg layer, extra svg overlay in screen space)
def sun(x, y, t, r=80):
    g = f'<g transform="translate({x},{y}) rotate({t*12})">'
    for i in range(12): g += f'<rect x="-8" y="{-r-60}" width="16" height="44" rx="8" fill="#ffc93c" transform="rotate({i*30})"/>'
    return g + f'</g><circle cx="{x}" cy="{y}" r="{r}" fill="#ffd93d" stroke="#f0a500" stroke-width="6"/><circle cx="{x-24}" cy="{y-10}" r="8" fill="#5b4636"/><circle cx="{x+24}" cy="{y-10}" r="8" fill="#5b4636"/><path d="M{x-26},{y+22} Q{x},{y+42} {x+26},{y+22}" fill="none" stroke="#5b4636" stroke-width="6" stroke-linecap="round"/>'

def sweat(x, y, t):
    k = (t * 1.3) % 1
    return f'<path d="M{x},{y+k*40} q-10,16 0,24 q10,-8 0,-24Z" fill="#7fd0ff" stroke="#3b7fb3" stroke-width="3" opacity="{1-k}"/>'

def heart(x, y, s=1, op=1): return f'<path transform="translate({x},{y}) scale({s})" d="M0,10 C-25,-15 -50,10 0,45 C50,10 25,-15 0,10Z" fill="#ff5c8a" stroke="#3b2a20" stroke-width="4" opacity="{op}"/>'

def scene(t):
    sh = shot_at(t); n = sh['name']; lt = t - sh['t0']; D = sh['t1'] - sh['t0']
    A = lambda **k: dict(k)
    mA, mM, mN, mC = mouth(t, 'ALI'), mouth(t, 'MARYAM'), mouth(t, 'NANA'), mouth(t, 'CAT')
    bl = lambda i: blink(t, i)
    over = ''
    if n == 'title':
        lay = C.kid(A(x=560, y=GROUND, s=1.15, face=-1, arm_f=135 + 18 * math.sin(t * 6), blink=bl(1), happy=1))
        lay += C.kid(A(x=860, y=GROUND, s=1.0, face=1, arm_f=130 + 18 * math.sin(t * 6 + 1), blink=bl(2), happy=1), girl=True)
        lay += C.nana(A(x=1120, y=GROUND, s=0.95, face=-1, arm_f=40, blink=bl(3), happy=1))
        lay += C.cat(A(x=1330, y=GROUND, s=1.0, face=-1, pose='sit', happy=1, t=t))
        k = ease(lt / 0.8)
        over = (f'<g transform="translate(960,250) scale({0.6+0.4*k})" opacity="{k}"><rect x="-640" y="-110" width="1280" height="190" rx="40" fill="#fff" stroke="#3b2a20" stroke-width="8"/>'
                f'<text x="0" y="12" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="92" fill="#2E8B57">{story.TITLE}</text>'
                f'<text x="0" y="62" text-anchor="middle" font-family="Poppins" font-weight="600" font-size="34" fill="#c0396b">A story about kindness</text></g>')
        return 'title', (0, 1), lay, over
    if n == 'street':
        b0, b1 = beat(sh, 0), beat(sh, 1); stop = b1['t'] + b1['d'] - sh['t0'] + 0.2
        wx = lerp(300, 1900, lt / stop); walking = lt < stop
        ph = lt * 1.6 if walking else None
        camx = max(0, min(3400 - W, wx - 820))
        aliT = A(x=wx + 120, y=GROUND, s=1.0, walk=ph, mouth=mA, blink=bl(1), arm_b=10, arm_f=(150 if not walking and mA > 0.05 else 8))
        marT = A(x=wx - 110, y=GROUND, s=0.88, walk=(ph + 0.5) if walking else None, mouth=mM, blink=bl(2), face=(-1 if (not walking and mA > .05) else 1), arm_f=(60 if mM > .05 else 8))
        if not walking and speaking(t, 'ALI'): aliT['face'] = -1
        lay = C.kid(marT, girl=True) + C.kid(aliT)
        lay += sweat(wx + 120 + 70 - camx + camx, GROUND - 470, t) if not walking else ''
        over = sun(1680, 170, t)
        return 'street', (camx, 1), lay, over
    if n == 'tree':
        lt2 = lt; walking = lt2 < 2.4
        ax = lerp(500, 980, lt2 / 2.4)
        lay = C.cat(A(x=1650, y=GROUND + 4, s=1.05, face=-1, pose='lie', eyes=0.55, tongue=1, mouth=mC, t=t))
        lay += C.kid(A(x=ax - 230, y=GROUND, s=0.88, walk=lt2 * 1.6 if walking else None, mouth=mM, blink=bl(2), arm_f=(115 if speaking(t, 'MARYAM') else 8), look=1), girl=True)
        lay += C.kid(A(x=ax, y=GROUND, s=1.0, walk=lt2 * 1.6 + 0.5 if walking else None, mouth=mA, blink=bl(1), arm_f=(30 if mA > .05 else 8), tilt=(4 if not walking else 0), look=1))
        cam = (lerp(0, 380, lt2 / 3.0), 1)
        return 'park', cam, lay, sun(1680 - 0, 150, t, 60)
    if n == 'think':
        nb = beat(sh, 2); bubble = (nb['t'] - sh['t0'] - 0.6) <= lt <= (nb['t'] + nb['d'] - sh['t0'] + 0.5)
        lay = C.cat(A(x=1650, y=GROUND + 4, s=1.05, face=-1, pose='lie', eyes=0.55, tongue=1, t=t))
        lay += C.kid(A(x=760, y=GROUND, s=0.88, blink=bl(2), look=1), girl=True)
        lay += C.kid(A(x=1010, y=GROUND, s=1.0, mouth=mA, blink=bl(1), arm_f=120, hold='bottle', hold_tilt=-20, look=(-1 if lt < 4 else 1)))
        zoom = lerp(1.0, 1.25, lt / 2.5); cam = (lerp(380, 400, lt / 2.5), zoom)
        if bubble:
            k = ease((lt - (nb['t'] - sh['t0'] - 0.6)) / 0.5)
            over = (f'<g opacity="{k}"><circle cx="1180" cy="560" r="16" fill="#fff" stroke="#3b2a20" stroke-width="5"/><circle cx="1240" cy="480" r="26" fill="#fff" stroke="#3b2a20" stroke-width="5"/>'
                    f'<ellipse cx="1500" cy="290" rx="330" ry="230" fill="#fffbea" stroke="#3b2a20" stroke-width="7"/>'
                    f'<clipPath id="bub"><ellipse cx="1500" cy="290" rx="320" ry="220"/></clipPath><g clip-path="url(#bub)">'
                    f'<rect x="1170" y="60" width="660" height="460" fill="#fff4d6"/>'
                    + C.nana(A(x=1500, y=830, s=1.15, mouth=mN, blink=bl(3), arm_f=(100 + 10 * math.sin(t * 3) if mN > .05 else 20), look=0)) + '</g></g>')
        return 'park', cam, lay, over
    if n == 'pour':
        b0 = beat(sh, 0); lapb = beat(sh, 1); t_lap = lapb['t'] - sh['t0']; t_end = t_lap + lapb['d']
        pouring = (b0['d'] * 0.6) < lt < t_lap + 0.4
        drink = t_lap - 0.2 < lt < t_end + 0.2
        happyC = lt > t_end
        purr = any(b['kind'] == 'sfx' and b['name'] == 'purr' and b['t'] <= t < b['t'] + b['d'] for b in sh['beats'])
        laughing = speaking(t, 'MARYAM')
        lay = f'<ellipse cx="1430" cy="{GROUND+6}" rx="56" ry="16" fill="#4aa8e0" stroke="#3b2a20" stroke-width="5"/><ellipse cx="1430" cy="{GROUND}" rx="44" ry="9" fill="#9fd6f5"/>'
        catpose = 'drink' if drink else ('sit' if lt > 1.2 else 'lie')
        lay += C.cat(A(x=1560 if catpose != 'lie' else 1650, y=GROUND + 4, s=1.05, face=-1, pose=catpose, eyes=(0.55 if lt < 1.2 else (0.9 if purr else 0)), tongue=lt < 1.2, mouth=mC, happy=happyC or purr, t=t))
        lay += C.kid(A(x=930, y=GROUND, s=0.88, blink=bl(2), look=1, mouth=mM, happy=1 if laughing else 0, arm_f=(150 + 15 * math.sin(t * 8) if laughing else 8), arm_b=(150 if laughing else 8)), girl=True)
        lay += C.kid(A(x=1240, y=GROUND, s=1.0, mouth=mA, blink=bl(1), arm_f=(78 if pouring else 20), hold='bottle', hold_tilt=(115 if pouring else 0), tilt=(10 if pouring else 0), look=1, happy=1 if happyC else 0))
        if pouring:
            lay += f'<path d="M1420,{GROUND-110} Q1430,{GROUND-50} 1430,{GROUND-4}" fill="none" stroke="#4aa8e0" stroke-width="12" stroke-linecap="round" opacity=".85"/>'
        if happyC:
            for i in range(3):
                k = ((t * 0.7 + i / 3) % 1); lay += heart(1600 + 30 * math.sin(t * 2 + i), GROUND - 260 - k * 160, 0.8, 1 - k)
        cam = (lerp(400, 420, lt / 2), lerp(1.25, 1.15, lt / 2))
        return 'park', cam, lay, sun(1700, 140, t, 55)
    if n == 'follow':
        hey = beat(sh, 2); turned = lt > hey['t'] - sh['t0'] - 0.1
        kx = lerp(1100, 1750, lt / 3.5) if not turned else 1100 + 650 * ease((hey['t'] - sh['t0'] - 0.1) / 3.5)
        walking = not turned
        lay = C.kid(A(x=kx - 220, y=GROUND, s=0.88, walk=lt * 1.6 if walking else None, blink=bl(2), face=(1 if walking else -1), happy=1), girl=True)
        lay += C.kid(A(x=kx, y=GROUND, s=1.0, walk=lt * 1.6 + .5 if walking else None, blink=bl(1), mouth=mA, face=(1 if walking else -1), arm_f=(150 if turned else 8)))
        cx = kx - 470 + (0 if walking else 40 * abs(math.sin(t * 5)))
        hop = 0 if walking else -abs(math.sin(t * 6)) * 40
        lay += C.cat(A(x=cx, y=GROUND + 4 + hop, s=0.95, pose='walk', walk=lt * 2.2, happy=1, mouth=mC, t=t))
        return 'park', (lerp(500, 600, lt / D), 1), lay, sun(1700, 140, t, 55)
    if n == 'home':
        ent = 2.0; kx = lerp(-150, 560, lt / ent); walking = lt < ent
        laugh = any(b['kind'] in ('sfx',) and b['name'] == 'laugh' and b['t'] <= t < b['t'] + b['d'] + 1.6 for b in sh['beats']) or speaking(t, 'NANA') and 'Ha ha' in (caption(t) or ('', ''))[1]
        lay = C.nana(A(x=1310, y=GROUND - 40, s=0.95, face=-1, mouth=mN, blink=bl(3), arm_f=(95 + 10 * math.sin(t * 2.5) if mN > .05 else 12), happy=1 if laugh else 0, bob=(-6 * abs(math.sin(t * 9)) if laugh else 0)))
        lay += C.cat(A(x=kx - 330 if walking else 720, y=GROUND + 4, s=0.95, pose='walk' if walking else 'sit', walk=lt * 2.2, happy=1, mouth=mC, t=t))
        lay += C.kid(A(x=kx - 150, y=GROUND, s=0.88, walk=lt * 1.6 if walking else None, mouth=mM, blink=bl(2), happy=1 if laugh else 0, arm_f=(120 if mM > .05 else 8), bob=(-8 * abs(math.sin(t * 9 + 1)) if laugh else 0)), girl=True)
        lay += C.kid(A(x=kx + 110, y=GROUND, s=1.0, walk=lt * 1.6 + .5 if walking else None, mouth=mA, blink=bl(1), happy=1 if laugh else 0, arm_f=(70 if mA > .05 else 8), bob=(-8 * abs(math.sin(t * 9 + 2)) if laugh else 0)))
        if laugh:
            for i in range(4):
                k = ((t * 0.8 + i / 4) % 1); lay += heart(500 + i * 260, GROUND - 520 - k * 180, 0.7, 1 - k)
        return 'home', (0, 1), lay, ''
    if n == 'moral':
        k = ease(lt / 0.8)
        lay = C.kid(A(x=640, y=GROUND, s=0.95, happy=1, blink=bl(1), arm_f=150 + 15 * math.sin(t * 5))) + C.kid(A(x=820, y=GROUND, s=0.85, happy=1, face=-1, blink=bl(2), arm_f=150 + 15 * math.sin(t * 5 + 1)), girl=True)
        lay += C.nana(A(x=1080, y=GROUND, s=0.82, face=-1, happy=1, blink=bl(3), arm_f=40)) + C.cat(A(x=1280, y=GROUND, s=0.9, face=-1, pose='sit', happy=1, t=t))
        over = (f'<g opacity="{k}"><rect x="260" y="110" width="1400" height="300" rx="46" fill="#fffbea" stroke="#3b2a20" stroke-width="8"/>'
                f'<text x="960" y="190" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="44" fill="#c0396b">The Lesson</text>'
                f'<text x="960" y="282" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="62" fill="#2E8B57">{story.MORAL[0]}</text>'
                f'<text x="960" y="360" text-anchor="middle" font-family="Poppins" font-weight="600" font-size="46" fill="#3b2a20">{story.MORAL[1]}</text></g>')
        for i in range(5):
            kk = ((t * 0.5 + i / 5) % 1); over += heart(220 + i * 370, 900 - kk * 400, 0.7, (1 - kk) * 0.8)
        return 'moral', (0, 1), lay, over
    # end card
    k = ease(lt / 0.6)
    lay = C.kid(A(x=700, y=GROUND, s=0.95, happy=1, blink=bl(1), arm_f=150 + 20 * math.sin(t * 6))) + C.kid(A(x=880, y=GROUND, s=0.85, happy=1, face=-1, blink=bl(2), arm_f=150 + 20 * math.sin(t * 6 + 1)), girl=True)
    lay += C.cat(A(x=1100, y=GROUND, s=0.95, face=-1, pose='sit', happy=1, t=t))
    over = (f'<g opacity="{k}"><rect x="460" y="120" width="1000" height="330" rx="46" fill="#fff" stroke="#3b2a20" stroke-width="8"/>'
            f'<text x="960" y="215" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="56" fill="#2E8B57">Thank you for watching!</text>'
            f'<rect x="700" y="255" width="520" height="96" rx="48" fill="#e62117" stroke="#3b2a20" stroke-width="6"/>'
            f'<text x="960" y="318" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="46" fill="#fff">SUBSCRIBE</text>'
            f'<text x="960" y="410" text-anchor="middle" font-family="Poppins" font-weight="600" font-size="36" fill="#3b2a20">Iqra-LetsLearn · more stories every week</text></g>')
    return 'end', (0, 1), lay, over

# ---------------------------------------------------------------- frame
_f = {}
def font(sz, bold=True):
    k = (sz, bold)
    if k not in _f: _f[k] = ImageFont.truetype(FONT if bold else FONT_R, sz)
    return _f[k]

NAMES = {'N': None, 'ALI': ('Ali', '#2E8B57'), 'MARYAM': ('Maryam', '#c0396b'), 'NANA': ('Nana', '#7b5a3c')}

def draw_caption(im, cap):
    who, text = cap; d = ImageDraw.Draw(im); f = font(46)
    words = text.split(); lines = []; cur = ''
    for w_ in words:
        tt = (cur + ' ' + w_).strip()
        if d.textlength(tt, font=f) > 1500 and cur: lines.append(cur); cur = w_
        else: cur = tt
    lines.append(cur)
    lh = 60; bh = lh * len(lines) + 34; y0 = H - bh - 26
    bw = max(d.textlength(l, font=f) for l in lines) + 80
    d.rounded_rectangle([W / 2 - bw / 2, y0, W / 2 + bw / 2, y0 + bh], 26, fill=(255, 255, 255, 235), outline=(59, 42, 32), width=5)
    nm = NAMES.get(who)
    if nm:
        nf = font(32); nw = d.textlength(nm[0], font=nf) + 40
        d.rounded_rectangle([W / 2 - bw / 2 + 30, y0 - 30, W / 2 - bw / 2 + 30 + nw, y0 + 16], 18, fill=nm[1], outline=(59, 42, 32), width=4)
        d.text((W / 2 - bw / 2 + 50, y0 - 28), nm[0], font=nf, fill='white')
    for i, l in enumerate(lines):
        d.text((W / 2, y0 + 18 + i * lh), l, font=f, fill=(40, 30, 24), anchor='ma')

def frame(t):
    name, (cx, zoom), lay, over = scene(t)
    b = bg(name); bw = b.width
    world = b.copy()
    if lay:
        png = cairosvg.svg2png(bytestring=f'<svg xmlns="http://www.w3.org/2000/svg" width="{bw}" height="{H}">{lay}</svg>'.encode())
        world.paste(Image.open(io.BytesIO(png)), (0, 0), Image.open(io.BytesIO(png)))
    vw, vh = W / zoom, H / zoom
    x0 = max(0, min(bw - vw, cx + (W - vw) / 2 if zoom != 1 else cx)); y0 = H - vh - (H - vh) * 0.35
    im = world.crop((int(x0), int(y0), int(x0 + vw), int(y0 + vh))).resize((W, H), Image.LANCZOS) if zoom != 1 else world.crop((int(x0), 0, int(x0) + W, H))
    if over:
        png = cairosvg.svg2png(bytestring=f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}">{over}</svg>'.encode())
        o = Image.open(io.BytesIO(png)); im.paste(o, (0, 0), o)
    # fade between shots
    sh = shot_at(t); lt = t - sh['t0']; rt = sh['t1'] - t
    im = im.convert('RGBA')
    cap = caption(t)
    if cap: draw_caption(im, cap)
    fade = min(1, lt / 0.35, rt / 0.35) if sh['name'] != 'title' or lt > 0.3 else lt / 0.3
    if fade < 1:
        im = Image.blend(Image.new('RGBA', (W, H), (255, 255, 255, 255)), im, max(0, fade))
    return im.convert('RGB')

def chunk(args):
    i, a, b = args
    out = f'build/chunks/c{i:03d}.mp4'
    if os.path.exists(out): return out
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                          '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', out + '.tmp.mp4'], stdin=subprocess.PIPE)
    for n in range(a, b): p.stdin.write(frame(n / FPS).tobytes())
    p.stdin.close(); p.wait(); os.rename(out + '.tmp.mp4', out)
    return out

def mix(out):
    """voices + sfx at their times, nasheed bed quietly under everything"""
    inputs, filt = [], []; k = 0
    for s in SHOTS:
        for b in s['beats']:
            inputs += ['-i', b['file']]; ms = int(b['t'] * 1000)
            vol = 1.0 if b['kind'] == 'say' else 0.8
            filt.append(f'[{k}:a]aresample=48000,volume={vol},adelay={ms}|{ms}[a{k}]'); k += 1
    music = '/home/claude/noor-ul-hasrat/tools/shorts/projects/2026-10-haqeeqat-e-baiat/music/nasheed.mp3'
    inputs += ['-stream_loop', '-1', '-i', music]
    filt.append(f'[{k}:a]aresample=48000,volume=0.10,atrim=0:{TOTAL:.2f},afade=t=in:d=1.5,afade=t=out:st={TOTAL-3:.2f}:d=3[mus]')
    filt.append(''.join(f'[a{i}]' for i in range(k)) + f'[mus]amix=inputs={k+1}:normalize=0:dropout_transition=0,alimiter=limit=0.95[out]')
    subprocess.run(['ffmpeg', '-v', 'error', '-y'] + inputs + ['-filter_complex', ';'.join(filt), '-map', '[out]', '-t', f'{TOTAL:.2f}', '-ac', '2', '-ar', '48000', out], check=True)

if __name__ == '__main__':
    if sys.argv[1] == 'frames':
        ts = [float(x) for x in sys.argv[2].split(',')]
        ims = [frame(t).resize((480, 270)) for t in ts]
        cols = 4; rows = (len(ims) + cols - 1) // cols
        sheet = Image.new('RGB', (480 * cols, 270 * rows), 'white')
        for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * 480, (i // cols) * 270))
        sheet.save(sys.argv[3] if len(sys.argv) > 3 else 'build/sheet.png'); print('ok')
    elif sys.argv[1] == 'one':
        frame(float(sys.argv[2])).save(sys.argv[3]); print('ok')
    elif sys.argv[1] == 'video':
        nw = int(sys.argv[2]) if len(sys.argv) > 2 else 4
        os.makedirs('build/chunks', exist_ok=True)
        N = int(TOTAL * FPS); step = 96
        jobs = [(i, a, min(a + step, N)) for i, a in enumerate(range(0, N, step))]
        with Pool(nw) as p: outs = p.map(chunk, jobs)
        open('build/chunks/list.txt', 'w').write(''.join(f"file '{os.path.basename(o)}'\n" for o in outs))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'build/chunks/list.txt', '-c', 'copy', 'build/video.mp4'], check=True)
        mix('build/audio_mix.wav')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'build/video.mp4', '-i', 'build/audio_mix.wav', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', 'build/ali_and_the_thirsty_cat.mp4'], check=True)
        print('done build/ali_and_the_thirsty_cat.mp4')
