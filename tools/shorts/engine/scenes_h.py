"""Scenes, part H: Nizam-ul-Amal-e-Fuqara (parts 2-4). Drawn animation, no photos.
Every figure is a featureless silhouette or light; saints only as light; no depiction of the Prophet ﷺ or Hazrat Ali R.A.
Layout works at 9:16 (Shorts) and 16:9 (full dars): pictures sit in the upper part, the captions keep the lower third."""
import math, random, functools
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import lib as L
from lib import ease, sm, lerp, col, GOLD, WARM, IVORY
from scenes_a import cached

DARK = (16, 10, 8)

# ---------------------------------------------------------------- shared helpers
def S(): return min(L.W, L.H) / 1080          # drawing scale
def CY(): return L.H * (0.40 if L.PORTRAIT else 0.46)   # vertical centre of the picture area

def sky(key, stops, stars=0, seed=7):
    def mk():
        img = L.vgrad(stops)
        if stars: img = L.draw_stars(img, 0, seed=seed, n=int(stars * L.W / 1080), ymax=0.65, tw=False)
        return img
    return cached(("h_sky", key), mk)

NIGHT = [(0, (6, 12, 26)), (0.6, (14, 30, 44)), (1, (10, 18, 22))]
DUSK = [(0, (40, 30, 70)), (0.45, (220, 120, 70)), (0.62, (250, 180, 110)), (1, (60, 34, 24))]
DAWN = [(0, (40, 60, 110)), (0.5, (240, 170, 120)), (0.66, (255, 214, 150)), (1, (70, 50, 36))]
WARMROOM = [(0, (30, 16, 10)), (0.6, (64, 36, 20)), (1, (20, 12, 8))]

def word(img, ur, en, x, y, a=1.0, size=96, en_size=40):
    """An Urdu word with its English meaning underneath."""
    if a <= 0.01: return img
    if ur: img = L.paste_center(img, L.urdu(ur, size), x, y, alpha=a)
    if en: img = L.paste_center(img, L.serif_text(en, en_size, (236, 220, 180)), x, y + size * L.U * 1.2, alpha=a)
    return img

def title(img, ur, t, d, size=110, y=None):
    a = min(1, t / 0.8) * min(1, max(0, (d - t) / 0.6))
    return L.paste_center(img, L.urdu(ur, size), L.W / 2, L.H * (y if y else (0.10 if L.PORTRAIT else 0.12)), alpha=a)

def motes(img, ot, seed=5, n=60, color=WARM):
    return L.screen(img, L.glow_layer(lambda dr, s: L.draw_motes(dr, ot, s, seed=seed, n=n, color=color), blur=5))

def ray(img, x, top, w, a, color=(255, 236, 190)):
    """A soft beam of light coming down from the sky onto x."""
    if a <= 0.01: return img
    def f(dr, s):
        for k in range(6):
            ww = w * (1 + k * 0.5)
            dr.polygon([((x - ww * 0.3) * s, top * s), ((x + ww * 0.3) * s, top * s), ((x + ww) * s, L.H * s), ((x - ww) * s, L.H * s)], fill=col(color, a * 0.10))
    return L.screen(img, L.glow_layer(f, blur=30))

def heart_pts(cx, cy, r, n=60):
    pts = []
    for i in range(n):
        th = 2 * math.pi * i / n
        x = 16 * math.sin(th) ** 3; y = -(13 * math.cos(th) - 5 * math.cos(2 * th) - 2 * math.cos(3 * th) - math.cos(4 * th))
        pts.append((cx + x * r / 16, cy + y * r / 16))
    return pts

def glow_dot(img, x, y, r, a, color=(255, 236, 190)):
    if a <= 0.01: return img
    def f(dr, s):
        for k, aa in [(3.2, 0.10), (1.8, 0.28), (1.0, 1.0)]:
            dr.ellipse(((x - r * k) * s, (y - r * k) * s, (x + r * k) * s, (y + r * k) * s), fill=col(color, a * aa))
    return L.screen(img, L.glow_layer(f, blur=12))

def man(d, cx, base, h, fill):
    """Standing man in kurta and topi, featureless silhouette, facing the viewer."""
    r = h * 0.075
    hy = base - h + r * 1.3
    d.ellipse((cx - r, hy - r, cx + r, hy + r * 1.1), fill=fill)                                   # head
    d.chord((cx - r * 1.02, hy - r * 1.25, cx + r * 1.02, hy - r * 0.05), 180, 360, fill=fill)    # topi
    d.rectangle((cx - r * 0.45, hy + r, cx + r * 0.45, hy + r * 1.6), fill=fill)                   # neck
    sh = hy + r * 1.5
    d.polygon([(cx - h * 0.16, sh + h * 0.03), (cx - h * 0.10, sh), (cx + h * 0.10, sh), (cx + h * 0.16, sh + h * 0.03),
               (cx + h * 0.15, sh + h * 0.30), (cx + h * 0.19, base - h * 0.30), (cx - h * 0.19, base - h * 0.30), (cx - h * 0.15, sh + h * 0.30)], fill=fill)   # kurta
    for k in (-1, 1):
        d.line((cx + k * h * 0.15, sh + h * 0.04, cx + k * h * 0.18, sh + h * 0.30), fill=fill, width=max(2, int(h * 0.06)))   # arms
        d.polygon([(cx + k * h * 0.02, base - h * 0.31), (cx + k * h * 0.11, base - h * 0.31), (cx + k * h * 0.09, base), (cx + k * h * 0.03, base)], fill=fill)   # legs
        d.ellipse((cx + k * h * 0.06 - h * 0.05, base - h * 0.02, cx + k * h * 0.06 + h * 0.05, base + h * 0.015), fill=fill)

def sitter(d, cx, base, h, fill, hands_up=0.0):
    """Seated cross-legged, in kurta and topi; hands_up raises both hands in dua."""
    r = h * 0.11
    hy = base - h + r * 1.2
    d.ellipse((cx - r, hy - r, cx + r, hy + r * 1.1), fill=fill)
    d.chord((cx - r * 1.02, hy - r * 1.25, cx + r * 1.02, hy - r * 0.05), 180, 360, fill=fill)
    d.rectangle((cx - r * 0.45, hy + r, cx + r * 0.45, hy + r * 1.6), fill=fill)
    sh = hy + r * 1.5
    d.polygon([(cx - h * 0.22, sh + h * 0.04), (cx - h * 0.14, sh), (cx + h * 0.14, sh), (cx + h * 0.22, sh + h * 0.04), (cx + h * 0.26, base - h * 0.18), (cx - h * 0.26, base - h * 0.18)], fill=fill)
    d.ellipse((cx - h * 0.48, base - h * 0.26, cx + h * 0.48, base + h * 0.04), fill=fill)       # crossed legs
    for k in (-1, 1):
        if hands_up > 0:
            ex, ey = cx + k * h * 0.30, sh + h * 0.12 - h * 0.30 * hands_up
            d.line((cx + k * h * 0.20, sh + h * 0.05, cx + k * h * 0.30, sh + h * 0.30), fill=fill, width=max(2, int(h * 0.075)))
            d.line((cx + k * h * 0.30, sh + h * 0.30, ex, ey), fill=fill, width=max(2, int(h * 0.07)))
            d.ellipse((ex - h * 0.05, ey - h * 0.09, ex + h * 0.05, ey + h * 0.02), fill=fill)
        else:
            d.line((cx + k * h * 0.20, sh + h * 0.05, cx + k * h * 0.28, base - h * 0.20), fill=fill, width=max(2, int(h * 0.075)))

