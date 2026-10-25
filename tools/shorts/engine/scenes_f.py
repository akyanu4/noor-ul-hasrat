"""Weight and time: the soul comes down as light, sand rises and forms a body around it, and he is tied by threads of
family and by time. 'It is because of the soil, not the soul.'"""
import math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import lib as L
from scenes_a import cached, silhouette_mask, human_parts

col, sm, ease, lerp = L.col, L.sm, L.ease, L.lerp
GOLD = (232, 192, 104); SAND = (206, 160, 98)
FORM = (159.6, 165.0)       # the body gathers from sand
RELS = [(163.1, -1, 0.30, "ماں"), (163.7, 1, 0.30, "باپ"), (164.3, -1, 0.66, "بھائی بہن"), (164.9, 1, 0.66, "اولاد")]

def geo():
    W, H = L.W, L.H; h = H * 0.42
    return dict(cx=W / 2, top=H * 0.17, h=h, feet=H * 0.17 + h * 0.98, chest=(W / 2, H * 0.17 + h * 0.30))

def particles():
    """Each grain: where it starts (on the ground and around), where it lands inside the body, its colour and delay."""
    g = geo(); W, H = L.W, L.H
    m = np.asarray(human_parts(g["h"])[0]); ys, xs = np.nonzero(m > 140)
    rnd = np.random.default_rng(7); n = min(len(xs), int(3200 * W / 1080))
    idx = rnd.choice(len(xs), n, replace=False)
    tx = g["cx"] - m.shape[1] / 2 + xs[idx]; ty = g["top"] + ys[idx]
    side = rnd.choice([-1, 1], n)
    sx = g["cx"] + side * rnd.uniform(W * 0.1, W * 0.6, n); sy = rnd.uniform(H * 0.62, H * 0.95, n)
    # grains low in the body arrive first, so it builds up from the feet
    delay = (1 - (ty - g["top"]) / g["h"]) * 3.2 + rnd.uniform(0, 1.2, n)
    shade = rnd.uniform(0.75, 1.15, n)
    return tx, ty, sx, sy, delay, shade, side

def body_texture():
    g = geo(); m, feat = human_parts(g["h"])
    rnd = np.random.default_rng(3)
    noise = rnd.uniform(0.78, 1.12, (m.height, m.width, 1))
    shade = np.linspace(1.1, 0.85, m.height)[:, None, None]
    tex = np.clip(np.array(SAND, float)[None, None, :] * noise * shade, 0, 255).astype(np.uint8)
    im = Image.fromarray(tex).convert("RGBA"); im.putalpha(m)
    fd = np.asarray(feat).astype(float); fa = fd[..., 3:4] / 255 * 0.75      # the face and hair pressed into the sand, a little darker
    base = np.asarray(im).astype(float); rgb = base[..., :3] * (1 - fa) + (fd[..., :3] * 0.55) * fa
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), base[..., 3]]).astype(np.uint8), "RGBA")

def bg():
    W, H = L.W, L.H
    img = L.rgrad(W / 2, H * 0.40, (46, 38, 28), (10, 8, 7), max(W, H) * 0.75)
    d = ImageDraw.Draw(img); g = geo()
    for k, (c, yy) in enumerate([((60, 44, 28), 0.80), ((74, 54, 32), 0.87), ((88, 64, 38), 0.94)]):   # dunes
        pts = [(x, H * yy + 30 * L.U * math.sin(x / W * 6 + k)) for x in np.linspace(0, W, 40)] + [(W, H), (0, H)]
        d.polygon(pts, fill=c)
    d.ellipse((g["cx"] - W * 0.24, g["feet"] - H * 0.02, g["cx"] + W * 0.24, g["feet"] + H * 0.035), fill=(96, 70, 42))   # the mound he stands on
    return img

