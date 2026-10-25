"""Scenes, part B: death & Barzakh, the graves, the window of Paradise, sins, Hashr, the scale, intercession, faith."""
import math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import lib as L
from lib import ease, sm, lerp, col, GOLD, WARM, IVORY
from scenes_a import cached

def label(img, txt, ot, a, b, size=100, y=0.13):
    if a <= ot < b: return L.paste_center(img, L.urdu(txt, size), L.W / 2, L.H * y, alpha=min(1, (ot - a) / 0.5, (b - ot) / 0.4))
    return img

def night_sky(key, top=(8, 14, 30), bottom=(18, 34, 44), seed=31):
    return cached(key, lambda: L.draw_stars(L.vgrad([(0, top), (1, bottom)]), 0, seed=seed, n=int(300 * L.W / 1080), ymax=0.7, tw=False))

def moon(dr, s, x, y, r):
    for k, a in [(3, 0.08), (1.8, 0.2), (1.0, 0.95)]:
        dr.ellipse(((x - r * k) * s, (y - r * k) * s, (x + r * k) * s, (y + r * k) * s), fill=col((245, 235, 205), a))

# ---------------------------------------------------------------- death: the soul rises, the body rests, Barzakh
SOULPOS = [None]
def death_barzakh(t, d, ot):
    W, H, U = L.W, L.H, L.U; SOULPOS[0] = None
    tilt = sm(192.0, 200.0, ot)                     # camera rises into the vastness of Barzakh
    img = night_sky("db_sky").copy()
    gy = H * (0.78 + 0.5 * tilt)
    dr = ImageDraw.Draw(img)
    if gy < H: dr.rectangle((0, gy, W, H), fill=(16, 22, 18))
    r = random.Random(2)
    for i in range(int(60 * W / 1080)):            # grass silhouette
        x = r.uniform(0, W); hgt = r.uniform(8, 26) * U
        dr.polygon([(x - 3 * U, gy + 2), (x, gy - hgt), (x + 3 * U, gy + 2)], fill=(16, 22, 18))
    mound = sm(181.5, 186.0, ot)                    # the grave
    if mound > 0:
        mx = W / 2; mw = min(W, H) * 0.26
        dr.ellipse((mx - mw, gy - mw * 0.22 * mound, mx + mw, gy + mw * 0.22), fill=(48, 38, 26))
        hs = mw * 0.28; dr.rounded_rectangle((mx + mw * 0.55 - hs * 0.3, gy - hs * mound, mx + mw * 0.55 + hs * 0.3, gy), radius=int(hs * 0.3), fill=(60, 58, 52))
    rise = sm(176.5, 181.0, ot)
    def lights(dr2, s):
        moon(dr2, s, W * 0.8, H * (0.16 + 0.4 * tilt), 34 * U)
        if 175.5 <= ot:
            oy = lerp(gy - 10 * U, H * 0.25, ease(rise)) + 30 * U * math.sin(ot) * rise
            ox = W / 2 + 40 * U * math.sin(ot * 0.6) * rise
            if tilt > 0: oy = lerp(oy, H * 0.45, tilt); ox = lerp(ox, W / 2 + W * 0.25 * math.sin((ot - 192) * 0.15), tilt)
            SOULPOS[0] = (ox, oy)
        if tilt > 0:   # vast misty realm
            for i in range(7):
                y = H * (0.2 + 0.1 * i) + 18 * U * math.sin(ot * 0.25 + i)
                x0 = (ot * 12 * U * (1 if i % 2 else -1)) % (W * 0.6) - W * 0.3
                dr2.ellipse(((x0 - W * 0.3) * s, (y - 40 * U) * s, (x0 + W * 1.6) * s, (y + 40 * U) * s), fill=col((120, 140, 180), 0.16 * tilt))
    img = L.screen(img, L.glow_layer(lights, blur=22))
    if SOULPOS[0]:   # the soul, as a figure of light, rising from the body
        from scenes_a import soul_light
        img = soul_light(img, SOULPOS[0][0], SOULPOS[0][1], H * 0.15 * (1 - 0.25 * tilt), min(1, (ot - 175.5) / 0.8))
    return label(img, "برزخ", ot, 193.5, 205.0)

