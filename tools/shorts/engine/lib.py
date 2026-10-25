"""Shared drawing toolkit. Everything is sized from U = min(W, H) / 1080 so scenes work at 16:9 and 9:16."""
import math, random, functools, os, re
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

import cfg
SD = cfg.WORK + "/"
FD = cfg.FONTS + "/"
URDU_B = FD + "fontsource-noto-nastaliq-urdu-5.3.0/package/files/noto-nastaliq-urdu-arabic-700-normal.woff"
URDU_R = FD + "fontsource-noto-nastaliq-urdu-5.3.0/package/files/noto-nastaliq-urdu-arabic-400-normal.woff"
SERIF = FD + "fontsource-cormorant-garamond-5.3.0/package/files/cormorant-garamond-latin-600-normal.woff"
BOLD = FD + "montserrat/package/files/montserrat-latin-900-normal.woff"
GOLD = (240, 200, 110); WARM = (255, 225, 160); IVORY = (236, 228, 210)

W = H = 0; U = 1.0; PORTRAIT = False
def setup(w, h):
    global W, H, U, PORTRAIT
    W, H = w, h; U = min(w, h) / 1080; PORTRAIT = h > w

def ease(x): x = min(1.0, max(0.0, x)); return 0.5 - 0.5 * math.cos(math.pi * x)
def sm(a, b, t): return ease((t - a) / (b - a)) if b != a else float(t >= a)
def lerp(a, b, f): return a + (b - a) * f

@functools.lru_cache(maxsize=64)
def font(path, size, raqm=False):
    return ImageFont.truetype(path, max(6, int(size)), layout_engine=ImageFont.Layout.RAQM if raqm else ImageFont.Layout.BASIC)

def vgrad(stops, w=None, h=None):
    """stops: [(pos 0..1, (r,g,b)), ...] vertical gradient as RGB image."""
    w = w or W; h = h or H
    y = np.linspace(0, 1, h)
    cols = np.zeros((h, 3))
    for (a, ca), (b, cb) in zip(stops, stops[1:]):
        m = (y >= a) & (y <= b)
        f = ((y[m] - a) / max(1e-6, b - a))[:, None]
        cols[m] = np.array(ca) + (np.array(cb) - np.array(ca)) * f
    return Image.fromarray(np.repeat(cols[:, None, :], w, axis=1).astype(np.uint8))

def rgrad(cx, cy, inner, outer, radius, w=None, h=None):
    w = w or W; h = h or H
    yy, xx = np.mgrid[0:h, 0:w]
    t = np.clip(np.hypot(xx - cx, yy - cy) / radius, 0, 1)[..., None]
    return Image.fromarray((np.array(inner) + (np.array(outer) - np.array(inner)) * t).astype(np.uint8))

def screen(base, layer): return ImageChops.screen(base, layer)
def add(base, layer): return ImageChops.add(base, layer)

def glow_layer(draw_fn, blur=6, half=True, strength=1.0):
    """draw_fn(draw, scale) draws bright shapes on black; returns a glowing RGB layer at full size."""
    s = 0.5 if half else 1.0
    L = Image.new("RGB", (int(W * s), int(H * s)), (0, 0, 0))
    draw_fn(ImageDraw.Draw(L), s)
    g = L.filter(ImageFilter.GaussianBlur(max(1, blur * U * s)))
    out = add(g, L.filter(ImageFilter.GaussianBlur(max(0.6, 1.2 * s))))
    if strength != 1.0: out = Image.eval(out, lambda v: min(255, int(v * strength)))
    return out.resize((W, H), Image.BILINEAR) if half else out

def col(c, a): return tuple(int(v * max(0, min(1, a))) for v in c)

R = random.Random(1)
@functools.lru_cache(maxsize=8)
def starfield(seed, n, ymax=1.0):
    r = random.Random(seed)
    return [(r.random(), r.random() * ymax, r.choice([1, 1, 1, 2, 2, 3]), r.uniform(0.3, 1.0), r.uniform(0, 6.28)) for _ in range(n)]
def draw_stars(img, t, seed=1, n=300, ymax=1.0, tw=True):
    d = ImageDraw.Draw(img)
    for x, y, s, a, ph in starfield(seed, n, ymax):
        aa = a * (0.6 + 0.4 * math.sin(t * 2 + ph)) if tw else a
        sz = s * U
        d.ellipse((x * W - sz, y * H - sz, x * W + sz, y * H + sz), fill=col((255, 244, 220), aa))
    return img

@functools.lru_cache(maxsize=16)
def motes(seed, n):
    r = random.Random(seed)
    return [(r.uniform(0, 1), r.uniform(0, 1.2), r.uniform(0.015, 0.05), r.choice([2, 3, 4, 5]), r.uniform(0, 6.28), r.uniform(0.6, 1.6)) for _ in range(n)]
