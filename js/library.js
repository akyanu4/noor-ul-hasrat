/* Noor: Library (knowledge base). More → Library, and linked from lessons.
   Articles are files in data/library/ (index.json lists them; tools/library/build_index.py rebuilds it).
   Every article starts as a draft prepared from the dars transcripts. A teacher approves it in the app:
     library_ok/<slug>    = { by: uid, name, at }       (anyone can read; teachers and admins write)
     library_notes/<slug>/<id> = { by, name, text, at }  (corrections from teachers; teachers and admins read)
     teachers/<uid> = true                               (set by an admin on admin.html)
   Members see approved articles only. "murid" articles are for members whose Bai'at is approved.
   Teachers and admins also see drafts, with Approve and "Suggest a correction". */
(function (root) {
  'use strict';
  var N = root.Noor, doc = root.document, B = N && N.backend;
  if (!N || !doc) return;
  var esc = N.esc;

  var css = doc.createElement('style');
  css.textContent =
    '.lb-search{width:100%;box-sizing:border-box;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:12px;padding:11px 13px;font:inherit;font-size:15px;margin-bottom:10px}' +
    '.lb-cats{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-bottom:12px}.lb-cats::-webkit-scrollbar{display:none}' +
    '.lb-cats button{flex:none;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer}.lb-cats button.on{background:var(--teal);color:#fff;border-color:var(--teal)}' +
    '.lb-item{display:block;width:100%;text-align:left;font:inherit;color:var(--ink);background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:8px;cursor:pointer}' +
    '.lb-item b{display:block;font-size:15px}.lb-item small{display:block;color:var(--muted);font-size:12.5px;line-height:1.45;margin-top:3px}' +
    '.lb-badge{display:inline-block;font-size:10.5px;font-weight:700;border-radius:6px;padding:1px 6px;margin-left:6px;vertical-align:2px}.lb-badge.d{background:#fff1d6;color:#8a5a00;border:1px solid #f0d08a}.lb-badge.m{background:#e6f2ef;color:var(--teal);border:1px solid #bfdcd5}' +
    '.lb-art h1{font-size:21px;line-height:1.3;margin:2px 0 2px}.lb-art .ur{font-family:"Noto Nastaliq Urdu",Amiri,serif;font-size:18px;color:var(--teal);direction:rtl;text-align:right;line-height:2}' +
    '.lb-art .sm{color:var(--muted);font-size:13.5px;line-height:1.5;margin:4px 0 12px}.lb-art h2{font-size:16.5px;margin:18px 0 6px}.lb-art p{font-size:15px;line-height:1.65;margin:8px 0}' +
    '.lb-q{border-left:3px solid var(--gold);background:var(--cream);border-radius:0 12px 12px 0;padding:10px 12px;margin:10px 0;font-size:15px;line-height:1.6}.lb-q .src{display:block;margin-top:6px;font-size:12px;color:var(--muted)}' +
    '.lb-q .src button{border:0;background:none;color:var(--teal);font:inherit;font-weight:700;cursor:pointer;padding:0}' +
    '.lb-art ol{padding-left:22px;font-size:15px;line-height:1.6}.lb-note{background:#fff8e6;color:#4a3a12;border:1px solid #f0d08a;border-radius:12px;padding:9px 12px;font-size:13.5px;line-height:1.5;margin:10px 0}.lb-note a,.lb-draft a{color:#0f5c4f;font-weight:700}' +
    '.lb-draft{background:#fff1d6;color:#4a3a12;border:1px solid #f0d08a;border-radius:12px;padding:10px 12px;font-size:13px;line-height:1.5;margin-bottom:12px}' +
    '.lb-rel button{display:block;width:100%;text-align:left;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:12px;padding:10px 12px;margin:6px 0;font:inherit;font-size:14px;cursor:pointer}' +
    '.lb-src{font-size:12px;color:var(--muted);line-height:1.55;margin-top:16px}.lb-teach{border:1px solid var(--gold);border-radius:14px;padding:12px;margin-top:16px;background:var(--panel)}' +
    '.lb-teach textarea{width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:10px;padding:9px;font:inherit;font-size:14px;background:var(--cream);color:var(--ink);margin-top:6px}' +
    '.lb-btn{border:0;border-radius:10px;background:var(--teal);color:#fff;font:inherit;font-weight:700;font-size:14px;padding:10px 14px;cursor:pointer;margin:8px 8px 0 0}.lb-btn.alt{background:var(--cream);color:var(--ink);border:1px solid var(--line)}' +
    '.lb-lang{display:inline-flex;border:1px solid var(--line);border-radius:999px;padding:2px;margin:0 0 10px;background:var(--panel)}.lb-lang button{border:0;background:none;color:var(--ink);font:inherit;font-size:12.5px;font-weight:600;padding:5px 12px;border-radius:999px;cursor:pointer}.lb-lang button.on{background:var(--teal);color:#fff}' +
    '.lb-empty{text-align:center;color:var(--muted);font-size:14px;line-height:1.6;padding:26px 10px}';
  doc.head.appendChild(css);

  var s = N.el('div', 'screen', '<div class="subhead"><div class="backbtn" id="lbBack">←</div><div class="subtitle" id="lbTitle">Library</div></div><div id="lbBody"></div>');
  s.id = 'screen-library'; doc.querySelector('.screens').appendChild(s);
  var body = s.querySelector('#lbBody');

  var backFn = null, index = null, ok = {}, isTeacher = false, cat = 'All', q = '', cur = '', from = 'more';
  var lang = N.lang ? N.lang() : 'en';
  function setLang(l) { lang = l; if (N.setLang) N.setLang(l); }
  root.addEventListener('noorlang', function (e) { lang = e.detail; if (s.classList.contains('active')) { if (cur) paintArticle(cur); else paintList(); } });
  function T(a, k) { return lang === 'ru' && a['ru_' + k] ? a['ru_' + k] : a[k]; }
  var LANGBAR = function () { return '<div class="lb-lang" role="group" aria-label="Language"><button type="button" data-l="en"' + (lang === 'en' ? ' class="on"' : '') + '>English</button><button type="button" data-l="ru"' + (lang === 'ru' ? ' class="on"' : '') + '>Roman Urdu</button></div>'; };
  var CATS = ['All', 'Basics', "Bai'at", 'The path', 'Practices', 'Terms', 'FAQ'];
  function acct() { return root.NoorAccount; }
  function user() { var a = acct(); return a && a.user ? a.user() : null; }
  function murid() { var a = acct(); return !!(a && a.hasBayah && a.hasBayah()); }
  function approved(slug) { return !!ok[slug]; }
  function canSee(a) { return isTeacher || (approved(a.slug) && (a.level !== 'murid' || murid())); }
  function mmss(t) { t = t | 0; var h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), x = ('0' + t % 60).slice(-2); return (h ? h + ':' + ('0' + m).slice(-2) : m) + ':' + x; }

  function load() {
    var p1 = index ? Promise.resolve(index) : fetch('data/library/index.json').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
    var p2 = B && B.admin ? B.admin.get('library_ok').catch(function () { return null; }) : Promise.resolve(null);
    var u = user();
    var p3 = !u || !B || !B.admin ? Promise.resolve(false) : Promise.all([B.admin.get('teachers/' + u.uid).catch(function () { return null; }), B.admin.isAdmin()]).then(function (r) { return r[0] === true || r[1] === true; });
    return Promise.all([p1, p2, p3]).then(function (r) { index = r[0] || []; ok = r[1] || {}; isTeacher = !!r[2]; });
  }

  function paintList() {
    s.querySelector('#lbTitle').textContent = 'Library';
    var all = index.filter(canSee), locked = index.filter(function (a) { return approved(a.slug) && a.level === 'murid' && !murid() && !isTeacher; }).length;
    var qq = q.trim().toLowerCase();
    var list = all.filter(function (a) { return (cat === 'All' || a.cat === cat) && (!qq || (a.title + ' ' + (a.ru_title || '') + ' ' + (a.summary || '') + ' ' + (a.ru_summary || '') + ' ' + (a.tags || []).join(' ') + ' ' + (a.ur || '')).toLowerCase().indexOf(qq) >= 0); });
    var h = LANGBAR() + '<input class="lb-search" id="lbQ" type="search" placeholder="Search the Library…" value="' + esc(q) + '">' +
      '<div class="lb-cats">' + CATS.map(function (c) { return '<button type="button" data-c="' + esc(c) + '"' + (c === cat ? ' class="on"' : '') + '>' + esc(c) + '</button>'; }).join('') + '</div>';
    if (isTeacher) { var nd = index.filter(function (a) { return !approved(a.slug); }).length; h += '<div class="lb-draft"><b>Teacher view.</b> ' + nd + ' draft' + (nd === 1 ? '' : 's') + ' waiting for your approval. Members only see approved articles.</div>'; }
    if (!all.length) h += '<div class="lb-empty">📚 The Library is being prepared.<br>Articles from Hazrat’s dars are being reviewed by our teachers, in shaa Allah.</div>';
    else if (!list.length) h += '<div class="lb-empty">Nothing found.</div>';
    h += list.map(function (a) {
      return '<button type="button" class="lb-item" data-s="' + esc(a.slug) + '"><b>' + esc(T(a, 'title')) + (!approved(a.slug) ? '<span class="lb-badge d">Draft</span>' : '') + (a.level === 'murid' ? '<span class="lb-badge m">Murids</span>' : '') + '</b><small>' + esc(a.cat) + ' · ' + esc(T(a, 'summary') || '') + '</small></button>';
    }).join('');
    if (locked) h += '<div class="lb-note">🔒 ' + locked + ' more article' + (locked === 1 ? ' is' : 's are') + ' for murids whose Bai’at is approved. <a href="#" id="lbBay">How to take Bai’at ›</a></div>';
    body.innerHTML = h;
    var qi = body.querySelector('#lbQ');
    qi.oninput = function () { var pos = qi.selectionStart; q = qi.value; paintList(); var n = body.querySelector('#lbQ'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} };
  }

  function block(b) {
    if (b.h) return '<h2>' + esc(b.h) + '</h2>';
    if (b.p) return '<p>' + esc(b.p) + '</p>';
    if (b.q) {
      var sr = b.src || {}, lab = sr.label ? esc(sr.label) : '';
      var watch = /^[\w-]{11}$/.test(sr.v || '') ? ' · <button type="button" data-v="' + sr.v + '" data-t="' + (sr.t | 0) + '">▶ Watch at ' + mmss(sr.t) + '</button>' : '';
      return '<div class="lb-q">“' + esc(b.q) + '”<span class="src">Hazrat Azam Pasha R.A.' + (lab ? ' · ' + lab : '') + watch + '</span></div>';
    }
    if (b.steps) return '<ol>' + b.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>';
    if (b.note) return '<div class="lb-note">' + esc(b.note) + '</div>';
    return '';
  }

  function paintArticle(slug) {
    var meta = index.filter(function (a) { return a.slug === slug; })[0];
    if (!meta || !canSee(meta)) { cur = ''; paintList(); return; }
    s.querySelector('#lbTitle').textContent = meta.cat;
    body.innerHTML = '<div class="lb-empty">Loading…</div>';
    fetch('data/library/' + encodeURIComponent(slug) + '.json').then(function (r) { return r.json(); }).then(function (a) {
      if (cur !== slug) return;
      if (ok[slug] && N.mark) N.mark('r');
      var okv = ok[slug], h = '<div class="lb-art">' + LANGBAR();
      var ru = lang === 'ru' && a.ru && a.ru.blocks && a.ru.blocks.length ? a.ru : null, V = ru ? { title: ru.title || a.title, summary: ru.summary || a.summary, blocks: ru.blocks } : a;
      if (lang === 'ru' && !ru) h += '<div class="lb-note">Roman Urdu mein yeh mazmoon abhi tayyar nahi hai. English mein padhiye.</div>';
      if (ru) h += '<div class="lb-note" style="margin-top:0">Yeh English draft ka Roman Urdu tarjuma hai. Hazrat ke asal alfaaz sunne ke liye ▶ Watch dabaiye.</div>';
      if (!okv) h += '<div class="lb-draft"><b>Draft – awaiting approval.</b> ' + esc(a.by || 'Prepared from the dars transcripts.') + ' Members cannot see it yet.</div>';
      h += '<h1>' + esc(V.title) + '</h1>' + (a.ur ? '<div class="ur" lang="ur">' + esc(a.ur) + '</div>' : '') + '<div class="sm">' + esc(V.summary || '') + '</div>';
      h += (V.blocks || []).map(block).join('');
      var rel = (a.related || []).map(function (r) { return index.filter(function (x) { return x.slug === r && canSee(x); })[0]; }).filter(Boolean);
      if (rel.length) h += '<h2>Read next</h2><div class="lb-rel">' + rel.map(function (x) { return '<button type="button" data-s="' + esc(x.slug) + '">' + esc(T(x, 'title')) + ' ›</button>'; }).join('') + '</div>';
      h += '<div class="lb-src">' + (okv ? '✅ Approved by ' + esc(okv.name || 'a teacher') + (okv.at ? ' · ' + esc(new Date(okv.at).toLocaleDateString()) : '') + '<br>' : '') +
        'From the dars of Hazrat Azam Pasha R.A.' + ((a.sources || []).length ? ': ' + a.sources.map(function (x) { return esc(x.label || ''); }).filter(Boolean).join(' · ') : '') +
        '. English is translated from the Urdu recordings. If anything is unclear, please ask your teacher.</div>';
      if (okv) h += '<button class="lb-btn" type="button" id="lbShare">↗ ' + (lang === 'ru' ? 'Share kijiye' : 'Share this article') + '</button>';
      if (isTeacher) h += '<div class="lb-teach"><b>For teachers</b>' +
        (okv ? '<div class="sm" style="margin:4px 0">Approved. You can withdraw approval to hide it from members.</div><button class="lb-btn alt" type="button" id="lbUn">Withdraw approval</button>'
             : '<div class="sm" style="margin:4px 0">Read it fully. Approve it if it is faithful to Hazrat’s teaching; otherwise suggest a correction below.</div><button class="lb-btn" type="button" id="lbOk">✅ Approve for members</button>') +
        '<textarea id="lbNote" rows="3" maxlength="1000" placeholder="Suggest a correction (what to change, add or remove)"></textarea><button class="lb-btn alt" type="button" id="lbSend">Send correction</button><div class="sm" id="lbMsg"></div></div>';
      h += '</div>';
      body.innerHTML = h;
      var sc = doc.querySelector('.screens'); if (sc) sc.scrollTop = 0;
    }).catch(function () { body.innerHTML = '<div class="lb-empty">This article could not be loaded. Check your internet and try again.</div>'; });
  }

  function teacherName() { var a = acct(), p = a && a.profile ? a.profile() : null; return (p && p.name) || (user() || {}).email || 'Teacher'; }
  body.addEventListener('click', function (e) {
    var t = e.target;
    var lb = t.closest && t.closest('[data-l]'); if (lb) { setLang(lb.getAttribute('data-l')); if (cur) paintArticle(cur); else paintList(); return; }
    var it = t.closest && t.closest('[data-s]'); if (it) { cur = it.getAttribute('data-s'); paintArticle(cur); return; }
    var c = t.closest && t.closest('[data-c]'); if (c) { cat = c.getAttribute('data-c'); paintList(); return; }
    var v = t.closest && t.closest('[data-v]');
    if (v) { if (root.NoorFamily && root.NoorFamily.playVideo) root.NoorFamily.playVideo(v.getAttribute('data-v'), '', +v.getAttribute('data-t') || 0); return; }
    if (t.id === 'lbShare' && N.shareArticle) { var mt = index.filter(function (a) { return a.slug === cur; })[0] || {}; N.shareArticle(cur, (lang === 'ru' && mt.ru_title) || mt.title || ''); return; }
    if (t.id === 'lbBay') { e.preventDefault(); N.route('bayah'); return; }
    var u = user(), msg = body.querySelector('#lbMsg');
    if (t.id === 'lbOk' && u) {
      t.disabled = true;
      var val = { by: u.uid, name: teacherName(), at: Date.now() };
      B.admin.put('library_ok/' + cur, val).then(function () { ok[cur] = val; paintArticle(cur); }, function (er) { t.disabled = false; if (msg) msg.textContent = 'Could not approve (' + (er && er.message) + ').'; });
    } else if (t.id === 'lbUn' && u) {
      t.disabled = true;
      B.admin.del('library_ok/' + cur).then(function () { delete ok[cur]; paintArticle(cur); }, function (er) { t.disabled = false; if (msg) msg.textContent = 'Could not change (' + (er && er.message) + ').'; });
    } else if (t.id === 'lbSend' && u) {
      var tx = (body.querySelector('#lbNote').value || '').trim(); if (!tx) return;
      t.disabled = true;
      B.admin.put('library_notes/' + cur + '/n' + Date.now().toString(36), { by: u.uid, name: teacherName(), text: tx.slice(0, 1000), at: Date.now() })
        .then(function () { body.querySelector('#lbNote').value = ''; t.disabled = false; if (msg) msg.textContent = 'Thank you. Your correction was sent to the app team.'; },
              function (er) { t.disabled = false; if (msg) msg.textContent = 'Could not send (' + (er && er.message) + ').'; });
    }
  });

  s.querySelector('#lbBack').addEventListener('click', function () {
    if (backFn) { var f = backFn; backFn = null; cur = ''; f(); return; }
    if (cur) { cur = ''; paintList(); return; }
    if (from === 'more' || from === 'home') N.route(from); else N.backTab();
  });

  var api = {
    open: function (slug, onBack) {
      backFn = typeof onBack === 'function' ? onBack : null;
      var c0 = doc.querySelector('.screen.active'); from = c0 ? c0.id.replace('screen-', '') : 'more'; if (from === 'library') from = 'more';
      N.showScreen('library'); body.innerHTML = '<div class="lb-empty">Loading the Library…</div>';
      load().then(function () { cur = slug || ''; if (cur) paintArticle(cur); else paintList(); });
    },
    // for lessons: is this article visible to the current person?
    lang: function () { return lang; }, setLang: function (l) { setLang(l === 'ru' ? 'ru' : 'en'); },
    approvals: function () { return load().then(function () { return { ok: ok, teacher: isTeacher }; }); },
    list: function () { return load().then(function () { return index.filter(canSee); }); }
  };
  root.NoorLibrary = api;
  setTimeout(function () { var a = acct(); if (a && a.onChange) a.onChange(function () { if (s.classList.contains('active')) load().then(function () { if (cur) paintArticle(cur); else paintList(); }); }); }, 0);
})(typeof self !== 'undefined' ? self : this);
