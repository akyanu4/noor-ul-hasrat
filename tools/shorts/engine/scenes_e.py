"""'What is Islam, what is Iman': the Islam part keeps the Kalima; for Iman, a believer (face never shown) offers his own life,
his children, his family and his wealth, all streaming up in golden light to the Green Dome. The Prophet ﷺ is shown only as light."""
import math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import lib as L
import scenes_b as B
from scenes_a import cached

col, sm, ease, lerp = L.col, L.sm, L.ease, L.lerp
GOLD = (232, 192, 104); GREEN = (34, 128, 84); FIG = (64, 74, 70)
T0 = 527.6                       # the Iman part starts here
LIFE = (532.9, 535.7)            # "my life is a sacrifice"
ITEMS = [  # appear at, kind, x (fraction), base y (fraction), label
    (536.9, "children", 0.16, 0.665, "اولاد"),
    (538.0, "family", 0.84, 0.665, "گھر والے"),
    (539.2, "wealth", 0.12, 0.385, "مال"),
    (540.2, "house", 0.86, 0.385, "گھر"),
]
GIVE = 541.4                     # "all of it a sacrifice": everything streams to the Dome
FAITH = 545.4

def geo():
    W, H = L.W, L.H
    return dict(dx=W / 2, dbase=H * 0.30, dw=W * 0.40, bx=W / 2, bbase=H * 0.655, bh=H * 0.25)

def bg():
    W, H = L.W, L.H
    img = L.vgrad([(0, (14, 40, 40)), (0.45, (10, 26, 26)), (1, (20, 18, 12))])
    return L.draw_stars(img, 0, seed=91, n=int(220 * W / 1080), ymax=0.55, tw=False)

def green_dome(d, cx, base, w):
    """Gumbad-e-Khazra: a green dome on a drum, with a golden crescent finial."""
    dh = w * 0.62
    d.rectangle((cx - w * 0.46, base - w * 0.16, cx + w * 0.46, base + w * 0.10), fill=(24, 96, 64))
    for i in range(-3, 4):
        x = cx + i * w * 0.12; d.rounded_rectangle((x - w * 0.03, base - w * 0.12, x + w * 0.03, base + w * 0.02), radius=int(w * 0.03), fill=(232, 210, 150))
    d.ellipse((cx - w * 0.40, base - w * 0.16 - dh, cx + w * 0.40, base - w * 0.16 + dh * 0.35), fill=GREEN)
    d.ellipse((cx - w * 0.28, base - w * 0.16 - dh * 0.92, cx - w * 0.05, base - w * 0.16 - dh * 0.2), fill=(52, 156, 104))   # highlight
    top = base - w * 0.16 - dh
    d.line((cx, top, cx, top - w * 0.16), fill=GOLD, width=max(3, int(w * 0.018)))
    d.ellipse((cx - w * 0.035, top - w * 0.10, cx + w * 0.035, top - w * 0.03), fill=GOLD)
    r = w * 0.06; cyc = top - w * 0.20
    d.ellipse((cx - r, cyc - r, cx + r, cyc + r), fill=GOLD); d.ellipse((cx - r * 0.55, cyc - r * 1.05, cx + r * 0.95, cyc + r * 0.75), fill=(0, 0, 0, 0) if False else (14, 40, 40))

def dome_center(): g = geo(); return g["dx"], g["dbase"] - g["dw"] * 0.45

def heart_pts(cx, cy, r):
    return [(cx + r * math.sin(a) ** 3, cy - r * (13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a)) / 16) for a in np.linspace(0, 2 * math.pi, 60)]

def believer(d, ot, g):
    cx, base, h = g["bx"], g["bbase"], g["bh"]
    raise_ = sm(GIVE, GIVE + 1.0, ot)
    d.polygon([(cx - h * 0.22, base), (cx - h * 0.14, base - h * 0.74), (cx + h * 0.14, base - h * 0.74), (cx + h * 0.22, base)], fill=FIG)
    hr = h * 0.08; hy = base - h * 0.85
    d.ellipse((cx - hr, hy - hr, cx + hr, hy + hr * 1.1), fill=FIG)
    d.chord((cx - hr * 1.02, hy - hr * 1.15, cx + hr * 1.02, hy + hr * 0.2), 180, 360, fill=(236, 232, 220))   # white cap
    for side in (-1, 1):
        sx, sy = cx + side * h * 0.13, base - h * 0.70
        if side == 1:   # right hand on the heart, then raised with the left
            hx = lerp(cx + h * 0.02, cx + side * h * 0.34, raise_); hy2 = lerp(base - h * 0.58, base - h * 1.02, raise_)
        else:
            hx = lerp(cx - h * 0.16, cx + side * h * 0.34, raise_); hy2 = lerp(base - h * 0.30, base - h * 1.02, raise_)
        ex, ey = lerp(sx, hx, 0.5) + side * h * 0.08 * (1 - raise_), lerp(sy, hy2, 0.5)
        d.line([(sx, sy), (ex, ey), (hx, hy2)], fill=FIG, width=int(h * 0.075), joint="curve")
        r = h * 0.035; d.ellipse((hx - r, hy2 - r, hx + r, hy2 + r), fill=FIG)