# ---------------------------------------------------------------- the graves: "As-salamu alaykum, O people of the graves"
def graves(t, d, ot):
    W, H, U = L.W, L.H, L.U
    def base():
        img = night_sky("gr_sky", (10, 14, 28), (26, 36, 40), 41).copy(); dr = ImageDraw.Draw(img)
        gy = H * 0.74; dr.rectangle((0, gy, W, H), fill=(14, 18, 16))
        r = random.Random(8)
        for row, (yy, sc) in enumerate([(gy + 10 * U, 0.7), (gy + 60 * U, 0.9), (gy + 130 * U, 1.15)]):
            n = int((7 + row * 2) * W / 1080) + 3
            for i in range(n):
                x = (i + 0.5 + r.uniform(-0.3, 0.3)) * W / n; hs = r.uniform(50, 80) * U * sc; ws = hs * 0.45
                c = (34 + row * 6, 36 + row * 6, 34 + row * 6)
                dr.ellipse((x - ws * 2.2, yy - ws * 0.35, x + ws * 2.2, yy + ws * 0.35), fill=(26, 24, 18))
                if r.random() < 0.5: dr.rounded_rectangle((x - ws / 2, yy - hs, x + ws / 2, yy), radius=int(ws / 2), fill=c)
                else: dr.polygon([(x - ws / 2, yy), (x - ws / 2, yy - hs * 0.75), (x, yy - hs), (x + ws / 2, yy - hs * 0.75), (x + ws / 2, yy)], fill=c)
        for x in (W * 0.08, W * 0.93):   # cypress trees
            dr.ellipse((x - 40 * U, gy - 360 * U, x + 40 * U, gy + 10 * U), fill=(10, 16, 14))
        return img
    img = cached("graves", base).copy()
    def lit(dr, s):
        moon(dr, s, W * 0.18, H * 0.16, 30 * U)
        r = random.Random(4)
        for i in range(int(6 * W / 1080) + 3):
            x = r.uniform(0.1, 0.9) * W; y = H * r.uniform(0.70, 0.85); f = 0.7 + 0.3 * math.sin(ot * 7 + i * 3) * math.sin(ot * 3 + i)
            for k, a in [(3, 0.1), (1.6, 0.3), (1, 0.9)]:
                rr = 8 * U * k; dr.ellipse(((x - rr) * s, (y - rr * 1.3) * s, (x + rr) * s, (y + rr * 1.3) * s), fill=col((255, 190, 100), a * f))
        L.draw_motes(dr, ot, s, seed=12, n=40, color=(200, 255, 170))
    img = L.screen(img, L.glow_layer(lit, blur=10))
    img = label(img, "السلام علیکم یا اہل القبور", ot, 209.6, 220.4, 92, 0.30)
    return img

