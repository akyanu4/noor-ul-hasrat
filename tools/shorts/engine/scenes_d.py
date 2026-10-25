"""'You will be with the one you love': a Sufi, his face hidden in soft light, lifts the believers out of the fire by Allah's
command, and they rise to the door of Jannah, which opens at 'Take him to Paradise'. The Prophet ﷺ is never drawn: only light."""
import math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import lib as L
from scenes_a import cached

col, sm, ease, lerp = L.col, L.sm, L.ease, L.lerp
GOLD = (232, 192, 104); ROBE = (226, 220, 204); SHAWL = (34, 104, 78); TURBAN = (244, 240, 230)

# when a soul is lifted (time, side: +1 right hand, -1 left hand, where in the fire as a fraction of the width)
LIFTS = [(432.2, 1, 0.80), (465.3, -1, 0.20), (468.3, 1, 0.84), (470.5, -1, 0.14), (472.7, 1, 0.76), (474.9, -1, 0.26), (477.1, 1, 0.82)]
REACH, LIFT, BACK, FLOAT = 1.0, 1.1, 1.0, 2.6

def arch_pts(cx, ybot, w, apex):
    """A pointed (equilateral) arch: straight sides from ybot up to the springing line, two arcs meeting at the apex."""
    rise = 0.866 * w; ys = apex + rise; x0, x1 = cx - w / 2, cx + w / 2
    pts = [(x0, ybot), (x0, ys)]
    for th in np.linspace(math.pi, 2 * math.pi / 3, 18): pts.append((x1 + w * math.cos(th), ys - w * math.sin(th)))
    for th in np.linspace(math.pi / 3, 0, 18): pts.append((x0 + w * math.cos(th), ys - w * math.sin(th)))
    pts.append((x1, ybot)); return pts

def geom():
    W, H = L.W, L.H
    if L.PORTRAIT:
        g = dict(cx=W / 2, w=W * 0.34, apex=H * 0.085, ybot=H * 0.33, fr=W * 0.035)
        g["ys"] = g["apex"] + 0.866 * g["w"]
        g["base"] = H * 0.705; g["h"] = H * 0.30          # the Sufi: feet and height
    else:   # the full (16:9) video: a narrower gate, taller in the frame
        g = dict(cx=W / 2, w=H * 0.26, apex=H * 0.05, ybot=H * 0.50, fr=H * 0.03)
        g["ys"] = g["apex"] + 0.866 * g["w"]
        g["base"] = H * 0.90; g["h"] = H * 0.36
    return g

def door_open(ot): return sm(476.6, 479.9, ot)

def background():
    W, H = L.W, L.H
    img = L.vgrad([(0, (40, 62, 58)), (0.2, (58, 70, 52)), (0.45, (30, 26, 22)), (0.72, (34, 12, 8)), (1, (70, 16, 4))])
    return L.draw_stars(img, 0, seed=77, n=int(160 * W / 1080), ymax=0.35, tw=False)

def gate_frame():
    """The gate's golden frame with a carved pattern, drawn once."""
    W, H = L.W, L.H; g = geom()
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    outer = arch_pts(g["cx"], g["ybot"] + g["fr"] * 0.6, g["w"] + 2 * g["fr"], g["apex"] - g["fr"] * 1.15)
    d.polygon(outer, fill=GOLD + (255,))
    d.polygon(arch_pts(g["cx"], g["ybot"] + 2, g["w"], g["apex"]), fill=(0, 0, 0, 0))   # the doorway stays open in the frame
    d.polygon(arch_pts(g["cx"], g["ybot"] + g["fr"] * 0.6, g["w"] + g["fr"] * 1.1, g["apex"] - g["fr"] * 0.55), outline=(255, 236, 170, 255), width=max(2, int(4 * L.U)))
    for i in range(7):                     # small stars along the frame
        y = g["ybot"] - (g["ybot"] - g["ys"]) * i / 6
        for sx in (-1, 1): L.star8(d, g["cx"] + sx * (g["w"] / 2 + g["fr"] * 0.5), y, g["fr"] * 0.28, fill=(150, 104, 40, 255))
    d.rectangle((g["cx"] - g["w"] / 2 - g["fr"] * 1.6, g["ybot"] + g["fr"] * 0.6, g["cx"] + g["w"] / 2 + g["fr"] * 1.6, g["ybot"] + g["fr"] * 1.2), fill=(214, 172, 88, 255))   # threshold
    return lay

