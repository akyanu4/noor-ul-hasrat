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
  // A channel's Shorts-only playlist (UC... -> UUSH...). If YouTube does not serve it, the full uploads list is used instead.
  function shortsList(ch) { return /^UC/.test(ch || '') ? 'UUSH' + ch.slice(2) : null; }
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

  var api = { kind: kind, toItems: toItems, validId: validId, uploads: uploads, shortsList: shortsList, DEFAULTS: DEFAULTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NoorFamily = api;

  var N = root.Noor, doc = root.document;
  if (!N || !doc) return;
  var cfg = root.NOOR_CONFIG || {}, fam = Object.assign({}, DEFAULTS, cfg.familyChannel || {});
  var ZIKR = Object.assign({ id: 'UC5a1qQRHACif9Z1xMgmfFyQ', name: 'Bahr ul-Uloom', url: 'https://www.youtube.com/@bahruloloom' }, cfg.zikrChannel || {});
  // Azam Pasha Zikr: Shorts from his zikr channel (shown on his profile page and in Practices).
  var AZAM = Object.assign({ id: 'UCn5J7zggR3cV4sCYlEjgZJA', name: 'Azam Pasha Zikr', url: 'https://www.youtube.com/channel/UCn5J7zggR3cV4sCYlEjgZJA/shorts' }, cfg.azamChannel || {});
  var kalaam = null, tab = 'poetry', who = 0, topic = 0, limit = SHOW, fstate = { items: null, error: '', loading: false }, zstate = { items: null, error: '', loading: false }, astate = { items: null, error: '', loading: false, waiters: [] }, state = fstate;
  var AZAM_MATCH = /a[’']?z+am|zikr|dhikr|zekr|ذکر|ذكر|اعظم/i;
  try { if (cfg.azamChannel && cfg.azamChannel.match) AZAM_MATCH = new RegExp(cfg.azamChannel.match, 'i'); } catch (e) {}
  function stateFor(t) { return t === 'zikr' ? zstate : t === 'azam' ? astate : fstate; }
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
    '.fm-btn{display:block;text-align:center;background:var(--gold);color:#1a2421;font-weight:700;border-radius:12px;padding:13px;font-size:15px;text-decoration:none;margin:12px 0}' +
    '.fm-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.fm-sc{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden}' +
    '.fm-sth{position:relative;aspect-ratio:9/16;background:#000;cursor:pointer;overflow:hidden}.fm-sth img{width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.02)}.fm-sth iframe{width:100%;height:100%;border:0;display:block}' +
    '.fm-full{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -18px 12px;padding:0 18px 6px;scrollbar-width:none}.fm-full::-webkit-scrollbar{display:none}.fm-full .fm-sc{flex:none;width:78%;max-width:360px;scroll-snap-align:start}.fm-sth.fm-wide{aspect-ratio:16/9}.fm-fh{margin:6px 0 8px;font-size:15px;color:var(--teal)}.fm-soonth{cursor:default;background:linear-gradient(135deg,#123b33,#2a2410);display:flex;align-items:center;justify-content:center}.fm-soonin{text-align:center;color:#e8c46b;font-size:14px;line-height:1.5}' +
    '.fm-hs{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -18px 4px;padding:0 18px 6px;scrollbar-width:none}.fm-hs::-webkit-scrollbar{display:none}.fm-hs .fm-sc{flex:none;width:42%;max-width:190px;scroll-snap-align:start}.fm-hs .fm-all{flex:none;width:30%;max-width:140px;display:flex;align-items:center;justify-content:center;text-align:center;border:1px dashed var(--line);border-radius:14px;color:var(--teal);font-weight:700;font-size:13px;cursor:pointer;scroll-snap-align:start;padding:8px}' +
    '.fm-acts{display:flex;gap:6px;margin:6px 8px 10px}.fm-acts .fm-like{flex:1;margin:0;font:inherit;font-size:12px;font-weight:600;background:transparent;cursor:pointer}' +
    '.fm-sub{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:700;color:#fff;background:#c4302b;border-radius:999px;padding:6px 12px;text-decoration:none;white-space:nowrap}' +
    '.fm-toast{position:fixed;left:50%;bottom:86px;transform:translateX(-50%);background:#1a2421;color:#fff;font-size:13px;padding:9px 14px;border-radius:999px;z-index:9999;box-shadow:0 4px 14px rgba(0,0,0,.25)}' +
    '.fm-stat{padding:0 10px;font-size:12px;color:var(--muted);min-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fm-like{display:block;margin:6px 10px 10px;padding:6px 0;text-align:center;font-size:12px;font-weight:600;color:var(--teal);border:1px solid var(--line);border-radius:10px;text-decoration:none}' +
    '.fm-st{padding:8px 10px 4px;font-size:12.5px;font-weight:600;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}';
  doc.head.appendChild(css);

  var s = N.el('div', 'screen', '<div class="subhead"><div class="backbtn" id="fmBack">←</div><div class="subtitle" id="fmTitle">Poetry &amp; Naat</div></div><div id="fmBody"></div>');
  s.id = 'screen-family'; doc.querySelector('.screens').appendChild(s);
  var body = s.querySelector('#fmBody');
  s.querySelector('#fmBack').addEventListener('click', function () { N.backTab(); });

  var pinned = null;
  function loadPinned() {
    fetch('data/pinned.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { pinned = d || {}; paint(); }).catch(function () { pinned = {}; paint(); });
  }
  function pins() { return ((pinned && pinned[tab]) || []).filter(function (v) { return v && validId(v.id) && v.title; }); }
  function pinCard(v) {
    return '<div class="fm-card"><div class="fm-th" data-id="' + v.id + '" role="button" aria-label="Play ' + esc(v.title) + '"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/' + v.id + '/mqdefault.jpg"><div class="fm-play">▶</div></div>' +
      '<div class="fm-t">' + esc(v.title) + '</div><div class="fm-m"><span></span></div></div>';
  }
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
  function paintIf(st) { if (st === state) paint(); }
  function done(st) { paintIf(st); var w = st.waiters || []; st.waiters = []; w.forEach(function (f) { try { f(st); } catch (e) {} }); }
  function load(force, t) {
    t = t || tab;
    var st = stateFor(t), ch = t === 'zikr' ? ZIKR : t === 'azam' ? AZAM : fam, ck = t === 'zikr' ? 'noor_zikr_v1' : t === 'azam' ? 'noor_azam_v2' : 'noor_family_v1';
    var key = cfg.youtubeApiKey, pl = t === 'azam' ? shortsList(ch.id) : uploads(ch.id), fallback = t === 'azam' ? uploads(ch.id) : null;
    if (!key || !pl) { st.items = []; st.error = 'unconfigured'; done(st); return; }
    if (st.loading) return;
    var cached = null; try { cached = JSON.parse(sget(ck) || 'null'); } catch (e) {}
    if (!force && cached && cached.id === ch.id && Date.now() - cached.t < TTL) { st.items = cached.items; st.error = ''; done(st); return; }
    st.loading = true; paintIf(st);
    var pages = [];
    (function next(token, n) {
      var u = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=' + encodeURIComponent(pl) + '&key=' + encodeURIComponent(key) + (token ? '&pageToken=' + encodeURIComponent(token) : '');
      fetch(u).then(function (r) { if (!r.ok) throw new Error('YouTube said ' + r.status); return r.json(); }).then(function (d) {
        pages.push(d);
        if (d.nextPageToken && n < PAGES) return next(d.nextPageToken, n + 1);
        st.items = toItems(pages); st.error = ''; st.loading = false;
        // Using the full uploads list instead of Shorts: keep only zikr videos (by title), so unrelated uploads stay hidden.
        if (t === 'azam' && pl === fallback) st.items = st.items.filter(function (v) { return AZAM_MATCH.test(v.title); });
        sset(ck, JSON.stringify({ t: Date.now(), id: ch.id, items: st.items })); done(st);
      }).catch(function (err) {
        // No Shorts playlist for this channel (or YouTube refused it): read the full uploads list once instead.
        if (fallback && pl !== fallback && !pages.length) { pl = fallback; return next('', 1); }
        st.loading = false;
        if (cached && cached.items) { st.items = cached.items; st.error = 'stale'; } else { st.items = st.items || []; st.error = String(err && err.message || 'error'); }
        done(st);
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
    var h = '', list = (state.items || []).filter(function (v) { return tab === 'zikr' || tab === 'azam' || v.kind === tab; }), pn = pins();
    list = list.filter(function (v) { return !pn.some(function (p) { return p.id === v.id; }); });
    s.querySelector('#fmTitle').textContent = tab === 'poetry' ? 'Poetry & Naat' : tab === 'zikr' ? 'Zikr & Sama' : tab === 'azam' ? 'Azam Pasha Shorts' : 'Dars & Tafseer';
    if (tab === 'azam') return paintShorts(list);
    if (tab === 'zikr') {
      h += '<div class="fm-note" style="margin-top:0">Zikr, sama and more from the ' + esc(ZIKR.name) + ' channel. Tap a video to play it here.</div>';
    } else if (tab === 'poetry') {
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
    if (pn.length) h += '<h2 class="section-title" style="margin-top:6px">Featured</h2>' + pn.map(pinCard).join('') + (list.length || state.loading ? '<h2 class="section-title" style="margin-top:14px">All videos</h2>' : '');
    if (state.loading && !state.items) h += '<div class="fm-note">Loading the latest videos…</div>';
    else if (state.error === 'unconfigured') h += '<div class="fm-note">The live list is not connected yet (add <b>youtubeApiKey</b> in js/config.js).</div>';
    else if (state.error && state.error !== 'stale') h += '<div class="fm-note">Could not load the videos (' + esc(state.error) + '). <a href="#" id="fmRetry">Try again</a></div>';
    else if (!list.length && !pn.length) h += '<div class="fm-note">' + (tab === 'poetry' ? 'No poetry or naat videos yet. A video is placed here when its title has a word like Naat, Nazm, Kalam, Manqabat or Poetry.' : 'No videos found' + (who ? ' for this shaykh' : ' yet') + '.') + '</div>';
    list = list.slice().sort(function (a, b) { var d = (Date.parse(b.at || 0) || 0) - (Date.parse(a.at || 0) || 0); return isOldest() ? -d : d; });
    if (list.length > 1) h += '<div class="fm-order">Sort by upload date <span data-o="new" class="' + (isOldest() ? '' : 'on') + '">Newest</span><span data-o="old" class="' + (isOldest() ? 'on' : '') + '">Oldest</span></div>';
    var total = list.length; list = list.slice(0, limit);
    list.forEach(function (v) {
      h += '<div class="fm-card"><div class="fm-th" data-id="' + v.id + '" role="button" aria-label="Play ' + esc(v.title) + '"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/' + v.id + '/mqdefault.jpg"><div class="fm-play">▶</div></div>' +
        '<div class="fm-t">' + esc(v.title) + '</div><div class="fm-m"><span>' + esc(dateLabel(v.at)) + (ago(v.at) ? ' · ' + esc(ago(v.at)) : '') + '</span></div></div>';
    });
    if (total > list.length) h += '<button class="fm-btn fm-more" type="button" style="border:0;cursor:pointer">Show more (' + (total - list.length) + ' left)</button>';
    if (tab === 'zikr') h += '<div class="fm-note">' + total + ' video' + (total === 1 ? '' : 's') + (state.error === 'stale' ? ' (Showing the saved list: you appear to be offline.)' : '') + ' <a href="#" id="fmRefresh">Refresh ↻</a></div>';
    else if (tab === 'dars') h += '<div class="fm-note">' + total + ' video' + (total === 1 ? '' : 's') + ' · from several shaykhs.' + '' + (state.error === 'stale' ? ' (Showing the saved list: you appear to be offline.)' : '') + ' <a href="#" id="fmRefresh">Refresh ↻</a></div>';
    else h += '<div class="fm-note">' + (state.error === 'stale' ? '(Showing the saved list: you appear to be offline.) ' : '') + '<a href="#" id="fmRefresh">Refresh ↻</a></div>';
    body.innerHTML = h;
  }

  // Shorts are shown as vertical tiles, two per row, and play inside the app.
  // View and like counts for Shorts, read from YouTube (videos.list statistics) and kept for 30 minutes.
  var STATS = null, statsBusy = false, pendingShort = null;
  function nfmt(n) { n = +n || 0; return n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'K' : String(n); }
  function statText(id) { var x = STATS && STATS.v[id]; return x ? '👁 ' + nfmt(x.v) + '  ·  👍 ' + nfmt(x.l) : ''; }
  function fillStats() { Array.prototype.forEach.call(doc.querySelectorAll('.fm-stat[data-sid]'), function (e) { var t = statText(e.getAttribute('data-sid')); if (t) e.textContent = t; }); }
  function ensureStats(list) {
    if (STATS === null) { try { STATS = JSON.parse(sget('noor_short_stats_v1') || 'null'); } catch (e) {} if (!STATS || !STATS.v) STATS = { t: 0, v: {} }; }
    var ids = (list || []).map(function (v) { return v.id; }).filter(validId), fresh = Date.now() - STATS.t < TTL;
    var missing = ids.filter(function (id) { return !STATS.v[id]; });
    fillStats();
    if (statsBusy || !cfg.youtubeApiKey || !ids.length || (fresh && !missing.length)) return;
    statsBusy = true;
    var want = fresh ? missing : ids, chunks = [];
    for (var i = 0; i < want.length; i += 50) chunks.push(want.slice(i, i + 50));
    Promise.all(chunks.map(function (c) {
      return fetch('https://www.googleapis.com/youtube/v3/videos?part=statistics&id=' + c.join(',') + '&key=' + encodeURIComponent(cfg.youtubeApiKey))
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) { (d.items || []).forEach(function (it) { var st = it.statistics || {}; STATS.v[it.id] = { v: +st.viewCount || 0, l: +st.likeCount || 0 }; }); });
    })).then(function () { if (!fresh) STATS.t = Date.now(); sset('noor_short_stats_v1', JSON.stringify(STATS)); }, function () {})
      .then(function () { statsBusy = false; fillStats(); });
  }
  function shortTile(v) {
    return '<div class="fm-sc"><div class="fm-sth" data-id="' + v.id + '" role="button" aria-label="Play ' + esc(v.title) + '">' +
      '<img loading="lazy" alt="" src="https://i.ytimg.com/vi/' + v.id + '/oardefault.jpg" onerror="this.onerror=null;this.src=\'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg\'"><div class="fm-play">▶</div></div>' +
      '<div class="fm-st">' + esc(v.title) + '</div>' +
      '<div class="fm-stat" data-sid="' + v.id + '">' + esc(statText(v.id)) + '</div>' +
      '<div class="fm-acts"><a class="fm-like" target="_blank" rel="noopener" href="https://www.youtube.com/shorts/' + v.id + '">👍 Like</a>' +
      '<button type="button" class="fm-like fm-share" data-sid="' + v.id + '" data-t="' + esc(v.title) + '">↗ Share</button></div></div>';
  }
  // Share a Short: the phone's share sheet (WhatsApp, Messages…), or copy the link where that isn't available.
  function ftoast(t) { var o = doc.querySelector('.fm-toast'); if (o) o.remove(); var e = doc.createElement('div'); e.className = 'fm-toast'; e.textContent = t; doc.body.appendChild(e); setTimeout(function () { e.remove(); }, 2500); }
  function clean(t) { return String(t).replace(/\s*#\w+/g, '').trim(); }
  function shareShort(id, title) {
    if (!validId(id)) return;
    // our own share page (/s/<id>) carries the video thumbnail and title as a preview card, and opens the Short in the app
    var site = /^https?:/.test(location.protocol) && !/localhost|127\.0\.0\.1/.test(location.hostname) ? location.origin : 'https://noor-ul-hasrat.vercel.app';
    var url = site + '/s/' + id, text = title ? clean(title) : 'Hazrat Azam Pasha R.A.';
    if (navigator.share) { navigator.share({ title: text, text: text, url: url }).catch(function () {}); return; }
    var all = text + '\n' + url;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(all).then(function () { ftoast('Link copied. Paste it to share.'); }, function () { root.prompt && root.prompt('Copy this link:', url); });
    else if (root.prompt) root.prompt('Copy this link:', url);
  }
  doc.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('.fm-share'); if (b) { e.preventDefault(); e.stopPropagation(); shareShort(b.getAttribute('data-sid'), b.getAttribute('data-t')); } }, true);
  function subscribeLink() { return '<a class="fm-sub" target="_blank" rel="noopener" href="https://www.youtube.com/channel/' + esc(AZAM.id) + '?sub_confirmation=1">🔔 Subscribe</a>'; }
  function shortsGrid(list) { setTimeout(function () { ensureStats(list); }, 0); return '<div class="fm-grid">' + list.map(shortTile).join('') + '</div>'; }
  function paintShorts(list) {
    var h = '<div style="margin:0 0 8px">' + subscribeLink() + '</div><div class="fm-note" style="margin-top:0">Dars and zikr Shorts of Azam Pasha from the ' + esc(AZAM.name) + ' channel. New Shorts appear here by themselves. Tap one to play it.</div>';
    if (state.loading && !state.items) h += '<div class="fm-note">Loading the latest Shorts…</div>';
    else if (state.error === 'unconfigured') h += '<div class="fm-note">The live list is not connected yet (add <b>youtubeApiKey</b> in js/config.js).</div>';
    else if (state.error && state.error !== 'stale') h += '<div class="fm-note">Could not load the Shorts (' + esc(state.error) + '). <a href="#" id="fmRetry">Try again</a></div>';
    else if (!list.length) h += '<div class="fm-note">No Shorts yet.</div>';
    var total = list.length; list = list.slice(0, limit);
    h += shortsGrid(list);
    if (total > list.length) h += '<button class="fm-btn fm-more" type="button" style="border:0;cursor:pointer">Show more (' + (total - list.length) + ' left)</button>';
    h += '<div class="fm-note">' + total + ' Short' + (total === 1 ? '' : 's') + (state.error === 'stale' ? ' (Showing the saved list: you appear to be offline.)' : '') + ' <a href="#" id="fmRefresh">Refresh ↻</a></div>';
    body.innerHTML = h;
    if (pendingShort && !state.loading) {   // opened from a notification: play that Short once the list is in
      var pth = body.querySelector('.fm-sth[data-id="' + pendingShort + '"]');
      if (pth) { pendingShort = null; if (pth.scrollIntoView) pth.scrollIntoView({ block: 'center' }); playShort(pth); }
    }
  }
  // Shorts play full screen in a viewer (tall 9:16, as big as the screen allows), with Previous / Next through the
  // Shorts of the row or grid it was opened from, Share, and a close button (the phone's Back button closes it too).
  var viewer = null, vlist = [], vpos = 0;
  function vshow() {
    var it = vlist[vpos]; if (!it) return;
    viewer.querySelector('.fv-frame').innerHTML = '<iframe src="https://www.youtube.com/embed/' + it.id + '?autoplay=1&rel=0&playsinline=1&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Short"></iframe>';
    viewer.querySelector('.fv-t').textContent = clean(it.title || '');
    viewer.querySelector('.fv-like').href = 'https://www.youtube.com/shorts/' + it.id;   // likes count only when given on YouTube itself
    viewer.querySelector('.fv-sub').href = 'https://www.youtube.com/channel/' + AZAM.id + '?sub_confirmation=1';
    viewer.querySelector('.fv-stat').textContent = statText(it.id) || '';
    var fb = viewer.querySelector('.fv-full'), fd = it.wide ? null : fullFor(it.id);
    fb.hidden = !fd; fb.textContent = '🎧 Full dars'; fb.__fd = fd;
    if (fd) azamFull(function (items) { if (fb.__fd === fd && !fullVideo(fd, items)) fb.textContent = '🎧 Full dars · soon'; });
    viewer.querySelector('.fv-prev').disabled = vpos <= 0;
    viewer.querySelector('.fv-next').disabled = vpos >= vlist.length - 1;
  }
  function vclose(fromBack) {
    if (!viewer || viewer.hidden) return;
    viewer.hidden = true; viewer.querySelector('.fv-frame').innerHTML = ''; doc.documentElement.style.overflow = '';
    if (!fromBack && root.history && root.history.state && root.history.state.fv) { try { root.history.replaceState(null, ''); } catch (e) {} }   // never leave the app
  }
  function vopen(list, pos) {
    if (!viewer) {
      var st = doc.createElement('style');
      st.textContent = '.fv[hidden]{display:none!important}.fv{position:fixed;inset:0;z-index:9999;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center}' +
        '.fv-frame{position:relative;height:calc(100% - 168px);max-height:calc(100vw * 16 / 9);aspect-ratio:9/16;max-width:100vw;background:#000}.fv-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}' +
        '.fv-top{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;gap:10px;padding:10px 12px;padding-top:max(10px,env(safe-area-inset-top));color:#f3e7c9;font-size:14px;z-index:2}' +
        '.fv-t{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fv button,.fv-bar a{background:rgba(255,255,255,.12);color:#f3e7c9;border:0;border-radius:999px;padding:9px 14px;font-size:15px;cursor:pointer;text-decoration:none;font-family:inherit}.fv-bar a.fv-sub{background:#c4302b;color:#fff}' +
        '.fv button:disabled{opacity:.35}.fv-bar{display:flex;flex-wrap:wrap;gap:8px 10px;justify-content:center;padding:8px 8px 0}.fv-bar2{padding-bottom:max(10px,env(safe-area-inset-bottom))}.fv-stat{width:100%;text-align:center;color:#cbbf9f;font-size:12px}.fv-x{font-size:18px!important;padding:6px 13px!important}' +
        '.fv-full{background:#e8c46b!important;color:#1c1a12!important;font-weight:700}.fv-full[hidden]{display:none}.fv-toast{position:absolute;bottom:120px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.85);color:#f3e7c9;padding:10px 16px;border-radius:12px;font-size:14px;max-width:86vw;text-align:center;z-index:3}.fv-frame{margin-top:52px}.fv.fv-wide .fv-frame{aspect-ratio:16/9;width:100vw;height:auto;max-height:calc(100% - 168px)}';
      doc.head.appendChild(st);
      viewer = doc.createElement('div'); viewer.className = 'fv'; viewer.hidden = true; viewer.setAttribute('role', 'dialog'); viewer.setAttribute('aria-label', 'Short');
      viewer.innerHTML = '<div class="fv-top"><span class="fv-t"></span><button type="button" class="fv-x" aria-label="Close">✕</button></div><div class="fv-frame"></div>' +
        '<div class="fv-bar"><span class="fv-stat"></span><a class="fv-like" target="_blank" rel="noopener">👍 Like</a><a class="fv-sub" target="_blank" rel="noopener">🔔 Subscribe</a><button type="button" class="fv-share">↗ Share</button><button type="button" class="fv-full" hidden>🎧 Full dars</button></div>' +
        '<div class="fv-bar fv-bar2"><button type="button" class="fv-prev">‹ Previous</button><button type="button" class="fv-next">Next ›</button></div>';
      doc.body.appendChild(viewer);
      viewer.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('button'); if (!b) return;
        if (b.classList.contains('fv-x')) vclose();
        else if (b.classList.contains('fv-prev') && vpos > 0) { vpos--; vshow(); }
        else if (b.classList.contains('fv-next') && vpos < vlist.length - 1) { vpos++; vshow(); }
        else if (b.classList.contains('fv-share')) { var it = vlist[vpos]; if (it) shareShort(it.id, it.title); }
        else if (b.classList.contains('fv-full') && b.__fd) {
          var fd = b.__fd;
          azamFull(function (items) {
            var v = fullVideo(fd, items);
            if (v) { vlist = [{ id: v.id, title: v.title, wide: true }]; vpos = 0; viewer.classList.add('fv-wide'); vshow(); }
            else { var t = doc.createElement('div'); t.className = 'fv-toast'; t.textContent = 'The full dars “' + fd.title + '” is coming soon, in sha Allah.'; viewer.appendChild(t); setTimeout(function () { t.remove(); }, 3000); }
          });
        }
      });
      doc.addEventListener('keydown', function (e) { if (viewer.hidden) return; if (e.key === 'Escape') vclose(); else if (e.key === 'ArrowRight' && vpos < vlist.length - 1) { vpos++; vshow(); } else if (e.key === 'ArrowLeft' && vpos > 0) { vpos--; vshow(); } });
      root.addEventListener('popstate', function () { vclose(true); });
    }
    vlist = list; vpos = pos; viewer.classList.toggle('fv-wide', !!(list[0] && list[0].wide)); viewer.hidden = false; doc.documentElement.style.overflow = 'hidden';
    try { if (!(root.history.state && root.history.state.fv)) root.history.pushState({ fv: 1 }, ''); } catch (e) {}
    vshow();
  }
  function playShort(th) {
    if (!th || !validId(th.getAttribute('data-id'))) return false;
    var box = th.closest('.fm-grid, .fm-hs, .fm-full') || th.parentNode, ths = Array.prototype.slice.call(box.querySelectorAll('.fm-sth'));
    var list = ths.filter(function (t) { return validId(t.getAttribute('data-id')); }).map(function (t) { return { id: t.getAttribute('data-id'), title: (t.getAttribute('aria-label') || '').replace(/^Play /, ''), wide: t.classList.contains('fm-wide') }; });
    var pos = Math.max(0, ths.indexOf(th)); if (!list.length) list = [{ id: th.getAttribute('data-id'), title: '' }];
    vopen(list, Math.min(pos, list.length - 1));
    return true;
  }

  body.addEventListener('click', function (e) {
    if (playShort(e.target.closest && e.target.closest('.fm-sth'))) return;
    var o = e.target.closest && e.target.closest('.fm-order span'); if (o) { sset('noor_family_order_' + tab, o.getAttribute('data-o') === 'old' ? 'old' : 'new'); limit = SHOW; paint(); return; }
    if (e.target.closest && e.target.closest('.fm-more')) { limit += SHOW; paint(); return; }
    var tpc = e.target.closest && e.target.closest('[data-tp]'); if (tpc) { topic = +tpc.getAttribute('data-tp') || 0; limit = SHOW; paint(); return; }
    var c = e.target.closest && e.target.closest('.fm-chip'); if (c && c.hasAttribute('data-w')) { who = +c.getAttribute('data-w') || 0; limit = SHOW; paint(); return; }
    var th = e.target.closest && e.target.closest('.fm-th');
    if (th && !th.querySelector('iframe') && validId(th.getAttribute('data-id'))) {
      th.innerHTML = '<iframe src="https://www.youtube.com/embed/' + th.getAttribute('data-id') + '?autoplay=1&rel=0&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Video"></iframe>'; return;
    }
    if (e.target.id === 'fmRetry' || e.target.id === 'fmRefresh') { e.preventDefault(); if (STATS) STATS.t = 0; load(true); }
  });

  api.ZIKR = ZIKR; api.AZAM = AZAM; api.open = function (which) { if (kalaam === null) loadKalaam(); if (pinned === null) loadPinned(); if (which === 'poetry' || which === 'dars' || which === 'zikr' || which === 'azam') { if (tab !== which) { who = 0; topic = 0; limit = SHOW; } tab = which; } state = stateFor(tab); paint(); N.showScreen('family'); if (state.items === null) load(false); };
  // For Azam Pasha's profile page: calls back with the Shorts list (loaded once, then cached for 30 minutes).
  api.azamShorts = function (cb) {
    if (astate.items !== null && !astate.loading) { cb(astate); return; }
    astate.waiters.push(cb); if (!astate.loading) load(false, 'azam');
  };

  // (Only titles with Azam Pasha or dars: the channel also has other long uploads.)
  // Full-length dars videos on the Azam Pasha Zikr channel (its long-videos playlist, UC... -> UULF...), newest first.
  var FULL = null, fullWait = [];
  function azamFull(cb) {
    if (FULL) { cb(FULL); return; }
    fullWait.push(cb); if (fullWait.length > 1) return;
    var fin = function (items) { FULL = items; var w = fullWait; fullWait = []; w.forEach(function (f) { try { f(items); } catch (e) {} }); };
    var c = null; try { c = JSON.parse(sget('noor_azam_full_v2') || 'null'); } catch (e) {}
    if (c && Date.now() - c.t < TTL) { fin(c.items); return; }
    var key = cfg.youtubeApiKey; if (!key || !/^UC/.test(AZAM.id || '')) { fin([]); return; }
    fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=UULF' + AZAM.id.slice(2) + '&key=' + encodeURIComponent(key))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { var items = toItems([d]).filter(function (v) { return /azam\s*pasha|\u0627\u0639\u0638\u0645\s*\u067E\u0627\u0634\u0627|\bdars\b/i.test(v.title); }); sset('noor_azam_full_v2', JSON.stringify({ t: Date.now(), items: items })); fin(items); },
            function () { fin(c && c.items || []); });
  }
  // Each full dars and the Shorts cut from it (video ids). A Short's viewer shows a "Full dars" button for its dars:
  // it plays the full video once it is on the channel (found by `match` in the title), and says "coming soon" until then.
  // New Shorts: add their ids here (or set fullDars in config.js).
  var FULLDARS = (cfg.fullDars || [
    { title: "The Soul's Journey, Death, the Scale and the Blessed Malida", match: 'soul|malida',
      shorts: ['JfQsTHE7VrU', 'tayZJTuWGkU', 'NSWYCYR-Tlo', 'EQbitUdOKqQ', '2yjNqJo659g', 'eNHL-OsPxgQ', 'ZHg4XMwt3Ok'] },
    { title: "Haqeeqat-e-Bai'at", match: 'haqeeqat|haqiqat',   // both recordings joined into one full dars
      shorts: ['g8-0WIXYjcM', 'r3x7LQru71I', '7wB9EQldsew', 'E7xb4BR6IPQ', 'kziC4lPGmgU', 'Rno3f3mGjyg', 'jRK1SIkPkV0', '3githsE0o6Y', 'ENBkebr3nJI', 'RFLGxcbYBCM', 'cbWGnUMd530', '77ZE201Hbjw', 'Fq8X-k08A5Y'] }
  ]);
  function fullFor(id) { return FULLDARS.filter(function (f) { return (f.shorts || []).indexOf(id) >= 0; })[0] || null; }
  function fullVideo(f, items) {
    var re; try { re = new RegExp(f.match, 'i'); } catch (e) { return null; }
    var p2 = /part/i.test(f.title) && /2/.test(f.title);
    return (items || []).filter(function (v) { return re.test(v.title) && (p2 ? /part\s*2|\b2\b/i.test(v.title) : !/part\s*2/i.test(v.title)); })[0] || null;
  }
  api.azamFull = azamFull;
  api.shortsGrid = shortsGrid; api.playShort = playShort; api.subscribeLink = subscribeLink;
  // Home page: a sideways-scrolling row of the newest Azam Pasha Zikr Shorts. The section stays hidden until there are Shorts.
  api.homeStrip = function (wrap) {
    if (!wrap) return;
    var row = wrap.querySelector('.fm-hs');
    api.azamShorts(function (st) {
      var list = (st.items || []).slice(0, 12);
      if (!list.length) { wrap.hidden = true; return; }
      var hs = doc.getElementById('homeSub'); if (hs && !hs.firstChild) hs.innerHTML = subscribeLink();
      row.innerHTML = list.map(shortTile).join('') + '<div class="fm-all" role="button">All Shorts ›</div>'; ensureStats(list);
      wrap.hidden = false;
    });
    if (!row.__wired) {
      row.__wired = true;
      row.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('.fm-all')) { api.open('azam'); return; }
        var th = e.target.closest && e.target.closest('.fm-sth');
        if (th) { Array.prototype.forEach.call(row.querySelectorAll('.fm-sth iframe'), function (f) { var t = f.parentNode; if (t !== th) { t.innerHTML = '<img alt="" src="https://i.ytimg.com/vi/' + t.getAttribute('data-id') + '/hqdefault.jpg"><div class="fm-play">▶</div>'; } }); playShort(th); }
      });
    }
  };
  api.homeStrip(doc.getElementById('homeShorts'));
  // Opened from a "New Short" notification (?short=<id>): show the Shorts screen and play that Short.
  (function () {
    var m = /[?&]short=([\w-]{11})(?:&|$)/.exec(root.location ? root.location.search : '');
    if (!m) return;
    pendingShort = m[1];
    try { root.history.replaceState(null, '', root.location.pathname); } catch (e) {}
    setTimeout(function () { api.open('azam'); }, 400);
    setTimeout(function () {   // not in the list (for example just published): play it on its own at the top
      if (!pendingShort || tab !== 'azam') return;
      var id = pendingShort; pendingShort = null;
      var box = doc.createElement('div'); box.innerHTML = shortsGrid([{ id: id, title: 'New Short' }]);
      body.insertBefore(box, body.firstChild); playShort(box.querySelector('.fm-sth'));
    }, 12000);
  })();
  N.onScreen(function (id) { if (id === 'family' && state.items !== null && !state.loading) load(false); });
  paint();
})(typeof self !== 'undefined' ? self : this);
