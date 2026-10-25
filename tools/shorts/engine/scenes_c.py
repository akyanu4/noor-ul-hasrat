"""Scenes, part C: the blessed malida, the closing glory, and the calm music pauses."""
import math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import lib as L
from lib import ease, sm, lerp, col, GOLD, WARM, IVORY
from scenes_a import cached
from scenes_b import label

# ---------------------------------------------------------------- shared: a wedding gathering at night with strings of lights
def wedding_bg():
    def mk():
        W, H, U = L.W, L.H, L.U
        img = L.rgrad(W / 2, H * 0.55, (58, 30, 34), (10, 6, 10), max(W, H) * 0.75)
        dr = ImageDraw.Draw(img)
        y0, y1 = (0.50, 0.66) if L.PORTRAIT else (0.70, 0.92)
        dr.rectangle((0, H * (y0 + 0.07), W, H), fill=(30, 18, 14))     # floor / dastarkhwan area
        dr.ellipse((W / 2 - W * 0.45, H * y0, W / 2 + W * 0.45, H * y1), fill=(120, 30, 34))   # red cloth
        dr.ellipse((W / 2 - W * 0.43, H * (y0 + 0.003), W / 2 + W * 0.43, H * (y1 - 0.003)), outline=(220, 170, 90), width=max(1, int(3 * U)))
        return img
    return cached("wedding", mk)

def garlands(dr, s, ot):
    W, H, U = L.W, L.H, L.U
    for row in range(3):
        y0 = H * (0.05 + 0.07 * row); sag = 60 * U
        n = 22
        for i in range(n + 1):
            x = W * i / n; y = y0 + sag * math.sin(math.pi * i / n) + 4 * U * math.sin(ot * 1.5 + i)
            tw = 0.6 + 0.4 * math.sin(ot * 3 + i * 1.3 + row)
            c = [(255, 210, 120), (255, 160, 180), (190, 230, 255)][(i + row) % 3]
            r = 5 * U; dr.ellipse(((x - r) * s, (y - r) * s, (x + r) * s, (y + r) * s), fill=col(c, tw))

def pot_pos(): return L.W / 2, L.H * (0.56 if L.PORTRAIT else 0.68)
def draw_pot(dr, x, y, s, fill_level=1.0):
    """A brass degh, with malida heaped inside."""
    w, h = 260 * s, 150 * s
    dr.ellipse((x - w, y - h * 0.35, x + w, y + h * 0.35), fill=(150, 104, 40))
    dr.chord((x - w, y - h * 1.3, x + w, y + h * 1.0), 0, 180, fill=(176, 126, 52))
    dr.ellipse((x - w * 0.92, y - h * 0.30, x + w * 0.92, y + h * 0.26), fill=(196, 150, 80))
    if fill_level > 0:
        dr.ellipse((x - w * 0.86, y - h * 0.26 - 26 * s * fill_level, x + w * 0.86, y + h * 0.18), fill=(214, 168, 96))
        r = random.Random(5)
        for _ in range(40):
            px = x + r.uniform(-0.75, 0.75) * w; py = y - r.uniform(0, 0.25) * h - 18 * s * fill_level
            dr.ellipse((px - 7 * s, py - 4 * s, px + 7 * s, py + 4 * s), fill=(110, 56, 30))   # dates
    dr.ellipse((x - w, y - h * 0.35, x + w, y + h * 0.35), outline=(240, 200, 120), width=max(1, int(4 * s)))

