"""Picture slideshows for Nizam-ul-Amal-e-Fuqara part 4. Times are in NAF004.mp3."""
SLIDES = {
    "n4_sabr": [
        (330.4, "NA4-07", None, {"fx": "dust"}),                                   # poverty: an empty kitchen, a few coins
        (337.6, "NA4-08", None),                                                   # illness: an old man on a charpai
        (345.0, "NA4-01", "all", {"fx": "rain", "lightning": [345.4, 351.3]}),     # the storm of hardship
        (355.0, "NA4-09", "all", {"fx": "rays", "text": "صبر", "text_at": (0.84, 0.33)}),
        (364.0, "NA4-10", "all", {"text": "تسلیم"}),
        (373.2, "NA4-11", "all", {"fx": "rays", "text": "رضا",
                                  "surprise": [(384.4, 0.5, 0.36, "إِنَّ اللّٰهَ مَعَ الصّٰبِرِينَ")]}),
    ],
    "n4_raza": [
        (896.1, "NA4-02", "all", {"fx": "rays"}),
    ],
    "n4_path": [
        (519.2, "NA4-03", "all", {"fx": "rays"}),
        (558.0, "NA4-03", "all"),
    ],
    "n4_snake": [
        (1584.3, "NA4-04", "all", {"fx": "snow"}),
        (1600.5, "NA4-05", "all", {"fx": "embers", "surprise": [(1601.6, 0.5, 0.36, "پھن پھیلا کر اٹھا")]}),
    ],
    "n4_dog": [
        (1723.9, "NA4-06", "all", {"surprise": [(1741.3, 0.5, 0.36, "أعوذ بالله")]}),
        (1776.3, "NA4-06", "all", {"fx": "rays"}),
    ],
}

# ---- the full recording (39 min): the Shorts' own pictures in their ranges, a pool of general pictures between them.
# NA4-07..NA4-16 (the new Sabr / Shaytan pictures) join automatically once they are in images/.
import os
from slidekit import full_track
_IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "images")
def _has(c): return os.path.exists(os.path.join(_IMG, c + ".png"))
_SABR = [(b[0], b[1], "all") + tuple(b[3:]) for b in SLIDES["n4_sabr"]]   # the Short's pictures, whole, for the wide frame
POOL = [("NA0-01", "all"), ("NA3-04", "all"), ("NA4-03", "all", {"fx": "rays"}), ("NA2-01", "all", {"fx": "rays"}),
        ("NA3-05", "all"), ("NA4-02", "all", {"fx": "rays"}), ("NA3-01", "all"), ("PORTRAIT", None)]
# the pool stays fixed, so a re-rendered chunk joins its neighbours seamlessly
SLIDES["n4_full"] = full_track([
    (330.4, 390.4, _SABR),
    (519.2, 582.2, SLIDES["n4_path"]),
    (599.3, 637.8, [(599.3, "NA4-10", "all")] if _has("NA4-10") else [(599.3, "NA3-04", "all")]),
    (896.1, 931.0, SLIDES["n4_raza"]),
    (1584.3, 1621.4, SLIDES["n4_snake"]),
    (1621.4, 1723.9, [b for b in [(1621.4, "NA4-12", "all"), (1647.4, "NA4-13", "all"), (1677.7, "NA4-14", "all"),
                                   (1698.5, "NA4-15", "all"), (1712.0, "NA4-16", "all", {"fx": "rays"})] if _has(b[1])]
                     or [(1621.4, "NA4-06", "all")]),
    (1723.9, 1789.1, SLIDES["n4_dog"]),
], POOL, 0.0, 2346.0)
