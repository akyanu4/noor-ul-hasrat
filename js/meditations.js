/* Noor: "Mystic Meditations" (Muraqabat), the ways of driving away khatrat (passing thoughts) and keeping the heart on
   Allah, as Hazrat Azam Pasha R.A. taught them in the dars Nizam-ul-Amal-e-Fuqara (parts 6 and 7). Each card: a picture
   (scenes from the Shorts, faces of elders hidden in light), the Urdu name, a short description and Hazrat's steps.
   Opens from Practices, More → Prayers & Practices, and ?meditations=1. */
(function (root) {
  'use strict';
  var N = root.Noor, doc = root.document;
  if (!N || !doc) return;
  try {
    if (/[?&]meditations=1/.test(root.location.search || '')) { root.history.replaceState(null, '', root.location.pathname); setTimeout(function () { N.route('meditations'); }, 400); }
  } catch (e) {}
  var esc = N.esc;
  function T(en, ru) { return N.T ? N.T(en, ru) : en; }   // English or Roman Urdu (js/lang.js)
  function sw() { return N.langChip ? N.langChip() : ''; }

  // shorts: [] stays empty while the Shorts are private drafts. After publishing, fill in { id, title } (YouTube id) for:
  //   khatrat             NAF6_Short1_A_Passing_Thought_or_a_Resolve
  //   good-thoughts       NAF7_Short1_Ask_Allah_for_Good_Thoughts
  //   yaad-faramosh       NAF7_Short2_The_Pact_of_Remembrance
  //   change-state, run-from-it, imagine-it-leaving   NAF7_Short3_Stand_Up_and_the_Thought_Leaves
  //   refuge, hoon-hoon, new-creation                 NAF7_Short4_Take_Refuge_in_Allah
  //   nazar-bar-qadam, khalwat-dar-anjuman            NAF6_Short2_Keep_Your_Gaze_on_Your_Steps
  //   guard-the-gaze      NAF6_Short3_The_Eyes_Are_Hunters (and NAF6_Short2_Keep_Your_Gaze_on_Your_Steps)
  //   tasawwur-e-shaykh   NAF6_Short4_What_Opened_My_Eyes
  //   one-point           NAF6_Short5_Where_Will_You_Find_Tawheed
  //   asl-e-wujood        NAF7_Short5_I_Recognise_You_in_Every_Form
  var INTRO = {
    slug: 'khatrat', t: 'Khatrat: passing thoughts', ur: 'خطرات', head: 'What Hazrat said',
    ru_t: 'Khatrat: guzarte khayalaat', ru_d: 'Khatra woh hai jo aata hai aur chala jaata hai. Bura khayal aaya, ya achha khayal aaya, aur chala gaya.',
    ru_steps: [
      'Jab aap kisi cheez ki pakki niyyat kar lete hain to woh khatra nahin rehta; woh ‘azm ban jaata hai, yaani iraada. Achha ho ya bura, dono mein yeh ho sakta hai.',
      'Khatra maaf hai, lekin ‘azm maaf nahin. Agar bura khayal aaye aur hum uska iraada kar lein to hum gunahgaar ho jaate hain; agar achha khayal aaye aur hum uska iraada kar lein to humein uski taufeeq di jaati hai.',
      'Subah se shaam tak achhe aur bure khayalaat aate jaate rehte hain; unka kisi se hisaab nahin hota.',
      'Daf’-e-khatrat, yaani guzarte khayalaat ko door karne ke liye, kitaab “aazmaaye hue” (mujarrab) tareeqe deti hai: woh neeche hain.'
    ],
    ru_head: 'Hazrat ne kya farmaya', d: 'A khatra is what comes and goes. A bad thought came, or a good thought came, and it left.',
    steps: [
      'When you make a firm intention about something, it is no longer a khatra; it becomes ‘azm, a resolve. Good or bad, this can happen with both.',
      'A khatra is forgiven, but the resolve is not. If a bad thought comes and we resolve on it, we become sinners; if a good thought comes and we resolve on it, we are given its guidance.',
      'Good and bad thoughts come and go from morning to evening; no one is held to account for them.',
      'For daf’-e-khatrat, driving away passing thoughts, the book gives “tried and tested” (mujarrab) methods: they are below.'
    ],
    shorts: [{ id: '2Uv3prgEqqg', title: 'A Passing Thought or a Resolve' }]
  };
  var CARDS = [
    { slug: 'good-thoughts', t: 'Turn the thought into du’a', ur: 'اچھے خیالات کی دعا',
      ru_t: 'Khayal ko dua bana dijiye', ru_d: 'Jo bhi bekaar khayal bewaqt aaye, Allah se wahi khayal uski achhi (ijaabi) soorat mein maangiye.',
      ru_steps: [
        'Jo bekaar khayal aa raha hai usko chhodiye, aur Allah se woh achhe khayalaat maangiye jinki humein zaroorat hai.',
        'Kahiye: “Ae Maalik, hum Tere fazl ke muntazir hain. Yeh bekaar khayalaat hum se door kar de, aur humein achhe khayalaat ata farma.”',
        'Bure khayalaat se bachne ki dua kijiye, kyunki Allah ka hukm hai: Mujh se maango, main tumhein doonga.',
        'Dua ibaadat ka maghz hai: jo ibaadat hum karte hain woh dua se poori hoti hai.'
      ],
      d: 'Whatever useless thought comes at the wrong time, ask Allah for that same thought in its positive form.',
      steps: [
        'Leave the useless thought that is coming, and ask Allah for the good thoughts we need.',
        'Say: “O Master, we are waiting for Your grace. Take away these useless thoughts, and give us good thoughts.”',
        'Pray to be saved from bad thoughts, because it is Allah’s command: ask of Me, I will give to you.',
        'Du’a is the core of worship: the worship we do is completed by du’a.'
      ],
      ar: [
        { ar: 'ٱدْعُونِيٓ أَسْتَجِبْ لَكُمْ', tr: 'Ud‘uni astajib lakum.', mn: 'Call upon Me; I will answer you. (Surah Ghafir 40:60)', ru_mn: 'Mujhe pukaaro, main tumhari dua qabool karunga. (Surah Ghafir 40:60)' },
        { ar: 'اَلدُّعَاءُ مُخُّ الْعِبَادَةِ', tr: 'Ad-du‘a mukhkh al-‘ibadah.', mn: 'Du’a is the core of worship. (Hadith)', ru_mn: 'Dua ibaadat ka maghz hai. (Hadith)' }
      ],
      shorts: [{ id: 'AEXCqRRUUhk', title: 'Ask Allah for Good Thoughts' }] },
    { slug: 'yaad-faramosh', t: 'The pact of remembrance', ur: 'یاد فراموش',
      ru_t: 'Yaad-faramosh ka muahida', ru_d: 'Saathiyon ke darmiyaan ek muahida, taaki Allah ki yaad jaari rahe aur kabhi faramosh na ho, chaahe woh saath baithe hon, baat-cheet kar rahe hon aur kaam-kaaj kar rahe hon.',
      ru_steps: [
        'Aapas mein tay kar lijiye; phir saath baithiye, baat-cheet kijiye aur kaam-kaaj kijiye.',
        'Un mein se ek sahab pukaar kar bolte hain: “Allah!”',
        'Jinka dil haazir hai woh “Alhamdulillah” kehte hain. Jinse faramoshi hui, yaani ghaflat hui aur bhool gaye, woh “Astaghfirullah” kehte hain: ae mere Allah, mujhe maaf farma.',
        'Is yaad-faramosh ke muahide se na sirf dawaam-e-huzoor ko madad milti hai, balke apni ghalti ka i’tiraaf karna padta hai, aur tumhara kaam lillah, fillah ho jaata hai: Allah ke waaste, aur Allah mein.'
      ],
      d: 'A pact made among companions so that the remembrance of Allah goes on and is never forgotten, even while they sit together, talk and go about their work.',
      steps: [
        'Agree on it among yourselves; then sit together, talk and go about your work.',
        'One of you calls out: “Allah!”',
        'Whoever’s heart was present answers “Alhamdulillah”. Whoever had become heedless and forgotten answers “Astaghfirullah”: O my Allah, forgive me.',
        'Through this pact one gets help toward constant presence, one admits one’s own mistake, and the work becomes lillah, fillah: for the sake of Allah, and in Allah.'
      ],
      ar: [{ ar: 'اَللّٰه ۔ اَلْحَمْدُ لِلّٰهِ ۔ أَسْتَغْفِرُ اللّٰهَ', tr: 'Allah! · Alhamdulillah · Astaghfirullah', mn: 'The call; the answer of the heart that was present; the answer of the heart that had forgotten.', ru_mn: 'Pukaar; jis dil ko yaad thi uska jawaab; jis dil ne bhula diya tha uska jawaab.' }],
      shorts: [{ id: 'OT27WmUbKP4', title: 'The Pact of Remembrance' }] },
    { slug: 'change-state', t: 'Change your state', ur: 'حالت بدلنا',
      ru_t: 'Apni haalat badliye', ru_d: 'Jab khatrat kasrat se aayein to haalat ko badlo. Iska asl usool harkat hai.',
      ru_steps: [
        'Baithe ho to khade ho jao; khade ho to chalo; ya baith jao.',
        'Jaise hi hum harkat mein aayenge, khatrat dafa ho jaayenge.',
        'Hum baithe hain, khatrat aa rahe hain, hat nahin rahe; jaise hi khade hue aur haalat badli, khatrat chale jaate hain.'
      ],
      d: 'When khatrat come in great numbers, change your state. The root principle here is movement.',
      steps: [
        'If you are sitting, stand up; if standing, walk; or sit down.',
        'As soon as we move, the khatrat are driven away.',
        'We sit and sit and they do not leave; the moment we stand up and change our state, the khatrat vanish.'
      ],
      shorts: [{ id: '-cGkzw6kzkg', title: 'Stand Up and the Thought Leaves' }] },
    { slug: 'run-from-it', t: 'Run from the thought', ur: 'خطرہ سے بھاگنا',
      ru_t: 'Khayal se bhaagiye', ru_d: 'Jab tumhare dil mein, khayal mein koi khatra aaye, to us se bhaago.',
      ru_steps: [
        'Khatra aate hi apne aap ko us se door bhagao: khatre ko peeche chhodo, aur khud bhaago.',
        'Thodi der mein khatra peeche reh jaayega, aur tum nikal jaaoge aur us se rihaai paaoge.',
        'Hum jo khatre mein giraftaar the, woh giraftaari se nikal jaate hain.'
      ],
      d: 'When a khatra comes into your heart, into your thoughts, run from it.',
      steps: [
        'As soon as it comes, drive yourself away from it: leave it behind, and run.',
        'In a little while the thought will be left behind; you will get out and be freed from it.',
        'We who were captives of the thought get out of that captivity.'
      ],
      shorts: [{ id: '-cGkzw6kzkg', title: 'Stand Up and the Thought Leaves' }] },
    { slug: 'imagine-it-leaving', t: 'See the thought running away', ur: 'عالمِ تخیل',
      ru_t: 'Khayal ko bhaagta hua dekhiye', ru_d: 'Ya aalam-e-takhayyul mein samjho ke yeh khatra mujh se bhaag raha hai: is se bhi khatra raf’a ho jaata hai.',
      ru_steps: [
        'Jab khatra aaye to aisa khayal karo: “Yeh khatra mujh se bhaag raha hai.”',
        'Aalam-e-takhayyul yaani khayal ka aalam. Is se bhi khatra raf’a ho jaata hai.'
      ],
      d: 'Or imagine, in the world of imagination (aalam-e-takhayyul), that the thought is running away from you: this too removes it.',
      steps: [
        'When the khatra comes, think: “This thought is running from me.”',
        'Aalam-e-takhayyul means the world of imagination, of thought. By this too the khatra is removed.'
      ],
      shorts: [{ id: '-cGkzw6kzkg', title: 'Stand Up and the Thought Leaves' }] },
    { slug: 'refuge', t: 'Come into Allah’s refuge', ur: 'اللہ کی پناہ',
      ru_t: 'Allah ki panaah mein aaiye', ru_d: 'Jab khatrat aate hi rahein, to Allah ki panaah mein aaiye aur Us se madad maangiye.',
      ru_steps: [
        'Kahiye: “Allah Miyan, yeh khatre jo aa rahe hain, bahut. Aap madad farmaaiye aur mere khatron ko door kijiye. Main Aapki panaah mein aana chaahta hoon.”',
        'Koi khatra aaye to kaho: “Yeh humein pareshaan karenge to phir humein panaah kahaan milegi? Humein in khatraat se bachaaiye; apni panaah mein le lijiye.”',
        'Bade bade logon ko bhi khatre pareshaan karte hain: Auliya Allah bhi Allah ki panaah mein aate hain, aur yeh tareeqe ikhtiyaar karte hain.'
      ],
      d: 'When the khatrat keep coming, come into the refuge of Allah and ask for His help.',
      steps: [
        'Say: “Allah Mian, these khatrat keep coming, so many. Please help me and take my khatrat away. I want to come into Your refuge.”',
        'When a khatra comes, say: “If these trouble us, where else will we find refuge? Save us from these khatrat; take us into Your refuge.”',
        'Even great people are troubled by khatrat: the Awliya Allah too come into Allah’s refuge, and adopt these methods.'
      ],
      shorts: [{ id: 'uuet4U0KRu4', title: 'Take Refuge in Allah' }] },
    { slug: 'hoon-hoon', t: 'Breathe out: “hoon, hoon”', ur: 'ہوں ہوں',
      ru_t: 'Saans chhodiye: “hoon, hoon”', ru_d: 'Khatrat door karne ke aazmaaye hue tareeqon mein se ek, jo saans se kiya jaata hai.',
      ru_steps: [
        '“Hoon, hoon” bol kar saans ko zor zor se baahar ki jaanib chhodo.',
        'Hoon… hoon… hoon… hoon: “aisa karna hai.”'
      ],
      d: 'One of the tried and tested methods for driving away khatrat, done with the breath.',
      steps: [
        'Saying “hoon, hoon”, breathe out forcefully, outward.',
        'Hoon… hoon… hoon… hoon: “that is what to do.”'
      ],
      shorts: [{ id: 'LMFTVIx55EE', title: 'Hoon, Hoon: Breathe Out the Khatra' }, { id: 'uuet4U0KRu4', title: 'Take Refuge in Allah' }] },
    { slug: 'new-creation', t: 'Recite the verse', ur: 'آیت کی تلاوت',
      ru_t: 'Aayat ki tilaawat', ru_d: 'Is aayat ke padhne se bhi khatrat kam hote hain.',
      ru_steps: [
        'Jab khatrat aayein to yeh aayat padhiye.',
        'Iska matlab: agar woh chaahe to tumhein le jaaye aur nayi makhlooq le aaye; aur yeh Allah ke liye mushkil nahin.'
      ],
      d: 'By reciting this verse too, khatrat lessen.',
      steps: [
        'When khatrat come, recite the verse.',
        'Its meaning: if He wills, He will take you away and bring a new creation; and that is not difficult for Allah.'
      ],
      ar: [{ ar: 'إِن يَشَأْ يُذْهِبْكُمْ وَيَأْتِ بِخَلْقٍ جَدِيدٍ ۝ وَمَا ذٰلِكَ عَلَى اللّٰهِ بِعَزِيزٍ', tr: 'In yasha’ yudhhibkum wa ya’ti bi-khalqin jadid, wa ma dhalika ‘ala-llahi bi-‘aziz.',
        mn: 'If He wills, He will take you away and bring a new creation; and that is not difficult for Allah. (Surah Fatir 35:16-17; the same words are in Surah Ibrahim 14:19-20)', ru_mn: 'Agar woh chaahe to tumhein le jaaye aur nayi makhlooq le aaye; aur yeh Allah ke liye mushkil nahin. (Surah Fatir 35:16-17; yahi alfaaz Surah Ibrahim 14:19-20 mein bhi hain)' }],
      shorts: [{ id: 'uuet4U0KRu4', title: 'Take Refuge in Allah' }] },
    { slug: 'nazar-bar-qadam', t: 'Gaze on your steps', ur: 'نظر بر قدم',
      ru_t: 'Nazar qadmon par', ru_d: 'Daf’-e-khatrat ke silsile mein ek aham usool hai: nazar bar qadam, yaani nazar apne paaon par, apne qadmon par rakhna.',
      ru_steps: [
        'Hamesha neechi nigaah rakho; idhar udhar na dekho.',
        'Insaan ki soorat mein badi dilkashi hai: jisko dekhoge uski soorat aankhon se dil mein aa jaayegi.',
        'Chau-taraf dekhte rahoge to dil pareshaan ho jaayega.'
      ],
      d: 'In driving away khatrat there is one important principle: nazar bar qadam, keep your gaze on your feet, on your steps.',
      steps: [
        'Always keep your gaze lowered; do not look here and there.',
        'There is great attraction in the human face: whoever you look at, his face comes into your heart through your eyes.',
        'If you keep looking all around, your heart will be scattered.'
      ],
      shorts: [{ id: 'oLbjVJ22CrU', title: 'Keep Your Gaze on Your Steps' }] },
    { slug: 'khalwat-dar-anjuman', t: 'Solitude in the crowd', ur: 'خلوت در انجمن',
      ru_t: 'Bheed mein tanhaai', ru_d: 'Khalwat dar anjuman: logon ke beech mein bhi apna khayal apne dil mein rakhna.',
      ru_steps: [
        'Apna khayal apne dil mein rakho. Anjuman hamare dil mein hi hai.',
        'Iske saath nazar apne qadmon par (nazar bar qadam) aur nigaah neechi rakho.'
      ],
      d: 'Khalwat dar anjuman: even in the middle of people, keep your attention in your heart.',
      steps: [
        'Keep your attention in your heart. The gathering is within our own heart.',
        'Together with it, keep your gaze on your steps (nazar bar qadam) and your eyes lowered.'
      ],
      shorts: [{ id: 'oLbjVJ22CrU', title: 'Keep Your Gaze on Your Steps' }] },
    { slug: 'guard-the-gaze', t: 'Guard your gaze', ur: 'حفاظتِ نظر',
      ru_t: 'Nazar ki hifaazat', ru_d: 'Amali ta’leem: chand roz apni nazar ki hifaazat karo, aur doosron ki nazar se bacho.',
      ru_steps: [
        '“Yeh aankhein badi shikaari hain.” Yeh surkh dore kya hain? Ek jaal hai jo bichha hua hai: jaal mein chidiya baithe to us mein phans jaati hai.',
        'Chand roz apni nazar ki hifaazat karo: hum kisi se nazar nahin milaate; nazar jhuka ke rakhte hain.',
        'Jab dil ek nukte par qaayam ho jaayega, haqeeqat saamne aa jaayegi, aur humein maaloom ho jaayegi.'
      ],
      ru_q: '“Laal dore hain band-e-pa-e-nazar, sayd karti hain yaar ki aankhen”: laal dore nazar ke paaon ki bediyaan hain; yaar ki aankhen shikaar karti hain. Yaar kaun hai? Allah.',
      d: 'The practical teaching: for a few days, guard your gaze, and protect yourself from the gaze of others.',
      steps: [
        '“These eyes are great hunters.” The red threads in the eyes are a net that has been spread: a bird that sits in a net is caught in it.',
        'For a few days guard your gaze: we do not meet anyone’s eyes; we keep our gaze lowered.',
        'When the heart is fixed on one point, the reality will come before you, and we will come to know it.'
      ],
      q: '“Laal dore hain band-e-pa-e-nazar, sayd karti hain yaar ki aankhen”: the red threads are fetters on the feet of the gaze; the Beloved’s eyes go hunting. Who is the Beloved? Allah.',
      shorts: [{ id: '-Icei0dP5ag', title: 'The Eyes Are Hunters' }] },
    { slug: 'tasawwur-e-shaykh', t: 'Holding the shaykh in your thought', ur: 'تصورِ شیخ',
      ru_t: 'Tasawwur-e-shaykh: shaykh ko khayal mein rakhna', ru_d: 'Jis buzurg ka khayal karoge, us buzurg ke seena-e-mubarak mein jo kaifiyat hai, woh aapko dikhne lag jaayegi.',
      ru_steps: [
        'Hazrat ke pir ne unse poocha: “Baba, tumhein mera tasawwur aata hai?” Unhon ne kaha: “Ji nahin, nahin aata.”',
        'Pir ne farmaya: “Achha, aisa karo Baba: Ya Khallaqu, Ya Fa’’alu, Ya Musawwiru padho. Tasawwur mein mujh ko dekho.” (Musawwir tasveer se hai.)',
        'Hazrat ne apne khayal mein apne pir ka tasawwur kiya aur unke andar dekh rahe the, to kashf khul gaya: “Isi ne meri aankhein kholin. Mujhe kitaabein padhne ki zaroorat nahin padi.”'
      ],
      ru_q: 'Yeh Hazrat ke apne pir ne unko sikhaaya tha. Aisa amal apne shaykh se lijiye.',
      d: 'Whichever elder you hold in your thought, the states that are in that elder’s blessed chest will begin to appear to you.',
      steps: [
        'Hazrat’s pir asked him: “Baba, does my tasawwur come to you?” He said: “No, it does not.”',
        'His pir said: “Then do this, Baba: read Ya Khallaqu, Ya Fa’’alu, Ya Musawwiru. Look at me in your tasawwur.” (Musawwir comes from tasveer, image.)',
        'Hazrat held his pir in his thought and was looking within him, and kashf opened for him: “This is what opened my eyes. I did not need to read books.”'
      ],
      ar: [{ ar: 'يَا خَلَّاقُ يَا فَعَّالُ يَا مُصَوِّرُ', tr: 'Ya Khallaqu, Ya Fa’’alu, Ya Musawwiru.', mn: 'O Great Creator, O Doer of all He wills, O Fashioner of forms.', ru_mn: 'Ae bahut paida karne wale, ae jo chaahe karne wale, ae sooratein banaane wale.' }],
      q: 'This is what Hazrat’s own pir taught him. Take such a practice from your own shaykh.',
      shorts: [{ id: 'sdcWOMEVUDI', title: 'Tasawwur-e-Shaykh: Hold Your Shaykh in Your Heart' }, { id: '4ZpXrUzIlJw', title: 'What Opened My Eyes' }, { id: 'dyHUfOLlVTs', title: 'Hold My Picture in Your Heart' }] },
    { slug: 'one-point', t: 'One point: where will you find Tawheed?', ur: 'یکسوئی',
      ru_t: 'Ek nukta: Tauheed kahaan milegi?', ru_d: 'Ek taraf sochne ke bajaaye hum har cheez ke baare mein sochte hain. Murad ko kab pahunchoge? Tauheed kahaan milegi? Tauheed ek hai: Allah ek hai.',
      ru_steps: [
        'Idhar udhar mat dekho: Allah ki taraf, Uski sifaat ki taraf tawajjoh do.',
        'Rang-birang ki ghiza mat khao: “rang-birang ki ghiza khayalaat mein napaaki laati hai.”',
        'Jab dil ek nukte par qaayam ho jaayega, haqeeqat saamne aa jaayegi.'
      ],
      d: 'Instead of thinking in one direction, we think about everything. When will you reach your goal (Murad)? Where will you find Tawheed? Tawheed is one: Allah is one.',
      steps: [
        'Do not look here and there: pay attention to Allah, to His attributes.',
        'Do not eat many kinds of food: “many-coloured food brings impurity into the thoughts.”',
        'When the heart is fixed on one point, the reality will come before you.'
      ],
      shorts: [{ id: 'iZVgwvJvp1Y', title: 'Where Will You Find Tawheed?' }] },
    { slug: 'asl-e-wujood', t: 'Recognise Him in every form', ur: 'اصلِ وجود',
      ru_t: 'Har soorat mein Usko pehchaano', ru_d: 'Yeh bahut bade logon ka maamla hai: bahut ooncha maqaam hai, maamooli cheez nahin, aur har aadmi isko samajh nahin sakta.',
      ru_steps: [
        'Jab khatra aaye to bade log yeh kehte hain: “Achha, aap tashreef laaye. Aap sooratein badal badal kar aaye, to kya? Main zaroor aapko pehchaanta hoon. Asl-e-wujood Aap hain.”',
        'Asl-e-wujood, yaani asal wujood, sirf Allah ka hai: kisi cheez ka apna wujood nahin, aur wohi wujood se sarfaraaz karta hai.',
        'Bol kar khaamosh ho jaate hain: “Haan, samajh gaya; main imtihaan mein kaamyaab ho gaya.”'
      ],
      ru_q: 'Hazrat ki rubai: “Tu dar har shaan ba-kamaali… jis rang mein aao, kuch nahin hai parwa; is naaz-o-ada se tumko pehchaanta hoon”: Tu har shaan mein kaamil hai; jis rang mein bhi aaye, koi parwa nahin; main Tujhe isi naaz-o-ada se pehchaanta hoon.',
      d: 'This is the matter of very great people: it belongs to a very high station, it is no ordinary thing, and not every person can understand it.',
      steps: [
        'When a khatra comes, the great ones say: “Very well, you have come. You came in changing forms: so what? I certainly recognise you. The real existence is You.”',
        'Asl-e-wujood, the real existence, is Allah’s alone: nothing has an existence of its own, and it is He who grants the honour of existence.',
        'They say it and fall silent: “Yes, I have understood; I have passed my test.”'
      ],
      q: 'Hazrat’s rubai: “Tu dar har shaan ba-kamaali… jis rang mein aao, kuch nahin hai parwa; is naaz-o-ada se tumko pehchanta hoon”: You are perfect in every state; in whatever colour You come, it does not matter; I recognise You by this grace.',
      shorts: [{ id: 'EzydokzUOyg', title: 'I Recognise You in Every Form' }] }
  ];
  var BAYAH_NOTE = 'These meditations bring their benefit after you have taken Bay’ah, under the guidance of your Shaykh or his Khalifa.';
  var BAYAH_NOTE_RU = 'Yeh muraqabaat Bai’at lene ke baad, apne Shaykh ya unke Khalifa ki rehnumai mein faayda dete hain.';

  var css = doc.createElement('style');
  css.textContent =
    '.md-hero{background:linear-gradient(135deg,var(--teal),#0f3a33);color:#f5f1e2;border-radius:16px;padding:16px;margin-bottom:12px}.md-hero b{font-size:19px}.md-hero p{margin:6px 0 0;font-size:13.5px;line-height:1.55;opacity:.93}.md-hero .ur{font-family:"Noto Nastaliq Urdu",Amiri,serif;font-size:17px;line-height:2.1;direction:rtl;text-align:right;margin-top:4px;color:var(--gold-soft)}' +
    '.md-bay{background:#fbf3dc;border:1px solid var(--gold);border-radius:14px;padding:12px 14px;margin-bottom:12px;color:var(--ink)}.md-bay p{margin:0;font-size:14px;line-height:1.55;font-weight:600}.md-bay .ur{font-family:"Noto Nastaliq Urdu",Amiri,serif;font-size:15px;line-height:2.1;direction:rtl;text-align:right;margin-top:6px;color:var(--teal)}' +
    '.md-bay .go{display:inline-block;margin-top:10px;background:var(--teal);color:#fff;border:0;border-radius:10px;padding:9px 14px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}' +
    '.md-card{background:var(--panel);border:1px solid var(--line);border-radius:16px;margin-bottom:12px;overflow:hidden}.md-pic{position:relative;background:#0f3a33;aspect-ratio:4/5}.md-pic img{display:block;width:100%;height:100%;object-fit:cover}' +
    '.md-n{position:absolute;left:12px;top:12px;width:30px;height:30px;border-radius:50%;background:var(--teal);color:#fff;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 6px rgba(0,0,0,.35)}' +
    '.md-tx{padding:12px 14px 14px}.md-tx h3{margin:0;font-size:17px;color:var(--ink)}.md-tx .ur{font-family:"Noto Nastaliq Urdu",Amiri,serif;font-size:18px;line-height:2;direction:rtl;text-align:right;color:var(--teal);margin:2px 0 4px}' +
    '.md-tx p{margin:0 0 8px;font-size:14px;line-height:1.6;color:var(--ink)}.md-tx h4{margin:10px 0 6px;font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:var(--gold)}' +
    '.md-tx ol{margin:0 0 6px;padding-left:20px}.md-tx li{font-size:14px;line-height:1.6;color:var(--ink);margin-bottom:5px}.md-tx .q{border-left:3px solid var(--gold);padding:2px 0 2px 10px;color:var(--muted);font-style:italic;margin-top:8px}' +
    '.md-ar{font-family:Amiri,"Scheherazade New",serif;font-size:22px;line-height:1.9;direction:rtl;text-align:center;color:var(--teal);margin:8px 0 2px}.md-tr{font-size:13px;text-align:center;color:var(--ink);font-style:italic;margin-bottom:2px}.md-mn{font-size:12.5px;color:var(--muted);text-align:center;line-height:1.5;margin-bottom:6px}' +
    '.md-idx{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:12px 14px;margin-bottom:14px}.md-idx>b{font-size:17px;color:var(--ink)}.md-ig{margin-top:10px}.md-idx .md-igt{margin-bottom:6px}.md-igt{font-size:12.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--gold);font-weight:700;margin-bottom:4px}.md-igt span{font-family:"Noto Nastaliq Urdu",Amiri,serif;text-transform:none;letter-spacing:0;font-weight:400;margin-left:6px}' +
    '.md-il{display:flex;align-items:center;gap:10px;padding:8px 2px;border-top:1px solid var(--line);font-size:14.5px;color:var(--ink);cursor:pointer;text-decoration:none}.md-in{flex:none;width:24px;height:24px;border-radius:50%;background:var(--teal);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}.md-it{flex:1}.md-ch{color:var(--muted);font-size:20px;margin-left:6px}.md-toidx{display:block;width:100%;margin:4px 0 16px;background:var(--teal);color:#fff;border:0;border-radius:12px;padding:12px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit}.md-iu{margin-left:auto;font-family:"Noto Nastaliq Urdu",Amiri,serif;font-size:14px;color:var(--teal);direction:rtl}' +
    '.md-gh{margin:18px 0 10px;scroll-margin-top:70px}.md-card{scroll-margin-top:70px}' +
    '.md-src{font-size:11.5px;color:var(--muted);line-height:1.5;margin:6px 2px 14px}';
  doc.head.appendChild(css);

  var s = N.el('div', 'screen', '<div class="subhead"><div class="backbtn" id="mdBack">←</div><div class="subtitle">Mystic Meditations</div></div><div id="mdBody"></div>');
  s.id = 'screen-meditations'; doc.querySelector('.screens').appendChild(s);
  s.querySelector('#mdBack').addEventListener('click', function () { if (cur) { open(''); } else { N.backTab(); } });
  var body = s.querySelector('#mdBody');

  function bayBox(F) {
    return '<div class="md-bay"><p>🤝 ' + esc(T(BAYAH_NOTE, BAYAH_NOTE_RU)) + '</p>' + (F && F.BAYAH_UR ? '<div class="ur" lang="ur">' + esc(F.BAYAH_UR) + '</div>' : '') +
      '<button type="button" class="go md-tobay">' + T('🫱 How to take Bay’ah', '🫱 Bai’at kaise lein') + '</button></div>';
  }
  function card(c, n, F) {
    var ru = N.lang && N.lang() === 'ru', steps = ru && c.ru_steps ? c.ru_steps : c.steps;
    var h = '<div class="md-card" id="md-' + c.slug + '"><div class="md-pic"><img loading="lazy" width="720" height="900" alt="' + esc(T(c.t, c.ru_t)) + '" src="photos/meditations/' + c.slug + '.jpg">' +
      (n ? '<span class="md-n">' + n + '</span>' : '') + '</div><div class="md-tx"><h3>' + esc(T(c.t, c.ru_t)) + '</h3><div class="ur" lang="ur">' + esc(c.ur) + '</div><p>' + esc(T(c.d, c.ru_d)) + '</p>' +
      '<h4>' + esc(c.head ? T(c.head, c.ru_head) : T('How Hazrat taught it', 'Hazrat ne kaise sikhaaya')) + '</h4><ol>' + steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>';
    (c.ar || []).forEach(function (a) { var mn = T(a.mn, a.ru_mn); h += '<div class="md-ar" lang="ar">' + esc(a.ar) + '</div>' + (a.tr ? '<div class="md-tr">' + esc(a.tr) + '</div>' : '') + (mn ? '<div class="md-mn">' + esc(mn) + '</div>' : ''); });
    if (c.q) h += '<p class="q">' + esc(T(c.q, c.ru_q)) + '</p>';
    if (c.shorts && c.shorts.length && F && F.shortsGrid) h += '<h4>' + T('Watch Hazrat explain it', 'Hazrat ki zabaani dekhiye') + '</h4>' + F.shortsGrid(c.shorts);
    return h + '</div></div>';
  }
  // the index: groups of meditations, and more practices Hazrat teaches in other Shorts (published, for murids)
  var GROUPS = [
    { t: 'Driving away khatrat', ru_t: 'Khatrat ko door karna', ur: 'خطرات کو دور کرنا', slugs: ['khatrat', 'good-thoughts', 'yaad-faramosh', 'change-state', 'run-from-it', 'imagine-it-leaving', 'refuge', 'hoon-hoon', 'new-creation'] },
    { t: 'Guarding the gaze', ru_t: 'Nazar ki hifaazat', ur: 'نظر کی حفاظت', slugs: ['nazar-bar-qadam', 'khalwat-dar-anjuman', 'guard-the-gaze'] },
    { t: 'Tasawwur and Tawheed', ru_t: 'Tasawwur aur Tauheed', ur: 'تصور اور توحید', slugs: ['tasawwur-e-shaykh', 'one-point', 'asl-e-wujood'] }
  ];
  var MORE = [
    { id: 'dyHUfOLlVTs', title: 'Tasawwur-e-Shaykh: Hold My Picture in Your Heart' },
    { id: '3githsE0o6Y', title: 'You Have Become My Teacher' },
    { id: 'oWZt1YfJ3io', title: 'Eat Less, Sleep Less, Speak Less' },
    { id: 'mwPT8CFRfR0', title: 'Sabr, Tasleem, Raza' },
    { id: 'EIcNQnQ_TkQ', title: 'Istikhara: Ask Allah First' },
    { id: 'KCmXwBTioD4', title: 'Two Rakats Better Than a Hundred' }
  ];
  function topicOf(sl) {
    if (sl.indexOf('v-') === 0) { var v = MORE.filter(function (x) { return 'v-' + x.id === sl; })[0]; return v ? { video: v } : null; }
    var all = [INTRO].concat(CARDS); for (var k = 0; k < all.length; k++) if (all[k].slug === sl) return { card: all[k], n: CARDS.indexOf(all[k]) + 1 };
    return null;
  }
  function row(sl, n, t, ur) {
    return '<a class="md-il" data-topic="' + esc(sl) + '"><span class="md-in">' + n + '</span><span class="md-it">' + esc(t) + '</span>' + (ur ? '<span class="md-iu" lang="ur">' + esc(ur) + '</span>' : '') + '<span class="md-ch">›</span></a>';
  }
  function indexBox() {
    var all = [INTRO].concat(CARDS), num = {}; CARDS.forEach(function (c, i) { num[c.slug] = i + 1; });
    var h = '';
    GROUPS.forEach(function (g) {
      h += '<div class="md-idx"><div class="md-igt">' + esc(T(g.t, g.ru_t)) + ' <span lang="ur">' + esc(g.ur) + '</span></div>';
      g.slugs.forEach(function (sl) { var c = all.filter(function (x) { return x.slug === sl; })[0]; if (c) h += row(sl, num[sl] || '•', T(c.t, c.ru_t), c.ur); });
      h += '</div>';
    });
    h += '<div class="md-idx"><div class="md-igt">' + T('More practices', 'Mazeed a’maal') + ' <span lang="ur">مزید اعمال</span></div>';
    MORE.forEach(function (v) { h += row('v-' + v.id, '▶', v.title, ''); });
    return h + '</div>';
  }
  var cur = '';   // '' = the index; otherwise the open topic
  function paintIndex() {
    var F = root.NoorFamily, h = sw();
    h += '<div class="md-hero"><b>Mystic Meditations</b><div class="ur" lang="ur">مراقبات</div><p>' + T('Muraqabat: the ways Hazrat Azam Pasha R.A. taught to drive away khatrat, the passing thoughts, and to keep the heart turned to Allah. Choose a topic.',
      'Muraqabat: woh tareeqe jo Hazrat Azam Pasha R.A. ne khatrat, yaani guzarte khayalaat, ko door karne aur dil ko Allah ki taraf lagaaye rakhne ke liye sikhaaye. Koi topic chuniye.') + '</p></div>';
    h += bayBox(F) + indexBox();
    h += '<div class="md-src">' + T('From Hazrat Azam Pasha R.A.’s dars. These are his teachings as he gave them, not fatwas: follow what your shaykh teaches.', 'Hazrat Azam Pasha R.A. ke dars se. Yeh unki ta’leemaat hain jaise unhon ne di thin, fatwe nahin: jo aapke shaykh sikhaayein, usi par chaliye.') + '</div>';
    body.innerHTML = h; s.querySelector('.subtitle').textContent = 'Mystic Meditations';
  }
  function paintTopic(sl) {
    var F = root.NoorFamily, tp = topicOf(sl), h = ''; if (!tp) { cur = ''; return paintIndex(); }
    h += sw() + bayBox(F);
    if (tp.card) {
      h += card(tp.card, tp.n, F);
      if (!(tp.card.shorts && tp.card.shorts.length)) h += '<div class="md-src">' + T('Hazrat’s highlight on this practice will appear here soon.', 'Is amal par Hazrat ki highlight jald yahaan aayegi.') + '</div>';
    } else {
      h += '<h2 class="section-title" style="margin-top:4px">' + esc(tp.video.title) + '</h2>' + (F && F.shortsGrid ? F.shortsGrid([tp.video]) : '') +
        '<div class="md-src">' + T('A practice Hazrat Azam Pasha R.A. teaches in this highlight. Practice highlights open for members who have taken Bay’ah.', 'Yeh amal Hazrat Azam Pasha R.A. is highlight mein sikhaate hain. Amal ki highlights un members ke liye khulti hain jinhon ne Bai’at li hai.') + '</div>';
    }
    h += '<button type="button" class="go md-toidx">' + T('☰ All meditations', '☰ Saare muraqabaat') + '</button>';
    body.innerHTML = h; s.querySelector('.subtitle').textContent = tp.card ? T(tp.card.t, tp.card.ru_t) : T('Practice', 'Amal');
    root.scrollTo(0, 0); var sc = doc.querySelector('.screens'); if (sc) sc.scrollTop = 0;
  }
  function paint() { if (cur) paintTopic(cur); else paintIndex(); }
  function open(sl) { cur = sl || ''; paint(); }
  body.addEventListener('click', function (e) {
    var c = e.target.closest ? e.target : null; if (!c) return;
    if (c.closest('.md-tobay')) { N.route('bayah'); return; }
    if (c.closest('.md-toidx')) { open(''); return; }
    var il = c.closest('.md-il'); if (il) { open(il.getAttribute('data-topic')); return; }
    var th = c.closest('.fm-sth'); if (th && root.NoorFamily) root.NoorFamily.playShort(th);
  });
  N.onScreen(function (id) { if (id === 'meditations') paint(); });
  root.addEventListener('noorlang', function () { if (s.classList.contains('active')) paint(); });   // language switched (js/lang.js)
  root.NoorMeditations = { ready: true, cards: CARDS, open: open };
})(typeof self !== 'undefined' ? self : this);