def draw_motes(d, t, s=0.5, seed=3, n=70, color=WARM, rise=True):
    for x0, y0, sp, sz, ph, tw in motes(seed, n):
        y = ((y0 - sp * t) % 1.2 - 0.1) if rise else ((y0 + sp * t) % 1.2 - 0.1)
        x = x0 + 0.02 * math.sin(t * 0.5 + ph)
        a = 0.35 + 0.45 * (0.5 + 0.5 * math.sin(t * tw * 2 + ph))
        r_ = sz * U * s
        d.ellipse((x * W * s - r_, y * H * s - r_, x * W * s + r_, y * H * s + r_), fill=col(color, a))

# ---------------- text ----------------
@functools.lru_cache(maxsize=256)
def urdu(text, size, color=(250, 222, 150), stroke=True, path=URDU_B):
    f = font(path, size * U, True)
    tmp = ImageDraw.Draw(Image.new("L", (1, 1)))
    bb = tmp.textbbox((0, 0), text, font=f, direction="rtl")
    pad = int(40 * U)
    im = Image.new("RGBA", (bb[2] - bb[0] + 2 * pad, bb[3] - bb[1] + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    kw = dict(stroke_width=max(2, int(4 * U)), stroke_fill=(40, 20, 0, 255)) if stroke else {}
    d.text((pad - bb[0], pad - bb[1]), text, font=f, fill=color + (255,), direction="rtl", **kw)
    g = Image.new("RGBA", im.size, (255, 200, 110, 0)); g.putalpha(im.getchannel("A").filter(ImageFilter.GaussianBlur(18 * U)).point(lambda v: int(v * 0.8)))
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); sh.putalpha(im.getchannel("A").filter(ImageFilter.GaussianBlur(10 * U)).point(lambda v: int(v * 0.7)))
    return Image.alpha_composite(Image.alpha_composite(sh, g), im)

def paste_center(img, ov, cx, cy, alpha=1.0, scale=1.0):
    if alpha <= 0.01: return img
    if abs(scale - 1) > 0.005: ov = ov.resize((max(1, int(ov.width * scale)), max(1, int(ov.height * scale))), Image.BICUBIC)
    if alpha < 0.999:
        ov = ov.copy(); ov.putalpha(ov.getchannel("A").point(lambda v: int(v * alpha)))
    base = img.convert("RGBA"); base.alpha_composite(ov, (int(cx - ov.width / 2), int(cy - ov.height / 2)))
    return base.convert("RGB")

@functools.lru_cache(maxsize=128)
def serif_text(text, size, color=IVORY, tracking=0):
    f = font(SERIF, size * U)
    tmp = ImageDraw.Draw(Image.new("L", (1, 1)))
    w = int(sum(tmp.textlength(c, font=f) for c in text) + tracking * U * (len(text) - 1)) + int(40 * U)
    h = int(size * U * 1.6)
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    x = 20 * U
    for c in text:
        d.text((x, h * 0.1), c, font=f, fill=color + (255,), stroke_width=max(1, int(2 * U)), stroke_fill=(0, 0, 0, 160))
        x += tmp.textlength(c, font=f) + tracking * U
    return im

# ---------------- captions ----------------
CAP = None
def cap_font(): return font(BOLD, (70 if not PORTRAIT else 84) * U)
@functools.lru_cache(maxsize=512)
def caption_img(words):
    """words: tuple of tokens; '*x*' gold; tokens containing ﷺ are drawn with the Urdu font."""
    f = cap_font(); fu = font(URDU_B, (52 if not PORTRAIT else 66) * U, True)
    tmp = ImageDraw.Draw(Image.new("L", (1, 1)))
    toks = []
    for w_ in words:
        gold = w_.startswith("*") or w_.rstrip(",.?!:\"").endswith("*")
        t_ = w_.replace("*", "")
        if "ﷺ" in t_:
            pre = t_.replace("ﷺ", "").upper()
            if pre: toks.append((pre, gold, f, tmp.textlength(pre, font=f)))
            toks.append(("ﷺ", True, fu, tmp.textlength("ﷺ", font=fu) + f.size * 0.25))
        else:
            t_ = t_.upper(); toks.append((t_, gold, f, tmp.textlength(t_, font=f)))
    sp = tmp.textlength(" ", font=f); maxw = W * (0.84 if PORTRAIT else 0.74)
    lines, cur, cw = [], [], 0
    for tk in toks:
        if cur and cw + sp + tk[3] > maxw: lines.append(cur); cur, cw = [], 0
        cur.append(tk); cw += (sp if len(cur) > 1 else 0) + tk[3]
    if cur: lines.append(cur)
    lh = int(f.size * 1.18)
    im = Image.new("RGBA", (W, lh * len(lines) + int(60 * U)), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for li, ln in enumerate(lines):
        tw = sum(x[3] for x in ln) + sp * (len(ln) - 1); x = (W - tw) / 2; y = 30 * U + li * lh
        for t_, gold, ff, ww in ln:
            yy = y - (0.18 * ff.size if ff is fu else 0)
            d.text((x, yy), t_, font=ff, fill=GOLD if gold else (255, 255, 255), stroke_width=max(3, int(6 * U)), stroke_fill=(0, 0, 0),
                   **({"direction": "rtl"} if ff is fu else {}))
            x += ww + sp
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); sh.putalpha(im.getchannel("A").filter(ImageFilter.GaussianBlur(12 * U)).point(lambda v: int(v * 0.7)))
    return Image.alpha_composite(sh, im)

def split_chunks(start, end, text, maxw=5):
    words = []
    for w_ in text.split():
        if w_.startswith("ﷺ") and words: words[-1] += w_   # keep ﷺ with the word before it
        else: words.append(w_)
    if len(words) <= maxw: groups = [words]
    else:
        groups, cur = [], []
        for w_ in words:
            cur.append(w_)
            if len(cur) >= 4 or (len(cur) >= 2 and w_.endswith((",", ".", "?", "!", ":"))): groups.append(cur); cur = []
        if cur:
            if len(cur) == 1 and groups: groups[-1] += cur
            else: groups.append(cur)
    total = sum(len(" ".join(g)) for g in groups); out, t = [], start
    for g in groups:
        dd = (end - start) * len(" ".join(g)) / total; out.append((t, t + dd, tuple(g))); t += dd
    return out

# ---------------- simple shapes ----------------
def star8(d, cx, cy, r, **kw):
    pts = []
    for i in range(16):
        a = math.pi / 8 * i - math.pi / 2; rr = r if i % 2 == 0 else r * 0.6
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, **kw)

