"""Scenes, part I: step-by-step teaching cards (the Bai'at steps Short).
The project folder holds steps.py:
    STEPS = {"scene_name": dict(n=1, of=6, en="LOOK FIRST", ur="پہلے دیکھو", art="look", art_until=0.45,
                                 images=[("CODE", crop, opts), ...], arabic=[(t0, ["line 1", "line 2"]), ...], mean="...")}
Each scene: an animated drawing (art) on a glowing medallion for the first part (art_until = fraction of the scene),
then the project's pictures with Ken Burns (scenes_g frame_image), the step badge and title stay on top throughout.
`arabic`: lines of Qur'an / du'a that fade in at t0 seconds into the scene (one line after another).
Pause scenes (no voice) work the same way; their time is the scene's own time."""
import os, sys, io, math, functools
from PIL import Image, ImageFilter
import cfg, lib as L
sys.path.insert(0, cfg.PROJECT)
try: from steps import STEPS
except ImportError: STEPS = {}
from scenes_a import cached, ease, sm
import scenes_a as A

G, T, S, S2 = "#c9a24b", "#0f3d3e", "#e7d4a3", "#e9cfa0"

def _hand(x, y, s, rot, fill=S):
    return ('<g transform="translate(%.2f %.2f) rotate(%.2f) scale(%.3f)"><path d="M-14 22 C-16 10 -16 2 -14 -6 L-13 -22 C-13 -27 -7 -27 -7 -22 L-7 -6 '
            'L-6 -30 C-6 -35 0 -35 0 -30 L0 -6 L1 -28 C1 -33 7 -33 7 -28 L7 -5 L8 -22 C8 -27 14 -27 14 -22 L14 4 L19 -6 C21 -11 27 -9 25 -3 L17 16 '
            'C14 24 8 28 0 28 L-6 28 C-10 28 -13 26 -14 22 Z" fill="%s" stroke="%s" stroke-width="2" stroke-linejoin="round"/></g>') % (x, y, rot, s, fill, T)

