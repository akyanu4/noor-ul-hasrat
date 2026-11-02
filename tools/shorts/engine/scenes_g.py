"""Scenes, part G: slideshow of still images (Ken Burns + crossfade + gold motes).
The project folder holds images/<CODE>.png and slides.py:
    SLIDES = {"scene_name": [(orig_time, "CODE", crop[, opts]), ...]}
crop: None   = fill the whole frame with the image (for tall, full-size pictures)
      "all"  = show the whole picture large in the upper part over a blurred copy of itself
      (x0, y0, x1, y1) = the same, using only that part of the picture
opts (dict, optional):
      "frame": True        smaller picture in a thin gold frame (for small pictures, so they are not blown up as much)
      "glow": [(fx, fy, fr)] soft light over a face (fractions of the shown picture's width/height; fr of width):
                           a saint's face is always hidden in light
      "text": "..."        Arabic/Urdu words glowing above the picture
      "slash": [(t, dir)]  sword strokes of light at recording time t (dir 1 = left-to-right, -1 = right-to-left), with a flash and a jolt
      "surprise": [(t, fx, fy, "text")]  a moment of astonishment at time t: punch-in, burst of light, exclamation pops up
"PORTRAIT" as the code shows his glowing photo instead of a picture."""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import cfg, lib as L
sys.path.insert(0, cfg.PROJECT)
try: from slides import SLIDES
except ImportError: SLIDES = {}
from scenes_a import cached, ease
import scenes_a as A

IMG = os.path.join(cfg.PROJECT, "images")

def face_glow(im, glows):
    """A saint's face hidden in light: a bright warm core over the face with a soft halo around it."""
    if not glows: return im
    a = np.asarray(im).astype(np.float32); h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    m = np.zeros((h, w), np.float32)
    for fx, fy, fr in glows:
        d = np.hypot(xx - fx * w, yy - fy * h) / (fr * w)
        core = np.clip(1.3 * np.clip(1.0 - d, 0, 1) ** 0.8, 0, 1)
        halo = 0.45 * np.exp(-(d / 1.8) ** 2)
        m = np.maximum(m, np.maximum(core, halo))
    m = m[..., None]
    light = np.array([255, 246, 220], np.float32)
    return Image.fromarray((a * (1 - 0.95 * m) + light * 0.95 * m).clip(0, 255).astype(np.uint8))

