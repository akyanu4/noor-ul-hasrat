"""Add an opening card with his photo, and the photo on the closing card, to an already rendered Short.
python3 patch_shorts.py <ShortName>"""
import sys, os, json, subprocess
name = sys.argv[1]
sys.argv = ["render.py", "short", name, "x.mp4"]
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
src = open(os.path.join(HERE, "render.py")).read().replace('if __name__ == "__main__": main()', "")
g = {"__file__": os.path.join(HERE, "render.py"), "__name__": "x"}; exec(src, g)
L, A, FPS = g["L"], g["A"], g["FPS"]; SH = g["SHORTS"]; Image = g["Image"]
header, tl = SH[name]; r = g["Renderer"](tl, header)
import cfg; OUT = cfg.OUT; old = os.path.join(OUT, name + "_video.mp4")
INTRO = 3.5
def intro(t):
    img = A.bg_night().copy()
    img = L.screen(img, L.glow_layer(lambda dr, s: L.draw_motes(dr, t, s, seed=5, n=60), blur=5))
    a = min(1, t / 0.5, (INTRO - t) / 0.45)
    img = L.paste_center(img, A.portrait(L.H * 0.34), L.W / 2, L.H * 0.33, alpha=a, scale=1 + 0.03 * t / INTRO)
    img = L.paste_center(img, L.serif_text("Hazrat Azam Pasha", 72), L.W / 2, L.H * 0.56, alpha=a)
    img = L.paste_center(img, L.serif_text("RAHMATULLAH ALAIH", 30, L.GOLD, 6), L.W / 2, L.H * 0.60, alpha=a)
    img = L.paste_center(img, L.caption_img(tuple("*" + w + "*" for w in header.split())), L.W / 2, L.H * 0.71, alpha=a * L.sm(0.4, 1.0, t))
    img = img.convert("RGBA"); img.alpha_composite(r.vig); return img.convert("RGB")
def enc(frames_fn, n, path):
    p = subprocess.Popen(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{L.W}x{L.H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)
    for i in range(n): p.stdin.write(frames_fn(i).tobytes())
    p.stdin.close(); p.wait()
last = r.segs[-1]; N = int(round(r.total * FPS)); e0 = int(round(last["T"] * FPS))
ip, ep = os.path.join(OUT, name + "_intro.mp4"), os.path.join(OUT, name + "_end.mp4")
enc(lambda i: intro(i / FPS), int(INTRO * FPS), ip)
enc(lambda i: r.frame((e0 + i) / FPS), N - e0, ep)
newv = os.path.join(OUT, name + "_video2.mp4")
fc = f"[0:v]setpts=PTS-STARTPTS[a];[1:v]trim=end_frame={e0},setpts=PTS-STARTPTS[b];[2:v]setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0,format=yuv420p[v]"
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", ip, "-i", old, "-i", ep, "-filter_complex", fc, "-map", "[v]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", newv], check=True)
segs = [dict(kind="title", T=0.0, d=INTRO)] + [dict(sg, T=sg["T"] + INTRO) for sg in r.segs]
json.dump({"total": r.total + INTRO, "segs": segs}, open(newv + ".json", "w"))
subprocess.run([sys.executable, os.path.join(HERE, "audio.py"), newv, os.path.join(OUT, name + ".mp4")], check=True)
print("patched", name, round(r.total + INTRO, 2), "s")
