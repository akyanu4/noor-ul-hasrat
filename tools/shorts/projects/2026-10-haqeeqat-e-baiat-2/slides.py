"""Image slideshows for the Haqeeqat-e-Bai'at Shorts, recording 2 (images shared with recording 1's folder)."""
F = {"frame": True}
SLIDES = {
    "hb_rise": [
        (0.0, "N-HB7-01", "all", F),     # the murids will rise with their master
        (583.0, "N-HB7-02", "all", F),   # from the grave: "Where is my master?"
        (596.0, "N-HB7-01", "all", F),
        (607.9, "N-HB7-02", "all", F),   # lakhs, crores of murids follow their master
        (619.0, "N-HB7-03", "all", F),   # where the master is, the murids will be
        (627.0, "N-HB7-04", "all", F),
    ],
    "hb_zarb": [
        (0.0, "N-HB8-01", "all", F),     # soldiering, binnot, wrestling
        (1241.4, "N-HB8-02", "all", dict(F, text="ضربِ حیدری")),   # the strike of Hazrat Ali
        (1257.6, "N-HB8-03", "all", dict(F, glow=[(0.33, 0.24, 0.11)])),   # "Do you know the zarb-e-Haidari?"
        (1274.9, "N-HB8-02", "all", F),  # he struck, exactly right
        (1287.5, "N-HB8-03", "all", dict(F, glow=[(0.33, 0.24, 0.11)])),   # "you have become my teacher"
        (1301.5, "N-HB8-01", "all", F),  # showing us how to wrestle
        (1308.1, "N-HB8-04", "all", F),  # keep looking into his eyes
        (1337.8, "N-HB0-01", "all", dict(F, glow=[(0.52, 0.21, 0.08)])),   # "when I say something, look at me"
        (1349.0, "PORTRAIT", None),      # "from my gaze into your gaze, a state will pass"
    ],
}

# ---- the full recording (30 min)
SQ = (0, 209, 540, 750)
POOL = [("N-HB0-01", "all", dict(F, glow=[(0.52, 0.21, 0.08)])), ("HB1-01", "all"), ("N-HB7-03", "all", F), ("HB4-01", None),
        ("N-HB0-02", "all", F), ("HB3-03", SQ), ("HB1-04", "all"), ("N-HB7-02", "all", F), ("HB5-01", None),
        ("HB4-04", SQ, {"glow": [(0.22, 0.30, 0.09), (0.75, 0.33, 0.09)]}), ("HB1-03", "all"), ("HB2-04", SQ)]
from slidekit import full_track
SLIDES["hb_full"] = full_track([(568.4, 633.8, SLIDES["hb_rise"]), (1227.9, 1361.0, SLIDES["hb_zarb"])], POOL, 0.0, 1803.0)
