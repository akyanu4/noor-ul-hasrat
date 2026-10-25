"""Clean TurboScribe's machine-English SRTs of Haqeeqat-e-Bai'at into proper English captions.
Each override replaces cues a..b (1-based, inclusive) with one caption spanning them. DROP removes cues.
Cues not covered by an override keep their text (after general fixes). Times stay those of the recording part;
OFFSET shifts a part to the full recording's timeline."""
import re, json, sys

def parse(path):
    out = []
    for b in re.split(r"\n\s*\n", open(path, encoding="utf-8-sig").read().strip()):
        ln = [x for x in b.splitlines() if x.strip()]
        if len(ln) < 3: continue
        a, z = ln[1].split("-->")
        def t(s):
            h, m, r = s.strip().split(":"); sec, ms = r.split(","); return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000
        out.append((int(ln[0]), t(a), t(z), " ".join(ln[2:]).replace("(Transcribed by TurboScribe. Go Unlimited to remove this message.)", "").strip()))
    return out

FIX = [(r"\bthe government\b", "the Prophet ﷺ"), (r"\bSarkar's\b", "the Prophet's ﷺ"), (r"\bSarkar\b", "the Prophet ﷺ"),
       (r"\bthe Prophet\b(?! ﷺ)", "the Prophet ﷺ"), (r"\bMessenger of Allah\b(?! ﷺ)", "Messenger of Allah ﷺ"),
       (r"\bthe oath of allegiance\b", "bai'at"), (r"\bdisciples\b", "murids"), (r"\bdisciple\b", "murid"),
       (r"\bMurshid\b", "murshid"), (r"\bMashallah\b|\bMashaAllah\b", "MashaAllah"), (r"\bSubhanallah\b", "SubhanAllah")]
def fix(s):
    for a, b in FIX: s = re.sub(a, b, s)
    return re.sub(r"\s+", " ", s).strip()

def build(cues, overrides, drop):
    by = {c[0]: c for c in cues}; used = set(); rows = []
    for (a, b), txt in overrides.items():
        rng = [i for i in range(a, b + 1) if i in by]
        if not rng: continue
        used.update(rng)
        if txt: rows.append((by[rng[0]][1], by[rng[-1]][2], txt))
    for i, s, e, t in cues:
        if i in used or i in drop or not t: continue
        rows.append((s, e, fix(t)))
    rows.sort()
    return rows