def _art(kind, u, t):
    """SVG (viewBox 160x110) of one drawing at progress u (0..1, eased in) and time t (for loops)."""
    e = ease(min(1, u)); tw = lambda k: 0.55 + 0.45 * math.sin(t * 2.2 + k)
    glow = '<circle cx="80" cy="50" r="%.1f" fill="url(#g)"/>' % (44 + 4 * math.sin(t * 1.3))
    if kind == "look":
        mx, my = 30 + 52 * e, 60 - 8 * math.sin(e * math.pi)
        door = 0.25 + 0.75 * sm(0.75, 1.0, u)
        body = (glow + '<path d="M14 100 Q60 70 80 70 T146 100" fill="none" stroke="%s" stroke-width="3" stroke-dasharray="6 6" stroke-dashoffset="%.1f"/>' % (G, -t * 14) +
                '<path d="M100 76 V44 Q100 26 116 20 Q132 26 132 44 V76 Z" fill="%s"/><path d="M107 76 V50 Q107 38 116 34 Q125 38 125 50 V76 Z" fill="#f4d98a" fill-opacity="%.2f"/>' % (T, door) +
                '<circle cx="116" cy="12" r="3" fill="%s"/>' % G +
                '<circle cx="%.1f" cy="%.1f" r="17" fill="#fff" fill-opacity=".45" stroke="%s" stroke-width="4"/><path d="M%.1f %.1f l14 14" stroke="%s" stroke-width="7" stroke-linecap="round"/>' % (mx, my, T, mx + 12, my + 12, T))
    elif kind == "heart":
        k = 1 + 0.06 * math.sin(t * 5.0) * (0.4 + 0.6 * e)
        body = glow + '<g transform="translate(80 58) scale(%.3f) translate(-80 -58)"><path d="M80 92 C40 66 34 42 50 30 C62 21 76 28 80 38 C84 28 98 21 110 30 C126 42 120 66 80 92 Z" fill="%s"/>' % (k, T) + \
            '<path d="M80 80 C55 62 52 46 60 40 C67 35 75 39 78 46" fill="none" stroke="%s" stroke-width="3" stroke-linecap="round"/></g>' % G + \
            ''.join('<circle cx="%d" cy="%d" r="2.8" fill="%s" fill-opacity="%.2f"/>' % (x, y, G, tw(i)) for i, (x, y) in enumerate([(80, 12), (50, 18), (110, 18), (34, 40), (126, 40)]))
    elif kind == "tasbeeh":
        n = 33; cur = int(t * 2.2) % n; body = glow
        for i in range(n):
            a = i / n * math.pi * 2 - math.pi / 2; x, y = 80 + math.cos(a) * 34, 48 + math.sin(a) * 30
            on = (i - cur) % n == 0
            body += '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s"/>' % (x, y, 5.6 if on else 4.2, G if on or i % 11 == 0 else T)
        body += '<path d="M80 78 L80 96" stroke="%s" stroke-width="3"/><path d="M74 96 L86 96 L82 106 L78 106 Z" fill="%s"/>' % (T, G)
    elif kind == "hands":
        d = 46 * (1 - e)
        rays = sm(0.7, 1.0, u)
        body = glow + '<g stroke="%s" stroke-width="2.6" stroke-linecap="round" opacity="%.2f"><path d="M80 4 L80 20"/><path d="M64 8 L71 22"/><path d="M96 8 L89 22"/></g>' % (G, rays * tw(1)) + \
            _hand(64 - d, 70, 1.15, 62, S2) + _hand(96 + d, 66, 1.15, -62) + '<path d="M30 104 Q80 92 130 104" fill="none" stroke="%s" stroke-width="2"/>' % G
    elif kind == "cloth":
        w = 4 * math.sin(t * 2.0); dx = 30 * (1 - e)
        body = glow + '<path d="M%.1f 40 Q80 %.1f %.1f 40 L%.1f 50 Q80 %.1f %.1f 50 Z" fill="%s" opacity=".9"/>' % (28 + dx, 58 + w, 132 - dx, 132 - dx, 70 + w, 28 + dx, G) + \
            _hand(22 + dx, 58, 0.75, 20, S2) + _hand(138 - dx, 58, 0.75, -20) + \
            '<ellipse cx="80" cy="96" rx="28" ry="6" fill="%s" opacity=".25"/><path d="M54 90 Q80 106 106 90" fill="none" stroke="%s" stroke-width="2.5"/>' % (T, T) + \
            '<path d="M60 95 Q80 %.1f 100 95" fill="none" stroke="#8fd3e8" stroke-width="2" opacity=".7"/>' % (93 + 1.5 * math.sin(t * 3))
    elif kind == "pledge":
        body = glow + '<rect x="44" y="18" width="72" height="74" rx="6" fill="#fffaf0" stroke="%s" stroke-width="2.5"/>' % T
        for i, y in enumerate([32, 42, 52, 62]):
            L_ = (36 if i == 3 else 52) * sm(i * 0.2, i * 0.2 + 0.22, u)
            if L_ > 0.5: body += '<path d="M54 %d h%.1f" stroke="%s" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>' % (y, L_, T)
        st = sm(0.85, 1.0, u)
        if st > 0: body += '<g transform="translate(100 78) scale(%.2f)"><circle r="9" fill="%s"/><path d="M-4 0 l3 3 l6 -6" fill="none" stroke="#fff" stroke-width="2.4"/></g>' % (0.6 + 0.4 * st, G)
    elif kind == "dua":
        lift = -6 * e
        body = glow + _hand(62, 64 + lift, 1.05, -14, S2) + _hand(98, 64 + lift, 1.05, 14) + \
            '<g stroke="%s" stroke-width="2.6" stroke-linecap="round" opacity="%.2f"><path d="M80 4 v12"/><path d="M68 8 l5 9"/><path d="M92 8 l-5 9"/></g>' % (G, tw(0)) + \
            '<path d="M40 104 H120" stroke="%s" stroke-width="2"/>' % G
    else:   # rope
        off = -t * 30
        body = glow + '<path d="M80 0 C74 20 86 34 80 52 C74 70 86 82 80 104" fill="none" stroke="%s" stroke-width="5" stroke-linecap="round"/>' % G + \
            '<path d="M80 0 C74 20 86 34 80 52 C74 70 86 82 80 104" fill="none" stroke="#fff4cf" stroke-width="2" stroke-dasharray="4 10" stroke-dashoffset="%.1f"/>' % off + \
            _hand(80, 76 + 20 * (1 - e), 0.85, 90, S2) + '<path d="M18 104 Q50 96 70 100 M90 100 Q112 96 142 104" fill="none" stroke="%s" stroke-width="2" opacity=".5"/>' % T
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 110" width="%d" height="%d"><defs><radialGradient id="g" cx="50%%" cy="45%%" r="60%%">'
            '<stop offset="0" stop-color="#fff6dc" stop-opacity=".95"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></radialGradient></defs>%s</svg>') % (ART_W, int(ART_W * 110 / 160), body)

ART_W = 900
def art_image(kind, u, t):
    import cairosvg
    png = cairosvg.svg2png(bytestring=_art(kind, u, t).encode())
    return Image.open(io.BytesIO(png)).convert("RGBA")

def medallion(size):
    def mk():
        im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        g = Image.new("L", (size, size), 0)
        from PIL import ImageDraw
        d = ImageDraw.Draw(g); d.ellipse((0, 0, size - 1, size - 1), fill=255)
        base = Image.new("RGBA", (size, size), (247, 239, 217, 255)); base.putalpha(g.filter(ImageFilter.GaussianBlur(3)))
        ring = Image.new("RGBA", (size, size), (0, 0, 0, 0)); rd = ImageDraw.Draw(ring)
        rd.ellipse((6, 6, size - 7, size - 7), outline=(201, 162, 75, 255), width=max(3, int(5 * L.U)))
        im.alpha_composite(base); im.alpha_composite(ring); return im
    return cached(("medal", size), mk)