# ---------------------------------------------------------------- the malida is prepared and presented
def malida_prep(t, d, ot):
    W, H, U = L.W, L.H, L.U
    img = wedding_bg().copy()
    img = L.screen(img, L.glow_layer(lambda dr, s: garlands(dr, s, ot), blur=6, strength=1.2))
    s = min(W, H) / 1080 * (0.95 if L.PORTRAIT else 0.9)
    px, py = pot_pos()
    show = sm(591.3, 593.0, ot)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dr = ImageDraw.Draw(lay)
    if show > 0:
        draw_pot(dr, px, py, s, fill_level=sm(599.5, 618.0, ot))
        # dates fall in (599 s)
        r = random.Random(9)
        for i in range(24):
            a0 = 599.4 + i * 0.35; p = (ot - a0) / 0.9
            if 0 <= p <= 1:
                x = px + r.uniform(-120, 120) * s; y = lerp(-H * 0.05, py - 30 * s, ease(p))
                dr.ellipse((x - 14 * s, y - 8 * s, x + 14 * s, y + 8 * s), fill=(120, 60, 32, 255))
        # ghee pours in a golden stream (611 s)
        if 610.9 <= ot < 617.5:
            a = min(1, (ot - 610.9) / 0.4, (617.5 - ot) / 0.4)
            dr.polygon([(px - 8 * s, 0), (px + 8 * s, 0), (px + 4 * s, py - 40 * s), (px - 4 * s, py - 40 * s)], fill=(250, 210, 90, int(230 * a)))
        # mixing swirl (617 - 624 s)
        if 617.3 <= ot < 626.0:
            for k in range(3):
                a_ = ot * 3 + k * 2.1; rr = 120 * s * (0.4 + 0.2 * k)
                dr.arc((px - rr, py - rr * 0.25 - 26 * s, px + rr, py + rr * 0.25 - 26 * s), math.degrees(a_) % 360, (math.degrees(a_) + 120) % 360, fill=(255, 230, 160, 200), width=max(1, int(4 * s)))
    if show < 1:
        lay.putalpha(lay.getchannel("A").point(lambda v: int(v * show)))
    img = Image.alpha_composite(img.convert("RGBA"), lay).convert("RGB")
    # presented, and blessed: a soft light descends onto the pot (no hand is shown)
    bless = sm(635.6, 638.0, ot)
    if bless > 0:
        def light(dr2, s2):
            dr2.polygon([((px - 60 * s) * s2, 0), ((px + 60 * s) * s2, 0), ((px + 240 * s) * s2, py * s2), ((px - 240 * s) * s2, py * s2)], fill=col((255, 245, 210), 0.20 * bless))
            for k, a in [(2.4, 0.15), (1.4, 0.35)]:
                rr = 200 * s * k; dr2.ellipse(((px - rr) * s2, (py - rr * 0.4 - 30 * s) * s2, (px + rr) * s2, (py + rr * 0.4 - 30 * s) * s2), fill=col((255, 230, 160), a * bless))
        img = L.screen(img, L.glow_layer(light, blur=30))
    # ten people are called (651 s)
    tenon = sm(651.0, 655.0, ot)
    if tenon > 0: img = seat_ring(img, 10, tenon, 0)
    return label(img, "ملیدہ", ot, 591.3, 599.0, 110, 0.20)

def seat_ring(img, n, alpha, rot):
    W, H, U = L.W, L.H, L.U
    px, py = pot_pos(); rx, ry = W * (0.38 if L.PORTRAIT else 0.30), H * (0.06 if L.PORTRAIT else 0.13)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dr = ImageDraw.Draw(lay)
    pts = []
    for i in range(n):
        a = rot + 2 * math.pi * i / n; pts.append((math.sin(a), px + rx * math.cos(a), py + ry * math.sin(a) + 30 * U))
    for depth, x, y in sorted(pts):
        sc = 0.75 + 0.35 * (depth + 1) / 2
        L.seated(dr, x, y, 130 * U * sc, (78, 52, 44, int(255 * alpha)))
    return Image.alpha_composite(img.convert("RGBA"), lay).convert("RGB")

