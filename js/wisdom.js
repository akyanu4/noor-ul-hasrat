/* Noor: "Saying of the day" on Home, and share links for sayings, Library articles and lessons.
   Sayings are Hazrat Azam Pasha R.A.'s quotes inside the Library articles (data/library/sayings.json, made by
   tools/library/build_index.py). Only sayings from articles a teacher approved (library_ok/<slug>) are used.
   The pick is the same for everyone on a day (India time), and api/daily-saying.js sends the same one as a push.
   Share links (each shows a preview card in WhatsApp and opens the item in the app):
     /q/<slug>.<n>   a saying          → /?q=<slug>.<n>
     /a/<slug>       a Library article → /?a=<slug>
     /l/<lessonId>   a lesson          → /?lesson=<lessonId>   */
(function (root) {
  'use strict';
  var N = root.Noor, doc = root.document, B = N && N.backend;
  if (!N || !doc) return;
  var esc = N.esc, SITE = 'https://noor-ul-hasrat.vercel.app';
  function T(en, ru) { return N.T ? N.T(en, ru) : en; }
  function ru() { return N.lang && N.lang() === 'ru'; }

  // ---- the pick (keep in step with api/daily-saying.js)
  function dayNo(ms) { return Math.floor((ms + 330 * 60000) / 86400000); }
  function pick(sayings, ok, ms) {
    var pool = sayings.filter(function (x) { return ok && ok[x.s]; });
    return pool.length ? pool[dayNo(ms) % pool.length] : null;
  }

  // ---- sharing
  function share(url, text) {
    if (root.navigator.share) { root.navigator.share({ title: 'Noor-ul-Hasrat', text: text, url: url }).catch(function () {}); return; }
    root.open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + url), '_blank');
  }
  N.shareSaying = function (x) {
    var q = ru() && x.ru ? x.ru : x.q;
    share(SITE + '/q/' + x.s + '.' + x.i, '“' + q + '”\n— Hazrat Azam Pasha R.A.');
  };
  N.shareArticle = function (slug, title) { share(SITE + '/a/' + slug, title + ' · ' + T('from the dars of Hazrat Azam Pasha R.A.', 'Hazrat Azam Pasha R.A. ke dars se')); };
  N.shareLesson = function (id, title) { share(SITE + '/l/' + id, T('Learn Sufi Practices: ', 'Sufi Amaal Seekhiye: ') + title); };

  // ---- Home card
  var css = doc.createElement('style');
  css.textContent =
    '.ws-card{background:linear-gradient(160deg,#fbf6ea,#f3e9d2);color:#2a2418;border:1px solid #e3d3a8;border-radius:16px;padding:14px 15px 12px;margin:0 0 14px;position:relative}' +
    '.ws-card .hd{font-size:11.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#8a6a1f;display:flex;gap:6px;align-items:center}' +
    '.ws-card .q{font-family:Georgia,"Times New Roman",serif;font-size:16.5px;line-height:1.55;margin:8px 0 6px}' +
    '.ws-card .by{font-size:12px;color:#6b5d3e}.ws-card .bt{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}' +
    '.ws-card .bt button{font:inherit;font-size:12.5px;font-weight:700;border-radius:999px;padding:7px 12px;cursor:pointer;border:1px solid #d8c58f;background:#fffaf0;color:#2a2418}' +
    '.ws-card .bt button.s{background:#0f5c4f;border-color:#0f5c4f;color:#fff}' +
    '.ws-one{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:18px}.ws-one .ws-card{max-width:380px;width:100%;margin:0}' +
    '.ws-one .x{position:absolute;top:6px;right:10px;border:0;background:none;font-size:20px;color:#6b5d3e;cursor:pointer}';
  doc.head.appendChild(css);

  var sayings = null, ok = null;
  function load() {
    var p1 = sayings ? Promise.resolve(sayings) : fetch('data/library/sayings.json').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
    var p2 = ok ? Promise.resolve(ok) : (B && B.admin ? B.admin.get('library_ok').catch(function () { return null; }) : Promise.resolve(null));
    return Promise.all([p1, p2]).then(function (r) { sayings = r[0] || []; ok = r[1] || {}; });
  }
  function cardHtml(x, close) {
    var q = ru() && x.ru ? x.ru : x.q;
    return (close ? '<button class="x" type="button" aria-label="Close">✕</button>' : '') +
      '<div class="hd">🌙 ' + T('Saying of the day', 'Aaj ka qaul') + '</div><div class="q">“' + esc(q) + '”</div><div class="by">— Hazrat Azam Pasha R.A.' + (x.label ? ' · ' + esc(x.label) : '') + '</div>' +
      '<div class="bt">' + (x.v ? '<button type="button" data-ws="play">▶ ' + T('Listen', 'Suniye') + '</button>' : '') +
      '<button type="button" data-ws="read">📖 ' + T('Read more', 'Mazeed padhiye') + '</button><button type="button" class="s" data-ws="share">↗ ' + T('Share', 'Share kijiye') + '</button></div>';
  }
  function act(x, what) {
    if (what === 'play' && root.NoorFamily && root.NoorFamily.playVideo) root.NoorFamily.playVideo(x.v, '', x.t || 0);
    if (what === 'read' && root.NoorLibrary) root.NoorLibrary.open(x.s);
    if (what === 'share') N.shareSaying(x);
  }
  var home = doc.getElementById('screen-home'), card = null, today = null;
  function paintHome() {
    if (!home) return;
    today = pick(sayings || [], ok, Date.now());
    if (!today) { if (card) card.hidden = true; return; }
    if (!card) {
      card = doc.createElement('div'); card.className = 'ws-card'; card.id = 'wsCard';
      card.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-ws]'); if (b && today) act(today, b.getAttribute('data-ws')); });
      var ev = doc.getElementById('eventsBox');
      if (ev && ev.parentNode === home) home.insertBefore(card, ev); else home.insertBefore(card, home.firstChild);
    }
    card.hidden = false; card.innerHTML = cardHtml(today);
  }
  function showOne(x) {
    var o = doc.createElement('div'); o.className = 'ws-one';
    o.innerHTML = '<div class="ws-card" style="position:relative">' + cardHtml(x, true) + '</div>';
    o.addEventListener('click', function (e) {
      if (e.target === o || e.target.classList.contains('x')) { o.remove(); return; }
      var b = e.target.closest && e.target.closest('[data-ws]'); if (b) { if (b.getAttribute('data-ws') !== 'share') o.remove(); act(x, b.getAttribute('data-ws')); }
    });
    doc.body.appendChild(o);
  }

  // ---- links that open an item: ?q=<slug>.<n>, ?a=<slug>, ?lesson=<id>
  function deepLinks() {
    var qs = root.location.search || '', m;
    function clear() { try { root.history.replaceState(null, '', root.location.pathname); } catch (e) {} }
    if ((m = /[?&]q=([a-z0-9-]+)\.(\d+)/.exec(qs))) {
      clear(); var s = m[1], i = +m[2];
      load().then(function () { var x = sayings.filter(function (y) { return y.s === s && y.i === i && ok[s]; })[0]; if (x) showOne(x); });
    } else if ((m = /[?&]a=([a-z0-9-]+)/.exec(qs))) {
      clear(); setTimeout(function () { if (root.NoorLibrary) root.NoorLibrary.open(m[1]); }, 300);
    } else if ((m = /[?&]lesson=([a-z0-9_-]+)/.exec(qs))) {
      clear(); setTimeout(function () { if (root.NoorCourse) root.NoorCourse.open(m[1]); }, 300);
    }
  }

  setTimeout(function () { load().then(paintHome); deepLinks(); }, 200);
  N.onScreen(function (id) { if (id === 'home' && sayings) paintHome(); });
  root.addEventListener('noorlang', function () { if (card && today) card.innerHTML = cardHtml(today); });
})(typeof self !== 'undefined' ? self : this);
