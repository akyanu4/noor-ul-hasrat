"""Render a timeline to video.
  python3 render.py full  <out.mp4> [workers]          16:9 1920x1080, 25 fps
  python3 render.py short <name> <out.mp4> [workers]   9:16 1080x1920, 30 fps
  python3 render.py frames <full|short:name> <t1,t2,...> <out.png>   preview frames"""
import sys, os, math, subprocess, tempfile, functools
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import cfg; sys.path.insert(0, cfg.PROJECT)   # captions.py and timeline.py come from the project folder
import lib as L

MODE = sys.argv[1]
if MODE == "full" or (MODE == "frames" and sys.argv[2] == "full"): L.setup(1920, 1080); FPS = 25
else: L.setup(1080, 1920); FPS = 30
import scenes_a as A, scenes_b as B, scenes_c as C, scenes_d as D, scenes_e as E, scenes_f as F, scenes_g as G
from captions import CAPTIONS
from timeline import FULL, SHORTS

SCENES = {"soul": A.soul, "arsh": A.arsh, "creation": A.creation, "misal": A.misal, "womb": A.womb, "weight_time": A.weight_time,
          "death_barzakh": B.death_barzakh, "graves": B.graves, "window": B.window, "sins": B.sins, "hashr": B.hashr, "scales": B.scales,
          "intercession": B.intercession, "grace": B.grace, "masjid": B.masjid_scene, "shahada": B.shahada, "book": B.book,
          "malida_prep": C.malida_prep, "malida_feast": C.malida_feast, "glory": C.glory, "jannah": D.jannah, "iman": E.iman, "sand_body": F.sand_body}
SCENES.update(G.SCENES)   # project image slideshows (slides.py)

def build(tl):
    segs, T = [], 0.0
    for e in tl:
        if e[0] == "voice": d = e[2] - e[1]; segs.append(dict(kind="voice", a=e[1], b=e[2], scene=e[3], T=T, d=d))
        elif e[0] == "pause": d = e[1]; segs.append(dict(kind="pause", scene=e[2], args=e[3], T=T, d=d))
        else: d = e[1]; segs.append(dict(kind=e[0], T=T, d=d))
        T += d
    return segs, T

def seg_frame(sg, tl):
    k = sg["kind"]
    if k == "voice": return SCENES[sg["scene"]](tl, sg["d"], sg["a"] + tl)
    if k == "pause":
        if sg["scene"] == "calm": return C.calm(tl, sg["d"], None, *sg["args"])
        return SCENES[sg["scene"]](tl, sg["d"], None)
    if k == "title": return A.title_card(tl, sg["d"])
    if k == "outro": return A.title_card(tl, sg["d"], closing=True)
    if k == "endcard":
        img = C.calm(tl, sg["d"], None, "stars", "")
        img = L.paste_center(img, L.serif_text("NOOR-UL-HASRAT", 76, L.GOLD, 10), L.W / 2, L.H * 0.50, alpha=min(1, tl / 0.5))
        import cfg   # "Full dars on the channel" only once the full video is really up: project.json "endcard_line"
        img = L.paste_center(img, L.serif_text(cfg.P.get("endcard_line", "Subscribe for more dars"), 52), L.W / 2, L.H * 0.56, alpha=min(1, tl / 0.8))   # credit lines from project.json "credits": shown small under the channel name
        y = L.H * 0.615
        for line in cfg.P.get("credits", []):   # "text" or ["text", size]; a size under 36 is a sub-line (dimmer, closer)
            txt, sz = (line, 38) if isinstance(line, str) else line
            if sz < 36: y -= L.H * 0.008
            img = L.paste_center(img, L.serif_text(txt, sz, (215, 200, 165) if sz >= 36 else (190, 176, 140)), L.W / 2, y, alpha=min(1, max(0, (tl - 0.3) / 0.8)))
            y += L.H * (0.035 if sz < 36 else 0.033)
        if cfg.P.get("producer"):   # small, bottom-right corner
            pi = L.serif_text(cfg.P["producer"], 30, (200, 185, 150))
            img = L.paste_center(img, pi, L.W - pi.width / 2 - 40 * L.U, L.H * 0.965, alpha=min(1, max(0, (tl - 0.3) / 0.8)))
        return img

# ---- captions mapped onto the output timeline
def caption_track(segs):
    out = []
    for sg in segs:
        if sg["kind"] != "voice": continue
        for s, e, txt in CAPTIONS:
            if s >= sg["b"] or e <= sg["a"]: continue
            for cs, ce, g in L.split_chunks(max(s, sg["a"]), min(e, sg["b"]), txt):
                out.append([sg["T"] + cs - sg["a"], sg["T"] + ce - sg["a"], g, sg["T"] + sg["d"]])
    out.sort(key=lambda x: x[0])
    for i, c in enumerate(out):
        nxt = out[i + 1][0] if i + 1 < len(out) else 1e9
        c[1] = min(nxt, c[1] + 0.6, c[3])
    return out

def vignette():
    W, H = L.W, L.H
    yy, xx = np.mgrid[0:H, 0:W]; r = np.hypot((xx - W / 2) / (W / 2), (yy - H / 2) / (H / 2))
    v = np.zeros((H, W, 4), np.uint8); v[..., 3] = (np.clip((r - 0.8) / 0.6, 0, 1) * 150).astype(np.uint8)
    return Image.fromarray(v)

