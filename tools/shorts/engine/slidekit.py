"""Helpers for project slides.py files (no imports from the engine, so slides.py can use it freely)."""

def full_track(parts, pool, start, end, step=22.0):
    """One slideshow for a whole recording: the Shorts' own beats inside their ranges, and between them the pool of
    general pictures, one every `step` seconds. parts = [(a, b, beats)], beats as in SLIDES (first time may be 0.0)."""
    out, t, k = [], start, 0
    for a, b, beats in sorted(parts, key=lambda p: p[0]):
        while t < a - 4:
            c = pool[k % len(pool)]; k += 1
            out.append((t,) + tuple(c)); t += step
        out += [((a if bt[0] == 0.0 else bt[0]),) + tuple(bt[1:]) for bt in beats]
        t = b
    while t < end:
        c = pool[k % len(pool)]; k += 1
        out.append((t,) + tuple(c)); t += step
    return out
