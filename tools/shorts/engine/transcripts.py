"""Transcript helpers for a dars recording (TurboScribe workflow).

  split  <audio> <outdir> [--max 29]      cut the recording into pieces under N minutes for TurboScribe's free plan,
                                          at the quietest moment near each cut; names carry the offset (…_from_28m42s.mp3)
  check  <srt> [--offset S] [--audio A] [--end S] report what TurboScribe dropped: gaps with no text, runs of one repeated word
                                          ("Kitab Kitab…"), a file that stops early. With --audio, a gap only counts if
                                          the audio there is not silent. Prints JSON: {"ok": bool, "problems": [...]}
  redo   <audio> <check.json> <outdir>    cut a retry clip for every problem (45 s before, 15 s after)
  merge  <out.srt> <srt>...               join pieces into one SRT in recording time; the offset is read from each name
                                          (…from_12m50s…); a later piece replaces earlier lines it overlaps
  pauses <audio> <t1,t2,...> [--win 3]    the quietest moment within ±win s of each time (cut points for Shorts)
"""
import json, os, re, subprocess, sys
import numpy as np

def pcm(path, sr=8000):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32), sr

def energy(path, hop=0.1):
    a, sr = pcm(path); w = int(sr * hop); n = len(a) // w
    return 20 * np.log10(np.sqrt((a[:n * w].reshape(n, w) ** 2).mean(1)) + 1.0), hop

def quietest(e, hop, t, win):
    i0, i1 = max(0, int((t - win) / hop)), min(len(e), int((t + win) / hop) + 1)
    if i1 <= i0: return t
    seg = np.pad(e[i0:i1], 2, mode="edge")          # edge padding: zero padding made the window ends look quietest
    k = int(np.convolve(seg, np.ones(5) / 5, mode="valid").argmin())
    return round((i0 + k) * hop, 1)

def tag(sec):
    sec = int(round(sec)); return f"{sec // 60:02d}m{sec % 60:02d}s"

def offset_of(name):
    m = re.search(r"from[ _](\d+)m(\d+)s", name)
    return int(m.group(1)) * 60 + int(m.group(2)) if m else 0

def ts(s):
    h, m, r = s.split(":"); sec, ms = r.replace(".", ",").split(",")
    return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000

def fmt(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def read_srt(path):
    out = []
    for block in re.split(r"\n\s*\n", open(path, encoding="utf-8-sig").read().strip()):
        lines = block.strip().splitlines()
        if len(lines) < 2 or "-->" not in lines[1]: continue
        a, b = [ts(x.strip()) for x in lines[1].split("-->")]
        text = re.sub(r"\(Transcribed by TurboScribe[^)]*\)\s*", "", " ".join(lines[2:])).strip()
        out.append((a, b, text))
    return out

def duration(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                                capture_output=True, text=True).stdout)

def cmd_split(audio, outdir, maxmin=29.0):
    os.makedirs(outdir, exist_ok=True)
    total = duration(audio); n = int(np.ceil(total / (maxmin * 60)))
    e, hop = energy(audio)
    cuts = [0.0] + [quietest(e, hop, total * k / n, 20) for k in range(1, n)] + [total]
    stem = os.path.splitext(os.path.basename(audio))[0]; made = []
    for k in range(n):
        out = os.path.join(outdir, f"{stem}_part{k + 1}_from_{tag(cuts[k])}.mp3")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(cuts[k]), "-to", str(cuts[k + 1]), "-i", audio,
                        "-c", "copy", out], check=True)
        made.append({"file": out, "start": cuts[k], "end": cuts[k + 1]})
    print(json.dumps(made, indent=1))