def frame_image(code, crop, opts):
    def mk():
        zw, zh = int(L.W * 1.12), int(L.H * 1.12)
        if code == "PORTRAIT":
            bg = A.bg_night().copy().resize((zw, zh))
            return L.paste_center(bg, A.portrait(L.H * 0.42), zw / 2, zh * 0.40)
        src = Image.open(os.path.join(IMG, code + ".png")).convert("RGB")
        if crop is None:
            return face_glow(L.cover(src, zw, zh), opts.get("glow")).filter(ImageFilter.UnsharpMask(2, 60, 2))
        if crop != "all": src = src.crop(crop)
        src = face_glow(src, opts.get("glow"))
        bg = L.cover(src, zw, zh).filter(ImageFilter.GaussianBlur(45 * L.U))
        bg = Image.eval(bg, lambda v: int(v * 0.5))
        if opts.get("frame"):
            fw = int(zw * 0.80); fh = int(src.height * fw / src.width)
            if fh > zh * 0.56: fh = int(zh * 0.56); fw = int(src.width * fh / src.height)
            fg = src.resize((fw, fh), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 80, 2))
            x, y = (zw - fw) // 2, int(zh * 0.40 - fh / 2)
            glow = Image.new("RGB", (zw, zh)); gd = ImageDraw.Draw(glow)
            gd.rectangle((x - 14, y - 14, x + fw + 14, y + fh + 14), fill=(120, 90, 30))
            bg = L.screen(bg, glow.filter(ImageFilter.GaussianBlur(30 * L.U)))
            bd = ImageDraw.Draw(bg); g = (225, 190, 110)
            bd.rectangle((x - 7, y - 7, x + fw + 6, y + fh + 6), outline=g, width=3)
            bg.paste(fg, (x, y))
        else:
            fw = int(zw * 1.02); fh = int(src.height * fw / src.width)
            if fh > zh * 0.66: fh = int(zh * 0.66); fw = int(src.width * fh / src.height)
            fg = src.resize((fw, fh), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 70, 2))
            m = Image.new("L", fg.size, 255); md = ImageDraw.Draw(m); e = int(fh * 0.09)
            for i in range(e):
                a = int(255 * (i / e) ** 1.5)
                md.line((0, i, fw, i), fill=a); md.line((0, fh - 1 - i, fw, fh - 1 - i), fill=a)
            bg.paste(fg, ((zw - fw) // 2, int(zh * 0.40 - fh / 2)), m)
        return bg
    return cached(("slide", code, crop, repr(sorted(opts.items()))), mk)

SLASH_DUR, SLASH_AFTER = 0.32, 0.55

def slash_layer(p, fade, direction=1, seed=0):
    """A sword stroke of light across the picture: a curved sweep with a fading trail, a crisp white edge and a glint at the tip.
    p = how far the stroke has swept (0..1); fade = 1 while it sweeps, falling to 0 afterwards."""
    W, H = L.W, L.H; s = 0.5                                   # drawn at half size, blurred and scaled up (soft glow, cheap)
    w, h = int(W * s), int(H * s)
    lay = Image.new("RGB", (w, h)); d = ImageDraw.Draw(lay)
    var = (seed % 3 - 1) * 0.05
    P0, P1, P2 = np.array([0.04, 0.17 + var]), np.array([0.42, 0.78]), np.array([0.97, 0.46 - var])   # high-left, dips, rises right
    if direction < 0: P0, P1, P2 = [np.array([1 - q[0], q[1]]) for q in (P0, P1, P2)]
    def at(u): q = (1 - u) ** 2 * P0 + 2 * (1 - u) * u * P1 + u ** 2 * P2; return q[0] * w, q[1] * h
    head = min(1.0, p) ** 0.7; tail = max(0.0, head - 0.75); n = 60
    for i in range(n):                                         # trail: wide and faint behind, narrow and bright at the edge
        f = i / (n - 1); u = tail + (head - tail) * f; x, y = at(u)
        r = (0.010 + 0.055 * (1 - f) ** 1.3) * w
        c = int(255 * fade * (0.30 + 0.70 * f ** 1.5))
        d.ellipse((x - r, y - r, x + r, y + r), fill=(c, int(c * 0.84), int(c * 0.50)))
    lay = lay.filter(ImageFilter.GaussianBlur(0.010 * w))
    e = ImageDraw.Draw(lay)
    edge = [at(head - (head - tail) * 0.6 * k / 20) for k in range(21)]
    e.line(edge, fill=(int(255 * fade), int(240 * fade), int(190 * fade)), width=max(3, int(0.018 * w)))
    e.line(edge[:12], fill=(int(255 * fade),) * 3, width=max(2, int(0.008 * w)))
    hx, hy = at(head); g = int(255 * fade); gr = 0.035 * w * (1.0 if p < 1 else 0.7)
    for ang in (0, np.pi / 2, np.pi / 4, 3 * np.pi / 4):          # four-pointed glint
        k = gr if ang in (0, np.pi / 2) else gr * 0.45
        e.line((hx - k * np.cos(ang), hy - k * np.sin(ang), hx + k * np.cos(ang), hy + k * np.sin(ang)), fill=(g, g, g), width=max(1, int(0.003 * w)))
    return lay.resize((W, H), Image.BILINEAR)

def apply_slashes(img, ot, slashes):
    """slashes: [(t, direction)] in recording time. Each is a stroke, a flash of light on impact and a small jolt."""
    for i, sl in enumerate(slashes):
        t0, direction = sl[0], (sl[1] if len(sl) > 1 else 1)
        dt = ot - t0
        if dt < 0 or dt > SLASH_DUR + SLASH_AFTER: continue
        p = dt / SLASH_DUR; fade = 1.0 if p <= 1 else max(0.0, 1 - (dt - SLASH_DUR) / SLASH_AFTER) ** 1.5
        k = dt - SLASH_DUR                                     # time since impact
        if 0 <= k < 0.28:                                      # jolt: a few pixels, dying away
            a = (1 - k / 0.28) * 14 * L.U; ox, oy = int(a * np.sin(k * 90)), int(a * 0.6 * np.cos(k * 70))
            img = img.transform(img.size, Image.AFFINE, (1, 0, ox, 0, 1, oy), Image.BICUBIC)
        img = Image.eval(img, lambda v, a=1 - 0.30 * fade: int(v * a))   # the scene dims a little so the stroke of light stands out
        img = L.screen(img, slash_layer(p, fade, direction, i))
        if 0 <= k < 0.35:                                      # warm flash on impact
            img = Image.blend(img, Image.new("RGB", img.size, (255, 236, 200)), 0.38 * (1 - k / 0.35) ** 2)
    return img

SURPRISE_LEN = 1.7

def burst_layer(cx, cy, k, seed=0):
    """Rays of light bursting out from (cx, cy), k = seconds since the moment (0..SURPRISE_LEN)."""
    W, H = L.W, L.H; s = 0.5; w, h = int(W * s), int(H * s)
    lay = Image.new("RGB", (w, h)); d = ImageDraw.Draw(lay)
    grow = min(1, k / 0.35) ** 0.6; fade = max(0.0, 1 - k / SURPRISE_LEN) ** 1.4
    rng = np.random.RandomState(seed); n = 28; R = max(w, h) * 0.75 * grow
    x0, y0 = cx * s, cy * s; spin = k * 0.25
    for i in range(n):
        a = 2 * np.pi * i / n + spin + rng.uniform(-0.05, 0.05); half = 0.035 + 0.03 * rng.rand(); r = R * (0.6 + 0.4 * rng.rand())
        c = int(200 * fade * (0.5 + 0.5 * rng.rand()))
        d.polygon([(x0, y0), (x0 + r * np.cos(a - half), y0 + r * np.sin(a - half)), (x0 + r * np.cos(a + half), y0 + r * np.sin(a + half))],
                  fill=(c, int(c * 0.85), int(c * 0.5)))
    rr = 0.10 * w * (0.5 + grow); c = int(255 * fade)
    d.ellipse((x0 - rr, y0 - rr, x0 + rr, y0 + rr), fill=(c, int(c * 0.93), int(c * 0.75)))
    return lay.filter(ImageFilter.GaussianBlur(0.012 * w)).resize((W, H), Image.BILINEAR)

def apply_surprise(img, ot, items):
    """items: [(t, fx, fy[, text])] in recording time. A moment of astonishment: the picture punches in towards (fx, fy)
    (fractions of the frame), light bursts out from there, and the exclamation pops up in Urdu above the picture."""
    for i, it in enumerate(items):
        t0, fx, fy = it[0], it[1], it[2]; txt = it[3] if len(it) > 3 else None
        k = ot - t0
        if k < 0 or k > SURPRISE_LEN: continue
        bump = min(1, k / 0.16) * max(0.0, 1 - max(0, k - 0.16) / 1.3) ** 1.3   # quick push in, slow ease back
        z = 1 + 0.13 * bump; cx, cy = fx * L.W, fy * L.H
        if z > 1.001:
            cw, ch = L.W / z, L.H / z; x0, y0 = cx - (cx) / z, cy - (cy) / z
            img = img.transform((L.W, L.H), Image.EXTENT, (x0, y0, x0 + cw, y0 + ch), Image.BICUBIC)
        img = L.screen(img, burst_layer(cx, cy, k, i))
        if k < 0.25: img = Image.blend(img, Image.new("RGB", img.size, (255, 240, 210)), 0.30 * (1 - k / 0.25) ** 2)
        if txt:
            sc = 0.55 + 0.45 * min(1, k / 0.22) + 0.10 * np.sin(min(1, k / 0.22) * np.pi)   # pops with a little overshoot
            al = min(1, k / 0.12) * min(1, (SURPRISE_LEN - k) / 0.4)
            img = L.paste_center(img, L.urdu(txt, 104), L.W / 2, L.H * 0.13, alpha=al, scale=sc)
    return img

def kb(im, p, k, still=False):
    zw, zh = im.size
    amt = 0.05 if still else 0.10
    z = (1.0 + amt * p) if k % 2 == 0 else (1.0 + amt - amt * p)
    cw, ch = zw / z, zh / z
    dx = 0 if still else (p - 0.5) * 36 * L.U * (1 if k % 3 else -1)
    box = (zw / 2 - cw / 2 + dx, zh / 2 - ch / 2, zw / 2 + cw / 2 + dx, zh / 2 + ch / 2)
    return im.transform((L.W, L.H), Image.EXTENT, box, Image.BICUBIC)

def make(name):
    beats = [b if len(b) == 4 else (b[0], b[1], b[2], {}) for b in SLIDES[name]]
    def shot(k, ot):
        st = beats[k][0]; en = beats[k + 1][0] if k + 1 < len(beats) else st + 30
        o = beats[k][3]
        return kb(frame_image(beats[k][1], beats[k][2], o), ease(min(1, max(0, (ot - st) / (en - st)))), k,
                  still=bool(o.get("frame")) or beats[k][1] == "PORTRAIT")
    def scene(t, d, ot):
        if ot is None: ot = beats[0][0] + t
        k = max([0] + [i for i, b in enumerate(beats) if b[0] <= ot + 1e-6])
        st = beats[k][0]
        img = shot(k, ot)
        X = 0.6
        if k > 0 and ot - st < X: img = Image.blend(shot(k - 1, ot), img, (ot - st) / X)
        img = L.screen(img, L.glow_layer(lambda dr, s: L.draw_motes(dr, ot, s, seed=11 + k, n=50), blur=5))
        sl = [x for b in beats for x in b[3].get("slash", [])]
        if sl: img = apply_slashes(img, ot, sl)
        sp = [x for b in beats for x in b[3].get("surprise", [])]
        if sp: img = apply_surprise(img, ot, sp)
        txt = beats[k][3].get("text")
        if txt:
            al = min(1, (ot - st) / 0.8)
            img = L.paste_center(img, L.urdu(txt, 92), L.W / 2, L.H * 0.13, alpha=al)
        return img
    return scene

SCENES = {n: make(n) for n in SLIDES}
