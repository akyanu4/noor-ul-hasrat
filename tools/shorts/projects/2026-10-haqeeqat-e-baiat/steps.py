"""Teaching cards for the Short "Taking Bai'at: the steps" (engine/scenes_i.py). Times in the scene are seconds into it."""
F = {"frame": True}
YAD1 = "اِنَّ الَّذِیْنَ یُبَایِعُوْنَكَ اِنَّمَا یُبَایِعُوْنَ اللّٰهَ"
YAD2 = "یَدُ اللّٰهِ فَوْقَ اَیْدِیْهِمْ"
ISTI = ["اَسْتَغْفِرُ اللّٰهَ الْعَظِیْمَ الَّذِیْ لَآ اِلٰهَ اِلَّا هُوَ", "الْحَیُّ الْقَیُّوْمُ وَاَتُوْبُ اِلَیْهِ"]
NISA = ["وَلَوْ اَنَّهُمْ اِذْ ظَّلَمُوْٓا اَنْفُسَهُمْ جَآءُوْكَ", "فَاسْتَغْفَرُوا اللّٰهَ وَاسْتَغْفَرَ لَهُمُ الرَّسُوْلُ", "لَوَجَدُوا اللّٰهَ تَوَّابًا رَّحِیْمًا"]
GLOW_HB12 = {"glow": [(0.31, 0.22, 0.11)]}
OF = 7
STEPS = {
    "bs_intro": dict(n=0, en="THE STEPS", ur="بیعت کا طریقہ", art="hands", art_until=0.55,
                     images=[("HB1-03", "all")], arabic=[(0.6, [YAD2])], arabic_y=0.70),
    "bs_look": dict(n=1, of=OF, en="LOOK FIRST", ur="پہلے دیکھو، پھر ہاتھ دو", art="look", art_until=0.5,
                    images=[("HB3-03", (0, 209, 540, 750)), ("HB3-04", (0, 209, 540, 750), {"glow": [(0.245, 0.25, 0.09)]})]),
    "bs_hand": dict(n=2, of=OF, en="GIVE YOUR HAND", ur="ہاتھ میں ہاتھ", art="hands", art_until=0.42,
                    images=[("HB1-02", "all", GLOW_HB12), ("HB1-03", "all")], arabic=[(14.0, [YAD1, YAD2])], arabic_y=0.50,
                    mean="The Hand of Allah is over their hands (48:10)"),
    "bs_isti": dict(n=3, of=OF, en="ISTIGHFAR", ur="استغفار", art="tasbeeh", art_until=1.0,
                    arabic=[(2.5, ISTI)], arabic_y=0.585),
    "bs_pledge": dict(n=4, of=OF, en="THE PLEDGE", ur="عہد", art="pledge", art_until=0.6,
                      images=[("N-HB0-02", "all", F)]),
    # an-Nisa 4:64 shown line by line over the nasheed (a recited version was Content-ID blocked on YouTube)
    "bs_dua": dict(n=5, of=OF, en="THE SHAYKH'S DU'A", ur="شیخ کی دعا", art="dua", art_until=0.3,
                   images=[("HB1-01", "all"), ("N-HB0-02", "all", F)],
                   arabic=[(0.6, NISA, (0.6, 4.6, 8.2))], arabic_y=0.575, mean_at=11.0,
                   mean=["They would have found Allah Accepting", "of repentance, Most Merciful. (an-Nisa 4:64)"]),
    "bs_women": dict(n=6, of=OF, en="WOMEN & CHILDREN", ur="خواتین کی بیعت", art="cloth", art_until=0.62,
                     images=[("HB1-01", "all"), ("N-HB7-03", "all", F)]),
    "bs_after": dict(n=7, of=OF, en="HOLD THE ROPE", ur="بیعت کے بعد", art="rope", art_until=0.4,
                     images=[("N-HB6-03", "all", F), ("N-HB6-02", "all", dict(F, glow=[(0.25, 0.38, 0.11)]))]),
}
