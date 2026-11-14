"""Burn the channel watermark into a finished video, so copies downloaded and forwarded on WhatsApp still show where
they come from and how to subscribe. Works on any rendered file in seconds-to-minutes (no re-render).

    python3 watermark.py <in.mp4> <out.mp4>          (reads the lines from the project's project.json "watermark")

project.json:  "watermark": ["YouTube  @handle  ·  SUBSCRIBE", "Noor-ul-Hasrat app: noor-ul-hasrat.vercel.app"]
The first line gets a red YouTube play badge. Placed low in the frame, under the captions, on a soft dark pill."""
import sys, os, json, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import cfg, lib as L

DEFAULT = ["YouTube  @iqra-letslearn7278  ·  SUBSCRIBE", "Noor-ul-Hasrat app  ·  noor-ul-hasrat.vercel.app"]

def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip()
    w, h = out.split(",")[:2]; return int(w), int(h)

def badge(w, h, lines):
    L.setup(w, h); U = L.U
    f1 = L.font(L.BOLD, (34 if L.PORTRAIT else 26) * U); f2 = L.font(L.BOLD, (26 if L.PORTRAIT else 20) * U)
    tmp = ImageDraw.Draw(Image.new("L", (1, 1)))
    icon = int(f1.size * 1.25); gap = int(12 * U)
    w1 = icon + gap + int(tmp.textlength(lines[0], font=f1)); w2 = int(tmp.textlength(lines[1], font=f2)) if len(lines) > 1 else 0
    pw = max(w1, w2) + int(56 * U); ph = int((f1.size * 1.5 + (f2.size * 1.5 if w2 else 0)) + 26 * U)
    im = Image.new("RGBA", (pw, ph), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, pw - 1, ph - 1), radius=int(ph * 0.28), fill=(0, 0, 0, 125))
    y1 = int(13 * U); x = (pw - w1) // 2
    # red YouTube badge with a white play triangle
    ih = int(icon * 0.72); iy = y1 + int((f1.size * 1.3 - ih) / 2)
    d.rounded_rectangle((x, iy, x + icon, iy + ih), radius=int(ih * 0.28), fill=(230, 33, 23, 255))
    cx, cy, s = x + icon / 2, iy + ih / 2, ih * 0.26
    d.polygon([(cx - s * 0.8, cy - s), (cx - s * 0.8, cy + s), (cx + s * 1.1, cy)], fill=(255, 255, 255, 255))
    d.text((x + icon + gap, y1), lines[0], font=f1, fill=(255, 255, 255, 245), stroke_width=max(1, int(2 * U)), stroke_fill=(0, 0, 0, 200))
    if w2:
        d.text(((pw - w2) // 2, y1 + int(f1.size * 1.45)), lines[1], font=f2, fill=(240, 205, 120, 240), stroke_width=max(1, int(2 * U)), stroke_fill=(0, 0, 0, 200))
    return im

BAYAH_UR = "مرید بنیں ، پہلے بیعت کریں"
def murid_badge(w, h):
    """For Shorts that teach a practice (project.json "bayah_shorts"): a mark under the heading, the whole video long."""
    L.setup(w, h); U = L.U
    f = L.font(L.BOLD, (24 if L.PORTRAIT else 18) * U); tx = "FOR MURIDS  ·  TAKE BAY\u2019AH FIRST"
    ur = L.urdu(BAYAH_UR, int((25 if L.PORTRAIT else 20) * U), (240, 205, 120), path=L.URDU_R)
    ur = ur.crop(ur.getbbox() or (0, 0, ur.width, ur.height))
    tw = int(ImageDraw.Draw(Image.new("L", (1, 1))).textlength(tx, font=f))
    pw = max(tw, ur.width) + int(48 * U); ph = int(f.size * 1.5 + ur.height + 24 * U)
    im = Image.new("RGBA", (pw, ph), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, pw - 1, ph - 1), radius=int(ph * 0.25), fill=(0, 0, 0, 120), outline=(201, 162, 75, 200), width=max(1, int(2 * U)))
    d.text(((pw - tw) // 2, int(8 * U)), tx, font=f, fill=(255, 255, 255, 240), stroke_width=max(1, int(2 * U)), stroke_fill=(0, 0, 0, 200))
    im.alpha_composite(ur.convert("RGBA"), ((pw - ur.width) // 2, int(10 * U + f.size * 1.45)))
    return im

def apply(src, dst, lines=None):
    lines = lines or cfg.P.get("watermark") or DEFAULT
    w, h = probe(src); b = badge(w, h, lines)
    y = int(h * (0.865 if h > w else 0.80) - b.height / 2); x = (w - b.width) // 2
    png = tempfile.NamedTemporaryFile(suffix=".png", delete=False).name; b.save(png)
    name = os.path.basename(src).rsplit(".", 1)[0]
    if name in cfg.P.get("bayah_shorts", []):   # practice Shorts also carry "for murids, take Bay'ah first" under the heading
        m = murid_badge(w, h); bg = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        bg.alpha_composite(m, ((w - m.width) // 2, int(h * (0.075 if h > w else 0.10))))
        bg.alpha_composite(b, (x, y)); b = bg; x = y = 0; b.save(png)
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", src, "-i", png, "-filter_complex", f"[0:v][1:v]overlay={x}:{y}:format=auto,format=yuv420p[v]",
                    "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-preset", "medium", "-crf", os.environ.get("NOOR_WM_CRF", "23"), "-maxrate", os.environ.get("NOOR_WM_MAXRATE", "2M"), "-bufsize", "4M", "-c:a", "copy", "-movflags", "+faststart", dst], check=True)
    os.unlink(png)

if __name__ == "__main__":
    apply(sys.argv[1], sys.argv[2]); print("watermarked", sys.argv[2])
