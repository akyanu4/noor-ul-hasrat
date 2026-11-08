"""Haqeeqat-e-Bai'at, recording 1 (001-HB.mp3). Times are in the original recording."""
FULL = [
    ("title", 7.0),
    ("voice", 0.00, 3174.40, "hb_full"),
    ("outro", 8.0)]
SHORTS = {
    "HB_Short9_What_Is_Baiat": ("WHAT IS BAI'AT?", [
        ("voice", 197.10, 284.30, "hb_what"),
        ("voice", 748.10, 776.00, "hb_what"),
        ("endcard", 5.5)]),
    "HB_Short10_One_Trusted_Guide": ("WHY ONE TRUSTED GUIDE", [
        ("voice", 586.20, 710.50, "hb_one_guide"),
        ("endcard", 5.5)]),
    "HB_Short1_The_Hand_of_Allah": ("THE HAND OF ALLAH", [
        ("voice", 55.40, 112.40, "hb_hand"),
        ("voice", 131.60, 195.00, "hb_hand"),
        ("endcard", 5.5)]),
    "HB_Short2_The_Camels_Rein": ("NOT ASKING ANYONE", [
        ("voice", 323.30, 378.60, "hb_rein"),
        ("endcard", 5.5)]),
    "HB_Short3_Two_and_Two_Make_Four": ("WHY A TEACHER IS NEEDED", [
        ("voice", 450.20, 558.00, "hb_teacher"),
        ("endcard", 5.5)]),
    "HB_Short4_A_Wali_Recognises_a_Wali": ("A WALI RECOGNISES A WALI", [
        ("voice", 1762.20, 1900.00, "hb_wali"),
        ("endcard", 5.5)]),
    "HB_Short5_The_Stone_and_the_Pebble": ("THE POWER OF COMPANY", [
        ("voice", 1900.20, 2051.60, "hb_stone"),
        ("endcard", 5.5)]),
    "HB_Short6_Whoever_Has_No_Pir": ("WHOEVER HAS NO PIR", [
        ("voice", 2507.40, 2555.80, "hb_pir"),
        ("endcard", 5.5)]),
    # Taking Bai'at, step by step: animated teaching cards over his words (steps.py). Under 3 minutes with the opening card.
    "HB_Short12_Taking_Baiat_Step_by_Step": ("TAKING BAI'AT STEP BY STEP", [
        ("pause", 3.0, "bs_intro", ()),
        ("voice", 1644.21, 1665.63, "bs_look"),
        ("voice", 748.16, 775.78, "bs_hand"),
        ("voice", 871.40, 889.40, "bs_isti"),
        ("voice", 889.40, 908.04, "bs_pledge"),
        ("pause", 26.2, "bs_dua", ("recite:audio/quran_004064_alafasy.mp3:10.55:35.25:0.6",)),
        ("voice", 1208.93, 1255.53, "bs_women"),
        ("voice", 2326.27, 2336.73, "bs_after"),
        ("endcard", 4.2)]),
}
