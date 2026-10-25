"""Image slideshows for the Haqeeqat-e-Bai'at Shorts: (time in the recording, image code, sharp crop or None)."""
SQ = (0, 209, 540, 750)   # images cut from the collages: only this square is sharp
SLIDES = {
    "hb_rein": [
        (0.0, "HB2-01", SQ),        # caravan: bai'at on not asking anyone
        (336.55, "HB2-02", SQ),     # the rein falls, the camel kneels
        (344.0, "HB2-03", SQ),      # he picks it up himself
        (352.29, "HB2-01", SQ),     # the rein steers the camel
        (362.0, "HB2-02", SQ),      # making it kneel is trouble
        (368.5, "HB2-03", SQ),
        (372.5, "HB2-04", SQ),      # yet that is what the Companions did
    ],
    "hb_stone": [
        (0.0, "HB5-01", None),      # a stone thrown into water: ripples
        (1918.0, "HB4-01", None),   # thoughts and company spread all around
        (1947.87, "HB4-02", SQ),    # good company leads to good
        (1958.0, "HB5-01", None),   # one pebble makes a circle
        (1970.67, "HB5-02", None),  # big stone and small pebble together
        (2011.43, "HB4-02", SQ),    # sitting in the company of a perfected one
        (2024.0, "HB3-04", SQ),     # his doubts grow weaker
        (2033.47, "HB4-04", SQ),    # shaped by the company of the perfected one
        (2043.0, "HB3-03", SQ),     # the path ahead
    ],
}