def badge(n, of, en, ur):
    def mk():
        top = L.serif_text(("STEP %d OF %d" % (n, of)) if n else "TAKING BAI'AT", 34, (232, 196, 107), 8)
        title = L.serif_text(en, 64)
        u = L.urdu(ur, 58, (240, 214, 150), path=L.URDU_R) if ur else None
        h = top.height + title.height + (u.height - int(50 * L.U) if u else 0)
        w = max(top.width, title.width, u.width if u else 0)
        im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        im.alpha_composite(top, ((w - top.width) // 2, 0)); im.alpha_composite(title, ((w - title.width) // 2, top.height - int(8 * L.U)))
        if u: im.alpha_composite(u, ((w - u.width) // 2, top.height + title.height - int(40 * L.U)))
        return im
    return cached(("badge", n, of, en, ur), mk)

def make(name):
    st = STEPS[name]
    import scenes_g as SG
    imgs = st.get("images", [])
    def scene(t, d, ot):
        u_art = st.get("art_until", 0.45)
        cut = d * u_art if imgs else d + 1
        # background: blurred night with motes, or the pictures with Ken Burns
        if t < cut + 0.7:
            img = A.bg_night().copy()
            if imgs:   # a soft, blurred hint of the first picture behind the medallion
                bgp = SG.frame_image(imgs[0][0], imgs[0][1], imgs[0][2] if len(imgs[0]) > 2 else {}).resize((L.W // 4, L.H // 4)).filter(ImageFilter.GaussianBlur(6)).resize((L.W, L.H))
                img = Image.blend(img, Image.eval(bgp, lambda v: int(v * 0.45)), 0.55)
            img = L.screen(img, L.glow_layer(lambda dr, s: L.draw_motes(dr, t, s, seed=21, n=55), blur=5))
            has_ar = any(it[0] < cut for it in st.get("arabic", []))   # Arabic shown while the drawing is up: a smaller medallion, higher
            ms, my = (int(L.W * 0.56), L.H * 0.365) if has_ar else (int(L.W * 0.76), L.H * 0.45)
            a_in = sm(0, 0.6, t)
            img = L.paste_center(img, medallion(ms), L.W / 2, my, alpha=a_in, scale=0.92 + 0.08 * a_in)
            art = art_image(st["art"], max(0, (t - 0.3) / max(1.0, min(cut, d) * 0.7)), t)
            aw = int(ms * 0.86); art = art.resize((aw, int(aw * art.height / art.width)), Image.LANCZOS)
            img = L.paste_center(img, art, L.W / 2, my, alpha=a_in)
        if imgs and t > cut:
            seg = (d - cut) / len(imgs); k = min(len(imgs) - 1, int((t - cut) / seg)); p = (t - cut - k * seg) / seg
            im = imgs[k]; pic = SG.kb(SG.frame_image(im[0], im[1], im[2] if len(im) > 2 else {}), ease(p), k)
            if k > 0 and p * seg < 0.6:
                pm = imgs[k - 1]; prev = SG.kb(SG.frame_image(pm[0], pm[1], pm[2] if len(pm) > 2 else {}), 1.0, k - 1)
                pic = Image.blend(prev, pic, p * seg / 0.6)
            pic = L.screen(pic, L.glow_layer(lambda dr, s: L.draw_motes(dr, t, s, seed=31 + k, n=45), blur=5))
            img = pic if t > cut + 0.7 else Image.blend(img, pic, (t - cut) / 0.7)
        # Arabic lines (Qur'an / du'a), fading in one after another, over a soft dark band
        for item in st.get("arabic", []):
            t0, lines = item[0], item[1]
            at = list(item[2]) if len(item) > 2 else [t0 + i * 0.9 for i in range(len(lines))]   # when each line appears
            if t < t0: continue
            y = L.H * st.get("arabic_y", 0.64)
            band = Image.new("RGBA", (L.W, int(len(lines) * 118 * L.U + 70 * L.U)), (6, 16, 14, 150))
            img = L.paste_center(img, band.filter(ImageFilter.GaussianBlur(20)), L.W / 2, y + (len(lines) - 1) * 59 * L.U, alpha=sm(t0, t0 + 0.6, t))
            for i, ln in enumerate(lines):
                img = L.paste_center(img, L.urdu(ln, 56, (250, 226, 160)), L.W / 2, y + i * 118 * L.U, alpha=sm(at[i], at[i] + 0.8, t))
            mean = st.get("mean") or []
            for j, ml in enumerate([mean] if isinstance(mean, str) else mean):
                mi = L.serif_text(ml, 32, (235, 225, 200))
                img = L.paste_center(img, mi, L.W / 2, y + len(lines) * 118 * L.U - 20 * L.U + j * 44 * L.U, alpha=sm(st.get("mean_at", at[-1] + 0.9), st.get("mean_at", at[-1] + 0.9) + 0.8, t))
        # the step badge and title, sliding down at the start
        b = badge(st.get("n", 0), st.get("of", 6), st["en"], st.get("ur", ""))
        a = sm(0.1, 0.8, t)
        img = L.paste_center(img, b, L.W / 2, L.H * 0.155 + (1 - a) * -40 * L.U, alpha=a)
        return img
    return scene

SCENES = {n: make(n) for n in STEPS}