def family_fig(d, kind, x, base, H):
    if kind == "children":
        for dx, hh in ((-0.05, 0.11), (0.05, 0.13)):
            L.person(d, x + dx * L.W, base, H * hh, FIG)
    else:   # a mother with a head covering, and an elder
        hh = H * 0.19; xx = x - 0.05 * L.W
        r = hh * 0.11
        d.polygon([(xx - hh * 0.20, base), (xx - hh * 0.13, base - hh * 0.80), (xx, base - hh * 1.0), (xx + hh * 0.13, base - hh * 0.80), (xx + hh * 0.20, base)], fill=FIG)
        d.ellipse((xx - r * 1.1, base - hh - r * 0.2, xx + r * 1.1, base - hh + r * 2.0), fill=FIG)
        L.person(d, x + 0.06 * L.W, base, H * 0.20, FIG)

def wealth(d, x, base, U):
    rnd = random.Random(4)
    for i in range(26):   # a pile of gold coins
        row = int((math.sqrt(8 * i + 1) - 1) / 2); k = i - row * (row + 1) // 2
        cx = x + (k - row / 2) * 34 * U + rnd.uniform(-4, 4) * U; cy = base - (6 - row) * 15 * U
        if row > 6: continue
        d.ellipse((cx - 22 * U, cy - 9 * U, cx + 22 * U, cy + 9 * U), fill=(200, 150, 50), outline=(255, 222, 120), width=max(1, int(3 * U)))
    d.ellipse((x + 70 * U, base - 150 * U, x + 170 * U, base - 10 * U), fill=(150, 104, 40))      # a money bag
    d.polygon([(x + 100 * U, base - 150 * U), (x + 140 * U, base - 150 * U), (x + 152 * U, base - 186 * U), (x + 88 * U, base - 186 * U)], fill=(150, 104, 40))
    d.ellipse((x + 104 * U, base - 96 * U, x + 136 * U, base - 64 * U), outline=(255, 222, 120), width=max(2, int(5 * U)))

def house(d, x, base, U):
    w, h = 190 * U, 130 * U
    d.rectangle((x - w / 2, base - h, x + w / 2, base), fill=(110, 86, 60))
    d.polygon([(x - w * 0.62, base - h), (x, base - h - 110 * U), (x + w * 0.62, base - h)], fill=(150, 70, 50))
    d.rectangle((x - 22 * U, base - 70 * U, x + 22 * U, base), fill=(60, 40, 26))
    for k in (-1, 1): d.rectangle((x + k * 55 * U - 20 * U, base - 100 * U, x + k * 55 * U + 20 * U, base - 66 * U), fill=(255, 220, 140))

def item_anchor(kind, x, base):
    H, U = L.H, L.U
    return (x, base - H * (0.10 if kind in ("children", "family") else 0.06)) if kind != "house" else (x, base - 120 * U)

