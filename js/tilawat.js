/* Noor: Qur'an Learning (Tilawat practice) for children and beginners. The child reads one ayah at a time (Al-Fatihah and the
   short surahs 99-114); the phone's own Arabic speech recognition listens, and every word is checked against the ayah:
   right words go green, a wrong word shows what was heard and the correct word, a missed word is shown, and the whole
   ayah can be played by a reciter. This is a practice aid, not a tajweed teacher: speech recognition is approximate, and
   the app says so. Works best in Chrome on Android; iPhone Safari has no Arabic recognition, so Listen/Read still work.
   Data: data/tilawat.json. Opens from More -> Prayers & Practices, the Qur'an screen, and ?tilawat=1. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.mount(root);
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- matching core (pure, tested in node) ---------- */
  // Arabic without tashkeel, tatweel, Quranic marks; alef/ya/ta-marbuta variants folded, so "ٱلرَّحۡمَٰنِ" and "الرحمن" compare equal.
  function norm(s) {
    return String(s || '')
      .replace(/[ً-ٰٟۖ-ۭ࣓-ࣿـ‌‍‏‎]/g, '')
      .replace(/[ٱآأإ]/g, 'ا')
      .replace(/ى/g, 'ي').replace(/ة/g, 'ه')
      .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/[^ء-ي\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function words(s) { var n = norm(s); return n ? n.split(' ') : []; }
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 1; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  // How many letter slips a word may have and still count as said correctly (recognition is not perfect).
  function allow(len) { return len <= 5 ? 0 : len <= 8 ? 1 : 2; }   // strict on short words: a changed letter is a real mistake
  // Spelling varies between the Uthmani text and what a recognizer writes (مالك / ملك, الرحمن / الرحمان): inner alefs are ignored when comparing.
  function key(w) { return w.charAt(0) + w.slice(1).replace(/\u0627/g, ''); }
  function same(a, b) { a = key(a); b = key(b); return a === b || lev(a, b) <= allow(Math.min(a.length, b.length)); }

  // Align expected words with heard words. Returns per expected word {w, st:'ok'|'wrong'|'missing', heard}, plus extra heard words.
  function align(expected, heard) {
    var m = expected.length, n = heard.length, d = [], p = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = []; p[i] = []; }
    d[0][0] = 0;
    for (i = 1; i <= m; i++) { d[i][0] = i; p[i][0] = 'D'; }
    for (j = 1; j <= n; j++) { d[0][j] = j; p[0][j] = 'I'; }
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) {
      var sub = d[i - 1][j - 1] + (same(expected[i - 1], heard[j - 1]) ? 0 : 1.2);   // a wrong word costs a little more than skip+extra so near misses pair up
      var del = d[i - 1][j] + 1, ins = d[i][j - 1] + 1;
      if (sub <= del && sub <= ins) { d[i][j] = sub; p[i][j] = 'S'; } else if (del <= ins) { d[i][j] = del; p[i][j] = 'D'; } else { d[i][j] = ins; p[i][j] = 'I'; }
    }
    var res = new Array(m), extra = [];
    i = m; j = n;
    while (i > 0 || j > 0) {
      var t = p[i][j];
      if (t === 'S') { res[i - 1] = { w: expected[i - 1], st: same(expected[i - 1], heard[j - 1]) ? 'ok' : 'wrong', heard: heard[j - 1] }; i--; j--; }
      else if (t === 'D') { res[i - 1] = { w: expected[i - 1], st: 'missing', heard: '' }; i--; }
      else { extra.unshift(heard[j - 1]); j--; }
    }
    return { words: res, extra: extra };
  }
  function errors(r) { return r.words.filter(function (x) { return x.st !== 'ok'; }).length + r.extra.length; }

  // Check one ayah. `alts` = the recognizer's alternative transcripts; the best-matching one is used.
  function check(ayahText, alts) {
    var exp = words(ayahText), best = null;
    (alts || []).forEach(function (a) {
      var h = words(a); if (!h.length) return;
      var r = align(exp, h); r.heardText = h.join(' '); r.err = errors(r);
      if (!best || r.err < best.err) best = r;
    });
    if (!best) return { heard: false, words: exp.map(function (w) { return { w: w, st: 'missing', heard: '' }; }), extra: [], ok: false };
    // recognizers sometimes split or join words; if the whole line is nearly identical, accept it
    var a = exp.join(''), b = best.heardText.replace(/ /g, '');
    if (best.err && best.words.length !== best.heardText.split(' ').length && lev(a, b) <= Math.floor(a.length * 0.04)) { best.words.forEach(function (x) { x.st = 'ok'; }); best.extra = []; best.err = 0; }
    best.heard = true; best.ok = best.err === 0;
    return best;
  }

  /* ---------- UI ---------- */
  function mount(win) {
    var N = win.Noor, doc = win.document;
    if (!N || !doc || !doc.querySelector('.screens')) return;
    var T = function (en, ru) { return N.T ? N.T(en, ru) : en; };
    var esc = N.esc || function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var store = (function () { try { win.localStorage.setItem('_t', '1'); win.localStorage.removeItem('_t'); return win.localStorage; } catch (e) { return null; } })();
    var prog = {}; try { prog = JSON.parse((store && store.getItem('noor_tilawat')) || '{}') || {}; } catch (e) { prog = {}; }
    function saveProg() { try { store && store.setItem('noor_tilawat', JSON.stringify(prog)); } catch (e) {} }
    var Rec = win.SpeechRecognition || win.webkitSpeechRecognition;

    var st = doc.createElement('style');
    st.textContent = '#screen-tilawat .tl-note{font-size:12.5px;color:var(--muted);line-height:1.55;margin:4px 0 12px}' +
      '#screen-tilawat .tl-row{display:flex;align-items:center;gap:12px;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:10px;cursor:pointer}' +
      '#screen-tilawat .tl-row .ar{font-family:Amiri,serif;font-size:24px;color:var(--teal);min-width:84px;text-align:right}#screen-tilawat .tl-row .tx{flex:1;font-weight:600}#screen-tilawat .tl-row .sub{font-size:12px;color:var(--muted);font-weight:400}' +
      '#screen-tilawat .tl-card{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:18px 16px;text-align:center}' +
      '#screen-tilawat .tl-ar{font-family:Amiri,"Noto Naskh Arabic",serif;font-size:34px;line-height:2.1;direction:rtl;margin:4px 0}' +
      '#screen-tilawat .tl-ar span{display:inline-block;padding:0 5px;border-radius:8px;margin:0 1px}' +
      '#screen-tilawat .tl-ar .ok{background:#d9f2e3;color:#0e5a33}#screen-tilawat .tl-ar .wrong{background:#fbdada;color:#8c1d1d}#screen-tilawat .tl-ar .missing{background:#fff0c9;color:#7a5600;text-decoration:underline wavy}' +
      '#screen-tilawat .tl-tr{font-size:14px;color:var(--muted);margin:2px 0 4px;font-style:italic}#screen-tilawat .tl-en{font-size:13.5px;margin:6px 0 2px}' +
      '#screen-tilawat .tl-btns{display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap}' +
      '#screen-tilawat .tl-b{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:999px;padding:11px 18px;font:600 14px Inter,sans-serif;cursor:pointer}' +
      '#screen-tilawat .tl-b.pri{background:var(--teal);color:#fff;border-color:var(--teal)}#screen-tilawat .tl-b.rec{background:#c0392b;color:#fff;border-color:#c0392b}#screen-tilawat .tl-b[disabled]{opacity:.5}' +
      '#screen-tilawat .tl-msg{margin-top:14px;border-radius:14px;padding:12px 14px;text-align:left;font-size:14px;line-height:1.6}' +
      '#screen-tilawat .tl-msg.good{background:#e6f6ec;color:#0e5a33}#screen-tilawat .tl-msg.bad{background:#fdecec;color:#7d1a1a}#screen-tilawat .tl-msg.info{background:var(--cream);border:1px solid var(--line)}' +
      '#screen-tilawat .tl-msg b.ar{font-family:Amiri,serif;font-size:20px}' +
      '#screen-tilawat .tl-dots{display:flex;gap:6px;justify-content:center;margin:10px 0 2px}#screen-tilawat .tl-dots i{width:9px;height:9px;border-radius:50%;background:var(--line)}#screen-tilawat .tl-dots i.on{background:var(--gold)}#screen-tilawat .tl-dots i.cur{outline:2px solid var(--teal);outline-offset:1px}';
    doc.head.appendChild(st);

    var s = N.el('div', 'screen', '<div class="subhead"><div class="backbtn" id="tlBack">←</div><div class="subtitle">Qur\'an Learning</div></div><div id="tlBody"></div>');
    s.id = 'screen-tilawat'; doc.querySelector('.screens').appendChild(s);
    var body = s.querySelector('#tlBody'), data = null, loading = false, cur = null, ai = 0, audio = null, rec = null, listening = false;

    function load(cb) {
      if (data) return cb();
      if (loading) return; loading = true;
      win.fetch('data/tilawat.json').then(function (r) { return r.json(); }).then(function (d) { data = d; loading = false; cb(); })
        .catch(function () { loading = false; body.innerHTML = '<div class="tl-note">' + T('Could not load the lessons. Check your connection and try again.', 'Sabaq load nahin ho sake. Internet check karke dobara koshish kijiye.') + '</div>'; });
    }
    function stars(sn) { var p = prog[sn] || {}; return Object.keys(p).length; }
    function stopAll() { var r = rec; rec = null; listening = false; try { r && r.abort(); } catch (e) {} try { audio && audio.pause(); } catch (e) {} }

    function home() {
      stopAll(); cur = null;
      var h = '<div class="tl-note">' + T('Pick a surah. Recite one ayah at a time; the app listens and shows every word you said right or wrong. This is a practice helper: it can make mistakes, so keep learning with a teacher.',
        'Surah chuniye. Ek ayat padhiye; app sunti hai aur har lafz ke saamne sahi ya galat dikhati hai. Yeh sirf mashq ke liye hai aur ghalti kar sakti hai, isliye ustaad se bhi seekhte rahiye.') + '</div>';
      if (!Rec) h += '<div class="tl-msg info">' + T('This browser cannot listen to Arabic. You can still read and listen to each ayah. For checking, open Noor in Chrome on an Android phone.',
        'Yeh browser Arabic nahin sun sakta. Aap padh aur sun sakte hain. Check karne ke liye Android phone par Chrome mein Noor kholiye.') + '</div>';
      data.surahs.forEach(function (sr, i) {
        var done = stars(sr.n);
        h += '<div class="tl-row" data-i="' + i + '"><div class="tx">' + esc(sr.n + '. ' + sr.name) + '<div class="sub">' + sr.v.length + ' ' + T('ayahs', 'ayaat') + (done ? ' · ⭐ ' + done + '/' + sr.v.length : '') + '</div></div><div class="ar">' + esc(sr.ar) + '</div></div>';
      });
      h += '<div class="tl-note" style="margin-top:14px">' + esc(data.src) + '</div>';
      body.innerHTML = h;
      Array.prototype.forEach.call(body.querySelectorAll('.tl-row'), function (r) { r.addEventListener('click', function () { cur = data.surahs[+r.dataset.i]; ai = firstTodo(cur); ayah(); }); });
    }
    function firstTodo(sr) { var p = prog[sr.n] || {}; for (var i = 0; i < sr.v.length; i++) if (!p[i + 1]) return i; return 0; }

    function wordsHtml(result, text) {
      // show the real (Uthmani, with marks) words coloured by the result; result.words lines up with the normalised words
      var real = String(text).split(/\s+/).filter(Boolean), res = result && result.words;
      return real.map(function (w, i) { var c = res && res[i] ? res[i].st : ''; return '<span class="' + c + '">' + esc(w) + '</span>'; }).join(' ');
    }
    function ayah(result) {
      var sr = cur, v = sr.v[ai], n = ai + 1;
      var dots = sr.v.map(function (_, i) { return '<i class="' + ((prog[sr.n] || {})[i + 1] ? 'on ' : '') + (i === ai ? 'cur' : '') + '"></i>'; }).join('');
      var msg = '';
      if (result) msg = verdict(result, v);
      body.innerHTML = '<div class="tl-note" style="text-align:center">' + esc(sr.name) + ' · ' + T('Ayah', 'Ayat') + ' ' + n + ' / ' + sr.v.length + '</div>' +
        '<div class="tl-card"><div class="tl-ar" id="tlAr">' + wordsHtml(result, v.a) + '</div><div class="tl-tr">' + esc(v.t) + '</div><div class="tl-en">' + esc(v.e) + '</div>' +
        '<div class="tl-btns"><button class="tl-b" id="tlListen">🔊 ' + T('Listen', 'Suniye') + '</button><button class="tl-b pri" id="tlRec"' + (Rec ? '' : ' disabled') + '>🎤 ' + T('Recite', 'Padhiye') + '</button></div>' +
        '<div id="tlMsg">' + (msg || (Rec ? '' : '<div class="tl-msg info">' + T('This browser cannot listen to Arabic, so checking is off. Open Noor in Chrome on Android (or Safari on iPhone, not the home-screen app) to recite.', 'Yeh browser Arabic nahin sun sakta, isliye check band hai. Android par Chrome ya iPhone par Safari (home-screen app nahin) mein Noor kholiye.') + '</div>')) + '</div>' +
        '<div class="tl-btns"><button class="tl-b" id="tlPrev"' + (ai === 0 ? ' disabled' : '') + '>‹ ' + T('Back', 'Peeche') + '</button><button class="tl-b" id="tlNext"' + (ai >= sr.v.length - 1 ? ' disabled' : '') + '>' + T('Next', 'Aage') + ' ›</button></div></div>' +
        '<div class="tl-dots">' + dots + '</div>';
      body.querySelector('#tlListen').onclick = function () { play(sr.n, n); };
      body.querySelector('#tlRec').onclick = function () { listening ? stopRec() : startRec(); };
      body.querySelector('#tlPrev').onclick = function () { stopAll(); ai--; ayah(); };
      body.querySelector('#tlNext').onclick = function () { stopAll(); ai++; ayah(); };
    }
    function verdict(r, v) {
      if (!r.heard) return '<div class="tl-msg info">' + T('I could not hear you. Tap Recite, wait a moment, then read the ayah clearly.', 'Awaaz sunai nahin di. Padhiye dabaiye, zara ruk kar saaf padhiye.') + ' <small style="opacity:.7">[' + esc((r.err_ || 'no-result') + ', ' + (r.ms_ || 0) + 'ms') + ']</small></div>';
      if (r.ok) return '<div class="tl-msg good"><b>✅ ' + T('Correct, MashaAllah!', 'Bilkul sahi, MashaAllah!') + '</b></div>';
      var real = String(v.a).split(/\s+/).filter(Boolean), lines = [];
      r.words.forEach(function (w, i) {
        if (w.st === 'wrong') lines.push('✗ ' + T('You said', 'Aap ne kaha') + ' <b class="ar">' + esc(w.heard) + '</b> · ' + T('correct word', 'sahi lafz') + ' <b class="ar">' + esc(real[i] || w.w) + '</b>');
        else if (w.st === 'missing') lines.push('✗ ' + T('You missed', 'Chhoot gaya') + ' <b class="ar">' + esc(real[i] || w.w) + '</b>');
      });
      if (r.extra.length) lines.push('✗ ' + T('Extra word', 'Zyada lafz') + ': <b class="ar">' + esc(r.extra.join(' ')) + '</b>');
      return '<div class="tl-msg bad"><b>❌ ' + T('Not quite. Listen and try again.', 'Theek nahin. Suniye aur dobara padhiye.') + '</b><br>' + lines.join('<br>') +
        '<br><span style="font-size:12.5px;opacity:.85">' + T('The correct ayah is shown above. Tap Listen to hear it.', 'Sahi ayat upar likhi hai. Sunne ke liye Suniye dabaiye.') + '</span></div>';
    }
    function pad3(x) { return ('00' + x).slice(-3); }
    function play(sn, an) {
      try { audio && audio.pause(); } catch (e) {}
      audio = new win.Audio('https://everyayah.com/data/Alafasy_128kbps/' + pad3(sn) + pad3(an) + '.mp3');
      audio.play().catch(function () { var m = body.querySelector('#tlMsg'); if (m) m.innerHTML = '<div class="tl-msg info">' + T('Could not play the recitation. Check your connection.', 'Tilawat nahin chal saki. Internet check kijiye.') + '</div>'; });
    }
    var lastEnd = 0;
    function startRec(attempt) {
      if (!Rec) return;
      attempt = attempt || 0;
      try { audio && audio.pause(); } catch (e) {}
      // Chrome on Android can refuse a recognizer started right after the previous one ended: give it a moment.
      var wait = Math.max(0, 500 - (Date.now() - lastEnd));
      var btn = body.querySelector('#tlRec'), msg = body.querySelector('#tlMsg'), v = cur.v[ai], parts = [], errCode = '', t0 = Date.now(), silence = null, hard = null, me;
      listening = true; btn.classList.add('rec'); btn.innerHTML = '⏹ ' + T('Stop', 'Ruk jaiye');
      msg.innerHTML = '<div class="tl-msg info">🎧 ' + T('Listening… read the ayah, then tap Stop.', 'Sun rahi hoon… ayat padhiye, phir Ruk jaiye dabaiye.') + '</div>';
      function finish() {
        clearTimeout(silence); clearTimeout(hard);
        if (rec !== me) return; rec = null; listening = false; lastEnd = Date.now();
        if (!doc.getElementById('tlRec')) return;
        // candidate transcripts: the recognizer's first choice for every phrase, and the same with its second choice
        var alts = [], k, j;
        for (k = 0; k < 3; k++) { var t = parts.map(function (pr) { return pr[Math.min(k, pr.length - 1)] || ''; }).join(' ').trim(); if (t && alts.indexOf(t) < 0) alts.push(t); }
        if (!alts.length && !errCode && attempt < 1 && Date.now() - t0 < 3000) { startRec(attempt + 1); return; }   // ended at once with nothing: try one more time quietly
        var r = check(v.a, alts); r.err_ = errCode; r.ms_ = Date.now() - t0; r.n_ = parts.length; ayah(r);
        if (r.ok) { var p = prog[cur.n] = prog[cur.n] || {}; p[ai + 1] = 1; saveProg(); var d = body.querySelectorAll('.tl-dots i')[ai]; if (d) d.classList.add('on'); }
      }
      setTimeout(function () {
        if (!listening) return;
        me = rec = new Rec(); me.lang = 'ar-SA'; me.interimResults = true; me.maxAlternatives = 5; me.continuous = true;
        me.onresult = function (e) {
          parts = [];
          for (var i = 0; i < e.results.length; i++) { var res = e.results[i], a = []; for (var j = 0; j < res.length; j++) a.push(res[j].transcript); parts.push(a); }
          clearTimeout(silence); silence = setTimeout(function () { try { me.stop(); } catch (x) {} }, 2200);   // done when the child pauses
        };
        me.onerror = function (e) {
          var er = e && e.error; errCode = er || 'error';
          if (er === 'not-allowed' || er === 'service-not-allowed') { listening = false; rec = null; var m = body.querySelector('#tlMsg'); if (m) m.innerHTML = '<div class="tl-msg info">' + T('Microphone or speech recognition is blocked. Allow the microphone for Noor (and, on iPhone, turn on Dictation in Settings → General → Keyboard). If Noor is installed on the home screen, try opening it in the browser instead.', 'Microphone ya speech recognition band hai. Noor ke liye microphone allow kijiye (iPhone par Settings → General → Keyboard mein Dictation on kijiye). Agar Noor home screen par install hai to browser mein kholkar dekhiye.') + ' <small>[' + esc(er) + ']</small></div>'; var bb = body.querySelector('#tlRec'); if (bb) { bb.classList.remove('rec'); bb.innerHTML = '🎤 ' + T('Recite', 'Padhiye'); } }
        };
        me.onend = finish;
        hard = setTimeout(function () { try { me.stop(); } catch (x) {} }, 25000);
        try { me.start(); } catch (e) { errCode = 'start-failed'; finish(); }
      }, wait);
    }
    function stopRec() { try { rec && rec.stop(); } catch (e) {} }

    function open() { load(home); }
    s.querySelector('#tlBack').addEventListener('click', function () { if (cur) { home(); } else { stopAll(); N.backTab(); } });
    win.NoorTilawat = { open: function () { N.showScreen('tilawat'); open(); } };   // index.html's route('tilawat') calls this
    try { if (/[?&]tilawat=1/.test(win.location.search || '')) { win.history.replaceState(null, '', win.location.pathname); setTimeout(function () { win.NoorTilawat.open(); }, 500); } } catch (e) {}
    // a card at the top of the Qur'an screen (kept if the reader repaints)
    function entry() {
      var q = doc.getElementById('screen-quran'); if (!q || q.querySelector('#tlEntry')) return;
      var c = N.el('div', 'tl-entry', '<button id="tlEntry" style="width:100%;text-align:left;display:flex;align-items:center;gap:12px;border:1px solid var(--gold-soft);background:var(--panel);border-radius:14px;padding:12px 14px;margin:6px 0 12px;font:600 14px Inter,sans-serif;color:var(--ink);cursor:pointer"><span style="font-size:24px">🎓</span><span style="flex:1">' + T('Qur\'an Learning for kids', 'Bachchon ke liye Quran sikhna') + '<span style="display:block;font-weight:400;font-size:12px;color:var(--muted)">' + T('Recite an ayah; the app checks every word', 'Ayat padhiye; app har lafz check karti hai') + '</span></span><span>›</span></button>');
      q.insertBefore(c, q.firstChild); c.querySelector('#tlEntry').addEventListener('click', function () { win.NoorTilawat.open(); });
    }
    entry(); try { new win.MutationObserver(function () { entry(); }).observe(doc.getElementById('screen-quran'), { childList: true }); } catch (e) {}
  }

  return { norm: norm, words: words, check: check, align: align, mount: mount };
});
