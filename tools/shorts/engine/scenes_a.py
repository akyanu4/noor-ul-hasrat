"""Scenes, part A: opening, the soul (images), Arsh descent, creation, world of examples, womb, weight & time."""
import math, random, functools, glob, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import lib as L
from lib import ease, sm, lerp, col, GOLD, WARM, IVORY

CACHE = {}
def cached(key, fn):
    k = (key, L.W, L.H)
    if k not in CACHE: CACHE[k] = fn()
    return CACHE[k]

# ---------------------------------------------------------------- title & outro cards (with his photo)
import cfg
PHOTO = cfg.PHOTO
def portrait(size):
    """His photo in a glowing golden oval: the photo is cleaned, warmed and sharpened, set in a double gold ring
    with small stars, light rays behind and a soft golden bloom."""
    def mk():
        from PIL import ImageEnhance, ImageOps
        src = Image.open(PHOTO).convert("RGB").crop(tuple(cfg.P.get("photo_crop", (70, 8, 292, 388))))
        pw, ph = int(size * 0.74), int(size * 0.94)
        src = L.cover(src, pw, ph)
        src = src.filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.UnsharpMask(radius=max(1, size * 0.004), percent=90, threshold=2))
        a = np.asarray(src).astype(float) / 255
        if cfg.P.get("photo_grade", True):                              # an old phone photo: clean it up and warm it
            a = a ** 0.82                                                # lift the shadows
            a = 0.5 + (a - 0.5) * 1.08                                   # a little more contrast
            g = a.mean(axis=2, keepdims=True); a = g + (a - g) * 0.85     # natural colour, slightly softened
            a = np.clip(a * np.array([1.07, 1.0, 0.88]) + np.array([0.03, 0.015, 0.0]), 0, 1)   # warm, golden light
        yy, xx = np.mgrid[0:ph, 0:pw]
        r0 = np.hypot((xx - pw * 0.5) / (pw * 0.5), (yy - ph * 0.42) / (ph * 0.55))
        a = np.clip(a + (np.clip(1 - r0, 0, 1) ** 2 * 0.10)[..., None] * np.array([1.0, 0.9, 0.6]), 0, 1)   # soft light on his face
        im = Image.fromarray((a * 255).astype(np.uint8))
        rr = np.hypot((xx - pw / 2) / (pw / 2), (yy - ph / 2) / (ph / 2))
        m = np.clip((1.0 - rr) / 0.035, 0, 1)                              # a clean oval edge
        out = im.convert("RGBA"); out.putalpha(Image.fromarray((m * 255).astype(np.uint8)))
        # inner golden rim light
        rim = np.clip(1 - np.abs(rr - 0.93) / 0.07, 0, 1) * (rr < 1)
        rl = Image.new("RGBA", (pw, ph), (255, 214, 140, 0)); rl.putalpha(Image.fromarray((rim * 150).astype(np.uint8)))
        out.alpha_composite(rl.filter(ImageFilter.GaussianBlur(size * 0.012)))
        pad = int(size * 0.15)
        cw, ch = pw + 2 * pad, ph + 2 * pad; cx, cy = cw / 2, ch / 2
        can = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        # light rays behind
        rays = Image.new("L", (cw, ch), 0); rd = ImageDraw.Draw(rays)
        for i in range(36):
            ang = 2 * math.pi * i / 36; w2 = 0.035
            ln = (0.62 if i % 2 else 0.52) * max(cw, ch)
            rd.polygon([(cx, cy), (cx + ln * math.cos(ang - w2), cy + ln * math.sin(ang - w2)), (cx + ln * math.cos(ang + w2), cy + ln * math.sin(ang + w2))], fill=130 if i % 2 else 85)
        fall = np.clip(1 - np.hypot((np.mgrid[0:ch, 0:cw][1] - cx) / (cw / 2), (np.mgrid[0:ch, 0:cw][0] - cy) / (ch / 2)), 0, 1)
        rays = Image.fromarray((np.asarray(rays.filter(ImageFilter.GaussianBlur(size * 0.01))).astype(float) * fall).astype(np.uint8))
        rl2 = Image.new("RGBA", (cw, ch), (255, 220, 150, 0)); rl2.putalpha(rays); can.alpha_composite(rl2)
        # golden bloom
        halo = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        ImageDraw.Draw(halo).ellipse((pad - size * 0.07, pad - size * 0.07, pad + pw + size * 0.07, pad + ph + size * 0.07), fill=(255, 205, 120, 220))
        can.alpha_composite(halo.filter(ImageFilter.GaussianBlur(size * 0.075)))
        can.alpha_composite(out, (pad, pad))
        # double gold ring with small stars
        fr = Image.new("RGBA", (cw, ch), (0, 0, 0, 0)); fd = ImageDraw.Draw(fr)
        t1 = max(3, int(size * 0.016)); t2 = max(2, int(size * 0.006)); gap = size * 0.028
        fd.ellipse((pad - t1 / 2, pad - t1 / 2, pad + pw + t1 / 2, pad + ph + t1 / 2), outline=(236, 196, 104, 255), width=t1)
        fd.ellipse((pad - gap, pad - gap, pad + pw + gap, pad + ph + gap), outline=(250, 226, 160, 230), width=t2)
        for i in range(16):
            ang = 2 * math.pi * i / 16; x = cx + (pw / 2 + gap) * math.cos(ang); y = cy + (ph / 2 + gap) * math.sin(ang)
            L.star8(fd, x, y, size * (0.016 if i % 2 else 0.024), fill=(255, 226, 150, 255))
        glow = fr.filter(ImageFilter.GaussianBlur(size * 0.012))
        can.alpha_composite(glow); can.alpha_composite(glow); can.alpha_composite(fr)
        return can
    return cached(("portrait2", int(size)), mk)

def bg_night():
    return cached("bg_night", lambda: L.rgrad(L.W / 2, L.H * 0.4, (18, 50, 42), (4, 12, 11), max(L.W, L.H) * 0.75))

