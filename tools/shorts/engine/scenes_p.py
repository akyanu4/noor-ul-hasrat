"""Scenes, part P: procedural "practice demonstration" scenes, drawn frame by frame (no pictures needed).
Timeline entry: ("voice", a, b, "demo:<kind>"); the scene gets the recording time, so the action follows his words.
Event times for each demo come from the project's timeline.py: DEMOS = {"<kind>": {...}} (keys below).

  demo:hoon      a calm man in white, seated cross-legged, seen in three-quarter back view (no face at all). On each
                 "hoon" his shoulders draw in and a puff of plain dark-grey smoke (the khatra) is pushed out forcefully
                 from the chest and mouth and dissolves; between them a gentle inhale with soft gold light settling on
                 his heart. Later ("refuge" time) the same figure sits glowing under a canopy of light.
                 keys: puffs [t, ...], steps [t1, t2, t3], refuge t
  demo:tasawwur  a murid seated (back view, head bowed), prayer beads moving bead by bead; the Names
                 يَا خَلَّاقُ  يَا فَعَّالُ  يَا مُصَوِّرُ appear one by one as they are read; then the shaykh forms from light
                 as a pure white-gold silhouette (no face, the head is pure light) with a thread of light from the
                 murid's heart to it. keys: parts [{start, names [t0,t1,t2], form (a, b), thread t, steps [..],
                 beads_every, bloom}], one dict per voice segment (chosen by recording time).

Step labels (English + Urdu) are numbered; the current step is gold, earlier ones stay on, dimmer."""
import sys, math, random, functools
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import cfg, lib as L
from lib import sm, lerp
from scenes_a import cached
import scenes_a as A
sys.path.insert(0, cfg.PROJECT)
try:
    import timeline as _tl; DEMOS = getattr(_tl, "DEMOS", {})
except ImportError: DEMOS = {}

# ------------------------------------------------------------------ drawing helpers
def catmull(pts, n=10, closed=True):
    """Smooth closed curve through pts (list of (x, y))."""
    P = list(pts); out = []
    m = len(P)
    rng = range(m) if closed else range(m - 1)
    for i in rng:
        p0, p1, p2, p3 = P[(i - 1) % m], P[i], P[(i + 1) % m], P[(i + 2) % m]
        for k in range(n):
            t = k / n; t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 +
                                    (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in (0, 1)))
    return out

def background(key, light_xy=(0.72, 0.30)):
    """Soft night-teal room: stars above, warm gold light, a dark floor and a plain green mat."""
    def mk():
        W, H, U = L.W, L.H, L.U
        img = L.rgrad(W * 0.5, H * 0.42, (20, 56, 48), (4, 12, 12), max(W, H) * 0.72)
        img = L.draw_stars(img, 0, seed=71, n=int(220 * W / 1080), ymax=0.55, tw=False)
        lx, ly = W * light_xy[0], H * light_xy[1]
        warm = L.rgrad(lx, ly, (92, 72, 34), (0, 0, 0), max(W, H) * 0.55)
        img = L.screen(img, warm)
        a = np.asarray(img).astype(np.float32)                  # the floor: darker, a little warmer, from 0.63H down
        y = np.linspace(0, 1, H)[:, None, None]
        f = np.clip((y - 0.62) / 0.06, 0, 1)
        a = a * (1 - 0.45 * f) + np.array([10, 16, 14]) * 0.45 * f
        img = Image.fromarray(a.clip(0, 255).astype(np.uint8))
        return img
    return cached(("p_bg", key, light_xy), mk)

def mat(img, cx, by, w):
    """A plain prayer mat under the seated figure (an ellipse in perspective, thin gold edge)."""
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.ellipse((cx - w * 0.62, by - w * 0.10, cx + w * 0.62, by + w * 0.13), fill=(22, 58, 44, 255), outline=(150, 122, 60, 255), width=max(2, int(3 * L.U)))
    d.ellipse((cx - w * 0.55, by - w * 0.07, cx + w * 0.55, by + w * 0.10), outline=(90, 80, 45, 200), width=max(1, int(2 * L.U)))
    lay = lay.filter(ImageFilter.GaussianBlur(1.5 * L.U))
    out = img.convert("RGBA"); out.alpha_composite(lay); return out.convert("RGB")

