import sys, os, time, math
which = sys.argv[1]; out = sys.argv[2]; pick = sys.argv[3] if len(sys.argv) > 3 else "mid"
sys.argv = ["render.py", "frames", which, "0", out]
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
src = open(os.path.join(HERE, "render.py")).read().replace("if __name__ == \"__main__\": main()", "")
g = {"__file__": os.path.join(HERE, "render.py"), "__name__": "x"}; exec(src, g)
L = g["L"]; R = g["Renderer"]; FULL = g["FULL"]; SHORTS = g["SHORTS"]; Image = g["Image"]
r = R(FULL) if which == "full" else R(SHORTS[which.split(":")[1]][1], SHORTS[which.split(":")[1]][0])
ts = []
for sg in r.segs:
    if pick == "mid": ts.append(sg["T"] + sg["d"] * 0.6)
    else: ts += [sg["T"] + sg["d"] * f for f in (0.25, 0.75)]
if pick.startswith("T="): ts = [float(x) for x in pick[2:].split(",")]
t0 = time.time(); fr = [r.frame(t) for t in ts]; print("per frame %.2fs" % ((time.time() - t0) / len(fr)), "total", round(r.total, 1))
tw = 400 if not L.PORTRAIT else 225; th = int(tw * L.H / L.W); cols = 5 if not L.PORTRAIT else 8; rows = math.ceil(len(fr) / cols)
sheet = Image.new("RGB", (tw * cols, th * rows))
for k, f in enumerate(fr): sheet.paste(f.resize((tw, th)), ((k % cols) * tw, (k // cols) * th))
sheet.save(out); print([round(t, 1) for t in ts])