def title_card(t, d, closing=False):
    img = bg_night().copy()
    lay = L.glow_layer(lambda dr, s: L.draw_motes(dr, t, s, seed=5, n=60), blur=5)
    img = L.screen(img, lay)
    fade = sm(0, 0.8, t) * (1 - sm(d - 0.7, d, t)) if not closing else sm(0, 0.8, t)
    if L.PORTRAIT:
        pc, px, py = portrait(L.H * 0.36), L.W / 2, L.H * 0.30
        ty = L.H * 0.56
    else:
        pc, px, py = portrait(L.H * 0.62), L.W * 0.30, L.H * 0.50
        ty = L.H * 0.30
    img = L.paste_center(img, pc, px, py, alpha=fade, scale=1 + 0.03 * t / d)
    tx = L.W / 2 if L.PORTRAIT else L.W * 0.66
    img = L.paste_center(img, L.urdu("درس", 150), tx, ty, alpha=fade)
    img = L.paste_center(img, L.serif_text("Hazrat Azam Pasha", 80), tx, ty + 150 * L.U, alpha=fade)
    img = L.paste_center(img, L.serif_text("RAHMATULLAH ALAIH", 32, GOLD, 6), tx, ty + 225 * L.U, alpha=fade)
    img = L.paste_center(img, L.urdu("حضرت اعظم پاشا رحمۃ اللہ علیہ", 54, (225, 212, 182), path=L.URDU_R), tx, ty + 305 * L.U, alpha=fade)
    sub = "JazakAllah khair for watching" if closing else "The soul's journey · Kun fayakun · the blessed malida"
    img = L.paste_center(img, L.serif_text(sub, 40, (215, 205, 180)), tx, ty + 390 * L.U, alpha=fade * sm(0.6, 1.4, t))
    return img

# ---------------------------------------------------------------- the soul (your 12 images)
IMGDIR = cfg.ASSETS + "/scene_images/"
BEATS = [0.40, 3.00, 7.50, 13.00, 18.40, 23.20, 30.20, 37.60, 41.70, 48.10, 52.60, 58.00]
def soul_frame_image(k):
    def mk():
        src = Image.open(sorted(glob.glob(IMGDIR + "%02d.*" % (k + 1)))[0]).convert("RGB")
        zw, zh = int(L.W * 1.14), int(L.H * 1.14)
        if L.PORTRAIT: return L.cover(src, zw, zh)
        bg = L.cover(src, zw, zh).filter(ImageFilter.GaussianBlur(40 * L.U))
        bg = Image.eval(bg, lambda v: int(v * 0.55))
        fg_h = zh; fg_w = int(src.width * fg_h / src.height)
        fg = src.resize((fg_w, fg_h), Image.LANCZOS)
        m = Image.new("L", fg.size, 255); md = ImageDraw.Draw(m)
        e = int(fg_w * 0.10)
        for i in range(e):  # feather the side edges
            a = int(255 * i / e); md.line((i, 0, i, fg_h), fill=a); md.line((fg_w - 1 - i, 0, fg_w - 1 - i, fg_h), fill=a)
        bg.paste(fg, ((zw - fg_w) // 2, 0), m)
        return bg
    return cached(("soulimg", k), mk)

def kb(im, p, k):
    zw, zh = im.size
    z = (1.0 + 0.12 * p) if k % 2 == 0 else (1.12 - 0.12 * p)
    cw, ch = zw / z, zh / z
    dx = (p - 0.5) * 30 * L.U * (1 if k % 3 else -1)
    box = (zw / 2 - cw / 2 + dx, zh / 2 - ch / 2, zw / 2 + cw / 2 + dx, zh / 2 + ch / 2)
    return im.transform((L.W, L.H), Image.EXTENT, box, Image.BICUBIC)

def soul(t, d, ot):
    k = max([0] + [i for i, b in enumerate(BEATS) if b <= ot + 1e-6])
    st = BEATS[k]; en = BEATS[k + 1] if k + 1 < len(BEATS) else 63.0
    img = kb(soul_frame_image(k), ease((ot - st) / (en - st)), k)
    if k > 0 and ot - st < 0.35:
        pk = k - 1; pst = BEATS[pk]
        img = Image.blend(kb(soul_frame_image(pk), ease((ot - pst) / (st - pst)), pk), img, (ot - st) / 0.35)
    img = L.screen(img, L.glow_layer(lambda dr, s: L.draw_motes(dr, ot, s, seed=7, n=80), blur=5))
    for a, b, txt in [(8.0, 13.0, "اللہ"), (45.6, 48.2, "کن")]:
        if a <= ot < b:
            al = min(1, (ot - a) / 0.5, (b - ot) / 0.4)
            img = L.paste_center(img, L.urdu(txt, 260), L.W / 2, L.H * (0.36 if L.PORTRAIT else 0.40), alpha=al, scale=0.92 + 0.08 * min(1, (ot - a) / 0.6))
    return img

# ---------------------------------------------------------------- Arsh -> earth (pause)
def arsh_world():
    def mk():
        W, H = L.W, L.H; HC = H * 5
        y = np.linspace(0, 1, HC)[:, None]
        stops = [(0.00, (70, 52, 22)), (0.10, (60, 44, 18)), (0.22, (34, 40, 26)), (0.35, (14, 36, 32)), (0.65, (8, 22, 34)), (0.85, (5, 12, 26)), (1.00, (6, 16, 34))]
        img = L.vgrad(stops, W, HC).convert("RGBA")
        r = random.Random(11); lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
        for _ in range(int(2600 * W / 1080)):
            yy = HC * (0.25 + 0.75 * r.random() ** 0.7); xx = r.uniform(0, W); s = r.choice([1, 1, 2, 2, 3]) * L.U
            d.ellipse((xx - s, yy - s, xx + s, yy + s), fill=(255, 240, 210, r.randint(80, 230)))
        img = Image.alpha_composite(img, lay)
        cx, cy = W / 2, 700 * L.U
        g = Image.new("RGBA", img.size, (0, 0, 0, 0)); gd = ImageDraw.Draw(g)
        for rad, a in [(900, 70), (600, 110), (380, 170), (220, 230), (120, 255)]:
            rad *= L.U; gd.ellipse((cx - rad * 1.3, cy - rad, cx + rad * 1.3, cy + rad), fill=(255, 250, 235, a))
        img = Image.alpha_composite(img, g.filter(ImageFilter.GaussianBlur(90 * L.U)))
        rays = Image.new("RGBA", img.size, (0, 0, 0, 0)); rd = ImageDraw.Draw(rays)
        for i in range(22):
            ang = math.pi / 2 + (i - 10.5) * 0.06; Lr = 2600 * L.U
            rd.polygon([(cx, cy), (cx + Lr * math.cos(ang - 0.012), cy + Lr * math.sin(ang - 0.012)), (cx + Lr * math.cos(ang + 0.012), cy + Lr * math.sin(ang + 0.012))], fill=(255, 236, 190, 40))
        img = Image.alpha_composite(img, rays.filter(ImageFilter.GaussianBlur(14 * L.U)))
        hues = [(255, 220, 150), (240, 210, 140), (200, 220, 160), (150, 220, 190), (130, 200, 210), (120, 170, 220), (110, 150, 220)]
        for i in range(7):
            yc = HC * (0.21 + i * 0.085)
            hl = Image.new("RGBA", img.size, (0, 0, 0, 0)); hd = ImageDraw.Draw(hl)
            for wd, a in [(70, 40), (34, 70), (12, 150), (4, 230)]:
                hd.ellipse((-W * 1.2, yc - 60 * L.U, W * 2.2, yc + 1500 * L.U + W * 0.4), outline=hues[i] + (a,), width=max(1, int(wd * L.U)))
            img = Image.alpha_composite(img, hl.filter(ImageFilter.GaussianBlur(10 * L.U))); img = Image.alpha_composite(img, hl)
        er = max(W, H) * 1.6; ecx, ecy = W / 2, HC - 550 * L.U + er
        e = Image.new("RGBA", img.size, (0, 0, 0, 0)); ed = ImageDraw.Draw(e)
        ed.ellipse((ecx - er - 60, ecy - er - 60, ecx + er + 60, ecy + er + 60), fill=(120, 210, 255, 120))
        img = Image.alpha_composite(img, e.filter(ImageFilter.GaussianBlur(50 * L.U)))
        band = int(900 * L.U); yy, xx = np.mgrid[HC - band:HC, 0:W]
        dist = np.hypot(xx - ecx, yy - ecy); inside = dist <= er
        rr = np.random.default_rng(4)
        nz = np.asarray(Image.fromarray((rr.random((90, 110)) * 255).astype(np.uint8)).resize((W, band), Image.BICUBIC).filter(ImageFilter.GaussianBlur(25))) / 255
        surf = np.zeros((band, W, 3)); surf[...] = (12, 48, 98)
        lv = np.clip((nz - 0.55) / 0.15, 0, 1)[..., None]; surf = surf * (1 - lv) + np.array([60, 96, 56]) * lv
        lit = np.clip(0.35 + 0.9 * (xx / W), 0.35, 1.15)[..., None]; shade = np.clip(1 - (er - dist) / (500 * L.U), 0, 1)[..., None]
        surf = surf * lit * (0.85 + 0.4 * shade) + np.array([140, 200, 255]) * 0.25 * shade
        base = np.asarray(img.crop((0, HC - band, W, HC)).convert("RGB")).astype(float); base[inside] = surf[inside]
        img.paste(Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)), (0, HC - band))
        return img.convert("RGB"), HC, ecx, ecy, er
    return cached("arsh", mk)