# ------------------------------------------------------------------ the seated man (back view, no face)
def seated_back(h, rise=0.0, draw_in=0.0, lean=0.0, turn=1.0, bow=0.0, glow=0.0, beads=None):
    """RGBA sprite of a man in white sitting cross-legged, seen from behind (turn=1: three-quarter, turned to the
    right; turn=0: straight back view). rise: shoulders up (inhale) 0..1; draw_in: shoulders drawn in and down (a
    forceful out-breath) 0..1; lean: a little forward; bow: head bowed; glow: he is lit with gold light 0..1.
    beads: (phase, flash) prayer beads in his right hand. Returns (sprite, (ox, oy)): the base centre in the sprite."""
    S = 2                                                         # supersampled, then reduced: smooth edges
    w, hh = int(h * 1.3), int(h * 1.08)
    ox, oy = w / 2, h * 1.0
    def P(x, y): return ((ox + x * h) * S, (oy + y * h) * S)
    cv = Image.new("RGBA", (w * S, hh * S), (0, 0, 0, 0)); d = ImageDraw.Draw(cv)
    white = (226, 228, 220, 255); shade = (150, 158, 156, 255)
    ys = -0.70 - 0.018 * rise + 0.022 * draw_in + 0.012 * lean     # shoulder line (y up is negative)
    sw = 1.0 + 0.025 * rise - 0.06 * draw_in                      # shoulder width factor
    lx = 0.035 * lean + 0.03 * draw_in * turn                     # the upper body moves forward (to the right) a little
    def X(x, y):                                                  # upper body: leans forward, the far (right) side is narrower
        k = min(1, max(0, (-y - 0.12) / 0.58))
        return (x * (0.9 if x > 0 and turn > 0.5 else 1.0) + lx * k, y)
    # crossed legs, knees out to the sides
    d.ellipse([*P(-0.56, -0.17), *P(0.56, 0.02)], fill=shade)
    d.ellipse([*P(-0.60, -0.15), *P(-0.36, 0.015)], fill=shade)
    d.ellipse([*P(0.34, -0.16), *P(0.58, 0.01)], fill=shade)
    d.ellipse([*P(-0.36, -0.15), *P(0.36, -0.01)], fill=(112, 120, 118, 255))     # the shadow of his back on his lap
    # torso and arms: back of the kurta
    tp = [(-0.31, -0.07), (-0.285, -0.22), (-0.305, -0.40), (-0.28 * sw, -0.57), (-0.25 * sw, ys + 0.04), (-0.17 * sw, ys - 0.006),
          (-0.06, ys - 0.022), (0.06, ys - 0.022), (0.17 * sw, ys - 0.006), (0.25 * sw, ys + 0.04), (0.28 * sw, -0.57),
          (0.305, -0.40), (0.285, -0.22), (0.31, -0.07), (0.0, -0.045)]
    d.polygon([P(*X(x, y)) for x, y in catmull(tp, 12)], fill=white)
    # where the arms meet the back: soft shaded lines
    for sg in (-1, 1):
        d.line([P(*X(sg * 0.205 * sw, ys + 0.07)), P(*X(sg * 0.215, -0.45)), P(*X(sg * 0.235, -0.26))], fill=(180, 186, 182, 255), width=int(0.009 * h * S))
    # neck and head (back of the head, hair dark, a white cap); turned a little to the right: no face shows
    hx = 0.03 * turn + lx * 1.25; hy = ys - 0.125 + 0.035 * bow + 0.012 * draw_in
    d.rectangle([*P(hx - 0.042, hy + 0.04), *P(hx + 0.042, ys + 0.01)], fill=(96, 74, 60, 255))
    d.ellipse([*P(hx - 0.088, hy - 0.105), *P(hx + 0.088, hy + 0.105)], fill=(44, 36, 32, 255))
    d.chord([*P(hx - 0.091, hy - 0.115), *P(hx + 0.091, hy + 0.035)], 180, 360, fill=(238, 238, 230, 255))
    d.rectangle([*P(hx - 0.091, hy - 0.044), *P(hx + 0.091, hy - 0.038)], fill=(205, 205, 198, 255))
    # collar
    d.line([P(*X(-0.07, ys - 0.012)), P(hx, ys + 0.03), P(*X(0.08, ys - 0.014))], fill=(190, 194, 188, 255), width=int(0.008 * h * S))
    # folds of the kurta: soft darker strokes
    for x0, x1 in ((-0.12, -0.16), (0.0, 0.0), (0.12, 0.16)):
        d.line([P(*X(x0, ys + 0.12)), P(*X((x0 + x1) / 2, -0.38)), P(*X(x1, -0.08))], fill=(176, 182, 178, 255), width=int(0.008 * h * S))
    if beads is not None:                                         # his right hand at his right knee, a string of beads
        ph, fl = beads
        hxp, hyp = 0.47, -0.14
        d.ellipse([*P(hxp - 0.045, hyp - 0.035), *P(hxp + 0.045, hyp + 0.035)], fill=(150, 112, 88, 255))
        n = 22; R = 0.085
        for i in range(n):
            a = (i + ph) / n * 2 * math.pi
            bx, by_ = hxp + 0.012 + R * 0.55 * math.sin(a), hyp + 0.03 + R * (1 - math.cos(a)) * 0.95
            r = 0.0145
            c = (150, 96, 40, 255) if i % 11 else (220, 180, 90, 255)
            d.ellipse([*P(bx - r, by_ - r), *P(bx + r, by_ + r)], fill=c)
        d.ellipse([*P(hxp - 0.03, hyp - 0.03), *P(hxp + 0.035, hyp + 0.02)], fill=(160, 120, 94, 255))   # thumb over the bead
    im = cv.resize((w, hh), Image.LANCZOS)
    # light: from the upper right, so the right edge is warm and bright, the left side cool and in shade
    a = np.asarray(im).astype(np.float32); al = a[..., 3:4] / 255
    xx = np.linspace(0, 1, w)[None, :, None]; yy = np.linspace(0, 1, hh)[:, None, None]
    lit = 0.50 + 0.50 * np.clip((xx - 0.18) / 0.62, 0, 1) ** 1.2
    lit = lit * (1.0 - 0.18 * np.clip((yy - 0.7) / 0.3, 0, 1))
    tint = np.array([0.80, 0.92, 0.96]) * (1 - lit) + np.array([1.04, 1.0, 0.92]) * lit   # cool shade, warm light
    rgb = a[..., :3] * lit * tint
    m = Image.fromarray((al[..., 0] * 255).astype(np.uint8))
    sh = np.asarray(m.transform(m.size, Image.AFFINE, (1, 0, int(0.016 * h), 0, 1, int(0.010 * h)))).astype(np.float32)[..., None] / 255
    rim = np.clip(al - sh, 0, 1)                                  # edge facing the light
    rim = np.asarray(Image.fromarray((rim[..., 0] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.006 * h))).astype(np.float32)[..., None] / 255
    rgb = rgb + rim * np.array([255, 214, 140]) * (0.55 + 0.4 * glow)
    if glow > 0: rgb = rgb * (1 - 0.35 * glow) + np.array([255, 232, 176]) * 0.35 * glow
    out = np.concatenate([rgb.clip(0, 255), a[..., 3:4]], axis=2).astype(np.uint8)
    return Image.fromarray(out, "RGBA"), (ox, oy), dict(head=(hx, hy), mouth=(hx + 0.10 * turn + 0.01, hy + 0.06),
                                                        chest=(0.25 * sw + lx, ys + 0.12), heart=(-0.07 + lx * 0.6, ys + 0.20), shoulders=ys)

