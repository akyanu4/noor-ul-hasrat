"""What plays when. ('voice', a, b, scene) plays the original recording from a to b (seconds) over a scene.
('pause', dur, scene, args) plays calm nasheed over an animation. Times are in the original recording."""

FULL = [
    ("title", 6.0),
    ("voice", 0.00, 29.60, "soul"),
    ("pause", 9.0, "arsh", None),
    ("voice", 29.60, 47.65, "soul"),
    ("pause", 7.0, "creation", None),
    ("voice", 47.65, 62.80, "soul"),
    ("pause", 5.0, "calm", ("stars", "سبحان اللہ")),
    ("voice", 62.80, 109.90, "misal"),
    ("voice", 109.90, 158.38, "womb"),
    ("pause", 5.0, "calm", ("lanterns", "ماشاءاللہ")),
    ("voice", 158.38, 175.40, "weight_time"),
    ("voice", 175.40, 209.25, "death_barzakh"),
    ("pause", 5.0, "calm", ("lanterns", "")),
    ("voice", 209.25, 264.00, "graves"),
    ("voice", 264.00, 293.30, "window"),
    ("voice", 293.30, 345.95, "sins"),
    ("pause", 6.0, "calm", ("lanterns", "آمین")),
    ("voice", 345.95, 377.00, "hashr"),
    ("voice", 377.00, 425.60, "scales"),
    ("voice", 425.60, 482.55, "intercession"),
    ("pause", 6.0, "calm", ("garden", "الحمد للہ")),
    ("voice", 482.55, 491.70, "grace"),
    ("voice", 491.70, 505.20, "masjid"),
    ("voice", 505.20, 547.30, "shahada"),
    ("pause", 6.0, "calm", ("dome", "صلی اللہ علیہ وسلم")),
    ("voice", 547.30, 577.70, "book"),
    ("voice", 577.70, 669.00, "malida_prep"),
    ("voice", 669.00, 732.88, "malida_feast"),
    ("voice", 732.88, 761.85, "glory"),
    ("outro", 7.0),
]

SHORTS = {
    "Short2_Womb_to_Grave": ("THE SOUL'S JOURNEY", [
        ("voice", 109.90, 158.38, "womb"),
        ("pause", 3.5, "calm", ("lanterns", "ماشاءاللہ")),
        ("voice", 158.38, 175.40, "sand_body"),
        ("voice", 175.40, 207.00, "death_barzakh"),
        ("endcard", 3.5)]),
    "Short3_The_Scale": ("DEEDS ON THE SCALE", [
        ("voice", 345.95, 349.00, "hashr"),
        ("voice", 371.40, 425.60, "scales"),
        ("endcard", 3.5)]),
    "Short4_With_The_One_You_Love": ("WITH THE ONE YOU LOVE", [
        ("voice", 425.60, 482.55, "jannah"),
        ("pause", 4.0, "calm", ("garden", "الحمد للہ")),
        ("voice", 482.55, 490.80, "grace"),
        ("endcard", 3.5)]),
    "Short5_Islam_and_Iman": ("WHAT IS ISLAM, WHAT IS IMAN", [
        ("voice", 502.00, 547.30, "iman"),
        ("pause", 4.0, "calm", ("dome", "صلی اللہ علیہ وسلم")),
        ("endcard", 3.0)]),
    "Short6_The_Blessed_Malida": ("THE BLESSED MALIDA", [
        ("voice", 577.70, 669.00, "malida_prep"),
        ("voice", 669.00, 732.88, "malida_feast"),
        ("endcard", 3.5)]),
}