R0 = random.Random(5)
SOULS = [(R0.gauss(0, 0.16), R0.uniform(0, 1.0), R0.uniform(0.95, 1.35), R0.choice([3, 4, 5, 6]), R0.uniform(0, 6.28)) for _ in range(260)]
def arsh(t, d, ot=None):
    world, HC, ecx, ecy, er = arsh_world()
    p = ease((t - 0.6) / (d - 1.8)); cam = p * (HC - L.H)
    img = world.crop((0, int(cam), L.W, int(cam) + L.H))
    def souls(dr, s):
        for sx, start, sp, sz, ph in SOULS:
            tt = t - start * 3.2
            if tt < 0: continue
            wy = 700 * L.U + tt * sp * (HC / (d - 1.0)) * 0.95
            spread = min(1, (wy - 700 * L.U) / (2500 * L.U))
            wx = L.W / 2 + sx * min(L.W, L.H) * 1.4 * spread * (1.6 if not L.PORTRAIT else 1) + 22 * L.U * math.sin(tt * 2 + ph)
            surf = ecy - math.sqrt(max(0, er ** 2 - (wx - ecx) ** 2)) - 8
            if wy > surf + 30: continue
            y = wy - cam
            if -60 < y < L.H + 60:
                for k in range(8):
                    yk = y - k * 6 * sp * L.U; a = (1 - k / 8) ** 1.6; rr = sz * L.U * (1 - k * 0.1)
                    dr.ellipse(((wx - rr) * s, (yk - rr) * s, (wx + rr) * s, (yk + rr) * s), fill=col((255, 228, 170), a))
            if wy > surf - 50:
                yl = surf - cam; dr.ellipse(((wx - 14) * s, (yl - 6) * s, (wx + 14) * s, (yl + 6) * s), fill=(200, 240, 255))
    img = L.screen(img, L.glow_layer(souls, blur=8, half=True, strength=1.3))
    cy = L.H * (0.72 if L.PORTRAIT else 0.80)
    for a, b, txt in [(0.8, 3.4, "عرش"), (3.6, 6.1, "عرش سے فرش تک"), (6.3, 8.9, "فرش")]:
        if a <= t < b: img = L.paste_center(img, L.urdu(txt, 110 if len(txt) < 6 else 96), L.W / 2, cy, alpha=min(1, (t - a) / 0.4, (b - t) / 0.4))
    return img