def place(img, spr, anchor, cx, by, glow_halo=0.0):
    out = img.convert("RGBA")
    x, y = int(cx - anchor[0]), int(by - anchor[1])
    if glow_halo > 0:                                             # a soft light around him
        a = spr.getchannel("A").filter(ImageFilter.GaussianBlur(spr.width * 0.05))
        g = Image.new("RGBA", spr.size, (255, 214, 140, 0)); g.putalpha(a.point(lambda v: int(v * 0.85 * glow_halo)))
        out.alpha_composite(g, (x, y))
    sh = Image.new("RGBA", out.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).ellipse(           # contact shadow on the mat
        (cx - spr.width * 0.42, by - spr.height * 0.05, cx + spr.width * 0.42, by + spr.height * 0.05), fill=(0, 0, 0, 110))
    out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14 * L.U)))
    out.alpha_composite(spr, (x, y))
    return out.convert("RGB")

# ------------------------------------------------------------------ smoke (plain dark grey, no shapes in it)
def smoke_layer(ot, puffs, sources, scale):
    """sources: [(x, y, weight)] in pixels, where the breath leaves the body. Each puff: ~70 soft particles pushed out
    to the right and a little up, fast at first then slowing, spreading, rising and fading over ~2.4 s."""
    W, H, U = L.W, L.H, L.U; s = 0.5
    lay = Image.new("RGBA", (int(W * s), int(H * s)), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    any_ = False
    for pi, t0 in enumerate(puffs):
        age0 = ot - t0
        if age0 < 0 or age0 > 3.2: continue
        any_ = True
        r = random.Random(1000 + pi * 17)
        for k in range(110):
            sx, sy, wt = sources[0] if r.random() < sources[0][2] else sources[1]
            emit = r.uniform(0, 0.28); age = age0 - emit
            life = r.uniform(1.8, 2.8)
            if age <= 0 or age > life: r.random(); r.random(); r.random(); r.random(); continue
            ang = math.radians(r.uniform(-30, 4)); v0 = r.uniform(800, 1500) * U * scale; kd = r.uniform(2.6, 3.6)
            dist = v0 / kd * (1 - math.exp(-kd * age))
            x = sx + dist * math.cos(ang) + 18 * U * math.sin(age * 3 + k)
            y = sy + dist * math.sin(ang) - 40 * U * age * age - 10 * U * math.cos(age * 2.4 + k)
            rad = (8 + 62 * age ** 0.8 * r.uniform(0.7, 1.3)) * U * scale
            fade = min(1, age / 0.06) * (1 - age / life) ** 1.6
            g = int(r.uniform(42, 78)); a = int(205 * fade)
            d.ellipse(((x - rad) * s, (y - rad) * s, (x + rad) * s, (y + rad) * s), fill=(g, g + 1, g + 5, a))
    if not any_: return None
    return lay.filter(ImageFilter.GaussianBlur(7 * U * s)).resize((W, H), Image.BILINEAR)

# ------------------------------------------------------------------ step labels
STEP_TEXT = {
    "hoon": [("Sit calmly", "سکون سے بیٹھیں"),
             ("Say “hoon” and breathe out forcefully", "ہوں کہہ کر زور سے سانس باہر نکالیں"),
             ("The khatra leaves with the breath", "خطرہ سانس کے ساتھ نکل جاتا ہے")],
    "tasawwur": [("Read Ya Khallaqu, Ya Fa''alu, Ya Musawwiru", "یا خلاق یا فعال یا مصور پڑھیں"),
                 ("Hold your shaykh’s picture in your heart", "شیخ کی تصویر دل میں رکھیں"),
                 ("Look at him in your tasawwur", "تصور میں ان کو دیکھیں")],
}

def step_img(kind, k, on):
    def mk():
        en, ur = STEP_TEXT[kind][k]
        U = L.U; col = L.GOLD if on else (205, 196, 170)
        ei = L.serif_text(en, 46, (255, 238, 196) if on else (200, 192, 170))
        ui = L.urdu(ur, 38, (250, 222, 150) if on else (196, 182, 140), path=L.URDU_R)
        bad = int(64 * U)
        w = max(ei.width + bad + int(14 * U), ui.width); hgt = int(ei.height + ui.height * 0.62)
        im = Image.new("RGBA", (w, hgt), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        bx = (w - (ei.width + bad)) // 2; cy = int(ei.height * 0.52)
        r = int(25 * U)
        d.ellipse((bx + bad // 2 - r, cy - r, bx + bad // 2 + r, cy + r), fill=(30, 46, 40, 230), outline=col + (255,), width=max(2, int(3 * U)))
        f = L.font(L.SERIF, 38 * U); tx = str(k + 1)
        tw = d.textlength(tx, font=f); d.text((bx + bad // 2 - tw / 2, cy - 38 * U * 0.62), tx, font=f, fill=col + (255,))
        im.alpha_composite(ei, (bx + bad, 0))
        im.alpha_composite(ui, ((w - ui.width) // 2, int(ei.height * 0.62 - ui.height * 0.18)))
        return im
    return cached(("p_step", kind, k, on), mk)

def draw_steps(img, kind, times, ot, top=0.205, gap=0.062, fade_out=None):
    """times: when step 1, 2, 3 begin (recording time). The newest step shown is gold, the earlier ones dimmer."""
    cur = max([-1] + [k for k, t in enumerate(times) if t is not None and ot >= t])
    fo = 1.0 if fade_out is None else 1 - sm(fade_out, fade_out + 1.0, ot)
    for k in range(cur + 1):
        a = sm(times[k], times[k] + 0.5, ot) * fo
        if a <= 0: continue
        on = (k == cur)
        y = L.H * (top + gap * k)
        sc = 1.0 + (0.04 * (1 - sm(times[k], times[k] + 0.35, ot)) if on else 0)
        img = L.paste_center(img, step_img(kind, k, on), L.W / 2, y + L.H * 0.022, alpha=a * (1.0 if on else 0.8), scale=sc)
    return img

# ------------------------------------------------------------------ demo: hoon
def breath(ot, puffs):
    """(rise, draw_in, inhale_light) for the man at recording time ot."""
    rise = 0.45 + 0.45 * math.sin(ot * 2 * math.pi / 4.6)          # calm breathing when nothing else is happening
    din = 0.0; light = 0.25 + 0.15 * (0.5 + 0.5 * math.sin(ot * 2 * math.pi / 4.6))
    for t0 in puffs:
        e = ot - t0
        if -1.1 < e < 0:                                           # drawing breath in before the "hoon"
            q = sm(-1.0, -0.12, e); rise = max(rise * (1 - q), 0) + q * 1.0
        if 0 <= e < 1.2:                                           # the forceful out-breath: shoulders in and down
            c = sm(0, 0.10, e) * (1 - sm(0.35, 1.1, e)); din = max(din, c); rise = min(rise, 1 - c * 1.6)
    nxt = [t for t in puffs if t > ot]; prv = [t for t in puffs if t <= ot]
    if prv and ot - prv[-1] < 3.5:                                 # gold light settles on his heart after each breath out
        e = ot - prv[-1]
        light = 0.25 + 0.75 * sm(0.35, 1.2, e) * (1 - (sm(-0.15, 0, ot - nxt[0]) if nxt else 0))
        if e < 0.35: light = 0.25 * (1 - sm(0, 0.2, e)) + 0.1
    return rise, din, light

def heart_light(img, x, y, a, t, rad):
    """Soft gold light on his heart, with a few motes drifting down into it."""
    if a <= 0.01: return img
    def f(dr, s):
        for k in range(3):
            r = rad * (1.0 - 0.28 * k) * s
            c = L.col((255, 206, 120) if k < 2 else (255, 240, 200), a * (0.45 + 0.25 * k))
            dr.ellipse((x * s - r, y * s - r, x * s + r, y * s + r), fill=c)
        rr = random.Random(5)
        for i in range(16):
            ang = rr.uniform(-2.6, -0.5); ph = (t * 0.45 + rr.random()) % 1.0
            dist = rad * (3.6 * (1 - ph) + 0.2)
            px, py = x + dist * math.cos(ang), y + dist * math.sin(ang)
            sz = (2.5 + 2.5 * rr.random()) * L.U * s
            dr.ellipse((px * s - sz, py * s - sz, px * s + sz, py * s + sz), fill=L.col((255, 228, 160), a * math.sin(ph * math.pi)))
    return L.screen(img, L.glow_layer(f, blur=int(rad / L.U / 3)))

def refuge_light(img, cx, by, h, a, t):
    """A soft cone of light from above enfolding him: Allah's refuge."""
    if a <= 0.01: return img
    def mk():
        W, H = L.W // 4, L.H // 4
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); x0, b0, hh = cx / 4, by / 4, h / 4
        top = b0 - hh * 2.2
        v = np.clip((yy - top) / (b0 - top), 0, 1.15)
        width = hh * (0.18 + 0.62 * np.clip(v, 0, 1))
        cone = np.exp(-((xx - x0) / width) ** 2) * np.clip(v * 1.4, 0, 1) * np.clip(1 - (v - 1.0) / 0.15, 0, 1)
        pool = np.exp(-(((xx - x0) / (hh * 0.9)) ** 2 + ((yy - (b0 - hh * 0.45)) / (hh * 0.75)) ** 2))
        m = np.clip(0.55 * cone + 0.45 * pool, 0, 1)[..., None] * np.array([150, 122, 66], np.float32)
        return Image.fromarray(m.astype(np.uint8)).resize((L.W, L.H), Image.BILINEAR)
    lay = cached(("p_refuge", int(cx), int(by), int(h)), mk)
    img = L.screen(img, Image.eval(lay, lambda v, a=a: int(v * a)))
    return L.screen(img, L.glow_layer(lambda dr, s: L.draw_motes(dr, t, s, seed=41, n=40, color=L.WARM), blur=5, strength=a))

def demo_hoon(tl, d, ot):
    cf = DEMOS.get("hoon", {}); puffs = cf.get("puffs", []); steps = cf.get("steps", [None, None, None]); refuge = cf.get("refuge", 1e9)
    W, H, U = L.W, L.H, L.U
    if ot is None: ot = tl
    img = background("hoon").copy()
    img = L.draw_stars(img, ot, seed=72, n=60, ymax=0.5)
    h = H * 0.28; cx, by = W * 0.38, H * 0.70
    img = mat(img, cx, by, h * 1.05)
    rf = sm(refuge, refuge + 2.0, ot)
    rise, din, light = breath(ot, puffs if rf < 1 else [])
    if rf > 0: rise, din = rise * (1 - rf) + rf * (0.45 + 0.35 * math.sin(ot * 2 * math.pi / 5.5)), din * (1 - rf)
    img = refuge_light(img, cx, by, h, rf, ot)
    spr, anc, pts = seated_back(int(h), rise=rise, draw_in=din, lean=0.5 * din, turn=1.0, glow=0.55 * rf)
    img = place(img, spr, anc, cx, by, glow_halo=0.25 + 0.6 * rf)
    hx, hy = cx + pts["heart"][0] * h, by + pts["heart"][1] * h
    img = heart_light(img, hx, hy, light * (1 - rf) + rf * 0.5, ot, h * 0.06 * (1 + 0.6 * rf))
    mx, my = cx + pts["mouth"][0] * h, by + pts["mouth"][1] * h
    chx, chy = cx + pts["chest"][0] * h, by + pts["chest"][1] * h
    sm_ = smoke_layer(ot, puffs, [(mx, my, 0.55), (chx, chy, 0.45)], h / (H * 0.28))
    if sm_ is not None:
        o = img.convert("RGBA"); o.alpha_composite(sm_); img = o.convert("RGB")
    img = draw_steps(img, "hoon", steps, ot, fade_out=refuge if refuge < 1e8 else None)   # below the "for murids" mark
    return img

# ------------------------------------------------------------------ demo: tasawwur
NAMES = ["يَا خَلَّاقُ", "يَا فَعَّالُ", "يَا مُصَوِّرُ"]

def light_shaykh_mask(h):
    """A seated figure facing us, made only of light: a rounded head with a turban shape, shoulders, a robe falling
    to a wide base. Nothing is drawn inside it: no face, no features."""
    def mk():
        S = 2; pad = h * 0.45; w, hh = int(h * 1.2 + 2 * pad), int(h * 1.1 + 2 * pad); ox, oy = w / 2, h * 1.02 + pad
        m = Image.new("L", (w * S, hh * S), 0); d = ImageDraw.Draw(m)
        def P(x, y): return ((ox + x * h) * S, (oy + y * h) * S)
        body = [(-0.50, -0.02), (-0.46, -0.22), (-0.36, -0.42), (-0.28, -0.58), (-0.10, -0.64), (0.10, -0.64), (0.28, -0.58),
                (0.36, -0.42), (0.46, -0.22), (0.50, -0.02), (0.0, 0.03)]
        d.polygon([P(x, y) for x, y in catmull(body, 12)], fill=255)
        d.ellipse([*P(-0.12, -0.92), *P(0.12, -0.64)], fill=255)          # head
        d.ellipse([*P(-0.15, -0.99), *P(0.15, -0.80)], fill=255)          # turban
        d.ellipse([*P(-0.58, -0.20), *P(0.58, 0.04)], fill=255)           # crossed legs
        return m.resize((w, hh), Image.LANCZOS), (ox, oy)
    return cached(("p_shaykh", int(h)), mk)

@functools.lru_cache(maxsize=4)
def _inside_points(h, n=260):
    m, _ = light_shaykh_mask(h); a = np.asarray(m); r = np.random.RandomState(3)
    ys, xs = np.nonzero(a > 128); idx = r.choice(len(xs), n)
    return xs[idx], ys[idx]

def light_shaykh(img, cx, by, h, f, t):
    """The shaykh formed from light: particles of light gather into the figure; f 0..1 how far it has formed."""
    if f <= 0.005: return img
    m, (ox, oy) = light_shaykh_mask(int(h))
    x0, y0 = cx - ox, by - oy
    W, H, U = L.W, L.H, L.U
    fm = sm(0.35, 1.0, f)
    if fm > 0:
        blur = lerp(26, 3, fm) * U
        core = m.filter(ImageFilter.GaussianBlur(blur)).point(lambda v: int(v * fm))
        halo = m.filter(ImageFilter.GaussianBlur(40 * U)).point(lambda v: int(min(255, v * 1.2 * fm)))
        o = img.convert("RGBA")
        hl = Image.new("RGBA", m.size, (255, 200, 110, 0)); hl.putalpha(halo); o.alpha_composite(hl, (int(x0), int(y0)))
        cl = Image.new("RGBA", m.size, (255, 248, 226, 0)); cl.putalpha(core); o.alpha_composite(cl, (int(x0), int(y0)))
        img = o.convert("RGB")
    xs, ys = _inside_points(int(h))
    r = np.random.RandomState(9); sx = r.uniform(-0.2, 1.2, len(xs)) * W; sy = r.uniform(0.05, 0.75, len(xs)) * H
    dl = r.uniform(0, 0.35, len(xs))
    def g(dr, s):
        for i in range(len(xs)):
            q = L.ease((f - dl[i]) / 0.6)
            if q <= 0: continue
            px = lerp(sx[i], x0 + xs[i], q) + 6 * U * math.sin(t * 1.7 + i); py = lerp(sy[i], y0 + ys[i], q) + 6 * U * math.cos(t * 1.3 + i)
            a = (1 - fm * 0.7) * min(1, q * 3)
            rr = (2.5 + 2 * (i % 3)) * U * s
            dr.ellipse((px * s - rr, py * s - rr, px * s + rr, py * s + rr), fill=L.col((255, 236, 180), a))
    return L.screen(img, L.glow_layer(g, blur=5))

def light_thread(img, p0, p1, a, t):
    """A thin thread of light from the murid's heart to the shaykh, with a spark travelling up it."""
    if a <= 0.01: return img
    (x0, y0), (x1, y1) = p0, p1
    cx, cy = (x0 + x1) / 2 + 60 * L.U, (y0 + y1) / 2
    pts = [((1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1) for u in np.linspace(0, 1, 40)]
    n = max(2, int(len(pts) * min(1, a * 1.4)))
    def f(dr, s):
        q = [(x * s, y * s) for x, y in pts[:n]]
        dr.line(q, fill=L.col((255, 210, 130), a), width=max(2, int(7 * L.U * s)))
        dr.line(q, fill=L.col((255, 250, 230), a), width=max(1, int(2.5 * L.U * s)))
        for k in range(2):
            u = (t * 0.35 + k * 0.5) % 1.0; i = int(u * (n - 1)); x, y = pts[i]; rr = 9 * L.U * s
            dr.ellipse((x * s - rr, y * s - rr, x * s + rr, y * s + rr), fill=L.col((255, 246, 220), a * math.sin(u * math.pi)))
    return L.screen(img, L.glow_layer(f, blur=6))

def _part(cf, ot):
    parts = cf.get("parts", []); cur = parts[0] if parts else {}
    for p in parts:
        if ot >= p.get("start", -1e9) - 1.0: cur = p
    return cur

def demo_tasawwur(tl, d, ot):
    cf = DEMOS.get("tasawwur", {}); W, H, U = L.W, L.H, L.U
    if ot is None: ot = tl
    p = _part(cf, ot)
    img = background("tasawwur", (0.5, 0.36)).copy()
    img = L.draw_stars(img, ot, seed=73, n=60, ymax=0.5)
    h = H * 0.215; cx, by = W * 0.5, H * 0.695
    img = mat(img, cx, by, h * 1.05)
    names = p.get("names", [])
    ticks = sorted(names + [names[-1] + p.get("beads_every", 1.8) * k for k in range(1, 30)]) if names else []
    done = [t for t in ticks if t <= ot]; ph = float(len(done))      # beads: one bead slides on with each name
    if done: ph = ph - 1 + L.ease((ot - done[-1]) / 0.3)
    fl = 1 - sm(0, 0.4, ot - done[-1]) if done else 0
    # the shaykh in light, in front of him (above, farther away)
    fa, fb = p.get("form", (1e9, 1e9 + 1)); f0 = p.get("form_from", 0.0)
    f = f0 + (1 - f0) * sm(fa, fb, ot)
    sx, sb, shh = W * 0.5, H * 0.525, H * 0.125
    if f > 0:
        img = L.screen(img, L.rgrad(sx, sb - shh * 0.5, (int(70 * f), int(56 * f), int(28 * f)), (0, 0, 0), shh * 1.6))
    bl = p.get("bloom")
    if bl is not None and ot >= bl:                                    # "this is what opened my eyes": the light widens
        k = sm(bl, bl + 1.5, ot)
        img = L.screen(img, L.rgrad(sx, sb - shh * 0.5, (int(110 * k), int(90 * k), int(50 * k)), (0, 0, 0), shh * 3.2))
    img = light_shaykh(img, sx, sb, shh, f, ot)
    spr, anc, pts = seated_back(int(h), rise=0.4 + 0.4 * math.sin(ot * 2 * math.pi / 5.0), turn=0.0, bow=1.0,
                                glow=0.25 * f, beads=(ph, fl))
    img = place(img, spr, anc, cx, by, glow_halo=0.25 + 0.3 * f)
    hx, hy = cx + pts["heart"][0] * h, by + pts["heart"][1] * h
    th = sm(p.get("thread", 1e9), p.get("thread", 1e9) + 1.5, ot)
    img = heart_light(img, hx, hy, 0.25 + 0.6 * max(f * 0.6, th), ot, h * 0.07)
    img = light_thread(img, (hx, hy), (sx, sb - shh * 0.42), th, ot)
    # the Names, one by one as they are read
    pos = [(0.80, 0.425), (0.50, 0.425), (0.20, 0.425)]      # read right to left, as in Arabic
    gone = sm(fa, fa + 1.8, ot)                                    # as the picture forms, the Names flow into it
    for i, t0 in enumerate(names):
        if ot < t0 or gone >= 1: continue
        a = sm(t0, t0 + 0.45, ot) * (1 - gone)
        sc = (1.0 + 0.10 * (1 - sm(t0, t0 + 0.4, ot))) * (1 - 0.5 * gone)
        x = lerp(W * pos[i][0], sx, L.ease(gone)); y = lerp(H * pos[i][1], sb - shh * 0.45, L.ease(gone))
        img = L.paste_center(img, L.urdu(NAMES[i], 64), x, y, alpha=a, scale=sc)
    img = draw_steps(img, "tasawwur", p.get("steps", [None, None, None]), ot)
    return img

DEMO = {"hoon": demo_hoon, "tasawwur": demo_tasawwur}
def demo(kind, tl, d, ot=None): return DEMO[kind](tl, d, ot)
