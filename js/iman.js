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

  var api = { PRAYERS: PRAYERS, dayKey: dayKey, lastDays: lastDays, summarize: summarize, note: note, fastHint: fastHint, fmtN: fmtN };
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
  function day(k) { return data[k] || (data[k] = { p: {} }); }

  var css = doc.createElement('style');
  css.textContent =
    '.ih-sum{background:linear-gradient(135deg,var(--teal),#0f3a33);color:#f5f1e2;border-radius:16px;padding:14px 16px;margin-bottom:12px}.ih-sum .k{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--gold-soft);font-weight:700}' +
    '.ih-nums{display:flex;gap:6px;margin:8px 0}.ih-n{flex:1;text-align:center;background:rgba(255,255,255,.1);border-radius:10px;padding:8px 2px}.ih-n b{display:block;font-size:19px}.ih-n span{font-size:10.5px;opacity:.85}.ih-sum .nt{font-size:12.5px;opacity:.92;line-height:1.45}' +
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
  function esc(t) { return N.esc(t); }

  function paint() {
    var now = new Date(), week = lastDays(7, now), keys = week.map(dayKey), sm = summarize(data, keys), d = data[sel] || { p: {} }, selDate = week[keys.indexOf(sel)] || now;
    var isToday = sel === dayKey(now), names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var h = '<div class="ih-sum"><div class="k">Your last 7 days</div><div class="ih-nums">' +
      '<div class="ih-n"><b>' + sm.onTime + '</b><span>on time</span></div><div class="ih-n"><b>' + sm.masjid + '</b><span>at the masjid</span></div><div class="ih-n"><b>' + sm.fasts + '</b><span>fasts</span></div><div class="ih-n"><b>' + fmtN(sm.dhikr) + '</b><span>dhikr</span></div></div>' +
      '<div class="nt">' + esc(note(sm)) + '</div></div>';
    h += '<div class="ih-days">' + week.map(function (x, i) { return '<div class="ih-d' + (keys[i] === sel ? ' on' : '') + '" data-k="' + keys[i] + '">' + (i === 6 ? 'Today' : names[x.getDay()]) + '<b>' + x.getDate() + '</b></div>'; }).join('') + '</div>';
    h += '<h2 class="section-title" style="margin-top:4px">' + (isToday ? 'Today' : selDate.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })) + ' · Prayers</h2><div class="ih-card">' +
      PRAYERS.map(function (p) {
        return '<div class="ih-row"><div class="nm">' + p[1] + '</div>' + ['m', 'h', 'l'].map(function (m) { return '<button type="button" class="ih-chip' + (d.p && d.p[p[0]] === m ? ' on' : '') + '" data-p="' + p[0] + '" data-m="' + m + '" aria-label="' + p[1] + ': ' + MARKS[m][1] + '" title="' + MARKS[m][1] + '">' + MARKS[m][0] + '</button>'; }).join('') + '</div>';
      }).join('') + '</div><div class="ih-sub" style="margin:-4px 2px 10px">🕌 on time at the masjid · 🏠 on time at home · ⏰ late or made up. Tap again to clear.</div>';
    var hint = fastHint(selDate);
    h += '<h2 class="section-title" style="margin-top:4px">Fasting</h2><div class="ih-card"><div class="ih-fast"><div class="tx"><b>I fasted this day</b>' + (hint ? '<div class="ih-sub">' + esc(hint) + '</div>' : '') + '</div><button type="button" class="ih-sw' + (d.fast ? ' on' : '') + '" id="ihFast" aria-label="I fasted this day" aria-pressed="' + (d.fast ? 'true' : 'false') + '"><i></i></button></div></div>';
    h += '<h2 class="section-title" style="margin-top:4px">Dhikr</h2><div class="ih-card"><div class="ih-fast"><div class="tx"><b>' + (d.dhikr || 0).toLocaleString() + ' counted</b><div class="ih-sub">Counted automatically from your Tasbeeh' + (isToday ? '' : ' on this day') + '.</div></div><div class="tbtn" id="ihTas" style="margin:0">📿 Tasbeeh</div></div></div>';
    h += '<h2 class="section-title" style="margin-top:4px">This week at a glance</h2><div class="ih-card" style="padding:8px 8px"><table class="ih-tbl"><tr><th></th>' + week.map(function (x, i) { return '<th class="' + (i === 6 ? 'tod' : '') + '">' + names[x.getDay()].slice(0, 2) + '</th>'; }).join('') + '</tr>' +
      PRAYERS.map(function (p) { return '<tr><td>' + p[1] + '</td>' + keys.map(function (k) { var v = data[k] && data[k].p && data[k].p[p[0]]; return '<td>' + (v ? MARKS[v][0] : '·') + '</td>'; }).join('') + '</tr>'; }).join('') +
      '<tr><td>Fast</td>' + keys.map(function (k) { return '<td>' + (data[k] && data[k].fast ? '🌙' : '·') + '</td>'; }).join('') + '</tr>' +
      '<tr><td>Dhikr</td>' + keys.map(function (k) { var n = data[k] && data[k].dhikr; return '<td>' + (n ? fmtN(n) : '·') + '</td>'; }).join('') + '</tr></table></div>';
    h += '<div class="ih-note">This is between you and your Lord. It is a private reminder, not a score, and it is not a judgment. Everything stays on this phone: nothing is sent anywhere and your location is not used. You mark your own prayers; the app does not check on you.</div>' +
      '<button type="button" class="ih-clear" id="ihClear">Erase my Iman Health data from this phone</button>';
    body.innerHTML = h;
  }

  body.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-k],[data-p],#ihFast,#ihTas,#ihClear') : null; if (!t) return;
    if (t.hasAttribute('data-k')) { sel = t.getAttribute('data-k'); paint(); return; }
    if (t.hasAttribute('data-p')) { var d = day(sel), p = t.getAttribute('data-p'), m = t.getAttribute('data-m'); d.p[p] = d.p[p] === m ? '' : m; if (!d.p[p]) delete d.p[p]; save(); paint(); return; }
    if (t.id === 'ihFast') { var f = day(sel); f.fast = !f.fast; if (!f.fast) delete f.fast; save(); paint(); return; }
    if (t.id === 'ihTas') { N.route('tasbeeh'); return; }
    if (t.id === 'ihClear') { if (root.confirm('Erase all Iman Health entries on this phone? This cannot be undone.')) { data = {}; try { localStorage.removeItem(KEY); } catch (er) {} paint(); } }
  });

  // Dhikr is added up from the Tasbeeh counter whenever it goes up.
  var last = N.tasbeeh ? N.tasbeeh.get() : 0;
  if (N.onTasbeeh) N.onTasbeeh(function (c) { var dl = c - last; last = c; if (dl > 0) { var d = day(dayKey(new Date())); d.dhikr = (d.dhikr || 0) + dl; save(); } });
  N.onScreen(function (id) { if (id === 'iman') { sel = dayKey(new Date()); paint(); } });
})(typeof self !== 'undefined' ? self : this);