# ---------------------------------------------------------------- the window of Paradise opens
def window(t, d, ot):
    W, H, U = L.W, L.H, L.U
    img = cached("win_bg", lambda: L.rgrad(W / 2, H * 0.5, (30, 26, 22), (6, 5, 5), max(W, H) * 0.6)).copy()
    op = sm(266.0, 274.0, ot)
    cx, cy = W / 2, H * 0.44; ww, wh = min(W, H) * 0.24, min(W, H) * 0.42
    lay = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(lay)
    # light and a garden glimpse through the opening
    if op > 0:
        g = L.vgrad([(0, (255, 244, 210)), (0.6, (190, 230, 160)), (1, (90, 150, 90))], int(ww * 2), int(wh * 2))
        m = Image.new("L", g.size, 0); md = ImageDraw.Draw(m)
        md.rectangle((0, wh * 0.6, ww * 2, wh * 2), fill=255); md.ellipse((0, 0, ww * 2, wh * 1.2), fill=255)
        lay.paste(Image.eval(g, lambda v: int(v * op)), (int(cx - ww), int(cy - wh)), m)
        dr.polygon([(cx - ww, cy + wh), (cx + ww, cy + wh), (cx + ww * 2.6, H), (cx - ww * 2.6, H)], fill=col((255, 230, 170), 0.16 * op))
        for i in range(5):
            x0 = cx - ww + (i + 0.5) * ww * 2 / 5
            dr.line((x0, cy + wh, cx + (x0 - cx) * 2.6, H), fill=col((255, 240, 200), 0.12 * op), width=max(1, int(10 * U)))
    # shutters swinging open
    for sgn in (-1, 1):
        sw = ww * (1 - 0.85 * op)
        x0 = cx + sgn * ww; x1 = x0 - sgn * sw
        dr.polygon([(x0, cy - wh * 0.4), (x1, cy - wh * 0.4 - 10 * U * op), (x1, cy + wh + 10 * U * op), (x0, cy + wh)], fill=(70, 46, 26), outline=col(GOLD, 0.5))
    dr.arc((cx - ww - 8 * U, cy - wh - 8 * U, cx + ww + 8 * U, cy + wh * 0.2 + 8 * U), 180, 360, fill=col(GOLD, 0.8), width=max(2, int(6 * U)))
    dr.line((cx - ww - 8 * U, cy - wh * 0.4, cx - ww - 8 * U, cy + wh), fill=col(GOLD, 0.8), width=max(2, int(6 * U)))
    dr.line((cx + ww + 8 * U, cy - wh * 0.4, cx + ww + 8 * U, cy + wh), fill=col(GOLD, 0.8), width=max(2, int(6 * U)))
    img = L.screen(img, L.add(lay.filter(ImageFilter.GaussianBlur(14 * U)), lay))
    img = L.screen(img, L.glow_layer(lambda dr2, s: L.draw_motes(dr2, ot, s, seed=15, n=40), blur=5, strength=op))
    return img

# ---------------------------------------------------------------- sins and the grave: storm, a single lamp
def sins(t, d, ot):
    W, H, U = L.W, L.H, L.U
    img = cached("sins_bg", lambda: L.vgrad([(0, (14, 16, 22)), (0.7, (22, 24, 30)), (1, (8, 8, 10))])).copy()
    dr = ImageDraw.Draw(img)
    for i in range(6):   # slow clouds
        y = H * (0.08 + 0.06 * i); x0 = (ot * 10 * U * (1 + i * 0.3)) % (W * 1.5) - W * 0.5
        dr.ellipse((x0, y - 40 * U, x0 + W * 0.7, y + 60 * U), fill=(28 + i * 3, 30 + i * 3, 38 + i * 3))
    img = img.filter(ImageFilter.GaussianBlur(10 * U))
    warm = sm(342.0, 345.5, ot)
    def lamp(dr2, s):
        r = random.Random(int(ot * 24))
        for _ in range(int(140 * W / 1080)):    # rain, easing as the dua comes
            x = r.uniform(0, W); y = r.uniform(0, H)
            dr2.line((x * s, y * s, (x - 6 * U) * s, (y + 34 * U) * s), fill=col((140, 160, 190), 0.35 * (1 - warm)), width=1)
        lx, ly = W / 2, H * (0.70 if not L.PORTRAIT else 0.64)
        fl = 1 + 0.12 * math.sin(ot * 13) * math.sin(ot * 7.3)
        for k, a in [(10 + 8 * warm, 0.06 + 0.06 * warm), (4, 0.18), (1.6, 0.6), (1, 1.0)]:
            rr = 24 * U * k * fl; dr2.ellipse(((lx - rr * 0.6) * s, (ly - rr * 1.5) * s, (lx + rr * 0.6) * s, (ly + rr * 0.4) * s), fill=col((255, 190, 100), a))
        dr2.ellipse(((lx - 70 * U) * s, (ly + 6 * U) * s, (lx + 70 * U) * s, (ly + 40 * U) * s), fill=col((120, 80, 40), 0.9))
    img = L.screen(img, L.glow_layer(lamp, blur=12))
    flash = sum(math.exp(-((ot - x) / 0.08) ** 2) for x in (316.2, 316.6, 321.4))
    if flash > 0.02: img = Image.blend(img, Image.new("RGB", (W, H), (210, 220, 255)), min(0.45, flash * 0.45))
    return img

