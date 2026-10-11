/* Noor Qur'an: page reader (13-line tajweed mushaf), surah/juz index, bookmarks, reading progress, surah audio.
 * Pure progress logic lives in NoorQuranCore (unit-tested in node); the UI part needs window.Noor. */
(function (root, factory) {
  var core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  root.NoorQuranCore = core;
  if (typeof window !== 'undefined' && window.Noor && root.NOOR_QURAN) core.mountUI(window, window.Noor, root.NOOR_QURAN);
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- pure logic ---------- */
  var READ_AFTER_MS = 6000;           // a page counts as read after it has been on screen this long
  function blank() { return { last: 1, read: {}, days: {}, goal: 2, marks: [], khatam: 0, ver: 1 }; }
  function dayKey(ms, tzOffsetMin) { // local calendar day, from a timestamp and the device offset (minutes behind UTC, as Date.getTimezoneOffset)
    var d = new Date(ms - (tzOffsetMin || 0) * 60000);
    return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2);
  }
  function clampPage(p, max) { p = Math.floor(Number(p)); if (!isFinite(p) || p < 1) return 1; return p > max ? max : p; }
  function normalize(s, max) {
    var b = blank(); s = s && typeof s === 'object' ? s : {};
    b.last = clampPage(s.last || 1, max);
    Object.keys(s.read || {}).forEach(function (k) { var p = +k; if (p >= 1 && p <= max) b.read[p] = s.read[k]; });
    Object.keys(s.days || {}).forEach(function (k) { if (/^\d{4}-\d{2}-\d{2}$/.test(k) && s.days[k] > 0) b.days[k] = Math.floor(s.days[k]); });
    b.goal = Math.max(1, Math.min(100, Math.floor(s.goal) || 2));
    b.marks = (Array.isArray(s.marks) ? s.marks : []).map(function (p) { return clampPage(p, max); }).filter(function (p, i, a) { return a.indexOf(p) === i; });
    b.khatam = Math.max(0, Math.floor(s.khatam) || 0);
    return b;
  }
  /* mark a page read once. Returns {state, newlyRead, khatamDone}. Reading all pages completes one khatam and clears the set for the next round. */
  function markRead(state, page, nowMs, tz, max) {
    page = clampPage(page, max);
    var out = { state: state, newlyRead: false, khatamDone: false };
    state.last = page;
    if (state.read[page]) return out;
    state.read[page] = nowMs; out.newlyRead = true;
    var k = dayKey(nowMs, tz); state.days[k] = (state.days[k] || 0) + 1;
    if (Object.keys(state.read).length >= max) { state.khatam += 1; state.read = {}; out.khatamDone = true; }
    return out;
  }
  function percent(state, max) { return Math.round(Object.keys(state.read).length / max * 1000) / 10; }
  function streak(state, nowMs, tz) {  // consecutive days with at least one new page; today not yet read doesn't break it
    var n = 0, t = nowMs;
    if (!state.days[dayKey(t, tz)]) t -= 86400000;
    while (state.days[dayKey(t, tz)]) { n++; t -= 86400000; }
    return n;
  }
  function today(state, nowMs, tz) { return state.days[dayKey(nowMs, tz)] || 0; }
  function toggleMark(state, page) { var i = state.marks.indexOf(page); if (i >= 0) state.marks.splice(i, 1); else state.marks.push(page); return i < 0; }
  function surahAt(surahs, page) { var r = 0; for (var i = 0; i < surahs.length; i++) { if (surahs[i][3] <= page) r = i; else break; } return r; }
  function juzAt(juz, page) { var r = 0; for (var i = 0; i < juz.length; i++) { if (juz[i] <= page) r = i; else break; } return r; }
  function pad3(n) { return ('00' + n).slice(-3); }
  function audioUrl(base, n) { return base + pad3(n) + '.mp3'; }
  function fmtTime(s) { if (!isFinite(s)) return '0:00'; s = Math.floor(s); var m = Math.floor(s / 60); return m + ':' + ('0' + (s % 60)).slice(-2); }

  /* Approximate page for a point in a surah's recitation: pages are spread evenly over the audio.
   * The PDF has no ayah timing or ayah-to-page data, so this is an estimate, not exact sync. */
  function followPage(surahs, n, frac, max) {
    var start = surahs[n - 1][3], end = n < surahs.length ? surahs[n][3] : max + 1;
    var span = Math.max(1, end - start); frac = Math.max(0, Math.min(0.999999, +frac || 0));
    return start + Math.min(span - 1, Math.floor(frac * span));
  }

  var RECITERS = [
    { id: 'afasy', name: 'Mishary Alafasy', base: 'https://cdn.mp3quran.net/audio/mishary-alafasy/r1/' },
    { id: 'maher', name: 'Maher Al-Muaiqly', base: 'https://cdn.mp3quran.net/audio/maher-muaiqly/r1/' }
  ];

  var api = { READ_AFTER_MS: READ_AFTER_MS, RECITERS: RECITERS, blank: blank, dayKey: dayKey, clampPage: clampPage, normalize: normalize, markRead: markRead,
    percent: percent, streak: streak, today: today, toggleMark: toggleMark, surahAt: surahAt, juzAt: juzAt, pad3: pad3, followPage: followPage, audioUrl: audioUrl, fmtTime: fmtTime };

  /* ---------- UI ---------- */
  api.mountUI = function (win, N, Q) {
    var doc = win.document, el = N.el, esc = N.esc, MAX = Q.pages, S = Q.surahs;
    var store = (function () { try { win.localStorage.setItem('_t', '1'); win.localStorage.removeItem('_t'); return win.localStorage; } catch (e) { return null; } })();
    function sget(k) { try { return store && store.getItem(k); } catch (e) { return null; } }
    function sset(k, v) { try { store && store.setItem(k, v); } catch (e) {} }
    var state; try { state = normalize(JSON.parse(sget('noor_quran') || 'null'), MAX); } catch (e) { state = blank(); }
    function save() { sset('noor_quran', JSON.stringify(state)); }
    var tz = function () { return new Date().getTimezoneOffset(); };
    var host = doc.querySelector('.screens').parentNode, activeScreen = 'home';
    function toast(msg) { var old = host.querySelector('.toast'); if (old) old.remove(); var t = el('div', 'toast', esc(msg)); host.appendChild(t); t.addEventListener('click', function () { t.remove(); }); setTimeout(function () { t.remove(); }, 4500); }
    function pageSrc(p) { return Q.dir + ('00' + p).slice(-3) + '.' + Q.ext; }

    /* styles */
    var css = doc.createElement('style');
    css.textContent =
      '.qhero{background:linear-gradient(135deg,var(--teal),var(--teal-deep));color:#f5f1e2;border-radius:16px;padding:16px;margin-bottom:14px;border:1px solid var(--gold-soft)}' +
      '.qhero .big{font-size:15px;font-weight:600}.qhero .sm{font-size:12.5px;opacity:.85;margin-top:2px}' +
      '.qbar{height:7px;background:rgba(255,255,255,.18);border-radius:9px;margin:12px 0 6px;overflow:hidden}.qbar i{display:block;height:100%;background:var(--gold);border-radius:9px}' +
      '.qstats{display:flex;gap:8px;margin-top:12px}.qstat{flex:1;background:rgba(255,255,255,.1);border-radius:10px;padding:8px 6px;text-align:center}.qstat b{display:block;font-size:17px}.qstat span{font-size:10.5px;opacity:.8}' +
      '.qbtn{display:inline-block;background:var(--gold);color:#1a2421;font-weight:700;border:0;border-radius:10px;padding:9px 16px;font-size:13.5px;cursor:pointer;margin-top:12px}' +
      '.qtabs{display:flex;gap:6px;margin:6px 0 12px}.qtab{flex:1;text-align:center;padding:8px 4px;border:1px solid var(--line);border-radius:10px;font-size:13px;background:var(--panel);cursor:pointer;color:var(--muted)}.qtab.on{background:var(--teal);color:#fff;border-color:var(--teal)}' +
      '.qrow{display:flex;align-items:center;gap:12px;padding:11px 4px;border-bottom:1px solid var(--line);cursor:pointer}.qrow:last-child{border-bottom:0}' +
      '.qnum{width:32px;height:32px;border-radius:50%;background:var(--panel);border:1px solid var(--gold-soft);display:flex;align-items:center;justify-content:center;font-size:12px;flex:none}' +
      '.qrow .nm{flex:1;font-size:14.5px}.qrow .nm small{display:block;color:var(--muted);font-size:11.5px}.qrow .ar{font-family:Amiri,serif;font-size:20px;color:var(--teal)}' +
      '.qplay{border:1px solid var(--line);background:var(--panel);width:34px;height:34px;border-radius:50%;font-size:13px;cursor:pointer;flex:none;color:var(--teal)}' +
      '.qread{padding:0 0 70px}.qtop{display:flex;align-items:center;gap:8px;margin-bottom:8px}.qtop .ttl{flex:1;text-align:center;font-size:13px;color:var(--muted)}' +
      '.qbtn2{border:1px solid var(--line);background:var(--panel);border-radius:10px;padding:7px 11px;font-size:15px;cursor:pointer;color:var(--ink)}.qbtn2.on{background:var(--gold);color:#1a2421;border-color:var(--gold)}' +
      '.qpagewrap{background:#fff;border-radius:6px;border:1px solid var(--line);min-height:300px;touch-action:pan-y;position:relative}.qpagewrap img{display:block;width:100%;height:auto;border-radius:6px}.qpagewrap .ld{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#888;font-size:13px;pointer-events:none}' +
      '.qnav{display:flex;align-items:center;gap:8px;margin-top:10px}.qnav input{width:64px;text-align:center;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--ink);font-size:14px}.qnav .mid{flex:1;text-align:center;font-size:12.5px;color:var(--muted)}' +
      '.qplayer{position:absolute;left:10px;right:10px;bottom:68px;background:var(--teal-deep);color:#f5f1e2;border:1px solid var(--gold);border-radius:14px;padding:9px 12px;z-index:55;display:none;box-shadow:0 6px 20px rgba(0,0,0,.3)}.qplayer.on{display:block}' +
      '.qplayer .r1{display:flex;align-items:center;gap:10px}.qplayer .t{flex:1;font-size:13px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.qplayer button.off{opacity:.5}.qplayer button{background:none;border:0;color:#f5f1e2;font-size:19px;cursor:pointer;padding:2px 6px}' +
      '.qplayer input[type=range]{width:100%;margin-top:6px;accent-color:var(--gold)}.qplayer .tm{font-size:11px;opacity:.8;display:flex;justify-content:space-between}' +
      '.qsel{width:100%;padding:9px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--ink);font-size:13.5px;margin-bottom:10px}.qnote{font-size:12px;color:var(--muted);margin:8px 2px}';
    doc.head.appendChild(css);

    /* ----- home screen (replaces the static placeholder rows, keeps the Hadith section) ----- */
    var qs = doc.getElementById('screen-quran');
    qs.innerHTML = '';
    var top = el('div', '', ''); qs.appendChild(top);
    var tabsBox = el('div', 'qtabs', ''); qs.appendChild(tabsBox);
    var listBox = el('div', 'rowlist', ''); qs.appendChild(listBox);
    var tab = 'surah';
    ['surah:Surahs', 'juz:Juz', 'marks:Bookmarks', 'stats:Progress'].forEach(function (t) {
      var p = t.split(':'), b = el('div', 'qtab', p[1]); b.dataset.t = p[0]; tabsBox.appendChild(b);
      b.addEventListener('click', function () { tab = p[0]; paintHome(); });
    });

    function hero() {
      var s = S[surahAt(S, state.last)], pct = percent(state, MAX), n = Object.keys(state.read).length;
      return '<div class="qhero"><div class="big">' + (n || state.last > 1 ? 'Continue reading' : 'Start reading') + ' · ' + esc(s[0]) + ' <span style="font-family:Amiri,serif">' + esc(s[1]) + '</span></div>' +
        '<div class="sm">Page ' + state.last + ' of ' + MAX + ' · Juz ' + (juzAt(Q.juz, state.last) + 1) + '</div>' +
        '<div class="qbar"><i style="width:' + pct + '%"></i></div><div class="sm">' + pct + '% of the Qur\'an read' + (state.khatam ? ' · ' + state.khatam + ' khatam completed' : '') + '</div>' +
        '<div class="qstats"><div class="qstat"><b>' + today(state, Date.now(), tz()) + '/' + state.goal + '</b><span>pages today</span></div>' +
        '<div class="qstat"><b>' + streak(state, Date.now(), tz()) + '</b><span>day streak</span></div><div class="qstat"><b>' + n + '</b><span>pages read</span></div></div>' +
        '<button class="qbtn" id="qResume">Open page ' + state.last + '</button></div>';
    }
    function paintHome() {
      top.innerHTML = hero();
      top.querySelector('#qResume').addEventListener('click', function () { openPage(state.last); });
      Array.prototype.forEach.call(tabsBox.children, function (b) { b.classList.toggle('on', b.dataset.t === tab); });
      listBox.innerHTML = ''; listBox.className = 'rowlist';
      if (tab === 'surah') S.forEach(function (s, i) {
        var r = el('div', 'qrow', '<div class="qnum">' + (i + 1) + '</div><div class="nm">' + esc(s[0]) + '<small>' + s[2] + ' ayahs · page ' + s[3] + '</small></div><div class="ar">' + esc(s[1]) + '</div><button class="qplay" aria-label="Play ' + esc(s[0]) + '">▶</button>');
        r.addEventListener('click', function () { openPage(s[3]); });
        r.querySelector('.qplay').addEventListener('click', function (e) { e.stopPropagation(); playSurah(i + 1); });
        listBox.appendChild(r);
      });
      if (tab === 'juz') Q.juz.forEach(function (p, i) {
        var s = S[surahAt(S, p)], r = el('div', 'qrow', '<div class="qnum">' + (i + 1) + '</div><div class="nm">Juz ' + (i + 1) + '<small>Starts in ' + esc(s[0]) + ' · page ' + p + '</small></div><div class="chev">›</div>');
        r.addEventListener('click', function () { openPage(p); }); listBox.appendChild(r);
      });
      if (tab === 'marks') {
        if (!state.marks.length) listBox.appendChild(el('div', 'qnote', 'No bookmarks yet. Tap the 🔖 button while reading to save a page.'));
        state.marks.slice().sort(function (a, b) { return a - b; }).forEach(function (p) {
          var s = S[surahAt(S, p)], r = el('div', 'qrow', '<div class="qnum">🔖</div><div class="nm">Page ' + p + '<small>' + esc(s[0]) + ' · Juz ' + (juzAt(Q.juz, p) + 1) + '</small></div><div class="chev">›</div>');
          r.addEventListener('click', function () { openPage(p); }); listBox.appendChild(r);
        });
      }
      if (tab === 'stats') {
        listBox.className = '';
        var last7 = '', max = 1, i, rows = [];
        for (i = 6; i >= 0; i--) { var k = dayKey(Date.now() - i * 86400000, tz()); rows.push([k.slice(5), state.days[k] || 0]); max = Math.max(max, state.days[k] || 0); }
        listBox.innerHTML = '<div class="qnote" style="margin-bottom:10px">Pages newly read, last 7 days</div><div style="display:flex;gap:6px;align-items:flex-end;height:90px">' +
          rows.map(function (r) { return '<div style="flex:1;text-align:center;font-size:10.5px;color:var(--muted)">' + r[1] + '<div style="background:var(--teal);height:' + Math.max(3, r[1] / max * 60) + 'px;border-radius:5px;margin:3px 0"></div>' + r[0] + '</div>'; }).join('') + '</div>' +
          '<div class="qnote" style="margin-top:16px">Daily goal (pages)</div><div class="qnav"><button class="qbtn2" id="gMinus">−</button><div class="mid" style="font-size:18px;color:var(--ink)">' + state.goal + '</div><button class="qbtn2" id="gPlus">+</button></div>' +
          '<div class="qnote">A page counts as read after it has been open for a few seconds. Progress is saved on this device only.</div>' +
          '<button class="qbtn2" id="qReset" style="margin-top:8px">Reset progress</button>';
        listBox.querySelector('#gMinus').onclick = function () { state.goal = Math.max(1, state.goal - 1); save(); paintHome(); };
        listBox.querySelector('#gPlus').onclick = function () { state.goal = Math.min(100, state.goal + 1); save(); paintHome(); };
        listBox.querySelector('#qReset').onclick = function () { if (win.confirm('Reset all reading progress, streak and bookmarks on this device?')) { state = blank(); save(); paintHome(); } };
      }
    }

    /* ----- reader screen ----- */
    var rs = el('div', 'screen', ''); rs.id = 'screen-qreader';
    rs.innerHTML =
      '<div class="qread"><div class="qtop"><button class="qbtn2" id="qBack">←</button><div class="ttl" id="qTitle"></div><button class="qbtn2" id="qPlaySur" title="Listen to this surah">🎧</button><button class="qbtn2" id="qMark" title="Bookmark">🔖</button></div>' +
      '<div class="qpagewrap" id="qWrap"><div class="ld" id="qLd">Loading page…</div><img id="qImg" alt="Qur\'an page"></div>' +
      '<div class="qnav"><button class="qbtn2" id="qNext" aria-label="Next page">←</button><div class="mid" id="qMid"></div><input id="qJump" type="number" inputmode="numeric" min="1" max="' + Q.extra + '" aria-label="Go to page"><button class="qbtn2" id="qPrev" aria-label="Previous page">→</button></div>' +
      '<div class="qnote" id="qHint">Swipe left for the next page (right-to-left, like a printed mushaf), or use the arrows. While a surah plays, pages turn along with it (approximate); turn a page yourself to pause that, tap 📖 in the player to resume.</div></div>';
    doc.querySelector('.screens').appendChild(rs);
    var img = rs.querySelector('#qImg'), ld = rs.querySelector('#qLd'), cur = state.last, readTimer = null;
    function paintMark() { rs.querySelector('#qMark').classList.toggle('on', state.marks.indexOf(cur) >= 0); }
    function show(p, auto) {
      cur = Math.max(1, Math.min(Q.extra, Math.floor(p) || 1));
      clearTimeout(readTimer);
      ld.style.display = 'flex'; ld.textContent = 'Loading page…';
      img.onload = function () { ld.style.display = 'none'; };
      img.onerror = function () { ld.style.display = 'flex'; ld.textContent = 'Could not load this page. Check your connection and try again.'; };
      img.src = pageSrc(cur);
      var preload = new win.Image(); if (cur < Q.extra) preload.src = pageSrc(cur + 1);
      var quranPage = cur <= MAX;
      var s = S[surahAt(S, quranPage ? cur : MAX)];
      rs.querySelector('#qTitle').innerHTML = quranPage ? esc(s[0]) + ' · Juz ' + (juzAt(Q.juz, cur) + 1) : 'Dua Khatm';
      rs.querySelector('#qMid').textContent = cur + ' / ' + MAX + (quranPage ? '' : ' +');
      rs.querySelector('#qJump').value = cur;
      rs.querySelector('#qPlaySur').style.display = quranPage ? '' : 'none';
      paintMark();
      if (quranPage && auto) { state.last = cur; save(); }   // turned by the audio: listening is not counted as reading
      else if (quranPage) {
        state.last = cur; save();
        readTimer = setTimeout(function () {
          var r = markRead(state, cur, Date.now(), tz(), MAX); save();
          if (r.khatamDone) toast('Alhamdulillah, you completed the Qur\'an! Khatam #' + state.khatam + '. May Allah accept it.');
          else if (r.newlyRead && today(state, Date.now(), tz()) === state.goal) toast('Daily goal reached: ' + state.goal + ' pages. MashaAllah!');
        }, READ_AFTER_MS);
      }
    }
    var follow = sget('noor_follow') !== '0', held = false;   // held = reader was turned by hand, so stop auto-turning until the user taps Follow
    function hold() { if (playing && follow) { held = true; paintFollow(); } }
    function paintFollow() {
      var b = pl.querySelector('#qpFollow'); if (!b) return;
      b.classList.toggle('off', !follow); b.title = follow ? (held ? 'Tap to jump back to the recitation' : 'Pages follow the recitation (approximate)') : 'Page following is off';
      b.textContent = follow ? (held ? '📖⏸' : '📖') : '📖✕';
    }
    function syncPage() {
      if (!follow || !playing || !audio.duration || activeScreen !== 'qreader') return;
      var p = followPage(S, playing, audio.currentTime / audio.duration, MAX);
      if (p !== cur) show(p, true);
    }
    function openPage(p) { N.showScreen('qreader'); N.setNav('quran'); show(p); }
    rs.querySelector('#qBack').onclick = function () { N.showScreen('quran'); N.setNav('quran'); };
    rs.querySelector('#qNext').onclick = function () { hold(); show(cur + 1); doc.querySelector('.screens').scrollTop = 0; };
    rs.querySelector('#qPrev').onclick = function () { hold(); show(cur - 1); doc.querySelector('.screens').scrollTop = 0; };
    rs.querySelector('#qMark').onclick = function () { var on = toggleMark(state, cur); save(); paintMark(); toast(on ? 'Page ' + cur + ' bookmarked' : 'Bookmark removed'); };
    rs.querySelector('#qPlaySur').onclick = function () { playSurah(surahAt(S, cur) + 1); };
    rs.querySelector('#qJump').addEventListener('change', function (e) { hold(); show(+e.target.value); });
    var sx = null, sy = null, wrap = rs.querySelector('#qWrap');
    wrap.addEventListener('touchstart', function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
    wrap.addEventListener('touchend', function (e) {
      if (sx === null) return; var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; sx = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { hold(); show(dx < 0 ? cur + 1 : cur - 1); doc.querySelector('.screens').scrollTop = 0; }
    }, { passive: true });

    /* ----- audio ----- */
    var audio = new win.Audio(); audio.preload = 'none';
    var recId = sget('noor_reciter') || RECITERS[0].id, playing = 0;
    function reciter() { for (var i = 0; i < RECITERS.length; i++) if (RECITERS[i].id === recId) return RECITERS[i]; return RECITERS[0]; }
    var pl = el('div', 'qplayer', '<div class="r1"><button id="qpPrev" aria-label="Previous surah">⏮</button><div class="t" id="qpTitle"></div><button id="qpFollow" aria-label="Follow along in the reader">📖</button><button id="qpToggle" aria-label="Play or pause">▶</button><button id="qpNext" aria-label="Next surah">⏭</button><button id="qpClose" aria-label="Close player">✕</button></div>' +
      '<input type="range" id="qpSeek" min="0" max="1000" value="0" aria-label="Seek"><div class="tm"><span id="qpCur">0:00</span><span id="qpDur">0:00</span></div>');
    host.appendChild(pl);
    function paintPlayer() {
      var s = S[playing - 1]; if (!s) return;
      pl.querySelector('#qpTitle').textContent = s[0] + ' · ' + reciter().name;
      pl.querySelector('#qpToggle').textContent = audio.paused ? '▶' : '⏸';
    }
    function playSurah(n) {
      if (n < 1 || n > 114) return;
      held = false; playing = n; audio.src = audioUrl(reciter().base, n); pl.classList.add('on'); paintPlayer(); paintFollow();
      if (follow && activeScreen === 'qreader') show(S[n - 1][3], true);
      var pr = audio.play(); if (pr && pr.catch) pr.catch(function () { paintPlayer(); toast('Could not start audio. Recitation streams from the internet, so it needs a connection.'); });
      if ('mediaSession' in win.navigator && win.MediaMetadata) {
        try {
          win.navigator.mediaSession.metadata = new win.MediaMetadata({ title: S[n - 1][0], artist: reciter().name, album: 'Noor · Qur\'an' });
          win.navigator.mediaSession.setActionHandler('previoustrack', function () { playSurah(playing - 1); });
          win.navigator.mediaSession.setActionHandler('nexttrack', function () { playSurah(playing + 1); });
        } catch (e) {}
      }
    }
    audio.addEventListener('play', paintPlayer); audio.addEventListener('pause', paintPlayer);
    audio.addEventListener('ended', function () { if (playing < 114) playSurah(playing + 1); else paintPlayer(); });
    audio.addEventListener('error', function () { if (playing) toast('Audio failed to load. Check your connection, or try another reciter.'); });
    audio.addEventListener('timeupdate', function () {
      pl.querySelector('#qpCur').textContent = fmtTime(audio.currentTime); pl.querySelector('#qpDur').textContent = fmtTime(audio.duration);
      if (audio.duration) pl.querySelector('#qpSeek').value = Math.round(audio.currentTime / audio.duration * 1000);
      if (!held) syncPage();
    });
    pl.querySelector('#qpSeek').addEventListener('input', function (e) { if (audio.duration) audio.currentTime = e.target.value / 1000 * audio.duration; });
    pl.querySelector('#qpFollow').onclick = function () {
      if (follow && held) { held = false; syncPage(); }                       // jump back to where the reciter is
      else { follow = !follow; held = false; sset('noor_follow', follow ? '1' : '0'); if (follow) syncPage(); toast(follow ? 'Pages will follow the recitation (approximate)' : 'Page following off'); }
      paintFollow();
    };
    pl.querySelector('#qpToggle').onclick = function () { if (audio.paused) audio.play(); else audio.pause(); };
    pl.querySelector('#qpPrev').onclick = function () { playSurah(playing - 1); };
    pl.querySelector('#qpNext').onclick = function () { playSurah(playing + 1); };
    pl.querySelector('#qpClose').onclick = function () { held = false; audio.pause(); audio.removeAttribute('src'); playing = 0; pl.classList.remove('on'); };
    // reciter picker sits above the tabs
    var sel = el('select', 'qsel', RECITERS.map(function (r) { return '<option value="' + r.id + '">' + esc(r.name) + '</option>'; }).join(''));
    sel.setAttribute('aria-label', 'Reciter'); sel.value = recId;
    sel.addEventListener('change', function () { recId = sel.value; sset('noor_reciter', recId); if (playing) { var t = audio.currentTime; playSurah(playing); audio.addEventListener('loadedmetadata', function f() { audio.removeEventListener('loadedmetadata', f); try { audio.currentTime = t; } catch (e) {} }); } });
    qs.insertBefore(sel, tabsBox);
    qs.insertBefore(el('div', 'qnote', 'Recitation streams from mp3quran.net and needs an internet connection. Pages are cached on this device as you read them.'), tabsBox);

    /* Home screen "Continue reading" row: shows the real place and opens the reader there. */
    var hc = doc.getElementById('homeContinue');
    function paintContinue() {
      if (!hc) return;
      var started = Object.keys(state.read).length || state.khatam || state.last > 1, s = S[surahAt(S, state.last)];
      doc.getElementById('hcTitle').textContent = started ? 'Surah ' + s[0] : 'Qur\'an';
      doc.getElementById('hcSub').textContent = started ? 'Page ' + state.last + ' of ' + MAX + ' · resume' : 'Start reading · page 1 of ' + MAX;
    }
    if (hc) { var hc2 = hc.cloneNode(true); hc.parentNode.replaceChild(hc2, hc); hc = hc2; hc.addEventListener('click', function () { openPage(state.last); }); }
    paintContinue();
    N.onScreen(function (id) { activeScreen = id; if (id === 'quran') paintHome(); paintContinue(); if (id !== 'qreader') clearTimeout(readTimer); });
    paintHome();
    N.quran = { open: openPage, play: playSurah, state: function () { return state; } };
  };
  return api;
});
