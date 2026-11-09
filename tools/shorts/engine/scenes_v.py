"""Animated clips as scenes: "clip:<name>" plays <project>/clips/<name>.mp4 (made with an image-to-video tool such as
Veo or Kling) filling the segment, under the usual captions, header and brand line.
- The clip is slowed (down to 0.6x) to fill a longer segment; after its last frame the last frame holds with a slow zoom.
- No clip yet but <project>/clips/<name>.png (or images/<name>.png) exists: the still image with a slow Ken Burns move.
- Neither: a dark placeholder card with the scene name, so a test render works before all clips are in.
Timeline entry: ("voice", a, b, "clip:AN1-01")."""
import os, math
import cv2
from PIL import Image, ImageDraw
import cfg, lib as L

MIN_SPEED = 0.6
_caps = {}     # name -> [VideoCapture, fps, nframes, last index read, last frame]
_still = {}

def _find(name, exts):
    for d in ("clips", "images"):
        for e in exts:
            p = os.path.join(cfg.PROJECT, d, name + e)
            if os.path.exists(p): return p
    return None

def _cover(im, zoom=1.0):
    W, H = L.W, L.H
    im = L.cover(im, int(W * zoom) + 1, int(H * zoom) + 1) if zoom > 1.0 else L.cover(im, W, H)
    if zoom > 1.0:
        x, y = (im.width - W) // 2, (im.height - H) // 2
        im = im.crop((x, y, x + W, y + H))
    return im

def _frame_at(name, path, t):
    c = _caps.get(name)
    if c is None:
        cap = cv2.VideoCapture(path)
        c = _caps[name] = [cap, cap.get(cv2.CAP_PROP_FPS) or 24.0, int(cap.get(cv2.CAP_PROP_FRAME_COUNT)), -1, None]
    cap, fps, n, last, img = c
    i = max(0, min(n - 1, int(t * fps)))
    if i == last and img is not None: return img
    if i < last or i > last + 30:            # far jump: seek; otherwise read forward
        cap.set(cv2.CAP_PROP_POS_FRAMES, i); last = i - 1
    fr = None
    while last < i:
        ok, f = cap.read()
        if not ok: break
        fr = f; last += 1
    if fr is None: return img if img is not None else Image.new("RGB", (L.W, L.H))
    img = Image.fromarray(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB))
    c[3], c[4] = last, img
    return img

def duration(path):
    cap = cv2.VideoCapture(path); fps = cap.get(cv2.CAP_PROP_FPS) or 24.0; n = cap.get(cv2.CAP_PROP_FRAME_COUNT); cap.release()
    return n / fps

_shade = None
def _shaded(im):   # soft dark band at the top (heading) and bottom (brand line), so the gold text reads on bright images
    global _shade
    if _shade is None:
        import numpy as np
        y = np.linspace(0, 1, L.H)[:, None]
        a = np.clip(1 - y / 0.13, 0, 1) ** 1.6 * 150 + np.clip((y - 0.88) / 0.12, 0, 1) ** 1.6 * 120
        m = np.zeros((L.H, L.W, 4), np.uint8); m[..., 3] = np.repeat(a, L.W, axis=1).astype(np.uint8)
        _shade = Image.fromarray(m)
    out = im.convert("RGBA"); out.alpha_composite(_shade); return out.convert("RGB")

_dur = {}
def clip(name, tl, d):
    return _shaded(_clip(name, tl, d))

def _clip(name, tl, d):
    p = _find(name, (".mp4", ".mov", ".webm"))
    if p:
        cd = _dur.setdefault(p, duration(p))
        sp = max(MIN_SPEED, min(1.0, cd / d)) if d > 0 else 1.0
        t = tl * sp
        if t < cd - 0.05: return _cover(_frame_at(name, p, t))
        hold = t - (cd - 0.05)                # past the end: last frame, slowly zooming in
        return _cover(_frame_at(name, p, cd - 0.05), 1.0 + 0.012 * hold)
    s = _find(name, (".png", ".jpg", ".jpeg", ".webp"))
    if s:
        im = _still.get(s) or _still.setdefault(s, Image.open(s).convert("RGB"))
        return _cover(im, 1.0 + 0.06 * L.ease(tl / max(d, 0.1)))
    img = Image.new("RGB", (L.W, L.H), (20, 28, 26)); dr = ImageDraw.Draw(img)
    img = L.paste_center(img, L.serif_text("clip " + name + " (missing)", 54, L.GOLD), L.W / 2, L.H * 0.45)
    return img