# ---------------------------------------------------------------- Hashr: the vast plain
def hashr(t, d, ot):
    W, H, U = L.W, L.H, L.U
    img = cached("hashr_bg", lambda: L.vgrad([(0, (60, 36, 20)), (0.5, (170, 110, 60)), (0.62, (210, 150, 90)), (1, (40, 26, 16))])).copy()
    hy = H * 0.62
    def sun(dr, s):
        r = min(W, H) * 0.13; x, y = W / 2, H * 0.40
        for k, a in [(3.5, 0.10), (2.2, 0.22), (1.4, 0.5), (1.0, 1.0)]:
            dr.ellipse(((x - r * k) * s, (y - r * k) * s, (x + r * k) * s, (y + r * k) * s), fill=col((255, 236, 190), a))
    img = L.screen(img, L.glow_layer(sun, blur=30))
    lay = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(lay)
    gather = sm(357.8, 368.0, ot); souls_on = sm(362.3, 365.0, ot)
    r = random.Random(6)
    for i in range(int(1600 * W / 1080)):
        depth = r.random() ** 1.6; y = hy + depth * (H - hy) * 0.95; x0 = r.uniform(-0.2, 1.2) * W
        x = lerp(x0, W / 2 + (x0 - W / 2) * 0.55, gather * (1 - depth) * 0.6)
        sz = (1.5 + 7 * depth) * U
        c = (int(lerp(30, 255, souls_on)), int(lerp(22, 230, souls_on)), int(lerp(16, 180, souls_on)))
        dr.ellipse((x - sz * 0.5, y - sz * 1.6, x + sz * 0.5, y), fill=c)
    img = L.screen(img, lay) if souls_on > 0.05 else Image.composite(Image.new("RGB", (W, H), (30, 22, 16)), img, lay.convert("L").point(lambda v: 255 if v > 10 else 0))
    if ot >= 371.0:   # a faint balance appears in the sky as deeds are weighed
        a = sm(371, 373, ot)
        def bal(dr2, s):
            x, y, w = W / 2, H * 0.30, min(W, H) * 0.22
            dr2.line(((x - w) * s, y * s, (x + w) * s, y * s), fill=col(WARM, a), width=max(1, int(5 * U * s)))
            dr2.line((x * s, (y - w * 0.3) * s, x * s, (y + w * 0.5) * s), fill=col(WARM, a), width=max(1, int(5 * U * s)))
            for sx in (-1, 1): dr2.arc(((x + sx * w - w * 0.25) * s, (y + w * 0.05) * s, (x + sx * w + w * 0.25) * s, (y + w * 0.35) * s), 0, 180, fill=col(WARM, a), width=max(1, int(4 * U * s)))
        img = L.screen(img, L.glow_layer(bal, blur=8))
    return label(img, "میدانِ حشر", ot, 357.8, 366.0, 100, 0.12)

