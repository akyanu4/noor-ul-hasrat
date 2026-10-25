"""Scenes, part G: slideshow of AI-generated still images (Ken Burns + crossfade + gold motes).
The project folder holds images/<CODE>.png and slides.py:  SLIDES = {"scene_name": [(orig_time, "CODE", crop), ...]}
crop = None (use the whole image) or (x0, y0, x1, y1): the sharp part of the picture. A cropped picture is shown large
in the upper part of the frame over a blurred copy of itself, so the captions sit on a calm background."""
import os, sys
from PIL import Image, ImageDraw, ImageFilter
import cfg, lib as L
sys.path.insert(0, cfg.PROJECT)
try: from slides import SLIDES
except ImportError: SLIDES = {}
from scenes_a import cached, ease

IMG = os.path.join(cfg.PROJECT, "images")

def frame_image(code, crop):
    def mk():
        src = Image.open(os.path.join(IMG, code + ".png")).convert("RGB")
        zw, zh = int(L.W * 1.12), int(L.H * 1.12)
        if crop is None:
            return L.cover(src, zw, zh).filter(ImageFilter.UnsharpMask(2, 60, 2))
        src = src.crop(crop)
        bg = L.cover(src, zw, zh).filter(ImageFilter.GaussianBlur(45 * L.U))
        bg = Image.eval(bg, lambda v: int(v * 0.5))
        fw = int(zw * 1.02); fh = int(src.height * fw / src.width)
        if fh > zh * 0.66: fh = int(zh * 0.66); fw = int(src.width * fh / src.height)
        fg = src.resize((fw, fh), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 70, 2))
        m = Image.new("L", fg.size, 255); md = ImageDraw.Draw(m); e = int(fh * 0.09)
        for i in range(e):
            a = int(255 * (i / e) ** 1.5)
            md.line((0, i, fw, i), fill=a); md.line((0, fh - 1 - i, fw, fh - 1 - i), fill=a)
        bg.paste(fg, ((zw - fw) // 2, int(zh * 0.40 - fh / 2)), m)
        return bg
    return cached(("slide", code, crop), mk)

def kb(im, p, k):
    zw, zh = im.size
    z = (1.0 + 0.10 * p) if k % 2 == 0 else (1.10 - 0.10 * p)
    cw, ch = zw / z, zh / z
    dx = (p - 0.5) * 36 * L.U * (1 if k % 3 else -1)
    box = (zw / 2 - cw / 2 + dx, zh / 2 - ch / 2, zw / 2 + cw / 2 + dx, zh / 2 + ch / 2)
    return im.transform((L.W, L.H), Image.EXTENT, box, Image.BICUBIC)

def make(name):
    beats = SLIDES[name]
    def scene(t, d, ot):
        if ot is None: ot = beats[0][0] + t
        k = max([0] + [i for i, b in enumerate(beats) if b[0] <= ot + 1e-6])
        st = beats[k][0]; en = beats[k + 1][0] if k + 1 < len(beats) else st + 30
        img = kb(frame_image(beats[k][1], beats[k][2]), ease(min(1, (ot - st) / (en - st))), k)
        X = 0.6
        if k > 0 and ot - st < X:
            pk = k - 1; pst = beats[pk][0]
            prev = kb(frame_image(beats[pk][1], beats[pk][2]), ease(min(1, (ot - pst) / (st - pst))), pk)
            img = Image.blend(prev, img, (ot - st) / X)
        return L.screen(img, L.glow_layer(lambda dr, s: L.draw_motes(dr, ot, s, seed=11 + k, n=50), blur=5))
    return scene

SCENES = {n: make(n) for n in SLIDES}
