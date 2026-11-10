"""Pilot: "علی اور پیاسی بلی" (Ali and the Thirsty Cat) — Urdu.
Beats: ("say", who, emotion, urdu_caption, hindi_for_voice) | ("wait", s) | ("sfx", name).
The voice engine reads Hindustani from Devanagari best; captions are shown in Urdu (Nastaliq).
Emotions shape both the voice (speed/pitch) and the face."""

LANG = 'ur'
TITLE = 'علی اور پیاسی بلی'
SUBTITLE = 'نرمی اور رحم دلی کی کہانی'
MORAL = ('ہر جاندار کے ساتھ نرمی کرو', 'اللہ نرمی کرنے والا ہے، اور نرمی کو پسند کرتا ہے')
END = ('دیکھنے کا شکریہ!', 'ہر ہفتے نئی کہانی')
# captions are shown in Roman Urdu (ROMAN, same order as the spoken lines); cards in English
CAPTIONS = 'roman'
TITLE_EN, SUBTITLE_EN = 'Ali aur Pyasi Billi', 'A story about kindness'
MORAL_EN = ('The Lesson', 'Be gentle with every living thing.', 'Allah is Gentle, and He loves gentleness.')
END_EN = 'Thank you for watching!'
ROMAN = ['Ali aur Pyasi Billi', 'Garmiyon ka ek bahut garam din tha. Suraj khoob chamak raha tha, aur sab log saaya dhoond rahe the.', 'Ali aur uski chhoti behan Maryam school se ghar wapas aa rahe the.', 'Uff! Aaj to bahut garmi hai, Maryam!', 'Ghar jaa kar main thanda thanda nimbu paani piyungi!', 'Ali, dekho! Ped ke neeche ek chhoti si billi!', 'Bechari! Ye to bahut thaki hui lag rahi hai. Shayad ise bahut pyaas lagi hai.', 'Lekin... meri bottle mein to bas thoda sa hi paani bacha hai.', 'Ali ko bhi pyaas lagi thi. Phir use yaad aaya ke Nana Jaan hamesha kya kehte hain.', 'Sab ke saath narmi karo, jaanwaron ke saath bhi. Allah narmi karne wala hai, aur narmi ko pasand karta hai.', 'Ye lo, nanhi billi! Paani pi lo.', 'Billi ne khoob paani piya, yahan tak ke uski pyaas bujh gayi.', 'Hee hee! Ali, ye tumhein shukriya keh rahi hai!', 'Aur pata hai kya hua? Billi unke peeche peeche chal padi!', 'Arre! Tum kahan ja rahi ho, billi rani?', 'Assalamu Alaikum, mere bachcho! Aur ye nanha mehmaan kaun hai?', 'Wa Alaikum Assalam, Nana Jaan! Ise bahut pyaas lagi thi, to maine ise apna paani pila diya.', 'MashaAllah, Ali! Mujhe tum par bahut fakhr hai. Hamare pyaare Nabi (sallallahu alaihi wa sallam) ne farmaya, ke har jaandaar ke saath neki karne mein sawaab hai.', 'Nana Jaan, kya hum ise rakh lein? Iska naam Lemu rakhte hain!', 'Ha ha ha! Theek hai, Lemu hi sahi!', 'Har jaandaar ke saath narmi karo. Allah narmi karne wala hai, aur narmi ko pasand karta hai.']

