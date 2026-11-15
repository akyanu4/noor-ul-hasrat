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

  // Shorts re-uploaded with the channel watermark burned in: original id -> watermarked copy. Both stay public on YouTube;
  // the app shows only the watermarked one once it is on the channel, so the list has no doubles.
  var WATERMARKED = { JfQsTHE7VrU: 'TgmQQhX_8tU', tayZJTuWGkU: 'PO-sKtkwc60', 'NSWYCYR-Tlo': 'pWWkdTuJM9c', EQbitUdOKqQ: 'N-8fydZ8lg4',
    '2yjNqJo659g': 'JCBJ2SK79Q8', 'eNHL-OsPxgQ': 'X4CTCYjFU3o', 'g8-0WIXYjcM': 'VlU4EcJGVgQ', 'Fq8X-k08A5Y': 'mWwJL6BTEZY',
    '7wB9EQldsew': 'ObW6ccXEwn4',
    E7xb4BR6IPQ: 'gkYbWlFLc3w', kziC4lPGmgU: '56xW_CnWB0w', Rno3f3mGjyg: '883RmkRT9mE', jRK1SIkPkV0: 'T4cTs3h1QoI',
    '3githsE0o6Y': '50SwaP11-vk', cbWGnUMd530: 'TkSFt5BlMzs', '77ZE201Hbjw': 'ufZ_iEByRmI' };
  function toItems(pages) {
    var seen = {}, out = [];
    pages.forEach(function (data) {
      (data.items || []).forEach(function (it) {
        var s = it.snippet || {}, id = s.resourceId && s.resourceId.videoId;
        if (!validId(id) || seen[id] || !s.title || s.title === 'Private video' || s.title === 'Deleted video') return;
        seen[id] = 1; out.push({ id: id, title: s.title, at: s.publishedAt, kind: kind(s.title, s.description) });
      });
    });
    out = out.filter(function (x) { var w = WATERMARKED[x.id]; return !(w && seen[w]); });
    return out.sort(function (a, b) { return (Date.parse(b.at || 0) || 0) - (Date.parse(a.at || 0) || 0); });
  }

  var api = { kind: kind, toItems: toItems, WATERMARKED: WATERMARKED, validId: validId, uploads: uploads, shortsList: shortsList, DEFAULTS: DEFAULTS };
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
    '.fm-prac{position:absolute;left:6px;top:6px;background:rgba(15,61,62,.88);color:#f3e7c9;border:1px solid rgba(232,196,107,.6);border-radius:999px;padding:2px 8px;font-size:11px;font-weight:600}' +
    '.fm-full{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -18px 12px;padding:0 18px 6px;scrollbar-width:none}.fm-full::-webkit-scrollbar{display:none}.fm-full .fm-sc{flex:none;width:78%;max-width:360px;scroll-snap-align:start}.fm-sth.fm-wide{aspect-ratio:16/9}.fm-fh{margin:6px 0 8px;font-size:15px;color:var(--teal)}.fm-soonth{cursor:default;background:linear-gradient(135deg,#123b33,#2a2410);display:flex;align-items:center;justify-content:center}.fm-soonin{text-align:center;color:#e8c46b;font-size:14px;line-height:1.5}' +
    '.fm-hs{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -18px 4px;padding:0 18px 6px;scrollbar-width:none}.fm-hs::-webkit-scrollbar{display:none}.fm-hs .fm-sc{flex:none;width:42%;max-width:190px;scroll-snap-align:start}.fm-hs .fm-all{flex:none;width:30%;max-width:140px;display:flex;align-items:center;justify-content:center;text-align:center;border:1px dashed var(--line);border-radius:14px;color:var(--teal);font-weight:700;font-size:13px;cursor:pointer;scroll-snap-align:start;padding:8px}' +
    '.fm-acts{display:flex;gap:6px;margin:6px 8px 10px}.fm-acts .fm-like{flex:1;margin:0;font:inherit;font-size:12px;font-weight:600;background:transparent;cursor:pointer}' +
    '.fm-sub{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:700;color:#fff;background:#c4302b;border-radius:999px;padding:6px 12px;text-decoration:none;white-space:nowrap}' +
    '.fm-toast{position:fixed;left:50%;bottom:86px;transform:translateX(-50%);background:#1a2421;color:#fff;font-size:13px;padding:9px 14px;border-radius:999px;z-index:9999;box-shadow:0 4px 14px rgba(0,0,0,.25)}' +
    '.fm-stat{padding:0 10px;font-size:12px;color:var(--muted);min-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fm-like{display:block;margin:6px 10px 10px;padding:6px 0;text-align:center;font-size:12px;font-weight:600;color:var(--teal);border:1px solid var(--line);border-radius:10px;text-decoration:none}' +
    '.fm-st{padding:8px 10px 4px;font-size:12.5px;font-weight:600;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
    // Shorts hub: Short of the Day, Continue, Start here, series with progress, NEW badges, WhatsApp
    '.fm-new{position:absolute;right:6px;top:6px;background:#c4302b;color:#fff;border-radius:999px;padding:2px 7px;font-size:10px;font-weight:800;letter-spacing:.05em}' +
    '.fm-done{position:absolute;right:6px;bottom:6px;background:rgba(0,0,0,.65);color:#e8c46b;border-radius:999px;padding:1px 7px;font-size:11px;font-weight:700}' +
    '.fm-acts .fm-wa,.sh-wa{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:5px;background:#25D366;color:#fff;border-radius:10px;text-decoration:none;font-weight:700}.fm-acts .fm-wa{width:32px}.fm-acts .fm-wa svg,.sh-wa svg{width:16px;height:16px}' +
    '.fm-acts .fm-like{white-space:nowrap}.fm-hs .fm-acts .fm-like{font-size:14px;padding:5px 0}.fm-hs .fm-acts .fm-like span{display:none}' +
    '.sh-h{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:16px 0 8px;font-size:15px;font-weight:700;color:var(--ink)}.sh-h small{font-size:11.5px;font-weight:500;color:var(--muted)}.sh-h:first-child{margin-top:4px}' +
    '.sh-sotd{display:flex;gap:12px;background:linear-gradient(135deg,var(--teal),var(--teal-deep));border-radius:16px;padding:10px;color:#f5f1e2;margin:0 0 6px;cursor:pointer;box-shadow:0 6px 18px rgba(10,43,44,.18)}' +
    '.sh-sotd .sh-th{position:relative;flex:none;width:112px;aspect-ratio:9/16;border-radius:12px;overflow:hidden;background:#000}.sh-th img{width:100%;height:100%;object-fit:cover;display:block}.sh-sotd .fm-play{width:40px;height:40px;font-size:16px}' +
    '.sh-tx{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center}.sh-k{font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:#e8c46b;font-weight:700}' +
    '.sh-tt{font-family:Amiri,serif;font-size:21px;line-height:1.25;margin:6px 0 4px;font-weight:700;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.sh-by{font-size:12px;opacity:.8}' +
    '.sh-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.sh-go{background:#e8c46b;color:#1c1a12;border:0;border-radius:999px;padding:8px 14px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}.sh-btns .sh-wa{border-radius:999px;padding:8px 12px;font-size:13px}' +
    '.sh-cont,.sh-ser{display:flex;gap:10px;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:8px 10px 8px 8px;margin:8px 0;cursor:pointer}.sh-cont{border-color:var(--gold)}' +
    '.sh-sth{position:relative;flex:none;width:46px;aspect-ratio:9/16;border-radius:8px;overflow:hidden;background:#000}.sh-ci{flex:1;min-width:0}.sh-ck{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sh-ct{font-size:14px;font-weight:700;line-height:1.3;margin:2px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.sh-cm{font-size:12px;color:var(--muted)}.sh-cm b{color:var(--ink)}' +
    '.sh-bar{height:5px;background:var(--line);border-radius:3px;overflow:hidden;margin-top:6px}.sh-bar i{display:block;height:100%;background:var(--gold);border-radius:3px}.sh-chev{flex:none;color:var(--muted);font-size:20px}.sh-cont .sh-chev{color:var(--gold);font-size:22px}' +
    '.sh-back{display:inline-block;margin:0 0 10px;color:var(--teal);font-weight:700;font-size:13.5px;cursor:pointer}.sh-req{border:0;background:var(--gold);color:#1a2421;font:inherit;font-size:12.5px;font-weight:700;border-radius:999px;padding:6px 12px;cursor:pointer;white-space:nowrap}' +
    '.sh-row{display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);cursor:pointer}.sh-row:last-child{border-bottom:0}.sh-n{flex:none;width:26px;height:26px;border-radius:50%;border:1.5px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--muted)}.sh-row.done .sh-n{background:var(--teal);border-color:var(--teal);color:#fff}' +
    '.sh-rt{flex:1;min-width:0;font-size:13.5px;font-weight:600;line-height:1.35}.sh-rt small{display:block;font-weight:400;color:var(--muted);font-size:11.5px;margin-top:2px}.sh-list{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:2px 12px;margin-bottom:12px}';
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
    var st = stateFor(t), ch = t === 'zikr' ? ZIKR : t === 'azam' ? AZAM : fam, ck = t === 'zikr' ? 'noor_zikr_v1' : t === 'azam' ? 'noor_azam_v4' : 'noor_family_v1';
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
    s.querySelector('#fmTitle').textContent = tab === 'poetry' ? 'Poetry & Naat' : tab === 'zikr' ? 'Zikr & Sama' : tab === 'azam' ? 'Dars Highlights' : 'Dars & Tafseer';
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
  function statInit() { if (STATS === null) { try { STATS = JSON.parse(sget('noor_short_stats_v1') || 'null'); } catch (e) {} if (!STATS || !STATS.v) STATS = { t: 0, v: {} }; } return STATS; }
  function ensureStats(list) {
    statInit();
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
      .then(function () { statsBusy = false; fillStats(); statsHook(); });
  }
  function thumb(id) { return '<img loading="lazy" alt="" src="https://i.ytimg.com/vi/' + id + '/oardefault.jpg" onerror="this.onerror=null;this.src=\'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg\'">'; }
  // WhatsApp: a ready message with the Short's YouTube link and the app's address.
  var WA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3.6 20.4l1.3-4.1A8.4 8.4 0 1 1 8 19.3z"/><path d="M9.1 7.6c-.5 3.6 3.4 7.6 7 7.1l.6-1.8-2.1-1-1 1c-1.1-.5-2-1.4-2.5-2.5l1-1-1-2.1z" fill="currentColor" stroke="none"/></svg>';
  function waUrl(id, title) {
    return 'https://wa.me/?text=' + encodeURIComponent((clean(title || '') || 'A dars highlight') + ' — Hazrat Azam Pasha R.A. https://youtube.com/shorts/' + id + '  Noor-ul-Hasrat app: https://noor-ul-hasrat.vercel.app');
  }
  function waLink(id, title, cls, label) { return '<a class="' + cls + '" target="_blank" rel="noopener" href="' + esc(waUrl(id, title)) + '" aria-label="Share on WhatsApp">' + WA_SVG + (label || '') + '</a>'; }
  function isNew(v) { var t = Date.parse(v && v.at || ''); return !!t && Date.now() - t < 7 * 86400000; }
  function shortTile(v) {
    return '<div class="fm-sc"><div class="fm-sth" data-id="' + v.id + '" role="button" aria-label="Play ' + esc(v.title) + '">' +
      thumb(v.id) + '<div class="fm-play">▶</div>' + (isPractice(v) ? '<div class="fm-prac">' + (locked(v) ? '🔒 Murids' : '🤝 Bay\u2019ah') + '</div>' : '') +
      (isNew(v) ? '<div class="fm-new">NEW</div>' : '') + (isWatched(v.id) ? '<div class="fm-done">✓</div>' : '') + '</div>' +
      '<div class="fm-st">' + esc(v.title) + '</div>' +
      '<div class="fm-stat" data-sid="' + v.id + '">' + esc(statText(v.id)) + '</div>' +
      '<div class="fm-acts"><a class="fm-like" target="_blank" rel="noopener" href="https://www.youtube.com/shorts/' + v.id + '" aria-label="Like on YouTube">👍<span> Like</span></a>' +
      '<button type="button" class="fm-like fm-share" data-sid="' + v.id + '" data-t="' + esc(v.title) + '" aria-label="Share">↗<span> Share</span></button>' + waLink(v.id, v.title, 'fm-wa') + '</div></div>';
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
  // Azam Pasha Shorts page: topic chips, New this week, Most loved, Series (with progress), For murids, then All (filtered by chip).
  // A series opens as its own ordered list. Every row hides itself when it has nothing to show.
  function paintShorts(list) {
    var h = '<div style="margin:0 0 8px">' + subscribeLink() + '</div>';
    if (ser != null) { var sr = seriesAll().filter(function (x) { return x.key === ser; })[0]; if (sr) { body.innerHTML = seriesView(sr); return; } ser = null; }
    h += '<div class="fm-note" style="margin-top:0">Dars Highlights: short clips from the dars of Hazrat Azam Pasha R.A., from the ' + esc(AZAM.name) + ' channel. New ones appear here by themselves. Tap one to play it.</div>';
    if (state.loading && !state.items) h += '<div class="fm-note">Loading the latest highlights…</div>';
    else if (state.error === 'unconfigured') h += '<div class="fm-note">The live list is not connected yet (add <b>youtubeApiKey</b> in js/config.js).</div>';
    else if (state.error && state.error !== 'stale') h += '<div class="fm-note">Could not load the highlights (' + esc(state.error) + '). <a href="#" id="fmRetry">Try again</a></div>';
    else if (!list.length) h += '<div class="fm-note">No highlights yet.</div>';
    var tps = list.length ? STOPICS.filter(function (t) { return list.some(function (v) { return topicsOf(v).indexOf(t.name) >= 0; }); }) : [];
    if (stopic && !tps.some(function (t) { return t.name === stopic; })) stopic = '';
    if (tps.length) h += '<div class="fm-chips"><div class="fm-chip' + (stopic ? '' : ' on') + '" data-st="">All</div>' + tps.map(function (t) { return '<div class="fm-chip' + (stopic === t.name ? ' on' : '') + '" data-st="' + esc(t.name) + '">' + esc(t.label) + '</div>'; }).join('') + '</div>';
    if (stopic) {
      list = list.filter(function (v) { return topicsOf(v).indexOf(stopic) >= 0; });
      h += '<div class="sh-h"><span>' + esc(topicLabel(stopic)) + '</span><small>' + list.length + ' highlight' + (list.length === 1 ? '' : 's') + '</small></div>';
    } else if (list.length) {
      var sdp = sotd();
      if (sdp && sdp.path) h += pathRow(sdp, 8);
      var ss = seriesAll();
      if (ss.length) h += '<div class="sh-h"><span>Series</span><small>watch in order</small></div>' + ss.map(seriesCard).join('');
      var pr = list.filter(isPractice);
      if (pr.length) {
        var anyLock = pr.some(locked);
        h += '<div class="sh-h"><span>For murids ' + (anyLock ? '🔒' : '🤝') + '</span>' + (anyLock ? '<button type="button" class="sh-req">🤝 Request Bai\u2019at</button>' : '<small>practices of dhikr</small>') + '</div>' + rowHtml(pr);
      }
      var nw = list.filter(isNew);
      if (nw.length) h += '<div class="sh-h"><span>New this week</span><small>' + nw.length + ' new</small></div>' + rowHtml(nw);
      h += lovedHtml(list);
      h += '<div class="sh-h"><span>All highlights</span><small>newest first</small></div>';
    }
    var total = list.length; list = list.slice(0, limit);
    h += shortsGrid(list);
    if (total > list.length) h += '<button class="fm-btn fm-more" type="button" style="border:0;cursor:pointer">Show more (' + (total - list.length) + ' left)</button>';
    h += '<div class="fm-note">' + total + ' Short' + (total === 1 ? '' : 's') + (state.error === 'stale' ? ' (Showing the saved list: you appear to be offline.)' : '') + ' <a href="#" id="fmRefresh">Refresh ↻</a></div>';
    body.innerHTML = h;
    if (!stopic && state.items && state.items.length) ensureStats(state.items);   // Most loved needs every Short's likes
    if (pendingShort && !state.loading) {   // opened from a notification: play that Short once the list is in
      var pth = body.querySelector('.fm-sth[data-id="' + pendingShort + '"]');
      if (pth) { pendingShort = null; if (pth.scrollIntoView) pth.scrollIntoView({ block: 'center' }); playShort(pth); }
    }
  }

  /* ---------- Bay'ah guidance and sign-in for dhikr practices ----------
     Full dars videos and the Shorts that teach a practice of dhikr (Tasawwur-e-Shaykh, Zarb-e-Haidari, Taqwa: eat less,
     sleep less, speak less; Sabr, Tasleem, Raza) carry a reminder to take Bay'ah and follow a guide. In the app they
     play for signed-in members once accounts are switched on (More → My Account). They stay public on YouTube. */
  var PRACTICE_IDS = { dyHUfOLlVTs: 1, '3githsE0o6Y': 1, '50SwaP11-vk': 1, oWZt1YfJ3io: 1, mwPT8CFRfR0: 1,
    PvTqdGvfuQw: 1, UFGrLXEdwmk: 1, '2zH6zC_Z8P4': 1, Tv8U5Rk8kF4: 1, EbnxYFqNhXI: 1, SBy10BJdsdk: 1, QKlEyf9c7tg: 1, z698TQzQjQg: 1 };   // + Nizam-ul-Amal 6 and 7 meditations
  var PRACTICE_RE = /tasawwur|zarb[-\s]*e[-\s]*haidari|you have become my teacher|eat less,? sleep less|sabr,? tasleem|\bmuraqaba|\bpractice of (zikr|dhikr)/i;
  (cfg.practiceShorts || []).forEach(function (id) { PRACTICE_IDS[id] = 1; });
  function isPractice(it) { return !!(it && (it.wide || PRACTICE_IDS[it.id] || PRACTICE_RE.test(it.title || ''))); }
  // Full dars and dhikr-practice Shorts: for signed-in members who have taken Bai'at (marked in My Account).
  function lockReason(it) {
    var A = root.NoorAccount; if (!isPractice(it) || !(A && A.on)) return '';
    if (!A.user()) return 'signin';
    var st = A.bayahStatus ? A.bayahStatus() : 'approved';
    return st === 'approved' ? '' : st === 'pending' ? 'pending' : 'bayah';
  }
  function locked(it) { return !!lockReason(it); }
  var BAYAH_EN = 'Practices of dhikr are learnt from a guide. Take Bay\u2019ah with a Shaykh or his Khalifa and follow their guidance, so that you reach the right station (maqam).';
  var BAYAH_UR = '\u0630\u06a9\u0631 \u06a9\u06d2 \u0637\u0631\u06cc\u0642\u06d2 \u06a9\u0633\u06cc \u0631\u06c1\u0628\u0631 \u0633\u06d2 \u0633\u06cc\u06a9\u06be\u06d2 \u062c\u0627\u062a\u06d2 \u06c1\u06cc\u06ba\u06d4 \u06a9\u0633\u06cc \u0634\u06cc\u062e \u06cc\u0627 \u0627\u0646 \u06a9\u06d2 \u062e\u0644\u06cc\u0641\u06c1 \u0633\u06d2 \u0628\u06cc\u0639\u062a \u06a9\u0631\u06cc\u06ba \u0627\u0648\u0631 \u0627\u0646 \u06a9\u06cc \u0631\u06c1\u0646\u0645\u0627\u0626\u06cc \u0645\u06cc\u06ba \u0686\u0644\u06cc\u06ba\u060c \u062a\u0627\u06a9\u06c1 \u0635\u062d\u06cc\u062d \u0645\u0642\u0627\u0645 \u062a\u06a9 \u067e\u06c1\u0646\u0686\u06cc\u06ba\u06d4';
  api.isPractice = isPractice; api.BAYAH_EN = BAYAH_EN; api.BAYAH_UR = BAYAH_UR;
  // Shorts play full screen in a viewer (tall 9:16, as big as the screen allows), with Previous / Next through the
  // Shorts of the row or grid it was opened from, Share, and a close button (the phone's Back button closes it too).
  var viewer = null, vlist = [], vpos = 0;
  function vshow() {
    var it = vlist[vpos]; if (!it) return;
    var prac = isPractice(it), bn = viewer.querySelector('.fv-bayah');
    bn.hidden = !prac || locked(it); bn.open = false;
    if (locked(it)) {
      var why = lockReason(it), what = it.wide ? 'full dars' : 'highlight';
      viewer.querySelector('.fv-frame').innerHTML = '<div class="fv-gate"><div class="fv-gi">🤝</div><b>For murids who have taken Bai\u2019at</b><p>' + esc(BAYAH_EN) + '</p><p class="ur" dir="rtl" lang="ur">' + esc(BAYAH_UR) + '</p>' +
        (why === 'signin'
          ? '<p>This ' + what + ' teaches a practice of dhikr. Sign up (free), then tell us in My Account that you have taken Bai\u2019at, and it opens here.</p><button type="button" class="fv-signin">Sign up or sign in</button>'
          : why === 'pending'
          ? '<p>JazakAllah khair. Your Bai\u2019at is waiting for the admin\u2019s approval. Once it is approved, this ' + what + ' opens here.</p><button type="button" class="fv-signin fv-bay">See my Bai\u2019at status</button>'
          : '<p>Have you taken Bai\u2019at with a Shaykh or his Khalifa? Mark it in My Account. After the admin approves it, this ' + what + ' opens here.</p><button type="button" class="fv-signin fv-bay">Yes, I have taken Bai\u2019at</button>') +
        '<button type="button" class="fv-how">How to take Bai\u2019at</button></div>';
    } else viewer.querySelector('.fv-frame').innerHTML = '<iframe src="https://www.youtube.com/embed/' + it.id + '?autoplay=1&rel=0&playsinline=1&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Short"></iframe>';
    viewer.querySelector('.fv-t').textContent = clean(it.title || '');
    viewer.querySelector('.fv-like').href = 'https://www.youtube.com/shorts/' + it.id;   // likes count only when given on YouTube itself
    viewer.querySelector('.fv-sub').href = viewer.querySelector('.fv-subl').href = 'https://www.youtube.com/channel/' + AZAM.id + '?sub_confirmation=1'; viewer.querySelector('.fv-subp').hidden = true;
    viewer.querySelector('.fv-stat').textContent = statText(it.id) || '';
    var wa = viewer.querySelector('.fv-wa'); wa.hidden = !!it.wide; wa.href = waUrl(it.id, it.title);
    if (!it.wide && !locked(it)) markWatched(it.id);
    var fb = viewer.querySelector('.fv-full'), fd = it.wide ? null : fullFor(it.id);
    fb.hidden = !fd; fb.querySelector('.lb').textContent = 'Full dars'; fb.__fd = fd;
    if (fd) azamFull(function (items) { if (fb.__fd === fd && !fullVideo(fd, items)) fb.querySelector('.lb').textContent = 'Soon'; });
    viewer.querySelector('.fv-prev').disabled = vpos <= 0;
    var nt = nextTarget(), nb = viewer.querySelector('.fv-next');
    nb.disabled = !nt; nb.title = nt && nt.series ? 'Next in ' + nt.series : 'Next highlight';
  }
  // Next: the next Short of the same series when the playing Short belongs to one, otherwise the next in the list it was opened from.
  function nextTarget() {
    var it = vlist[vpos]; if (!it) return null;
    var sr = it.wide ? null : seriesOf(it.id);
    if (sr) { var i = indexIn(sr.items, it.id); if (i >= 0 && i < sr.items.length - 1) return { list: sr.items, pos: i + 1, series: sr.title }; }
    return vpos < vlist.length - 1 ? { list: vlist, pos: vpos + 1 } : null;
  }
  function vnext() { var nt = nextTarget(); if (!nt) return; vlist = nt.list; vpos = nt.pos; vshow(); }
  function vclose(fromBack) {
    if (!viewer || viewer.hidden) return;
    viewer.hidden = true; viewer.querySelector('.fv-frame').innerHTML = ''; doc.documentElement.style.overflow = '';
    if (hubDirty) { hubDirty = false; refreshHub(); }
    if (!fromBack && root.history && root.history.state && root.history.state.fv) { try { root.history.replaceState(null, ''); } catch (e) {} }   // never leave the app
  }
  function vopen(list, pos) {
    if (!viewer) {
      var st = doc.createElement('style');
      st.textContent = '.fv[hidden]{display:none!important}.fv{position:fixed;inset:0;z-index:9999;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden}' +
        // the video fills the screen like YouTube Shorts; everything else floats over it
        '.fv-frame{position:relative;height:100%;max-height:100%;aspect-ratio:9/16;max-width:100vw;background:#000}.fv-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}' +
        '.fv.fv-wide .fv-frame{aspect-ratio:16/9;width:100vw;height:auto;max-height:100%}' +
        '.fv-top{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;align-items:center;gap:8px;padding:8px 10px;padding-top:max(8px,env(safe-area-inset-top));color:#fff;font-size:13.5px;pointer-events:none}' +
        '.fv-top>*{pointer-events:auto}.fv-t{flex:1;min-width:0;visibility:hidden}' +
        '.fv button,.fv-rail a{font-family:inherit;cursor:pointer}.fv-x{flex:none;width:38px;height:38px;border-radius:50%;border:0;background:rgba(0,0,0,.45);color:#fff;font-size:18px;line-height:1}' +
        '.fv-bayah{flex:none;max-width:55vw;color:#f3e7c9;font-size:12px}.fv-bayah[hidden]{display:none}.fv-bayah summary{list-style:none;cursor:pointer;background:rgba(232,196,107,.28);border:1px solid rgba(232,196,107,.6);border-radius:999px;padding:6px 10px;white-space:nowrap}.fv-bayah summary::-webkit-details-marker{display:none}' +
        '.fv-bayah[open]{position:absolute;top:calc(max(8px,env(safe-area-inset-top)) + 44px);left:10px;right:10px;max-width:none}.fv-bayah[open] summary{display:inline-block}.fv-bayah .bt{margin-top:6px;background:rgba(0,0,0,.82);border:1px solid rgba(232,196,107,.5);border-radius:12px;padding:9px 12px;line-height:1.5}' +
        '.fv-bayah .ur,.fv-gate .ur{font-family:"Noto Nastaliq Urdu",Amiri,serif;font-size:14px;line-height:2;margin:2px 0 0}' +
        // right-hand rail of small round buttons, as on YouTube Shorts
        '.fv-rail{position:absolute;right:max(6px,calc((100vw - min(100vw, 100vh * 9 / 16)) / 2 + 6px));bottom:calc(112px + env(safe-area-inset-bottom));z-index:3;display:flex;flex-direction:column;align-items:center;gap:10px}' +
        '.fv-rail>*{display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:0;padding:0;color:#fff;text-decoration:none;font-size:11px;font-weight:600;text-shadow:0 1px 3px #000}' +
        '.fv-rail .i{width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1}.fv-rail .fv-sub .i{background:#c4302b}.fv-rail .fv-wa .i{background:#25D366}.fv-wa svg{width:22px;height:22px}.fv-rail .fv-next .i{background:#e8c46b;color:#1c1a12}.fv-rail .fv-full .i{background:#e8c46b;color:#1c1a12}' +
        '.fv-rail [hidden]{display:none!important}.fv-rail button:disabled{opacity:.3}.fv.fv-wide .fv-rail{bottom:calc(16px + env(safe-area-inset-bottom))}' +
        '.fv-stat{position:absolute;left:12px;bottom:calc(64px + env(safe-area-inset-bottom));z-index:2;color:#fff;font-size:11.5px;text-shadow:0 1px 3px #000;pointer-events:none;opacity:.85}' +
        '.fv-gate{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 70px 18px 18px;color:#f3e7c9;background:linear-gradient(160deg,#0f3d3e,#1c1a12);overflow:auto}.fv-gate b{font-size:18px;color:#e8c46b}.fv-gate p{font-size:13.5px;line-height:1.55;margin:8px 0}.fv-gi{font-size:34px}' +
        '.fv .fv-signin{background:#e8c46b;color:#1c1a12;font-weight:700;margin-top:6px;border:0;border-radius:999px;padding:10px 16px;font-size:15px}.fv .fv-how{background:none;border:0;text-decoration:underline;color:#e7d4a3;margin-top:4px;font-size:14px}' +
        '.fv-subp{position:absolute;right:66px;bottom:calc(112px + env(safe-area-inset-bottom));z-index:4;background:rgba(15,15,15,.94);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:12px 14px;color:#fff;font-size:13px;min-width:200px;text-align:center}.fv-subp[hidden]{display:none}.fv-subp .h{font-weight:600;margin-bottom:8px}.fv-subp .w{min-height:28px;display:flex;justify-content:center}.fv-subp a{display:block;margin-top:8px;color:#bbb;font-size:12px}' +
        '.fv-yt{line-height:1.5;padding:14px 16px!important}.fv .fv-ytgo{margin-top:10px;background:#c4302b;color:#fff;border:0;border-radius:999px;padding:9px 16px;font-size:14px;font-weight:600}' +
        '.fv-toast{position:absolute;bottom:140px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.85);color:#f3e7c9;padding:10px 16px;border-radius:12px;font-size:14px;max-width:86vw;text-align:center;z-index:4}' +
        '@media (min-aspect-ratio:3/4){.fv-rail{right:calc((100vw - 100vh * 9 / 16) / 2 - 64px)}}.fv.fv-wide .fv-rail{right:8px}';
      doc.head.appendChild(st);
      viewer = doc.createElement('div'); viewer.className = 'fv'; viewer.hidden = true; viewer.setAttribute('role', 'dialog'); viewer.setAttribute('aria-label', 'Short');
      viewer.innerHTML = '<div class="fv-frame"></div>' +
        '<div class="fv-top"><button type="button" class="fv-x" aria-label="Close">✕</button><span class="fv-t"></span>' +
          '<details class="fv-bayah" hidden><summary>🤝 After Bai’at ⓘ</summary><div class="bt">' + esc(BAYAH_EN) + '<div class="ur" dir="rtl" lang="ur">' + esc(BAYAH_UR) + '</div></div></details></div>' +
        '<span class="fv-stat"></span>' +
        '<div class="fv-subp" hidden><div class="h">Subscribe to Azam Pasha Zikr</div><div class="w"></div><a class="fv-subl" target="_blank" rel="noopener">Open on YouTube instead</a></div>' +
        '<div class="fv-rail">' +
          '<button type="button" class="fv-prev" aria-label="Previous highlight"><span class="i">▲</span></button>' +
          '<a class="fv-like" target="_blank" rel="noopener" aria-label="Like on YouTube"><span class="i">👍</span>Like</a>' +
          '<button type="button" class="fv-share" aria-label="Share"><span class="i">↗</span>Share</button>' +
          '<a class="fv-wa" target="_blank" rel="noopener" aria-label="Share on WhatsApp"><span class="i">' + WA_SVG + '</span>WhatsApp</a>' +
          '<button type="button" class="fv-full" hidden aria-label="Full dars"><span class="i">🎧</span><span class="lb">Full dars</span></button>' +
          '<a class="fv-sub" target="_blank" rel="noopener" aria-label="Subscribe on YouTube"><span class="i">🔔</span>Subscribe</a>' +
          '<button type="button" class="fv-next" aria-label="Next highlight"><span class="i">▼</span>Next</button>' +
        '</div>';
      doc.body.appendChild(viewer);
      viewer.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('button'); if (!b) return;
        if (b.classList.contains('fv-x')) vclose();
        else if (b.classList.contains('fv-bay')) { vclose(); if (root.NoorAccount && root.NoorAccount.askBayah) root.NoorAccount.askBayah(); else N.route('account'); }
        else if (b.classList.contains('fv-signin')) { vclose(); N.route('account'); }
        else if (b.classList.contains('fv-how')) { vclose(); N.route('bayah'); }
        else if (b.classList.contains('fv-prev') && vpos > 0) { vpos--; vshow(); }
        else if (b.classList.contains('fv-next')) vnext();
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
      // Like / Subscribe open YouTube (it cannot be shown inside the app). Say how to come back, and welcome them back.
      var ytAway = 0;
      viewer.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('.fv-like, .fv-sub'); if (!a) return;
        e.preventDefault();   // show the note first, then open YouTube
        var href = a.href, t = doc.createElement('div'); t.className = 'fv-toast fv-yt';
        t.innerHTML = '<b>' + (a.classList.contains('fv-sub') ? '🔔 Subscribe' : '👍 Like') + ' on YouTube</b><br>When you are done, press <b>Back</b> (or ✕ / Done) to come back here.<br><button type="button" class="fv-ytgo">Open YouTube</button>';
        viewer.appendChild(t);
        var go = function () { if (!t.parentNode) return; t.remove(); ytAway = Date.now(); root.open(href, '_blank', 'noopener'); };
        t.querySelector('.fv-ytgo').addEventListener('click', go);   // a tap, so the phone lets it open
        setTimeout(function () { if (t.parentNode) t.remove(); }, 12000);
      });
      doc.addEventListener('visibilitychange', function () {
        if (doc.hidden || !ytAway || viewer.hidden) return;
        if (Date.now() - ytAway > 1500) { var t = doc.createElement('div'); t.className = 'fv-toast'; t.textContent = 'JazakAllah khair 🤲 Welcome back.'; viewer.appendChild(t); setTimeout(function () { t.remove(); }, 2500); }
        ytAway = 0;
      });
      doc.addEventListener('keydown', function (e) { if (viewer.hidden) return; if (e.key === 'Escape') vclose(); else if (e.key === 'ArrowRight') vnext(); else if (e.key === 'ArrowLeft' && vpos > 0) { vpos--; vshow(); } });
      root.addEventListener('popstate', function () { vclose(true); });
    }
    vlist = list; vpos = pos; viewer.classList.toggle('fv-wide', !!(list[0] && list[0].wide)); viewer.hidden = false; doc.documentElement.style.overflow = 'hidden';
    try { if (!(root.history.state && root.history.state.fv)) root.history.pushState({ fv: 1 }, ''); } catch (e) {}
    vshow();
  }
  // Subscribe without leaving the app: YouTube's own Subscribe button (it counts on the channel directly; if the person
  // is not signed in to YouTube on this phone, YouTube shows its own sign-in window). The link below is the fallback.
  var ytPlat = null;
  function subPanel() {
    var p = viewer.querySelector('.fv-subp'); p.hidden = !p.hidden; if (p.hidden) return;
    var w = p.querySelector('.w');
    if (!w.firstChild) {
      w.innerHTML = '<div class="g-ytsubscribe" data-channelid="' + esc(AZAM.id) + '" data-layout="default" data-theme="dark" data-count="default"></div>';
      if (!ytPlat) { ytPlat = doc.createElement('script'); ytPlat.src = 'https://apis.google.com/js/platform.js'; ytPlat.async = true; doc.head.appendChild(ytPlat); }
      else if (root.gapi && root.gapi.ytsubscribe) try { root.gapi.ytsubscribe.go(w); } catch (e) {}
    }
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

  api.ZIKR = ZIKR; api.AZAM = AZAM; api.open = function (which) { if (kalaam === null) loadKalaam(); if (pinned === null) loadPinned(); if (which === 'poetry' || which === 'dars' || which === 'zikr' || which === 'azam') { if (tab !== which) { who = 0; topic = 0; limit = SHOW; } tab = which; } if (which === 'azam') ser = null; state = stateFor(tab); paint(); N.showScreen('family'); if (state.items === null) load(false); };
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
    { title: "Haqeeqat-e-Bai'at", match: 'haqeeqat|haqiqat', pin: true, ic: '🤝', sub: 'Bai’at: what it is, and why a murid needs a Shaykh',   // both recordings joined into one full dars
      shorts: ['g8-0WIXYjcM', 'r3x7LQru71I', '7wB9EQldsew', 'E7xb4BR6IPQ', 'kziC4lPGmgU', 'Rno3f3mGjyg', 'jRK1SIkPkV0', '3githsE0o6Y', 'ENBkebr3nJI', 'RFLGxcbYBCM', 'cbWGnUMd530', '77ZE201Hbjw', 'Fq8X-k08A5Y'] },
    // Nizam-ul-Amal-e-Fuqra: the full dars of each part shows here once it is on the channel (title with "Nizam" and "Part N").
    { title: 'Nizam-ul-Amal-e-Fuqra, Part 1', match: 'nizam.*part\\s*1(?!\\d)',
      shorts: ['iYb70KSdYD4', 'cl0bggXGqRk', 'Rk6u-LffRrg'] },
  { title: 'Nizam-ul-Amal-e-Fuqra, Part 6', match: 'nizam.*part\\s*6(?!\\d)',
    shorts: ['cfKWk-fq-BQ', 'PvTqdGvfuQw', 'UFGrLXEdwmk', '2zH6zC_Z8P4', 'trMoVHtadHI'] },
  { title: 'Nizam-ul-Amal-e-Fuqra, Part 7', match: 'nizam.*part\\s*7(?!\\d)',
    shorts: ['Tv8U5Rk8kF4', 'EbnxYFqNhXI', 'SBy10BJdsdk', 'QKlEyf9c7tg', 'z698TQzQjQg'] },
    { title: 'Nizam-ul-Amal-e-Fuqra, Part 2', match: 'nizam.*part\\s*2',
      shorts: ['u6BHgjCPuCo', '_l27DFmjd6w', 'pqjEFcL1Nlo', 'SHyAucT3ojs', 'ta6pdvvmJBQ', 'dyHUfOLlVTs'] },
    { title: 'Nizam-ul-Amal-e-Fuqra, Part 3', match: 'nizam.*part\\s*3',
      shorts: ['oWZt1YfJ3io', 'Vz_I-E521r8', 'le1EA7cNRAA', 'EIcNQnQ_TkQ', 'KCmXwBTioD4'] },
    { title: 'Nizam-ul-Amal-e-Fuqra, Part 4', match: 'nizam.*part\\s*4',
      shorts: ['mwPT8CFRfR0', 'Imuwo7g6UzE', '7CIgqlzMN1E', 'B-NjNa3UUJ4'] }
  ]);
  FULLDARS.forEach(function (f) { (f.shorts || []).slice().forEach(function (id) { if (WATERMARKED[id]) f.shorts.push(WATERMARKED[id]); }); });
  function fullFor(id) { return FULLDARS.filter(function (f) { return (f.shorts || []).indexOf(id) >= 0; })[0] || null; }
  function fullVideo(f, items) {
    var re; try { re = new RegExp(f.match, 'i'); } catch (e) { return null; }
    var p2 = /part/i.test(f.title) && /2/.test(f.title);
    return (items || []).filter(function (v) { return re.test(v.title) && (p2 ? /part\s*2|\b2\b/i.test(v.title) : !/part\s*2/i.test(v.title)); })[0] || null;
  }
  /* ---------- Shorts hub: Short of the Day, Start here, series with progress, topics, Most loved ----------
     Everything here is built from the live Shorts list (astate.items); a row with nothing to show is left out. */
  var ser = null, stopic = '', hubDirty = false, homeWrap = null;
  var RW = {}; Object.keys(WATERMARKED).forEach(function (k) { RW[WATERMARKED[k]] = k; });
  // Topic chips. A Short gets a topic from the ids listed here (the original upload or its watermarked copy) or by a word in its title.
  var STOPICS = [
    { name: 'tawbah', label: 'Tawbah', re: /tawb|tauba|repent|newly born|توبہ/i, ids: ['u6BHgjCPuCo', '_l27DFmjd6w', 'ta6pdvvmJBQ'] },
    { name: 'khatrat', label: 'Khatrat', re: /khatr|passing thought|good thoughts|thought leaves|whisper|waswas|خطرات/i, ids: ['cfKWk-fq-BQ', 'Tv8U5Rk8kF4', 'EbnxYFqNhXI', 'SBy10BJdsdk', 'QKlEyf9c7tg'] },
    { name: 'tasawwur', label: 'Tasawwur', re: /tasawwur|my picture|every form|تصور/i, ids: ['dyHUfOLlVTs', '2zH6zC_Z8P4', 'z698TQzQjQg', '3githsE0o6Y'] },
    { name: 'sabr', label: 'Sabr', re: /\bsabr|tasleem|\braza\b|patien|صبر/i, ids: ['mwPT8CFRfR0', 'Imuwo7g6UzE', '7CIgqlzMN1E'] },
    { name: 'baiat', label: 'Bai’at', re: /bai['’]?at|bay['’]?ah|\bpir\b|murids?\b|murshid|trusted guide|wali recognises|بیعت/i,
      ids: ['g8-0WIXYjcM', 'r3x7LQru71I', '7wB9EQldsew', 'E7xb4BR6IPQ', 'kziC4lPGmgU', 'Rno3f3mGjyg', 'jRK1SIkPkV0', '3githsE0o6Y', 'ENBkebr3nJI', 'RFLGxcbYBCM', 'cbWGnUMd530', '77ZE201Hbjw', 'Fq8X-k08A5Y', '0yhKLLlv5ww', 'U2KoTd5rDSI'] },
    { name: 'nazar', label: 'Nazar (gaze)', re: /\bgaze\b|eyes are hunters|nazar|نظر/i, ids: ['PvTqdGvfuQw', 'UFGrLXEdwmk'] },
    { name: 'taqwa', label: 'Taqwa', re: /taqwa|eat less|sleep less|speak less|tawakkul|تقوی/i, ids: ['oWZt1YfJ3io', 'le1EA7cNRAA', 'EIcNQnQ_TkQ', 'KCmXwBTioD4', 'B-NjNa3UUJ4', 'SHyAucT3ojs', 'Vz_I-E521r8', 'iYb70KSdYD4', 'ta6pdvvmJBQ'] },
    { name: 'tawheed', label: 'Tawheed', re: /tawh?eed|tauh?eed|توحید/i, ids: ['trMoVHtadHI', 'z698TQzQjQg', 'Rk6u-LffRrg', '2yjNqJo659g', 'g8-0WIXYjcM'] },
    { name: 'love', label: 'Love', re: /\blove\b|\bishq|mahabb|عشق|محبت/i, ids: ['EQbitUdOKqQ', 'cl0bggXGqRk', 'eNHL-OsPxgQ', 'z698TQzQjQg'] }
  ];
  var TOPIC_IDS = {};
  STOPICS.forEach(function (t) { t.ids.forEach(function (id) { [id, WATERMARKED[id], RW[id]].forEach(function (k) { if (k) (TOPIC_IDS[k] = TOPIC_IDS[k] || []).push(t.name); }); }); });
  function topicsOf(v) { var out = (TOPIC_IDS[v.id] || []).slice(); STOPICS.forEach(function (t) { if (out.indexOf(t.name) < 0 && t.re.test(v.title || '')) out.push(t.name); }); return out; }
  function topicLabel(n) { var t = STOPICS.filter(function (x) { return x.name === n; })[0]; return t ? t.label : n; }

  // Watched Shorts are kept on this phone only (localStorage), with the time they were played.
  var WKEY = 'noor_shorts_watched_v1';
  function watchedMap() { try { return JSON.parse(sget(WKEY) || '{}') || {}; } catch (e) { return {}; } }
  function isWatched(id) { var w = watchedMap(); return !!(w[id] || (RW[id] && w[RW[id]]) || (WATERMARKED[id] && w[WATERMARKED[id]])); }
  function watchedAt(id) { var w = watchedMap(); return w[id] || (RW[id] && w[RW[id]]) || (WATERMARKED[id] && w[WATERMARKED[id]]) || 0; }
  function markWatched(id) { if (!validId(id)) return; var w = watchedMap(); w[id] = Date.now(); sset(WKEY, JSON.stringify(w)); hubDirty = true; }

  function live() { return astate.items || []; }
  function liveMap() { var m = {}; live().forEach(function (v) { m[v.id] = v; }); return m; }
  function resolve(id, m) { return m[WATERMARKED[id]] ? WATERMARKED[id] : m[id] ? id : m[RW[id]] ? RW[id] : null; }
  function indexIn(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id || list[i].id === WATERMARKED[id] || list[i].id === RW[id]) return i; return -1; }
  // Series (from FULLDARS), in course order: the dars in the order they were given, Nizam-ul-Amal by part number.
  function seriesAll() {
    var m = liveMap(), out = [];
    FULLDARS.forEach(function (f, k) {
      var seen = {}, items = [];
      (f.shorts || []).forEach(function (id) { var r = resolve(id, m); if (r && !seen[r]) { seen[r] = 1; items.push(m[r]); } });
      if (!items.length) return;
      var pm = /^(.*?),?\s*Part\s*(\d+)\s*$/i.exec(f.title || '');
      out.push({ key: k, title: f.title, name: pm ? pm[1] : f.title, part: pm ? 'Part ' + pm[2] : '', pn: pm ? +pm[2] : 0, items: items, pin: !!f.pin, ic: f.ic || '', sub: f.sub || '' });
    });
    var first = {}; out.forEach(function (x, i) { if (!(x.name in first)) first[x.name] = i; });
    return out.sort(function (a, b) { return (b.pin - a.pin) || (first[a.name] - first[b.name]) || (a.pn - b.pn) || (a.key - b.key); });
  }
  function seriesOf(id) { return seriesAll().filter(function (x) { return indexIn(x.items, id) >= 0; })[0] || null; }
  function progress(sr) { var d = 0, last = 0; sr.items.forEach(function (v) { var t = watchedAt(v.id); if (t) { d++; if (t > last) last = t; } }); return { done: d, last: last }; }
  function nextIn(sr) { var i; for (i = 0; i < sr.items.length; i++) if (!isWatched(sr.items[i].id) && !locked(sr.items[i])) return i; return -1; }
  function seriesCard(sr) {
    var p = progress(sr), n = sr.items.length, ni = nextIn(sr), th = sr.items[ni >= 0 ? ni : 0];
    return '<div class="sh-ser" role="button" data-ser="' + sr.key + '"><div class="sh-sth">' + thumb(th.id) + '</div><div class="sh-ci">' +
      (sr.part ? '<div class="sh-ck">' + esc(sr.name) + '</div>' : '') + '<div class="sh-cm"><b>' + (sr.ic ? sr.ic + ' ' : '') + esc(sr.part || sr.name) + '</b> · ' + p.done + ' of ' + n + ' watched' + (p.done ? ' ✓' : '') + '</div>' +
      (sr.sub ? '<div class="sh-ck" style="text-transform:none;letter-spacing:0">' + esc(sr.sub) + '</div>' : '') +
      '<div class="sh-bar"><i style="width:' + Math.round(100 * p.done / n) + '%"></i></div></div><div class="sh-chev">›</div></div>';
  }
  function seriesView(sr) {
    var p = progress(sr), n = sr.items.length, ni = nextIn(sr);
    return '<div class="sh-back" role="button">‹ All highlights</div><h2 class="section-title" style="margin-top:0">' + (sr.ic ? sr.ic + ' ' : '') + esc(sr.title) + '</h2>' + (sr.sub ? '<div class="sh-cm" style="margin:-6px 0 6px">' + esc(sr.sub) + '</div>' : '') +
      '<div class="sh-cm" style="margin:-4px 0 0">' + p.done + ' of ' + n + ' watched' + (p.done === n ? ' · complete ✓' : '') + '</div><div class="sh-bar" style="margin-bottom:12px"><i style="width:' + Math.round(100 * p.done / n) + '%"></i></div>' +
      (ni >= 0 ? '<button type="button" class="sh-go" data-sx="' + ni + '" style="margin-bottom:12px">▶ ' + (p.done ? 'Continue' : 'Start') + ': ' + esc(clean(sr.items[ni].title)) + '</button>' : '') +
      '<div class="sh-list">' + sr.items.map(function (v, i) {
        var w = isWatched(v.id), lk = locked(v);
        return '<div class="sh-row' + (w ? ' done' : '') + '" role="button" data-sx="' + i + '"><div class="sh-n">' + (w ? '✓' : i + 1) + '</div><div class="sh-sth">' + thumb(v.id) + '</div>' +
          '<div class="sh-rt">' + esc(clean(v.title)) + '<small>' + (lk ? '🔒 For murids' : w ? 'Watched' : isNew(v) ? 'NEW' : '') + '</small></div>' + waLink(v.id, v.title, 'sh-wa', '') + '</div>';
      }).join('') + '</div>';
  }
  function rowHtml(list, more) { setTimeout(function () { ensureStats(list); }, 0); return '<div class="fm-hs">' + list.map(shortTile).join('') + (more ? '<div class="fm-all" role="button">All highlights ›</div>' : '') + '</div>'; }
  function lovedHtml(list) {
    var st = statInit().v, pool = list.filter(function (v) { return !isPractice(v) && st[v.id]; });
    if (pool.length < 3) return '<div id="shLoved"></div>';
    pool = pool.slice().sort(function (a, b) { return (st[b.id].l - st[a.id].l) || (st[b.id].v - st[a.id].v); }).slice(0, 10);
    return '<div id="shLoved"><div class="sh-h"><span>Most loved</span><small>by likes</small></div>' + rowHtml(pool) + '</div>';
  }
  function statsHook() {
    var lv = state === astate && body.querySelector('#shLoved'); if (lv) { var d = doc.createElement('div'); d.innerHTML = lovedHtml(live()); lv.replaceWith(d.firstChild); }
  }
  // Short of the Day: the same for everyone on a date; walks through every public Short that is not a practice, oldest first.
  function sotdPool() { return live().filter(function (v) { return !isPractice(v); }).sort(function (a, b) { return ((Date.parse(a.at || 0) || 0) - (Date.parse(b.at || 0) || 0)) || (a.id < b.id ? -1 : 1); }); }
  function dayNumber(d) { d = d || new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); }
  // Highlight of the Day follows each person's own path, from step 1: Start here, then the series in order
  // (Bai'at first, then The Soul's Journey, then Nizam-ul-Amal Part 1, 2, 3…). One new step a day: today's pick stays
  // until tomorrow; then the next step not yet watched. Missed days don't skip anything. After the path, the old rotation.
  var HKEY = 'noor_hotd_v1';
  function pathList() {
    var seen = {}, out = [];
    function add(v) { if (!v || locked(v) || isPractice(v)) return; var k = RW[v.id] || v.id; if (seen[k]) return; seen[k] = 1; out.push(v); }
    startList().forEach(add);
    seriesAll().forEach(function (sr) { sr.items.forEach(add); });
    return out;
  }
  function sotd() {
    var path = pathList(), today = dayNumber(), st = {};
    try { st = JSON.parse(sget(HKEY) || '{}') || {}; } catch (e) {}
    var i = -1, k;
    if (st.day === today) for (k = 0; k < path.length; k++) if (path[k].id === st.id) { i = k; break; }
    if (i < 0) {
      for (k = 0; k < path.length; k++) if (!isWatched(path[k].id) && path[k].id !== (st.day !== today ? '' : st.id)) { i = k; break; }
      if (i >= 0) sset(HKEY, JSON.stringify({ day: today, id: path[i].id }));
    }
    if (i >= 0) return { list: path.slice(i), v: path[i], step: i + 1, of: path.length, path: path };
    var p = sotdPool(); if (!p.length) return null; var j = today % p.length; return { list: p.slice(j).concat(p.slice(0, j)), v: p[j] };
  }
  // The next few steps of the path (for "Your path" rows), watched ones ticked.
  function pathRow(sd, n) {
    if (!sd || !sd.path) return '';
    var from = Math.max(0, sd.step - 1), list = sd.path.slice(from, from + (n || 6)), done = sd.path.filter(function (v) { return isWatched(v.id); }).length;
    return '<div class="sh-h"><span>Your path</span><small>' + done + ' of ' + sd.of + ' watched · one new each day</small></div>' +
      '<div class="sh-bar" style="margin:-2px 0 8px"><i style="width:' + Math.round(100 * done / sd.of) + '%"></i></div>' + rowHtml(list);
  }
  // Start here: the order a newcomer should watch in (config.js startHere). Practice Shorts are left out while locked.
  var START = (Array.isArray(cfg.startHere) && cfg.startHere.length ? cfg.startHere : ['TkSFt5BlMzs', '0yhKLLlv5ww', 'u6BHgjCPuCo', '2yjNqJo659g', 'iYb70KSdYD4', 'oWZt1YfJ3io', 'cfKWk-fq-BQ', 'trMoVHtadHI']);
  function startList() { var m = liveMap(), seen = {}; return START.map(function (id) { var r = resolve(id, m); if (!r || seen[r]) return null; seen[r] = 1; return m[r]; }).filter(function (v) { return v && !locked(v); }); }
  // Continue: the series watched most recently that still has a Short left to watch.
  function continueSeries() {
    var best = null;
    seriesAll().forEach(function (sr) { var p = progress(sr), ni = nextIn(sr); if (p.done && ni >= 0 && (!best || p.last > best.p.last)) best = { sr: sr, p: p, ni: ni }; });
    return best;
  }
  var MON3 = MON, DAY3 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function homeHtml() {
    var h = '', sd = sotd(), cs = continueSeries(), sh = startList(), all = live();
    if (sd) {
      var d = new Date(), v = sd.v;
      h += '<div class="sh-sotd" role="button" aria-label="Play the Highlight of the Day: ' + esc(clean(v.title)) + '"><div class="sh-th">' + thumb(v.id) + '<div class="fm-play">▶</div>' + (isNew(v) ? '<div class="fm-new">NEW</div>' : '') + '</div>' +
        '<div class="sh-tx"><div class="sh-k">☀ Highlight of the Day · ' + (sd.step ? 'Step ' + sd.step + ' of ' + sd.of : DAY3[d.getDay()] + ' ' + d.getDate() + ' ' + MON3[d.getMonth()]) + '</div><div class="sh-tt">' + esc(clean(v.title)) + '</div><div class="sh-by">Hazrat Azam Pasha R.A.' + (isWatched(v.id) ? ' · ✓ watched' : '') + '</div>' +
        '<div class="sh-btns"><button type="button" class="sh-go">▶ Watch</button>' + waLink(v.id, v.title, 'sh-wa', 'WhatsApp') + '</div></div></div>';
    }
    if (cs) {
      var nx = cs.sr.items[cs.ni], n = cs.sr.items.length;
      h += '<div class="sh-cont" role="button" data-ser="' + cs.sr.key + '"><div class="sh-sth">' + thumb(nx.id) + '</div><div class="sh-ci"><div class="sh-ck">Continue: ' + esc(cs.sr.title) + '</div>' +
        '<div class="sh-ct">Next: ' + esc(clean(nx.title)) + '</div><div class="sh-cm">' + cs.p.done + ' of ' + n + ' watched ✓</div><div class="sh-bar"><i style="width:' + Math.round(100 * cs.p.done / n) + '%"></i></div></div><div class="sh-chev">▶</div></div>';
    }
    if (sd && sd.path) h += pathRow(sd, 6);
    else if (sh.length) h += '<div class="sh-h"><span>Start here</span><small>watch in this order</small></div>' + rowHtml(sh);
    h += '<button type="button" class="fm-all sh-browse" style="display:block;width:100%;margin-top:6px;border:1px solid var(--line);background:var(--panel);border-radius:12px;padding:11px;font:inherit;font-weight:600;color:var(--teal);cursor:pointer">Browse all highlights ›</button>';
    return h;
  }
  function refreshHub() {
    if (homeWrap && !homeWrap.hidden) { var hub = homeWrap.querySelector('#homeHub'); if (hub) hub.innerHTML = homeHtml(); }
    if (state === astate) paint();
  }
  function playList(list, pos) { if (list && list.length) vopen(list, Math.max(0, Math.min(pos || 0, list.length - 1))); }
  function playSeries(key, i) {
    var sr = seriesAll().filter(function (x) { return x.key === key; })[0]; if (!sr) return;
    if (i == null) { i = nextIn(sr); if (i < 0) i = 0; }
    playList(sr.items, i);
  }
  body.addEventListener('click', function (e) {
    var t = e.target, c;
    if (!t.closest || t.closest('a')) return;
    if ((c = t.closest('[data-st]'))) { e.stopImmediatePropagation(); stopic = c.getAttribute('data-st') || ''; limit = SHOW; paint(); return; }
    if ((c = t.closest('[data-sx]'))) { e.stopImmediatePropagation(); playSeries(ser, +c.getAttribute('data-sx')); return; }
    if ((c = t.closest('.sh-ser'))) { e.stopImmediatePropagation(); ser = +c.getAttribute('data-ser'); paint(); if (s.scrollIntoView) s.scrollIntoView({ block: 'start' }); return; }
    if (t.closest('.sh-back')) { e.stopImmediatePropagation(); ser = null; paint(); return; }
    if (t.closest('.sh-req')) { e.stopImmediatePropagation(); N.route('bayah'); return; }
  }, true);
  if (root.NoorAccount && root.NoorAccount.onChange) root.NoorAccount.onChange(function () { setTimeout(refreshHub, 0); });

  api.azamFull = azamFull;
  api.shortsGrid = shortsGrid; api.playShort = playShort; api.subscribeLink = subscribeLink; api.playList = playList; api.waUrl = waUrl;
  api.isWatched = isWatched; api.series = seriesAll; api.topicsOf = topicsOf; api.sotd = sotd;
  // Home page: Short of the Day, Continue (series in progress), Start here, and New this week. Hidden until there are Shorts.
  api.homeStrip = function (wrap) {
    if (!wrap) return;
    homeWrap = wrap;
    var hub = wrap.querySelector('#homeHub');
    if (!hub) { hub = doc.createElement('div'); hub.id = 'homeHub'; var old = wrap.querySelector('.fm-hs'); if (old) old.replaceWith(hub); else wrap.appendChild(hub); }
    api.azamShorts(function (st) {
      if (!(st.items || []).length) { wrap.hidden = true; return; }
      var hs = doc.getElementById('homeSub'); if (hs && !hs.firstChild) hs.innerHTML = subscribeLink();
      wrap.hidden = false; hub.innerHTML = homeHtml(); ensureStats((st.items || []).slice(0, 12));
    });
    if (!hub.__wired) {
      hub.__wired = true;
      hub.addEventListener('click', function (e) {
        var t = e.target; if (!t.closest || t.closest('a')) return;
        if (t.closest('.fm-all')) { ser = null; stopic = ''; api.open('azam'); return; }
        if (t.closest('.sh-sotd')) { var sd = sotd(); if (sd) playList(sd.list, 0); return; }
        var c = t.closest('.sh-cont'); if (c) { playSeries(+c.getAttribute('data-ser')); return; }
        var th = t.closest('.fm-sth'); if (th) playShort(th);
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