def sand_body(t, d, ot):
    W, H, U = L.W, L.H, L.U; g = geo()
    img = cached("sb_bg", bg).copy()
    img = L.screen(img, L.glow_layer(lambda dr, s: L.draw_motes(dr, ot, s, seed=41, n=40, color=(230, 200, 150)), blur=4))
    cx, (chx, chy) = g["cx"], g["chest"]
    formed = sm(FORM[1] - 0.6, FORM[1] + 0.6, ot)
    settle = 10 * U * sm(161.6, 162.4, ot) - 6 * U * sm(162.4, 162.9, ot)   # weight: he settles down onto the earth
    # time: a clock ring around him
    ta = sm(162.2, 163.0, ot)
    if ta > 0:
        R = W * 0.40
        def clock(dr, s):
            dr.ellipse(((chx - R) * s, (chy + H * 0.06 - R) * s, (chx + R) * s, (chy + H * 0.06 + R) * s), outline=col(GOLD, 0.55 * ta), width=max(1, int(3 * U * s)))
            for i in range(12):
                a = i * math.pi / 6; r1, r2 = R, R * (0.93 if i % 3 else 0.88)
                c0 = (chx + r1 * math.sin(a), chy + H * 0.06 - r1 * math.cos(a)); c1 = (chx + r2 * math.sin(a), chy + H * 0.06 - r2 * math.cos(a))
                dr.line((c0[0] * s, c0[1] * s, c1[0] * s, c1[1] * s), fill=col(GOLD, 0.7 * ta), width=max(1, int(4 * U * s)))
            for ln, sp in ((0.62, 0.35), (0.85, 2.4)):
                a = (ot - 162.2) * sp
                dr.line((chx * s, (chy + H * 0.06) * s, (chx + R * ln * math.sin(a)) * s, (chy + H * 0.06 - R * ln * math.cos(a)) * s), fill=col(GOLD, 0.6 * ta), width=max(1, int(5 * U * s)))
        img = L.screen(img, L.glow_layer(clock, blur=6))
    # relations: family members appear around him, each tied to his heart by a golden thread
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(lay)
    rel_pos = []
    for a, side, yf, lab in RELS:
        ra = sm(a, a + 0.6, ot)
        if ra <= 0: continue
        x = cx + side * W * 0.36; base = H * (0.17 + 0.42 * yf) + H * 0.10
        hh = H * (0.12 if lab != "اولاد" else 0.085)
        L.person(ld, x, base, hh, (150, 116, 74, int(255 * ra)))
        rel_pos.append((ra, x, base - hh * 0.6, base, lab))
    def threads(dr, s):
        for ra, x, y, base, lab in rel_pos:
            pts = []
            for k in range(21):
                u = k / 20; px = lerp(chx, x, u); py = lerp(chy + settle, y, u) + math.sin(u * math.pi) * 40 * U + math.sin(ot * 2 + u * 6) * 4 * U
                if u <= ra: pts.append((px * s, py * s))
            if len(pts) > 1: dr.line(pts, fill=col((255, 214, 130), 0.8), width=max(1, int(3 * U * s)))
    img = L.screen(img, L.glow_layer(threads, blur=4, half=False))
    rg = img.convert("RGBA"); rg.alpha_composite(lay); img = rg.convert("RGB")
    for ra, x, y, base, lab in rel_pos: img = L.paste_center(img, L.urdu(lab, 44), x, base + 30 * U, alpha=ra)
    # the soul comes down as a figure of light; the sand will take its shape
    from scenes_a import soul_light
    desc = ease(sm(158.4, 160.4, ot)); yc = lerp(-g["h"] * 0.6, g["top"] + g["h"] / 2, desc) + settle
    soul_a = (1 - 0.65 * formed) * (0.9 + 0.1 * math.sin(ot * 3))
    img = soul_light(img, cx, yc, g["h"], soul_a)
    # sand grains rise and build the body around the light
    tx, ty, sx, sy0, delay, shade, side = cached("sb_parts", particles)
    f = np.clip((ot - FORM[0] - delay) / 2.0, 0, 1); fe = 0.5 - 0.5 * np.cos(np.pi * f)
    ang = (1 - fe) * 2.2 * side; mx, my = cx, H * 0.55
    px = lerp(sx, tx, fe); py = lerp(sy0, ty, fe)
    rx, ry = px - mx, py - my
    px = mx + rx * np.cos(ang) - ry * np.sin(ang) * 0.4; py = my + rx * np.sin(ang) * 0.4 + ry * np.cos(ang) + settle
    vis = f > 0
    if formed < 1:
        pl = Image.new("RGBA", (W, H), (0, 0, 0, 0)); pd = ImageDraw.Draw(pl); r = 2.6 * U
        for x, y, sh, fv in zip(px[vis], py[vis], shade[vis], f[vis]):
            c = tuple(int(min(255, v * sh)) for v in SAND)
            pd.ellipse((x - r, y - r, x + r, y + r), fill=c + (int(255 * min(1, fv * 3) * (1 - formed)),))
        rg = img.convert("RGBA"); rg.alpha_composite(pl); img = rg.convert("RGB")
    if formed > 0:   # the finished body of sand
        tex = cached("sb_tex", body_texture)
        if formed < 1: tex = tex.copy(); tex.putalpha(tex.getchannel("A").point(lambda v: int(v * formed)))
        rg = img.convert("RGBA"); rg.alpha_composite(tex, (int(cx - tex.width / 2), int(g["top"] + settle))); img = rg.convert("RGB")
        # the soul still shines inside the body of sand
        img = soul_light(img, cx, g["top"] + g["h"] / 2 + settle, g["h"] * 0.96, 0.28 + 0.06 * math.sin(ot * 3))
    # "because of the soil": sand trickles from him
    tr = sm(167.4, 168.2, ot)
    if tr > 0:
        def trickle(dr, s):
            rnd = random.Random(9)
            for i in range(70):
                x0 = cx + rnd.uniform(-0.13, 0.13) * g["h"]; y0 = g["top"] + rnd.uniform(0.35, 0.95) * g["h"] + settle
                ph = (ot * 0.9 + rnd.random()) % 1.0; y = y0 + ph * (g["feet"] - y0 + 20 * U)
                rr = 2.4 * U; dr.ellipse(((x0 - rr) * s, (y - rr) * s, (x0 + rr) * s, (y + rr) * s), fill=col(SAND, tr * (1 - ph)))
        img = L.screen(img, L.glow_layer(trickle, blur=1, half=False))
    ra = sm(169.6, 170.3, ot) * (1 - sm(173.8, 174.8, ot))
    if ra > 0:   # "not because of the soul": the light inside is the soul
        img = L.paste_center(img, L.urdu("روح", 52, color=(255, 246, 220)), chx + W * 0.13, chy + settle - 40 * U, alpha=ra)
        img = L.screen(img, L.glow_layer(lambda dr, s: dr.line(((chx + 28 * U) * s, (chy + settle - 10 * U) * s, (chx + W * 0.09) * s, (chy + settle - 30 * U) * s), fill=col((255, 240, 200), ra), width=max(1, int(3 * U * s))), blur=2, half=False))
    for a, b, txt in [(158.9, 166.7, "وزن اور وقت"), (167.4, 175.3, "مٹی")]:
        if a <= ot < b: img = L.paste_center(img, L.urdu(txt, 90), W / 2, H * 0.11, alpha=min(1, (ot - a) / 0.5, (b - ot) / 0.4))
    return img