# ---------------------------------------------------------------- the scale of deeds
DEEDS = [(377.3, "FARD"), (396.0, "SUNNAH"), (406.4, "NAFL"), (411.3, "TAHAJJUD")]
def scales(t, d, ot):
    W, H, U = L.W, L.H, L.U
    img = cached("sc_bg", lambda: L.rgrad(W / 2, H * 0.4, (26, 50, 44), (6, 12, 12), max(W, H) * 0.75)).copy()
    img = L.screen(img, L.glow_layer(lambda dr, s: L.draw_motes(dr, ot, s, seed=17, n=50), blur=5))
    cx, top = W / 2, H * (0.30 if L.PORTRAIT else 0.22); arm = min(W, H) * (0.27 if L.PORTRAIT else 0.42)
    weights = [0.0, 0.15, 0.27, 0.36, 0.48]
    k = sum(1 for a, _ in DEEDS if ot >= a + 0.8)
    wgt = weights[k] + (weights[min(4, k + 1)] - weights[k]) * 0
    target = weights[k] + 0.14 * sm(422.4, 423.6, ot)
    ang = 0.30 - target * 0.9 + 0.015 * math.sin(ot * 1.7) * (1 - k / 5)    # positive = right pan down; deeds go on the left, starting light
    lx, ly = cx - arm * math.cos(ang), top - arm * math.sin(ang); rx, ry = cx + arm * math.cos(ang), top + arm * math.sin(ang)
    lay = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(lay)
    gc = col(GOLD, 0.95); lw = max(2, int(8 * U))
    dr.line((cx, top - 30 * U, cx, top + arm * 1.25), fill=gc, width=lw); dr.polygon([(cx - 90 * U, top + arm * 1.25), (cx + 90 * U, top + arm * 1.25), (cx, top + arm * 1.05)], fill=gc)
    dr.line((lx, ly, rx, ry), fill=gc, width=lw); L.star8(dr, cx, top - 40 * U, 22 * U, fill=gc)
    pans = []
    for px, py in ((lx, ly), (rx, ry)):
        ch = arm * 0.55; pw = arm * 0.38
        dr.line((px, py, px - pw, py + ch), fill=gc, width=max(1, int(3 * U))); dr.line((px, py, px + pw, py + ch), fill=gc, width=max(1, int(3 * U)))
        dr.chord((px - pw, py + ch - pw * 0.4, px + pw, py + ch + pw * 0.4), 0, 180, fill=(120, 90, 40), outline=gc)
        pans.append((px, py + ch, pw))
    # the right pan holds a dark, unlabelled weight
    px, py, pw = pans[1]; dr.rounded_rectangle((px - pw * 0.45, py - pw * 0.55, px + pw * 0.45, py), radius=int(8 * U), fill=(50, 50, 56))
    img = L.screen(img, L.add(lay.filter(ImageFilter.GaussianBlur(8 * U)), lay))
    # deeds drop into the left pan as glowing blocks with labels
    px, py, pw = pans[0]; f = L.font(L.BOLD, pw * 0.19)
    stack = 0
    for i, (a, name) in enumerate(DEEDS):
        if ot < a: break
        fall = sm(a, a + 0.8, ot); bh = pw * 0.36; by = lerp(-H * 0.1, py - stack - bh, ease(fall)); stack += bh * 1.05
        bl = Image.new("RGBA", (int(pw * 1.3), int(bh)), (0, 0, 0, 0)); bd = ImageDraw.Draw(bl)
        bd.rounded_rectangle((0, 0, bl.width - 1, bl.height - 1), radius=int(8 * U), fill=(250, 214, 130, 255))
        tw = bd.textlength(name, font=f); bd.text(((bl.width - tw) / 2, bl.height * 0.18), name, font=f, fill=(60, 40, 10))
        g = Image.new("RGBA", (bl.width + 60, bl.height + 60), (0, 0, 0, 0)); g.paste(bl, (30, 30)); g2 = g.filter(ImageFilter.GaussianBlur(14 * U))
        img = L.paste_center(img, g2, px, by + bh / 2, alpha=0.8); img = L.paste_center(img, bl, px, by + bh / 2)
    if ot >= 422.4:
        a = sm(422.4, 423.6, ot)
        img = L.screen(img, L.glow_layer(lambda dr2, s: dr2.ellipse(((px - pw * 1.6) * s, (py - pw * 1.8) * s, (px + pw * 1.6) * s, (py + pw * 0.6) * s), fill=col((150, 255, 170), 0.35 * a)), blur=30))
    return label(img, "میزان", ot, 377.0, 386.5, 96, 0.15 if L.PORTRAIT else 0.10)

