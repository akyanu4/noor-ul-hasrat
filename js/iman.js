/* Noor: "Iman Health", a private weekly check on prayer, dhikr and fasting.
   Everything is typed in by the person and kept in this browser only. Nothing is sent anywhere and no location is used. */
(function (root) {
  'use strict';

  var PRAYERS = [['fajr', 'Fajr'], ['dhuhr', 'Dhuhr'], ['asr', 'Asr'], ['maghrib', 'Maghrib'], ['isha', 'Isha']];
  var MARKS = { m: ['🕌', 'On time, at the masjid'], h: ['🏠', 'On time, at home'], l: ['⏰', 'Late or made up'] };
  var KEY = 'noor_iman_v1';

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function lastDays(n, from) { var out = [], d = new Date(from.getFullYear(), from.getMonth(), from.getDate()); for (var i = n - 1; i >= 0; i--) { var x = new Date(d); x.setDate(d.getDate() - i); out.push(x); } return out; }
  function fmtN(n) { return n >= 10000 ? Math.round(n / 1000) + 'k' : n >= 1000 ? (Math.round(n / 100) / 10) + 'k' : String(n); }

  // Add up a set of days: { marked, onTime, masjid, late, fasts, dhikr, days }
  function summarize(data, keys) {
    var s = { marked: 0, onTime: 0, masjid: 0, late: 0, fasts: 0, dhikr: 0, days: keys.length };
    keys.forEach(function (k) {
      var d = data[k]; if (!d) return;
      PRAYERS.forEach(function (p) { var v = d.p && d.p[p[0]]; if (!v) return; s.marked++; if (v === 'm') { s.onTime++; s.masjid++; } else if (v === 'h') s.onTime++; else s.late++; });
      if (d.fast) s.fasts++;
      s.dhikr += d.dhikr || 0;
    });
    return s;
  }
  // Weekly level, 0-100: prayers 60 (masjid on time counts most), fasting 20, dhikr 20. A private reminder, never a judgment.
  var W = { m: 1, h: 0.85, l: 0.5 };
  function score(data, keys, fastTarget) {
    var n = keys.length || 1, pr = 0, fasts = 0, dhikrDays = 0, any = false;
    keys.forEach(function (k) {
      var d = data[k]; if (!d) return;
      PRAYERS.forEach(function (p) { var v = d.p && d.p[p[0]]; if (v) { pr += W[v] || 0; any = true; } });
      if (d.fast) { fasts++; any = true; }
      if ((d.dhikr || 0) >= 33) { dhikrDays++; any = true; }
    });
    var parts = { prayer: Math.min(1, pr / (5 * n)), fast: Math.min(1, fasts / (fastTarget || 2)), dhikr: Math.min(1, dhikrDays / n) };
    var total = Math.round(parts.prayer * 60 + parts.fast * 20 + parts.dhikr * 20);
    var label = !any ? 'Not started yet' : total >= 85 ? 'Flourishing' : total >= 65 ? 'Steady' : total >= 40 ? 'Growing' : 'Just beginning';
    var tip = !any ? 'Mark today\'s prayers to begin.' : parts.prayer < 0.7 ? 'A small step: aim to pray each prayer on time, starting with one you often miss.' : parts.fast < 1 ? 'A small step: a Monday or Thursday fast this week.' : parts.dhikr < 0.7 ? 'A small step: 33 dhikr each day, after any prayer.' : 'Keep it up, and may Allah accept it.';
    return { score: total, label: label, parts: parts, tip: tip };
  }
  // A kind note about the week. Never a score, never guilt.
  function note(s) {
    if (!s.marked && !s.fasts && !s.dhikr) return 'Begin gently: mark the prayers you have prayed today.';
    if (s.late && s.late >= s.onTime) return 'Every prayer prayed is a gain. Small, steady steps are loved by Allah.';
    if (s.masjid >= 5) return 'Masha Allah, you have been regular in the masjid this week.';
    if (s.onTime >= 25) return 'Masha Allah, a steady week. May Allah accept it.';
    return 'Keep going, one prayer at a time. Consistency matters more than counts.';
  }
  // Hint about today's fast: Ramadan, the white days, or a Monday/Thursday.
  function fastHint(date) {
    try {
      var parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric' }).formatToParts(date), hd = 0, hm = 0;
      parts.forEach(function (p) { if (p.type === 'day') hd = +p.value; if (p.type === 'month') hm = +p.value; });
      if (hm === 9) return 'Ramadan';
      if (hd >= 13 && hd <= 15 && hm !== 12) return 'A white day (13th-15th), a sunnah fast';
    } catch (e) {}
    var w = date.getDay(); if (w === 1 || w === 4) return (w === 1 ? 'Monday' : 'Thursday') + ', a sunnah day to fast';
    return '';
  }

  function meters(a, b, c, d) {                       // distance between two points on Earth, in metres
    var R = 6371000, p = Math.PI / 180, dl = (c - a) * p, dn = (d - b) * p;
    var h = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a * p) * Math.cos(c * p) * Math.sin(dn / 2) * Math.sin(dn / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  // Which prayer is "in its window" right now? From 10 minutes before the adhan until 75 minutes after it (never past the next prayer).
  function windowFor(t, now) {
    if (!t) return null;
    var M = 60000, ends = { fajr: t.sunrise, dhuhr: t.asr, asr: t.maghrib, maghrib: t.isha, isha: t.isha + 90 * M };
    for (var i = 0; i < PRAYERS.length; i++) {
      var k = PRAYERS[i][0], from = t[k] - 10 * M, to = Math.min(t[k] + 75 * M, ends[k]);
      if (now >= from && now <= to) return k;
    }
    return null;
  }

  var api = { score: score, meters: meters, windowFor: windowFor, PRAYERS: PRAYERS, dayKey: dayKey, lastDays: lastDays, summarize: summarize, note: note, fastHint: fastHint, fmtN: fmtN };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NoorIman = api;

  var N = root.Noor, doc = root.document;
  if (!N || !doc) return;

  var data = {};
  try { data = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { data = {}; }
  function save() {
    var ks = Object.keys(data).sort(); while (ks.length > 400) delete data[ks.shift()];
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }
  function esc(t) { return N.esc(t); }
  function day(k) { return data[k] || (data[k] = { p: {} }); }
  var MKEY = 'noor_iman_masjids', AKEY = 'noor_iman_auto', RADIUS = 150, masjids = [], autoOn = true, lastCheck = '', busy = false;
  try { masjids = JSON.parse(localStorage.getItem(MKEY) || '[]') || []; if (!Array.isArray(masjids)) masjids = []; } catch (e) { masjids = []; }
  try { autoOn = localStorage.getItem(AKEY) !== '0'; } catch (e) {}
  var NKEY = 'noor_iman_nudge', nudgeOn = false, nudgeMsg = '';
  try { nudgeOn = localStorage.getItem(NKEY) === '1'; } catch (e) {}
  function pushReady() { return !!(root.NOOR_CONFIG && root.NOOR_CONFIG.oneSignalAppId); }
  function withPush(fn) { if (!pushReady()) return; root.OneSignalDeferred = root.OneSignalDeferred || []; root.OneSignalDeferred.push(function (OS) { try { return fn(OS); } catch (e) {} }); }
  // Tell the push service which listed city is nearest, so the server can send that city's prayer times. Only the city name leaves the phone.
  function tagCity(OS) {
    var l = null; try { l = JSON.parse(localStorage.getItem('noor_loc') || 'null'); } catch (e) {}
    if (!l || typeof l.lat !== 'number') l = { lat: 17.385, lon: 78.4867 };      // the Prayer Times screen starts on Hyderabad until another place is chosen
    var c = l && typeof l.lat === 'number' && root.NoorCities ? root.NoorCities.nearest(l.lat, l.lon, 100) : null;
    if (c) { OS.User.addTag('city', c.name); return c.name; }
    OS.User.addTag('city', ''); return '';
  }
  function setNudge(on) {
    if (!on) { nudgeOn = false; try { localStorage.setItem(NKEY, '0'); } catch (e) {} nudgeMsg = ''; withPush(function (OS) { OS.User.addTag('nudge', '0'); }); paint(); return; }
    if (!pushReady()) { nudgeMsg = 'Notifications are not switched on for this app yet.'; paint(); return; }
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !(root.matchMedia && root.matchMedia('(display-mode: standalone)').matches)) { nudgeMsg = 'On iPhone, add Noor to your Home Screen first, then turn this on.'; paint(); return; }
    withPush(function (OS) {
      return OS.Notifications.requestPermission().then(function () {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          var city = tagCity(OS); OS.User.addTag('nudge', '1'); nudgeOn = true; try { localStorage.setItem(NKEY, '1'); } catch (e) {}
          nudgeMsg = city ? 'On. You will get a nudge at each prayer time in ' + city + '. Times are within a few minutes.' : 'On, but your place is not near a city on our list yet, so no nudges will arrive. Choose the nearest city under Prayer Times.';
        } else nudgeMsg = 'Notifications are blocked. Allow them in your browser or phone settings.';
        paint();
      });
    });
  }
  function saveMasjids() { try { localStorage.setItem(MKEY, JSON.stringify(masjids)); } catch (e) {} }
  function getPos(ok, bad) {
    if (!navigator.geolocation) { bad({ code: 0 }); return; }
    navigator.geolocation.getCurrentPosition(ok, bad, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }
  function toast(t) { var host = doc.querySelector('.screens').parentNode, old = host.querySelector('.toast'); if (old) old.remove(); var e = N.el('div', 'toast', esc(t)); host.appendChild(e); e.addEventListener('click', function () { e.remove(); }); setTimeout(function () { e.remove(); }, 4500); }

  var css = doc.createElement('style');
  css.textContent =
    '.ih-sum{background:linear-gradient(135deg,var(--teal),#0f3a33);color:#f5f1e2;border-radius:16px;padding:14px 16px;margin-bottom:12px}.ih-sum .k{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--gold-soft);font-weight:700}' +
    '.ih-nums{display:flex;gap:6px;margin:8px 0}.ih-n{flex:1;text-align:center;background:rgba(255,255,255,.1);border-radius:10px;padding:8px 2px}.ih-n b{display:block;font-size:19px}.ih-n span{font-size:10.5px;opacity:.85}.ih-sum .nt{font-size:12.5px;opacity:.92;line-height:1.45}' +
    '.ih-lv{display:flex;align-items:center;gap:14px;margin-bottom:6px}.ih-ring{position:relative;width:76px;height:76px;flex:none}.ih-ring svg{width:76px;height:76px;transform:rotate(-90deg)}.ih-ring b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:20px}.ih-lv .lb{font-size:20px;font-weight:700}.ih-lv .pt{font-size:11.5px;opacity:.85;margin-top:2px}.ih-dot{display:block;width:6px;height:6px;border-radius:50%;margin:3px auto 0;background:var(--line)}.ih-dot.g{background:#4caf7d}.ih-dot.y{background:var(--gold)}' +
    '.ih-days{display:flex;gap:5px;margin-bottom:10px}.ih-d{flex:1;text-align:center;padding:7px 0;border-radius:10px;border:1px solid var(--line);background:var(--panel);font-size:11px;color:var(--muted);cursor:pointer}.ih-d b{display:block;font-size:14px;color:var(--ink)}.ih-d.on{background:var(--teal);border-color:var(--teal);color:#e9e4d2}.ih-d.on b{color:#fff}' +
    '.ih-card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:6px 12px;margin-bottom:10px}.ih-row{display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--line)}.ih-row:last-child{border-bottom:0}.ih-row .nm{flex:1;font-size:14.5px;font-weight:600}' +
    '.ih-chip{width:42px;height:38px;border-radius:10px;border:1px solid var(--line);background:var(--cream);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:.55}.ih-chip.on{opacity:1;background:var(--gold-soft);border-color:var(--gold)}' +
    '.ih-sub{font-size:12px;color:var(--muted);line-height:1.5}.ih-fast{display:flex;align-items:center;gap:10px;padding:10px 0}.ih-fast .tx{flex:1}.ih-fast .tx b{font-size:14.5px}' +
    '.ih-sw{width:46px;height:26px;border-radius:13px;background:var(--line);position:relative;cursor:pointer;border:0;flex:none}.ih-sw i{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .15s}.ih-sw.on{background:var(--teal)}.ih-sw.on i{left:23px}' +
    '.ih-tbl{width:100%;border-collapse:collapse;font-size:12px;text-align:center}.ih-tbl th{font-weight:600;color:var(--muted);padding:4px 0}.ih-tbl td{padding:5px 0;border-top:1px solid var(--line)}.ih-tbl td:first-child,.ih-tbl th:first-child{text-align:left;padding-left:2px}.ih-tbl .tod{color:var(--teal);font-weight:700}' +
    '.ih-note{font-size:11.5px;color:var(--muted);line-height:1.55;margin:10px 2px}.ih-clear{background:none;border:0;color:var(--muted);text-decoration:underline;font:inherit;font-size:12px;cursor:pointer;padding:6px 2px}';
  doc.head.appendChild(css);

  var s = N.el('div', 'screen', '<div class="subhead"><div class="backbtn" id="ihBack">←</div><div class="subtitle">Iman Health</div></div><div id="ihBody"></div>');
  s.id = 'screen-iman'; doc.querySelector('.screens').appendChild(s);
  s.querySelector('#ihBack').addEventListener('click', function () { N.backTab(); });
  var body = s.querySelector('#ihBody'), sel = dayKey(new Date());

  function dotOf(k) { var n = 0, d = data[k]; if (d && d.p) PRAYERS.forEach(function (p) { if (d.p[p[0]]) n++; }); return n >= 5 ? 'g' : n >= 1 ? 'y' : ''; }
  function paint() {
    var now = new Date(), week = lastDays(7, now), keys = week.map(dayKey), sm = summarize(data, keys), d = data[sel] || { p: {} }, selDate = week[keys.indexOf(sel)] || now;
    var isToday = sel === dayKey(now), names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var fastTarget = 2; try { if (fastHint(now) === 'Ramadan') fastTarget = 7; } catch (e) {}
    var lv = score(data, keys, fastTarget), pc = function (x) { return Math.round(x * 100) + '%'; }, C = 2 * Math.PI * 32;
    var h = '<div class="ih-sum"><div class="k">Your Iman Health · last 7 days</div><div class="ih-lv"><div class="ih-ring"><svg viewBox="0 0 76 76"><circle cx="38" cy="38" r="32" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="7"/><circle cx="38" cy="38" r="32" fill="none" stroke="#e7d4a3" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + (C * lv.score / 100).toFixed(1) + ' ' + C.toFixed(1) + '"/></svg><b>' + lv.score + '</b></div>' +
      '<div><div class="lb">' + esc(lv.label) + '</div><div class="pt">Prayer ' + pc(lv.parts.prayer) + ' · Fasting ' + pc(lv.parts.fast) + ' · Dhikr ' + pc(lv.parts.dhikr) + '</div></div></div><div class="ih-nums">' +
      '<div class="ih-n"><b>' + sm.onTime + '</b><span>on time</span></div><div class="ih-n"><b>' + sm.masjid + '</b><span>at the masjid</span></div><div class="ih-n"><b>' + sm.fasts + '</b><span>fasts</span></div><div class="ih-n"><b>' + fmtN(sm.dhikr) + '</b><span>dhikr</span></div></div>' +
      '<div class="nt">' + esc(lv.tip) + '</div></div>';
    h += '<div class="ih-days">' + week.map(function (x, i) { return '<div class="ih-d' + (keys[i] === sel ? ' on' : '') + '" data-k="' + keys[i] + '">' + (i === 6 ? 'Today' : names[x.getDay()]) + '<b>' + x.getDate() + '</b><i class="ih-dot ' + dotOf(keys[i]) + '"></i></div>'; }).join('') + '</div>';
    h += '<h2 class="section-title" style="margin-top:4px">' + (isToday ? 'Today' : selDate.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })) + ' · Prayers</h2><div class="ih-card">' +
      PRAYERS.map(function (p) {
        return '<div class="ih-row"><div class="nm">' + p[1] + (d.a && d.a[p[0]] ? ' <span class="ih-sub" style="font-weight:400">· auto</span>' : '') + '</div>' + ['m', 'h', 'l'].map(function (m) { return '<button type="button" class="ih-chip' + (d.p && d.p[p[0]] === m ? ' on' : '') + '" data-p="' + p[0] + '" data-m="' + m + '" aria-label="' + p[1] + ': ' + MARKS[m][1] + '" title="' + MARKS[m][1] + '">' + MARKS[m][0] + '</button>'; }).join('') + '</div>';
      }).join('') + '</div><div class="ih-sub" style="margin:-4px 2px 10px">🕌 on time at the masjid · 🏠 on time at home · ⏰ late or made up. Tap again to clear.</div>';
    var hint = fastHint(selDate);
    h += '<h2 class="section-title" style="margin-top:4px">Fasting</h2><div class="ih-card"><div class="ih-fast"><div class="tx"><b>I fasted this day</b>' + (hint ? '<div class="ih-sub">' + esc(hint) + '</div>' : '') + '</div><button type="button" class="ih-sw' + (d.fast ? ' on' : '') + '" id="ihFast" aria-label="I fasted this day" aria-pressed="' + (d.fast ? 'true' : 'false') + '"><i></i></button></div></div>';
    h += '<h2 class="section-title" style="margin-top:4px">Dhikr</h2><div class="ih-card"><div class="ih-fast"><div class="tx"><b>' + (d.dhikr || 0).toLocaleString() + ' counted</b><div class="ih-sub">Counted automatically from your Tasbeeh' + (isToday ? '' : ' on this day') + '.</div></div><div class="tbtn" id="ihTas" style="margin:0">📿 Tasbeeh</div></div></div>';
    h += '<h2 class="section-title" style="margin-top:4px">Prayer-time nudge</h2><div class="ih-card"><div class="ih-fast"><div class="tx"><b>Nudge me at each prayer time</b><div class="ih-sub">' + esc(nudgeMsg || 'A gentle notification at each adhan. Tap it and Noor opens, then marks your masjid prayer if you are there.') + '</div></div><button type="button" class="ih-sw' + (nudgeOn ? ' on' : '') + '" id="ihNudge" aria-label="Nudge me at each prayer time" aria-pressed="' + (nudgeOn ? 'true' : 'false') + '"><i></i></button></div></div>';
    h += '<h2 class="section-title" style="margin-top:4px">My masjid</h2><div class="ih-card">';
    if (!masjids.length) h += '<div class="ih-fast"><div class="tx"><b>Mark the masjid automatically</b><div class="ih-sub">Stand at your masjid and tap the button once. After that, when Noor is open during a prayer time and you are there, it marks 🕌 for you.</div></div></div>';
    else h += masjids.map(function (m, i) { return '<div class="ih-row"><div class="nm">🕌 ' + esc(m.name) + '</div><button type="button" class="ih-clear" data-rm="' + i + '">Remove</button></div>'; }).join('') +
      '<div class="ih-fast"><div class="tx"><b>Mark it for me</b><div class="ih-sub">' + (lastCheck ? esc(lastCheck) : 'Checks while Noor is open, during a prayer time.') + '</div></div><button type="button" class="ih-sw' + (autoOn ? ' on' : '') + '" id="ihAuto" aria-label="Mark the masjid automatically" aria-pressed="' + (autoOn ? 'true' : 'false') + '"><i></i></button></div>';
    if (masjids.length < 3) h += '<div style="padding:4px 0 10px"><div class="tbtn" id="ihAdd" style="margin:0">📍 I am at my masjid now: save it</div></div>';
    h += '</div><div class="ih-sub" style="margin:-4px 2px 10px">Your position is checked on the phone and is never saved or sent: only the masjid you choose is kept. A website can only check while the app is open. It cannot watch in the background.</div>';
    h += '<h2 class="section-title" style="margin-top:4px">This week at a glance</h2><div class="ih-card" style="padding:8px 8px"><table class="ih-tbl"><tr><th></th>' + week.map(function (x, i) { return '<th class="' + (i === 6 ? 'tod' : '') + '">' + names[x.getDay()].slice(0, 2) + '</th>'; }).join('') + '</tr>' +
      PRAYERS.map(function (p) { return '<tr><td>' + p[1] + '</td>' + keys.map(function (k) { var v = data[k] && data[k].p && data[k].p[p[0]]; return '<td>' + (v ? MARKS[v][0] : '·') + '</td>'; }).join('') + '</tr>'; }).join('') +
      '<tr><td>Fast</td>' + keys.map(function (k) { return '<td>' + (data[k] && data[k].fast ? '🌙' : '·') + '</td>'; }).join('') + '</tr>' +
      '<tr><td>Dhikr</td>' + keys.map(function (k) { var n = data[k] && data[k].dhikr; return '<td>' + (n ? fmtN(n) : '·') + '</td>'; }).join('') + '</tr></table></div>';
    h += '<div class="ih-note"><b>How the level is worked out:</b> 60% prayers (at the masjid counts most, then on time at home, then late), 20% fasting (2 days a week, or every day in Ramadan) and 20% dhikr (33 or more on a day). Dots under each day: green means all 5 prayers marked, gold means some.</div>';
    h += '<div class="ih-note">This is between you and your Lord. It is a private reminder, not a score, and it is not a judgment. Everything stays on this phone and nothing is sent anywhere. Your location is used only to see whether you are at the masjid you saved, and it is not stored. You can always correct a mark yourself.</div>' +
      '<button type="button" class="ih-clear" id="ihClear">Erase my Iman Health data from this phone</button>';
    body.innerHTML = h;
  }

  body.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-k],[data-p],[data-rm],#ihNudge,#ihFast,#ihTas,#ihClear,#ihAuto,#ihAdd') : null; if (!t) return;
    if (t.hasAttribute('data-k')) { sel = t.getAttribute('data-k'); paint(); return; }
    if (t.hasAttribute('data-p')) { var d = day(sel), p = t.getAttribute('data-p'), m = t.getAttribute('data-m'); d.p[p] = d.p[p] === m ? '' : m; if (!d.p[p]) delete d.p[p]; if (d.a) delete d.a[p]; save(); paint(); return; }
    if (t.id === 'ihFast') { var f = day(sel); f.fast = !f.fast; if (!f.fast) delete f.fast; save(); paint(); return; }
    if (t.id === 'ihNudge') { setNudge(!nudgeOn); return; }
    if (t.hasAttribute('data-rm')) { masjids.splice(+t.getAttribute('data-rm'), 1); saveMasjids(); paint(); return; }
    if (t.id === 'ihAuto') { autoOn = !autoOn; try { localStorage.setItem(AKEY, autoOn ? '1' : '0'); } catch (er) {} paint(); if (autoOn) check('toggle'); return; }
    if (t.id === 'ihAdd') {
      t.textContent = 'Finding where you are…';
      getPos(function (p) {
        var nm = root.prompt('Name this masjid', 'My masjid'); if (nm === null) { paint(); return; }
        masjids.push({ name: (nm || 'My masjid').slice(0, 40), lat: p.coords.latitude, lon: p.coords.longitude }); saveMasjids();
        try { localStorage.setItem('noor_iman_geo_ok', '1'); } catch (er) {}
        lastCheck = 'Saved. It will check during prayer times while Noor is open.'; paint(); check('saved');
      }, function (er) { lastCheck = er && er.code === 1 ? 'Location is blocked. Allow it for Noor in your phone or browser settings, then try again.' : 'Could not get your location. Try again outside or near a window.'; paint(); });
      return;
    }
    if (t.id === 'ihTas') { N.route('tasbeeh'); return; }
    if (t.id === 'ihClear') { if (root.confirm('Erase all Iman Health entries on this phone? This cannot be undone.')) { data = {}; try { localStorage.removeItem(KEY); } catch (er) {} paint(); } }
  });

  // While Noor is open: if it is a prayer time and you are at your saved masjid, mark that prayer.
  function check(why) {
    if (busy || !autoOn || !masjids.length || doc.hidden || !root.NoorCore) return;
    var now = Date.now(), m0 = masjids[0], ps = { method: 'karachi', asr: 'hanafi' };
    try { var sv = JSON.parse(localStorage.getItem('noor_prayer') || '{}'); if (sv.method) ps.method = sv.method; if (sv.asr) ps.asr = sv.asr; } catch (e) {}
    var tz = 'UTC'; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) {}
    var ymd; try { ymd = root.NoorCore.civilDate ? root.NoorCore.civilDate(now, tz) : null; } catch (e) { ymd = null; }
    if (!ymd) { var dt = new Date(now); ymd = [dt.getFullYear(), dt.getMonth() + 1, dt.getDate()]; }
    var times = root.NoorCore.prayerTimes(ymd[0], ymd[1], ymd[2], m0.lat, m0.lon, ps), pk = windowFor(times, now);
    if (!pk) return;
    var key = dayKey(new Date(now)), dd = data[key];
    if (dd && dd.p && dd.p[pk]) return;                                  // already marked: no need to look at the location
    var okState = true;
    try { okState = localStorage.getItem('noor_iman_geo_ok') === '1'; } catch (e) {}
    if (!okState && why !== 'toggle') return;                           // never ask for location unprompted
    busy = true;
    getPos(function (p) {
      busy = false;
      var near = null; masjids.forEach(function (m) { var d = meters(p.coords.latitude, p.coords.longitude, m.lat, m.lon); if (d <= Math.max(RADIUS, Math.min(p.coords.accuracy || 0, 300)) && (!near || d < near.d)) near = { m: m, d: d }; });
      var label = PRAYERS.filter(function (x) { return x[0] === pk; })[0][1], clock = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      if (near) {
        var d2 = day(key); if (!d2.p[pk]) { d2.p[pk] = 'm'; d2.a = d2.a || {}; d2.a[pk] = 1; save(); }
        lastCheck = clock + ': at ' + near.m.name + ', ' + label + ' marked 🕌'; toast(label + ' marked at ' + near.m.name + ' 🕌');
      } else lastCheck = clock + ': not at your masjid (' + label + ' time)';
      if (s.classList.contains('active')) paint();
    }, function (er) {
      busy = false;
      lastCheck = er && er.code === 1 ? 'Location is blocked, so it cannot check. Allow it in your settings.' : '';
      if (s.classList.contains('active')) paint();
    });
  }
  if (nudgeOn) withPush(function (OS) { tagCity(OS); });
  if (/[?&]nudge=1/.test(root.location.search || '')) {
    try { root.history.replaceState(null, '', root.location.pathname); } catch (e) {}
    setTimeout(function () { N.route('iman'); }, 700);
  }
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) check('open'); });
  setInterval(function () { check('tick'); }, 180000);
  setTimeout(function () { check('open'); }, 2500);

  // Dhikr is added up from the Tasbeeh counter whenever it goes up.
  var last = N.tasbeeh ? N.tasbeeh.get() : 0;
  if (N.onTasbeeh) N.onTasbeeh(function (c) { var dl = c - last; last = c; if (dl > 0) { var d = day(dayKey(new Date())); d.dhikr = (d.dhikr || 0) + dl; save(); } });
  N.onScreen(function (id) { if (id === 'iman') { sel = dayKey(new Date()); paint(); check('screen'); } });
})(typeof self !== 'undefined' ? self : this);
