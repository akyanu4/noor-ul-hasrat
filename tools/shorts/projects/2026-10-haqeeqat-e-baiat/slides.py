"""Image slideshows for the Haqeeqat-e-Bai'at Shorts, recording 1: (time in the recording, image code, crop, options).
Faces of the shaykh/saints get "glow" so they are hidden in light (the family's rule)."""
SQ = (0, 209, 540, 750)   # images cut from the collages: only this square is sharp
F = {"frame": True}
YAD = "یَدُ اللّٰهِ فَوْقَ اَیْدِیْهِمْ"
SLIDES = {
    "hb_hand": [
        (0.0, "HB1-01", "all"),                                       # "On its first page is written: Allah says"
        (66.4, "HB1-01", "all", {"text": "اِنَّ الَّذِیْنَ یُبَایِعُوْنَكَ"}),
        (85.6, "HB1-03", "all", {"text": YAD}),                       # the Hand of Allah is over their hands
        (98.0, "HB1-02", "all", {"glow": [(0.31, 0.22, 0.11)]}),     # those who become murids
        (131.8, "HB1-01", "all"),                                     # Bismillah: Bai'at and Iradat
        (145.0, "HB1-03", "all", {"text": YAD}),
        (159.5, "HB1-04", "all"),                                     # verse 10: those who pledge with you pledge with Allah
        (174.0, "HB1-05", "all"),                                     # who breaks it / who stays faithful
        (188.0, "HB1-03", "all", {"text": "اللّٰهُ اَکْبَر"}),
    ],
    "hb_rein": [
        (0.0, "HB2-01", SQ),        # caravan: bai'at on not asking anyone
        (336.55, "HB2-02", SQ),     # the rein falls, the camel kneels
        (344.0, "HB2-03", SQ),      # he picks it up himself
        (352.29, "HB2-01", SQ),     # the rein steers the camel
        (362.0, "HB2-02", SQ),      # making it kneel is trouble
        (368.5, "HB2-03", SQ),
        (372.5, "HB2-04", SQ),      # yet that is what the Companions did
    ],
    "hb_teacher": [
        (0.0, "HB3-01", SQ),        # two and two make four
        (478.0, "HB3-02", SQ),      # learned from teachers, class 1 to 10
        (497.0, "HB3-01", SQ),      # a person cannot see his own mistakes
        (512.0, "HB3-02", SQ),      # the teacher keeps catching them
        (531.4, "HB3-03", SQ),      # the path of Allah
        (545.0, "HB3-04", SQ, {"glow": [(0.245, 0.25, 0.09)]}),   # why would a shaykh not be needed?
    ],
    "hb_wali": [
        (0.0, "HB4-01", None),      # Chadarghat bridge towards Malakpet
        (1780.8, "HB4-02", SQ, {"glow": [(0.28, 0.42, 0.09)]}),    # an old wali in the mosque, all listening
        (1804.4, "HB4-03", SQ),     # he throws his staff
        (1836.2, "HB4-04", SQ, {"glow": [(0.22, 0.30, 0.09), (0.75, 0.33, 0.09)]}),  # Qadeer Piya caught it
        (1846.0, "HB4-03", SQ),     # without turning round he knew
        (1856.0, "HB4-04", SQ, {"glow": [(0.22, 0.30, 0.09), (0.75, 0.33, 0.09)]}),
        (1870.7, "HB4-02", SQ, {"glow": [(0.28, 0.42, 0.09)]}),    # a wali recognises a wali
        (1886.0, "HB4-04", SQ, {"glow": [(0.22, 0.30, 0.09), (0.75, 0.33, 0.09)]}),
    ],
    "hb_stone": [
        (0.0, "HB5-01", None),      # a stone thrown into water: ripples
        (1918.0, "HB4-01", None),   # thoughts and company spread all around
        (1947.87, "HB4-02", SQ, {"glow": [(0.28, 0.42, 0.09)]}),   # good company leads to good
        (1958.0, "HB5-01", None),   # one pebble makes a circle
        (1970.67, "HB5-02", None),  # big stone and small pebble together
        (2011.43, "HB4-02", SQ, {"glow": [(0.28, 0.42, 0.09)]}),   # the company of a perfected one
        (2024.0, "HB3-04", SQ, {"glow": [(0.245, 0.25, 0.09)]}),   # his doubts grow weaker
        (2033.47, "HB4-04", SQ, {"glow": [(0.22, 0.30, 0.09), (0.75, 0.33, 0.09)]}),
        (2043.0, "HB3-03", SQ),     # the path ahead
    ],
    "hb_pir": [
        (0.0, "N-HB6-01", "all", F),                                # is it necessary to become a murid? the path at night
        (2528.3, "N-HB5-03", "all", F),                             # whoever has no pir, his pir is Shaytan
        (2546.9, "N-HB6-02", "all", dict(F, glow=[(0.25, 0.38, 0.11)])),   # the master's hand: Shaytan cannot touch him
    ],
}
