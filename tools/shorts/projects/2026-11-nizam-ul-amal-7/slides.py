"""Picture slideshows for Nizam-ul-Amal-e-Fuqara part 7. Times are in NAF007.mp3.
Pictures are reused from earlier dars (NA*, HB*, N-HB*) and the light backgrounds (L02..L12 = assets/scene_images/NN).
Faces of the shaykh/saints get "glow" (hidden in light); Short 5 (Divine existence) is light and abstract only."""
F = {"frame": True}                 # the small N-HB pictures, in a gold frame so they are not blown up
HANDS = (0, 14, 620, 339)           # HB1-03 without the old label in its top-left corner
SHAYKH_07 = [(0.62, 0.17, 0.10)]    # NA2-07: the shaykh's face behind the meditating murid
SHAYKH_62 = [(0.27, 0.40, 0.11)]    # N-HB6-02: the shaykh's face
SLIDES = {
    # ---- Short 1: ask Allah for good thoughts; du'a is the core of worship
    "n7_good_thoughts": [
        (151.7, "N-HB5-03", "all", dict(F, fx="dust")),                        # useless thoughts at the wrong time
        (177.1, "NA3-04", "all"),                                              # ask Allah for the thoughts we need
        (193.0, "N-HB6-03", "all", dict(F, fx="rays")),                       # "O Master, take these away, give good thoughts"
        (211.7, "NA2-01", "all", {"fx": "rays", "text": "خیالات خیر"}),        # ask for the positive form
        (233.1, "L08", "all", {"fx": "rays",
                               "surprise": [(234.0, 0.5, 0.36, "اُدْعُوْنِیْ اَسْتَجِبْ لَکُمْ")]}),   # Ud'uni astajib lakum
    ],
    "n7_dua_core": [
        (526.4, "NA2-01b", "all", {"fx": "rays", "text": "دعا"}),             # it is important to make du'a
        (530.7, "NA4-10", "all", {"surprise": [(531.0, 0.5, 0.36, "اَلدُّعَاءُ مُخُّ الْعِبَادَةِ")]}),  # the core of worship
        (540.4, "NA3-04", "all", {"text": "دعا"}),                             # worship completed by du'a
    ],
    # ---- Short 2: the pact of yaad-faramosh
    "n7_pact": [
        (549.35, "HB1-03", HANDS, {"text": "یاد فراموش"}),                      # the companions' pact
        (613.1, "NA4-09", "all", {"fx": "dust"}),                              # remembrance must go on, never forget
        (621.9, "NA4-15", "all"),                                              # they sat together, talked, worked
        (632.8, "NA4-17", "all", {"surprise": [(633.6, 0.5, 0.30, "اللّٰہ")]}),  # one of them calls out "Allah!"
        (636.1, "NA2-01", "all", {"fx": "rays", "text": "الحمد للہ"}),          # the present heart
        (640.8, "NA3-04", "all", {"text": "استغفر اللہ"}),                       # the heedless one
        (646.1, "N-HB6-03", "all", dict(F, fx="rays")),                        # the connection must not break
        (658.8, "NA4-09", "all", {"fx": "dust"}),                              # again: Allah! / Alhamdulillah (no text: no room)
        (678.6, "NA4-10", "all", {"text": "استغفر اللہ"}),                       # istighfar: forgive me
    ],
    "n7_lillah": [
        (738.75, "HB1-03", HANDS, {"text": "یاد فراموش"}),                      # through this pact
        (750.2, "NA3-03", "all", {"fx": "rays", "text": "للہ   فی اللہ"}),       # your work becomes lillah fillah
        (762.4, "NA4-10", "all"),                                              # we admit our own mistake
        (765.2, "N-HB6-03", "all", dict(F, fx="rays")),                        # and the bond with Allah is established
    ],
    # ---- Short 3: driving away stray thoughts - movement, or run
    "n7_move": [
        (806.65, "N-HB0-01", "all", dict(F, glow=[(0.52, 0.21, 0.08)])),        # "I am reading the methods to you"
        (817.1, "N-HB5-03", "all", dict(F, fx="dust", text="حالت بدلو")),      # Number 1: change your state
        (835.3, "NA4-17", "all", {"text": "حرکت"}),                             # the root is movement
        (850.1, "NA4-14", "all", {"fx": "dust"}),                              # we sit and sit, they do not leave
        (857.5, "N-HB7-01", "all", dict(F, fx="rays")),                        # stand up: they vanish
    ],
    "n7_run": [
        (867.5, "N-HB6-01", "all", dict(F, text="بھاگو", text_at=(0.5, 0.09))),                      # Number 2: run from it
        (887.1, "NA4-13", "all", {"fx": "rays"}),                              # it is left behind; you get out
        (904.9, "NA2-06", "all"),                                              # captives set free
        (917.5, "L06", "all", {"fx": "dust"}),                                 # imagine the thought running away
        (925.2, "NA2-07", "all", {"glow": SHAYKH_07, "text": "عالم تخیل"}),      # aalam-e-takhayyul: it is removed
    ],
    # ---- Short 4: take refuge in Allah; "hoon hoon"; a new creation
    "n7_refuge": [
        (975.9, "NA3-04", "all", {"text": "پناہ"}),                             # come into Allah's refuge
        (993.4, "N-HB6-03", "all", dict(F, fx="rays")),                        # where else would we find refuge?
        (1007.4, "NA4-16", "all", {"surprise": [(1010.6, 0.5, 0.30, "أَعُوْذُ بِاللّٰهِ")]}),   # take us into Your refuge
    ],
    "n7_breath": [
        (1013.6, "NA2-07", "all", {"glow": SHAYKH_07, "fx": "dust", "text": "ہوں   ہوں"}),   # Number 4: breathe out hard
        (1030.3, "NA4-14", "all", {"fx": "dust"}),                             # to drive the khatrat away
        (1040.1, "HB3-04", "all", dict(F, fx="rays")),                          # even the Awliya are troubled; they walk the path of refuge (was N-HB6-02: smoke looked horned)
    ],
    "n7_new_creation": [
        (1395.45, "NA0-01", "all", {"fx": "rays"}),                            # Number 6: recite this verse
        (1404.8, "L05", "all", {"surprise": [(1405.0, 0.5, 0.33, "وَيَأْتِ بِخَلْقٍ جَدِيدٍ")]}),   # a new creation
        (1410.9, "L12", "all", {"fx": "rays", "text": "سبحان اللہ"}),           # not difficult for Allah
    ],
    # ---- Short 5: the real existence is His (light and abstract only)
    "n7_recognise": [
        (1056.65, "L10", "all", {"fx": "dust"}),                               # Number 5: you came in changing forms
        (1067.9, "L11", "all", {"fx": "rays"}),                                # I certainly recognise You
        (1073.7, "L08", "all", {"fx": "rays", "text": "اصل وجود"}),              # asl-e-wujood: whose? Allah's
    ],
    "n7_wujood": [
        (1144.55, "L06", "all", {"fx": "dust"}),                               # in everything, whose is the existence?
        (1152.8, "L12", "all", {"fx": "rays", "text": "وجود اسی کا"}),          # existence is His alone
    ],
    "n7_rubai": [
        (1178.65, "L09", "all", {"text": "بد کون نیک کون"}),                     # who is bad, who is good? the rubai
        (1189.8, "L04", "all", {"fx": "rays", "text": "تو در ہر شان با کمالی"}),  # You are perfect in every state
        (1198.0, "L10", "all", {"text": "پہچانتا ہوں"}),                         # in whatever colour You come, I recognise You
        (1206.2, "L02", "all", {"fx": "rays", "text": "اللّٰہ"}),                 # whose is the real existence? Allah's alone
        (1212.0, "L03", "all", {"fx": "rays", "text": "بہت اونچا مقام"}),        # one must rise very high: a great station
    ],
}
SLIDES["n7_full"] = SLIDES["n7_good_thoughts"]   # placeholder for the whole-recording timeline
