/* Noor: rotating "Events" banner at the top of Home.
   Cards, in order: the weekly Halqa, the newest DAR UL ILM video, the next upcoming Islamic day.
   It turns by itself every few seconds, pauses while touched, and can be swiped or tapped. */
(function (root) {
  'use strict';

  var EVERY = 5500;

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

  var api = { pickLatest: pickLatest, inDays: inDays, halqaText: halqaText, EVERY: EVERY };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NoorEvents = api;

  var N = root.Noor, C = root.NoorCore, doc = root.document;
  if (!N || !C || !doc) return;
  var home = doc.getElementById('screen-home'); if (!home) return;

  var css = doc.createElement('style');
  css.textContent =
    '.ev-wrap{margin-bottom:14px}.ev-track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;border-radius:16px;-webkit-overflow-scrolling:touch}.ev-track::-webkit-scrollbar{display:none}' +
    '.ev-card{flex:0 0 100%;scroll-snap-align:start;box-sizing:border-box;min-height:104px;padding:14px 16px;background:linear-gradient(135deg,var(--teal),#0f3a33);color:#f5f1e2;display:flex;align-items:center;gap:12px;cursor:pointer;border:0;text-align:left;font:inherit}' +
    '.ev-ic{flex:none;width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;font-size:22px}' +
    '.ev-tx{flex:1;min-width:0}.ev-k{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--gold-soft);font-weight:700}.ev-t{font-size:15.5px;font-weight:700;line-height:1.3;margin:2px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.ev-s{font-size:12.5px;opacity:.85}' +
    '.ev-th{flex:none;width:74px;aspect-ratio:16/9;border-radius:8px;overflow:hidden;background:rgba(0,0,0,.3)}.ev-th img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.ev-dots{display:flex;justify-content:center;gap:6px;margin-top:8px}.ev-dot{width:7px;height:7px;border-radius:50%;background:var(--line);border:0;padding:0;cursor:pointer}.ev-dot.on{background:var(--gold);width:18px;border-radius:4px}';
  doc.head.appendChild(css);

  var wrap = doc.createElement('div'); wrap.className = 'ev-wrap'; wrap.id = 'eventsBox';
  wrap.innerHTML = '<h2 class="section-title" style="margin-top:2px">Events</h2><div class="ev-track" id="evTrack" aria-roledescription="carousel" aria-label="Events"></div><div class="ev-dots" id="evDots"></div>';
  home.insertBefore(wrap, home.firstChild);
  var track = wrap.querySelector('#evTrack'), dots = wrap.querySelector('#evDots');
  var cur = 0, held = false, resume = 0, timer = 0;

  function cards() {
    var out = [], now = Date.now(), h = C.nextHalqa(now), t = halqaText(h, C.formatCountdown(h.msUntilStart));
    var when = new Date(h.start).toLocaleString([], { weekday: 'long', hour: 'numeric', minute: '2-digit' });
    out.push({ ic: '🕯️', k: t.kick, t: 'Weekly zikr halqa', s: h.state === 'upcoming' || h.state === 'opening' ? when + ' · ' + t.sub : t.sub, go: 'halqa' });

    var v = pickLatest(N.getClasses ? N.getClasses() : []);
    if (v) {
      var d = Date.parse(v.publishedAt || ''), ds = isNaN(d) ? '' : new Date(d).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
      out.push({ ic: '▶', k: 'Latest from DAR UL ILM', t: v.title, s: (v.ep ? v.ep + ' · ' : '') + (ds || v.series || ''), yt: v.yt, thumb: v.yt });
    }

    var F = root.NoorFaith;
    if (F && F.supported && F.supported()) {
      try {
        var adj = parseInt(localStorage.getItem('noor_hijri_adj'), 10) || 0; if (adj < -2 || adj > 2) adj = 0;
        var up = F.upcoming(F.dayStart(now, new Date().getTimezoneOffset()), adj, 400)[0];
        if (up) out.push({ ic: '🌙', k: 'Coming up · ' + inDays(up.days), t: up.name, s: up.d + ' ' + F.MONTHS[up.m - 1].n + ' ' + up.y + ' AH · ' + new Date(up.ms).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }), go: 'calendar' });
      } catch (e) {}
    }
    return out;
  }

  var data = [];
  function paint() {
    var keep = cur; data = cards();
    track.innerHTML = data.map(function (c, i) {
      return '<button type="button" class="ev-card" data-i="' + i + '"><div class="ev-ic">' + c.ic + '</div><div class="ev-tx"><div class="ev-k">' + esc(c.k) + '</div><div class="ev-t">' + esc(c.t) + '</div><div class="ev-s">' + esc(c.s) + '</div></div>' +
        (c.thumb && /^[\w-]{11}$/.test(c.thumb) ? '<div class="ev-th"><img alt="" loading="lazy" src="https://img.youtube.com/vi/' + c.thumb + '/mqdefault.jpg" onerror="this.style.display=\'none\'"></div>' : '') + '</button>';
    }).join('');
    dots.innerHTML = data.map(function (c, i) { return '<button type="button" class="ev-dot" aria-label="Show event ' + (i + 1) + '" data-d="' + i + '"></button>'; }).join('');
    cur = Math.min(keep, data.length - 1); mark();
    track.scrollLeft = cur * track.clientWidth;
  }
  function mark() { Array.prototype.forEach.call(dots.children, function (d, i) { d.classList.toggle('on', i === cur); }); }
  function go(i) { cur = (i + data.length) % data.length; track.scrollTo({ left: cur * track.clientWidth, behavior: 'smooth' }); mark(); }

  track.addEventListener('scroll', function () { var w = track.clientWidth || 1, i = Math.round(track.scrollLeft / w); if (i !== cur && i >= 0 && i < data.length) { cur = i; mark(); } }, { passive: true });
  function hold() { held = true; clearTimeout(resume); }
  function release() { clearTimeout(resume); resume = setTimeout(function () { held = false; }, 6000); }
  ['touchstart', 'pointerdown', 'mouseenter', 'focusin'].forEach(function (e) { track.addEventListener(e, hold, { passive: true }); });
  ['touchend', 'touchcancel', 'pointerup', 'mouseleave', 'focusout'].forEach(function (e) { track.addEventListener(e, release, { passive: true }); });
  dots.addEventListener('click', function (e) { var d = e.target.closest && e.target.closest('[data-d]'); if (d) { hold(); go(+d.getAttribute('data-d')); release(); } });
  track.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('.ev-card'); if (!c) return;
    var d = data[+c.getAttribute('data-i')]; if (!d) return;
    if (d.yt) { N.playById(d.yt); } else if (d.go) { N.route(d.go); }
  });

  var calm = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tick() {
    if (calm || held || doc.hidden || home.offsetParent === null || data.length < 2) return;
    go(cur + 1);
  }
  paint();
  timer = setInterval(tick, EVERY);
  setInterval(function () { if (!held) paint(); }, 30000);                 // keeps the Halqa countdown fresh
  if (N.onClasses) N.onClasses(function () { paint(); });
  N.onScreen(function (id) { if (id === 'home') paint(); });
})(typeof self !== 'undefined' ? self : this);