class Renderer:
    def __init__(self, tl, header=None):
        self.segs, self.total = build(tl)
        self.caps = caption_track(self.segs)
        self.vig = vignette(); self.header = header
        self.brand = L.serif_text("N O O R - U L - H A S R A T", 26, (230, 205, 140))
        self.capy = L.H * (0.76 if L.PORTRAIT else 0.86)
    def seg_at(self, T):
        for i, sg in enumerate(self.segs):
            if sg["T"] <= T < sg["T"] + sg["d"]: return i
        return len(self.segs) - 1
    def frame(self, T):
        i = self.seg_at(T); sg = self.segs[i]; tl = T - sg["T"]
        img = seg_frame(sg, tl)
        X = 0.45
        if i > 0 and tl < X:
            pv = self.segs[i - 1]
            img = Image.blend(seg_frame(pv, pv["d"] + tl), img, tl / X)
        if i == 0 and sg["kind"] in ("voice",) and tl < 0.4: img = Image.blend(Image.new("RGB", img.size, (0, 0, 0)), img, tl / 0.4)
        last = self.segs[-1]
        if T > self.total - 0.5 and last["kind"] == "endcard": img = Image.blend(img, Image.new("RGB", img.size, (0, 0, 0)), (T - (self.total - 0.5)) / 0.5)
        im = img.convert("RGBA"); im.alpha_composite(self.vig)
        for a, b, g, _ in self.caps:
            if a <= T < b:
                ci = L.caption_img(g); p = min(1, (T - a) / 0.12); sc = 0.84 + 0.16 * (1 - (1 - p) ** 3)
                if sc < 0.999: ci = ci.resize((int(ci.width * sc), int(ci.height * sc)), Image.BICUBIC)
                im.alpha_composite(ci, (int((L.W - ci.width) / 2), int(self.capy - ci.height / 2)))
                break
        # Shorts: his photo glows at the top for the opening seconds and on the closing card
        if self.header and last["kind"] == "endcard" and T >= last["T"]:
            al = min(1, (T - last["T"]) / 0.5)
            pc = A.portrait(L.H * 0.27)
            py = L.H * 0.24
            im = L.paste_center(im.convert("RGB"), pc, L.W / 2, py, alpha=al, scale=1 + 0.03 * min(1, T / 4.5)).convert("RGBA")
            nm = L.serif_text("Hazrat Azam Pasha R.A.", 46, (250, 232, 190))
            im = L.paste_center(im.convert("RGB"), nm, L.W / 2, py + pc.height * 0.47, alpha=al).convert("RGBA")
        if self.header:
            hi = L.serif_text(self.header, 40, L.GOLD, 4)
            im.alpha_composite(hi, (int((L.W - hi.width) / 2), int(L.H * 0.035)))
        if sg["kind"] not in ("title", "outro"):
            bx = int((L.W - self.brand.width) / 2) if L.PORTRAIT else int(L.W - self.brand.width - 40 * L.U)
            by = int(L.H * 0.93) if L.PORTRAIT else int(L.H - self.brand.height - 24 * L.U)
            im.alpha_composite(self.brand, (bx, by))
        return im.convert("RGB")

def render_range(r, f0, f1, path):
    p = subprocess.Popen(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{L.W}x{L.H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", "-threads", "1", path], stdin=subprocess.PIPE)
    for i in range(f0, f1): p.stdin.write(r.frame(i / FPS).tobytes())
    p.stdin.close(); p.wait()

def main():
    if MODE == "frames":
        which, ts, out = sys.argv[2], [float(x) for x in sys.argv[3].split(",")], sys.argv[4]
        if which == "full": r = Renderer(FULL)
        else: nm = which.split(":", 1)[1]; r = Renderer(SHORTS[nm][1], SHORTS[nm][0])
        fr = [r.frame(t) for t in ts]; tw = 480 if not L.PORTRAIT else 270
        th = int(tw * L.H / L.W); cols = min(4, len(fr)); rows = math.ceil(len(fr) / cols)
        sheet = Image.new("RGB", (tw * cols, th * rows))
        for k, f in enumerate(fr): sheet.paste(f.resize((tw, th)), ((k % cols) * tw, (k // cols) * th))
        sheet.save(out); print("total", round(r.total, 2)); return
    if MODE == "full": r = Renderer(FULL); out = sys.argv[2]; workers = int(sys.argv[3]) if len(sys.argv) > 3 else 2; tag = "full"
    else: nm = sys.argv[2]; r = Renderer(SHORTS[nm][1], SHORTS[nm][0]); out = sys.argv[3]; workers = int(sys.argv[4]) if len(sys.argv) > 4 else 2; tag = nm
    N = int(round(r.total * FPS)); tmp = os.path.join(os.path.dirname(os.path.abspath(out)), "chunks_" + tag); os.makedirs(tmp, exist_ok=True)
    # NOOR_CHUNKS=n splits the work into n pieces; finished pieces are kept (a .ok marker), so a stopped long render
    # picks up where it left off when the same command is run again.
    nch = int(os.environ.get("NOOR_CHUNKS", workers))
    bounds = [round(N * k / nch) for k in range(nch + 1)]
    todo = [k for k in range(nch) if not os.path.exists(os.path.join(tmp, "c%02d.ok" % k))]
    pids = []
    for w in range(workers):
        pid = os.fork()
        if pid == 0:
            for k in todo[w::workers]:
                render_range(r, bounds[k], bounds[k + 1], os.path.join(tmp, "c%02d.mp4" % k))
                open(os.path.join(tmp, "c%02d.ok" % k), "w").close()
            os._exit(0)
        pids.append(pid)
    for pid in pids: os.waitpid(pid, 0)
    with open(os.path.join(tmp, "list.txt"), "w") as f:
        for k in range(nch): f.write("file 'c%02d.mp4'\n" % k)
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", os.path.join(tmp, "list.txt"), "-c", "copy", out], check=True)
    import json
    json.dump({"total": r.total, "segs": r.segs}, open(out + ".json", "w"))
    print("video done", out, N, "frames", round(r.total, 2), "s")

if __name__ == "__main__": main()