def door_leaf(w, h):
    """One closed door leaf (full size), green with gold trim and an eight-pointed star."""
    lay = Image.new("RGBA", (max(1, int(w)), max(1, int(h))), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.rectangle((0, 0, w, h), fill=(20, 74, 58, 255))
    t = max(2, int(5 * L.U))
    d.rectangle((t, t, w - t, h - t), outline=GOLD + (255,), width=t)
    L.star8(d, w / 2, h * 0.55, w * 0.30, fill=GOLD + (255,)); L.star8(d, w / 2, h * 0.55, w * 0.17, fill=(20, 74, 58, 255))
    for k in (0.2, 0.86): d.line((w * 0.18, h * k, w * 0.82, h * k), fill=GOLD + (255,), width=t)
    d.ellipse((w * 0.78 if w > 0 else 0, h * 0.5, w * 0.9, h * 0.56), fill=(250, 220, 140, 255))
    return lay

def draw_gate(img, ot):
    W, H = L.W, L.H; g = geom(); op = door_open(ot)
    # light behind and around the gate, stronger once it opens
    def glow(dr, s):
        cx, cy = g["cx"], (g["apex"] + g["ybot"]) / 2
        for k, a in [(1.9, 0.10), (1.35, 0.16), (1.0, 0.22)]:
            rw = g["w"] * k * (1 + 0.35 * op); rh = (g["ybot"] - g["apex"]) * 0.75 * k * (1 + 0.3 * op)
            dr.ellipse(((cx - rw) * s, (cy - rh) * s, (cx + rw) * s, (cy + rh) * s), fill=col((255, 238, 190), a * (0.7 + 0.8 * op)))
        for i in range(9):   # clouds at the gate's foot
            x = cx + (i - 4) * g["w"] * 0.32; y = g["ybot"] + g["fr"] * 1.4 + 8 * L.U * math.sin(i * 1.3 + ot * 0.4); r = g["w"] * (0.20 + 0.05 * math.sin(i * 2.1))
            dr.ellipse(((x - r) * s, (y - r * 0.45) * s, (x + r) * s, (y + r * 0.45) * s), fill=col((255, 248, 230), 0.22))
    img = L.screen(img, L.glow_layer(glow, blur=46))
    # the doorway: bright light inside
    inner = Image.new("L", (W, H), 0); ImageDraw.Draw(inner).polygon(arch_pts(g["cx"], g["ybot"], g["w"], g["apex"]), fill=255)
    lightc = Image.new("RGB", (W, H), (255, 246, 222))
    img = Image.composite(lightc, img, inner)
    # the two door leaves swing open (seen as narrowing toward the sides)
    rgba = img.convert("RGBA")
    lw, lh = g["w"] / 2, g["ybot"] - g["apex"]
    leaf = cached("jn_leaf", lambda: door_leaf(lw, lh))
    vis = max(0.0, math.cos(op * math.pi * 0.47))
    for side in (-1, 1):
        nw = max(1, int(lw * vis))
        lf = leaf.resize((nw, int(lh)), Image.BILINEAR)
        if side == 1: lf = lf.transpose(Image.FLIP_LEFT_RIGHT)
        x = int(g["cx"] - lw) if side == -1 else int(g["cx"] + lw - nw)
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); layer.paste(lf, (x, int(g["apex"])))
        mask = Image.new("L", (W, H), 0); mask.paste(inner, (0, 0))
        layer.putalpha(Image.composite(layer.getchannel("A"), Image.new("L", (W, H), 0), inner))
        rgba.alpha_composite(layer)
    # light leaking through the seam before the doors open
    if op < 0.05:
        seam = 0.6 + 0.4 * math.sin(ot * 2.2)
        img = rgba.convert("RGB")
        img = L.screen(img, L.glow_layer(lambda dr, s: dr.rectangle(((g["cx"] - 3 * L.U) * s, g["ys"] * s, (g["cx"] + 3 * L.U) * s, g["ybot"] * s), fill=col((255, 240, 200), seam)), blur=8))
        rgba = img.convert("RGBA")
    rgba.alpha_composite(cached("jn_frame", gate_frame))
    img = rgba.convert("RGB")
    if op > 0:   # rays pouring out of the open door
        def rays(dr, s):
            cx, cy = g["cx"], (g["ys"] + g["ybot"]) / 2
            for i in range(14):
                a = math.pi * (0.06 + 0.88 * i / 13) + 0.03 * math.sin(ot + i)
                ln = H * 0.55
                dr.polygon([(cx * s, cy * s), ((cx + ln * math.cos(a) - 18 * L.U) * s, (cy + ln * math.sin(a)) * s), ((cx + ln * math.cos(a) + 18 * L.U) * s, (cy + ln * math.sin(a)) * s)], fill=col((255, 240, 200), 0.16 * op))
        img = L.screen(img, L.glow_layer(rays, blur=20))
    return img