def stream(dr, s, p0, p1, ot, start, seed, n=26, color=(255, 226, 150)):
    """Golden particles flowing along a curve from p0 up to p1."""
    f = ot - start
    if f <= 0: return
    rnd = random.Random(seed); (x0, y0), (x1, y1) = p0, p1
    cx, cy = (x0 + x1) / 2 + (x0 - L.W / 2) * 0.6, min(y0, y1) + (y0 - y1) * 0.25
    for i in range(n):
        u = (f * 0.45 + i / n + rnd.uniform(0, 0.05)) % 1.0
        x = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1; y = (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1
        r = (5 + 5 * math.sin(u * math.pi)) * L.U; a = min(1, f / 0.6) * (0.35 + 0.65 * math.sin(u * math.pi))
        dr.ellipse(((x - r) * s, (y - r) * s, (x + r) * s, (y + r) * s), fill=col(color, a))

def iman(t, d, ot):
    if ot < T0: return B.shahada(t, d, ot)
    W, H, U = L.W, L.H, L.U; g = geo()
    fade_in = sm(T0, T0 + 0.8, ot)
    img = cached("im_bg", bg).copy()
    img = L.screen(img, L.glow_layer(lambda dr, s: L.draw_motes(dr, ot, s, seed=29, n=50), blur=5))
    dcx, dcy = dome_center()
    give = sm(GIVE, GIVE + 1.2, ot)
    bright = 0.6 + 0.25 * sm(*LIFE, ot) + 0.35 * give + 0.08 * math.sin(ot * 2)
    # light around the Dome
    img = L.screen(img, L.glow_layer(lambda dr, s: [dr.ellipse(((dcx - g["dw"] * k) * s, (dcy - g["dw"] * k * 0.9) * s, (dcx + g["dw"] * k) * s, (dcy + g["dw"] * k * 0.9) * s), fill=col((210, 255, 220), a * bright * fade_in)) for k, a in ((1.3, 0.12), (0.9, 0.18), (0.6, 0.22))], blur=40))
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d0 = ImageDraw.Draw(lay)
    green_dome(d0, g["dx"], g["dbase"], g["dw"])
    if fade_in < 1: lay.putalpha(lay.getchannel("A").point(lambda v: int(v * fade_in)))
    rgba = img.convert("RGBA"); rgba.alpha_composite(lay); img = rgba.convert("RGB")
    # the believer's surroundings: family and wealth appear as they are named
    figs = Image.new("RGBA", (W, H), (0, 0, 0, 0)); fd = ImageDraw.Draw(figs)
    rims = []
    for a, kind, xf, bf, lab in ITEMS:
        if ot < a: continue
        x, base = W * xf, H * bf
        if kind in ("children", "family"): family_fig(fd, kind, x, base, H)
        elif kind == "wealth": wealth(fd, x, base, U)
        else: house(fd, x, base, U)
        rims.append((a, kind, x, base, lab))
    believer(fd, ot, g)
    alpha_mask = figs.getchannel("A")
    if fade_in < 1: figs.putalpha(alpha_mask.point(lambda v: int(v * fade_in)))
    # warm rim light behind every figure, so they read against the night
    rim = Image.new("RGB", (W, H), (0, 0, 0)); rim.paste((255, 214, 150), mask=figs.getchannel("A"))
    img = L.screen(img, L.add(rim.filter(ImageFilter.GaussianBlur(16 * U)), Image.new("RGB", (W, H))))
    rgba = img.convert("RGBA")
    # each new thing arrives with a soft flash
    rgba.alpha_composite(figs); img = rgba.convert("RGB")
    for a, kind, x, base, lab in rims:
        la = sm(a, a + 0.6, ot) * (1 - 0.6 * give)
        img = L.paste_center(img, L.urdu(lab, 56), x, base + 46 * U if kind != "wealth" else base + 40 * U, alpha=la)
    # his heart: glowing on his chest, then rising to the Dome ("my life is a sacrifice")
    hb = (g["bx"] + g["bh"] * 0.0, g["bbase"] - g["bh"] * 0.60)
    rise = ease(sm(LIFE[0], LIFE[1], ot))
    hx, hy = lerp(hb[0], dcx, rise), lerp(hb[1], dcy + g["dw"] * 0.1, rise)
    hr = g["bh"] * (0.07 + 0.02 * math.sin(ot * 3.5)) * (1 + 0.6 * rise)
    hal = fade_in * (1 - 0.7 * sm(LIFE[1] - 0.3, LIFE[1] + 0.6, ot))
    img = L.screen(img, L.glow_layer(lambda dr, s: dr.polygon([(x * s, y * s) for x, y in heart_pts(hx, hy, hr)], fill=col((255, 120, 130), 0.9 * hal)), blur=14))
    if ot < LIFE[0] + 0.2:   # a thread of love from his heart to the Dome
        img = L.screen(img, L.glow_layer(lambda dr, s: stream(dr, s, hb, (dcx, dcy), ot, T0 + 0.6, 7, n=18, color=(255, 170, 170)), blur=4))
    # "all of it a sacrifice": everything streams up in gold
    if ot >= GIVE:
        def all_streams(dr, s):
            for i, (a, kind, x, base, lab) in enumerate(rims):
                stream(dr, s, item_anchor(kind, x, base), (dcx, dcy), ot, GIVE + i * 0.25, 11 + i)
            stream(dr, s, (g["bx"], g["bbase"] - g["bh"] * 1.05), (dcx, dcy), ot, GIVE, 31, n=20)
        img = L.screen(img, L.glow_layer(all_streams, blur=5))
    # coins rise from his wealth once it is named
    w0 = ITEMS[2][0]
    if ot >= w0 + 0.6:
        wx, wb = W * ITEMS[2][2], H * ITEMS[2][3]
        def coins(dr, s):
            rnd = random.Random(5)
            for i in range(9):
                st = w0 + 0.6 + i * 0.55 + rnd.uniform(0, 0.3); f = (ot - st) / 2.6
                if f < 0 or f > 1: continue
                fe = ease(f); x = lerp(wx, dcx, fe) + math.sin(fe * math.pi) * 90 * U * (1 if i % 2 else -1); y = lerp(wb - 100 * U, dcy, fe)
                r = 18 * U * (1 - 0.5 * fe); sq = abs(math.cos(ot * 5 + i))
                dr.ellipse(((x - r) * s, (y - r * (0.35 + 0.65 * sq)) * s, (x + r) * s, (y + r * (0.35 + 0.65 * sq)) * s), fill=col((255, 214, 110), 1 - max(0, f - 0.8) * 5))
        img = L.screen(img, L.glow_layer(coins, blur=3, half=False))
    # "This is faith"
    fa = sm(FAITH, FAITH + 0.9, ot)
    if fa > 0:
        img = L.screen(img, L.glow_layer(lambda dr, s: dr.polygon([(x * s, y * s) for x, y in heart_pts(W / 2, H * 0.52, min(W, H) * 0.24)], fill=col((255, 200, 140), 0.35 * fa)), blur=30))
        img = L.paste_center(img, L.urdu("ایمان", 170), W / 2, H * 0.50, alpha=fa)
    return img
