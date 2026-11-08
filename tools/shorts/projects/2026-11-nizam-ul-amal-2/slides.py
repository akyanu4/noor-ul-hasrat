"""Picture slideshows for Nizam-ul-Amal-e-Fuqara part 2 (images from ChatGPT, see the prompts file).
Faces of saints are hidden in light (glow). Times are in NAF002.mp3."""
SLIDES = {
    "n2_tawbah": [
        (198.0, "NA2-01", None, {"fx": "rays"}),           # dua under the light, smoke lifting
        (249.3, "NA2-01b", None),                            # turns to Allah with his heart
        (288.3, "NA2-01", None, {"fx": "rays"}),           # the reality of repentance
    ],
    "n2_newborn": [
        (459.8, "NA2-02", "all", {"fx": "rays"}),
        (486.5, "NA2-02", "all"),
    ],
    "n2_horse": [
        (658.2, "NA2-05", "all"),                            # the body asks for its needs
        (688.5, "NA2-04", "all", {"fx": "dust"}),            # fed too much: unruly
        (699.4, "NA2-03", "all", {"fx": "dust"}),            # feed it and make it run
        (735.0, "NA2-04", "all", {"fx": "dust"}),            # it rears, runs to bite
        (767.6, "NA2-05", "all"),                            # tired, its mischief ends
    ],
    "n2_wings": [
        (873.5, "NA2-06", "all"),
        (888.6, "NA2-06", "all"),
    ],
    "n2_tasawwur": [
        (1417.7, "NA0-01", "all"),                           # the book, the Sunday teaching
        (1447.5, "NA2-07", "all", {"glow": [(0.605, 0.165, 0.21), (0.61, 0.26, 0.14)]}),
        (1477.4, "NA2-07", "all", {"glow": [(0.605, 0.165, 0.21), (0.61, 0.26, 0.14)],
                                   "surprise": [(1481.4, 0.5, 0.36, "آنکھیں کھل گئیں"), (1512.6, 0.5, 0.36, "آنکھیں کھل گئیں")]}),
    ],
}

# ---- the full recording (34.5 min): the Shorts' own pictures in their ranges, a pool of general pictures between them.
from slidekit import full_track
POOL = [("NA0-01", "all"), ("NA2-01", "all", {"fx": "rays"}), ("NA2-06", "all"), ("NA2-02", "all", {"fx": "rays"}),
        ("NA2-05", "all"), ("NA2-01b", "all"), ("PORTRAIT", None)]
SLIDES["n2_full"] = full_track([
    (198.2, 313.4, [(b[0], b[1], "all") + tuple(b[3:]) for b in SLIDES["n2_tawbah"]]),
    (331.9, 366.8, [(331.9, "NA2-01b", "all")]),                       # the heart (an animated scene in the Short)
    (459.8, 501.5, SLIDES["n2_newborn"]),
    (658.2, 784.8, SLIDES["n2_horse"]),
    (873.5, 911.2, SLIDES["n2_wings"]),
    (1072.2, 1123.2, [(1072.2, "NA2-06", "all", {"fx": "rays"})]),     # the two wings
    (1417.7, 1518.7, SLIDES["n2_tasawwur"]),
], POOL, 0.0, 2074.0)
