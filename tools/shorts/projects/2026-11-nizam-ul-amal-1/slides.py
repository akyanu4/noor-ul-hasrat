"""Picture slideshows for Nizam-ul-Amal-e-Fuqara part 1. Times are in NAF001.mp3.
Pictures are reused from earlier dars (NA*, HB*) and the light backgrounds (L02/L04/L08/L12)."""
SLIDES = {
    "n1_dua": [
        (3029.6, "NA3-04", "all"),                                                 # alone at night: what am I doing?
        (3043.9, "L08", "all", {"fx": "rays"}),                                    # a voice from above
        (3062.4, "NA2-01", "all", {"fx": "rays"}),                                 # keep praying
        (3077.5, "NA2-01b", "all", {"fx": "rays", "text": "دعا", "text_at": (0.5, 0.3)}),
        (3084.9, "NA4-09", "all", {"fx": "dust"}),                                 # do your work, keep praying
    ],
    "n1_love": [
        (3101.6, "N-HB5-04", "all", {"fx": "rays"}),                               # love for Allah's sake
        (3126.7, "NA2-07", "all"),                                                 # the murid, the shaykh in light
        (3156.4, "N-HB7-03", "all", {"fx": "rays", "surprise": [(3157.0, 0.5, 0.36, "اَلْمَرْءُ مَعَ مَنْ أَحَبَّ")]}),
        (3186.7, "N-HB7-02", "all", {"fx": "rays"}),                               # rising together
        (3202.7, "L12", "all", {"fx": "rays", "text": "سبحان اللہ"}),
    ],
    "n1_paths": [
        (2864.0, "NA0-01", "all"),                                                 # the Qur'an and Hadith
        (2872.8, "HB3-03", "all", {"fx": "dust", "text": "قادری   چشتی   نقشبندی", "text_at": (0.5, 0.3)}),
        (2892.2, "HB3-04", "all", {"fx": "rays"}),
        (2904.6, "N-HB7-01", "all", {"fx": "rays"}),                               # everyone walks to the same light
    ],
    "n1_paths2": [
        (3339.0, "HB5-01", "all", {"fx": "rays"}),
        (3364.4, "L04", "all", {"fx": "rays", "text": "محبت   توحید"}),
        (3378.4, "NA4-03", "all", {"fx": "rays"}),                                 # one straight way of the Prophet ﷺ
        (3404.2, "L12", "all", {"fx": "rays", "text": "تقویٰ   توکل"}),
        (3415.4, "NA4-10", "all", {"text": "صبر   تسلیم   رضا"}),
        (3422.8, "L02", "all", {"fx": "rays", "text": "فنا   بقا"}),
    ],
}
SLIDES["n1_full"] = SLIDES["n1_paths"]
