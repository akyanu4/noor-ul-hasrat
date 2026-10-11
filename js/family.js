/* Noor: videos from the family YouTube channel (Shadman): Poetry & Naat, and Dars & Tafseer.
   Uses the same free YouTube API key as the class list (config.js: youtubeApiKey). Videos play inside the app (YouTube embed). */
(function (root) {
  'use strict';

  var DEFAULTS = { id: 'UCi1Sn0S3O29-Hw87RT_fOXw', name: 'Shadman', url: 'https://www.youtube.com/@Shadman-ob4wf' };
  var TTL = 30 * 60 * 1000, PAGES = 3;

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
  var tab = 'poetry', state = { items: null, error: '', loading: false };
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
    '.fm-btn{display:block;text-align:center;background:var(--gold);color:#1a2421;font-weight:700;border-radius:12px;padding:13px;font-size:15px;text-decoration:none;margin:12px 0}';
  doc.head.appendChild(css);

  var s = N.el('div', 'screen', '<div class="subhead"><div class="backbtn" id="fmBack">←</div><div class="subtitle">Poetry, Naat &amp; Dars</div></div><div id="fmBody"></div>');
  s.id = 'screen-family'; doc.querySelector('.screens').appendChild(s);
  var body = s.querySelector('#fmBody');
  s.querySelector('#fmBack').addEventListener('click', function () { N.backTab(); });

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

  function ago(iso) {
    var t = Date.parse(iso || ''); if (!t) return '';
    var d = Math.floor((Date.now() - t) / 86400000);
    return d < 1 ? 'today' : d < 31 ? d + (d === 1 ? ' day ago' : ' days ago') : d < 365 ? Math.floor(d / 30) + ' mo ago' : Math.floor(d / 365) + ' yr ago';
  }

  function paint() {
    var h = '<div class="fm-tabs"><div class="fm-tab' + (tab === 'poetry' ? ' on' : '') + '" data-t="poetry">Poetry &amp; Naat</div><div class="fm-tab' + (tab === 'dars' ? ' on' : '') + '" data-t="dars">Dars &amp; Tafseer</div></div>';
    var list = (state.items || []).filter(function (v) { return v.kind === tab; });
    if (state.loading && !state.items) h += '<div class="fm-note">Loading the latest videos…</div>';
    else if (state.error === 'unconfigured') h += '<div class="fm-note">The live list is not connected yet (add <b>youtubeApiKey</b> in js/config.js). You can still watch on the channel below.</div>';
    else if (state.error && state.error !== 'stale') h += '<div class="fm-note">Could not load the videos (' + esc(state.error) + '). <a href="#" id="fmRetry">Try again</a></div>';
    else if (!list.length) h += '<div class="fm-note">' + (tab === 'poetry' ? 'No poetry or naat videos found yet. They are sorted by the words in each title, so a video titled without words like Naat, Nazm, Kalam, Manqabat or Poetry shows under Dars &amp; Tafseer. Everything is on the channel below.' : 'No videos found yet.') + '</div>';
    list.forEach(function (v) {
      h += '<div class="fm-card"><div class="fm-th" data-id="' + v.id + '" role="button" aria-label="Play ' + esc(v.title) + '"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/' + v.id + '/mqdefault.jpg"><div class="fm-play">▶</div></div>' +
        '<div class="fm-t">' + esc(v.title) + '</div><div class="fm-m"><span>' + esc(ago(v.at)) + '</span><a target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=' + v.id + '">Open on YouTube ↗</a></div></div>';
    });
    h += '<a class="fm-btn" target="_blank" rel="noopener" href="' + esc(/^https:\/\//.test(fam.url) ? fam.url : DEFAULTS.url) + '">Open the ' + esc(fam.name) + ' channel on YouTube ›</a>' +
      '<div class="fm-note">Videos are from the family\'s own channel and play from YouTube. They are sorted into Poetry &amp; Naat and Dars &amp; Tafseer automatically, by the words in each title.' + (state.error === 'stale' ? ' (Showing the saved list: you appear to be offline.)' : '') + ' <a href="#" id="fmRefresh">Refresh ↻</a></div>';
    body.innerHTML = h;
  }

  body.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.fm-tab'); if (t) { tab = t.getAttribute('data-t'); paint(); return; }
    var th = e.target.closest && e.target.closest('.fm-th');
    if (th && !th.querySelector('iframe') && validId(th.getAttribute('data-id'))) {
      th.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + th.getAttribute('data-id') + '?autoplay=1&rel=0&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Video"></iframe>'; return;
    }
    if (e.target.id === 'fmRetry' || e.target.id === 'fmRefresh') { e.preventDefault(); load(true); }
  });

  api.open = function (which) { if (which === 'poetry' || which === 'dars') tab = which; paint(); N.showScreen('family'); if (state.items === null) load(false); };
  N.onScreen(function (id) { if (id === 'family' && state.items !== null && !state.loading) load(false); });
  paint();
})(typeof self !== 'undefined' ? self : this);
