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
        txt = beats[k][3].get("text")
        if txt:
            al = min(1, (ot - st) / 0.8)
            img = L.paste_center(img, L.urdu(txt, 92), L.W / 2, L.H * 0.13, alpha=al)
        return img
    return scene

SCENES = {n: make(n) for n in SLIDES}