def fire(img, ot):
    W, H, U = L.W, L.H, L.U
    def fl(dr, s):
        base = H * 1.04; n = int(18 * W / 1080) + 8
        for i in range(n):
            x = W * (i + 0.5) / n + 10 * U * math.sin(ot * 2 + i); hgt = H * (0.19 + 0.07 * math.sin(ot * 3.1 + i * 1.9) + 0.04 * math.sin(ot * 7.3 + i))
            w = W / n * 1.5
            for k, (c, a) in enumerate([((230, 60, 20), 0.45), ((255, 140, 40), 0.55), ((255, 220, 130), 0.65)]):
                hh = hgt * (1 - k * 0.28); ww = w * (1 - k * 0.3) / 2
                dr.ellipse(((x - ww) * s, (base - hh) * s, (x + ww) * s, (base + hh * 0.3) * s), fill=col(c, a))
    return L.screen(img, L.glow_layer(fl, blur=26, strength=1.15))

# ------------------------------------------------------------------ the Sufi
def hand_pos(ot, side):
    """Where this hand is now, and the soul it carries (progress of the lift), if any."""
    g = geom(); cx, base, h = g["cx"], g["base"], g["h"]
    rest = (cx + side * h * 0.20, base - h * 0.40)
    up = (cx + side * h * 0.36, base - h * 1.02)
    for a, sd, xf in LIFTS:
        if sd != side: continue
        t = ot - a
        if t < 0 or t > REACH + LIFT + BACK: continue
        low = (L.W * xf, L.H * 0.80)
        if t < REACH: f = ease(t / REACH); return (lerp(rest[0], low[0], f), lerp(rest[1], low[1], f)), None
        if t < REACH + LIFT: f = ease((t - REACH) / LIFT); return (lerp(low[0], up[0], f), lerp(low[1], up[1], f)), f
        f = ease((t - REACH - LIFT) / BACK); return (lerp(up[0], rest[0], f), lerp(up[1], rest[1], f)), None
    return rest, None

def draw_soul(dr, x, y, hh, a):
    L.person(dr, x, y + hh * 0.5, hh, col((255, 246, 220), a))

def sufi(img, ot, alpha):
    if alpha <= 0: return img
    W, H = L.W, L.H; g = geom(); cx, base, h = g["cx"], g["base"], g["h"]
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    # cloud he stands on
    sh = (cx, base - h * 0.74)
    # robe
    d.polygon([(cx - h * 0.25, base), (cx - h * 0.15, base - h * 0.76), (cx + h * 0.15, base - h * 0.76), (cx + h * 0.25, base)], fill=ROBE + (255,))
    d.polygon([(cx - h * 0.15, base - h * 0.76), (cx - h * 0.06, base - h * 0.76), (cx - h * 0.10, base - h * 0.10), (cx - h * 0.20, base - h * 0.10)], fill=SHAWL + (255,))
    d.polygon([(cx + h * 0.15, base - h * 0.76), (cx + h * 0.06, base - h * 0.76), (cx + h * 0.10, base - h * 0.10), (cx + h * 0.20, base - h * 0.10)], fill=SHAWL + (255,))
    d.ellipse((cx - h * 0.17, base - h * 0.80, cx + h * 0.17, base - h * 0.70), fill=SHAWL + (255,))
    # arms (sleeves) reaching to each hand
    for side in (-1, 1):
        (hx, hy), _ = hand_pos(ot, side)
        sx, sy = cx + side * h * 0.14, base - h * 0.72
        ex, ey = lerp(sx, hx, 0.5) + side * h * 0.07, lerp(sy, hy, 0.5)
        d.line([(sx, sy), (ex, ey), (hx, hy)], fill=(200, 192, 174, 255), width=int(h * 0.095), joint="curve")
        d.line([(sx, sy), (ex, ey), (hx, hy)], fill=ROBE + (255,), width=int(h * 0.075), joint="curve")
        r = h * 0.035; d.ellipse((hx - r, hy - r, hx + r, hy + r), fill=(236, 214, 182, 255))
    # head and turban; the face is only soft light
    hr = h * 0.075; hy = base - h * 0.87
    d.ellipse((cx - hr, hy - hr, cx + hr, hy + hr * 1.15), fill=(255, 236, 196, 255))
    d.ellipse((cx - hr * 1.2, hy - hr * 1.75, cx + hr * 1.2, hy - hr * 0.35), fill=TURBAN + (255,))
    d.chord((cx - hr * 1.05, hy - hr * 0.6, cx + hr * 1.05, hy + hr * 1.6), 0, 180, fill=(250, 248, 242, 255))   # beard, as light
    # blur the head so no face can be seen
    box = (int(cx - hr * 1.6), int(hy - hr * 2.0), int(cx + hr * 1.6), int(hy + hr * 1.9))
    lay.paste(lay.crop(box).filter(ImageFilter.GaussianBlur(hr * 0.35)), box[:2])
    if alpha < 1: lay.putalpha(lay.getchannel("A").point(lambda v: int(v * alpha)))
    # soft halo and rim light behind him
    def halo(dr, s):
        dr.ellipse(((cx - hr * 3.2) * s, (hy - hr * 3.2) * s, (cx + hr * 3.2) * s, (hy + hr * 3.2) * s), fill=col((255, 238, 190), 0.55 * alpha))
        dr.polygon([((cx - h * 0.27) * s, base * s), ((cx - h * 0.17) * s, (base - h * 0.78) * s), ((cx + h * 0.17) * s, (base - h * 0.78) * s), ((cx + h * 0.27) * s, base * s)], fill=col((255, 230, 170), 0.35 * alpha))
        for i in range(7):
            x = cx + (i - 3) * h * 0.16; r = h * (0.16 + 0.03 * math.sin(i * 1.7))
            dr.ellipse(((x - r) * s, (base - r * 0.35) * s, (x + r) * s, (base + r * 0.35) * s), fill=col((255, 250, 235), 0.4 * alpha))
    img = L.screen(img, L.glow_layer(halo, blur=30))
    rgba = img.convert("RGBA"); rgba.alpha_composite(lay); return rgba.convert("RGB")

