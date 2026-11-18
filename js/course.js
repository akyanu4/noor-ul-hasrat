/* Noor: courses (self-paced lessons with teacher review). Course file: data/course/foundations.json.
   A lesson: Watch (dars video) → Read (Library article) → [Practise: daily check-in] → Questions → Reflection → Submit.
   A lesson opens when its Library article is approved and the teacher marked the previous lesson "Ready".
   Database:
     course/<uid>/<lessonId>       = { w, r, ck: {day: 1}, quiz: { s, n, a: [answers] }, ref, sub (time), n (name) }   the student writes their own
     course_marks/<uid>/<lessonId> = { m: started|guide|steady|ready, note, by, name, at }                       teachers write; the student reads their own
   Teachers (teachers/<uid>) and admins read everyone's, for the review list. */
(function (root) {
  'use strict';
  var N = root.Noor, doc = root.document, B = N && N.backend;
  if (!N || !doc || !B || !B.admin) return;
  var esc = N.esc;
  var MARKS = {
    started: { ic: '🌱', en: 'Started', ru: 'Shuru kiya' },
    guide: { ic: '⚠️', en: 'Needs guidance', ru: 'Rehnumaai chahiye' },
    steady: { ic: '🌿', en: 'Steady', ru: 'Mustaqil' },
    ready: { ic: '✅', en: 'Ready for the next lesson', ru: 'Agle sabaq ke liye tayyar' }
  };

  var css = doc.createElement('style');
  css.textContent =
    '.cs-home{display:flex;gap:12px;align-items:center;background:linear-gradient(135deg,#123f37,#1d4f45);color:#f5f1e2;border-radius:16px;padding:14px;margin:0 0 14px;cursor:pointer;border:1px solid rgba(232,196,107,.4)}' +
    '.cs-home .ic{flex:none;width:44px;height:44px;border-radius:12px;background:rgba(232,196,107,.18);display:flex;align-items:center;justify-content:center;font-size:24px}.cs-home .tx{flex:1;min-width:0}' +
    '.cs-home b{display:block;font-size:15px}.cs-home small{display:block;font-size:12.5px;opacity:.88;line-height:1.4;margin-top:2px}.cs-home .go{flex:none;background:#e8c46b;color:#1c1a12;font-weight:700;font-size:13px;border-radius:999px;padding:7px 12px}' +
    '.cs-bar{height:6px;border-radius:3px;background:rgba(255,255,255,.18);margin-top:7px;overflow:hidden}.cs-bar i{display:block;height:100%;background:#e8c46b;border-radius:3px}' +
    '.cs-hero{background:linear-gradient(135deg,var(--teal),#0f3a33);color:#f5f1e2;border-radius:16px;padding:16px;margin-bottom:12px}.cs-hero b{font-size:19px}.cs-hero p{margin:6px 0 0;font-size:13.5px;line-height:1.5;opacity:.92}' +
    '.cs-ls{display:flex;gap:12px;align-items:center;width:100%;text-align:left;font:inherit;color:var(--ink);background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:8px;cursor:pointer}' +
    '.cs-ls .n{flex:none;width:32px;height:32px;border-radius:50%;background:var(--cream);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px}.cs-ls .tx{flex:1}.cs-ls b{display:block;font-size:15px}.cs-ls small{display:block;font-size:12.5px;color:var(--muted);margin-top:2px}' +
    '.cs-ls[disabled]{opacity:.55;cursor:default}' +
    '.cs-step{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:10px}.cs-step h3{margin:0 0 8px;font-size:15px;display:flex;gap:8px;align-items:center}.cs-step h3 .ok{margin-left:auto;font-size:12px;color:var(--teal);font-weight:700}' +
    '.cs-vid{position:relative;aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:#000;cursor:pointer}.cs-vid img{width:100%;height:100%;object-fit:cover;opacity:.85}.cs-vid .pl{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:40px;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.6)}' +
    '.cs-btn{display:inline-block;border:0;border-radius:10px;background:var(--teal);color:#fff;font:inherit;font-weight:700;font-size:14px;padding:10px 14px;cursor:pointer;margin:6px 6px 0 0}.cs-btn.alt{background:var(--cream);color:var(--ink);border:1px solid var(--line)}.cs-btn[disabled]{opacity:.5;cursor:default}' +
    '.cs-q{margin:10px 0 4px;font-size:14.5px;font-weight:600;line-height:1.45}.cs-op{display:block;width:100%;text-align:left;font:inherit;font-size:14px;color:var(--ink);background:var(--cream);border:1px solid var(--line);border-radius:10px;padding:9px 11px;margin:5px 0;cursor:pointer}' +
    '.cs-op.right{background:#e3f4ea;border-color:#4f9d69;color:#1d4d2c}.cs-op.wrong{background:#fbe7e5;border-color:#c96a5f;color:#6b241c}.cs-op[disabled]{cursor:default}' +
    '.cs-step textarea{width:100%;box-sizing:border-box;min-height:90px;border:1px solid var(--line);border-radius:10px;padding:9px;font:inherit;font-size:14px;background:var(--cream);color:var(--ink)}' +
    '.cs-mark{border:1px solid var(--gold);border-radius:14px;padding:12px 14px;margin-bottom:10px;background:var(--panel)}.cs-mark b{font-size:15px}.cs-mark p{margin:6px 0 0;font-size:14px;line-height:1.55}' +
    '.cs-msg{font-size:13px;color:var(--muted);margin-top:6px;line-height:1.5}.cs-rv{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:10px}.cs-rv .ref{background:var(--cream);border-radius:10px;padding:8px 10px;margin:8px 0;font-size:14px;line-height:1.5;white-space:pre-wrap}' +
    '.cs-mk{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.cs-mk button{font:inherit;font-size:13px;border:1px solid var(--line);background:var(--cream);color:var(--ink);border-radius:999px;padding:6px 10px;cursor:pointer}.cs-mk button.on{background:var(--teal);color:#fff;border-color:var(--teal)}';
  doc.head.appendChild(css);

  var s = N.el('div', 'screen', '<div class="subhead"><div class="backbtn" id="csBack">←</div><div class="subtitle" id="csTitle">Course</div></div><div id="csBody"></div>');
  s.id = 'screen-course'; doc.querySelector('.screens').appendChild(s);
  var body = s.querySelector('#csBody');

  var C = null, mine = {}, marks = {}, ok = {}, teacher = false, view = 'list', curL = null;
  function acct() { return root.NoorAccount; }
  function user() { var a = acct(); return a && a.user ? a.user() : null; }
  function L() { return root.NoorLibrary; }
  function ru() { return L() && L().lang() === 'ru'; }
  function t(o, k) { return ru() && o['ru_' + k] ? o['ru_' + k] : o[k]; }
  function W(en, r) { return ru() ? r : en; }
  function today() { var w = new Date(Date.now() + 330 * 60000); return w.toISOString().slice(0, 10); }
  function myName() { var a = acct(), p = a && a.profile ? a.profile() : null; return (p && p.name) || (user() || {}).email || ''; }

  function load() {
    var u = user();
    var pc = C ? Promise.resolve(C) : fetch('data/course/foundations.json').then(function (r) { return r.json(); });
    var pa = L() ? L().approvals() : Promise.resolve({ ok: {}, teacher: false });
    var pm = u ? Promise.all([B.admin.get('course/' + u.uid).catch(function () { return null; }), B.admin.get('course_marks/' + u.uid).catch(function () { return null; })]) : Promise.resolve([null, null]);
    return Promise.all([pc, pa, pm]).then(function (r) { C = r[0]; ok = r[1].ok || {}; teacher = !!r[1].teacher; mine = r[2][0] || {}; marks = r[2][1] || {}; });
  }
  function state(i) {
    var l = C.lessons[i], m = marks[l.id], d = mine[l.id] || {};
    if (!ok[l.article] && !teacher) return 'soon';
    if (i > 0 && !teacher) { var pm = marks[C.lessons[i - 1].id]; if (!pm || pm.m !== 'ready') return 'locked'; }
    if (m) return 'marked';
    if (d.sub) return 'sent';
    return (d.w || d.r || d.quiz) ? 'going' : 'open';
  }
  function stLabel(st, l) {
    var m = marks[l.id];
    return { soon: W('Coming soon', 'Jald aa raha hai'), locked: W('Opens after your teacher marks the previous lesson Ready', 'Pichhle sabaq par ustaad ke "Tayyar" ke baad khulega'),
      open: W('Start', 'Shuru kijiye'), going: W('In progress', 'Jaari hai'), sent: W('Sent to your teacher', 'Ustaad ko bhej diya'),
      marked: m ? MARKS[m.m].ic + ' ' + W(MARKS[m.m].en, MARKS[m.m].ru) : '' }[st];
  }

  function guide() { return C && C.guide ? '<div class="lb-note" style="margin:0 0 12px">🤝 <b>' + esc(t(C, 'guide')) + '</b></div>' : ''; }

  // ---- Home card
  var home = doc.getElementById('screen-home'), hc = null;
  function paintHome() {
    if (!home || !C) return;
    if (!hc) {
      hc = N.el('div', 'cs-home', ''); hc.setAttribute('role', 'button'); hc.tabIndex = 0;
      var after = home.querySelector('.bay-home') || doc.getElementById('eventsBox');
      if (after && after.parentNode === home) home.insertBefore(hc, after.nextSibling); else home.appendChild(hc);
      hc.addEventListener('click', function () { api.open(); });
    }
    var done = C.lessons.filter(function (l) { return marks[l.id] && marks[l.id].m === 'ready'; }).length, n = C.lessons.length;
    var i = 0; while (i < n - 1 && marks[C.lessons[i].id] && marks[C.lessons[i].id].m === 'ready') i++;
    var l = C.lessons[i], st = state(i), fresh = marks[l.id] && !mine['seen_' + l.id];
    hc.hidden = !ok[C.lessons[0].article] && !teacher;
    hc.innerHTML = '<div class="ic">📘</div><div class="tx"><b>' + esc(t(C, 'title')) + ' · ' + W('Lesson', 'Sabaq') + ' ' + (i + 1) + '</b><small>' + W('Learn under the guidance of your Shaykh', 'Shaykh ki rehnumaai mein seekhiye') + '<br>' + esc(t(l, 'title')) + ' · ' + esc(fresh ? W('Your teacher replied ✓', 'Ustaad ka jawab aa gaya ✓') : stLabel(st, l)) + '</small>' +
      '<div class="cs-bar"><i style="width:' + Math.round(done / n * 100) + '%"></i></div></div><span class="go">' + W('Continue', 'Jaari rakhiye') + ' ›</span>';
  }

  // ---- Course page: list of lessons
  function paintList() {
    view = 'list'; s.querySelector('#csTitle').textContent = t(C, 'title');
    var h = '<div class="cs-hero"><b>📘 ' + esc(t(C, 'title')) + '</b><p>' + esc(t(C, 'about')) + '</p></div>' + guide();
    if (!user()) h += '<div class="cs-step"><b>' + W('Create your free account to save your progress and send lessons to your teacher.', 'Apni progress mehfooz karne aur sabaq ustaad ko bhejne ke liye muft account banaiye.') + '</b><br><button class="cs-btn" id="csJoin" type="button">' + W('Sign up / Sign in', 'Sign up / Sign in') + '</button></div>';
    if (teacher) h += '<button class="cs-btn" id="csReview" type="button" style="width:100%;margin:0 0 12px">📝 ' + W('Review students', 'Talaba ka jaiza') + '</button>';
    h += C.lessons.map(function (l, i) {
      var st = state(i);
      return '<button type="button" class="cs-ls" data-i="' + i + '"' + (st === 'soon' || st === 'locked' ? ' disabled' : '') + '><span class="n">' + (st === 'marked' && marks[l.id].m === 'ready' ? '✓' : i + 1) + '</span><span class="tx"><b>' + esc(t(l, 'title')) + '</b><small>' + esc(stLabel(st, l)) + '</small></span></button>';
    }).join('');
    h += '<div class="cs-msg">' + W('More lessons are added as our teachers approve them.', 'Ustaad ki manzoori ke saath mazeed asbaaq shamil kiye jayenge.') + '</div>';
    body.innerHTML = h;
  }

  // ---- One lesson
  function save(patch) {
    var u = user(), d = Object.assign({}, mine[curL.id] || {}, patch, { n: myName().slice(0, 60) });
    mine[curL.id] = d;
    if (!u) return Promise.resolve();
    return B.admin.put('course/' + u.uid + '/' + curL.id, d).catch(function () {});
  }
  function paintLesson(i) {
    view = 'lesson'; curL = C.lessons[i]; var l = curL, d = mine[l.id] || {}, m = marks[l.id], u = user();
    s.querySelector('#csTitle').textContent = W('Lesson', 'Sabaq') + ' ' + (i + 1);
    var h = '<div class="lb-lang" role="group"><button type="button" data-l="en"' + (!ru() ? ' class="on"' : '') + '>English</button><button type="button" data-l="ru"' + (ru() ? ' class="on"' : '') + '>Roman Urdu</button></div>' +
      '<h2 class="section-title" style="margin-top:4px">' + esc(t(l, 'title')) + '</h2>' + guide();
    if (m) {
      h += '<div class="cs-mark"><b>' + MARKS[m.m].ic + ' ' + esc(W(MARKS[m.m].en, MARKS[m.m].ru)) + '</b>' + (m.note ? '<p>' + esc(m.note) + '</p>' : '') + '<div class="cs-msg">— ' + esc(m.name || W('Your teacher', 'Aap ke ustaad')) + (m.at ? ', ' + esc(new Date(m.at).toLocaleDateString()) : '') + '</div>' +
        (m.m === 'ready' && C.lessons[i + 1] ? '<button class="cs-btn" type="button" data-i="' + (i + 1) + '">' + W('Next lesson', 'Agla sabaq') + ' ›</button>' : '') + '</div>';
      if (u && !mine['seen_' + l.id]) { mine['seen_' + l.id] = 1; B.admin.put('course/' + u.uid + '/seen_' + l.id, 1).catch(function () {}); }
    }
    var v = l.video || {};
    h += '<div class="cs-step"><h3>1 · ▶ ' + W('Watch', 'Dekhiye') + (d.w ? '<span class="ok">✓</span>' : '') + '</h3>' +
      (/^[\w-]{11}$/.test(v.v || '') ? '<div class="cs-vid" id="csVid"><img alt="" src="https://i.ytimg.com/vi/' + v.v + '/hqdefault.jpg"><div class="pl">▶</div></div><div class="cs-msg">' + esc(t(v, 'title') || '') + '</div>' : '') + '</div>';
    h += '<div class="cs-step"><h3>2 · 📖 ' + W('Read', 'Padhiye') + (d.r ? '<span class="ok">✓</span>' : '') + '</h3><button class="cs-btn alt" id="csRead" type="button">' + W('Open the lesson article', 'Sabaq ka mazmoon kholiye') + ' ›</button></div>';
    if (l.practice) {
      var ck = d.ck || {}, nd = Object.keys(ck).length, done = !!ck[today()];
      h += '<div class="cs-step"><h3>3 · 📿 ' + W('Practise', 'Amal') + '<span class="ok">' + nd + '/' + (l.practice.days || 7) + '</span></h3><div class="cs-msg">' + esc(t(l.practice, 'label') || '') + '</div>' +
        '<button class="cs-btn" id="csCk" type="button"' + (done ? ' disabled' : '') + '>' + (done ? W('Done today ✓', 'Aaj ho gaya ✓') : W('I did it today', 'Aaj kar liya')) + '</button></div>';
    }
    var qs = l.questions || [], ans = (d.quiz && d.quiz.a) || [];
    h += '<div class="cs-step"><h3>' + (l.practice ? 4 : 3) + ' · ❓ ' + W('Questions', 'Sawalaat') + (d.quiz ? '<span class="ok">' + d.quiz.s + '/' + d.quiz.n + '</span>' : '') + '</h3>' +
      qs.map(function (q, qi) {
        var a = ans[qi], opts = t(q, 'options') || q.options;
        return '<div class="cs-q">' + (qi + 1) + '. ' + esc(t(q, 'q')) + '</div>' + opts.map(function (o, oi) {
          var cls = a == null ? '' : oi === q.answer ? ' right' : oi === a ? ' wrong' : '';
          return '<button type="button" class="cs-op' + cls + '" data-q="' + qi + '" data-o="' + oi + '"' + (a != null ? ' disabled' : '') + '>' + esc(o) + '</button>';
        }).join('');
      }).join('') + '</div>';
    var sent = !!d.sub;
    h += '<div class="cs-step"><h3>' + (l.practice ? 5 : 4) + ' · ✍️ ' + W('Your reflection', 'Aap ke khayalaat') + '</h3><div class="cs-msg" style="margin:0 0 6px">' + esc(t(l, 'reflect')) + '</div>' +
      '<textarea id="csRef" maxlength="2000"' + (sent && !m ? ' disabled' : '') + '>' + esc(d.ref || '') + '</textarea>';
    if (!u) h += '<button class="cs-btn" id="csJoin" type="button">' + W('Sign up to send it to your teacher', 'Ustaad ko bhejne ke liye sign up kijiye') + '</button>';
    else if (sent && !m) h += '<div class="cs-msg">📨 ' + W('Sent to your teacher on ', 'Ustaad ko bheja gaya: ') + esc(new Date(d.sub).toLocaleDateString()) + '. ' + W('You will see the reply here.', 'Jawab yahin nazar aayega.') + '</div>';
    else h += '<button class="cs-btn" id="csSend" type="button">' + (m ? W('Send again to your teacher', 'Dobara ustaad ko bhejiye') : W('Send to my teacher', 'Ustaad ko bhejiye')) + '</button><div class="cs-msg" id="csMsg"></div>';
    h += '</div>';
    body.innerHTML = h;
    var sc = doc.querySelector('.screens'); if (sc) sc.scrollTop = 0;
  }

  // ---- Teacher: review students
  var subs = [];
  function paintReview() {
    view = 'review'; s.querySelector('#csTitle').textContent = W('Review students', 'Talaba ka jaiza');
    body.innerHTML = '<div class="cs-msg">' + W('Loading…', 'Load ho raha hai…') + '</div>';
    Promise.all([B.admin.get('course'), B.admin.get('course_marks')]).then(function (r) {
      var all = r[0] || {}, mk = r[1] || {}; subs = [];
      Object.keys(all).forEach(function (uid) { C.lessons.forEach(function (l) { var d = all[uid][l.id]; if (d && d.sub) subs.push({ uid: uid, l: l, d: d, m: (mk[uid] || {})[l.id] || null }); }); });
      function needs(x) { return !x.m || x.m.at < x.d.sub; }
      subs.sort(function (a, b) { return (needs(b) - needs(a)) || b.d.sub - a.d.sub; });
      var waiting = subs.filter(needs).length;
      var h = '<div class="cs-msg" style="margin:0 0 10px">' + waiting + ' ' + W('waiting for your review', 'aap ke jaize ke muntazir') + ' · ' + subs.length + ' ' + W('in all', 'kul') + '</div>';
      if (!subs.length) h += '<div class="lb-empty">' + W('No lessons sent yet.', 'Abhi koi sabaq nahi bheja gaya.') + '</div>';
      h += subs.map(function (x, k) {
        var q = x.d.quiz, ck = x.d.ck ? Object.keys(x.d.ck).length : 0, need = needs(x);
        return '<div class="cs-rv"' + (need ? ' style="border-color:var(--gold)"' : '') + '><b>' + esc(x.d.n || W('A student', 'Ek talib')) + '</b> · ' + esc(t(x.l, 'title')) +
          '<div class="cs-msg" style="margin-top:2px">' + W('Sent', 'Bheja') + ' ' + esc(new Date(x.d.sub).toLocaleDateString()) + ' · ' + (x.d.w ? '▶✓ ' : '▶– ') + (x.d.r ? '📖✓ ' : '📖– ') + (q ? '❓ ' + q.s + '/' + q.n : '') + (x.l.practice ? ' · 📿 ' + ck + ' ' + W('days', 'din') : '') + '</div>' +
          '<div class="ref">' + esc(x.d.ref || W('(no reflection)', '(koi tehreer nahi)')) + '</div>' +
          '<div class="cs-mk" data-k="' + k + '">' + Object.keys(MARKS).map(function (key) { return '<button type="button" data-m="' + key + '"' + (x.m && x.m.m === key ? ' class="on"' : '') + '>' + MARKS[key].ic + ' ' + esc(W(MARKS[key].en, MARKS[key].ru)) + '</button>'; }).join('') + '</div>' +
          '<textarea data-note="' + k + '" rows="2" maxlength="1000" placeholder="' + esc(W('A note for the student (optional)', 'Talib ke liye note (ikhtiyari)')) + '" style="width:100%;box-sizing:border-box;margin-top:8px;border:1px solid var(--line);border-radius:10px;padding:8px;font:inherit;font-size:14px;background:var(--cream);color:var(--ink)">' + esc((x.m && x.m.note) || '') + '</textarea>' +
          '<button class="cs-btn" type="button" data-save="' + k + '">' + W('Save mark', 'Mark mehfooz kijiye') + '</button><span class="cs-msg" data-said="' + k + '"></span></div>';
      }).join('');
      body.innerHTML = h;
    }, function (e) { body.innerHTML = '<div class="lb-empty">' + W('Could not load (', 'Load nahi hua (') + esc(e && e.message) + ')</div>'; });
  }
  var pick = {};

  body.addEventListener('click', function (e) {
    var tg = e.target, u = user();
    var lb = tg.closest && tg.closest('[data-l]'); if (lb && L()) { L().setLang(lb.getAttribute('data-l')); if (view === 'lesson') paintLesson(C.lessons.indexOf(curL)); else if (view === 'list') paintList(); return; }
    var li = tg.closest && tg.closest('[data-i]'); if (li && !li.disabled) { paintLesson(+li.getAttribute('data-i')); return; }
    if (tg.id === 'csJoin') { var a = acct(); if (a && a.openAccount) a.openAccount(); return; }
    if (tg.id === 'csReview') { paintReview(); return; }
    if (tg.closest && tg.closest('#csVid')) { var v = curL.video; if (root.NoorFamily) root.NoorFamily.playVideo(v.v, t(v, 'title') || '', v.t || 0); save({ w: 1 }); setTimeout(function () { if (view === 'lesson') paintLesson(C.lessons.indexOf(curL)); }, 400); return; }
    if (tg.id === 'csRead') { var back = function () { N.showScreen('course'); paintLesson(C.lessons.indexOf(curL)); }; save({ r: 1 }); if (L()) L().open(curL.article, back); return; }
    if (tg.id === 'csCk') { var ck = Object.assign({}, (mine[curL.id] || {}).ck || {}); ck[today()] = 1; save({ ck: ck }).then(function () { paintLesson(C.lessons.indexOf(curL)); }); return; }
    var op = tg.closest && tg.closest('[data-o]');
    if (op && !op.disabled) {
      var d = mine[curL.id] || {}, prev = (d.quiz && d.quiz.a) || {}, a2 = {}, qi = +op.getAttribute('data-q');
      Object.keys(prev).forEach(function (k0) { if (prev[k0] != null) a2[k0] = prev[k0]; }); a2[qi] = +op.getAttribute('data-o');
      var qs = curL.questions, n = qs.length, sc = 0, all = true;
      for (var k = 0; k < n; k++) { if (a2[k] == null) all = false; else if (a2[k] === qs[k].answer) sc++; }
      save({ quiz: { a: a2, s: sc, n: n, done: all } });
      paintLesson(C.lessons.indexOf(curL));
      return;
    }
    if (tg.id === 'csSend' && u) {
      var ref = (body.querySelector('#csRef').value || '').trim(), msg = body.querySelector('#csMsg');
      if (ref.length < 10) { msg.textContent = W('Please write a few lines first.', 'Pehle kuch lines likhiye.'); return; }
      tg.disabled = true;
      save({ ref: ref.slice(0, 2000), sub: Date.now() }).then(function () { paintLesson(C.lessons.indexOf(curL)); paintHome(); });
      return;
    }
    var mb = tg.closest && tg.closest('[data-m]');
    if (mb) { var box = mb.parentNode, kk = box.getAttribute('data-k'); pick[kk] = mb.getAttribute('data-m'); Array.prototype.forEach.call(box.children, function (b) { b.classList.toggle('on', b === mb); }); return; }
    var sv = tg.getAttribute && tg.getAttribute('data-save');
    if (sv != null && u) {
      var x = subs[+sv], mm = pick[sv] || (x.m && x.m.m), said = body.querySelector('[data-said="' + sv + '"]');
      if (!mm) { said.textContent = ' ' + W('Choose a mark first.', 'Pehle mark chuniye.'); return; }
      var note = (body.querySelector('[data-note="' + sv + '"]').value || '').trim().slice(0, 1000);
      var a3 = acct(), p = a3 && a3.profile ? a3.profile() : null;
      var val = { m: mm, note: note, by: u.uid, name: (p && p.name) || u.email, at: Date.now() };
      tg.disabled = true;
      B.admin.put('course_marks/' + x.uid + '/' + x.l.id, val).then(function () { x.m = val; tg.disabled = false; said.textContent = ' ✓ ' + W('Saved', 'Mehfooz'); }, function (er) { tg.disabled = false; said.textContent = ' ' + (er && er.message); });
    }
  });
  body.addEventListener('input', function (e) { if (e.target.id === 'csRef' && user()) { clearTimeout(body._t); var v = e.target.value; body._t = setTimeout(function () { if (!(mine[curL.id] || {}).sub) save({ ref: v.slice(0, 2000) }); }, 1200); } });

  s.querySelector('#csBack').addEventListener('click', function () { if (view === 'lesson' || view === 'review') { paintList(); return; } N.route('home'); });

  var api = {
    open: function () { N.showScreen('course'); body.innerHTML = '<div class="cs-msg">…</div>'; load().then(function () { paintList(); paintHome(); }); }
  };
  root.NoorCourse = api;
  function refresh() { load().then(function () { paintHome(); if (s.classList.contains('active')) { if (view === 'lesson' && curL) paintLesson(C.lessons.indexOf(curL)); else if (view === 'list') paintList(); } }).catch(function () {}); }
  setTimeout(function () { refresh(); var a = acct(); if (a && a.onChange) a.onChange(refresh); }, 50);
  N.onScreen(function (id) { if (id === 'home' && C) paintHome(); });
})(typeof self !== 'undefined' ? self : this);
