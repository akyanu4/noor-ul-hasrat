"""Nizam-ul-Amal-e-Fuqara part 8: the Urdu/Arabic words for the animated Shorts. Times are in NAF008.mp3.
Every Short is built from "clip:<CODE>" scenes (timeline.py); the pictures are clips/<CODE>.png (library pictures copied
from earlier dars, 9:16 1080x1920) until the clips/<CODE>.mp4 are made. Each beat below starts at its scene's start, so
engine/clip_words.py carries its "text"/"surprise" to that clip. Comments: the picture used ("NEW" = still to be made in
Gemini, see clips/Nizam-ul-Amal_Part8_Animated_Prompts.txt).
Rules kept: no picture of the Prophet (peace be upon him) or of any prophet (Hazrat Zakariya and Bibi Maryam are never
shown: only the room, the curtain, the fruit, light); no women; faces of the shaykh, the awliya and Hazrat Musa Pasha in
light; the mu'akkils only as dark smoke; no lamp flames on floors or ledges; no writing in the pictures."""

SLIDES = {
    # ---- NAF8_Short1_Chilla_Forty_Days_with_Allah  "CHILLA-KASHI"
    "n8_short1": [
        (172.20, "N8S1-01", "all", {'text': 'چلہ کشی'}),                                        # N7S3-12: chilla-kashi: sitting for forty days
        (185.90, "N8S1-02", "all", {'fx': 'rays'}),                                             # N6S1-06: a special blessing descends
        (195.80, "N8S1-03", "all"),                                                             # N7S4-05
        (641.30, "N8S1-04", "all", {'text': 'غار حرا'}),                                        # NEW: Ghar-e-Hira (mountain cave at night, light only)
        (650.10, "N8S1-05", "all"),                                                             # NEW
        (659.00, "N8S1-06", "all"),                                                             # N6S5-03
        (698.80, "N8S1-07", "all"),                                                             # N6S5-01
        (708.90, "N8S1-08", "all", {'text': 'ترک حیوانات'}),                                    # NEW: tark-e-haiwanat: no meat, no ghee
        (771.00, "N8S1-09", "all", {'text': 'اعتکاف'}),                                         # N7S1-11: a chilla is i'tikaf
        (777.60, "N8S1-10", "all"),                                                             # NEW
    ],
    # ---- NAF8_Short2_Saum_e_Maryam  "SAUM-E-MARYAM"
    "n8_short2": [
        (791.50, "N8S2-01", "all", {'text': 'صوم مریم'}),                                       # N7S2-11: Saum-e-Maryam
        (809.10, "N8S2-02", "all"),                                                             # N7S5-08
        (821.50, "N8S2-03", "all"),                                                             # AN1-18
        (830.90, "N8S2-04", "all"),                                                             # N6S3-10
        (836.90, "N8S2-05", "all"),                                                             # N6S2-09
        (850.30, "N8S2-06", "all"),                                                             # NEW
        (861.80, "N8S2-07", "all"),                                                             # NEW
        (868.30, "N8S2-08", "all"),                                                             # N6S1-02
        (878.80, "N8S2-09", "all"),                                                             # N6S2-07
        (886.90, "N8S2-10", "all", {'text': 'خاموشی'}),                                         # HB5-01: silence
    ],
    # ---- NAF8_Short3_Hizbul_Bahr_with_Fasting_and_Silence  "HIZBUL BAHR"
    "n8_short3": [
        (429.70, "N8S3-01", "all", {'text': 'حزب البحر'}),                                      # NEW: Hizbul Bahr (the becalmed ship)
        (439.20, "N8S3-02", "all"),                                                             # AN1-04
        (450.60, "N8S3-03", "all"),                                                             # N6S1-10
        (461.80, "N8S3-04", "all"),                                                             # N7S1-03
        (476.10, "N8S3-05", "all", {'text': 'خاموشی'}),                                         # N6S5-03: we talk to no one until Maghrib
        (1246.40, "N8S3-06", "all"),                                                            # N6S4-03
        (1258.20, "N8S3-07", "all"),                                                            # NEW
        (1273.10, "N8S3-08", "all"),                                                            # N7S2-04
        (1419.70, "N8S3-09", "all"),                                                            # N6S4-05
        (1446.30, "N8S3-10", "all", {'fx': 'rays'}),                                            # N7S1-12: what glory (no words over the rays: no light source under the Name)
    ],
    # ---- NAF8_Short4_Hazrat_Musa_Pasha_and_Hizbul_Bahr  "WHAT A THING HIZBUL BAHR IS"
    "n8_short4": [
        (1336.00, "N8S4-01", "all"),                                                            # N7S1-05
        (1348.40, "N8S4-02", "all"),                                                            # NEW
        (1361.20, "N8S4-03", "all"),                                                            # NEW
        (1369.70, "N8S4-04", "all"),                                                            # N7S1-03
        (1378.90, "N8S4-05", "all"),                                                            # NEW
        (1391.10, "N8S4-06", "all"),                                                            # NEW
        (1399.20, "N8S4-07", "all", {'text': 'حزب البحر'}),                                     # N6S4-04: what a thing Hizbul Bahr is
    ],
    # ---- NAF8_Short5_Itikaf_the_Thought_on_One_Point  "I'TIKAF"
    "n8_short5": [
        (1045.80, "N8S5-01", "all", {'text': 'اعتکاف'}),                                        # N7S2-03: i'tikaf, even for one day
        (1052.70, "N8S5-02", "all"),                                                            # AN1-18
        (1061.50, "N8S5-03", "all"),                                                            # AN1-03
        (1071.30, "N8S5-04", "all"),                                                            # AN1-02
        (1083.20, "N8S5-05", "all"),                                                            # N7S1-11
        (1098.20, "N8S5-06", "all"),                                                            # N7S3-03
        (1104.50, "N8S5-07", "all", {'text': 'ایک نقطہ'}),                                      # N6S5-07: the thought fixed on one point
        (1113.60, "N8S5-08", "all", {'text': 'توجہ تام'}),                                      # N7S4-05: complete attention is the soul of worship
        (1123.10, "N8S5-09", "all"),                                                            # N7S5-05
        (1134.90, "N8S5-10", "all"),                                                            # N7S2-11
        (1145.60, "N8S5-11", "all"),                                                            # N6S4-01
        (1154.30, "N8S5-12", "all"),                                                            # N6S2-09
        (1161.80, "N8S5-13", "all"),                                                            # N7S1-02
        (1170.30, "N8S5-14", "all", {'text': 'صوم مریم'}),                                      # N6S1-03: and they keep Saum-e-Maryam
    ],
    # ---- NAF8_Short6_Four_Shops_in_One_Namaz  "FOUR SHOPS IN ONE NAMAZ"
    "n8_short6": [
        (1508.30, "N8S6-01", "all"),                                                            # N7S1-01
        (1532.20, "N8S6-02", "all"),                                                            # NEW
        (1543.50, "N8S6-03", "all", {'text': 'چار دکانیں'}),                                    # N7S2-04: four shops, one per rakat
        (1558.90, "N8S6-04", "all"),                                                            # N7S2-03
        (1568.00, "N8S6-05", "all"),                                                            # N7S3-02
        (1579.40, "N8S6-06", "all"),                                                            # AN1-18
        (1587.80, "N8S6-07", "all"),                                                            # N6S1-07
        (1600.50, "N8S6-08", "all"),                                                            # N7S2-11
        (1671.30, "N8S6-09", "all", {'text': 'دل'}),                                            # N6S1-06: no benefit without the heart
    ],
    # ---- NAF8_Short7_Fruit_Out_of_Season  "FRUIT OUT OF SEASON"
    "n8_short7": [
        (1875.30, "N8S7-01", "all"),                                                            # NEW
        (1887.50, "N8S7-02", "all"),                                                            # N7S1-10
        (1895.90, "N8S7-03", "all"),                                                            # NEW
        (1910.00, "N8S7-04", "all"),                                                            # N6S4-06
        (1922.20, "N8S7-05", "all"),                                                            # N6S2-09
        (1937.30, "N8S7-06", "all"),                                                            # N7S1-12
        (1946.40, "N8S7-07", "all"),                                                            # N6S4-11
        (1955.20, "N8S7-08", "all"),                                                            # NEW
        (1962.80, "N8S7-09", "all"),                                                            # N6S4-02
        (1970.90, "N8S7-10", "all"),                                                            # NEW
        (1981.40, "N8S7-11", "all", {'text': 'پھل'}),                                           # NEW: fruits in the room
        (1992.20, "N8S7-12", "all"),                                                            # NEW
        (2002.30, "N8S7-13", "all", {'text': 'بے موسم پھل'}),                                   # NEW: fruit out of season
        (2011.60, "N8S7-14", "all"),                                                            # NEW
        (2021.40, "N8S7-15", "all"),                                                            # N6S2-10
        (2031.20, "N8S7-16", "all", {'text': 'هُوَ مِنْ عِنْدِ اللّٰهِ'}),                      # N7S5-08: 'It is from Allah' (Al Imran 3:37); clip_words: from 2033.0; curtains of light, no orb, no burst
    ],
    # ---- NAF8_Short8_Where_Duas_Are_Accepted  "WHERE DU'AS ARE ACCEPTED"
    "n8_short8": [
        (2068.90, "N8S8-01", "all"),                                                            # N7S1-10
        (2082.00, "N8S8-02", "all"),                                                            # N7S5-05
        (2133.60, "N8S8-03", "all", {'text': 'دعا قبول'}),                                      # N7S5-08: the du'a accepted at once
        (2147.00, "N8S8-04", "all"),                                                            # N6S1-01
        (2157.90, "N8S8-05", "all"),                                                            # N6S3-10
        (2166.90, "N8S8-06", "all"),                                                            # N7S1-09
        (2313.00, "N8S8-07", "all"),                                                            # AN1-17
        (2324.10, "N8S8-08", "all"),                                                            # N6S1-05
        (2332.50, "N8S8-09", "all"),                                                            # N7S4-11
        (2341.80, "N8S8-10", "all", {'text': 'دربار اولیاء'}),                                  # N6S1-04: the court of the awliya
        (2354.80, "N8S8-11", "all"),                                                            # N6S2-10
        (2409.00, "N8S8-12", "all"),                                                            # N6S4-11
        (2419.70, "N8S8-13", "all"),                                                            # N6S1-06
        (2429.30, "N8S8-14", "all", {'text': 'دعا قبول'}),                                      # N6S1-02: where du'as are accepted
    ],
}