# ------------------------------------------------------------------ recording 1, part B (starts 26:37 in the recording)
O1B = {
 (1, 6): "What a difference it has made! Nowadays there is no such teaching. The teaching we had here has come to an end — all that is left is sitting in qawwali.",
 (7, 13): "Many people do zikr. In zikr one draws closer to Allah; one remembers Allah, and the thought stays turned towards Allah.",
 (14, 16): "But it stays far off. Only qawwali — they listen to qawwali the whole night.",
 (17, 20): "In it is the mention of the Prophet ﷺ, his glory and greatness; the love for the Prophet ﷺ is intense.",
 (21, 23): "That is necessary in its place. But if that is all there is, how far does one get?",
 (24, 28): "Some elders have given this mark of a good murshid: in whose company all whisperings and idle thoughts stop, and a person's mind becomes bound to Allah and His Messenger ﷺ.",
 (29, 33): "Look first and understand, then give your hand. Otherwise regret follows.",
 (34, 36): "The one who frees you from bondage to everything else — his company is necessary.",
 (37, 39): "If he turns your thoughts towards Allah and His Messenger ﷺ, that is the real thing.",
 (40, 41): "To see good and bad for what they are is the eye of a great one.",
 (42, 49): "Now see, what do I always tell you all? When I speak, keep looking into my eyes. Some people sit with their heads down while I talk, so I tell them at once: look into my eyes.",
 (50, 54): "The states that come out of my eyes come into your eyes too. That is why you should keep your eyes open and keep looking at the murshid.",
 (55, 57): "The Companions used to keep looking at the Prophet ﷺ — and they also lowered their gaze out of respect.",
 (58, 59): "To see good and bad for what they are is the eye of a great one.",
 (60, 63): "When the heart is straight, the eyes stay fixed on one point; the eye of a troubled person stays troubled too.",
 (64, 68): "Some say that if you look at a wali from behind, he often turns round and looks; and if you ask him something, he answers at once.",
 (69, 75): "There is an incident. The Chadarghat bridge, towards Malakpet — after crossing the bridge, on the way to Sultan Bazar, there is a mosque on the left-hand side.",
 (76, 80): "In that mosque people were sitting for namaz and talking about something. An old man, a wali, was sitting there, and everyone was listening to him.",
 (81, 90): "It so happened that Hazrat Qadeer Piya Sarkar was entering the mosque by the door. As he stepped onto the stairs, the old wali threw his staff and said: 'If anyone has the strength, let him pick it up!'",
 (91, 93): "Qadeer Piya Sarkar caught it. 'Oh — it is you who has come!' He had picked it up.",
 (94, 100): "Why? Without turning round, the old wali knew that a wali was behind him — that is why he threw his staff. 'Oh, it is you! How else would I know you had come?'",
 (101, 109): "Did you see? It says here: a wali recognises a wali. If a wali is behind him, he turns and looks — he knows someone is there.",
 (110, 119): "Remember: the thoughts of every person and the effect of his company draw others in and spread all around — like a stone thrown into water: the ripples come.",
 (120, 125): "Good company leads to good, and bad company leads to evil. Throw one pebble into water and it makes ripples; a circle forms.",
 (126, 134): "Good company leads to good, bad company to evil. But if a big stone and a small pebble are thrown into the water together, the big stone's ripples swallow the pebble's ripples.",
 (135, 139): "Do you understand? The small pebble's ripples are gone; the big stone's are at work — they overpower them.",
 (140, 146): "In the same way, a person of ordinary thoughts and weak faith who sits in the company of a perfected one — his doubtful and harmful thoughts grow weaker and weaker.",
 (147, 155): "He gains the strength to leave his weak thoughts; all the bad thoughts fade away, and he is shaped by the company of the perfected, strong-willed one.",
 (156, 160): "If someone makes a mistake after giving bai'at, he should repent and say: Astaghfirullah al-'Azeem alladhi la ilaha illa Huwa al-Hayy al-Qayyum wa atubu ilayh. Recite this much.",
 (161, 166): "Even if a sinless person repents, it is good for him. Repentance never goes to waste.",
 (167, 174): "Once a Companion had given bai'at at the hand of the Prophet ﷺ. After a while the Prophet ﷺ said: 'You too, give bai'at.' He said: 'O Messenger of Allah ﷺ, I have already given bai'at.' The Prophet ﷺ said: 'What of it? Give bai'at again.'",
 (175, 179): "SubhanAllah. 'What of it? Give bai'at again.' See how it is.",
 (180, 184): "Where else would you find this? It looks like a small book, but it is full of knowledge you won't find in big books — here it is, in a few pages.",
 (185, 197): "[He reads the passage again: repentance after bai'at, and the Companion told to give bai'at again.]",
 (198, 203): "Let me give you another example. I have studied hadith; I have read a great deal of hadith.",
 (204, 210): "Once it was the time of the Isha prayer. The Prophet ﷺ was sitting with his Companions. As the prayer began everyone stood up — but one of them stayed sitting.",
 (211, 219): "He said: 'I have already given bai'at.' 'What of it? Give bai'at again — otherwise it is of no use.'",
 (220, 228): "'Do not stay apart; give bai'at.' Do you understand? This is how it is: once you have given bai'at, renew it. That is what I do — having given bai'at once, I give it again.",
 (229, 237): "Is it necessary for every person to become a murid? The answer: whoever considers it necessary to live by the rules of the path and wants to fulfil them at a high level. If you do not consider it necessary, then deprivation is your lot.",
 (238, 242): "There is an old saying: 'Whoever has no pir, his pir is Shaytan.' Do you see? This is very important.",
 (243, 246): "And it is easy to see why: the murid has his master's hand over him, so Shaytan cannot touch him.",
 (247, 282): "",   # a personal account the machine transcript garbled; left uncaptioned rather than guessed
 (283, 290): "Now I see something — that is a different matter. Qadeer Piya Sarkar fixed his eyes on mine and looked at me, and kept telling me many things. I held his gaze; I kept looking, I kept listening.",
 (291, 297): "For years — from childhood until I married and had children. I was in Warangal; I have two children, Azeem Baba and Khwaja Baba. In Warangal I used to go about with Hazrat.",
 (298, 301): "Does it go to waste? People were Muslims, but when they saw the Prophet ﷺ, what did they become? Sahabis — Companions.",
 (302, 309): "Now no wali can reach their rank, however great — because they looked at the Prophet ﷺ with their own eyes, and the Prophet ﷺ looked at them. Do you understand what being a Companion is?",
 (310, 318): "So what is happening? Through the eyes, the voice, the warmth, the breath — through so many things — sitting with a wali, what spreads from his body, his heart, his mind and his thoughts reaches you. It does not reach others; those who are with him are the ones affected.",
 (319, 333): "Is it necessary for everyone? Whoever hates bad things and keeps away from them, who is drawn to good things, wants to see and hear good and become good himself, and considers it necessary to keep the rules of the path at a high level — [for him it is]. If you do not consider it necessary, you are deprived.",
 (334, 336): "To those who raise objections, Hazrat gives this answer too: this is the saying of the elders.",
 (337, 341): "Someone may also say: the books of the Qur'an and hadith are available, the books of tasawwuf and Sunnah are available — then why did different ways arise: Qadri, Chishti, Naqshbandi and so on?",
 (342, 357): "The one who derives rulings from the Qur'an and hadith is a faqih, a jurist: from the verses of the Qur'an and the practice of the Prophet ﷺ he says, 'This is a matter of fiqh; act on it.' What is fiqh? Looking at the verses of the Qur'an and the hadith of the Prophet ﷺ: this is the ruling.",
 (358, 365): "The answer is: just as the jurists who derive rulings from the Qur'an and hadith differ — some Hanafi, some Shafi'i, some Maliki, some Hanbali — so too those who derive the path from the Qur'an and hadith are Qadri, Chishti, Naqshbandi and so on. MashaAllah, SubhanAllah.",
 (366, 372): "Now look: when we do wudu from the Qur'an, what do we do? After the washing we do masah — we wipe the head. In that we are Hanafi: we wipe a quarter of the head.",
 (373, 381): "Another school wipes the whole head — is it the Hanbali or the Shafi'i? Perhaps the Hanbali wipe the whole head, and the Shafi'i just a little. We wipe a quarter.",
 (382, 386): "This is fiqh. In the Qur'an, what is it? 'Wipe your heads' — whatever the words for it are — and one school does it this way, another that way.",
 (387, 394): "Those who studied the hadith and practised them understood the questions of fiqh and began to act on them; those who follow a particular way are different: Hanafi, Shafi'i, Hanbali — all of them are like this.",
 (395, 401): "Some, even in prayer, do it like this — raising the hands; it is called raf'-ul-yadain. The Hanafis do not do raf'-ul-yadain; the Shafi'is and Hanbalis do. See how far we have come.",
 (402, 411): "In the same way there are those who chose a path: Qadri, Chishti, Naqshbandi and so on. So what are we all? People who have chosen a path and are walking on it.",
 (412, 432): "Let me read another line. Remember one thing: people's temperaments differ; their natures are different. Some are drawn to one way and some to another; each finds his own way, and for each there is a way. Different families of the path have different ways.",
 (433, 435): "See, it is Allah's great grace: He gives to whom He wills. And so much knowledge [in so few pages].",
}

