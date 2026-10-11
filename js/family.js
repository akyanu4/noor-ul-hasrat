/* Noor: videos from the family YouTube channel (Shadman): Poetry & Naat, and Dars & Tafseer.
   Uses the same free YouTube API key as the class list (config.js: youtubeApiKey). Videos play inside the app (YouTube embed). */
(function (root) {
  'use strict';

  var DEFAULTS = { id: 'UCi1Sn0S3O29-Hw87RT_fOXw', name: 'Shadman', url: 'https://www.youtube.com/@Shadman-ob4wf' };
  var TTL = 30 * 60 * 1000, PAGES = 10, SHOW = 30;   // up to 10 x 50 = 500 uploads are read; the list shows 30 at a time

  // Poetry and naat are told apart by words in the title or description (English, Roman Urdu and Urdu script).
  var POETRY = /\bna['’]?a?t\b|\bnaa?t\b|nasheed|naasheed|\bnazm\b|\bnazam\b|poetry|poem|\bkalaa?m\b|ghazal|manqabat|manqibat|\bhamd\b|qasee?da|shayari|kulliy+at|diwan|نعت|نظم|کلام|غزل|منقبت|حمد|قصیدہ|شاعری|کلیات/i;
  function kind(title, desc) { return POETRY.test((title || '') + '\n' + (desc || '').slice(0, 300)) ? 'poetry' : 'dars'; }

  function validId(id) { return typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id); }
  function uploads(ch) { return /^UC/.test(ch || '') ? 'UU' + ch.slice(2) : null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function toItems(pages) {
    var seen = {}, out = [];
    pages.forEach(function (data) {
      (data.items || []).forEach(function (it) {
        var s = it.snippet || {}, id = s.resourceId && s.resourceId.videoId;
        if (!validId(id) || seen[id] || !s.title || s.title === 'Private video' || s.title === 'Deleted video') return;
        seen[id] = 1; out.push({ id: id, title: s.title, at: s.publishedAt, kind: kind(s.title, s.description) });
      });
    });
    return out.sort(function (a, b) { return (Date.parse(b.at || 0) || 0) - (Date.parse(a.at || 0) || 0); });
  }

  var api = { kind: kind, toItems: toItems, validId: validId, uploads: uploads, DEFAULTS: DEFAULTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NoorFamily = api;

  var N = root.Noor, doc = root.document;
  if (!N || !doc) return;
  var cfg = root.NOOR_CONFIG || {}, fam = Object.assign({}, DEFAULTS, cfg.familyChannel || {});
  var kalaam = null, tab = 'poetry', who = 0, topic = 0, limit = SHOW, state = { items: null, error: '', loading: false };
  function sget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var css = doc.createElement('style');
  css.textContent =
    '.fm-tabs{display:flex;gap:6px;margin-bottom:12px}.fm-tab{flex:1;text-align:center;padding:9px 6px;border:1px solid var(--line);border-radius:18px;font-size:13px;background:var(--panel);cursor:pointer;color:var(--muted)}.fm-tab.on{background:var(--teal);color:#fff;border-color:var(--teal)}' +
    '.fm-card{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden;margin-bottom:12px}' +
    '.fm-th{position:relative;aspect-ratio:16/9;background:#000;cursor:pointer}.fm-th img{width:100%;height:100%;object-fit:cover;display:block}.fm-th iframe{width:100%;height:100%;border:0;display:block}' +
    '.fm-play{position:absolute;inset:0;margin:auto;width:54px;height:54px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;padding-left:4px;box-sizing:border-box}' +
    '.fm-t{padding:10px 12px 4px;font-size:14px;font-weight:600;line-height:1.35}.fm-m{display:flex;justify-content:space-between;align-items:center;padding:0 12px 10px;font-size:11.5px;color:var(--muted)}.fm-m a{color:var(--teal)}' +
    '.fm-note{font-size:12px;color:var(--muted);line-height:1.55;margin:6px 2px 12px}.fm-note a{color:var(--teal)}' +
    '.fm-poem{background:var(--panel);border:1px solid var(--line);border-radius:14px;margin-bottom:10px;overflow:hidden}.fm-poem summary{padding:12px 14px;font-size:14.5px;font-weight:600;cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:10px}.fm-poem summary::after{content:"›";color:var(--muted);transition:transform .2s}.fm-poem[open] summary::after{transform:rotate(90deg)}' +
    '.fm-pt{padding:2px 16px 14px;white-space:pre-wrap;line-height:2;font-size:15px}.fm-pt.ur{direction:rtl;text-align:right;font-family:Amiri,serif;font-size:21px;line-height:2.3}.fm-ps{padding:0 16px 12px;font-size:11.5px;color:var(--muted)}' +
    '.fm-order{display:flex;justify-content:flex-end;gap:6px;margin:0 0 10px;font-size:12px;color:var(--muted);align-items:center}.fm-order span{padding:4px 10px;border:1px solid var(--line);border-radius:14px;cursor:pointer;background:var(--panel)}.fm-order span.on{background:var(--teal);color:#fff;border-color:var(--teal)}' +
    '.fm-chips{display:flex;gap:6px;overflow-x:auto;margin-bottom:12px;padding-bottom:2px}.fm-chip{flex:none;padding:7px 12px;border:1px solid var(--line);border-radius:18px;font-size:12.5px;background:var(--panel);cursor:pointer;color:var(--muted);white-space:nowrap}.fm-chip.on{background:var(--teal);color:#fff;border-color:var(--teal)}' +
    '.fm-btn{display:block;text-align:center;background:var(--gold);color:#1a2421;font-weight:700;border-radius:12px;padding:13px;font-size:15px;text-decoration:none;margin:12px 0}';
  doc.head.appendChild(css);

  var s = N.el('div', 'screen', '<div class="subhead"><div class="backbtn" id="fmBack">←</div><div class="subtitle" id="fmTitle">Poetry &amp; Naat</div></div><div id="fmBody"></div>');
  s.id = 'screen-family'; doc.querySelector('.screens').appendChild(s);
  var body = s.querySelector('#fmBody');
  s.querySelector('#fmBack').addEventListener('click', function () { N.backTab(); });

  function loadKalaam() {
    fetch('data/kalaam.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
      kalaam = (d && Array.isArray(d.poems) ? d.poems : []).filter(function (x) { return x && x.title && x.text; }); paint();
    }).catch(function () { kalaam = []; paint(); });
  }
  function poemsHtml() {
    if (!kalaam || !kalaam.length) return '';
    return '<h2 class="section-title" style="margin-top:0">Kalaam</h2>' + kalaam.map(function (x) {
      return '<details class="fm-poem"><summary>' + esc(x.title) + '</summary><div class="fm-pt' + (x.lang === 'ur' ? ' ur' : '') + '">' + esc(x.text) + '</div>' + (x.source ? '<div class="fm-ps">' + esc(x.source) + '</div>' : '') + '</details>';
    }).join('') + '<h2 class="section-title" style="margin-top:14px">Videos</h2>';
  }
  function load(force) {
    var key = cfg.youtubeApiKey, pl = uploads(fam.id);
    if (!key || !pl) { state.items = []; state.error = 'unconfigured'; paint(); return; }
    var cached = null; try { cached = JSON.parse(sget('noor_family_v1') || 'null'); } catch (e) {}
    if (!force && cached && cached.id === fam.id && Date.now() - cached.t < TTL) { state.items = cached.items; state.error = ''; paint(); return; }
    state.loading = true; paint();
    var pages = [];
    (function next(token, n) {
      var u = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=' + encodeURIComponent(pl) + '&key=' + encodeURIComponent(key) + (token ? '&pageToken=' + encodeURIComponent(token) : '');
      fetch(u).then(function (r) { if (!r.ok) throw new Error('YouTube said ' + r.status); return r.json(); }).then(function (d) {
        pages.push(d);
        if (d.nextPageToken && n < PAGES) return next(d.nextPageToken, n + 1);
        state.items = toItems(pages); state.error = ''; state.loading = false;
        sset('noor_family_v1', JSON.stringify({ t: Date.now(), id: fam.id, items: state.items })); paint();
      }).catch(function (err) {
        state.loading = false;
        if (cached && cached.items) { state.items = cached.items; state.error = 'stale'; } else { state.items = state.items || []; state.error = String(err && err.message || 'error'); }
        paint();
      });
    })('', 1);
  }

  // Dars & Tafseer opens oldest first (a series reads from Part 1 onward); Poetry opens newest first. A choice made on a screen is remembered for that screen.
  function isOldest() { var v = sget('noor_family_order_' + tab); return v ? v === 'old' : tab === 'dars'; }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function dateLabel(iso) { var d = new Date(iso || ''); return isNaN(d) ? '' : d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); }
  function ago(iso) {
    var t = Date.parse(iso || ''); if (!t) return '';
    var d = Math.floor((Date.now() - t) / 86400000);
    return d < 1 ? 'today' : d < 31 ? d + (d === 1 ? ' day ago' : ' days ago') : d < 365 ? Math.floor(d / 30) + ' mo ago' : Math.floor(d / 365) + ' yr ago';
  }

  // Built-in filters for Dars & Tafseer. A video is matched by words in its title (English spellings and Urdu script).
  // Replace them from config.js (familyShaykhs) if the titles use other words.
  var DEFAULT_SHAYKHS = [
    { name: 'Hazrat Abdul Qadeer Siddiqui (R.A.)', match: 'abdul\\s*qa?u?a?d[ie]e?r|qa?u?a?deer|hasrat|hasrath|bahr[\\s-]*ul|\u0639\u0628\u062F\u0627?\u0644?\u0642\u062F\u06CC\u0631|\u062D\u0633\u0631\u062A' },
    { name: 'Azam Siddiqui (R.A.)', match: 'a[\'\u2019]?z+am|\u0627\u0639\u0638\u0645' }
  ];
  // Topic filters for Dars & Tafseer (combine with the shaykh filter). Replace from config.js (familyTopics) if needed.
  var DEFAULT_TOPICS = [
    { name: 'Tafseer-e-Siddiqui', match: 'tafs[ie]+r[\\s-]*(e|-e)?[\\s-]*siddiq|تفسیر\\s*(صدیقی|صدیق)' }
  ];
  function topics() {
    var out = [], src = Array.isArray(cfg.familyTopics) && cfg.familyTopics.length ? cfg.familyTopics : DEFAULT_TOPICS;
    src.forEach(function (x) {
      if (!x || !x.name || !x.match) return;
      try { out.push({ name: String(x.name), re: new RegExp(String(x.match), 'i') }); } catch (e) {}
    });
    return out;
  }
  function shaykhs() {
    var out = [], src = Array.isArray(cfg.familyShaykhs) && cfg.familyShaykhs.length ? cfg.familyShaykhs : DEFAULT_SHAYKHS;
    src.forEach(function (x) {
      if (!x || !x.name || !x.match) return;
      try { out.push({ name: String(x.name), re: new RegExp(String(x.match), 'i') }); } catch (e) {}
    });
    return out;
  }
  function paint() {
    var h = '', list = (state.items || []).filter(function (v) { return v.kind === tab; });
    s.querySelector('#fmTitle').textContent = tab === 'poetry' ? 'Poetry & Naat' : 'Dars & Tafseer';
    if (tab === 'poetry') {
      if (kalaam && kalaam.length) h += poemsHtml();
    } else {
      var sh = shaykhs();
      if (who > sh.length + 1) who = 0;
      if (sh.length) {
        h += '<div class="fm-chips"><div class="fm-chip' + (who === 0 ? ' on' : '') + '" data-w="0">All</div>' + sh.map(function (x, i) { return '<div class="fm-chip' + (who === i + 1 ? ' on' : '') + '" data-w="' + (i + 1) + '">' + esc(x.name) + '</div>'; }).join('') + '<div class="fm-chip' + (who === sh.length + 1 ? ' on' : '') + '" data-w="' + (sh.length + 1) + '">Other</div></div>';
        if (who > 0 && who <= sh.length) list = list.filter(function (v) { return sh[who - 1].re.test(v.title); });
        else if (who === sh.length + 1) list = list.filter(function (v) { return !sh.some(function (x) { return x.re.test(v.title); }); });
      }
      var tp = topics();
      if (topic > tp.length) topic = 0;
      if (tp.length) {
        h += '<div class="fm-chips"><div class="fm-chip' + (topic === 0 ? ' on' : '') + '" data-tp="0">All topics</div>' + tp.map(function (x, i) { return '<div class="fm-chip' + (topic === i + 1 ? ' on' : '') + '" data-tp="' + (i + 1) + '">' + esc(x.name) + '</div>'; }).join('') + '</div>';
        if (topic > 0) list = list.filter(function (v) { return tp[topic - 1].re.test(v.title); });
      }
    }
    if (state.loading && !state.items) h += '<div class="fm-note">Loading the latest videos…</div>';
    else if (state.error === 'unconfigured') h += '<div class="fm-note">The live list is not connected yet (add <b>youtubeApiKey</b> in js/config.js).</div>';
    else if (state.error && state.error !== 'stale') h += '<div class="fm-note">Could not load the videos (' + esc(state.error) + '). <a href="#" id="fmRetry">Try again</a></div>';
    else if (!list.length) h += '<div class="fm-note">' + (tab === 'poetry' ? 'No poetry or naat videos yet. A video is placed here when its title has a word like Naat, Nazm, Kalam, Manqabat or Poetry.' : 'No videos found' + (who ? ' for this shaykh' : ' yet') + '.') + '</div>';
    list = list.slice().sort(function (a, b) { var d = (Date.parse(b.at || 0) || 0) - (Date.parse(a.at || 0) || 0); return isOldest() ? -d : d; });
    if (list.length > 1) h += '<div class="fm-order">Sort by upload date <span data-o="new" class="' + (isOldest() ? '' : 'on') + '">Newest</span><span data-o="old" class="' + (isOldest() ? 'on' : '') + '">Oldest</span></div>';
    var total = list.length; list = list.slice(0, limit);
    list.forEach(function (v) {
      h += '<div class="fm-card"><div class="fm-th" data-id="' + v.id + '" role="button" aria-label="Play ' + esc(v.title) + '"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/' + v.id + '/mqdefault.jpg"><div class="fm-play">▶</div></div>' +
        '<div class="fm-t">' + esc(v.title) + '</div><div class="fm-m"><span>' + esc(dateLabel(v.at)) + (ago(v.at) ? ' · ' + esc(ago(v.at)) : '') + '</span><a target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=' + v.id + '">Open on YouTube ↗</a></div></div>';
    });
    if (total > list.length) h += '<button class="fm-btn fm-more" type="button" style="border:0;cursor:pointer">Show more (' + (total - list.length) + ' left)</button>';
    if (tab === 'dars') h += '<div class="fm-note">' + total + ' video' + (total === 1 ? '' : 's') + ' · from several shaykhs.' + '' + (state.error === 'stale' ? ' (Showing the saved list: you appear to be offline.)' : '') + ' <a href="#" id="fmRefresh">Refresh ↻</a></div>';
    else h += '<div class="fm-note">' + (state.error === 'stale' ? '(Showing the saved list: you appear to be offline.) ' : '') + '<a href="#" id="fmRefresh">Refresh ↻</a></div>';
    body.innerHTML = h;
  }

  body.addEventListener('click', function (e) {
    var o = e.target.closest && e.target.closest('.fm-order span'); if (o) { sset('noor_family_order_' + tab, o.getAttribute('data-o') === 'old' ? 'old' : 'new'); limit = SHOW; paint(); return; }
    if (e.target.closest && e.target.closest('.fm-more')) { limit += SHOW; paint(); return; }
    var tpc = e.target.closest && e.target.closest('[data-tp]'); if (tpc) { topic = +tpc.getAttribute('data-tp') || 0; limit = SHOW; paint(); return; }
    var c = e.target.closest && e.target.closest('.fm-chip'); if (c && c.hasAttribute('data-w')) { who = +c.getAttribute('data-w') || 0; limit = SHOW; paint(); return; }
    var th = e.target.closest && e.target.closest('.fm-th');
    if (th && !th.querySelector('iframe') && validId(th.getAttribute('data-id'))) {
      th.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + th.getAttribute('data-id') + '?autoplay=1&rel=0&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Video"></iframe>'; return;
    }
    if (e.target.id === 'fmRetry' || e.target.id === 'fmRefresh') { e.preventDefault(); load(true); }
  });

  api.open = function (which) { if (kalaam === null) loadKalaam(); if (which === 'poetry' || which === 'dars') { if (tab !== which) { who = 0; topic = 0; limit = SHOW; } tab = which; } paint(); N.showScreen('family'); if (state.items === null) load(false); };
  N.onScreen(function (id) { if (id === 'family' && state.items !== null && !state.loading) load(false); });
  paint();
})(typeof self !== 'undefined' ? self : this);