# ---------------------------------------------------------------- the feast: ten by ten, three hundred, nothing missing
def malida_feast(t, d, ot):
    W, H, U = L.W, L.H, L.U
    img = wedding_bg().copy()
    img = L.screen(img, L.glow_layer(lambda dr, s: garlands(dr, s, ot), blur=6, strength=1.2))
    s = min(W, H) / 1080 * (0.95 if L.PORTRAIT else 0.9); px, py = pot_pos()
    lay = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(lay); draw_pot(dr, px, py, s, 1.0)
    m = lay.convert("L").point(lambda v: 255 if v > 0 else 0); img.paste(lay, (0, 0), m)
    # groups of ten come and go; the count climbs to 300 by 717.7 s
    T0, T1 = 669.2, 717.7
    count = 10 if ot < T0 else min(300, 10 + int((ot - T0) / (T1 - T0) * 290 / 10) * 10)
    group_t = ((ot - T0) / ((T1 - T0) / 29)) % 1 if T0 <= ot < T1 else 0.5
    alpha = min(1, group_t / 0.25, (1 - group_t) / 0.25) if T0 <= ot < T1 else 1.0
    img = seat_ring(img, 10, max(0.15, alpha), 0.3 * int((ot - T0) / ((T1 - T0) / 29)) if ot >= T0 else 0)
    # the blessing at the centre keeps coming (694 - 699 s and on)
    centre = sm(692.0, 694.5, ot)
    def bl(dr2, s2):
        for k, a in [(2.2, 0.12), (1.2, 0.3)]:
            rr = 160 * s * k; dr2.ellipse(((px - rr) * s2, (py - rr * 0.35 - 30 * s) * s2, (px + rr) * s2, (py + rr * 0.35 - 30 * s) * s2), fill=col((255, 230, 160), a * (0.4 + 0.6 * centre)))
        if ot >= 697.5:
            r = random.Random(1)
            for i in range(40):
                ph = r.random(); sp = r.uniform(0.25, 0.5); p_ = (ph + (ot - 697.5) * sp) % 1
                x = px + r.uniform(-140, 140) * s; y = py - 40 * s - p_ * H * 0.45
                rr = 4 * U; dr2.ellipse(((x - rr) * s2, (y - rr) * s2, (x + rr) * s2, (y + rr) * s2), fill=col(WARM, math.sin(math.pi * p_)))
    img = L.screen(img, L.glow_layer(bl, blur=12))
    # the counter
    big = ot >= T1
    f = L.font(L.BOLD, (170 if big else 120) * U)
    txt = str(count)
    cim = Image.new("RGBA", (int(700 * U), int(260 * U)), (0, 0, 0, 0)); cd = ImageDraw.Draw(cim)
    tw = cd.textlength(txt, font=f); cd.text(((cim.width - tw) / 2, 10 * U), txt, font=f, fill=GOLD + (255,), stroke_width=int(6 * U), stroke_fill=(40, 20, 0))
    lab = "PEOPLE ATE" ; f2 = L.font(L.BOLD, 44 * U); tw2 = cd.textlength(lab, font=f2)
    cd.text(((cim.width - tw2) / 2, cim.height - 60 * U), lab, font=f2, fill=(255, 255, 255), stroke_width=int(4 * U), stroke_fill=(0, 0, 0))
    img = L.paste_center(img, cim, W / 2, H * (0.26 if L.PORTRAIT else 0.30), alpha=sm(669.2, 670.0, ot), scale=1 + 0.06 * math.exp(-((ot - T1) / 0.4) ** 2))
    return img

# ---------------------------------------------------------------- closing: "What is their connection with Allah? What glory!"
def glory(t, d, ot):
    W, H, U = L.W, L.H, L.U
    img = cached("gl_bg", lambda: L.rgrad(W / 2, H * 0.42, (40, 54, 40), (6, 10, 10), max(W, H) * 0.75)).copy()
    def rays(dr, s):
        cx, cy = W / 2, H * 0.40
        for i in range(24):
            a = 2 * math.pi * i / 24 + ot * 0.03
            dr.polygon([(cx * s, cy * s), ((cx + W * math.cos(a - 0.02)) * s, (cy + W * math.sin(a - 0.02)) * s), ((cx + W * math.cos(a + 0.02)) * s, (cy + W * math.sin(a + 0.02)) * s)], fill=col((255, 230, 170), 0.07))
        L.draw_motes(dr, ot, s, seed=23, n=70)
    img = L.screen(img, L.glow_layer(rays, blur=10))
    img = L.paste_center(img, L.urdu("اللہ اکبر", 190), W / 2, H * 0.40, alpha=sm(739.4, 740.6, ot) * (1 - sm(754.5, 755.8, ot)))
    img = L.paste_center(img, L.urdu("سبحان اللہ", 190), W / 2, H * 0.40, alpha=sm(756.0, 757.2, ot))
    return img

