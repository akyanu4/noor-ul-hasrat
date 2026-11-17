"""Nizam-ul-Amal-e-Fuqara part 9: the Urdu/Arabic words for the animated Shorts. Times are in NAF009.mp3.
Every Short is built from "clip:<CODE>" scenes (timeline.py); the pictures are clips/<CODE>.png (library pictures copied
from earlier dars, 9:16 1080x1920) until the clips/<CODE>.mp4 are made. Each beat below starts at its scene's start, so
engine/clip_words.py carries its "text"/"surprise" to that clip. Comments: the picture used ("NEW" = still to be made in
Gemini, see clips/Nizam-ul-Amal_Part9_Animated_Prompts.txt).
The four Names are drawn by the engine (never by the AI) exactly as: يَا عَلِيمُ  يَا خَبِيرُ  يَا سَمِيعُ  يَا بَصِيرُ
(shown as plain words, no burst of light under them; clip_words.py "from" 80.6 / 92.6 are estimates: check by ear).
Rules kept: never the Prophet (peace be upon him): only light, the Green Dome, the Jali without figures; the shaykh's and
the pir's faces in light; no women; no lamp flames on floors or ledges; no writing in the pictures."""

SLIDES = {
    # ---- NAF9_Short1_The_Purpose_of_Tasawwur_e_Shaykh  "THE THOUGHT ON ONE POINT"
    "n9_short1": [
        (34.30, "N9S1-01", "all", {'text': 'تصور شیخ'}),                                        # N7S2-11: the purpose of tasawwur-e-shaykh
        (49.20, "N9S1-02", "all"),                                                              # N6S4-03
        (57.80, "N9S1-03", "all", {'text': 'ایک نقطہ'}),                                        # N6S3-10: the thought fixed on one point
        (593.60, "N9S1-04", "all"),                                                             # AN1-04
        (603.00, "N9S1-05", "all"),                                                             # N6S4-05
        (614.70, "N9S1-06", "all"),                                                             # N7S4-05
        (625.40, "N9S1-07", "all"),                                                             # N6S1-03
        (636.10, "N9S1-08", "all", {'text': 'ایک نقطہ'}),                                       # N6S2-09: one point
    ],
    # ---- NAF9_Short2_Ya_Aleemu_Ya_Khabeeru  "YA 'ALEEMU, YA KHABEERU"
    "n9_short2": [
        (66.50, "N9S2-01", "all", {'text': 'اذکار'}),                                           # N7S3-12: the following adhkar also help
        (79.00, "N9S2-02", "all", {'text': 'يَا عَلِيمُ   يَا خَبِيرُ'}),                       # N6S4-06: the four Names (1, 2); clip_words: from 80.6 (no burst of light under the Names)
        (92.10, "N9S2-03", "all", {'text': 'يَا سَمِيعُ   يَا بَصِيرُ'}),                       # N7S5-01: the four Names (3, 4); clip_words: from 92.6
        (102.50, "N9S2-04", "all", {'text': 'يَا عَلِيمُ'}),                                    # NEW: Ya 'Aleemu: toward the umm-ud-dimagh
        (117.00, "N9S2-05", "all", {'text': 'ام الدماغ'}),                                      # N6S4-01: umm-ud-dimagh, above the palate
        (124.10, "N9S2-06", "all"),                                                             # N7S5-05
        (133.10, "N9S2-07", "all"),                                                             # N6S5-07
        (146.30, "N9S2-08", "all"),                                                             # N7S4-05
        (206.40, "N9S2-09", "all", {'text': 'يَا خَبِيرُ'}),                                    # NEW: Ya Khabeeru: toward the heart
        (217.00, "N9S2-10", "all"),                                                             # N6S1-05
        (230.50, "N9S2-11", "all"),                                                             # N6S2-09
        (241.40, "N9S2-12", "all"),                                                             # N6S3-06
        (253.80, "N9S2-13", "all"),                                                             # N7S1-10
    ],
    # ---- NAF9_Short3_Ya_Sameeu_Ya_Baseeru  "YA SAMEE'U, YA BASEERU"
    "n9_short3": [
        (264.50, "N9S3-01", "all", {'text': 'يَا سَمِيعُ'}),                                    # NEW: Ya Samee'u: toward both ears
        (277.00, "N9S3-02", "all"),                                                             # N6S1-02
        (291.00, "N9S3-03", "all", {'text': 'عالم علوی'}),                                      # N6S4-11: 'aalam-e-'ulwi, the higher world
        (297.90, "N9S3-04", "all"),                                                             # N7S5-08
        (307.00, "N9S3-05", "all"),                                                             # N7S4-06
        (315.40, "N9S3-06", "all"),                                                             # N7S3-03
        (326.70, "N9S3-07", "all"),                                                             # N7S4-05
        (335.70, "N9S3-08", "all", {'text': 'يَا بَصِيرُ'}),                                    # NEW: Ya Baseeru: press the eyes, open them
        (352.20, "N9S3-09", "all"),                                                             # N6S3-06
    ],
    # ---- NAF9_Short4_When_Aalam_e_Misaal_Opened  "ON THE ROAD AT YAKUTPURA"
    "n9_short4": [
        (362.40, "N9S4-01", "all"),                                                             # N7S4-05
        (369.50, "N9S4-02", "all"),                                                             # N7S3-03
        (389.80, "N9S4-03", "all", {'text': 'کشف'}),                                            # N7S5-08: kashf opens
        (399.40, "N9S4-04", "all", {'text': 'یاقوت پورہ'}),                                     # NEW: on the cycle through the Yakutpura gate
        (411.30, "N9S4-05", "all"),                                                             # NEW
        (420.70, "N9S4-06", "all", {'text': 'عالم مثال'}),                                      # N6S3-09: 'aalam-e-misaal had opened
        (435.40, "N9S4-07", "all"),                                                             # N7S5-06
        (447.80, "N9S4-08", "all"),                                                             # N6S2-05
        (582.20, "N9S4-09", "all"),                                                             # N7S5-12
    ],
    # ---- NAF9_Short5_Travelling_in_Tasawwur  "TRAVELLING IN TASAWWUR"
    "n9_short5": [
        (1168.60, "N9S5-01", "all", {'text': 'ملک پیٹ'}),                                       # N6S1-07: in tasawwur, come to Malakpet
        (1180.00, "N9S5-02", "all"),                                                            # AN1-02
        (1210.20, "N9S5-03", "all", {'text': 'قاضی پورہ'}),                                     # N6S1-08: go on to Qazipura
        (1217.70, "N9S5-04", "all"),                                                            # N6S4-05
        (1226.00, "N9S5-05", "all"),                                                            # AN1-08
        (1236.00, "N9S5-06", "all", {'text': 'مکہ مکرمہ'}),                                     # NEW: Makkah: two rakats facing the Ka'bah
        (1249.70, "N9S5-07", "all"),                                                            # NEW
        (1257.80, "N9S5-08", "all"),                                                            # N7S2-11
        (1267.40, "N9S5-09", "all"),                                                            # AN1-04
        (1278.60, "N9S5-10", "all"),                                                            # N6S4-06
        (1288.10, "N9S5-11", "all"),                                                            # N6S2-10
        (1304.10, "N9S5-12", "all", {'text': 'مدینہ منورہ'}),                                   # NEW: the musalla of the Prophet, the blessed Jali
        (1311.40, "N9S5-13", "all"),                                                            # NEW
        (1321.10, "N9S5-14", "all", {'text': 'صلوٰۃ و سلام'}),                                  # NEW: salat-o-salam, then return
        (1598.20, "N9S5-15", "all"),                                                            # NEW
        (1608.90, "N9S5-16", "all"),                                                            # AN1-03
    ],
    # ---- NAF9_Short6_The_Search_Light_Tasawwur  "A LIGHT LIKE A SEARCH-LIGHT"
    "n9_short6": [
        (1353.40, "N9S6-01", "all", {'fx': 'rays'}),                                            # NEW: a light like a search-light (beam, Green Dome; no orb, no figure)
        (1366.60, "N9S6-02", "all"),                                                            # N6S5-07
        (1374.70, "N9S6-03", "all"),                                                            # NEW
        (1385.80, "N9S6-04", "all"),                                                            # NEW
        (1396.40, "N9S6-05", "all"),                                                            # N6S4-01
        (1425.80, "N9S6-06", "all"),                                                            # N6S2-09
        (1432.80, "N9S6-07", "all", {'text': 'باب فتوح'}),                                      # N7S1-10: bab-e-futuh: the door of opening
        (1444.40, "N9S6-08", "all"),                                                            # N6S5-05
        (1453.80, "N9S6-09", "all"),                                                            # N7S5-02
    ],
    # ---- NAF9_Short7_In_the_Shaykhs_Form  "IN THE SHAYKH'S FORM"
    "n9_short7": [
        (1465.30, "N9S7-01", "all", {'text': 'شیخ کی صورت'}),                                   # N6S4-03: he feels he is in the shaykh's form
        (1472.50, "N9S7-02", "all"),                                                            # N7S4-05
        (1480.40, "N9S7-03", "all"),                                                            # NEW
        (1488.80, "N9S7-04", "all"),                                                            # NEW
        (1497.30, "N9S7-05", "all"),                                                            # N6S4-05
        (1505.20, "N9S7-06", "all"),                                                            # N6S4-01
        (1515.50, "N9S7-07", "all"),                                                            # N6S1-01
        (1522.90, "N9S7-08", "all"),                                                            # N7S1-02
        (1533.80, "N9S7-09", "all"),                                                            # N7S2-11
        (1541.90, "N9S7-10", "all", {'text': 'حسرت'}),                                          # N6S4-06: Hazrat's verse (pen-name Hasrat)
        (1550.70, "N9S7-11", "all", {'text': 'سیر'}),                                           # N6S5-05: sair, the journey, of three kinds
        (1557.30, "N9S7-12", "all"),                                                            # N6S1-04
        (1566.00, "N9S7-13", "all"),                                                            # NEW
        (1591.30, "N9S7-14", "all"),                                                            # N6S2-10
    ],
}