# ------------------------------------------------------------------ recording 2, part A
O2A = {
 (1, 9): "A'udhu billahi min ash-shaytan ir-rajeem. Bismillah ir-Rahman ir-Raheem. It has started to rain. How wonderful — MashaAllah. May Allah show all of you.",
 (10, 21): "And may you know that the dars here can also be seen. What is it? Kashf — it opens. Here, by reading the teachings of the Prophet ﷺ, kashf comes too. Do you understand? And from above, ilqa — inspiration — also opens. This is Allah's grace.",
 (22, 31): "A'udhu billah, Bismillah. In Haqeeqat-e-Bai'at, Huzoor Shams-ul-Mufassireen, Khadim-ul-Quran, Bahr-ul-Uloom Hazrat Muhammad Abdul Qadeer Siddiqui Hasrat Rahmatullah Alaih, Professor and former Head of the Department of Theology, Osmania University — published by the Hasrat Academy long ago; this is its third printing.",
 (32, 36): "Hazrat writes: 'Every Muslim man and woman should do istighfar — so why is a murshid needed for istighfar?'",
 (37, 46): "Such objections and questions are answered in the Qur'an. Now see, this is written on a verse of the Qur'an: 'If, when they had wronged themselves, they had come to you and asked Allah's forgiveness, and the Messenger had asked forgiveness for them, they would have found Allah Accepting of repentance, Most Merciful.' (an-Nisa 4:64)",
 (47, 52): "It is clear from this that asking forgiveness on one's own is not enough; the prayer of one whose heart is enlightened should also be sought — just as the Prophet ﷺ himself would pray for their forgiveness.",
 (53, 57): "'May Allah forgive their sins.' Becoming a murid begins with istighfar: the murshid prays for forgiveness for him, and there is hope that it will be accepted.",
 (58, 68): "Just think: love for the sake of Allah. It is a very important thing; it is in the hadith: for those who love one another for Allah's sake, pulpits of light will be set up — a station so high that the prophets will say, 'Oh, what a station!'",
 (69, 83): "Think with a calm heart: why does the murid love his murshid? He loves him for the sake of Allah. Love for Allah's sake is what is between the two. Oh! With Allah, the matter of love goes so far!",
 (84, 94): "Don't you know? 'A person is with the one he loves.' And you are with the one you love.",
 (95, 101): "There is an address in this: someone came and asked, and he was told — the Companion was told — 'A person will be with the one he loves.'",
 (102, 107): "And it is in the Holy Qur'an: even if the children fall short in deeds, Allah joins them with their parents in Paradise. (at-Tur 52:21)",
 (108, 114): "Who are these murids? They are spiritual children. Wow! InshaAllah, the murids will be joined with their master.",
 (115, 121): "Wow! Khwaja ya Sarkar, Khwaja ya Sarkar, Ghaus-e-Pak Sarkar! SubhanAllah, MashaAllah.",
 (122, 126): "What is being read now is not just for sitting and listening — you have to act on it at once. That is why you are rushing forward, and I joined you at once.",
 (127, 135): "So what am I doing? I am meeting you, but I am giving my hand to Qadeer Piya. I see myself there. Why are you looking at me? I am looking there, not at you — at my master.",
 (136, 143): "MashaAllah — wow, wow! Everyone has joined hands. MashaAllah. May you live long!",
 (144, 155): "Now what are you doing? You have started meeting me — and through me, Qadeer Piya. He is my master, so you are happy that you met our master. He is the master of the master — the Dada, Dada Peer. That is why we give it attention.",
 (156, 162): "Who are these murids? Spiritual children. InshaAllah, the murids will be joined with their master; they will rise with him.",
 (163, 172): "They will rise with him from the grave. As soon as they rise they will say: 'Where is my master?' and they will go to their master.",
 (173, 184): "I don't know how many thousands, how many lakhs of murids will follow their master — think of it — they will be in crores. Qadeer Piya had lakhs of murids; now his murids have lakhs of murids. MashaAllah. Where the master will be, the murids will be too, InshaAllah.",
 (185, 200): "What is khilafat? Now listen. Everyone thinks it is a fine thing to have khilafat, but it is a great thing — it comes from above. One has to think: am I worthy of it? Do I have that station, that connection with Allah and His Messenger ﷺ? He may think it, but he should not ask; he should stay silent. Allah gives what He wills.",
 (201, 215): "When we ask once, Allah does not give; even twice, He does not. The third time it comes sternly: 'I am telling you — you are to give him khilafat, and you are not giving it?' 'Give it to him.' 'Yes, sir.' And he gave it. MashaAllah.",
 (216, 222): "So what is khilafat? It is the confirmation that a murid has become worthy.",
 (223, 235): "Students study; by studying they become qualified, and the teacher gives them a certificate — the government gives a certificate.",
 (236, 246): "But remember: neither a merely formal discipleship is of any use, nor a merely formal khilafat. In many places khilafat is given to whoever they like. Some people come and say, 'Give me khilafat' — many say it to me. A'udhu billah!",
 (247, 253): "Faith and good deeds — both are a gift from Allah.",
 (254, 263): "",
 (264, 271): "I always keep telling people. I am reading the translation of the verse of Surah an-Nisa: 'If, when they had wronged themselves, they had come to you and asked forgiveness of Allah, and the Messenger had asked forgiveness for them,'",
}

