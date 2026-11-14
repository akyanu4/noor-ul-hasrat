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
    d: 'A khatra is what comes and goes. A bad thought came, or a good thought came, and it left.',
    steps: [
      'When you make a firm intention about something, it is no longer a khatra; it becomes ‘azm, a resolve. Good or bad, this can happen with both.',
      'A khatra is forgiven, but the resolve is not. If a bad thought comes and we resolve on it, we become sinners; if a good thought comes and we resolve on it, we are given its guidance.',
      'Good and bad thoughts come and go from morning to evening; no one is held to account for them.',
      'For daf’-e-khatrat, driving away passing thoughts, the book gives “tried and tested” (mujarrab) methods: they are below.'
    ],
    shorts: []
  };
  var CARDS = [
    { slug: 'good-thoughts', t: 'Turn the thought into du’a', ur: 'اچھے خیالات کی دعا',
      d: 'Whatever useless thought comes at the wrong time, ask Allah for that same thought in its positive form.',
      steps: [
        'Leave the useless thought that is coming, and ask Allah for the good thoughts we need.',
        'Say: “O Master, we are waiting for Your grace. Take away these useless thoughts, and give us good thoughts.”',
        'Pray to be saved from bad thoughts, because it is Allah’s command: ask of Me, I will give to you.',
        'Du’a is the core of worship: the worship we do is completed by du’a.'
      ],
      ar: [
        { ar: 'ٱدْعُونِيٓ أَسْتَجِبْ لَكُمْ', tr: 'Ud‘uni astajib lakum.', mn: 'Call upon Me; I will answer you. (Surah Ghafir 40:60)' },
        { ar: 'اَلدُّعَاءُ مُخُّ الْعِبَادَةِ', tr: 'Ad-du‘a mukhkh al-‘ibadah.', mn: 'Du’a is the core of worship. (Hadith)' }
      ],
      shorts: [] },
    { slug: 'yaad-faramosh', t: 'The pact of remembrance', ur: 'یاد فراموش',
      d: 'A pact made among companions so that the remembrance of Allah goes on and is never forgotten, even while they sit together, talk and go about their work.',
      steps: [
        'Agree on it among yourselves; then sit together, talk and go about your work.',
        'One of you calls out: “Allah!”',
        'Whoever’s heart was present answers “Alhamdulillah”. Whoever had become heedless and forgotten answers “Astaghfirullah”: O my Allah, forgive me.',
        'Through this pact one gets help toward constant presence, one admits one’s own mistake, and the work becomes lillah, fillah: for the sake of Allah, and in Allah.'
      ],
      ar: [{ ar: 'اَللّٰه ۔ اَلْحَمْدُ لِلّٰهِ ۔ أَسْتَغْفِرُ اللّٰهَ', tr: 'Allah! · Alhamdulillah · Astaghfirullah', mn: 'The call; the answer of the heart that was present; the answer of the heart that had forgotten.' }],
      shorts: [] },
    { slug: 'change-state', t: 'Change your state', ur: 'حالت بدلنا',
      d: 'When khatrat come in great numbers, change your state. The root principle here is movement.',
      steps: [
        'If you are sitting, stand up; if standing, walk; or sit down.',
        'As soon as we move, the khatrat are driven away.',
        'We sit and sit and they do not leave; the moment we stand up and change our state, the khatrat vanish.'
      ],
      shorts: [] },
    { slug: 'run-from-it', t: 'Run from the thought', ur: 'خطرہ سے بھاگنا',
      d: 'When a khatra comes into your heart, into your thoughts, run from it.',
      steps: [
        'As soon as it comes, drive yourself away from it: leave it behind, and run.',
        'In a little while the thought will be left behind; you will get out and be freed from it.',
        'We who were captives of the thought get out of that captivity.'
      ],
      shorts: [] },
    { slug: 'imagine-it-leaving', t: 'See the thought running away', ur: 'عالمِ تخیل',
      d: 'Or imagine, in the world of imagination (aalam-e-takhayyul), that the thought is running away from you: this too removes it.',
      steps: [
        'When the khatra comes, think: “This thought is running from me.”',
        'Aalam-e-takhayyul means the world of imagination, of thought. By this too the khatra is removed.'
      ],
      shorts: [] },
    { slug: 'refuge', t: 'Come into Allah’s refuge', ur: 'اللہ کی پناہ',
      d: 'When the khatrat keep coming, come into the refuge of Allah and ask for His help.',
      steps: [
        'Say: “Allah Mian, these khatrat keep coming, so many. Please help me and take my khatrat away. I want to come into Your refuge.”',
        'When a khatra comes, say: “If these trouble us, where else will we find refuge? Save us from these khatrat; take us into Your refuge.”',
        'Even great people are troubled by khatrat: the Awliya Allah too come into Allah’s refuge, and adopt these methods.'
      ],
      shorts: [] },
    { slug: 'hoon-hoon', t: 'Breathe out: “hoon, hoon”', ur: 'ہوں ہوں',
      d: 'One of the tried and tested methods for driving away khatrat, done with the breath.',
      steps: [
        'Saying “hoon, hoon”, breathe out forcefully, outward.',
        'Hoon… hoon… hoon… hoon: “that is what to do.”'
      ],
      shorts: [] },
    { slug: 'new-creation', t: 'Recite the verse', ur: 'آیت کی تلاوت',
      d: 'By reciting this verse too, khatrat lessen.',
      steps: [
        'When khatrat come, recite the verse.',
        'Its meaning: if He wills, He will take you away and bring a new creation; and that is not difficult for Allah.'
      ],
      ar: [{ ar: 'إِن يَشَأْ يُذْهِبْكُمْ وَيَأْتِ بِخَلْقٍ جَدِيدٍ ۝ وَمَا ذٰلِكَ عَلَى اللّٰهِ بِعَزِيزٍ', tr: 'In yasha’ yudhhibkum wa ya’ti bi-khalqin jadid, wa ma dhalika ‘ala-llahi bi-‘aziz.',
        mn: 'If He wills, He will take you away and bring a new creation; and that is not difficult for Allah. (Surah Fatir 35:16-17; the same words are in Surah Ibrahim 14:19-20)' }],
      shorts: [] },
    { slug: 'nazar-bar-qadam', t: 'Gaze on your steps', ur: 'نظر بر قدم',
      d: 'In driving away khatrat there is one important principle: nazar bar qadam, keep your gaze on your feet, on your steps.',
      steps: [
        'Always keep your gaze lowered; do not look here and there.',
        'There is great attraction in the human face: whoever you look at, his face comes into your heart through your eyes.',
        'If you keep looking all around, your heart will be scattered.'
      ],
      shorts: [] },
    { slug: 'khalwat-dar-anjuman', t: 'Solitude in the crowd', ur: 'خلوت در انجمن',
      d: 'Khalwat dar anjuman: even in the middle of people, keep your attention in your heart.',
      steps: [
        'Keep your attention in your heart. The gathering is within our own heart.',
        'Together with it, keep your gaze on your steps (nazar bar qadam) and your eyes lowered.'
      ],
      shorts: [] },
    { slug: 'guard-the-gaze', t: 'Guard your gaze', ur: 'حفاظتِ نظر',
      d: 'The practical teaching: for a few days, guard your gaze, and protect yourself from the gaze of others.',
      steps: [
        '“These eyes are great hunters.” The red threads in the eyes are a net that has been spread: a bird that sits in a net is caught in it.',
        'For a few days guard your gaze: we do not meet anyone’s eyes; we keep our gaze lowered.',
        'When the heart is fixed on one point, the reality will come before you, and we will come to know it.'
      ],
      q: '“Laal dore hain band-e-pa-e-nazar, sayd karti hain yaar ki aankhen”: the red threads are fetters on the feet of the gaze; the Beloved’s eyes go hunting. Who is the Beloved? Allah.',
      shorts: [] },
    { slug: 'tasawwur-e-shaykh', t: 'Holding the shaykh in your thought', ur: 'تصورِ شیخ',
      d: 'Whichever elder you hold in your thought, the states that are in that elder’s blessed chest will begin to appear to you.',
      steps: [
        'Hazrat’s pir asked him: “Baba, does my tasawwur come to you?” He said: “No, it does not.”',
        'His pir said: “Then do this, Baba: read Ya Khallaqu, Ya Fa’’alu, Ya Musawwiru. Look at me in your tasawwur.” (Musawwir comes from tasveer, image.)',
        'Hazrat held his pir in his thought and was looking within him, and kashf opened for him: “This is what opened my eyes. I did not need to read books.”'
      ],
      ar: [{ ar: 'يَا خَلَّاقُ يَا فَعَّالُ يَا مُصَوِّرُ', tr: 'Ya Khallaqu, Ya Fa’’alu, Ya Musawwiru.', mn: 'O Great Creator, O Doer of all He wills, O Fashioner of forms.' }],
      q: 'This is what Hazrat’s own pir taught him. Take such a practice from your own shaykh.',
      shorts: [] },
    { slug: 'one-point', t: 'One point: where will you find Tawheed?', ur: 'یکسوئی',
      d: 'Instead of thinking in one direction, we think about everything. When will you reach your goal (Murad)? Where will you find Tawheed? Tawheed is one: Allah is one.',
      steps: [
        'Do not look here and there: pay attention to Allah, to His attributes.',
        'Do not eat many kinds of food: “many-coloured food brings impurity into the thoughts.”',
        'When the heart is fixed on one point, the reality will come before you.'
      ],
      shorts: [] },
    { slug: 'asl-e-wujood', t: 'Recognise Him in every form', ur: 'اصلِ وجود',
      d: 'This is the matter of very great people: it belongs to a very high station, it is no ordinary thing, and not every person can understand it.',
      steps: [
        'When a khatra comes, the great ones say: “Very well, you have come. You came in changing forms: so what? I certainly recognise you. The real existence is You.”',
        'Asl-e-wujood, the real existence, is Allah’s alone: nothing has an existence of its own, and it is He who grants the honour of existence.',
        'They say it and fall silent: “Yes, I have understood; I have passed my test.”'
      ],
      q: 'Hazrat’s rubai: “Tu dar har shaan ba-kamaali… jis rang mein aao, kuch nahin hai parwa; is naaz-o-ada se tumko pehchanta hoon”: You are perfect in every state; in whatever colour You come, it does not matter; I recognise You by this grace.',
      shorts: [] }
  ];
  var BAYAH_NOTE = 'These meditations bring their benefit after you have taken Bay’ah, under the guidance of your Shaykh or his Khalifa.';

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
    '.md-src{font-size:11.5px;color:var(--muted);line-height:1.5;margin:6px 2px 14px}';
  doc.head.appendChild(css);

  var s = N.el('div', 'screen', '<div class="subhead"><div class="backbtn" id="mdBack">←</div><div class="subtitle">Mystic Meditations</div></div><div id="mdBody"></div>');
  s.id = 'screen-meditations'; doc.querySelector('.screens').appendChild(s);
  s.querySelector('#mdBack').addEventListener('click', function () { N.backTab(); });
  var body = s.querySelector('#mdBody');

  function bayBox(F) {
    return '<div class="md-bay"><p>🤝 ' + esc(BAYAH_NOTE) + '</p>' + (F && F.BAYAH_UR ? '<div class="ur" lang="ur">' + esc(F.BAYAH_UR) + '</div>' : '') +
      '<button type="button" class="go md-tobay">🫱 How to take Bay’ah</button></div>';
  }
  function card(c, n, F) {
    var h = '<div class="md-card" id="md-' + c.slug + '"><div class="md-pic"><img loading="lazy" width="720" height="900" alt="' + esc(c.t) + '" src="photos/meditations/' + c.slug + '.jpg">' +
      (n ? '<span class="md-n">' + n + '</span>' : '') + '</div><div class="md-tx"><h3>' + esc(c.t) + '</h3><div class="ur" lang="ur">' + esc(c.ur) + '</div><p>' + esc(c.d) + '</p>' +
      '<h4>' + esc(c.head || 'How Hazrat taught it') + '</h4><ol>' + c.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>';
    (c.ar || []).forEach(function (a) { h += '<div class="md-ar" lang="ar">' + esc(a.ar) + '</div>' + (a.tr ? '<div class="md-tr">' + esc(a.tr) + '</div>' : '') + (a.mn ? '<div class="md-mn">' + esc(a.mn) + '</div>' : ''); });
    if (c.q) h += '<p class="q">' + esc(c.q) + '</p>';
    if (c.shorts && c.shorts.length && F && F.shortsGrid) h += F.shortsGrid(c.shorts);
    return h + '</div></div>';
  }
  function paint() {
    var F = root.NoorFamily, h = '';
    h += '<div class="md-hero"><b>Mystic Meditations</b><div class="ur" lang="ur">مراقبات</div><p>Muraqabat: the ways Hazrat Azam Pasha R.A. taught to drive away khatrat, the passing thoughts, and to keep the heart turned to Allah.</p></div>';
    h += bayBox(F);
    h += card(INTRO, 0, F);
    CARDS.forEach(function (c, i) { h += card(c, i + 1, F); });
    h += bayBox(F);
    h += '<div class="md-src">From Hazrat Azam Pasha R.A.’s dars Nizam-ul-Amal-e-Fuqara (parts 6 and 7). These are his teachings as he gave them, not fatwas: follow what your shaykh teaches.</div>';
    body.innerHTML = h;
  }
  body.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.md-tobay')) { N.route('bayah'); return; }
    var th = e.target.closest && e.target.closest('.fm-sth'); if (th && root.NoorFamily) root.NoorFamily.playShort(th);
  });
  N.onScreen(function (id) { if (id === 'meditations') paint(); });
  root.NoorMeditations = { ready: true, cards: CARDS };
})(typeof self !== 'undefined' ? self : this);
