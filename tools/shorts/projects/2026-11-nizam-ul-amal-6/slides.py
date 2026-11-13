"""Picture slideshows for Nizam-ul-Amal-e-Fuqara part 6. Times are in NAF006.mp3.
Pictures are reused from earlier dars (NA*, HB*, N-HB*) and the light backgrounds (L03/L04/L07/L08/L11/L12).
N6-NET / N6-NETBIRD are drawn (red threads over the night sky; the dove of NA2-06 caught in them).
NA6-01 (a spread of many dishes) is still to be generated; until it is in images/, NA3-01 stands in.
Faces of saints are hidden in light (glow); the shaykh is never shown with a face."""
import os
_IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "images")
def _has(c): return os.path.exists(os.path.join(_IMG, c + ".png"))
_HB = (0, 212, 540, 742)                       # HB3-03 / HB4-04 carry a blurred band above and below the picture
_PIR = {"glow": [(0.22, 0.33, 0.08), (0.74, 0.31, 0.08)]}   # HB4-04 (corner trimmed): both faces in light
_FOOD = "NA6-01" if _has("NA6-01") else "NA3-01"

SLIDES = {
    "n6_khatrat": [                                                               # a passing thought or a resolve
        (117.4, "HB5-02", "all", {"text": "خطرہ"}),                               # a thought drops in, ripples, passes
        (135.0, "NA3-04", "all", {"text": "عزم"}),                                # a firm intention at the window
        (151.6, "NA4-14", "all"),                                                 # a bad thought taken up: a sinner
        (169.2, "NA4-03", "all", {"fx": "rays"}),                                 # a good resolve: guidance
        (191.3, "NA2-01", "all", {"fx": "rays"}),                                 # the khatra is forgiven
        (219.9, "N-HB6-01", "all"),                                               # set out on a bad deed, could not do it
        (258.1, "HB5-01", "all", {"fx": "rays"}),                                 # morning to evening they come and go
    ],
    "n6_gaze": [                                                                  # nazar bar qadam
        (543.9, "NA4-17", "all", {"text": "نظر بر قدم"}),
        (556.7, "NA4-16", "all", {"fx": "rays", "text": "خلوت در انجمن"}),       # solitude in the crowd
        (574.4, "NA4-09", "all"),                                                 # gaze lowered
        (590.0, "NA4-15", "all", {"fx": "dust"}),                                 # faces enter the heart through the eyes
        (608.4, "N-HB5-03", "all", {"fx": "dust"}),                               # the heart scattered
    ],
    "n6_one_point": [
        (775.1, "NA3-05", "all"),                                                 # guard your gaze for a few days
        (795.5, "L11", "all", {"fx": "rays", "text": "ایک نقطہ"}),               # the heart fixed on one point
        (806.9, "L03", "all", {"fx": "rays"}),                                    # the reality comes before you
    ],
    "n6_hunters": [                                                               # the eyes are hunters
        (660.2, "NA2-06", "all"),                                                 # the bird of the gaze, free
        (672.7, "N6-NET", "all"),                                                 # red threads: a net spread out
        (692.3, "N6-NETBIRD", "all"),                                             # a bird sits in the net: caught
        (713.4, "L04", "all", {"fx": "rays", "text": "لال ڈورے ہیں بند پائے نظر"}),
        (720.6, "L04", "all", {"fx": "rays", "text": "صید کرتی ہیں یار کی آنکھیں"}),
        (733.5, "NA2-06", (230, 160, 720, 560), {"frame": True}),                # band-e-pa: the thread on the foot
        (752.0, "L08", "all", {"fx": "rays", "surprise": [(766.6, 0.5, 0.36, "اللہ")]}),
    ],
    "n6_tasawwur": [                                                              # holding the elder in thought
        (1099.1, "NA2-07", "all", {"glow": [(0.605, 0.165, 0.21), (0.61, 0.26, 0.14)]}),
        (1114.2, "NA3-02", "all", {"glow": [(0.51, 0.29, 0.11)]}),                # a life spent in heedlessness
        (1126.0, "HB4-04", (30, 252, 540, 742), {**_PIR, "fx": "rays", "surprise": [(1138.3, 0.5, 0.36, "يَا خَالِقُ يَا بَارِئُ يَا مُصَوِّرُ")]}),
        (1147.3, "N-HB5-04", "all", {"fx": "rays", "glow": [(0.33, 0.27, 0.13)]}),  # looking within Hazrat
        (1161.5, "L07", "all", {"fx": "rays", "surprise": [(1164.4, 0.5, 0.36, "کشف")]}),  # the veil opens
        (1177.6, "N-HB0-02", "all", {"frame": True, "text": "پانچ سو صفحات"}),    # a 500-page book
    ],
    "n6_kashf": [
        (1214.6, "HB4-04", (30, 252, 540, 742), {**_PIR, "fx": "rays"}),                                  # what my pir did for me
        (1232.9, "NA2-01b", "all", {"fx": "rays", "text": "يا خالق   يا بارئ   يا مصور"}),
        (1250.5, "L12", "all", {"fx": "rays", "surprise": [(1251.0, 0.5, 0.36, "آنکھیں کھل گئیں")]}),
    ],
    "n6_food": [                                                                  # many kinds of food
        (1820.3, _FOOD, "all", {"text": "طرح طرح کے کھانے"}),
        (1834.4, "N-HB5-03", "all", {"fx": "dust"}),                              # impurity in the thoughts
        (1855.7, "NA4-14", "all"),
        (1868.5, "HB3-03", _HB, {"fx": "dust"}),                                  # when will you reach your goal?
    ],
    "n6_tawheed": [
        (1943.2, "NA4-15", "all", {"fx": "dust"}),                                # thinking about everything
        (1953.6, "L08", "all", {"fx": "rays", "surprise": [(1954.0, 0.5, 0.36, "قُلْ هُوَ اللّٰهُ أَحَدٌ")]}),
        (1959.3, "NA4-03", "all", {"fx": "rays"}),                                # one direction
        (1973.2, "L12", "all", {"fx": "rays", "text": "توحید"}),
    ],
}
SLIDES["n6_full"] = SLIDES["n6_khatrat"]