# ---------------------------------------------------------------- Kun fa-yakun creation (pause)
_rng = np.random.default_rng(9); NP = 9000
C_ang = _rng.uniform(0, 2 * np.pi, NP); C_spd = _rng.gamma(2.0, 0.5, NP); C_arm = _rng.integers(0, 3, NP)
C_gr = _rng.uniform(0.05, 1.0, NP) ** 0.8; C_gth = C_arm * 2 * np.pi / 3 + 3.2 * np.log(1 + 6 * C_gr) + _rng.normal(0, 0.28, NP)
C_sc = _rng.normal(0, 0.035, (NP, 2))
C_col = np.where(_rng.random(NP)[:, None] < 0.75, np.array([[255, 214, 140]]), np.array([[150, 200, 255]])) * _rng.uniform(0.5, 1.0, (NP, 1))
def earth_disc(r):
    s = int(r * 2) + 4; yy, xx = np.mgrid[0:s, 0:s]; dd = np.hypot(xx - s / 2, yy - s / 2) / r
    nz = np.asarray(Image.fromarray((np.random.default_rng(4).random((40, 40)) * 255).astype(np.uint8)).resize((s, s), Image.BICUBIC).filter(ImageFilter.GaussianBlur(max(1, s / 40)))) / 255
    rgb = np.zeros((s, s, 3)); rgb[...] = (14, 52, 110)
    lv = np.clip((nz - 0.52) / 0.12, 0, 1)[..., None]; rgb = rgb * (1 - lv) + np.array([60, 100, 62]) * lv
    lit = np.clip(0.25 + 1.1 * ((xx - yy) / s + 0.5), 0.2, 1.25)[..., None]
    rgb = rgb * lit + np.array([150, 210, 255]) * 0.35 * np.clip((dd - 0.8) / 0.2, 0, 1)[..., None]
    a = np.clip((1 - dd) * r / 2, 0, 1) * 255
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), a]).astype(np.uint8), "RGBA")
def creation(t, d, ot=None):
    W, H, U = L.W, L.H, L.U; CX, CY = W / 2, H * (0.42 if L.PORTRAIT else 0.45)
    buf = np.zeros((H, W, 3))
    zoom = 1.0 + 7.0 * sm(3.6, 5.2, t) ** 2; rot = 0.35 * t; R_ = 480 * U
    gx = CX + (C_gr * np.cos(C_gth + rot) + C_sc[:, 0]) * R_ * zoom; gy = CY + (C_gr * np.sin(C_gth + rot) + C_sc[:, 1]) * R_ * zoom * 0.55
    bt = max(0.0, t - 0.6); br = 520 * U * (1 - np.exp(-bt * 1.8)) * C_spd if bt > 0 else np.zeros(NP)
    mix = sm(1.4, 3.2, t); xs = (CX + br * np.cos(C_ang)) * (1 - mix) + gx * mix; ys = (CY + br * np.sin(C_ang)) * (1 - mix) + gy * mix
    fg = 1.0 - sm(4.6, 5.6, t)
    if t > 0.6 and fg > 0:
        m = (xs >= 0) & (xs < W) & (ys >= 0) & (ys < H)
        np.add.at(buf, (ys[m].astype(int), xs[m].astype(int)), C_col[m] * 5.0 * fg * min(1, (t - 0.6) / 0.2))
    img = Image.fromarray(np.clip(buf, 0, 255).astype(np.uint8))
    img = L.add(L.add(img.filter(ImageFilter.GaussianBlur(6 * U)), img.filter(ImageFilter.GaussianBlur(2 * U))), img)
    dr = ImageDraw.Draw(img)
    if t < 0.75: r = (6 + 10 * sm(0, 0.6, t)) * U; dr.ellipse((CX - r, CY - r, CX + r, CY + r), fill=(255, 245, 220))
    flash = math.exp(-((t - 0.65) / 0.18) ** 2); core = sm(1.6, 3.0, t) * fg
    gl = Image.new("RGB", (W, H), (0, 0, 0)); gd = ImageDraw.Draw(gl)
    for rr_, a in [(260, 0.25), (140, 0.5), (60, 0.9)]:
        c = col((255, 220, 160), a * max(core, flash, (1 - sm(0.5, 0.7, t)) * 0.6)); rz = rr_ * U * (1 + 2.5 * flash)
        gd.ellipse((CX - rz, CY - rz * 0.8, CX + rz, CY + rz * 0.8), fill=c)
    img = L.screen(img, gl.filter(ImageFilter.GaussianBlur(60 * U)))
    sol = sm(4.6, 5.4, t)
    if sol > 0:
        im = img.convert("RGBA"); lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(lay)
        sx, sy = CX - 250 * U, CY
        for orx, a in [(170, 120), (300, 90), (450, 70)]:
            orx *= U; ld.ellipse((sx - orx, sy - orx * 0.32, sx + orx, sy + orx * 0.32), outline=(230, 200, 140, int(a * sol)), width=max(1, int(2 * U)))
        for k, (orx, ph, r_, c) in enumerate([(170, 1.0, 9, (200, 160, 120)), (450, 2.6, 13, (200, 120, 90))]):
            a_ = ph + t * (0.9 - k * 0.3); px, py = sx + orx * U * math.cos(a_), sy + orx * U * 0.32 * math.sin(a_); r_ *= U
            ld.ellipse((px - r_, py - r_, px + r_, py + r_), fill=c + (int(255 * sol),))
        sun = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(sun)
        for rr_, a in [(150, 60), (90, 140), (50, 255)]:
            rr_ *= U; sd.ellipse((sx - rr_, sy - rr_, sx + rr_, sy + rr_), fill=(255, 225, 150, int(a * sol)))
        im = Image.alpha_composite(im, sun.filter(ImageFilter.GaussianBlur(25 * U))); im = Image.alpha_composite(im, lay)
        grow = sm(5.0, 6.6, t); ea = 0.4 + t * 0.4
        ex = sx + 300 * U * math.cos(ea) * (1 - grow) + (CX + 120 * U - sx) * grow; ey = sy + 300 * U * 0.32 * math.sin(ea) * (1 - grow) + (CY + 60 * U - sy) * grow
        e = earth_disc((14 + 200 * grow) * U)
        if sol < 1: e.putalpha(e.getchannel("A").point(lambda v: int(v * sol)))
        im.alpha_composite(e, (int(ex - e.width / 2), int(ey - e.height / 2))); img = im.convert("RGB")
    if flash > 0.02: img = Image.blend(img, Image.new("RGB", (W, H), (255, 240, 205)), min(0.85, flash * 0.85))
    if t >= 5.4: img = L.paste_center(img, L.urdu("کن فیکون", 150), W / 2, H * (0.62 if L.PORTRAIT else 0.78), alpha=min(1, (t - 5.4) / 0.6))
    return img