# ---------------------------------------------------------------- intercession: out of the fire, into the garden; "with the one you love"
def intercession(t, d, ot):
    W, H, U = L.W, L.H, L.U
    img = cached("ic_bg", lambda: L.vgrad([(0, (60, 70, 40)), (0.25, (40, 40, 26)), (0.6, (26, 10, 6)), (1, (60, 14, 4))])).copy()
    garden = 0.5 + 0.5 * sm(425.9, 429.0, ot)
    def top(dr, s):   # the garden's light above
        for i in range(10):
            x = W * (i + 0.5) / 10; y = H * 0.12 + 20 * U * math.sin(i * 1.7)
            r = (80 + 30 * math.sin(i * 2.3)) * U
            dr.ellipse(((x - r) * s, (y - r) * s, (x + r) * s, (y + r * 0.8) * s), fill=col((180, 255, 160), 0.18 * garden))
        dr.ellipse(((W / 2 - W * 0.4) * s, (-H * 0.1) * s, (W / 2 + W * 0.4) * s, (H * 0.25) * s), fill=col((255, 245, 200), 0.25 * garden))
    img = L.screen(img, L.glow_layer(top, blur=40))
    def fire(dr, s):
        base = H * 1.04; n = int(18 * W / 1080) + 8
        for i in range(n):
            x = W * (i + 0.5) / n + 10 * U * math.sin(ot * 2 + i); hgt = H * (0.20 + 0.08 * math.sin(ot * 3.1 + i * 1.9) + 0.04 * math.sin(ot * 7.3 + i))
            w = W / n * 1.5
            for k, (c, a) in enumerate([((230, 60, 20), 0.45), ((255, 140, 40), 0.55), ((255, 220, 130), 0.65)]):
                hh = hgt * (1 - k * 0.28); ww = w * (1 - k * 0.3) / 2
                dr.ellipse(((x - ww) * s, (base - hh) * s, (x + ww) * s, (base + hh * 0.3) * s), fill=col(c, a))
    img = L.screen(img, L.glow_layer(fire, blur=26, strength=1.15))
    # beams of light reach into the fire and lift sparks out
    lifts = [(431.8, 0.5), (465.1, 0.3), (469.6, 0.65), (471.5, 0.42), (473.0, 0.58), (479.6, 0.5)]
    def beams(dr, s):
        for a, xf in lifts:
            if ot < a: continue
            p = (ot - a) / 3.5
            if p > 1.3: continue
            x = W * xf; bw = 40 * U * (1 - max(0, p - 1) * 3)
            dr.polygon([((x - bw) * s, 0), ((x + bw) * s, 0), ((x + bw * 0.4) * s, H * s), ((x - bw * 0.4) * s, H * s)], fill=col((255, 250, 220), 0.22 * min(1, p * 3) * (1 - max(0, p - 1) * 3)))
            sy = lerp(H * 0.86, H * 0.12, ease(min(1, p)))
            for k, al in [(3, 0.15), (1.6, 0.4), (1, 1)]:
                r = 12 * U * k; dr.ellipse(((x - r) * s, (sy - r) * s, (x + r) * s, (sy + r) * s), fill=col((255, 245, 210), al))
    img = L.screen(img, L.glow_layer(beams, blur=10))
    # the hadith: "a person is with the one he loves"
    love = sm(440.0, 442.0, ot) * (1 - sm(461.5, 463.0, ot))
    if love > 0:
        def heart(dr, s):
            cx, cy = W / 2, H * 0.40; r = min(W, H) * 0.18 * (1 + 0.04 * math.sin(ot * 4))
            pts = [(cx + r * 16 * math.sin(a) ** 3 / 16, cy - r * (13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a)) / 16) for a in np.linspace(0, 2 * math.pi, 80)]
            dr.polygon([(x * s, y * s) for x, y in pts], fill=col((255, 140, 150), 0.35 * love))
        img = L.screen(img, L.glow_layer(heart, blur=30))
        img = L.paste_center(img, L.urdu("المرء مع من احب", 100), W / 2, H * 0.40, alpha=love)
    return img

