/* Noor: "7 Days with Hazrat Azam Pasha R.A.", a welcome for newcomers (data/course/welcome.json).
   One day opens each calendar day (India time) after the person starts; each day has a dars video and a Library article.
   A day whose article isn't approved yet shows its video only. No account needed: progress is kept on the phone.
   Day 3 suggests the free account, day 5 installing the app, day 7 the next steps (halqa, lessons, Bai'at, sharing).
   Home shows a card until the 7 days are done or the person hides it. */
(function (root) {
  'use strict';
  var N = root.Noor, doc = root.document, B = N && N.backend;
  if (!N || !doc) return;
  var esc = N.esc, K = 'noor_wj';
  function T(en, ru) { return N.T ? N.T(en, ru) : en; }
  function t(o, k) { return N.lang && N.lang() === 'ru' && o['ru_' + k] ? o['ru_' + k] : o[k]; }
  function dayNo(ms) { return Math.floor((ms + 330 * 60000) / 86400000); }
  function st() { try { return JSON.parse(localStorage.getItem(K) || 'null') || {}; } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(K, JSON.stringify(o)); } catch (e) {} }
  function user() { var a = root.NoorAccount; return a && a.user ? a.user() : null; }
  function installed() { return !!((root.matchMedia && root.matchMedia('(display-mode: standalone)').matches) || root.navigator.standalone || /^android-app:/.test(doc.referrer)); }

  var W = null, ok = {};
  function load() {
    var p1 = W ? Promise.resolve(W) : fetch('data/course/welcome.json').then(function (r) { return r.json(); });
    var p2 = B && B.admin ? B.admin.get('library_ok').catch(function () { return null; }) : Promise.resolve(null);
    return Promise.all([p1, p2]).then(function (r) { W = r[0]; ok = r[1] || {}; });
  }
  function openDays(s) { return s.start == null ? 0 : Math.min(7, dayNo(Date.now()) - s.start + 1); }
  function doneCount(s) { return Object.keys(s.done || {}).length; }

  var css = doc.createElement('style');
  css.textContent =
    '.wj-home{background:linear-gradient(135deg,#2a1f4a,#3d2c6b);color:#f3eefc;border-radius:16px;padding:14px;margin:0 0 14px;position:relative;cursor:pointer}' +
    '.wj-home small.by{color:#e8c46b;font-weight:600;opacity:1;margin-top:1px}.wj-home b{display:block;font-size:15.5px;padding-right:22px}.wj-home small{display:block;font-size:12.5px;opacity:.9;line-height:1.45;margin-top:3px}.wj-home .x{position:absolute;top:6px;right:8px;background:none;border:0;color:#f3eefc;opacity:.7;font-size:17px;cursor:pointer}' +
    '.wj-dots{display:flex;gap:5px;margin-top:9px}.wj-dots i{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.2)}.wj-dots i.d{background:#e8c46b}.wj-dots i.o{background:rgba(232,196,107,.45)}' +
    '.wj-go{display:inline-block;margin-top:9px;background:#e8c46b;color:#1c1a12;font-weight:700;font-size:13px;border-radius:999px;padding:7px 13px}' +
    '.wj-day{display:flex;gap:12px;align-items:center;width:100%;text-align:left;font:inherit;color:var(--ink);background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:8px;cursor:pointer}' +
    '.wj-day[disabled]{opacity:.5;cursor:default}.wj-day .n{flex:none;width:34px;height:34px;border-radius:50%;background:var(--cream);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-weight:700}.wj-day b{display:block;font-size:15px}.wj-day small{display:block;color:var(--muted);font-size:12.5px}' +
    '.wj-nudge{border:1px solid var(--gold);background:var(--panel);border-radius:14px;padding:12px 14px;margin:10px 0;font-size:14px;line-height:1.5}';
  doc.head.appendChild(css);

  var s = N.el('div', 'screen', '<div class="subhead"><div class="backbtn" id="wjBack">←</div><div class="subtitle" id="wjTitle">Welcome</div></div><div id="wjBody"></div>');
  s.id = 'screen-welcome'; doc.querySelector('.screens').appendChild(s);
  var body = s.querySelector('#wjBody'), view = 'list', cur = 0;

  function paintList() {
    view = 'list'; var S = st(), od = openDays(S);
    s.querySelector('#wjTitle').textContent = T('Welcome', 'Khush-aamdeed');
    var h = '';
    h += '<div class="cs-hero" style="background:linear-gradient(135deg,#2a1f4a,#3d2c6b)"><b>🌙 ' + esc(t(W, 'title')) + '</b><div style="color:#e8c46b;font-size:13.5px;font-weight:600;margin-top:2px">' + T('Teachings of Hazrat Azam Pasha R.A.', 'Hazrat Azam Pasha R.A. ki taleemaat') + '</div><p>' + esc(t(W, 'about')) + '</p></div>';
    if (S.start == null) h += '<button class="cs-btn" id="wjStart" type="button" style="width:100%;margin:0 0 12px">' + T('Start Day 1', 'Pehla din shuru kijiye') + '</button>';
    h += W.days.map(function (d, i) {
      var open = i < od, done = S.done && S.done[i];
      var sub = done ? T('Done ✓', 'Mukammal ✓') : open ? T('Open now', 'Ab khula hai') : S.start == null ? T('Day ', 'Din ') + (i + 1) : T('Opens on day ', 'Khulega din ') + (i + 1);
      return '<button type="button" class="wj-day" data-d="' + i + '"' + (open ? '' : ' disabled') + '><span class="n">' + (done ? '✓' : i + 1) + '</span><span><b>' + esc(t(d, 'title')) + '</b><small>' + sub + '</small></span></button>';
    }).join('');
    h += '<div class="cs-msg">' + T('One day opens each day, so there is time to reflect. Videos and readings are from the dars of Hazrat Azam Pasha R.A.', 'Har roz ek din khulta hai, taake ghaur ka waqt mile. Videos aur mazameen Hazrat Azam Pasha R.A. ke dars se hain.') + '</div>';
    body.innerHTML = h;
  }
  function nudge(kind) {
    if (kind === 'join' && !user()) return '<div class="wj-nudge">🌱 <b>' + T('Create your free account', 'Apna muft account banaiye') + '</b><br>' + T('Keep your progress, get reminders before the weekly halqa, and send lessons to your teacher.', 'Apni progress mehfooz rakhiye, haftawar halqa se pehle yaad-dehaani paaiye, aur sabaq ustaad ko bhejiye.') + '<br><button class="cs-btn" type="button" data-wj="join">' + T('Sign up', 'Sign up') + '</button></div>';
    if (kind === 'install' && !installed()) return '<div class="wj-nudge">📲 <b>' + T('Add Noor to your phone', 'Noor ko apne phone mein shamil kijiye') + '</b><br>' + T('One tap from your home screen, with the daily saying each morning.', 'Home screen se ek tap, aur har subah aaj ka qaul.') + '<br><button class="cs-btn" type="button" data-wj="install">' + T('Install the app', 'App install kijiye') + '</button></div>';
    return '';
  }
  function paintDay(i) {
    view = 'day'; cur = i; var d = W.days[i], S = st();
    s.querySelector('#wjTitle').textContent = T('Day ', 'Din ') + (i + 1);
    var h = (N.langChip ? N.langChip() : '') + '<h2 class="section-title" style="margin-top:4px">' + esc(t(d, 'title')) + '</h2>';
    if (d.final) {
      if (!(S.done && S.done[i])) setTimeout(function () { markDone(i); }, 0);
      h += '<div class="cs-step"><p style="margin:0;font-size:15px;line-height:1.6">' + T('JazakAllah khair for these seven days. Here is how to continue:', 'In saat dinon ke liye JazakAllah khair. Aage aise jaari rakhiye:') + '</p>' +
        '<button class="cs-btn" type="button" data-wj="halqa">🕯️ ' + T('Join the weekly Halqa-e-Zikr', 'Haftawar Halqa-e-Zikr mein shamil hoiye') + '</button>' +
        '<button class="cs-btn alt" type="button" data-wj="lessons">📘 ' + T('Learn Sufi Practices', 'Sufi Amaal Seekhiye') + '</button>' +
        '<button class="cs-btn alt" type="button" data-wj="library">📚 ' + T('Explore the Library', 'Library dekhiye') + '</button>' +
        '<button class="cs-btn alt" type="button" data-wj="bayah">🤝 ' + T('About Bai\'at', 'Bai\'at ke baare mein') + '</button>' +
        '<button class="cs-btn alt" type="button" data-wj="share">↗ ' + T('Invite a friend to 7 Days with Noor-ul-Hasrat', 'Kisi dost ko Noor-ul-Hasrat ke saath 7 din ki dawat dijiye') + '</button></div>';
    } else {
      if (d.video) h += '<div class="cs-step"><h3>▶ ' + T('Watch', 'Dekhiye') + '</h3><div class="cs-vid" data-wj="play"><img alt="" src="https://i.ytimg.com/vi/' + esc(d.video.v) + '/hqdefault.jpg"><div class="pl">▶</div></div></div>';
      if (d.article && ok[d.article]) h += '<div class="cs-step"><h3>📖 ' + T('Read', 'Padhiye') + '</h3><button class="cs-btn alt" type="button" data-wj="read">' + T('Open today\'s reading', 'Aaj ka mazmoon kholiye') + ' ›</button></div>';
      h += '<button class="cs-btn" type="button" data-wj="done" style="width:100%"' + (S.done && S.done[i] ? ' disabled' : '') + '>' + (S.done && S.done[i] ? T('Done ✓', 'Mukammal ✓') : T('Mark today as done', 'Aaj mukammal kijiye')) + '</button>';
      h += nudge(d.nudge);
    }
    body.innerHTML = h;
    var sc = doc.querySelector('.screens'); if (sc) sc.scrollTop = 0;
  }
  function markDone(i) {
    var S = st(); S.done = S.done || {}; S.done[i] = 1; save(S);
    if (doneCount(S) >= 7 && N.mark) N.mark('c7');
    paintHome();
  }
  function share() {
    var url = 'https://noor-ul-hasrat.vercel.app/?welcome=1', text = T('7 Days with Noor-ul-Hasrat: seven days of light on the spiritual path, from the teachings of Hazrat Azam Pasha R.A. A few minutes a day, free.', 'Noor-ul-Hasrat ke saath 7 din: roohani raaste par noor ke saat din, Hazrat Azam Pasha R.A. ki taleemaat se. Roz chand minute, muft.');
    if (root.navigator.share) root.navigator.share({ title: 'Noor-ul-Hasrat', text: text, url: url }).catch(function () {}); else root.open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + url), '_blank');
  }

  body.addEventListener('click', function (e) {
    var tg = e.target;
    if (tg.id === 'wjStart') { var S = st(); S.start = dayNo(Date.now()); save(S); if (N.mark) N.mark('s7'); paintDay(0); paintHome(); return; }
    var dd = tg.closest && tg.closest('[data-d]'); if (dd && !dd.disabled) { paintDay(+dd.getAttribute('data-d')); return; }
    var b = tg.closest && tg.closest('[data-wj]'); if (!b) return;
    var k = b.getAttribute('data-wj'), d = W.days[cur];
    if (k === 'play' && root.NoorFamily) root.NoorFamily.playVideo(d.video.v, t(d, 'title'), d.video.t || 0);
    else if (k === 'read' && root.NoorLibrary) root.NoorLibrary.open(d.article, function () { N.showScreen('welcome'); paintDay(cur); });
    else if (k === 'done') { markDone(cur); paintDay(cur); }
    else if (k === 'join') { var a = root.NoorAccount; if (a && a.openAccount) a.openAccount(); }
    else if (k === 'install') { root.location.href = 'install.html'; }
    else if (k === 'halqa') N.route('halqa');
    else if (k === 'lessons') N.route('course');
    else if (k === 'library') N.route('library');
    else if (k === 'bayah') N.route('bayah');
    else if (k === 'share') share();
  });
  s.querySelector('#wjBack').addEventListener('click', function () { if (view === 'day') paintList(); else N.route('home'); });
  root.addEventListener('noorlang', function () { if (s.classList.contains('active') && W) { if (view === 'day') paintDay(cur); else paintList(); } paintHome(); });

  // ---- Home card
  var home = doc.getElementById('screen-home'), hc = null;
  function paintHome() {
    if (!home || !W) return;
    var S = st(), dc = doneCount(S), od = openDays(S);
    var show = !S.hide && dc < 7;
    if (!show) { if (hc) hc.hidden = true; return; }
    if (!hc) {
      hc = doc.createElement('div'); hc.className = 'wj-home'; hc.setAttribute('role', 'button');
      hc.addEventListener('click', function (e) {
        if (e.target.classList.contains('x')) { var S2 = st(); S2.hide = 1; save(S2); hc.hidden = true; return; }
        api.open();
      });
      var after = doc.getElementById('wsCard');
      if (after && after.parentNode === home) home.insertBefore(hc, after.nextSibling); else home.insertBefore(hc, home.firstChild);
    }
    hc.hidden = false;
    var next = 0; while (next < 6 && S.done && S.done[next]) next++;
    var line = S.start == null ? T('New here? A few minutes a day with the teachings of Hazrat Azam Pasha R.A.', 'Naye hain? Roz chand minute Hazrat Azam Pasha R.A. ki taleemaat ke saath.')
      : (next < od ? T('Day ', 'Din ') + (next + 1) + ' · ' + t(W.days[next], 'title') : T('Next day opens tomorrow, in shaa Allah.', 'Agla din kal khulega, in shaa Allah.'));
    hc.innerHTML = '<button class="x" type="button" aria-label="Hide">✕</button><b>🌙 ' + esc(t(W, 'title')) + '</b><small class="by">' + T('Teachings of Hazrat Azam Pasha R.A.', 'Hazrat Azam Pasha R.A. ki taleemaat') + '</small><small>' + esc(line) + '</small>' +
      '<div class="wj-dots">' + [0, 1, 2, 3, 4, 5, 6].map(function (i) { return '<i class="' + (S.done && S.done[i] ? 'd' : i < od ? 'o' : '') + '"></i>'; }).join('') + '</div>' +
      '<span class="wj-go">' + (S.start == null ? T('Start', 'Shuru kijiye') : T('Continue', 'Jaari rakhiye')) + ' ›</span>';
  }

  var api = { open: function () { N.showScreen('welcome'); body.innerHTML = '<div class="cs-msg">…</div>'; load().then(function () { var S = st(), od = openDays(S), next = 0; while (next < 6 && S.done && S.done[next]) next++; if (S.start != null && next < od) paintDay(next); else paintList(); }); } };
  root.NoorJourney = api;
  setTimeout(function () {
    load().then(paintHome).catch(function () {});
    if (/[?&]welcome=1/.test(root.location.search || '')) { try { root.history.replaceState(null, '', root.location.pathname); } catch (e) {} setTimeout(api.open, 300); }
    var a = root.NoorAccount; if (a && a.onChange) a.onChange(function () { if (user() && N.mark) N.mark('j'); }); if (user() && N.mark) N.mark('j');
  }, 300);
  N.onScreen(function (id) { if (id === 'home') paintHome(); });
})(typeof self !== 'undefined' ? self : this);
