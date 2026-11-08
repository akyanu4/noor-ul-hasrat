/* Noor: "Events" at the top of Home.
   One featured card that stays put: the circle's next occasion, dressed for it —
     Salgirah: birthday wishes and "Mubarak ho" with confetti; Urs: roses, the dome and a reminder to recite the Fatiha;
     monthly mehfil: the full moon, Fatiha and Qasida-e-Burda; an Islamic day: the crescent; the halqa when it is today.
   On the day itself the card turns into the greeting ("Salgirah Mubarak!", "Urs Sharif Mubarak") with a Join button.
   Below it, a short still list of what else is coming (halqa countdown, other gatherings, the newest class).
   A photo can be set per gathering in config.js: eventPhotos: { "urs-azam": "photos/events/urs.jpg", ... }. */
(function (root) {
  'use strict';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pickLatest(list) {
    var best = null, bt = -1;
    (list || []).forEach(function (c) { var t = Date.parse(c.publishedAt || ''); if (!isNaN(t) && t > bt) { bt = t; best = c; } });
    return best || (list && list[0]) || null;
  }
  function inDays(n) { return n <= 0 ? 'Today' : n === 1 ? 'Tomorrow' : 'In ' + n + ' days'; }
  function halqaText(h, countdown) {
    if (h.state === 'live') return { kick: 'Halqa · Live now', sub: 'Join the weekly zikr circle now' };
    if (h.state === 'opening') return { kick: 'Halqa · Room is open', sub: 'Starts in ' + countdown };
    return { kick: 'Weekly Halqa', sub: 'Starts in ' + countdown };
  }
  // Which theme a gathering gets.
  function themeOf(id, kind) {
    if (/^salgirah/.test(id)) return 'bday';
    if (/^urs/.test(id)) return 'urs';
    if (id === 'mehfil') return 'mehfil';
    if (id === 'halqa') return 'halqa';
    return kind === 'islamic' ? 'moon' : 'moon';
  }
  // The words on the featured card. today = the occasion is today.
  function wording(theme, g, today) {
    var who = (g.name.split(':')[1] || g.name).trim().replace(/\.$/, '');
    if (theme === 'bday') return today
      ? { k: 'Today', t: 'Salgirah Mubarak! 🎉', m: 'Many happy returns to ' + who + '. May Allah grant him a long, healthy life in His obedience, and keep his shade over us. Ameen.', ur: 'سالگرہ مبارک' }
      : { k: '', t: 'Salgirah Mubarak', m: who + ' · ' + g.note + '. Send your du’as and wishes.', ur: 'سالگرہ مبارک' };
    if (theme === 'urs') return today
      ? { k: 'Today', t: 'Urs Sharif Mubarak 🌹', m: who + '. Recite Surah al-Fatiha and send its reward to their blessed souls. Join the fatiha online.', ur: 'عرس شریف مبارک' }
      : { k: '', t: 'Urs Sharif', m: who + ' · ' + g.note + '. Prepare to recite the Fatiha.', ur: 'عرس شریف' };
    if (theme === 'mehfil') return { k: today ? 'Today' : '', t: 'Mahana Mehfil', m: g.note + (today ? '. Join online.' : '.'), ur: 'ماہانہ محفل' };
    if (theme === 'halqa') return { k: today ? 'Tonight' : '', t: 'Haftawar Halqa-e-Zikr', m: g.note, ur: 'حلقۂ ذکر' };
    return { k: '', t: g.name, m: g.note || '', ur: '' };
  }

  var api = { pickLatest: pickLatest, inDays: inDays, halqaText: halqaText, themeOf: themeOf, wording: wording };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NoorEvents = api;

  var N = root.Noor, C = root.NoorCore, doc = root.document;
  if (!N || !C || !doc) return;
  var home = doc.getElementById('screen-home'); if (!home) return;
  var cfg = root.NOOR_CONFIG || {};

  // ---- drawings for each theme (right side of the card)
  var ART = {
    bday: '<svg viewBox="0 0 120 120" aria-hidden="true"><g class="ev-float"><path d="M28 70 q2 14 -4 26" stroke="#e7d4a3" stroke-width="1.5" fill="none"/><ellipse cx="28" cy="52" rx="13" ry="17" fill="#e5594f"/><path d="M28 69 l-3 4 h6 z" fill="#e5594f"/></g>' +
      '<g class="ev-float2"><path d="M92 62 q-3 16 3 30" stroke="#e7d4a3" stroke-width="1.5" fill="none"/><ellipse cx="92" cy="44" rx="12" ry="16" fill="#e8c46b"/><path d="M92 60 l-3 4 h6 z" fill="#e8c46b"/></g>' +
      '<rect x="38" y="78" width="44" height="28" rx="5" fill="#f5efe0"/><rect x="38" y="78" width="44" height="9" rx="4" fill="#e7a8b8"/><rect x="46" y="66" width="28" height="14" rx="4" fill="#f9e7c4"/>' +
      '<rect x="58" y="56" width="4" height="10" fill="#8bd0c8"/><path class="ev-flame" d="M60 47 q4 5 0 9 q-4 -4 0 -9z" fill="#ffcf5a"/></svg>',
    urs: '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="50" r="40" fill="#fff6dc" opacity=".12"/><path d="M30 104 V70 h60 v34 z" fill="#e7d4a3" opacity=".9"/><path d="M38 70 Q38 36 60 28 Q82 36 82 70 z" fill="#e7d4a3"/>' +
      '<path d="M60 28 v-12" stroke="#e7d4a3" stroke-width="2"/><path d="M60 10 a5 5 0 1 0 4 8 a4 4 0 1 1 -4 -8z" fill="#e8c46b"/><path d="M52 104 v-18 q8 -8 16 0 v18" fill="#0f3d3e"/>' +
      '<g fill="#d64561"><circle cx="20" cy="100" r="6"/><circle cx="100" cy="98" r="6"/><circle cx="12" cy="88" r="4"/></g><g fill="#3f8f5a"><ellipse cx="26" cy="106" rx="5" ry="2"/><ellipse cx="94" cy="105" rx="5" ry="2"/></g></svg>',
    mehfil: '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="70" cy="40" r="26" fill="#f4e3b0"/><circle cx="62" cy="34" r="4" fill="#e3cf94"/><circle cx="78" cy="48" r="3" fill="#e3cf94"/>' +
      '<path d="M22 100 l20 -16 l20 16 z M58 100 l20 -16 l20 16 z" fill="#e7d4a3" opacity=".85"/><path d="M38 100 h48" stroke="#e8c46b" stroke-width="2"/><g fill="#fff3c4"><circle cx="20" cy="30" r="1.6"/><circle cx="104" cy="22" r="1.4"/><circle cx="30" cy="62" r="1.2"/></g></svg>',
    halqa: '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="58" r="40" fill="#fff6dc" opacity=".12"/><rect x="50" y="56" width="20" height="44" rx="3" fill="#f5efe0"/><path d="M60 56 v-5" stroke="#3a2a10" stroke-width="2"/>' +
      '<path class="ev-flame" d="M60 30 q9 11 0 21 q-9 -10 0 -21z" fill="#ffcf5a"/><ellipse cx="60" cy="102" rx="26" ry="4" fill="#e8c46b" opacity=".6"/></svg>',
    moon: '<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M78 22 a36 36 0 1 0 0 72 a28 28 0 1 1 0 -72z" fill="#e8c46b"/><g fill="#fff3c4"><path d="M30 30 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z"/><circle cx="96" cy="86" r="2"/><circle cx="20" cy="76" r="1.5"/></g></svg>'
  };
  var BG = { bday: 'linear-gradient(135deg,#5b2a52,#1f3c4f)', urs: 'linear-gradient(135deg,#123f33,#3b1d26)', mehfil: 'linear-gradient(135deg,#1b2f4a,#0f3a33)', halqa: 'linear-gradient(135deg,#0f3d3e,#2a2410)', moon: 'linear-gradient(135deg,#14304a,#0f3a33)' };
  var BITS = { bday: ['🎉', '✨', '🎊', '⭐'], urs: ['🌹', '🥀', '🌸', '🌹'], mehfil: ['✨', '⭐', '✨'], halqa: ['✨', '✨'], moon: ['⭐', '✨'] };

  var css = doc.createElement('style');
  css.textContent =
    '.ev-wrap{margin-bottom:14px}' +
    '.ev-feat{position:relative;overflow:hidden;border-radius:18px;color:#f5f1e2;padding:16px 16px 14px;min-height:150px;display:flex;gap:10px;cursor:pointer;border:1px solid rgba(232,196,107,.45);box-shadow:0 6px 18px rgba(0,0,0,.18)}' +
    '.ev-feat .ev-tx{flex:1;min-width:0;position:relative;z-index:2}.ev-k{font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#e8c46b;font-weight:700}' +
    '.ev-t{font-size:20px;font-weight:800;line-height:1.25;margin:3px 0 4px}.ev-ur{font-family:"Noto Nastaliq Urdu",Amiri,serif;font-size:16px;color:#f3dfa6;line-height:1.9;direction:rtl;text-align:left}' +
    '.ev-m{font-size:13px;line-height:1.5;opacity:.93}.ev-act{display:inline-block;margin-top:10px;background:#e8c46b;color:#1c1a12;font-weight:700;font-size:13px;border-radius:999px;padding:7px 14px}.ev-act.alt{background:rgba(255,255,255,.14);color:#f5f1e2}' +
    '.ev-art{flex:none;width:112px;align-self:center;position:relative;z-index:1}.ev-art svg{width:112px;height:112px;display:block}' +
    '.ev-photo{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.35}.ev-photo+.ev-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.55),rgba(0,0,0,.15))}' +
    '.ev-bits{position:absolute;top:0;bottom:0;right:0;width:40%;pointer-events:none;z-index:1;overflow:hidden}.ev-bits span{position:absolute;top:-14%;font-size:13px;opacity:.7;animation:evfall linear infinite}' +
    '@keyframes evfall{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(230px) rotate(160deg)}}' +
    '.ev-float{animation:evbob 3.2s ease-in-out infinite}.ev-float2{animation:evbob 3.8s ease-in-out infinite reverse}@keyframes evbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}' +
    '.ev-flame{transform-origin:60px 52px;animation:evflk 1.1s ease-in-out infinite}@keyframes evflk{0%,100%{transform:scale(1)}50%{transform:scale(1.08,.94)}}' +
    '@media (prefers-reduced-motion: reduce){.ev-bits{display:none}.ev-float,.ev-float2,.ev-flame{animation:none}}' +
    '.ev-roll{margin-top:8px}.ev-track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;border-radius:14px;-webkit-overflow-scrolling:touch}.ev-track::-webkit-scrollbar{display:none}' +
    '.ev-row{flex:0 0 100%;scroll-snap-align:start;box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer;background:var(--panel);border:1px solid var(--line);border-radius:14px;text-align:left;font:inherit;color:var(--ink)}' +
    '.ev-row .ic{flex:none;width:34px;height:34px;border-radius:10px;background:var(--cream);display:flex;align-items:center;justify-content:center;font-size:18px}.ev-row .tx{flex:1;min-width:0}.ev-row b{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ev-row small{display:block;font-size:11.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ev-row .go{color:var(--muted);font-size:18px}' +
    '.ev-th{flex:none;width:64px;aspect-ratio:16/9;border-radius:6px;overflow:hidden;background:rgba(0,0,0,.2)}.ev-th img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.ev-dots{display:flex;justify-content:center;gap:6px;margin-top:7px}.ev-dot{width:7px;height:7px;border-radius:50%;background:var(--line);border:0;padding:0;cursor:pointer}.ev-dot.on{background:var(--gold);width:18px;border-radius:4px}';
  doc.head.appendChild(css);

  var wrap = doc.createElement('div'); wrap.className = 'ev-wrap'; wrap.id = 'eventsBox';
  wrap.innerHTML = '<h2 class="section-title" style="margin-top:2px">Events</h2><div id="evFeat"></div><div class="ev-roll" id="evRoll"><div class="ev-track" id="evList" aria-roledescription="carousel" aria-label="More events"></div><div class="ev-dots" id="evDots"></div></div>';
  home.insertBefore(wrap, home.firstChild);
  var featEl = wrap.querySelector('#evFeat'), listEl = wrap.querySelector('#evList'), dotsEl = wrap.querySelector('#evDots'), rollEl = wrap.querySelector('#evRoll');
  var cur = 0, held = false, resume = 0, EVERY = 5000;

  function adj() { var a = 0; try { a = parseInt(localStorage.getItem('noor_hijri_adj'), 10) || 0; } catch (e) {} return a < -2 || a > 2 ? 0 : a; }
  function localDays(day) { var ln = new Date(), lday = Date.UTC(ln.getFullYear(), ln.getMonth(), ln.getDate()); return Math.round((day - lday) / 86400000); }

  var data = { feat: null, rows: [] };
  function collect() {
    var now = Date.now(), G = root.NoorGatherings, F = root.NoorFaith, items = [];
    var h = C.nextHalqa(now), ht = halqaText(h, C.formatCountdown(h.msUntilStart));
    var halqaToday = h.state !== 'upcoming' || localDays(Date.UTC(new Date(h.start).getFullYear(), new Date(h.start).getMonth(), new Date(h.start).getDate())) === 0;
    if (G) {
      try {
        var seen = {};
        G.upcoming(now, adj(), 400).forEach(function (x) {
          if (seen[x.g.id]) return; seen[x.g.id] = 1;
          var dd = localDays(x.day), hd = x.h && F ? x.h.d + ' ' + F.MONTHS[x.h.m - 1].n : '';
          items.push({ id: x.g.id, g: x.g, days: dd, theme: themeOf(x.g.id), when: new Date(x.day).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }), hd: hd });
        });
      } catch (e) {}
    }
    if (F && F.supported && F.supported()) {
      try {
        var up = F.upcoming(F.dayStart(now, new Date().getTimezoneOffset()), adj(), 400)[0];
        if (up) items.push({ id: 'islamic', g: { name: up.name, note: up.d + ' ' + F.MONTHS[up.m - 1].n + ' ' + up.y + ' AH', ic: '🌙' }, days: up.days, theme: 'moon',
          when: new Date(up.ms).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }), hd: '' });
      } catch (e) {}
    }
    var RANK = { bday: 0, urs: 1, mehfil: 2, moon: 3, halqa: 4 };   // same day: the Salgirah or Urs comes before the monthly mehfil
    items.sort(function (a, b) { return a.days - b.days || RANK[a.theme] - RANK[b.theme]; });
    // The featured card: the next occasion. The weekly halqa is featured only on its own day (otherwise it would always win).
    var specials = items.filter(function (x) { return x.id !== 'halqa'; });
    var feat = specials[0] || null;
    if ((!feat || feat.days > 0) && halqaToday) feat = { id: 'halqa', g: { name: 'Haftawar halqa-e-zikr', note: ht.sub, ic: '🕯️' }, days: 0, theme: 'halqa', when: '', hd: '', halqa: h };
    var rows = [];
    rows.push({ ic: '🕯️', t: 'Haftawar halqa-e-zikr', s: ht.kick + ' · ' + ht.sub, go: 'halqa', meet: h.state !== 'upcoming' });
    items.forEach(function (x) { if (x === feat || x.id === 'halqa' || rows.length >= 6) return; rows.push({ ic: x.g.ic || '📅', t: x.g.name, s: inDays(x.days) + ' · ' + x.when + (x.hd ? ' · ' + x.hd : ''), go: 'calendar' }); });
    var v = pickLatest(N.getClasses ? N.getClasses() : []);
    if (v) rows.push({ ic: '▶', t: v.title, s: 'Latest from DAR UL ILM', yt: v.yt, thumb: v.yt });
    if (feat && feat.id === 'halqa') rows.shift();
    return { feat: feat, rows: rows };
  }

  function paint() {
    data = collect();
    var f = data.feat;
    if (f) {
      var today = f.days <= 0, w = wording(f.theme, f.g, today), photo = (cfg.eventPhotos || {})[f.id];
      var kick = today ? (w.k || 'Today') : inDays(f.days) + (f.when ? ' · ' + f.when : '') + (f.hd ? ' · ' + f.hd : '');
      var bits = (today || f.theme === 'bday' || f.theme === 'urs') ? (BITS[f.theme] || []).concat(BITS[f.theme] || []).map(function (b, i) {
        return '<span style="left:' + ((i * 37 + 9) % 92) + '%;animation-duration:' + (5 + (i % 4) * 1.3) + 's;animation-delay:' + (-i * 0.9) + 's">' + b + '</span>'; }).join('') : '';
      featEl.innerHTML = '<div class="ev-feat" role="button" tabindex="0" style="background:' + BG[f.theme] + '">' +
        (photo ? '<div class="ev-photo" style="background-image:url(\'' + esc(photo) + '\')"></div><div class="ev-shade"></div>' : '') +
        '<div class="ev-bits">' + bits + '</div>' +
        '<div class="ev-tx"><div class="ev-k">' + esc(kick) + '</div><div class="ev-t">' + esc(w.t) + '</div>' + (w.ur ? '<div class="ev-ur" lang="ur">' + esc(w.ur) + '</div>' : '') +
        '<div class="ev-m">' + esc(w.m) + '</div><span class="ev-act' + (today ? '' : ' alt') + '">' + (today ? 'Join online ›' : 'See the calendar ›') + '</span></div>' +
        '<div class="ev-art">' + (ART[f.theme] || ART.moon) + '</div></div>';
    } else featEl.innerHTML = '';
    if (held) return;   // do not rebuild the rolling cards under a finger
    var keep = cur;
    listEl.innerHTML = data.rows.map(function (r, i) {
      return '<button type="button" class="ev-row" data-r="' + i + '"><span class="ic">' + r.ic + '</span><span class="tx"><b>' + esc(r.t) + '</b><small>' + esc(r.s) + '</small></span>' +
        (r.thumb && /^[\w-]{11}$/.test(r.thumb) ? '<span class="ev-th"><img alt="" loading="lazy" src="https://img.youtube.com/vi/' + r.thumb + '/mqdefault.jpg" onerror="this.style.display=\'none\'"></span>' : '<span class="go">›</span>') + '</button>';
    }).join('');
    dotsEl.innerHTML = data.rows.length > 1 ? data.rows.map(function (r, i) { return '<button type="button" class="ev-dot" aria-label="Show event ' + (i + 1) + '" data-d="' + i + '"></button>'; }).join('') : '';
    rollEl.hidden = !data.rows.length;
    cur = Math.min(keep, Math.max(0, data.rows.length - 1)); mark(); listEl.scrollLeft = cur * listEl.clientWidth;
  }

  featEl.addEventListener('click', function () {
    var f = data.feat; if (!f) return;
    if (f.days <= 0 && N.openMeet) N.openMeet(); else N.route(f.id === 'halqa' ? 'halqa' : 'calendar');
  });
  listEl.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-r]'); if (!b) return;
    var r = data.rows[+b.getAttribute('data-r')]; if (!r) return;
    if (r.meet && N.openMeet) N.openMeet(); else if (r.yt) N.playById(r.yt); else if (r.go) N.route(r.go);
  });

  // the smaller cards roll by themselves, pause while touched, and can be swiped or picked with the dots
  function mark() { Array.prototype.forEach.call(dotsEl.children, function (d, i) { d.classList.toggle('on', i === cur); }); }
  function go(i) { var n = data.rows.length; if (!n) return; cur = (i + n) % n; listEl.scrollTo({ left: cur * listEl.clientWidth, behavior: 'smooth' }); mark(); }
  listEl.addEventListener('scroll', function () { var i = Math.round(listEl.scrollLeft / (listEl.clientWidth || 1)); if (i !== cur && i >= 0 && i < data.rows.length) { cur = i; mark(); } }, { passive: true });
  function hold() { held = true; clearTimeout(resume); }
  function release() { clearTimeout(resume); resume = setTimeout(function () { held = false; }, 6000); }
  ['touchstart', 'pointerdown', 'mouseenter', 'focusin'].forEach(function (e) { listEl.addEventListener(e, hold, { passive: true }); });
  ['touchend', 'touchcancel', 'pointerup', 'mouseleave', 'focusout'].forEach(function (e) { listEl.addEventListener(e, release, { passive: true }); });
  dotsEl.addEventListener('click', function (e) { var d = e.target.closest && e.target.closest('[data-d]'); if (d) { hold(); go(+d.getAttribute('data-d')); release(); } });
  var calm = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setInterval(function () { if (!calm && !held && !doc.hidden && home.offsetParent !== null && data.rows.length > 1) go(cur + 1); }, EVERY);

  paint();
  setInterval(paint, 30000);                                   // keeps the halqa countdown fresh
  if (N.onClasses) N.onClasses(function () { paint(); });
  N.onScreen(function (id) { if (id === 'home') paint(); });
})(typeof self !== 'undefined' ? self : this);