# ------------------------------------------------------------------ recording 2, part B (Roman Urdu at first; translated here)
O2B = {
 (1, 4): "'…they would have found Allah Accepting of repentance, Most Merciful.'",
 (5, 7): "MashaAllah. Now, this is page seven. Bismillah.",
 (8, 9): "So what, after all, is a khalifa?",
 (10, 12): "'Khalifa' comes from 'khalaf' — and khalaf means 'behind', 'what comes after'.",
 (13, 17): "The one who follows the one before him and carries on his work is his khalifa — his successor.",
 (18, 22): "From the Messenger of Allah ﷺ the Muslims received the Qur'an and the hadith, and through the blessing of his company their selves were purified — our nafs became pure.",
 (23, 24): "Tazkiya-e-nafs means the purifying of our self.",
 (25, 30): "Whoever recites the Holy Qur'an to people and teaches others to read it correctly — that is, the qari — he too is a khalifa.",
 (31, 33): "Whoever explains the meanings of the Holy Qur'an — that is, writes tafsir — is a mufassir: a khalifa.",
 (34, 37): "Whoever narrates the hadith of the Prophet ﷺ and, after verifying them, passes them on to the Ummah — that is, the muhaddith — he too is a khalifa.",
 (38, 43): "Whoever derives rulings from the Qur'an and hadith — draws them out in the light of the Qur'an and hadith: 'this is the ruling' —",
 (44, 48): "that is, the mujtahid and the faqih — he too is a khalifa.",
 (49, 56): "A faqih, you see, takes the verses of the Qur'an and the hadith related to them and says: we should act according to fiqh. That is fiqh, and the one who does it is the faqih — the mujtahid and faqih; he too is a khalifa.",
 (57, 59): "Whoever keeps people on correct beliefs and answers the enemies of Islam — that is, the mutakallim — he too is a khalifa.",
 (60, 62): "[reads it again] Whoever keeps people on correct beliefs and answers the enemies of Islam — the mutakallim — he too is a khalifa.",
 (63, 68): "In his later years, outward government and rule also came to the Messenger of Allah ﷺ. So a just king who follows the Shari'ah and makes others keep to the laws of Islam — he too is a khalifa.",
 (69, 71): "He is a king, but he too becomes a khalifa: he walks on Islam and makes the people keep to it.",
 (72, 78): "Whoever explains the secrets of the deen — the deen has secrets, hidden things that cannot be grasped outwardly, and he explains those too — whoever purifies the self, corrects the thoughts and teaches spirituality: he too is a khalifa.",
 (79, 88): "[He reads both passages again: the just king, and the one who teaches the secrets of the deen and spirituality.]",
 (89, 89): "And he is the better khalifa.",
 (90, 93): "Whoever teaches soldiering is also a khalifa. We had training in all of that too — binnot (stick-fighting), wrestling and so on.",
 (94, 98): "In it there was the strike Hazrat Ali (may Allah be pleased with him) used to make with his sword — the zarb-e-Haidari, as it is called. People could not get it.",
 (99, 104): "A man became Hazrat's murid and came. After a while he said that he did binnot, sword and all these things. 'Is that so? Do you know the zarb-e-Haidari?' 'Yes, I know it.'",
 (105, 110): "'Then show me.' At once he drew and struck, exactly as it should be done — he showed the zarb-e-Haidari. Oh!",
 (111, 115): "Then Hazrat said: 'In this, you have become my teacher. In this, you have become my teacher.' That is how it was — the zarb-e-Haidari.",
 (116, 117): "And once it happened that he was showing us how to wrestle and what to do.",
 (118, 124): "And besides that he taught us: when you fight with the stick, with a sword or with a staff, don't look here and there — no — keep looking into the eyes of the one you are fighting. Don't look here and there.",
 (125, 127): "So when we fought, that is what we did: we kept looking at him.",
 (128, 133): "In the same way I tell you: when I say something, open your eyes and look at me — don't sit with your head bowed out of respect, not at all. From my gaze into your gaze, into your eyes, a state will pass from here.",
 (134, 138): "It is the matter of the Qur'an, the hadith, the glory and greatness of the Prophet ﷺ and of the awliya of Allah — and it is going from here into your eyes.",
 (139, 139): "In our times there were many kinds of mashaikh.",
 (140, 144): "In short: the more one follows the Messenger of Allah ﷺ, spreads his teaching and walks in the footsteps of 'Balligh ma unzila ilayk', the more he is a khalifa in that same measure.",
 (145, 149): "'Convey to the people what has been sent down to you.' Balligh — convey; ma unzila — what has been sent down; ilayka — to you.",
 (150, 153): "Whoever, from beginning to end, in all his work serves the mission of the Prophet — what can be said of him! He is the successor of the Prophet ﷺ, the very image of Muhammad ﷺ —",
 (154, 155): "like Hazrat Abu Bakr Siddiq, Hazrat Umar Farooq, Hazrat Usman Ghani and Hazrat Ali Murtaza, may Allah be pleased with them.",
 (156, 175): "",   # the machine transcript repeats "R.A." for three minutes here; nothing usable
 (176, 181): "In those days there was no call for public donations, nor any need for orphanages. The murids did not neglect serving their master, and the master did not neglect the upbringing and training of his murids.",
 (182, 186): "Now the times have changed: neither that master nor that murid remains. From morning to evening there is a great noise about donations, but no work is seen to be done.",
 (187, 188): "",
 (189, 196): "Nowadays donations are collected for widows and orphans. But who are the widows? The wives of the pir sahib himself — the pir is alive, and his wife is the 'widow'!",
 (197, 201): "That is, instead of the widows, the pir gives it to his own wife. And who are the orphans? The pir's own children.",
 (202, 204): "So what is left for me? To weep in my heart and to lament with my tongue.",
 (205, 207): "[A note at the end of the page about contributions to the Siddiqi institute.]",
}

def srt(rows, path, offset=0.0):
    def ts(x):
        x = max(0, x + offset); h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60
        return f"{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}".replace(",1000", ",999")
    with open(path, "w", encoding="utf-8") as f:
        for i, (a, b, t) in enumerate(rows, 1): f.write(f"{i}\n{ts(a)} --> {ts(b)}\n{t}\n\n")

r1b = build(parse("001B.srt"), O1B, set())
r2a = build(parse("002A.srt"), O2A, set())
r2b = build(parse("002B.srt"), O2B, set())
for n, r in (("1B", r1b), ("2A", r2a), ("2B", r2b)):
    left = [x for x in r if not any(x[2] == v for v in (O1B | O2A | O2B).values())]
    print(n, len(r), "captions;", len(left), "kept from machine text")
    for x in left[:12]: print("   ", round(x[0], 1), x[2][:90])
json.dump({"1B": r1b, "2A": r2a, "2B": r2b}, open("clean.json", "w"), ensure_ascii=False)