def kneeling(d, cx, base, h, fill, hands_up=0.0):
    sitter(d, cx, base, h, fill, hands_up)

# ---------------------------------------------------------------- tawbah: smoke of sins dissolving into light around a figure in prayer
SMOKE = [(random.Random(i).uniform(-1, 1), random.Random(i + 50).uniform(-0.9, 0.5), random.Random(i + 99).uniform(0.6, 1.3)) for i in range(16)]
def tawbah(t, d, ot):
    W, H, s = L.W, L.H, S()
    img = sky("night", NIGHT, stars=260).copy()
    cx, base, h = W / 2, CY() + 220 * s, 360 * s
    p = min(1.0, t / max(8.0, d * 0.75))        # how far repentance has gone
    img = ray(img, cx, 0, 90 * s, 0.25 + 0.75 * p)
    # dark smoke: sins, thinning as he repents
    sm_l = Image.new("L", (W // 2, H // 2), 0); sd = ImageDraw.Draw(sm_l)
    for i, (dx, dy, sz) in enumerate(SMOKE):
        r = sz * 120 * s * (1 - 0.85 * p) * (1 + 0.08 * math.sin(ot * 0.9 + i))
        x = cx + dx * 300 * s + 20 * s * math.sin(ot * 0.4 + i); y = base - h * 0.5 + dy * 320 * s - 30 * s * p * i / 8
        sd.ellipse(((x - r) / 2, (y - r) / 2, (x + r) / 2, (y + r) / 2), fill=int(200 * (1 - p)))
    sm_l = sm_l.filter(ImageFilter.GaussianBlur(40 * s)).resize((W, H))
    img = Image.composite(Image.new("RGB", (W, H), (8, 6, 8)), img, sm_l)
    fig = Image.new("L", (W, H), 0); kneeling(ImageDraw.Draw(fig), cx, base, h, 255, hands_up=1.0)
    img.paste(Image.new("RGB", (W, H), (12, 10, 14)), (0, 0), fig)
    # the heart lights up, and the smoke turns into rising gold
    img = glow_dot(img, cx, base - h * 0.42, 26 * s * (0.4 + p), 0.3 + 0.7 * p * (0.85 + 0.15 * math.sin(ot * 3)))
    img = motes(img, ot, seed=17, n=int(10 + 70 * p))
    return title(img, "توبہ", t, d)

def heart(t, d, ot):
    """Repentance is a quality of the heart, not of the hands."""
    W, H, s = L.W, L.H, S()
    img = sky("night", NIGHT, stars=260).copy()
    cx, cy = W / 2, CY()
    beat = 1 + 0.06 * max(0, math.sin(ot * 4.2)) ** 6
    r = 240 * s * beat * (0.85 + 0.15 * min(1, t / 2))
    def f(dr, s2):
        for k, a in [(1.35, 0.12), (1.15, 0.3), (1.0, 0.95)]:
            dr.polygon([(x * s2, y * s2) for x, y in heart_pts(cx, cy, r * k)], fill=col((255, 196, 140), a))
    img = L.screen(img, L.glow_layer(f, blur=16))
    # two hands below, fading: not the hands
    hl = Image.new("L", (W, H), 0); hd = ImageDraw.Draw(hl)
    for k in (-1, 1):
        x = cx + k * 300 * s; y = cy + 330 * s
        hd.rounded_rectangle((x - 70 * s, y - 110 * s, x + 70 * s, y + 60 * s), radius=int(40 * s), fill=255)
        for j in range(4): hd.rounded_rectangle((x - 66 * s + j * 36 * s, y - 190 * s + abs(j - 1.5) * 18 * s, x - 36 * s + j * 36 * s, y - 90 * s), radius=int(14 * s), fill=255)
    fa = 0.55 * (1 - sm(d * 0.3, d * 0.7, t))
    img.paste(Image.new("RGB", (W, H), (70, 60, 60)), (0, 0), hl.point(lambda v: int(v * fa)))
    img = word(img, "دل", "the heart", cx, cy - 20 * s, a=sm(1, 2.5, t), size=120)
    img = motes(img, ot, seed=21, n=40)
    return title(img, "توبہ دل کی صفت ہے", t, d, size=90)

# ---------------------------------------------------------------- the four: Shariat, Tariqat (body) — Haqiqat, Marifat (soul)
STEPS = [("شریعت", "Shariat"), ("طریقت", "Tariqat"), ("حقیقت", "Haqiqat"), ("معرفت", "Marifat")]
def four_steps(t, d, ot):
    W, H, s = L.W, L.H, S()
    img = sky("night2", [(0, (10, 16, 34)), (1, (26, 40, 46))], stars=220, seed=9).copy()
    n = 4; bw = (W * (0.82 if L.PORTRAIT else 0.6)) / n; sh = 120 * s
    x0 = W / 2 - bw * n / 2; yb = CY() + 300 * s
    STEP_T = [534.7, 557.3, 589.3, 590.8]          # when each is named in NAF002
    if 500 <= ot <= 630: show = [sm(x - 0.3, x + 0.9, ot) for x in STEP_T]
    else: show = [sm(1 + i * (d * 0.18), 2 + i * (d * 0.18), t) for i in range(n)]
    lay = Image.new("RGB", (W, H)); dr = ImageDraw.Draw(lay)
    for i in range(n):
        x = x0 + i * bw; y = yb - (i + 1) * sh
        c = (150, 112, 70) if i < 2 else (255, 230, 170)
        dr.rectangle((x, y, x + bw - 6 * s, yb), fill=col(c, 0.85 * show[i]))
        dr.rectangle((x, y, x + bw - 6 * s, y + 8 * s), fill=col((255, 240, 200), show[i]))
    img = L.screen(img, lay.filter(ImageFilter.GaussianBlur(2 * s)))
    for i, (ur, en) in enumerate(STEPS):
        x = x0 + i * bw + bw / 2; y = yb - (i + 1) * sh - 110 * s
        img = word(img, ur, en, x, y, a=show[i], size=64, en_size=30)
    # body / soul brackets
    img = word(img, "", "the body", x0 + bw, yb + 60 * s, a=show[1], en_size=40)
    img = word(img, "", "the soul", x0 + 3 * bw, yb + 60 * s, a=show[3], en_size=40)
    # a soul of light climbs the steps
    k = min(3.0, max(0.0, sum(show) - 1.0)) if 500 <= ot <= 630 else min(3.0, max(0.0, (t / max(1, d)) * 4.2 - 0.3))
    i = min(2, int(k)) if k < 3 else 2; f = ease(k - i) if k < 3 else 1.0
    xa = x0 + i * bw + bw / 2; xb = x0 + min(3, i + 1) * bw + bw / 2
    ya = yb - (i + 1) * sh; yb2 = yb - (min(3, i + 1) + 1) * sh
    x = lerp(xa, xb, f); y = lerp(ya, yb2, f) - 60 * s - 40 * s * math.sin(math.pi * f)
    img = glow_dot(img, x, y, 22 * s, 1.0)
    return motes(img, ot, seed=23, n=40)

# ---------------------------------------------------------------- the body is a horse
def horse_shape(d, cx, base, h, phase, fill, mode="run", rear=0.0):
    """Side view, facing right. phase drives the gallop; rear (0..1) lifts the front."""
    def P(x, y):   # local coords (units of h, y up from the ground) -> image, rotated about the hind feet for rearing
        a = 0.62 * rear; hx, hy = -0.55, 0.0
        x2, y2 = x - hx, y - hy
        xr = hx + x2 * math.cos(a) - y2 * math.sin(a); yr = hy + x2 * math.sin(a) + y2 * math.cos(a)
        return (cx + xr * h, base - yr * h)
    body = [P(-0.62, 0.70), P(-0.35, 0.82), P(0.30, 0.84), P(0.52, 0.80), P(0.60, 0.62), P(0.40, 0.50), P(-0.40, 0.50), P(-0.66, 0.58)]
    d.polygon(body, fill=fill)
    def E(x, y, rx, ry):   # rounded masses: hindquarters, barrel, chest
        pts = [P(x + rx * math.cos(u), y + ry * math.sin(u)) for u in np.linspace(0, 2 * math.pi, 28)]
        d.polygon(pts, fill=fill)
    E(-0.45, 0.68, 0.24, 0.19); E(0.0, 0.66, 0.40, 0.17); E(0.42, 0.68, 0.18, 0.17)
    nod = 0.03 * math.sin(phase * 2) if mode == "run" else (-0.12 if mode == "calm" else 0.0)
    neck = [P(0.36, 0.80), P(0.62, 1.20 + nod), P(0.78, 1.22 + nod), P(0.66, 0.66)]
    d.polygon(neck, fill=fill)
    head = [P(0.60, 1.26 + nod), P(0.74, 1.30 + nod), P(1.02, 1.02 + nod), P(0.98, 0.96 + nod), P(0.82, 1.02 + nod), P(0.70, 1.10 + nod)]
    d.polygon(head, fill=fill)
    d.polygon([P(0.66, 1.26 + nod), P(0.70, 1.38 + nod), P(0.73, 1.26 + nod)], fill=fill)   # ear
    for j in range(7):   # mane
        u = j / 6; x, y = 0.40 + 0.30 * u, 0.88 + 0.36 * u + nod * u
        d.line([P(x, y), P(x - 0.10, y - 0.02 + 0.03 * math.sin(phase * 3 + j))], fill=fill, width=max(2, int(h * 0.025)))
    tail = [P(-0.62, 0.74)]
    for j in range(1, 6):
        u = j / 5; tail.append(P(-0.62 - 0.25 * u, 0.74 - 0.30 * u + 0.05 * math.sin(phase * 2 + u * 3)))
    d.line(tail, fill=fill, width=max(3, int(h * 0.06)), joint="curve")
    w = max(3, int(h * 0.07))
    legs = [(0.40, 0.0), (0.30, math.pi), (-0.45, math.pi * 0.5), (-0.55, math.pi * 1.5)]
    for k, (lx, ph) in enumerate(legs):
        front = k < 2
        if mode == "run": sw = math.sin(phase + ph); a1 = 0.55 * sw; a2 = 0.7 * max(0, -math.cos(phase + ph)) * (1 if front else -1)
        elif mode == "calm": sw = math.sin(phase * 0.5 + ph); a1 = 0.18 * sw; a2 = 0.25 * max(0, sw) * (1 if front else -1)
        else: a1, a2 = 0.0, 0.0
        if front and rear > 0: a1, a2 = -0.9 * rear + 0.3 * math.sin(phase * 3 + ph) * rear, 1.4 * rear
        top = (lx, 0.55); kx = top[0] + 0.26 * math.sin(a1); ky = top[1] - 0.26 * math.cos(a1)
        fx = kx + 0.28 * math.sin(a1 + a2); fy = ky - 0.28 * math.cos(a1 + a2)
        fy = max(0.0, fy) if rear == 0 else fy
        d.line([P(*top), P(kx, ky)], fill=fill, width=int(w * 1.5), joint="curve")
        d.line([P(kx, ky), P(fx, fy)], fill=fill, width=w, joint="curve")
        hx_, hy_ = P(fx, fy); d.ellipse((hx_ - w * 0.7, hy_ - w * 0.5, hx_ + w * 0.7, hy_ + w * 0.3), fill=fill)   # hoof

def horse(t, d, ot, mode="run"):
    W, H, s = L.W, L.H, S()
    img = sky("dusk", DUSK).copy()
    gy = CY() + 260 * s
    dr = ImageDraw.Draw(img)
    img = glow_dot(img, W * 0.72, gy - 380 * s, 70 * s, 0.9, (255, 220, 160))   # the sun low in the sky
    dr = ImageDraw.Draw(img)
    dr.rectangle((0, gy, W, H), fill=(54, 30, 20))
    for i in range(14):   # ground marks scroll past while it runs
        speed = 600 if mode == "run" else (120 if mode == "calm" else 0)
        x = (i * W / 7 - (ot * speed * s) % (W / 7 * 2)) % (W + 200) - 100
        dr.line((x, gy + 30 * s, x + 80 * s, gy + 30 * s), fill=(80, 48, 30), width=max(2, int(4 * s)))
    lay = Image.new("L", (W, H), 0); ld = ImageDraw.Draw(lay)
    h = 300 * s
    phase = ot * (11 if mode == "run" else 4)
    rear = 0.0
    if mode == "rear": rear = 0.75 + 0.25 * math.sin(ot * 2.3)
    bob = 10 * s * abs(math.sin(phase)) if mode == "run" else 0
    horse_shape(ld, W / 2 + 40 * s, gy - bob, h, phase, 255, mode="run" if mode == "run" else ("calm" if mode == "calm" else "stand"), rear=rear)
    if mode in ("run", "calm"):   # the owner stands in the middle with the long rein
        man(ld, W * (0.20 if L.PORTRAIT else 0.30), gy, 330 * s, 255)
        ld.line((W * (0.20 if L.PORTRAIT else 0.30) + 30 * s, gy - 230 * s, W / 2 + 40 * s + 0.85 * h, gy - 1.05 * h - bob), fill=200, width=max(1, int(3 * s)))
    img.paste(Image.new("RGB", (W, H), DARK), (0, 0), lay)
    if mode == "run":   # dust
        def dust(drr, s2):
            r = random.Random(int(ot * 8))
            for _ in range(30):
                x = W / 2 - 250 * s + r.uniform(-120, 60) * s; y = gy - r.uniform(0, 60) * s
                rr = r.uniform(6, 20) * s; drr.ellipse(((x - rr) * s2, (y - rr) * s2, (x + rr) * s2, (y + rr) * s2), fill=(120, 80, 50))
        img = L.screen(img, L.glow_layer(dust, blur=10))
    lab = {"feed": ("بدن گھوڑا ہے", "the body is a horse"), "rear": ("زیادہ کھلایا تو سرکش", "fed too much, it rears"), "calm": ("قابو میں", "tamed and steady"), "run": ("کھلاؤ اور دوڑاؤ", "feed it, and make it run")}[mode]
    img = word(img, lab[0], lab[1], W / 2, L.H * (0.10 if L.PORTRAIT else 0.10), a=min(1, t / 0.8) * min(1, max(0, (d - t) / 0.6)), size=90)
    return img

# ---------------------------------------------------------------- fear and hope: a bird of light flying on two wings
def two_wings(t, d, ot):
    W, H, s = L.W, L.H, S()
    img = sky("night3", [(0, (8, 14, 30)), (0.7, (30, 40, 70)), (1, (60, 50, 60))], stars=280, seed=13).copy()
    cx = W / 2 + 60 * s * math.sin(ot * 0.3); cy = CY() + 30 * s * math.sin(ot * 0.7)
    flap = math.sin(ot * 3.2)
    def bird(dr, s2):
        span = 360 * s
        for k in (-1, 1):
            tipy = cy - 200 * s * flap; mid = cy - 80 * s * flap
            pts = [(cx + k * 30 * s, cy - 10 * s), (cx + k * span * 0.5, mid - 30 * s), (cx + k * span, tipy), (cx + k * span * 0.8, tipy + 40 * s), (cx + k * span * 0.45, mid + 50 * s), (cx + k * 30 * s, cy + 30 * s)]
            dr.polygon([(x * s2, y * s2) for x, y in pts], fill=(255, 236, 196))
        dr.ellipse(((cx - 46 * s) * s2, (cy - 40 * s) * s2, (cx + 46 * s) * s2, (cy + 60 * s) * s2), fill=(255, 244, 220))
        dr.ellipse(((cx - 26 * s) * s2, (cy - 90 * s) * s2, (cx + 26 * s) * s2, (cy - 40 * s) * s2), fill=(255, 244, 220))
        dr.polygon([((cx - 30 * s) * s2, (cy + 50 * s) * s2), ((cx + 30 * s) * s2, (cy + 50 * s) * s2), (cx * s2, (cy + 140 * s) * s2)], fill=(255, 236, 196))
    img = L.screen(img, L.glow_layer(bird, blur=14))
    a = sm(1.5, 3, t)
    img = word(img, "خوف", "fear", cx - 330 * s, cy + 150 * s, a=a, size=80)
    img = word(img, "رجا", "hope", cx + 330 * s, cy + 150 * s, a=a, size=80)
    img = motes(img, ot, seed=29, n=40)
    return title(img, "ایمان خوف و رجا کے درمیان", t, d, size=78)

# ---------------------------------------------------------------- tasawwur-e-shaykh: his light held in the heart, then the eyes open
def tasawwur(t, d, ot):
    W, H, s = L.W, L.H, S()
    img = sky("room", WARMROOM).copy()
    mx, base, h = W / 2, CY() + 330 * s, 300 * s
    fx, fy = W / 2, CY() - 170 * s
    fa = sm(1.0, 4.0, t)
    def frame(dr, s2):
        rx, ry = 150 * s, 190 * s
        dr.ellipse(((fx - rx) * s2, (fy - ry) * s2, (fx + rx) * s2, (fy + ry) * s2), outline=col((240, 200, 110), fa), width=max(2, int(6 * s * s2)))
        sitter(dr, fx * s2, (fy + 130 * s) * s2, 230 * s * s2, col((255, 238, 200), fa))   # the shaykh: only light
    img = L.screen(img, L.glow_layer(frame, blur=10))
    img = glow_dot(img, fx, fy - 90 * s, 34 * s, fa)     # his face: hidden in light
    # a thread of light from the frame into the murid's heart
    thr = sm(4, 7, t)
    if thr > 0:
        def th(dr, s2):
            n = 30
            for i in range(n):
                u = i / n; x = lerp(fx, mx, u) + 20 * s * math.sin(u * 6 + ot * 2); y = lerp(fy + 160 * s, base - h * 0.45, u)
                if u <= thr: dr.ellipse(((x - 6 * s) * s2, (y - 6 * s) * s2, (x + 6 * s) * s2, (y + 6 * s) * s2), fill=(255, 220, 150))
        img = L.screen(img, L.glow_layer(th, blur=6))
    fig = Image.new("L", (W, H), 0); sitter(ImageDraw.Draw(fig), mx, base, h, 255)
    img.paste(Image.new("RGB", (W, H), DARK), (0, 0), fig)
    img = glow_dot(img, mx, base - h * 0.45, 18 * s * (0.5 + thr), 0.4 + 0.6 * thr)
    # the eyes open: a burst of light
    op = sm(d * 0.72, d * 0.80, t)
    if op > 0:
        def burst(dr, s2):
            for i in range(24):
                a = 2 * math.pi * i / 24 + ot * 0.1; r = 600 * s * op
                dr.polygon([(mx * s2, (base - h) * s2), ((mx + r * math.cos(a - 0.05)) * s2, (base - h + r * math.sin(a - 0.05)) * s2), ((mx + r * math.cos(a + 0.05)) * s2, (base - h + r * math.sin(a + 0.05)) * s2)], fill=col((255, 220, 160), 0.5 * (1 - 0.5 * op)))
        img = L.screen(img, L.glow_layer(burst, blur=14))
    img = motes(img, ot, seed=31, n=50)
    return title(img, "تصورِ شیخ", t, d)

# ---------------------------------------------------------------- taqwa: eat less, sleep less, speak less
def icon_bowl(dr, x, y, r, c):
    dr.chord((x - r, y - r * 0.9, x + r, y + r * 0.9), 0, 180, outline=c, width=max(2, int(r * 0.08)))
    dr.line((x - r * 1.1, y, x + r * 1.1, y), fill=c, width=max(2, int(r * 0.08)))
    for k in (-0.4, 0, 0.4): dr.arc((x + k * r - r * 0.15, y - r * 0.8, x + k * r + r * 0.15, y - r * 0.1), 200, 340, fill=c, width=max(2, int(r * 0.05)))
def icon_moon(dr, x, y, r, c):
    dr.ellipse((x - r, y - r, x + r, y + r), fill=c); dr.ellipse((x - r * 0.55, y - r * 1.05, x + r * 1.3, y + r * 0.7), fill=(0, 0, 0))
    L.star8(dr, x + r * 0.9, y - r * 0.6, r * 0.22, fill=c)
def icon_speech(dr, x, y, r, c):
    dr.rounded_rectangle((x - r, y - r * 0.7, x + r, y + r * 0.5), radius=int(r * 0.3), outline=c, width=max(2, int(r * 0.08)))
    dr.polygon([(x - r * 0.4, y + r * 0.45), (x - r * 0.65, y + r * 0.95), (x - r * 0.05, y + r * 0.45)], fill=c)
    for k in (-0.45, 0, 0.45): dr.ellipse((x + k * r - r * 0.09, y - r * 0.2, x + k * r + r * 0.09, y), fill=c)
def icon_tear(dr, x, y, r, c):
    dr.polygon([(x, y - r * 1.1), (x - r * 0.62, y + r * 0.1), (x + r * 0.62, y + r * 0.1)], fill=c)
    dr.ellipse((x - r * 0.65, y - r * 0.35, x + r * 0.65, y + r * 0.85), fill=c)

LESS = [(icon_bowl, "کم کھانا", "eat less"), (icon_moon, "کم سونا", "sleep less"), (icon_speech, "کم بولنا", "speak less"), (icon_tear, "اپنے عیبوں پر رونا", "weep over your own faults")]
def taqwa_less(t, d, ot):
    W, H, s = L.W, L.H, S()
    img = sky("night4", [(0, (8, 22, 24)), (1, (18, 40, 36))], stars=160, seed=19).copy()
    n = len(LESS); cols = 2; r = 95 * s
    gw = W * (0.40 if L.PORTRAIT else 0.24); gh = 330 * s
    for i, (fn, ur, en) in enumerate(LESS):
        a = sm(1.0 + i * d * 0.17, 2.2 + i * d * 0.17, t)
        x = W / 2 + (i % cols - 0.5) * gw; y = CY() - gh * 0.55 + (i // cols) * gh
        def f(dr, s2, fn=fn, x=x, y=y, a=a):
            fn(dr, x * s2, (y - 50 * s) * s2, r * s2 * (0.9 + 0.1 * a), col((255, 220, 150), a))
        img = L.screen(img, L.glow_layer(f, blur=8, half=False))
        img = word(img, ur, en, x, y + 110 * s, a=a, size=60, en_size=30)
    img = motes(img, ot, seed=37, n=40)
    return title(img, "تقویٰ", t, d)

# ---------------------------------------------------------------- the Sufi is the son of time: an hourglass
def hourglass(t, d, ot):
    W, H, s = L.W, L.H, S()
    img = sky("night5", [(0, (10, 10, 24)), (1, (34, 28, 40))], stars=220, seed=41).copy()
    cx, cy, hh, hw = W / 2, CY(), 290 * s, 140 * s
    lay = Image.new("RGB", (W, H)); dr = ImageDraw.Draw(lay)
    gold = (230, 190, 110)
    for k in (-1, 1): dr.rounded_rectangle((cx - hw * 1.2, cy + k * hh - 18 * s, cx + hw * 1.2, cy + k * hh + 18 * s), radius=int(8 * s), fill=gold)
    for k in (-1, 1): dr.line((cx + k * hw * 1.1, cy - hh, cx + k * hw * 1.1, cy + hh), fill=gold, width=max(2, int(10 * s)))
    glass = [(cx - hw, cy - hh + 18 * s), (cx + hw, cy - hh + 18 * s), (cx + 14 * s, cy), (cx + hw, cy + hh - 18 * s), (cx - hw, cy + hh - 18 * s), (cx - 14 * s, cy)]
    dr.line(glass + glass[:1], fill=(200, 210, 230), width=max(2, int(4 * s)))
    f = (ot * 0.02) % 1.0   # sand runs, slowly
    top = hh * 0.8 * (1 - f) ** 0.5
    dr.polygon([(cx - hw * (top / hh) * 0.9, cy - top), (cx + hw * (top / hh) * 0.9, cy - top), (cx, cy - 6 * s)], fill=(240, 200, 120))
    bot = hh * 0.75 * f ** 0.5
    dr.polygon([(cx - hw * 0.9, cy + hh - 20 * s), (cx + hw * 0.9, cy + hh - 20 * s), (cx + hw * 0.9 * (1 - bot / hh * 0.4), cy + hh - 20 * s - bot * 0.5), (cx, cy + hh - 20 * s - bot), (cx - hw * 0.9 * (1 - bot / hh * 0.4), cy + hh - 20 * s - bot * 0.5)], fill=(240, 200, 120))
    dr.line((cx, cy, cx, cy + hh - 20 * s - bot), fill=(250, 214, 140), width=max(2, int(4 * s)))
    img = L.screen(img, lay)
    img = glow_dot(img, cx, cy, 18 * s, 0.9 + 0.1 * math.sin(ot * 4))     # this moment
    side = W * (0.34 if L.PORTRAIT else 0.30)
    a1, a2, a3 = sm(1.5, 3, t), sm(3, 4.5, t), sm(4.5, 6, t)
    img = word(img, "ماضی گزر گیا", "the past is gone", cx - 385 * s, cy - 40 * s, a=a1 * (0.55 + 0.25 * math.sin(ot)), size=50, en_size=26)
    img = word(img, "مستقبل نامعلوم", "the future is unknown", cx + 385 * s, cy - 40 * s, a=a2 * 0.75, size=50, en_size=26)
    img = word(img, "حال", "now: what is in your hands", cx, cy + hh + 70 * s, a=a3, size=80, en_size=32)
    img = motes(img, ot, seed=43, n=30)
    return title(img, "صوفی ابن الوقت ہے", t, d, size=90)

# ---------------------------------------------------------------- tawakkul is not idleness: sowing while light comes from above
def sowing(t, d, ot):
    W, H, s = L.W, L.H, S()
    img = sky("dawn", DAWN).copy()
    gy = CY() + 200 * s
    img = glow_dot(img, W * 0.5, gy - 60 * s, 90 * s, 0.9, (255, 230, 170))
    dr = ImageDraw.Draw(img)
    dr.rectangle((0, gy, W, H), fill=(62, 44, 26))
    for i in range(7): dr.line((0, gy + (i + 1) * 40 * s, W, gy + (i + 1) * 40 * s), fill=(80, 58, 34), width=max(1, int(3 * s)))
    walk = (t * 40 * s) % (W * 0.7)
    px = W * 0.12 + walk
    lay = Image.new("L", (W, H), 0); ld = ImageDraw.Draw(lay)
    man(ld, px, gy + 10 * s, 330 * s, 255)
    arm = math.sin(ot * 2.4)
    ld.line((px + 20 * s, gy - 230 * s, px + 90 * s, gy - 230 * s - 60 * s * arm), fill=255, width=max(3, int(16 * s)))
    img.paste(Image.new("RGB", (W, H), DARK), (0, 0), lay)
    # sprouts behind him, growing in the light
    img = ray(img, W * 0.5, 0, 160 * s, 0.6)
    def sprouts(drr, s2):
        for i in range(24):
            x = W * 0.06 + i * W * 0.035
            if x > px - 40 * s: continue
            g = min(1, (px - x) / (W * 0.25)); hh2 = 70 * s * g
            drr.line((x * s2, (gy + 30 * s) * s2, x * s2, (gy + 30 * s - hh2) * s2), fill=(120, 200, 90), width=max(1, int(5 * s * s2)))
            drr.ellipse(((x - 14 * s * g) * s2, (gy + 30 * s - hh2 - 10 * s) * s2, (x) * s2, (gy + 30 * s - hh2 + 4 * s) * s2), fill=(140, 220, 100))
            drr.ellipse(((x) * s2, (gy + 30 * s - hh2 - 14 * s) * s2, (x + 14 * s * g) * s2, (gy + 30 * s - hh2) * s2), fill=(140, 220, 100))
        r = random.Random(int(ot * 6))
        for _ in range(10):   # seeds in the air
            u = r.random(); x = px + 90 * s + u * 140 * s; y = gy - 280 * s + u * u * 300 * s
            drr.ellipse(((x - 5 * s) * s2, (y - 5 * s) * s2, (x + 5 * s) * s2, (y + 5 * s) * s2), fill=(255, 220, 140))
    img = L.screen(img, L.glow_layer(sprouts, blur=3, half=False))
    return title(img, "توکل", t, d)

# ---------------------------------------------------------------- istikhara: hands raised, peace comes down to the heart
def dua(t, d, ot):
    W, H, s = L.W, L.H, S()
    img = sky("night", NIGHT, stars=260).copy()
    cx, base, h = W / 2, CY() + 300 * s, 380 * s
    p = sm(2, d * 0.7, t)
    img = ray(img, cx, 0, 80 * s, 0.2 + 0.6 * p)
    def drops(dr, s2):   # light coming down
        for i in range(14):
            y = (ot * 120 * s + i * 90 * s) % (base - h) ; x = cx + 40 * s * math.sin(i * 1.7)
            dr.ellipse(((x - 6 * s) * s2, (y - 6 * s) * s2, (x + 6 * s) * s2, (y + 6 * s) * s2), fill=col((255, 236, 190), p))
    img = L.screen(img, L.glow_layer(drops, blur=6))
    fig = Image.new("L", (W, H), 0); kneeling(ImageDraw.Draw(fig), cx, base, h, 255, hands_up=1.0)
    img.paste(Image.new("RGB", (W, H), (12, 10, 14)), (0, 0), fig)
    img = glow_dot(img, cx, base - h * 0.42, 22 * s * (0.6 + p), 0.3 + 0.7 * p)
    from scenes_c import lantern
    img = L.screen(img, L.glow_layer(lambda dr, s2: lantern(dr, s2, W * 0.80, H * 0.06, L.U * 0.6, ot), blur=10))
    img = word(img, "اطمینانِ قلب", "peace in the heart", cx, base + 100 * s, a=sm(d * 0.6, d * 0.7, t), size=64, en_size=30)
    img = motes(img, ot, seed=47, n=40)
    return title(img, "توکل" if ot < 500 else "استخارہ", t, d)

# ---------------------------------------------------------------- a night of prayer, then the dawn and the two rakats of fard
def night_dawn(t, d, ot, mode="night"):
    W, H, s = L.W, L.H, S()
    if mode == "night": img = sky("night", NIGHT, stars=260).copy()
    else: img = sky("dawn", DAWN).copy()
    gy = CY() + 260 * s
    dr = ImageDraw.Draw(img)
    if mode == "night":
        mx = W * (0.8 - 0.5 * min(1, t / max(1, d))); my = H * 0.12 + 60 * s * math.sin(min(1, t / max(1, d)) * math.pi)
        from scenes_b import moon
        img = L.screen(img, L.glow_layer(lambda drr, s2: moon(drr, s2, mx, my, 50 * s), blur=8))
    else:
        rise = sm(0, d * 0.5, t); sy = gy - 40 * s - 200 * s * rise
        img = glow_dot(img, W * 0.5, sy, 110 * s, 0.6 + 0.4 * rise, (255, 220, 150))
    dr = ImageDraw.Draw(img)
    dr.rectangle((0, gy, W, H), fill=(18, 16, 22) if mode == "night" else (60, 40, 30))
    lay = Image.new("L", (W, H), 0); ld = ImageDraw.Draw(lay)
    L.masjid(ld, W / 2, gy, 0.55 * s, 120)
    cyc = (ot * 0.25) % 1.0   # standing, bowing, prostrating
    px = W * 0.5; h = 320 * s
    if cyc < 0.45: man(ld, px, gy + 120 * s, h, 255)
    elif cyc < 0.65:
        ld.ellipse((px + h * 0.18, gy + 120 * s - h * 0.62, px + h * 0.38, gy + 120 * s - h * 0.42), fill=255)
        ld.polygon([(px - h * 0.17, gy + 120 * s), (px - h * 0.13, gy + 120 * s - h * 0.55), (px + h * 0.25, gy + 120 * s - h * 0.6), (px + h * 0.25, gy + 120 * s - h * 0.45), (px + h * 0.05, gy + 120 * s - h * 0.45), (px + h * 0.17, gy + 120 * s)], fill=255)
    else:
        ld.ellipse((px + h * 0.25, gy + 120 * s - h * 0.18, px + h * 0.43, gy + 120 * s), fill=255)
        ld.polygon([(px - h * 0.25, gy + 120 * s), (px - h * 0.2, gy + 120 * s - h * 0.35), (px + h * 0.28, gy + 120 * s - h * 0.12), (px + h * 0.3, gy + 120 * s)], fill=255)
    img.paste(Image.new("RGB", (W, H), DARK if mode != "night" else (44, 46, 66)), (0, 0), lay)
    if mode == "night":
        k = int(min(100, t / max(1, d) * 110))
        img = word(img, "", "%d rakats of the night" % k, W / 2, H * (0.16 if L.PORTRAIT else 0.18), a=sm(1, 2, t), en_size=48)
        img = motes(img, ot, seed=53, n=30, color=(200, 210, 255))
        return title(img, "شب بیداری", t, d, size=90)
    img = ray(img, W / 2, 0, 120 * s, 0.6)
    img = word(img, "دو رکعت فرض", "two rakats of fard: by Allah's command", W / 2, H * (0.16 if L.PORTRAIT else 0.18), a=sm(1, 2, t), size=80, en_size=34)
    return motes(img, ot, seed=59, n=40)

# ---------------------------------------------------------------- sabr, tasleem, raza: a figure under the storm
def patience(t, d, ot, stage="sabr"):
    W, H, s = L.W, L.H, S()
    img = sky("storm", [(0, (20, 24, 34)), (0.6, (50, 56, 66)), (1, (24, 24, 28))]).copy()
    cx, gy = W / 2, CY() + 300 * s
    calm = {"sabr": 0.0, "tasleem": 0.5, "raza": 1.0}[stage]
    cl = Image.new("L", (W, H), 0); cd = ImageDraw.Draw(cl)   # storm cloud
    for i in range(9):
        x = cx + (i - 4) * 110 * s + 20 * s * math.sin(ot * 0.3 + i); y = H * 0.16 + 30 * s * math.sin(i * 1.3)
        r = 130 * s; cd.ellipse((x - r, y - r * 0.7, x + r, y + r * 0.7), fill=int(220 * (1 - 0.7 * calm)))
    img = Image.composite(Image.new("RGB", (W, H), (36, 38, 46)), img, cl.filter(ImageFilter.GaussianBlur(24 * s)))
    def rain(dr, s2):
        r = random.Random(3)
        for i in range(int(140 * (1 - 0.8 * calm))):
            x = r.uniform(0, W); y0 = (r.uniform(0, H) + ot * 900 * s) % (H * 0.9)
            dr.line((x * s2, y0 * s2, (x - 8 * s) * s2, (y0 + 40 * s) * s2), fill=(150, 170, 200), width=max(1, int(2 * s2)))
    img = L.screen(img, L.glow_layer(rain, blur=1))
    if calm > 0: img = ray(img, cx, 0, 110 * s, calm)
    lay = Image.new("L", (W, H), 0); man(ImageDraw.Draw(lay), cx, gy, 380 * s, 255)
    img.paste(Image.new("RGB", (W, H), (10, 10, 14)), (0, 0), lay)
    img = glow_dot(img, cx, gy - 380 * s * 0.6, 20 * s * (1 + calm), 0.6 + 0.4 * calm)
    lab = {"sabr": ("صبر", "patience: bearing it, though the heart aches"), "tasleem": ("تسلیم", "surrender: no complaint in the heart"), "raza": ("رضا", "contentment: pleased with what He sends")}[stage]
    img = word(img, lab[0], lab[1], cx, gy + 90 * s, a=min(1, t / 0.8), size=96, en_size=30)
    return motes(img, ot, seed=61, n=int(20 + 40 * calm))

# ---------------------------------------------------------------- the straight path is the shortest
def straight_path(t, d, ot):
    W, H, s = L.W, L.H, S()
    img = sky("night6", [(0, (8, 12, 26)), (1, (24, 30, 40))], stars=200, seed=67).copy()
    top, bot = CY() - 360 * s, CY() + 330 * s
    gx = W / 2
    img = glow_dot(img, gx, top, 50 * s, 1.0)       # the destination
    paths = []
    for k in range(6):
        r = random.Random(k); amp = r.uniform(120, 300) * s * (1 if k % 2 else -1); fr = r.uniform(1.5, 3.2)
        x0 = gx + (k - 2.5) * 110 * s
        paths.append([(x0 + amp * math.sin(u * fr * math.pi) * (1 - u) + (gx - x0) * u, lerp(bot, top, u)) for u in np.linspace(0, 1, 60)])
    def draw(dr, s2):
        for pth in paths: dr.line([(x * s2, y * s2) for x, y in pth], fill=(120, 100, 70), width=max(1, int(3 * s2)))
        dr.line((gx * s2, bot * s2, gx * s2, top * s2), fill=(255, 230, 170), width=max(2, int(8 * s * s2)))
    img = L.screen(img, L.glow_layer(draw, blur=6))
    u = (t * 0.12) % 1.3
    img = glow_dot(img, gx, lerp(bot, top, min(1, u)), 16 * s, 1.0)     # walks the straight path, arrives first
    for k, pth in enumerate(paths[:3]):
        i = int(min(59, (t * 0.05 + k * 0.1) % 1.0 * 59)); x, y = pth[i]
        img = glow_dot(img, x, y, 10 * s, 0.6, (200, 180, 150))
    img = word(img, "صراطِ مستقیم", "the straight path is the shortest", gx, bot + 80 * s, a=sm(1, 2.5, t), size=80, en_size=32)
    return img

# ---------------------------------------------------------------- the nafs: a snake numb with cold; warm it and it rises to bite
def snake(t, d, ot, mode="cold"):
    W, H, s = L.W, L.H, S()
    warm = 0.0 if mode == "cold" else sm(0, 3, t)
    img = sky("snow", [(0, (20, 30, 50)), (1, (60, 80, 100))]).copy()
    if warm > 0: img = Image.blend(img, sky("ember", [(0, (40, 16, 10)), (1, (120, 50, 20))]), warm)
    cx, gy = W / 2, CY() + 260 * s
    dr = ImageDraw.Draw(img); dr.rectangle((0, gy, W, H), fill=(200, 210, 225) if warm < 0.5 else (70, 40, 26))
    lay = Image.new("L", (W, H), 0); ld = ImageDraw.Draw(lay); w = 46 * s
    pts = []
    for i in range(80):   # coil
        a = i / 80 * 5.2 * math.pi; r = 40 * s + i * 2.6 * s
        pts.append((cx + r * math.cos(a), gy - 40 * s + r * 0.35 * math.sin(a)))
    ld.line(pts, fill=255, width=int(w), joint="curve")
    rise = warm * (0.8 + 0.2 * math.sin(ot * 3))
    hx, hy = pts[-1]
    neck = [(hx, hy), (hx + 30 * s, hy - 160 * s * rise), (hx + 20 * s, hy - 320 * s * rise)]
    ld.line(neck, fill=255, width=int(w), joint="curve")
    nx, ny = neck[-1]
    hood = 90 * s * (0.4 + 0.6 * warm)
    ld.ellipse((nx - hood, ny - hood * 1.2, nx + hood, ny + hood * 0.6), fill=255)
    ld.ellipse((nx - 30 * s, ny - hood * 1.4, nx + 30 * s, ny - hood * 0.8), fill=255)
    img.paste(Image.new("RGB", (W, H), (14, 16, 14)), (0, 0), lay)
    if warm < 0.5:
        img = L.screen(img, L.glow_layer(lambda dr2, s2: L.draw_motes(dr2, ot, s2, seed=71, n=90, color=(230, 240, 255), rise=False), blur=3))
    lab = ("سردی سے سُن پڑا ہے", "numb with cold, it looks dead") if mode == "cold" else ("گرمی پہنچی تو پھن پھیلا کر اٹھا", "warmth reached it: it rises to bite")
    img = word(img, lab[0], lab[1], cx, H * (0.10 if L.PORTRAIT else 0.10), a=min(1, t / 0.8), size=70, en_size=32)
    return img

# ---------------------------------------------------------------- Shaytan: the dog at the door of the Divine court
def dog_gate(t, d, ot):
    W, H, s = L.W, L.H, S()
    img = sky("night", NIGHT, stars=260).copy()
    gx, gy = W / 2, CY() + 250 * s
    call = sm(d * 0.55, d * 0.62, t)      # the traveller calls to the Master
    def gate(dr, s2):
        w, h = 260 * s, 560 * s
        dr.rectangle(((gx - w) * s2, (gy - h) * s2, (gx + w) * s2, gy * s2), fill=(120 + int(100 * call), 100 + int(90 * call), 60 + int(60 * call)))
        dr.ellipse(((gx - w) * s2, (gy - h - w) * s2, (gx + w) * s2, (gy - h + w) * s2), fill=(120 + int(100 * call), 100 + int(90 * call), 60 + int(60 * call)))
    img = L.screen(img, L.glow_layer(gate, blur=18, strength=0.7 + 0.5 * call))
    dr = ImageDraw.Draw(img); dr.rectangle((0, gy, W, H), fill=(20, 18, 22))
    lay = Image.new("L", (W, H), 0); ld = ImageDraw.Draw(lay)
    dx, dy, u = gx + 170 * s, gy, 170 * s           # the dog, sitting by the door, facing left (towards the traveller)
    bark = (1 - call) * max(0, math.sin(ot * 7)) if call < 0.9 else 0
    ld.ellipse((dx - u * 0.10, dy - u * 0.62, dx + u * 0.62, dy), fill=255)                         # haunch
    ld.polygon([(dx - u * 0.05, dy - u * 0.55), (dx - u * 0.30, dy - u * 1.15), (dx - u * 0.02, dy - u * 1.22), (dx + u * 0.35, dy - u * 0.50)], fill=255)   # chest and back
    ld.polygon([(dx - u * 0.30, dy - u * 1.05), (dx - u * 0.38, dy - u * 1.40), (dx - u * 0.10, dy - u * 1.45), (dx - u * 0.02, dy - u * 1.15)], fill=255)   # neck
    hy = dy - u * 1.48 + u * 0.10 * call
    ld.ellipse((dx - u * 0.42, hy - u * 0.16, dx - u * 0.08, hy + u * 0.16), fill=255)            # skull
    ld.polygon([(dx - u * 0.36, hy - u * 0.06), (dx - u * 0.80, hy + u * 0.02), (dx - u * 0.78, hy + u * 0.10), (dx - u * 0.36, hy + u * 0.10)], fill=255)   # upper snout
    ld.polygon([(dx - u * 0.36, hy + u * 0.10), (dx - u * 0.74, hy + u * 0.12 + u * 0.16 * bark), (dx - u * 0.70, hy + u * 0.18 + u * 0.16 * bark), (dx - u * 0.36, hy + u * 0.18)], fill=255)   # jaw
    ld.polygon([(dx - u * 0.22, hy - u * 0.10), (dx - u * 0.14, hy - u * 0.42), (dx - u * 0.06, hy - u * 0.08)], fill=255)   # ear
    for k in (-0.26, -0.10): ld.rectangle((dx + k * u, dy - u * 0.75, dx + k * u + u * 0.09, dy), fill=255)   # front legs
    ld.ellipse((dx - u * 0.34, dy - u * 0.05, dx - u * 0.14, dy + u * 0.02), fill=255)
    ld.line([(dx + u * 0.58, dy - u * 0.12), (dx + u * 0.85, dy - u * 0.40 + u * 0.08 * math.sin(ot * 6))], fill=255, width=int(u * 0.08))   # tail
    man(ld, W * (0.18 if L.PORTRAIT else 0.28), gy, 300 * s, 255)            # the traveller
    img.paste(Image.new("RGB", (W, H), (8, 8, 10)), (0, 0), lay)
    if bark > 0.3:   # barking arcs
        def arcs(drr, s2):
            for k in range(3):
                r = (40 + k * 40) * s
                drr.arc(((dx - u * 1.1 - r) * s2, (hy - r) * s2, (dx - u * 1.1 + r) * s2, (hy + r) * s2), 140, 220, fill=(200, 200, 210), width=max(1, int(4 * s2)))
        img = L.screen(img, L.glow_layer(arcs, blur=2))
    if call > 0: img = ray(img, gx, 0, 140 * s, call)
    img = word(img, "أعوذ بالله", "call out to its Master", gx, H * (0.10 if L.PORTRAIT else 0.10), a=call, size=90, en_size=34)
    return img

# ---------------------------------------------------------------- open book with the title (for "now we read page ...")
def book_title(t, d, ot, ur="نظام العمل فقراء"):
    W, H, s = L.W, L.H, S()
    img = sky("room", WARMROOM).copy()
    cx, cy = W / 2, CY() + 60 * s
    open_ = sm(0.3, 2.0, t)
    lay = Image.new("RGB", (W, H)); dr = ImageDraw.Draw(lay)
    pw, ph = 330 * s, 440 * s
    for k in (-1, 1):
        x2 = cx + k * pw * open_
        dr.polygon([(cx, cy - ph / 2), (x2, cy - ph / 2 - 20 * s * open_), (x2, cy + ph / 2 - 20 * s * open_), (cx, cy + ph / 2)], fill=(232, 220, 190))
        for i in range(10):
            y = cy - ph / 2 + 60 * s + i * 34 * s
            dr.line((cx + k * 30 * s, y, cx + k * (pw - 40 * s) * open_, y - 12 * s * open_), fill=(150, 130, 100), width=max(1, int(3 * s)))
    img = L.screen(img, lay.filter(ImageFilter.GaussianBlur(1)))
    img = glow_dot(img, cx, cy - ph / 2 - 40 * s, 30 * s, open_)
    img = motes(img, ot, seed=73, n=40)
    return title(img, ur, t, d, size=96)


# ---------------------------------------------------------------- as if newly born: a swaddled newborn of light
def newborn(t, d, ot):
    W, H, s = L.W, L.H, S()
    img = sky("night", NIGHT, stars=260).copy()
    cx, cy = W / 2, CY()
    a = sm(0.5, 3.0, t)
    img = ray(img, cx, 0, 120 * s, 0.4 + 0.5 * a)
    def baby(dr, s2):
        for k, aa in [(1.5, 0.12), (1.2, 0.3)]:
            dr.ellipse(((cx - 260 * s * k) * s2, (cy - 260 * s * k) * s2, (cx + 260 * s * k) * s2, (cy + 260 * s * k) * s2), fill=col((255, 230, 190), aa * a))
        dr.rounded_rectangle(((cx - 150 * s) * s2, (cy - 60 * s) * s2, (cx + 150 * s) * s2, (cy + 90 * s) * s2), radius=int(75 * s * s2), fill=col((255, 250, 240), a))
        dr.ellipse(((cx - 230 * s) * s2, (cy - 60 * s) * s2, (cx - 110 * s) * s2, (cy + 60 * s) * s2), fill=col((255, 244, 228), a))
        for i in range(5):
            y = cy - 30 * s + i * 26 * s
            dr.arc(((cx - 120 * s) * s2, (y - 30 * s) * s2, (cx + 140 * s) * s2, (y + 30 * s) * s2), 10, 170, fill=col((230, 210, 180), a), width=max(1, int(3 * s * s2)))
    img = L.screen(img, L.glow_layer(baby, blur=14))
    img = motes(img, ot, seed=79, n=60)
    return title(img, "گناہوں سے پاک", t, d, size=96)

# ---------------------------------------------------------------- the hidden enemy: dark smoke around a man, gone when he seeks refuge
def enemy(t, d, ot):
    W, H, s = L.W, L.H, S()
    img = sky("night", NIGHT, stars=260).copy()
    cx, gy = W / 2, CY() + 280 * s
    flee = sm(d * 0.78, d * 0.9, t)
    sm_l = Image.new("L", (W // 2, H // 2), 0); sd = ImageDraw.Draw(sm_l)
    for i in range(14):
        a = ot * 0.6 + i * 0.45; r = (170 + 40 * math.sin(ot + i)) * s + 900 * s * flee
        x = cx + r * math.cos(a); y = gy - 260 * s + r * 0.6 * math.sin(a)
        rr = 70 * s * (1 - 0.6 * flee)
        sd.ellipse(((x - rr) / 2, (y - rr) / 2, (x + rr) / 2, (y + rr) / 2), fill=int(230 * (1 - flee)))
    sm_l = sm_l.filter(ImageFilter.GaussianBlur(26 * s)).resize((W, H))
    img = Image.composite(Image.new("RGB", (W, H), (6, 4, 8)), img, sm_l)
    if flee > 0: img = ray(img, cx, 0, 110 * s, flee)
    lay = Image.new("L", (W, H), 0); man(ImageDraw.Draw(lay), cx, gy, 380 * s, 255)
    img.paste(Image.new("RGB", (W, H), (12, 10, 14)), (0, 0), lay)
    img = glow_dot(img, cx, gy - 380 * s * 0.6, 18 * s, 0.3 + 0.7 * flee)
    img = word(img, "قُل أعوذ برب الناس", "", cx, gy + 90 * s, a=flee, size=72)
    return title(img, "شیطان کھلا دشمن ہے", t, d, size=86)

SCENES = {
    "tawbah": tawbah, "heart": heart, "four_steps": four_steps,
    "horse_run": functools.partial(horse, mode="run"), "horse_rear": functools.partial(horse, mode="rear"),
    "horse_calm": functools.partial(horse, mode="calm"), "horse_feed": functools.partial(horse, mode="feed"),
    "two_wings": two_wings, "tasawwur": tasawwur, "taqwa_less": taqwa_less, "hourglass": hourglass, "sowing": sowing,
    "dua": dua, "night_vigil": functools.partial(night_dawn, mode="night"), "dawn_fard": functools.partial(night_dawn, mode="dawn"),
    "sabr": functools.partial(patience, stage="sabr"), "tasleem": functools.partial(patience, stage="tasleem"), "raza": functools.partial(patience, stage="raza"),
    "straight_path": straight_path, "snake_cold": functools.partial(snake, mode="cold"), "snake_warm": functools.partial(snake, mode="warm"),
    "dog_gate": dog_gate, "newborn": newborn, "enemy": enemy, "book_naf": book_title,
}