def cmd_check(srt, offset=None, audio=None, until=None):
    off = offset_of(srt) if offset is None else offset
    cues = read_srt(srt); problems = []
    e = hop = None; med = None
    if audio:
        e, hop = energy(audio); med = float(np.median(e))
    def spoken(a, b):          # is there speech in [a, b] of the full recording?
        if e is None: return True
        seg = e[int(a / hop):int(b / hop)]
        return len(seg) > 0 and float(np.mean(seg > med - 10)) > 0.4
    prev = 0.0
    for a, b, t in cues:
        if a - prev > 45 and spoken(off + prev, off + a):
            problems.append({"kind": "gap", "start": off + prev, "end": off + a})
        prev = max(prev, b)
    run = None                 # runs of one repeated word ("Kitab Kitab Kitab")
    for a, b, t in cues:
        w = t.split()
        bad = len(w) >= 2 and len(set(x.lower().strip(".,!?") for x in w)) == 1
        if bad: run = [run[0] if run else a, b]
        elif run:
            if run[1] - run[0] > 20: problems.append({"kind": "repeated", "start": off + run[0], "end": off + run[1]})
            run = None
    if run and run[1] - run[0] > 20: problems.append({"kind": "repeated", "start": off + run[0], "end": off + run[1]})
    if audio:
        # the piece's length: --end (recording time), its mp3 beside the srt, or at most 29.5 min (TurboScribe pieces)
        mp3 = srt.rsplit(".", 1)[0] + ".mp3"
        end = (until - off) if until else duration(mp3) if os.path.exists(mp3) else min(len(e) * hop - off, 1770.0)
        if end - prev > 45 and spoken(off + prev, off + min(end, prev + 120)):
            problems.append({"kind": "stopped_early", "start": off + prev, "end": off + end})
    merged = []
    for p in sorted(problems, key=lambda p: p["start"]):
        # one bad stretch, even with a few good-looking lines in it
        if merged and p["start"] <= merged[-1]["end"] + 60: merged[-1]["end"] = max(merged[-1]["end"], p["end"])
        else: merged.append(dict(p))
    print(json.dumps({"srt": srt, "offset": off, "cues": len(cues), "ok": not merged,
                      "problems": [{**p, "start": round(p["start"], 1), "end": round(p["end"], 1)} for p in merged]},
                     indent=1))

def cmd_redo(audio, check_json, outdir):
    os.makedirs(outdir, exist_ok=True)
    stem = os.path.splitext(os.path.basename(audio))[0]; total = duration(audio); made = []
    for p in json.load(open(check_json))["problems"]:
        a, b = max(0.0, p["start"] - 45), min(total, p["end"] + 15)   # garbling starts a little before it shows
        k = 0                  # keep each clip under 29 minutes
        while a + k * 1740 < b:
            s, t = a + k * 1740, min(b, a + (k + 1) * 1740 + 10)
            out = os.path.join(outdir, f"{stem}_redo_from_{tag(s)}.mp3")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(s), "-to", str(t), "-i", audio, "-c", "copy", out],
                           check=True)
            made.append({"file": out, "start": round(s, 1), "end": round(t, 1)}); k += 1
    print(json.dumps(made, indent=1))

def cmd_merge(out, srts):
    cues = []
    for p in sorted(srts, key=lambda p: ("redo" in p, offset_of(p))):   # redo pieces last, so they win
        off = offset_of(p); new = [(a + off, b + off, t) for a, b, t in read_srt(p)
                                   if t and not re.fullmatch(r"(\w+)( \1)+[.!?]?", t, re.I)]
        if new:
            lo, hi = new[0][0], new[-1][1]
            cues = [c for c in cues if c[1] <= lo or c[0] >= hi]
        cues += new
    cues.sort()
    with open(out, "w", encoding="utf-8") as f:
        for i, (a, b, t) in enumerate(cues, 1): f.write(f"{i}\n{fmt(a)} --> {fmt(b)}\n{t}\n\n")
    print(f"{out}: {len(cues)} cues, {fmt(cues[0][0]) if cues else '-'} to {fmt(cues[-1][1]) if cues else '-'}")

def cmd_pauses(audio, times, win=3.0):
    e, hop = energy(audio)
    print(json.dumps({t: quietest(e, hop, float(t), win) for t in times.split(",")}, indent=1))

def opt(args, name, default=None, cast=str):
    if name in args:
        i = args.index(name); v = cast(args[i + 1]); del args[i:i + 2]; return v
    return default

if __name__ == "__main__":
    a = sys.argv[1:]
    if not a: print(__doc__); sys.exit(1)
    c = a.pop(0)
    if c == "split": m = opt(a, "--max", 29.0, float); cmd_split(a[0], a[1], m)
    elif c == "check":
        o = opt(a, "--offset", None, float); au = opt(a, "--audio"); u = opt(a, "--end", None, float)
        cmd_check(a[0], o, au, u)
    elif c == "redo": cmd_redo(a[0], a[1], a[2])
    elif c == "merge": cmd_merge(a[0], a[1:])
    elif c == "pauses": w = opt(a, "--win", 3.0, float); cmd_pauses(a[0], a[1], w)
    else: print(__doc__); sys.exit(1)
