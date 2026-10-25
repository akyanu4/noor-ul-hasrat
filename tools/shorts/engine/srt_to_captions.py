"""Turn an SRT (for example from TurboScribe, translated to English) into a project's captions.py.
python3 srt_to_captions.py <file.srt>[@offset] [<file2.srt>@offset ...] <project>/captions.py
A recording transcribed in parts: give each part's SRT with the second it starts at, e.g. A.srt B.srt@1597.13.
Times stay in seconds of the ORIGINAL recording. Afterwards, edit captions.py by hand: fix mistranslations
(for example 'Sarkar' -> 'the Prophet ﷺ'), drop garbled lines, and mark key words with *stars* (shown in gold)."""
import re, sys
def t(s): h, m, rest = s.strip().replace(".", ",").split(":"); sec, ms = rest.split(","); return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000
*srcs, out = sys.argv[1:]
rows = []
for src in srcs:
  off = float(src.rsplit("@", 1)[1]) if "@" in src else 0.0; src = src.rsplit("@", 1)[0] if "@" in src else src
  for b in re.split(r"\n\s*\n", open(src, encoding="utf-8-sig").read().strip()):
    ln = [x for x in b.splitlines() if x.strip()]
    if len(ln) < 2: continue
    i = 1 if "-->" in ln[1] else 0
    a, z = ln[i].split("-->"); text = " ".join(ln[i + 1:]).strip()
    if text: rows.append((round(t(a) + off, 2), round(t(z) + off, 2), text.replace('"', "'")))
with open(out, "w", encoding="utf-8") as f:
    f.write("# English captions (seconds in the ORIGINAL recording). *word* = shown in gold. Review by hand before rendering.\nCAPTIONS = [\n")
    for a, z, x in rows: f.write(f'    ({a:.2f}, {z:.2f}, "{x}"),\n')
    f.write("]\n")
print(len(rows), "captions ->", out)
