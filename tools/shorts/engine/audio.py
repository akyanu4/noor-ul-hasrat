"""Build the soundtrack for a rendered timeline: his voice in the voice segments, calm nasheed only in pauses/title/outro.
python3 audio.py <video.mp4> <out.mp4>   (reads <video.mp4>.json written by render.py)"""
import sys, json, subprocess, os
VID, OUT = sys.argv[1], sys.argv[2]
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import cfg
SRC, MUS = cfg.AUDIO, cfg.MUSIC
CLEAN = os.path.join(cfg.WORK, "voice_clean.wav")
if not os.path.exists(CLEAN):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", SRC, "-af", "highpass=f=80,afftdn=nr=10:nf=-30,loudnorm=I=-15:TP=-1.5:LRA=11", "-ar", "44100", "-ac", "2", CLEAN], check=True)
meta = json.load(open(VID + ".json")); segs = meta["segs"]; total = meta["total"]
EQ = "highpass=f=120,equalizer=f=900:width_type=o:width=1.5:g=5,equalizer=f=2200:width_type=o:width=1.5:g=3,volume=0.65"
offs = [4, 16, 28, 40, 52, 64, 76]; mi = 0
inputs, fl, labels = [], [], []
for sg in segs:
    k = len(inputs) // 6 if False else None
    d = sg["d"]; T = sg["T"]; ms = int(round(T * 1000))
    if sg["kind"] == "voice":
        inputs += ["-ss", "%.3f" % sg["a"], "-t", "%.3f" % d, "-i", CLEAN]
        i = len(labels); fl.append(f"[{i}:a]asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st={max(0, d - 0.06):.3f}:d=0.06,adelay={ms}|{ms}[s{i}]")
    elif any(str(x).startswith("recite:") for x in sg.get("args", [])):
        # Qur'an recitation in this pause (no music): "recite:<file in the project>:<from s>:<to s>[:<delay s>]"
        r = [x for x in sg["args"] if str(x).startswith("recite:")][0].split(":")
        f, a0, a1, dl = os.path.join(cfg.PROJECT, r[1]), float(r[2]), float(r[3]), float(r[4]) if len(r) > 4 else 0.5
        rd = a1 - a0; rms = ms + int(dl * 1000)
        inputs += ["-ss", "%.3f" % a0, "-t", "%.3f" % rd, "-i", f]
        i = len(labels); fl.append(f"[{i}:a]asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=stereo,loudnorm=I=-16:TP=-1.5,afade=t=in:d=0.15,afade=t=out:st={max(0, rd - 0.4):.3f}:d=0.4,adelay={rms}|{rms}[s{i}]")
    else:
        off = offs[mi % len(offs)]; mi += 1
        md = min(d + 0.4, 95 - off)
        inputs += ["-ss", str(off), "-t", "%.3f" % md, "-i", MUS]
        i = len(labels); fl.append(f"[{i}:a]asetpts=PTS-STARTPTS,aformat=channel_layouts=stereo,{EQ},afade=t=in:d=0.8,afade=t=out:st={max(0, md - 1.2):.3f}:d=1.2,adelay={max(0, ms - 200)}|{max(0, ms - 200)}[s{i}]")
    labels.append(f"[s{i}]")
fl.append("".join(labels) + f"amix=inputs={len(labels)}:normalize=0:duration=longest,alimiter=limit=0.89,atrim=0:{total:.3f}[a]")
cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", VID] + inputs + ["-filter_complex", ";".join(fl.copy()).replace("[0:a]", "[0:a]")]
# shift input indexes by one (input 0 is the video)
fixed = []
for line in fl:
    import re
    fixed.append(re.sub(r"^\[(\d+):a\]", lambda m: "[%d:a]" % (int(m.group(1)) + 1), line))
cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", VID] + inputs + ["-filter_complex", ";".join(fixed), "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", OUT]
subprocess.run(cmd, check=True); print("muxed", OUT)
