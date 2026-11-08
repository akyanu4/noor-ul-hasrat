"""Picture slideshows for Nizam-ul-Amal-e-Fuqara part 3. Times are in NAF003.mp3."""
SLIDES = {
    "n3_taqwa": [
        (55.4, "NA3-01", "all"),
        (124.5, "NA3-01", "all"),
    ],
    "n3_time": [
        (180.0, "NA3-02", "all", {"glow": [(0.51, 0.29, 0.11)]}),   # the Sufi's face hidden in light
    ],
    "n3_work": [
        (404.2, "NA3-03", "all", {"fx": "dust"}),
        (438.9, "NA3-03", "all", {"fx": "rays"}),
    ],
    "n3_istikhara": [
        (608.4, "NA3-04", "all"),
        (662.1, "NA3-04", "all"),
    ],
    "n3_vigil": [
        (850.4, "NA3-05", "all"),
        (865.1, "NA3-05", "all"),
    ],
}

# ---- the full recording (50 min): the Shorts' own pictures in their ranges, a pool of general pictures between them.
from slidekit import full_track
POOL = [("NA0-01", "all"), ("NA3-01", "all"), ("NA2-01", "all", {"fx": "rays"}), ("NA3-04", "all"),
        ("NA3-03", "all", {"fx": "rays"}), ("NA3-05", "all"), ("PORTRAIT", None)]
SLIDES["n3_full"] = full_track([
    (55.4, 151.0, SLIDES["n3_taqwa"]),
    (180.0, 243.2, SLIDES["n3_time"]),
    (320.5, 374.4, [(320.5, "NA2-01", "all", {"fx": "rays"})]),        # dua (an animated scene in the Short)
    (404.2, 467.1, SLIDES["n3_work"]),
    (608.4, 711.5, SLIDES["n3_istikhara"]),
    (850.4, 1001.9, SLIDES["n3_vigil"]),
], POOL, 0.0, 3026.0)