SHOTS = [
    ("title", [("wait", 1.0), ("say", "N", "warm", "علی اور پیاسی بلی", "अली और प्यासी बिल्ली।"), ("wait", 1.6)]),

    ("street", [
        ("say", "N", "warm", "گرمیوں کا ایک بہت گرم دن تھا۔ سورج خوب چمک رہا تھا، اور سب لوگ سایہ ڈھونڈ رہے تھے۔",
         "गर्मियों का एक बहुत गर्म दिन था। सूरज ख़ूब चमक रहा था, और सब लोग साया ढूँढ रहे थे।"),
        ("wait", 0.4),
        ("say", "N", "warm", "علی اور اُس کی چھوٹی بہن مریم اسکول سے گھر واپس آ رہے تھے۔",
         "अली और उसकी छोटी बहन मरियम स्कूल से घर वापस आ रहे थे।"),
        ("wait", 0.3),
        ("say", "ALI", "tired", "اُف! آج تو بہت گرمی ہے، مریم!", "उफ़्फ़! आज तो बहुत गर्मी है, मरियम!"),
        ("say", "MARYAM", "excited", "گھر جا کر میں ٹھنڈا ٹھنڈا لیموں پانی پیوں گی!", "घर जाकर मैं ठंडा ठंडा नींबू पानी पियूँगी!"),
        ("wait", 0.6),
    ]),

    ("tree", [
        ("sfx", "meow_weak"),
        ("wait", 0.5),
        ("say", "MARYAM", "surprised", "علی، دیکھو! پیڑ کے نیچے ایک چھوٹی سی بلی!", "अली, देखो! पेड़ के नीचे एक छोटी सी बिल्ली!"),
        ("say", "ALI", "sad", "بیچاری! یہ تو بہت تھکی ہوئی لگ رہی ہے۔ شاید اِسے بہت پیاس لگی ہے۔",
         "बेचारी! ये तो बहुत थकी हुई लग रही है। शायद इसे बहुत प्यास लगी है।"),
        ("sfx", "meow_weak"),
        ("wait", 0.6),
    ]),

    ("think", [
        ("say", "ALI", "worried", "لیکن... میری بوتل میں تو بس تھوڑا سا ہی پانی بچا ہے۔", "लेकिन... मेरी बोतल में तो बस थोड़ा सा ही पानी बचा है।"),
        ("wait", 0.5),
        ("say", "N", "warm", "علی کو بھی پیاس لگی تھی۔ پھر اُسے یاد آیا کہ نانا جان ہمیشہ کیا کہتے ہیں۔",
         "अली को भी प्यास लगी थी। फिर उसे याद आया कि नाना जान हमेशा क्या कहते हैं।"),
        ("wait", 0.3),
        ("say", "NANA", "warm", "سب کے ساتھ نرمی کرو، جانوروں کے ساتھ بھی۔ اللہ نرمی کرنے والا ہے، اور نرمی کو پسند کرتا ہے۔",
         "सब के साथ नरमी करो, जानवरों के साथ भी। अल्लाह नरमी करने वाला है, और नरमी को पसंद करता है।"),
        ("wait", 0.6),
    ]),

    ("pour", [
        ("say", "ALI", "happy", "یہ لو، ننھی بلی! پانی پی لو۔", "ये लो, नन्ही बिल्ली! पानी पी लो।"),
        ("wait", 0.4),
        ("sfx", "lap"),
        ("wait", 2.6),
        ("say", "N", "warm", "بلی نے خوب پانی پیا، یہاں تک کہ اُس کی پیاس بُجھ گئی۔", "बिल्ली ने ख़ूब पानी पिया, यहाँ तक कि उसकी प्यास बुझ गई।"),
        ("sfx", "purr"),
        ("say", "MARYAM", "laugh", "ہی ہی! علی، یہ تمہیں شکریہ کہہ رہی ہے!", "ही ही! अली, ये तुम्हें शुक्रिया कह रही है!"),
        ("sfx", "meow_happy"),
        ("wait", 0.8),
    ]),

    ("follow", [
        ("say", "N", "excited", "اور پتہ ہے کیا ہوا؟ بلی اُن کے پیچھے پیچھے چل پڑی!", "और पता है क्या हुआ? बिल्ली उनके पीछे पीछे चल पड़ी!"),
        ("wait", 0.3),
        ("sfx", "meow_happy"),
        ("say", "ALI", "surprised", "ارے! تم کہاں جا رہی ہو، بلی رانی؟", "अरे! तुम कहाँ जा रही हो, बिल्ली रानी?"),
        ("wait", 1.2),
    ]),

    ("home", [
        ("say", "NANA", "happy", "السلام علیکم، میرے بچو! اور یہ ننھا مہمان کون ہے؟", "अस्सलामु अलैकुम, मेरे बच्चो! और ये नन्हा मेहमान कौन है?"),
        ("say", "ALI", "happy", "وعلیکم السلام، نانا جان! اِسے بہت پیاس لگی تھی، تو میں نے اِسے اپنا پانی پلا دیا۔",
         "व अलैकुम अस्सलाम, नाना जान! इसे बहुत प्यास लगी थी, तो मैंने इसे अपना पानी पिला दिया।"),
        ("wait", 0.3),
        ("say", "NANA", "proud", "ماشاءاللہ، علی! مجھے تم پر بہت فخر ہے۔ ہمارے پیارے نبی صلی اللہ علیہ وسلم نے فرمایا، کہ ہر جاندار کے ساتھ نیکی کرنے میں ثواب ہے۔",
         "माशा अल्लाह, अली! मुझे तुम पर बहुत फ़ख़्र है। हमारे प्यारे नबी, सल्लल्लाहु अलैहि वसल्लम, ने फ़रमाया, कि हर जानदार के साथ नेकी करने में सवाब है।"),
        ("wait", 0.3),
        ("sfx", "meow_happy"),
        ("say", "MARYAM", "excited", "نانا جان، کیا ہم اِسے رکھ لیں؟ اِس کا نام لیمو رکھتے ہیں!", "नाना जान, क्या हम इसे रख लें? इसका नाम लेमू रखते हैं!"),
        ("sfx", "laugh"),
        ("say", "NANA", "laugh", "ہا ہا ہا! ٹھیک ہے، لیمو ہی سہی!", "हा हा हा! ठीक है, लेमू ही सही!"),
        ("wait", 1.0),
    ]),

    ("moral", [("wait", 0.6), ("say", "N", "warm", "ہر جاندار کے ساتھ نرمی کرو۔ اللہ نرمی کرنے والا ہے، اور نرمی کو پسند کرتا ہے۔",
                                 "हर जानदार के साथ नरमी करो। अल्लाह नरमी करने वाला है, और नरमी को पसंद करता है।"), ("wait", 1.8)]),
    ("end", [("wait", 5.0)]),
]