# ---------------------------------------------------------------- calm music pauses
def lantern(dr, s, cx, top, sc, t):
    U = L.U; metal = (150, 118, 60)
    dr.line((cx * s, 0, cx * s, top * s), fill=col(metal, 0.8), width=max(1, int(3 * U * s)))
    body = [(cx - 40 * sc, top + 40 * sc), (cx + 40 * sc, top + 40 * sc), (cx + 95 * sc, top + 170 * sc), (cx + 70 * sc, top + 330 * sc), (cx - 70 * sc, top + 330 * sc), (cx - 95 * sc, top + 170 * sc)]
    f = 0.85 + 0.15 * math.sin(t * 5 + cx)
    dr.polygon([(x * s, y * s) for x, y in body], fill=col((255, 196, 110), f))
    dr.line([(x * s, y * s) for x, y in body + body[:1]], fill=col(metal, 0.9), width=max(1, int(5 * sc * s)))
    dr.line((cx * s, (top + 40 * sc) * s, cx * s, (top + 330 * sc) * s), fill=col(metal, 0.8), width=max(1, int(4 * sc * s)))
    dr.line(((cx - 95 * sc) * s, (top + 170 * sc) * s, (cx + 95 * sc) * s, (top + 170 * sc) * s), fill=col(metal, 0.8), width=max(1, int(4 * sc * s)))
    dr.polygon([((cx - 30 * sc) * s, top * s), ((cx + 30 * sc) * s, top * s), ((cx + 50 * sc) * s, (top + 40 * sc) * s), ((cx - 50 * sc) * s, (top + 40 * sc) * s)], fill=col(metal, 0.9))
    dr.polygon([((cx - 70 * sc) * s, (top + 330 * sc) * s), ((cx + 70 * sc) * s, (top + 330 * sc) * s), (cx * s, (top + 400 * sc) * s)], fill=col(metal, 0.9))

def calm(t, d, ot, style, text):
    W, H, U = L.W, L.H, L.U
    ot = t if ot is None else ot
    if style == "dome":
        def mk():
            img = L.draw_stars(L.vgrad([(0, (6, 18, 26)), (1, (16, 50, 42))]), 0, seed=61, n=int(260 * W / 1080), ymax=0.7, tw=False)
            dr = ImageDraw.Draw(img); s = min(W, H) / 1080; b = H * 0.86; cx = W / 2
            dr.rectangle((cx - 300 * s, b - 120 * s, cx + 300 * s, b + 200 * s), fill=(8, 22, 18))
            L.dome(dr, cx, b - 120 * s, 360 * s, 260 * s, (30, 110, 70))
            L.minaret(dr, cx + 380 * s, b + 200 * s, b - 520 * s, 46 * s, (8, 22, 18)); L.minaret(dr, cx - 380 * s, b + 200 * s, b - 420 * s, 40 * s, (8, 22, 18))
            return img
        img = cached("calm_dome", mk).copy()
    elif style == "garden":
        def mk():
            img = L.vgrad([(0, (255, 236, 190)), (0.45, (180, 200, 140)), (1, (40, 80, 50))])
            dr = ImageDraw.Draw(img)
            for i, (y, c) in enumerate([(0.62, (90, 130, 80)), (0.72, (60, 100, 60)), (0.84, (36, 70, 42))]):
                pts = [(x, H * y + 40 * U * math.sin(x / (W * 0.18) + i * 2)) for x in range(0, W + 20, 20)]
                dr.polygon(pts + [(W, H), (0, H)], fill=c)
            return img.filter(ImageFilter.GaussianBlur(3 * U))
        img = cached("calm_garden", mk).copy()
    else:   # lanterns / stars
        img = cached("calm_dark", lambda: L.rgrad(W / 2, H * 0.4, (16, 40, 36), (4, 10, 10), max(W, H) * 0.7)).copy()
    def lights(dr, s):
        if style == "lanterns":
            xs = [0.22, 0.5, 0.78] if not L.PORTRAIT else [0.2, 0.5, 0.8]
            for i, x in enumerate(xs): lantern(dr, s, W * x, H * (0.10 + 0.08 * (i % 2)), U * (1.0 if i == 1 else 0.7), ot)
        L.draw_motes(dr, ot, s, seed=29, n=80, color=WARM if style != "garden" else (255, 255, 230))
    img = L.screen(img, L.glow_layer(lights, blur=10 if style == "lanterns" else 5))
    a = sm(0.5, 1.5, t) * (1 - sm(d - 1.0, d - 0.2, t))
    ty = H * (0.42 if style != "lanterns" else 0.62) if not L.PORTRAIT else H * (0.40 if style != "lanterns" else 0.60)
    if text: img = L.paste_center(img, L.urdu(text, 150), W / 2, ty, alpha=a, scale=0.96 + 0.04 * t / d)
    return img