# ---------------------------------------------------------------- world of examples: the soul is given a form; the hayola
def silhouette_mask(h):
    def mk():
        w = int(h * 0.5); m = Image.new("L", (w, int(h)), 0); d = ImageDraw.Draw(m)
        cx = w / 2; r = h * 0.075
        d.ellipse((cx - r, h * 0.03, cx + r, h * 0.03 + 2 * r), fill=255)
        d.polygon([(cx - h * 0.06, h * 0.19), (cx + h * 0.06, h * 0.19), (cx + h * 0.16, h * 0.30), (cx + h * 0.14, h * 0.55), (cx + h * 0.10, h * 0.56),
                   (cx + h * 0.09, h * 0.98), (cx - h * 0.09, h * 0.98), (cx - h * 0.10, h * 0.56), (cx - h * 0.14, h * 0.55), (cx - h * 0.16, h * 0.30)], fill=255)
        return m.filter(ImageFilter.GaussianBlur(h * 0.012))
    return cached(("sil", int(h)), mk)

def human_parts(h):
    """A fuller human figure of height h: (mask, features) where features is an RGBA layer with hair, a calm face
    (closed eyes, brows, nose, lips, ears) and soft outlines of the arms. Drawn at 3x and reduced for smooth edges."""
    def mk():
        S = 3; H_ = int(h * S); w = int(h * 0.5 * S); cx = w / 2
        def P(x, y): return (cx + x * H_, y * H_)
        m = Image.new("L", (w, H_), 0); d = ImageDraw.Draw(m)
        d.ellipse((cx - 0.052 * H_, 0.018 * H_, cx + 0.052 * H_, 0.158 * H_), fill=255)                  # head
        d.rectangle((cx - 0.022 * H_, 0.14 * H_, cx + 0.022 * H_, 0.19 * H_), fill=255)                  # neck
        d.polygon([P(-0.035, 0.175), P(-0.12, 0.195), P(-0.135, 0.23), P(-0.11, 0.33), P(-0.088, 0.46), P(-0.10, 0.53),
                   P(0.10, 0.53), P(0.088, 0.46), P(0.11, 0.33), P(0.135, 0.23), P(0.12, 0.195), P(0.035, 0.175)], fill=255)   # torso
        for sg in (-1, 1):
            d.polygon([P(sg * 0.118, 0.195), P(sg * 0.148, 0.225), P(sg * 0.168, 0.37), P(sg * 0.165, 0.50), P(sg * 0.135, 0.50), P(sg * 0.13, 0.37), P(sg * 0.112, 0.25)], fill=255)   # arm
            d.ellipse((cx + sg * 0.150 * H_ - 0.022 * H_, 0.49 * H_, cx + sg * 0.150 * H_ + 0.022 * H_, 0.56 * H_), fill=255)   # hand
            d.polygon([P(sg * 0.012, 0.52), P(sg * 0.10, 0.52), P(sg * 0.085, 0.75), P(sg * 0.072, 0.95), P(sg * 0.03, 0.95), P(sg * 0.022, 0.75)], fill=255)   # leg
            d.ellipse((cx + sg * 0.052 * H_ - 0.034 * H_, 0.935 * H_, cx + sg * 0.052 * H_ + 0.034 * H_ + sg * 0.012 * H_, 0.985 * H_), fill=255)   # foot
            d.ellipse((cx + sg * 0.052 * H_ - 0.010 * H_, 0.075 * H_, cx + sg * 0.052 * H_ + 0.010 * H_, 0.11 * H_), fill=255)   # ear
        f = Image.new("RGBA", (w, H_), (0, 0, 0, 0)); fd = ImageDraw.Draw(f)
        lw = max(2, int(0.0042 * H_)); ink = (176, 128, 74, 235); soft = (196, 150, 96, 150)
        # hair: full and soft over the top and sides of the head, with a few darker strands
        hc = (196, 146, 84, 235)
        fd.chord((cx - 0.058 * H_, 0.008 * H_, cx + 0.058 * H_, 0.104 * H_), 180, 360, fill=hc)
        fd.pieslice((cx - 0.058 * H_, 0.008 * H_, cx + 0.058 * H_, 0.104 * H_), 150, 180, fill=hc)
        fd.pieslice((cx - 0.058 * H_, 0.008 * H_, cx + 0.058 * H_, 0.104 * H_), 0, 30, fill=hc)
        for sg in (-1, 1):
            for k in range(3):
                x0 = cx + sg * (0.008 + 0.014 * k) * H_
                fd.line((x0, 0.016 * H_ + k * 0.004 * H_, x0 + sg * 0.012 * H_, 0.050 * H_), fill=(150, 104, 56, 180), width=max(1, lw // 2))
        for sg in (-1, 1):
            ex = cx + sg * 0.021 * H_
            fd.arc((ex - 0.013 * H_, 0.078 * H_, ex + 0.013 * H_, 0.098 * H_), 15, 165, fill=ink, width=lw)          # closed eye
            for e2 in (-0.008, 0.0, 0.008): fd.line((ex + e2 * H_, 0.0965 * H_, ex + e2 * 1.2 * H_, 0.1005 * H_), fill=soft, width=max(1, lw // 2))   # lashes
            fd.arc((ex - 0.016 * H_, 0.066 * H_, ex + 0.016 * H_, 0.086 * H_), 200, 340, fill=ink, width=lw)        # brow
        fd.line((cx + 0.002 * H_, 0.092 * H_, cx - 0.004 * H_, 0.112 * H_, cx + 0.004 * H_, 0.115 * H_), fill=soft, width=lw, joint="curve")   # nose
        fd.chord((cx - 0.016 * H_, 0.117 * H_, cx + 0.016 * H_, 0.137 * H_), 0, 180, fill=(232, 150, 140, 230))   # lower lip
        fd.polygon([P(-0.016, 0.127), P(-0.006, 0.121), P(0.0, 0.1235), P(0.006, 0.121), P(0.016, 0.127)], fill=(220, 130, 124, 230))   # upper lip
        fd.line((cx - 0.016 * H_, 0.127 * H_, cx + 0.016 * H_, 0.127 * H_), fill=(170, 96, 88, 240), width=max(1, lw // 2))
        for sg in (-1, 1):   # soft outline between arms and body, fingers, knees
            fd.line([P(sg * 0.112, 0.25), P(sg * 0.13, 0.37), P(sg * 0.135, 0.49)], fill=soft, width=lw)
            fd.line([P(sg * 0.012, 0.56), P(sg * 0.022, 0.75), P(sg * 0.03, 0.94)], fill=soft, width=lw)
        fd.arc((cx - 0.06 * H_, 0.15 * H_, cx + 0.06 * H_, 0.22 * H_), 20, 160, fill=soft, width=lw)   # collar
        mask = m.filter(ImageFilter.GaussianBlur(S * 0.8)).resize((int(h * 0.5), int(h)), Image.LANCZOS)
        feat = f.filter(ImageFilter.GaussianBlur(S * 0.5)).resize((int(h * 0.5), int(h)), Image.LANCZOS)
        return mask, feat
    return cached(("human", int(h)), mk)

def soul_sprite(h):
    """A soul as a softly glowing human-shaped light (no features)."""
    def mk():
        m, feat = human_parts(h); pad = int(h * 0.3)
        base = Image.new("RGB", (m.width + 2 * pad, m.height + 2 * pad)); base.paste((255, 244, 215), (pad, pad), m)
        a = np.asarray(base).astype(float)
        g1 = np.asarray(base.filter(ImageFilter.GaussianBlur(h * 0.02))).astype(float)
        g2 = np.asarray(base.filter(ImageFilter.GaussianBlur(h * 0.10))).astype(float)
        yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
        shade = 0.82 + 0.18 * np.clip(1 - np.hypot((xx - a.shape[1] / 2) / (h * 0.16), (yy - (pad + h * 0.32)) / (h * 0.42)), 0, 1)
        a = a * np.dstack([shade, shade * 0.97, shade * 0.9])
        out = Image.fromarray(np.clip(a * 0.85 + g1 * 0.45 + g2 * 0.9, 0, 255).astype(np.uint8)).convert("RGBA")
        return out.convert("RGB")      # the soul is only light: no face, hair or features
    return cached(("soulsp2", int(h)), mk)

def soul_light(img, x, yc, h, alpha=1.0):
    """Screen a soul light-figure of height h centred at (x, yc) onto img."""
    if alpha <= 0: return img
    sp = soul_sprite(int(h))
    if alpha < 1: sp = Image.eval(sp, lambda v: int(v * alpha))
    lay = Image.new("RGB", img.size); lay.paste(sp, (int(x - sp.width / 2), int(yc - sp.height / 2)))
    return L.screen(img, lay)

def misal(t, d, ot):
    W, H, U = L.W, L.H, L.U
    img = cached("misal_bg", lambda: L.vgrad([(0, (22, 18, 48)), (0.55, (14, 26, 46)), (1, (6, 10, 20))])).copy()
    img = L.draw_stars(img, ot, seed=21, n=int(260 * W / 1080), ymax=0.8)
    # drifting mist bands
    def mist(dr, s):
        for i in range(5):
            y = H * (0.25 + 0.14 * i) + 20 * U * math.sin(ot * 0.2 + i)
            x0 = (ot * 18 * U * (1 if i % 2 else -1)) % (W * 0.8) - W * 0.4
            dr.ellipse(((x0 - W * 0.2) * s, (y - 50 * U) * s, (x0 + W * 1.4) * s, (y + 50 * U) * s), fill=col((90, 110, 170), 0.18))
    img = L.screen(img, L.glow_layer(mist, blur=40))
    cx, base = W / 2, H * (0.80 if L.PORTRAIT else 0.86); sh = H * (0.50 if L.PORTRAIT else 0.62)
    form = sm(71.3, 80.0, ot)                 # the soul takes a form
    fly = sm(87.0, 95.0, ot) * (1 - sm(95.0, 99.0, ot))
    rise = -H * 0.06 * math.sin(math.pi * fly)
    hay = sm(99.6, 102.0, ot)                  # hayola: there, yet not there
    orb_y = base - sh * 0.55 + rise
    def orb(dr, s):
        r = (60 + 10 * math.sin(ot * 2)) * U * (1 - 0.7 * form)
        for k, a in [(2.2, 0.15), (1.5, 0.35), (1.0, 0.9)]:
            dr.ellipse(((cx - r * k) * s, (orb_y - r * k) * s, (cx + r * k) * s, (orb_y + r * k) * s), fill=col((255, 236, 190), a))
    img = L.screen(img, L.glow_layer(orb, blur=14))
    if form > 0:
        m = silhouette_mask(sh)
        edge = m.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.MaxFilter(3))
        a_fill = 0.22 * form; a_edge = form
        if hay > 0:
            flick = 0.55 + 0.45 * math.sin(ot * 5.0) * math.sin(ot * 1.7)
            a_fill *= lerp(1, flick, hay); a_edge *= lerp(1, 0.4 + 0.6 * flick, hay)
        lay = Image.new("RGB", m.size, (0, 0, 0))
        lay = Image.composite(Image.new("RGB", m.size, col((200, 220, 255), a_fill)), lay, m)
        lay = L.add(lay, Image.composite(Image.new("RGB", m.size, col((255, 236, 190), a_edge)), Image.new("RGB", m.size, (0, 0, 0)), edge))
        if hay > 0:   # mirage shimmer: shift rows sideways
            arr = np.asarray(lay).copy(); hh = arr.shape[0]
            for yy in range(0, hh, 2):
                sft = int(6 * U * hay * math.sin(yy * 0.05 + ot * 6)); arr[yy:yy + 2] = np.roll(arr[yy:yy + 2], sft, axis=1)
            lay = Image.fromarray(arr)
        big = Image.new("RGB", (W, H), (0, 0, 0)); big.paste(lay, (int(cx - m.width / 2), int(base - sh + rise)))
        img = L.screen(img, L.add(big.filter(ImageFilter.GaussianBlur(10 * U)), big))
    if fly > 0:
        img = L.screen(img, L.glow_layer(lambda dr, s: L.draw_motes(dr, ot * 3, s, seed=9, n=50), blur=4, strength=fly))
    for a, b, txt in [(63.3, 70.6, "عالمِ مثال"), (99.6, 109.5, "ہیولیٰ")]:
        if a <= ot < b: img = L.paste_center(img, L.urdu(txt, 110), W / 2, H * 0.16, alpha=min(1, (ot - a) / 0.6, (b - ot) / 0.5))
    return img

# ---------------------------------------------------------------- the womb: cells dividing, growth over nine months
def cell_layout(n):
    if n == 1: return [(0, 0)]
    if n == 2: return [(-0.5, 0), (0.5, 0)]
    if n == 4: return [(-0.5, -0.5), (0.5, -0.5), (-0.5, 0.5), (0.5, 0.5)]
    if n == 8: return [(math.cos(a) * 0.75, math.sin(a) * 0.75) for a in np.linspace(0, 2 * math.pi, 8, endpoint=False)]
    pts = [(math.cos(a) * 0.85, math.sin(a) * 0.85) for a in np.linspace(0, 2 * math.pi, 11, endpoint=False)]
    return pts + [(math.cos(a) * 0.35, math.sin(a) * 0.35) for a in np.linspace(0.3, 2 * math.pi + 0.3, 5, endpoint=False)]
def womb(t, d, ot):
    W, H, U = L.W, L.H, L.U
    img = cached("womb_bg", lambda: L.rgrad(W / 2, H * 0.5, (70, 26, 34), (14, 6, 10), max(W, H) * 0.7)).copy()
    cx, cy = W / 2, H * (0.42 if L.PORTRAIT else 0.47); R_ = min(W, H) * 0.34
    arrive = sm(110.0, 128.0, ot)
    def sac(dr, s):   # protective sphere
        a = 0.25 + 0.75 * sm(124, 134, ot); pul = 1 + 0.01 * math.sin(ot * 2.4)
        for k, al in [(1.0, 0.10), (0.97, 0.08), (0.9, 0.06)]:
            r = R_ * k * pul; dr.ellipse(((cx - r) * s, (cy - r) * s, (cx + r) * s, (cy + r) * s), fill=col((255, 170, 140), al * a))
        r = R_ * pul; dr.ellipse(((cx - r) * s, (cy - r) * s, (cx + r) * s, (cy + r) * s), outline=col((255, 200, 160), 0.7 * a), width=max(1, int(4 * U * s)))
    img = L.screen(img, L.glow_layer(sac, blur=18))
    # the soul's light travels down into the sphere
    if ot < 136:
        oy = lerp(-H * 0.1, cy, ease(arrive)); fade = 1 - sm(132, 136, ot)
        img = soul_light(img, cx, oy, H * 0.13 * (1 - 0.5 * sm(128, 134, ot)), fade)
    # cells divide: 1 -> 2 -> 4 -> 8 -> 16
    if 134 <= ot < 146.5:
        stages = [(134, 1), (137.5, 2), (139.5, 4), (141.5, 8), (143.3, 16)]
        k = max(i for i, s_ in enumerate(stages) if s_[0] <= ot)
        n = stages[k][1]; p = sm(stages[k][0], stages[k][0] + 1.0, ot)
        prev = cell_layout(stages[k - 1][1]) if k > 0 else [(0, 0)]
        cur = cell_layout(n); cr = R_ * 0.42 / (n ** 0.42)
        spread = R_ * 0.42 * (0.5 if n > 1 else 0)
        fade = 1 - sm(145.0, 146.5, ot)
        lay = Image.new("RGB", (W // 2, H // 2), (0, 0, 0)); dr = ImageDraw.Draw(lay)
        for i, (x1, y1) in enumerate(cur):
            x0, y0 = prev[i // 2] if k > 0 else (0, 0)
            px = cx + lerp(x0, x1, p) * spread * 1.6; py = cy + lerp(y0, y1, p) * spread * 1.6
            dr.ellipse(((px - cr) / 2, (py - cr) / 2, (px + cr) / 2, (py + cr) / 2), fill=col((140, 70, 80), fade), outline=col((255, 210, 180), fade), width=max(1, int(2 * U)))
            nr = cr * 0.25; dr.ellipse(((px - nr) / 2, (py - nr) / 2, (px + nr) / 2, (py + nr) / 2), fill=col((255, 225, 190), fade))
        img = L.screen(img, L.add(lay.filter(ImageFilter.GaussianBlur(6 * U)), lay).resize((W, H), Image.BILINEAR))
    # growth: an abstract curled form of light that grows, with a gentle heartbeat
    if ot >= 145.0:
        g = 0.35 + 0.65 * sm(145, 156, ot); app = sm(145, 146.5, ot)
        beat = math.exp(-((ot % 0.9) / 0.12) ** 2)
        def emb(dr, s):
            rr = R_ * 0.55 * g
            for k in range(26):
                a = math.pi * (0.25 + 1.45 * k / 25); wdt = (1 - k / 30) * rr * 0.32
                px = cx + rr * 0.55 * math.cos(a); py = cy + rr * 0.55 * math.sin(a)
                dr.ellipse(((px - wdt) * s, (py - wdt) * s, (px + wdt) * s, (py + wdt) * s), fill=col((255, 200, 170), 0.35 * app))
            hr = rr * 0.12 * (1 + 0.3 * beat)
            dr.ellipse(((cx - hr) * s, (cy - hr) * s, (cx + hr) * s, (cy + hr) * s), fill=col((255, 235, 200), app))
        img = L.screen(img, L.glow_layer(emb, blur=16))
        # months ring 1..9
        months = min(9, int(1 + (ot - 143) / ((156.5 - 143) / 9))) if ot >= 143 else 0
        def ring(dr, s):
            for i in range(9):
                a = -math.pi / 2 + i * 2 * math.pi / 9; px = cx + R_ * 1.12 * math.cos(a); py = cy + R_ * 1.12 * math.sin(a); r = 9 * U
                on = i < months
                dr.ellipse(((px - r) * s, (py - r) * s, (px + r) * s, (py + r) * s), fill=col(GOLD, 0.9 if on else 0.15))
        img = L.screen(img, L.glow_layer(ring, blur=6))
        if months:
            img = L.paste_center(img, L.serif_text(("Month %d" % months) if ot < 150.8 else "9 months · 10 days", 44, GOLD, 3), cx, cy + R_ * 1.32, alpha=sm(143, 144, ot))
    born = math.exp(-((ot - 156.6) / 0.5) ** 2)
    if born > 0.02: img = Image.blend(img, Image.new("RGB", (W, H), (255, 240, 220)), min(0.8, born * 0.8))
    return img

# ---------------------------------------------------------------- weight and time: hourglass, clock, soil
def weight_time(t, d, ot):
    W, H, U = L.W, L.H, L.U
    img = cached("wt_bg", lambda: L.rgrad(W / 2, H * 0.45, (40, 34, 26), (10, 8, 7), max(W, H) * 0.7)).copy()
    cx, cy = W / 2, H * (0.42 if L.PORTRAIT else 0.46); R_ = min(W, H) * 0.36
    lay = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(lay)
    # clock face behind
    dr.ellipse((cx - R_, cy - R_, cx + R_, cy + R_), outline=col(GOLD, 0.35), width=max(1, int(3 * U)))
    for i in range(12):
        a = i * math.pi / 6; r1, r2 = R_ * 0.9, R_ * (0.82 if i % 3 else 0.76)
        dr.line((cx + r1 * math.sin(a), cy - r1 * math.cos(a), cx + r2 * math.sin(a), cy - r2 * math.cos(a)), fill=col(GOLD, 0.45), width=max(1, int(3 * U)))
    for ln, sp, wd in [(0.55, 0.05, 6), (0.78, 0.6, 3)]:
        a = ot * sp; dr.line((cx, cy, cx + R_ * ln * math.sin(a), cy - R_ * ln * math.cos(a)), fill=col(GOLD, 0.5), width=max(1, int(wd * U)))
    # hourglass
    hw, hh = R_ * 0.42, R_ * 0.72; glass = col((220, 230, 240), 0.55)
    dr.line((cx - hw, cy - hh, cx + hw, cy - hh), fill=col(GOLD, 0.9), width=max(2, int(8 * U)))
    dr.line((cx - hw, cy + hh, cx + hw, cy + hh), fill=col(GOLD, 0.9), width=max(2, int(8 * U)))
    for sgn in (-1, 1):
        dr.line((cx + sgn * hw * 0.9, cy - hh, cx + sgn * hw * 0.12, cy), fill=glass, width=max(1, int(3 * U)))
        dr.line((cx + sgn * hw * 0.12, cy, cx + sgn * hw * 0.9, cy + hh), fill=glass, width=max(1, int(3 * U)))
    p = (ot - 158.4) / 17.0; sand = (225, 180, 110)
    top_h = hh * 0.85 * (1 - 0.7 * p); bot_h = hh * 0.85 * (0.15 + 0.6 * p)
    tw_ = hw * 0.12 + (hw * 0.78) * (top_h / hh)
    dr.polygon([(cx - tw_ * 0.95, cy - top_h), (cx + tw_ * 0.95, cy - top_h), (cx + hw * 0.1, cy - 4 * U), (cx - hw * 0.1, cy - 4 * U)], fill=sand)
    bw = hw * 0.85
    dr.polygon([(cx - bw, cy + hh - 4 * U), (cx + bw, cy + hh - 4 * U), (cx + bw * 0.2, cy + hh - bot_h), (cx - bw * 0.2, cy + hh - bot_h)], fill=sand)
    rr = random.Random(int(ot * 30))
    for _ in range(30):
        yy = cy + rr.uniform(0, hh - bot_h); dr.ellipse((cx - 2 * U, yy - 2 * U, cx + 2 * U, yy + 2 * U), fill=sand)
    img = L.screen(img, L.add(lay.filter(ImageFilter.GaussianBlur(6 * U)), lay))
    # soil gathers into ground from 167 s ("because of the soil")
    so = sm(166.5, 172.0, ot)
    if so > 0:
        gl = Image.new("RGB", (W, H), (0, 0, 0)); gd = ImageDraw.Draw(gl)
        r2 = random.Random(3)
        for _ in range(int(900 * W / 1080)):
            x = r2.uniform(0, W); y0 = r2.uniform(-H * 0.2, H); yt = H * (0.9 + 0.1 * r2.random())
            y = lerp(y0, yt, so); s = r2.choice([2, 3, 4]) * U
            gd.ellipse((x - s, y - s, x + s, y + s), fill=col((150, 105, 60), 0.9))
        gd.rectangle((0, H * (1 - 0.08 * so), W, H), fill=(70, 48, 28))
        img = L.screen(img, gl)
    for a, b, txt in [(158.9, 166.7, "وزن اور وقت"), (167.4, 175.3, "مٹی")]:
        if a <= ot < b: img = L.paste_center(img, L.urdu(txt, 96), W / 2, H * 0.12, alpha=min(1, (ot - a) / 0.5, (b - ot) / 0.4))
    return img
