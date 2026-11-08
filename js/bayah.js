/* Noor: "Taking Bai'at", the steps in Hazrat Azam Pasha R.A.'s own words (Haqeeqat-e-Bai'at dars), with simple drawings.
   DRAFT for review: the screen exists only when config.js has bayahOn: true, or on a phone opened once with ?bayah=1. */
(function (root) {
  'use strict';
  var N = root.Noor, doc = root.document, cfg = root.NOOR_CONFIG || {};
  if (!N || !doc) return;
  var preview = false;
  try {
    if (/[?&]bayah=1/.test(root.location.search || '')) { localStorage.setItem('noor_bayah_preview', '1'); root.history.replaceState(null, '', root.location.pathname); setTimeout(function () { N.route('bayah'); }, 400); }
    preview = localStorage.getItem('noor_bayah_preview') === '1';
  } catch (e) {}
  if (!cfg.bayahOn && !preview) return;
  var esc = N.esc;

  // ---- drawings (no faces): gold lines on a soft teal card
  var G = '#c9a24b', T = '#0f3d3e', S = '#e7d4a3';
  function svg(inner) { return '<svg viewBox="0 0 160 110" role="img" aria-hidden="true"><defs><radialGradient id="bgl" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#fff6dc" stop-opacity=".9"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></radialGradient></defs>' + inner + '</svg>'; }
  var HAND = function (x, y, s, rot, fill) {   // an open palm, fingers up
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + s + ')"><path d="M-14 22 C-16 10 -16 2 -14 -6 L-13 -22 C-13 -27 -7 -27 -7 -22 L-7 -6 L-6 -30 C-6 -35 0 -35 0 -30 L0 -6 L1 -28 C1 -33 7 -33 7 -28 L7 -5 L8 -22 C8 -27 14 -27 14 -22 L14 4 L19 -6 C21 -11 27 -9 25 -3 L17 16 C14 24 8 28 0 28 L-6 28 C-10 28 -13 26 -14 22 Z" fill="' + (fill || S) + '" stroke="' + T + '" stroke-width="2" stroke-linejoin="round"/></g>';
  };
  var ART = {
    look: svg('<circle cx="80" cy="50" r="46" fill="url(#bgl)"/><path d="M20 100 Q60 70 80 70 T140 100" fill="none" stroke="' + G + '" stroke-width="3" stroke-dasharray="6 6"/>' +
      '<path d="M100 74 V44 Q100 26 116 20 Q132 26 132 44 V74 Z" fill="' + T + '"/><path d="M107 74 V50 Q107 38 116 34 Q125 38 125 50 V74 Z" fill="#f4d98a"/><circle cx="116" cy="12" r="3" fill="' + G + '"/>' +
      '<circle cx="50" cy="44" r="18" fill="#fff" fill-opacity=".5" stroke="' + T + '" stroke-width="4"/><path d="M63 57 L78 72" stroke="' + T + '" stroke-width="7" stroke-linecap="round"/>'),
    heart: svg('<circle cx="80" cy="52" r="48" fill="url(#bgl)"/><path d="M80 92 C40 66 34 42 50 30 C62 21 76 28 80 38 C84 28 98 21 110 30 C126 42 120 66 80 92 Z" fill="' + T + '"/><path d="M80 80 C55 62 52 46 60 40 C67 35 75 39 78 46" fill="none" stroke="' + G + '" stroke-width="3" stroke-linecap="round"/>' +
      [[80, 14], [52, 20], [108, 20], [36, 40], [124, 40]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.6" fill="' + G + '"/>'; }).join('')),
    tasbeeh: svg('<circle cx="80" cy="50" r="46" fill="url(#bgl)"/>' + (function () { var h = ''; for (var i = 0; i < 33; i++) { var a = i / 33 * Math.PI * 2 - Math.PI / 2, x = 80 + Math.cos(a) * 34, y = 48 + Math.sin(a) * 30; h += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="4.2" fill="' + (i % 11 === 0 ? G : T) + '"/>'; } return h; })() +
      '<path d="M80 78 L80 96" stroke="' + T + '" stroke-width="3"/><path d="M74 96 L86 96 L82 106 L78 106 Z" fill="' + G + '"/>'),
    hands: svg('<circle cx="80" cy="40" r="44" fill="url(#bgl)"/><path d="M80 6 L80 22 M66 10 L72 24 M94 10 L88 24" stroke="' + G + '" stroke-width="2.5" stroke-linecap="round"/>' +
      HAND(64, 70, 1.15, 62, '#e9cfa0') + HAND(96, 66, 1.15, -62, S) + '<path d="M30 104 Q80 92 130 104" fill="none" stroke="' + G + '" stroke-width="2"/>'),
    cloth: svg('<circle cx="80" cy="50" r="46" fill="url(#bgl)"/><path d="M28 40 Q80 58 132 40 L132 50 Q80 70 28 50 Z" fill="' + G + '" opacity=".85"/><path d="M28 40 Q80 58 132 40" fill="none" stroke="' + T + '" stroke-width="1.5"/>' +
      HAND(22, 58, 0.75, 20, '#e9cfa0') + HAND(138, 58, 0.75, -20, S) +
      '<ellipse cx="80" cy="94" rx="28" ry="7" fill="' + T + '" opacity=".25"/><path d="M54 88 Q80 104 106 88" fill="none" stroke="' + T + '" stroke-width="2.5"/>'),
    pledge: svg('<circle cx="80" cy="50" r="46" fill="url(#bgl)"/><rect x="44" y="18" width="72" height="74" rx="6" fill="#fffaf0" stroke="' + T + '" stroke-width="2.5"/>' +
      [32, 42, 52, 62].map(function (y, i) { return '<path d="M54 ' + y + ' H' + (i === 3 ? 90 : 106) + '" stroke="' + T + '" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>'; }).join('') +
      '<circle cx="100" cy="78" r="9" fill="' + G + '"/><path d="M96 78 l3 3 l6 -6" fill="none" stroke="#fff" stroke-width="2.4"/>'),
    dua: svg('<circle cx="80" cy="44" r="46" fill="url(#bgl)"/>' + HAND(62, 62, 1.05, -14, '#e9cfa0') + HAND(98, 62, 1.05, 14, S) +
      '<path d="M80 6 v10 M70 10 l4 8 M90 10 l-4 8" stroke="' + G + '" stroke-width="2.5" stroke-linecap="round"/><path d="M40 104 H120" stroke="' + G + '" stroke-width="2"/>'),
    rope: svg('<circle cx="80" cy="30" r="40" fill="url(#bgl)"/><path d="M80 0 C74 20 86 34 80 52 C74 70 86 82 80 104" fill="none" stroke="' + G + '" stroke-width="5" stroke-linecap="round"/><path d="M80 0 C74 20 86 34 80 52 C74 70 86 82 80 104" fill="none" stroke="#fff4cf" stroke-width="1.5" stroke-dasharray="3 5"/>' +
      HAND(80, 76, 0.85, 90, '#e9cfa0') + '<path d="M18 104 Q50 96 70 100 M90 100 Q112 96 142 104" fill="none" stroke="' + T + '" stroke-width="2" opacity=".5"/>')
  };

  var NISA_AR = 'وَلَوْ أَنَّهُمْ إِذْ ظَّلَمُوٓا أَنفُسَهُمْ جَآءُوكَ فَٱسْتَغْفَرُوا ٱللّٰهَ وَٱسْتَغْفَرَ لَهُمُ ٱلرَّسُولُ لَوَجَدُوا ٱللّٰهَ تَوَّابًا رَّحِيمًا';
  var ISTIGHFAR_AR = 'أَسْتَغْفِرُ اللّٰهَ الْعَظِيمَ الَّذِي لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ';
  var STEPS = [
    { art: 'look', t: 'Look first, then give your hand', b: 'Choose a murshid: a shaykh, or a khalifa he has authorised, who follows the Shari’ah and the Sunnah. Hazrat said: “Look first and understand, then give your hand. Otherwise regret follows.”',
      q: 'A sign of a good murshid: in his company the whisperings and idle thoughts stop, and the heart becomes bound to Allah and His Messenger ﷺ.' },
    { art: 'heart', t: 'Come with tawbah and taqwa', b: 'Bai’at is a covenant. In the time of the Prophet ﷺ bai’at was taken on becoming Muslim, on repenting, and to stay firm in the love of Allah and His Messenger ﷺ. In bai’at there is both taqwa and tawbah: come with a sincere intention to turn back to Allah.' },
    { art: 'tasbeeh', t: 'It begins with istighfar', b: 'Becoming a murid begins with istighfar. Recite with the shaykh:', ar: ISTIGHFAR_AR,
      tr: 'Astaghfirullah al-‘Azeem alladhi la ilaha illa Huwa al-Hayy al-Qayyum wa atubu ilayh.', mn: 'I ask forgiveness of Allah the Almighty, besides whom there is no god, the Ever-Living, the Self-Sustaining, and I turn to Him in repentance.' },
    { art: 'hands', t: 'Give your hand (men)', b: 'The shaykh takes the man’s hand in his, as the Companions placed their hands in the blessed hand of the Prophet ﷺ.',
      ar: 'إِنَّ الَّذِينَ يُبَايِعُونَكَ إِنَّمَا يُبَايِعُونَ اللّٰهَ يَدُ اللّٰهِ فَوْقَ أَيْدِيهِمْ', mn: 'Indeed, those who pledge allegiance to you are pledging allegiance to Allah. The Hand of Allah is over their hands. (Surah al-Fath 48:10)' },
    { art: 'cloth', t: 'Women and children', b: 'For women, bai’at by word of mouth alone is enough: the murshid says “I take this bai’at from you; be steadfast on it,” and she answers “I am steadfast.” The elders also hold one corner of a handkerchief or shawl and give the other corner to her, or keep water in a basin with the shaykh’s hand on one side and hers on the other. She does not need to unveil before the shaykh.',
      q: 'Small children are sometimes given bai’at for blessing: this is called bai’at-e-barakat.' },
    { art: 'pledge', t: 'The pledge', b: 'After the istighfar comes the promise. In Hazrat’s words:', q: '“I promise that, as far as I can, I will walk according to the commands of Allah and of His Messenger ﷺ, keep away from what is bad, and hold fast to what is good.”' },
    { art: 'dua', t: 'The shaykh’s du’a', b: 'The murshid asks Allah to forgive the new murid, and there is hope that it is accepted.',
      ar: NISA_AR,
      mn: '“If, when they had wronged themselves, they had come to you and asked Allah’s forgiveness, and the Messenger had asked forgiveness for them, they would have found Allah Accepting of repentance, Most Merciful.” (Surah an-Nisa 4:64)' },
    { art: 'rope', t: 'After bai’at: hold the rope', b: 'Through bai’at the murid holds the rope that reaches from the Prophet ﷺ through the chain of masters. Follow your shaykh’s guidance: practices of dhikr are learnt from him, so that you reach the right station. If you slip, do not despair: repent and recite the istighfar again. Repentance never goes to waste, and bai’at can be renewed: the Prophet ﷺ told a Companion who had already given it, “Give bai’at again.”' }
  ];
  var SHORTS = [
    { id: 'TkSFt5BlMzs', title: 'What Is Bai’at? Hand Upon Hand' }, { id: 'VlU4EcJGVgQ', title: 'The Hand of Allah' },
    { id: 'ufZ_iEByRmI', title: 'Why One Trusted Guide? The Lawyer and the Shaykh' }, { id: '883RmkRT9mE', title: 'Whoever Has No Pir, His Pir Is Shaytan' },
    { id: '56xW_CnWB0w', title: 'The Big Stone and the Small Pebble: The Power of Company' }
  ];

  var css = doc.createElement('style');
  css.textContent =
    '.by-hero{background:linear-gradient(135deg,var(--teal),#0f3a33);color:#f5f1e2;border-radius:16px;padding:16px;margin-bottom:12px}.by-hero b{font-size:19px}.by-hero p{margin:6px 0 0;font-size:13.5px;line-height:1.55;opacity:.93}.by-hero .ur{font-family:"Noto Nastaliq Urdu",Amiri,serif;font-size:15px;line-height:2.1;direction:rtl;text-align:right;margin-top:8px;color:var(--gold-soft)}' +
    '.by-draft{background:#fff3cd;color:#5c4400;border:1px solid #e6c766;border-radius:12px;padding:10px 12px;font-size:12.5px;line-height:1.5;margin-bottom:12px}' +
    '.by-step{background:var(--panel);border:1px solid var(--line);border-radius:16px;margin-bottom:12px;overflow:hidden}.by-art{background:linear-gradient(180deg,#f7efd9,#efe2bf);display:flex;justify-content:center;padding:6px 0 0;position:relative}.by-art svg{width:180px;height:124px}' +
    '.by-n{position:absolute;left:12px;top:10px;width:28px;height:28px;border-radius:50%;background:var(--teal);color:#fff;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center}' +
    '.by-tx{padding:12px 14px 14px}.by-tx h3{margin:0 0 6px;font-size:16.5px;color:var(--ink)}.by-tx p{margin:0 0 8px;font-size:14px;line-height:1.6;color:var(--ink)}.by-tx .q{border-left:3px solid var(--gold);padding:2px 0 2px 10px;color:var(--muted);font-style:italic}' +
    '.by-ar{font-family:Amiri,"Scheherazade New",serif;font-size:22px;line-height:1.9;direction:rtl;text-align:center;color:var(--teal);margin:6px 0}.by-tr{font-size:13px;text-align:center;color:var(--ink);font-style:italic;margin-bottom:4px}.by-mn{font-size:12.5px;color:var(--muted);text-align:center;line-height:1.5}' +
    '.by-src{font-size:11.5px;color:var(--muted);line-height:1.5;margin:6px 2px 14px}';
  doc.head.appendChild(css);

  var s = N.el('div', 'screen', '<div class="subhead"><div class="backbtn" id="byBack">←</div><div class="subtitle">Taking Bai’at</div></div><div id="byBody"></div>');
  s.id = 'screen-bayah'; doc.querySelector('.screens').appendChild(s);
  s.querySelector('#byBack').addEventListener('click', function () { N.backTab(); });
  var body = s.querySelector('#byBody');

  function paint() {
    var F = root.NoorFamily, h = '';
    if (!cfg.bayahOn) h += '<div class="by-draft"><b>Draft for review.</b> Only phones opened with ?bayah=1 see this page. Members still see “coming soon” until it is approved.</div>';
    h += '<div class="by-hero"><b>Taking Bai’at</b><p>Bai’at (iradat) is a covenant with Allah at the hand of a murshid. These are the steps as Hazrat Azam Pasha R.A. explained them in the dars Haqeeqat-e-Bai’at. Your shaykh or his khalifa will guide you through them.</p>' +
      '<div class="ur">' + esc(F && F.BAYAH_UR || '') + '</div></div>';
    STEPS.forEach(function (st, i) {
      h += '<div class="by-step"><div class="by-art"><span class="by-n">' + (i + 1) + '</span>' + ART[st.art] + '</div><div class="by-tx"><h3>' + esc(st.t) + '</h3><p>' + esc(st.b) + '</p>' +
        (st.ar ? '<div class="by-ar" lang="ar">' + esc(st.ar) + '</div>' : '') + (st.tr ? '<div class="by-tr">' + esc(st.tr) + '</div>' : '') + (st.mn ? '<div class="by-mn">' + esc(st.mn) + '</div>' : '') +
        (st.q ? '<p class="q" style="margin-top:8px">' + esc(st.q) + '</p>' : '') + '</div></div>';
    });
    if (F && F.shortsGrid) h += '<h2 class="section-title" style="margin-top:6px">Hear it from Hazrat Azam Pasha R.A.</h2>' + F.shortsGrid(SHORTS);
    h += '<div class="by-src">From the dars Haqeeqat-e-Bai’at of Hazrat Azam Pasha R.A. The words of the istighfar and the pledge may differ a little from one silsila to another: follow what your shaykh or khalifa teaches.</div>';
    body.innerHTML = h;
  }
  body.addEventListener('click', function (e) { var th = e.target.closest && e.target.closest('.fm-sth'); if (th && root.NoorFamily) root.NoorFamily.playShort(th); });
  N.onScreen(function (id) { if (id === 'bayah') paint(); });
  root.NoorBayah = { ready: true, NISA_AR: NISA_AR, ISTIGHFAR_AR: ISTIGHFAR_AR };
})(typeof self !== 'undefined' ? self : this);