def dome(d, cx, base, w, h, fill):
    d.ellipse((cx - w / 2, base - h, cx + w / 2, base + h * 0.25), fill=fill)
    d.polygon([(cx - w * 0.12, base - h * 0.95), (cx, base - h * 1.35), (cx + w * 0.12, base - h * 0.95)], fill=fill)
    d.line((cx, base - h * 1.35, cx, base - h * 1.6), fill=fill, width=max(2, int(w * 0.02)))

def minaret(d, cx, base, top, w, fill):
    d.rectangle((cx - w / 2, top, cx + w / 2, base), fill=fill)
    for f in (0.35, 0.65):
        y = top + (base - top) * f; d.rectangle((cx - w * 0.85, y - w * 0.18, cx + w * 0.85, y + w * 0.12), fill=fill)
    d.polygon([(cx - w * 0.6, top), (cx, top - w * 2.6), (cx + w * 0.6, top)], fill=fill)

def masjid(d, cx, base, s, fill, windows=None):
    d.rectangle((cx - 520 * s, base - 260 * s, cx + 520 * s, base + 40 * s), fill=fill)
    dome(d, cx, base - 260 * s, 460 * s, 300 * s, fill)
    for k in (-1, 1):
        dome(d, cx + k * 330 * s, base - 260 * s, 170 * s, 120 * s, fill)
        minaret(d, cx + k * 640 * s, base + 40 * s, base - 760 * s, 56 * s, fill)
    if windows:
        for i in range(-3, 4):
            x = cx + i * 120 * s
            d.rectangle((x - 26 * s, base - 170 * s, x + 26 * s, base - 50 * s), fill=windows)
            d.ellipse((x - 26 * s, base - 196 * s, x + 26 * s, base - 144 * s), fill=windows)

def person(d, cx, base, h, fill):
    """A simple, featureless standing figure silhouette."""
    r = h * 0.11
    d.ellipse((cx - r, base - h, cx + r, base - h + 2 * r), fill=fill)
    d.polygon([(cx - h * 0.17, base), (cx - h * 0.13, base - h * 0.74), (cx + h * 0.13, base - h * 0.74), (cx + h * 0.17, base)], fill=fill)

def seated(d, cx, base, h, fill):
    r = h * 0.16
    d.ellipse((cx - r, base - h, cx + r, base - h + 2 * r), fill=fill)
    d.ellipse((cx - h * 0.34, base - h * 0.66, cx + h * 0.34, base + h * 0.08), fill=fill)

def cover(im, w, h):
    rr = max(w / im.width, h / im.height)
    im = im.resize((math.ceil(im.width * rr), math.ceil(im.height * rr)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))
