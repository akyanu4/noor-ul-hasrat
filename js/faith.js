/* Noor: Islamic Calendar (Hijri date + month grid + upcoming days), Islamic Months, Duas, Donate.
 * Pure date logic lives in NoorFaith (unit-tested in node); the screens need window.Noor. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.NoorFaith = api;
  if (typeof window !== 'undefined' && window.Noor) api.mountUI(window, window.Noor, root.NOOR_CONFIG || {});
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MONTHS = [
    { n: 'Muharram', ar: 'المحرّم', sacred: true, pts: [
      'One of the four sacred months (Qur\'an 9:36). The Islamic year begins with it.',
      'The Prophet ﷺ called fasting in Muharram the best fasting after Ramadan (Muslim).',
      '10th, Ashura: fasting it expiates the sins of the previous year (Muslim). Fast the 9th or 11th with it.'] },
    { n: 'Safar', ar: 'صفر', pts: [
      'No special acts are prescribed for this month; keep up your regular worship.',
      'It is not a month of bad luck. The Prophet ﷺ rejected superstitious omens (Bukhari, Muslim).'] },
    { n: 'Rabi al-Awwal', ar: 'ربيع الأول', pts: [
      'The month of the Prophet\'s ﷺ birth (a Monday) and of his arrival in Madina on the Hijra. The 12th is the date most commonly cited, and scholars differ on the exact day.',
      'A good time to study the Seerah and to send abundant salawat upon him ﷺ.',
      'He ﷺ fasted on Mondays and said it was the day he was born (Muslim).'] },
    { n: 'Rabi al-Thani', ar: 'ربيع الآخر', pts: [
      'No special acts are prescribed for this month. Stay steady in your daily dhikr, Qur\'an and prayer.'] },
    { n: 'Jumada al-Ula', ar: 'جمادى الأولى', pts: [
      'No special acts are prescribed. Keep the regular sunnah fasts: Mondays, Thursdays and the White Days (13th, 14th, 15th of each month).'] },
    { n: 'Jumada al-Thani', ar: 'جمادى الآخرة', pts: [
      'No special acts are prescribed. Use it to build habits before Rajab, Sha\'ban and Ramadan.'] },
    { n: 'Rajab', ar: 'رجب', sacred: true, pts: [
      'One of the four sacred months (Qur\'an 9:36): avoid wrongdoing in it especially.',
      'Many Muslims remember the Isra and Mi\'raj on the 27th. The exact date is not firmly established.',
      'A good time to begin preparing for Ramadan.'] },
    { n: 'Sha\'ban', ar: 'شعبان', pts: [
      'Aisha (may Allah be pleased with her) said she never saw the Prophet ﷺ fast more in any month than Sha\'ban (Bukhari, Muslim).',
      'He ﷺ described it as a month people neglect, between Rajab and Ramadan (Nasa\'i).'] },
    { n: 'Ramadan', ar: 'رمضان', pts: [
      'Fasting is obligatory; the Qur\'an was revealed in it (2:185).',
      'The gates of Paradise are opened and the devils are chained (Bukhari, Muslim).',
      'Laylat al-Qadr is better than a thousand months (97:3). Seek it in the odd nights of the last ten.',
      'Pay Zakat al-Fitr before the Eid prayer.'] },
    { n: 'Shawwal', ar: 'شوال', pts: [
      'Begins with Eid al-Fitr; fasting is not allowed on that day.',
      'Whoever fasts Ramadan then follows it with six days of Shawwal, it is as if they fasted the whole year (Muslim).'] },
    { n: 'Dhul Qa\'dah', ar: 'ذو القعدة', sacred: true, pts: [
      'One of the four sacred months (Qur\'an 9:36).',
      'The months of Hajj begin with Shawwal and run through Dhul Qa\'dah and Dhul Hijjah (2:197). Most of the Prophet\'s ﷺ Umrahs were in Dhul Qa\'dah (Bukhari, Muslim).'] },
    { n: 'Dhul Hijjah', ar: 'ذو الحجة', sacred: true, pts: [
      'One of the four sacred months. The month of Hajj.',
      'The first ten days are the best days of the year for good deeds (Bukhari). Increase dhikr, Qur\'an, charity and fasting.',
      '9th, Day of Arafah: fasting it (for those not on Hajj) expiates two years of sins (Muslim).',
      '10th, Eid al-Adha and Qurbani. The 11th to 13th are days of eating, drinking and remembering Allah (Muslim).'] }
  ];

  /* Recurring days that matter, as [month, day, name, short note]. Observance varies; these are the commonly marked days. */
  var EVENTS = [
    [1, 1, 'Islamic New Year', '1 Muharram'],
    [1, 10, 'Ashura', 'Recommended fast, with the 9th or 11th'],
    [3, 12, 'Rabi al-Awwal 12', 'Commemorated by many as the Prophet\'s ﷺ birth (scholars differ on the date)'],
    [9, 1, 'Ramadan begins', 'First fast and Tarawih'],
    [9, 21, 'Last ten nights', 'Seek Laylat al-Qadr in the odd nights'],
    [10, 1, 'Eid al-Fitr', 'No fasting today'],
    [12, 1, 'First ten days of Dhul Hijjah', 'The best days for good deeds'],
    [12, 9, 'Day of Arafah', 'Recommended fast if not on Hajj'],
    [12, 10, 'Eid al-Adha', 'Eid prayer and Qurbani']
  ];

  var DAY = 86400000;
  var fmtCache = null;
  function fmt() {
    if (fmtCache) return fmtCache;
    try { fmtCache = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }); fmtCache.format(0); }
    catch (e) { fmtCache = null; }
    return fmtCache;
  }
  /* Hijri date for a civil day. ymd = [y, m, d] (Gregorian). adj = whole days to shift (moon sighting differs by region). */
  function hijri(y, m, d, adj) {
    var f = fmt(); if (!f) return null;
    var t = Date.UTC(y, m - 1, d) + (adj || 0) * DAY, o = {};
    f.formatToParts(t).forEach(function (p) { if (p.type === 'day' || p.type === 'month' || p.type === 'year') o[p.type] = parseInt(p.value, 10); });
    if (!o.day || !o.month || !o.year) return null;
    return { y: o.year, m: o.month, d: o.day };
  }
  function ymdOf(ms) { var d = new Date(ms); return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]; }
  function hijriAt(ms, adj) { var a = ymdOf(ms); return hijri(a[0], a[1], a[2], adj); }
  /* The Gregorian civil days of the Hijri month containing `ms`. Returns [{ms, d}] with d = Hijri day. */
  function monthDays(ms, adj) {
    var h = hijriAt(ms, adj); if (!h) return [];
    var start = ms - (h.d - 1) * DAY, out = [], i;
    for (i = 0; i < 31; i++) {
      var t = start + i * DAY, x = hijriAt(t, adj);
      if (!x || x.m !== h.m || x.y !== h.y) break;
      out.push({ ms: t, d: x.d });
    }
    return out;
  }
  /* Upcoming marked days within `horizon` days, soonest first. */
  function upcoming(ms, adj, horizon) {
    var res = [], i;
    for (i = 0; i <= (horizon || 400); i++) {
      var t = ms + i * DAY, h = hijriAt(t, adj); if (!h) return res;
      EVENTS.forEach(function (e) { if (e[0] === h.m && e[1] === h.d) res.push({ ms: t, days: i, y: h.y, m: h.m, d: h.d, name: e[2], note: e[3] }); });
    }
    return res;
  }
  function label(h) { return h.d + ' ' + MONTHS[h.m - 1].n + ' ' + h.y + ' AH'; }
  function dayStart(nowMs, tzOffsetMin) { var l = nowMs - (tzOffsetMin || 0) * 60000; return Date.UTC(new Date(l).getUTCFullYear(), new Date(l).getUTCMonth(), new Date(l).getUTCDate()); }

  /* [Arabic, transliteration, meaning, source] grouped by occasion. */
  var DUAS = [
    ['Morning & sleep', [
      ['اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ', 'Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namutu, wa ilaykan-nushur', 'O Allah, by You we reach the morning and by You we reach the evening; by You we live and by You we die, and to You is the resurrection.', 'Tirmidhi'],
      ['الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', 'Alhamdu lillahil-ladhi ahyana ba\'da ma amatana wa ilayhin-nushur', 'Praise be to Allah who gave us life after causing us to die, and to Him is the resurrection. (On waking)', 'Bukhari'],
      ['بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', 'Bismika Allahumma amutu wa ahya', 'In Your name, O Allah, I die and I live. (Before sleeping)', 'Bukhari']]],
    ['Food', [
      ['بِسْمِ اللَّهِ', 'Bismillah', 'In the name of Allah. (Before eating)', 'Bukhari, Muslim'],
      ['بِسْمِ اللَّهِ أَوَّلَهُ وَآخِرَهُ', 'Bismillahi awwalahu wa akhirahu', 'In the name of Allah at its beginning and at its end. (If you forgot to say it at the start)', 'Abu Dawud, Tirmidhi'],
      ['الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ', 'Alhamdu lillahil-ladhi at\'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah', 'Praise be to Allah who fed me this and provided it for me without any might or power from me. (After eating)', 'Abu Dawud, Tirmidhi'],
      ['ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ', 'Dhahaba az-zama\'u wabtallatil-\'uruqu wa thabatal-ajru in sha Allah', 'The thirst has gone, the veins are moist, and the reward is confirmed, if Allah wills. (Breaking the fast)', 'Abu Dawud']]],
    ['Home, mosque & travel', [
      ['بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', 'Bismillahi tawakkaltu \'alallahi wa la hawla wa la quwwata illa billah', 'In the name of Allah, I place my trust in Allah; there is no might or power except with Allah. (Leaving home)', 'Abu Dawud, Tirmidhi'],
      ['اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', 'Allahummaftah li abwaba rahmatik', 'O Allah, open for me the doors of Your mercy. (Entering the mosque)', 'Muslim'],
      ['اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ', 'Allahumma inni as\'aluka min fadlik', 'O Allah, I ask You of Your bounty. (Leaving the mosque)', 'Muslim'],
      ['سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ', 'Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila rabbina lamunqalibun', 'Glory to Him who has subjected this to us, and we could not have done it ourselves; and to our Lord we will return. (Travel)', 'Qur\'an 43:13-14'],
      ['بِسْمِ اللَّهِ اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ', 'Bismillah, Allahumma inni a\'udhu bika minal-khubuthi wal-khaba\'ith', 'In the name of Allah. O Allah, I seek refuge in You from evil and evil-doers. (Entering the toilet)', 'Bukhari, Muslim'],
      ['غُفْرَانَكَ', 'Ghufranak', 'I seek Your forgiveness. (Leaving the toilet)', 'Abu Dawud, Tirmidhi']]],
    ['Forgiveness & hardship', [
      ['لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ', 'La ilaha illa anta subhanaka inni kuntu minaz-zalimin', 'There is no god but You; glory be to You; I was among the wrongdoers. (The dua of Yunus, for distress)', 'Qur\'an 21:87'],
      ['اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَالْعَجْزِ وَالْكَسَلِ وَالْبُخْلِ وَالْجُبْنِ وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ', 'Allahumma inni a\'udhu bika minal-hammi wal-hazan, wal-\'ajzi wal-kasal, wal-bukhli wal-jubn, wa dala\'id-dayni wa ghalabatir-rijal', 'O Allah, I seek refuge in You from worry and grief, weakness and laziness, miserliness and cowardice, the burden of debt and being overpowered by men.', 'Bukhari'],
      ['اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي', 'Allahumma innaka \'afuwwun tuhibbul-\'afwa fa\'fu \'anni', 'O Allah, You are Most Forgiving and love forgiveness, so forgive me. (Taught for Laylat al-Qadr)', 'Tirmidhi, Ibn Majah'],
      ['رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا', 'Rabbana la tu\'akhidhna in nasina aw akhta\'na', 'Our Lord, do not hold us accountable if we forget or make a mistake.', 'Qur\'an 2:286']]],
    ['From the Qur\'an', [
      ['رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina \'adhaban-nar', 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.', 'Qur\'an 2:201'],
      ['رَبِّ زِدْنِي عِلْمًا', 'Rabbi zidni \'ilma', 'My Lord, increase me in knowledge.', 'Qur\'an 20:114'],
      ['رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', 'Rabbir-hamhuma kama rabbayani saghira', 'My Lord, have mercy on them (my parents) as they raised me when I was small.', 'Qur\'an 17:24']]],
    ['New moon', [
      ['اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالْأَمْنِ وَالْإِيمَانِ وَالسَّلَامَةِ وَالْإِسْلَامِ رَبِّي وَرَبُّكَ اللَّهُ', 'Allahumma ahillahu \'alayna bil-amni wal-iman, was-salamati wal-islam, rabbi wa rabbukallah', 'O Allah, bring it over us with security and faith, safety and Islam. My Lord and your Lord is Allah. (On sighting the new moon)', 'Tirmidhi']]]
  ];

  function safeUrl(u) { try { var x = new URL(String(u)); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; } }

  var api = { MONTHS: MONTHS, EVENTS: EVENTS, DUAS: DUAS, hijri: hijri, hijriAt: hijriAt, monthDays: monthDays, upcoming: upcoming, label: label, dayStart: dayStart, safeUrl: safeUrl, supported: function () { return !!fmt(); } };

  /* ---------- UI ---------- */
  api.mountUI = function (win, N, cfg) {
    var doc = win.document, el = N.el, esc = N.esc, screens = doc.querySelector('.screens');
    var store = (function () { try { win.localStorage.setItem('_t', '1'); win.localStorage.removeItem('_t'); return win.localStorage; } catch (e) { return null; } })();
    function sget(k) { try { return store && store.getItem(k); } catch (e) { return null; } }
    function sset(k, v) { try { store && store.setItem(k, v); } catch (e) {} }
    var host = screens.parentNode;
    function toast(msg) { var old = host.querySelector('.toast'); if (old) old.remove(); var t = el('div', 'toast', esc(msg)); host.appendChild(t); setTimeout(function () { t.remove(); }, 3000); }
    function copy(text) {
      try { if (win.navigator.clipboard) { win.navigator.clipboard.writeText(text).then(function () { toast('Copied'); }, function () { toast('Could not copy'); }); return; } } catch (e) {}
      toast('Could not copy');
    }

    var css = doc.createElement('style');
    css.textContent =
      '.fcard{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:12px}' +
      '.fhero{background:linear-gradient(135deg,var(--teal),var(--teal-deep));color:#f5f1e2;border-radius:16px;padding:18px;margin-bottom:14px;border:1px solid var(--gold-soft);text-align:center}' +
      '.fhero .h{font-size:26px;font-weight:700}.fhero .ar{font-family:Amiri,serif;font-size:24px;color:var(--gold-soft);margin:2px 0}.fhero .g{font-size:12.5px;opacity:.85}' +
      '.fadj{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;font-size:12px}.fadj button{background:rgba(255,255,255,.14);border:0;color:#f5f1e2;border-radius:8px;padding:4px 10px;font-size:15px;cursor:pointer}' +
      '.fgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:6px}.fgrid .wd{font-size:10.5px;color:var(--muted);text-align:center;padding:2px 0}' +
      '.fday{aspect-ratio:1;border-radius:10px;border:1px solid var(--line);background:var(--panel);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:14px;position:relative}.fday small{font-size:9px;color:var(--muted);line-height:1}' +
      '.fday.today{background:var(--teal);color:#fff;border-color:var(--teal)}.fday.today small{color:#e7d4a3}.fday.ev::after{content:"";position:absolute;top:4px;right:4px;width:6px;height:6px;border-radius:50%;background:var(--gold)}' +
      '.fev{display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}.fev:last-child{border-bottom:0}.fev .when{width:58px;text-align:center;flex:none;font-size:11px;color:var(--muted)}.fev .when b{display:block;font-size:19px;color:var(--teal)}.fev .nm{flex:1;font-size:14px}.fev .nm small{display:block;color:var(--muted);font-size:11.5px}' +
      '.fmonth h3{margin:0;font-size:15px;display:flex;justify-content:space-between;align-items:center;gap:8px}.fmonth h3 .ar{font-family:Amiri,serif;font-size:20px;color:var(--teal)}.fmonth ul{margin:8px 0 0;padding-left:18px;font-size:13px;line-height:1.5}.fmonth .tag{font-size:10.5px;background:var(--gold);color:#1a2421;border-radius:8px;padding:2px 7px;font-weight:700}.fmonth.now{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold)}' +
      '.ftabs{display:flex;gap:6px;overflow-x:auto;margin-bottom:12px;padding-bottom:2px}.ftab{flex:none;padding:7px 12px;border:1px solid var(--line);border-radius:18px;font-size:12.5px;background:var(--panel);cursor:pointer;color:var(--muted);white-space:nowrap}.ftab.on{background:var(--teal);color:#fff;border-color:var(--teal)}' +
      '.dua .ar{font-family:Amiri,serif;font-size:24px;line-height:2;text-align:right;direction:rtl;color:var(--ink)}.dua .tr{font-style:italic;font-size:13px;color:var(--teal);margin:6px 0}.dua .mn{font-size:13.5px;line-height:1.5}.dua .src{display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:11.5px;color:var(--muted)}.dua .src button{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:8px;padding:4px 10px;font-size:12px;cursor:pointer}' +
      '.fnote{font-size:12px;color:var(--muted);margin:8px 2px 14px;line-height:1.5}.fbtn{display:block;width:100%;text-align:center;background:var(--gold);color:#1a2421;font-weight:700;border:0;border-radius:12px;padding:13px;font-size:15px;cursor:pointer;text-decoration:none;box-sizing:border-box}';
    doc.head.appendChild(css);

    function mk(id, title, bodyId) {
      var s = el('div', 'screen', '<div class="subhead"><div class="backbtn" id="' + id + 'Back">←</div><div class="subtitle">' + title + '</div></div><div id="' + bodyId + '"></div>');
      s.id = 'screen-' + id; screens.appendChild(s);
      s.querySelector('#' + id + 'Back').addEventListener('click', function () { N.backTab(); });
      return s.querySelector('#' + bodyId);
    }
    var calBox = mk('calendar', 'Islamic Calendar', 'calBody'), monBox = mk('months', 'Islamic Months', 'monBody'),
        duaBox = mk('duas', 'Duas', 'duaBody'), donBox = mk('donate', 'Donate', 'donBody');

    /* ----- calendar ----- */
    var adj = parseInt(sget('noor_hijri_adj'), 10) || 0; if (adj < -2 || adj > 2) adj = 0;
    var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    function paintCal() {
      if (!api.supported()) { calBox.innerHTML = '<div class="placeholder-note">This browser can\'t calculate Hijri dates. Updating your browser should fix it.</div>'; return; }
      var tzo = new Date().getTimezoneOffset(), todayMs = dayStart(Date.now(), tzo), h = hijriAt(todayMs, adj), days = monthDays(todayMs, adj), up = upcoming(todayMs, adj, 400);
      var g = new Date(todayMs), html = '<div class="fhero"><div class="h">' + h.d + ' ' + esc(MONTHS[h.m - 1].n) + ' ' + h.y + '</div><div class="ar">' + esc(MONTHS[h.m - 1].ar) + '</div><div class="g">' + WD[g.getUTCDay()] + ' ' + g.getUTCDate() + ' ' + MON3[g.getUTCMonth()] + ' ' + g.getUTCFullYear() + '</div>' +
        '<div class="fadj"><button id="hMinus" aria-label="Move Hijri date one day earlier">−</button><span>Moon sighting adjustment: ' + (adj > 0 ? '+' : '') + adj + ' day' + (Math.abs(adj) === 1 ? '' : 's') + '</span><button id="hPlus" aria-label="Move Hijri date one day later">+</button></div></div>';
      var evDays = {}; up.forEach(function (e) { if (e.m === h.m && e.y === h.y) evDays[e.d] = 1; });
      EVENTS.forEach(function (e) { if (e[0] === h.m) evDays[e[1]] = 1; });
      html += '<div class="fgrid">' + WD.map(function (w) { return '<div class="wd">' + w + '</div>'; }).join('');
      var lead = new Date(days[0].ms).getUTCDay(), i; for (i = 0; i < lead; i++) html += '<div></div>';
      days.forEach(function (x) { var gd = new Date(x.ms); html += '<div class="fday' + (x.ms === todayMs ? ' today' : '') + (evDays[x.d] ? ' ev' : '') + '">' + x.d + '<small>' + gd.getUTCDate() + '</small></div>'; });
      html += '</div><div class="fnote">Big number: Hijri day. Small number: day of the Gregorian month. A gold dot marks a notable day. The Hijri date follows the Umm al-Qura calendar; where your community goes by local moon sighting it can differ by a day, so use − / + to match.</div>';
      html += '<h2 class="section-title" style="margin-top:6px">Coming up</h2><div class="fcard">';
      up.slice(0, 6).forEach(function (e) {
        var gd = new Date(e.ms);
        html += '<div class="fev"><div class="when"><b>' + (e.days === 0 ? 'Today' : e.days) + '</b>' + (e.days === 0 ? '' : e.days === 1 ? 'day' : 'days') + '</div><div class="nm">' + esc(e.name) + '<small>' + e.d + ' ' + esc(MONTHS[e.m - 1].n) + ' ' + e.y + ' · ' + WD[gd.getUTCDay()] + ' ' + gd.getUTCDate() + ' ' + MON3[gd.getUTCMonth()] + ' · ' + esc(e.note) + '</small></div></div>';
      });
      html += '</div><div class="fnote">Also recurring: the White Days (13th, 14th, 15th of each Hijri month), Mondays and Thursdays, and Jumu\'ah every Friday.</div>' +
        '<button class="fbtn" id="goMonths" style="background:var(--panel);color:var(--ink);border:1px solid var(--line)">Importance of each month ›</button>';
      calBox.innerHTML = html;
      calBox.querySelector('#hMinus').onclick = function () { adj = Math.max(-2, adj - 1); sset('noor_hijri_adj', String(adj)); paintCal(); };
      calBox.querySelector('#hPlus').onclick = function () { adj = Math.min(2, adj + 1); sset('noor_hijri_adj', String(adj)); paintCal(); };
      calBox.querySelector('#goMonths').onclick = function () { N.showScreen('months'); };
    }

    /* ----- months ----- */
    function paintMonths() {
      var cur = api.supported() ? (hijriAt(dayStart(Date.now(), new Date().getTimezoneOffset()), adj) || {}).m : 0;
      monBox.innerHTML = '<div class="fnote" style="margin-top:0">Four months are sacred: Muharram, Rajab, Dhul Qa\'dah and Dhul Hijjah. Hadith sources are named so you can check them with your teachers.</div>' +
        MONTHS.map(function (m, i) {
          return '<div class="fcard fmonth' + (cur === i + 1 ? ' now' : '') + '"><h3><span>' + (i + 1) + '. ' + esc(m.n) + (m.sacred ? ' <span class="tag">Sacred</span>' : '') + (cur === i + 1 ? ' <span class="tag" style="background:var(--teal);color:#fff">Now</span>' : '') + '</span><span class="ar">' + esc(m.ar) + '</span></h3><ul>' + m.pts.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></div>';
        }).join('');
    }

    /* ----- duas ----- */
    var duaCat = 0;
    function paintDuas() {
      var h = '<div class="ftabs">' + DUAS.map(function (c, i) { return '<div class="ftab' + (i === duaCat ? ' on' : '') + '" data-i="' + i + '">' + esc(c[0]) + '</div>'; }).join('') + '</div>';
      DUAS[duaCat][1].forEach(function (d, j) {
        h += '<div class="fcard dua"><div class="ar">' + esc(d[0]) + '</div><div class="tr">' + esc(d[1]) + '</div><div class="mn">' + esc(d[2]) + '</div><div class="src"><span>' + esc(d[3]) + '</span><button data-j="' + j + '">Copy</button></div></div>';
      });
      h += '<div class="fnote">Texts are from the Qur\'an and the standard hadith collections. Please check wording and rulings with your teachers.</div>';
      duaBox.innerHTML = h;
      Array.prototype.forEach.call(duaBox.querySelectorAll('.ftab'), function (t) { t.onclick = function () { duaCat = +t.dataset.i; paintDuas(); }; });
      Array.prototype.forEach.call(duaBox.querySelectorAll('.src button'), function (b) { b.onclick = function () { var d = DUAS[duaCat][1][+b.dataset.j]; copy(d[0] + '\n' + d[1] + '\n' + d[2] + ' (' + d[3] + ')'); }; });
    }

    /* ----- donate ----- */
    function paintDonate() {
      var url = safeUrl(cfg.donateUrl), note = String(cfg.donateNote || '').trim(), title = String(cfg.donateTitle || 'Support the mission').trim();
      var h = '<div class="fhero"><div class="h" style="font-size:20px">' + esc(title) + '</div></div>';
      if (!url && !note) {
        h += '<div class="placeholder-note">Donation details haven\'t been added yet, in shaa Allah soon.</div>';
      } else {
        if (url) h += '<a class="fbtn" id="donGo" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">Donate securely ›</a><div class="fnote">Opens the donation page in your browser. Noor itself never handles payments or card details.</div>';
        if (note) h += '<div class="fcard"><div style="white-space:pre-wrap;font-size:14px;line-height:1.6">' + esc(note) + '</div><button class="qbtn2" id="donCopy" style="margin-top:10px;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:8px;padding:6px 12px;cursor:pointer">Copy details</button></div>';
      }
      donBox.innerHTML = h;
      var c = donBox.querySelector('#donCopy'); if (c) c.onclick = function () { copy(note); };
    }

    N.onScreen(function (id) { if (id === 'calendar') paintCal(); if (id === 'months') { paintMonths(); } if (id === 'duas') paintDuas(); if (id === 'donate') paintDonate(); });
  };
  return api;
});