# ---------------------------------------------------------------- Allah's grace
def grace(t, d, ot):
    W, H, U = L.W, L.H, L.U
    img = cached("gr_bg", lambda: L.rgrad(W / 2, H * 0.4, (34, 64, 54), (6, 14, 14), max(W, H) * 0.7)).copy()
    img = L.screen(img, L.glow_layer(lambda dr, s: L.draw_motes(dr, ot, s, seed=19, n=90, rise=False), blur=5))
    return L.paste_center(img, L.urdu("رحمت", 230), W / 2, H * 0.40, alpha=min(1, t / 0.8), scale=1 + 0.03 * t / d)

# ---------------------------------------------------------------- the masjid: people coming to pray
def masjid_scene(t, d, ot):
    W, H, U = L.W, L.H, L.U
    def base():
        img = L.draw_stars(L.vgrad([(0, (6, 16, 30)), (1, (18, 44, 46))]), 0, seed=51, n=int(300 * W / 1080), ymax=0.6, tw=False)
        dr = ImageDraw.Draw(img); s = min(W, H) / 1080 * (0.75 if L.PORTRAIT else 0.85); b = H * 0.80
        L.masjid(dr, W / 2, b, s, (4, 12, 12), windows=(232, 186, 98)); dr.rectangle((0, b + 40 * s, W, H), fill=(4, 12, 12))
        return img
    img = cached("masjid", base).copy()
    def lt(dr, s):
        b = H * 0.80
        for i in range(7):
            x = W / 2 + (i - 3) * 120 * U * 0.85
            dr.rectangle(((x - 30 * U) * s, (b - 180 * U * 0.85) * s, (x + 30 * U) * s, (b - 40 * U) * s), fill=col((232, 186, 98), 0.5))
    img = L.screen(img, L.glow_layer(lt, blur=16))
    dr = ImageDraw.Draw(img); gy = H * 0.80 + 34 * U
    r = random.Random(2)
    for i in range(8):     # figures walking toward the masjid
        side = -1 if i % 2 else 1; st = r.uniform(0, 4); sp = r.uniform(0.04, 0.07)
        x = W / 2 + side * W * (0.55 - sp * max(0, ot - 491.7 - st) * 1.4)
        if abs(x - W / 2) < W * 0.08: continue
        L.person(dr, x, gy + r.uniform(0, 30) * U, r.uniform(70, 90) * U, (2, 6, 6))
    return label(img, "مسجد", ot, 493.5, 499.0, 100, 0.12)

