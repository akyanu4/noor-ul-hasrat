"""Carry the Urdu/Arabic words of a slideshow (slides.py "text" / "surprise") over to the animated clip scenes of
timeline.py, writing <project>/clip_words.py (read by scenes_v.py). A slide's text goes to the clip that is playing
at the slide's start time; a surprise goes to the clip playing at its own time.
Usage: python3 engine/clip_words.py <project folder>"""
import os, sys, pprint

def load(p):
    ns = {"__file__": os.path.abspath(p), "__name__": "x"}; exec(open(p, encoding="utf-8").read(), ns); return ns

def main(proj):
    slides = load(os.path.join(proj, "slides.py"))["SLIDES"]
    shorts = load(os.path.join(proj, "timeline.py"))["SHORTS"]
    clips = [(e[1], e[2], e[3][5:]) for _, (_, tl) in shorts.items() for e in tl
             if e[0] == "voice" and str(e[3]).startswith("clip:")]
    def at(t):
        for a, b, n in clips:
            if a - 1e-6 <= t < b: return n
    words = {}
    for beats in slides.values():
        for b in beats:
            t, o = b[0], (b[3] if len(b) > 3 and isinstance(b[3], dict) else {})
            if o.get("text"):
                n = at(t + 0.05)
                if n and "text" not in words.get(n, {}):
                    w = words.setdefault(n, {}); w["text"] = o["text"]
                    if "text_at" in o: w["text_at"] = o["text_at"]
            for s in o.get("surprise", []):
                n = at(s[0])
                if n:
                    l = words.setdefault(n, {}).setdefault("surprise", [])
                    if tuple(s) not in l: l.append(tuple(s))
    out = os.path.join(proj, "clip_words.py")
    with open(out, "w", encoding="utf-8") as f:
        f.write('"""Urdu/Arabic words over the animated clips (made by engine/clip_words.py from slides.py; edit freely)."""\n')
        f.write("WORDS = " + pprint.pformat(dict(sorted(words.items())), width=110, sort_dicts=True) + "\n")
    print(out, len(words), "clips with words")

if __name__ == "__main__":
    main(sys.argv[1])