def souls(img, ot):
    """Each soul: rises in the hand, then floats up into the door of Jannah."""
    W, H = L.W, L.H; g = geom(); door = (g["cx"], (g["ys"] + g["ybot"]) / 2 + 20 * L.U)
    hh = H * 0.09
    def dr_fn(dr, s):
        for a, side, xf in LIFTS:
            t = ot - a
            if t < REACH * 0.85: continue
            if t < REACH + LIFT:
                (hx, hy), _ = hand_pos(ot, side)
                x, y, k, al = hx, hy - hh * 0.55, 1.0, min(1, (t - REACH * 0.85) / 0.3)
            else:
                f = (t - REACH - LIFT) / FLOAT
                if f > 1.15: continue
                up = (g["cx"] + side * g["h"] * 0.36, g["base"] - g["h"] * 1.02 - hh * 0.55)
                fe = ease(min(1, f))
                x = lerp(up[0], door[0], fe) + side * 40 * L.U * math.sin(fe * math.pi)
                y = lerp(up[1], door[1], fe); k = 1 - 0.55 * fe; al = 1 - max(0, (f - 0.85) / 0.3)
            ss = dr  # draw the figure and a glow around it
            r = hh * 0.55 * k
            ss.ellipse(((x - r) * s, (y - r) * s, (x + r) * s, (y + r) * s), fill=col((255, 230, 170), 0.35 * al))
            draw_soul(ss, x * s, y * s, hh * k * s, al)
    return L.screen(img, L.glow_layer(dr_fn, blur=4, half=False))

def jannah(t, d, ot):
    W, H = L.W, L.H; g = geom()
    img = cached("jn_bg", background).copy()
    img = L.screen(img, L.glow_layer(lambda dr, s: L.draw_motes(dr, ot, s, seed=23, n=50), blur=5))
    img = draw_gate(img, ot)
    img = fire(img, ot)
    # the Sufi appears out of the light; he steps back softly while the hadith is shown
    love = sm(440.0, 442.0, ot) * (1 - sm(461.5, 463.0, ot))
    alpha = sm(430.4, 432.0, ot) * (1 - 0.65 * love)
    img = sufi(img, ot, alpha)
    img = souls(img, ot)
    if love > 0:   # "a person is with the one he loves"
        def heart(dr, s):
            cx, cy = W / 2, H * 0.50; r = min(W, H) * 0.17 * (1 + 0.04 * math.sin(ot * 4))
            pts = [(cx + r * math.sin(a) ** 3, cy - r * (13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a)) / 16) for a in np.linspace(0, 2 * math.pi, 80)]
            dr.polygon([(x * s, y * s) for x, y in pts], fill=col((255, 140, 150), 0.38 * love))
        img = L.screen(img, L.glow_layer(heart, blur=30))
        img = L.paste_center(img, L.urdu("المرء مع من احب", 100), W / 2, H * 0.50, alpha=love)
    cmd = sm(462.6, 463.6, ot) * (1 - sm(469.0, 470.0, ot))
    if cmd > 0: img = L.paste_center(img, L.urdu("بحکمِ الٰہی", 70), W / 2, H * 0.215, alpha=cmd)
    flood = sm(479.4, 481.8, ot)
    if flood > 0: img = L.screen(img, L.glow_layer(lambda dr, s: dr.ellipse(((g["cx"] - W) * s, (g["apex"] - H * 0.3) * s, (g["cx"] + W) * s, (g["ybot"] + H * 0.45) * s), fill=col((255, 244, 214), 0.22 * flood)), blur=60))
    return img