# ---------------------------------------------------------------- Islam and Iman; the shahada; love of the Prophet ﷺ
def shahada(t, d, ot):
    W, H, U = L.W, L.H, L.U
    img = cached("sh_bg", lambda: L.rgrad(W / 2, H * 0.45, (16, 60, 46), (4, 14, 12), max(W, H) * 0.75)).copy()
    def pattern(dr, s):
        cx, cy = W / 2, H * 0.45; rot = ot * 0.05
        for ring, (rr, n) in enumerate([(160, 8), (300, 16), (460, 24)]):
            for i in range(n):
                a = 2 * math.pi * i / n + rot * (1 if ring % 2 else -1); x = cx + rr * U * math.cos(a); y = cy + rr * U * math.sin(a)
                L.star8(dr, x * s, y * s, (24 + ring * 6) * U * s, outline=col(GOLD, 0.35))
    img = L.screen(img, L.glow_layer(pattern, blur=4))
    cy = H * 0.42
    if 505.2 <= ot < 519.5:
        a1 = sm(505.3, 506.3, ot); a2 = sm(514.7, 515.7, ot)
        dx = (W * 0.22 if not L.PORTRAIT else 0); dy = (0 if not L.PORTRAIT else H * 0.10)
        img = L.paste_center(img, L.urdu("مومن", 150), W / 2 + dx, cy - dy, alpha=a1 * (1 - sm(513.5, 514.5, ot)))
        img = L.paste_center(img, L.urdu("اسلام", 150), W / 2 - dx, cy + dy, alpha=a2)
        img = L.paste_center(img, L.urdu("ایمان", 150), W / 2 + dx, cy - dy, alpha=sm(516.5, 517.5, ot))
    elif 519.5 <= ot < 527.9:
        img = L.paste_center(img, L.urdu("لا الٰہ الا اللہ", 130), W / 2, cy - 80 * U, alpha=sm(520.8, 521.8, ot))
        img = L.paste_center(img, L.urdu("محمد رسول اللہ", 130), W / 2, cy + 110 * U, alpha=sm(522.0, 523.0, ot))
    elif ot >= 527.9:
        def heart(dr, s):
            cx, cyy = W / 2, cy; r = min(W, H) * 0.22 * (1 + 0.04 * math.sin(ot * 3.5))
            pts = [(cx + r * math.sin(a) ** 3, cyy - r * (13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a)) / 16) for a in np.linspace(0, 2 * math.pi, 80)]
            dr.polygon([(x * s, y * s) for x, y in pts], fill=col((255, 200, 140), 0.35 * sm(527.9, 529, ot)))
        img = L.screen(img, L.glow_layer(heart, blur=30))
        img = L.paste_center(img, L.urdu("محمد", 190), W / 2, cy, alpha=sm(528.3, 529.3, ot))
    return img

# ---------------------------------------------------------------- the book of hadith being prepared
def book(t, d, ot):
    W, H, U = L.W, L.H, L.U
    img = cached("bk_bg", lambda: L.rgrad(W / 2, H * 0.35, (70, 52, 26), (8, 8, 6), max(W, H) * 0.65)).copy()
    cx, cy = W / 2, H * (0.50 if L.PORTRAIT else 0.55); s = min(W, H) / 1080 * (0.9 if L.PORTRAIT else 0.8)
    lay = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(lay)
    wood = (90, 52, 24); page = (238, 226, 196)
    dr.polygon([(cx - 520 * s, cy + 330 * s), (cx - 470 * s, cy + 330 * s), (cx + 80 * s, cy + 40 * s), (cx + 30 * s, cy + 40 * s)], fill=wood)
    dr.polygon([(cx + 520 * s, cy + 330 * s), (cx + 470 * s, cy + 330 * s), (cx - 80 * s, cy + 40 * s), (cx - 30 * s, cy + 40 * s)], fill=wood)
    for k in (-1, 1):
        pts = [(cx, cy + 60 * s), (cx + k * 600 * s, cy - 20 * s), (cx + k * 620 * s, cy - 330 * s), (cx, cy - 250 * s)]
        dr.polygon(pts, fill=page)
        for i in range(10):
            f = 0.12 + i * 0.08
            dr.line((cx + k * 40 * s, lerp(cy - 250 * s, cy + 60 * s, f), cx + k * 580 * s, lerp(cy - 330 * s, cy - 20 * s, f)), fill=(130, 104, 66), width=max(1, int(5 * s)))
    # a page turning every 6 s
    p = ((ot - 547.3) % 6.0) / 1.4
    if p < 1:
        e = ease(p); xtip = lerp(cx + 610 * s, cx - 610 * s, e); lift = math.sin(math.pi * e) * 120 * s
        dr.polygon([(cx, cy + 60 * s), (xtip, cy - 20 * s - lift), (xtip, cy - 330 * s - lift), (cx, cy - 250 * s)], fill=(250, 240, 214), outline=(180, 150, 100))
    img = L.screen(img, lay)
    img = L.screen(img, L.glow_layer(lambda d2, s2: d2.ellipse(((cx - 600 * s) * s2, (cy - 700 * s) * s2, (cx + 600 * s) * s2, (cy + 200 * s) * s2), fill=col((255, 200, 120), 0.18)), blur=80))
    return label(img, "احادیث", ot, 560.0, 567.0, 100, 0.10)
