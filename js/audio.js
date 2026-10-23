/* Noor: Audio Dars. Series of recordings kept in public Google Drive folders (data/audio.json).
   With the Google Drive API enabled for config.js youtubeApiKey, each folder is read live so new files appear by themselves;
   otherwise the saved list in data/audio.json is used. Recordings play inside the app with Google Drive's player. */
(function (root) {
  'use strict';

  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function validId(id) { return typeof id === 'string' && /^[A-Za-z0-9_-]{10,80}$/.test(id); }
  function isAudio(name, mime) { return /^audio\//.test(mime || '') || /\.(mp3|m4a|aac|wav|ogg|oga|opus|amr|wma|flac)$/i.test(name || ''); }

  // "TS -007 09th December 2007.mp3" -> { part: 7, date: "9 December 2007" }; "NAF012.mp3" -> { part: 12 }
  function describe(name) {
    var base = String(name || '').replace(/\.[a-z0-9]{2,4}$/i, '');
    var m = base.match(/(\d{1,4})/), part = m ? parseInt(m[1], 10) : null;
    var d = base.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+(\d{4})/i), date = '';
    if (d) { var mi = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(d[2].toLowerCase()); date = parseInt(d[1], 10) + ' ' + MON[mi] + ' ' + d[3]; }
    var words = base.replace(/^[A-Za-z]{1,5}\s*-?\s*\d{1,4}\s*/, '').replace(/^\d{1,4}\s*-\s*[A-Za-z]{1,5}$/, '').trim();
    if (d) words = words.replace(d[0], '').trim();
    return { part: part, date: date, extra: words.replace(/^[-–\s]+|[-–\s]+$/g, '') };
  }
  function sortFiles(files) {
    return files.slice().sort(function (a, b) {
      var pa = describe(a.name).part, pb = describe(b.name).part;
      if (pa != null && pb != null && pa !== pb) return pa - pb;
      return String(a.name).localeCompare(String(b.name), undefined, { numeric: true });
    });
  }

  var api = { describe: describe, sortFiles: sortFiles, isAudio: isAudio, validId: validId };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NoorAudio = api;

  var N = root.Noor, doc = root.document;
  if (!N || !doc) return;
  var cfg = root.NOOR_CONFIG || {}, TTL = 30 * 60 * 1000;
  var data = null, live = {}, liveTried = false, tab = 0, playing = null;
  function sget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var css = doc.createElement('style');
  css.textContent =
    '.au-tabs{display:flex;gap:6px;overflow-x:auto;margin-bottom:12px;padding-bottom:2px}.au-tab{flex:none;padding:8px 12px;border:1px solid var(--line);border-radius:18px;font-size:13px;background:var(--panel);cursor:pointer;color:var(--muted);white-space:nowrap}.au-tab.on{background:var(--teal);color:#fff;border-color:var(--teal)}' +
    '.au-hero{background:linear-gradient(160deg,var(--teal),#0f3a33);color:#f5f1e2;border-radius:16px;padding:16px 14px;text-align:center;margin-bottom:12px}.au-hero .ur{font-family:Amiri,serif;font-size:26px;color:var(--gold-soft);direction:rtl}.au-hero .en{font-size:17px;font-weight:700;margin-top:2px}.au-hero .n{font-size:12px;opacity:.85;margin-top:4px}' +
    '.au-row{background:var(--panel);border:1px solid var(--line);border-radius:14px;margin-bottom:8px;overflow:hidden}' +
    '.au-head{display:flex;align-items:center;gap:12px;padding:12px 14px;cursor:pointer}.au-num{flex:none;width:38px;height:38px;border-radius:50%;background:var(--teal);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px}.au-row.on .au-num{background:var(--gold);color:#1a2421}' +
    '.au-t{flex:1;min-width:0}.au-t b{display:block;font-size:14.5px}.au-t small{display:block;color:var(--muted);font-size:12px;margin-top:2px}.au-play{flex:none;font-size:18px;color:var(--teal)}' +
    '.au-player{padding:0 12px 12px}.au-player iframe{width:100%;height:96px;border:0;border-radius:10px;background:#202124;display:block}.au-player a{display:inline-block;margin-top:8px;font-size:12px;color:var(--teal)}' +
    '.au-note{font-size:12px;color:var(--muted);line-height:1.55;margin:8px 2px 12px}.au-note a{color:var(--teal)}';
  doc.head.appendChild(css);

  var s = N.el('div', 'screen', '<div class="subhead"><div class="backbtn" id="auBack">←</div><div class="subtitle">Audio Dars</div></div><div id="auBody"></div>');
  s.id = 'screen-audio'; doc.querySelector('.screens').appendChild(s);
  var body = s.querySelector('#auBody');
  s.querySelector('#auBack').addEventListener('click', function () { N.backTab(); });

  function series() { return (data && data.series || []).filter(function (x) { return x && x.title; }); }
  function filesOf(sr) {
    var l = live[sr.folderId];
    var list = (l && l.length ? l : (sr.files || [])).filter(function (f) { return f && validId(f.id) && isAudio(f.name, f.mime || 'audio/'); });
    return sortFiles(list);
  }

  function readFolder(folderId) {
    var key = cfg.youtubeApiKey, out = [];
    if (!key || !validId(folderId)) return Promise.reject(new Error('no key'));
    function page(token) {
      var q = encodeURIComponent("'" + folderId + "' in parents and trashed=false");
      var u = 'https://www.googleapis.com/drive/v3/files?q=' + q + '&fields=nextPageToken,files(id,name,mimeType)&pageSize=1000&orderBy=name&key=' + encodeURIComponent(key) + (token ? '&pageToken=' + encodeURIComponent(token) : '');
      return fetch(u).then(function (r) { if (!r.ok) throw new Error('Drive said ' + r.status); return r.json(); }).then(function (d) {
        (d.files || []).forEach(function (f) { if (isAudio(f.name, f.mimeType)) out.push({ id: f.id, name: f.name, mime: f.mimeType }); });
        return d.nextPageToken ? page(d.nextPageToken) : out;
      });
    }
    return page('');
  }
  function loadLive(force) {
    var cached = null; try { cached = JSON.parse(sget('noor_audio_v1') || 'null'); } catch (e) {}
    if (!force && cached && Date.now() - cached.t < TTL) { live = cached.live || {}; paint(); return; }
    var srs = series(); if (!srs.length) return;
    Promise.all(srs.map(function (sr) { return readFolder(sr.folderId).then(function (l) { return [sr.folderId, l]; }, function () { return [sr.folderId, null]; }); }))
      .then(function (res) {
        var got = {}, any = false;
        res.forEach(function (p) { if (p[1]) { got[p[0]] = p[1]; any = true; } });
        if (any) { live = got; sset('noor_audio_v1', JSON.stringify({ t: Date.now(), live: live })); }
        else if (cached && cached.live) live = cached.live;
        liveTried = true; paint();
      });
  }

  function paint() {
    var srs = series(), h = '';
    if (data === null) { body.innerHTML = '<div class="au-note">Loading…</div>'; return; }
    if (!srs.length) { body.innerHTML = '<div class="au-note">No audio yet.</div>'; return; }
    if (tab >= srs.length) tab = 0;
    if (srs.length > 1) h += '<div class="au-tabs">' + srs.map(function (x, i) { return '<div class="au-tab' + (i === tab ? ' on' : '') + '" data-t="' + i + '">' + esc(x.title) + '</div>'; }).join('') + '</div>';
    var sr = srs[tab], files = filesOf(sr);
    h += '<div class="au-hero">' + (sr.titleUr ? '<div class="ur">' + esc(sr.titleUr) + '</div>' : '') + '<div class="en">' + esc(sr.title) + '</div><div class="n">' + files.length + ' recording' + (files.length === 1 ? '' : 's') + '</div></div>';
    files.forEach(function (f, i) {
      var dsc = describe(f.name), num = dsc.part != null ? dsc.part : i + 1, on = playing === f.id;
      var sub = [dsc.date, dsc.extra].filter(Boolean).join(' · ');
      h += '<div class="au-row' + (on ? ' on' : '') + '" data-id="' + esc(f.id) + '"><div class="au-head" role="button" aria-label="Play part ' + num + '"><div class="au-num">' + num + '</div><div class="au-t"><b>' + esc(sr.title) + ' · Part ' + num + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '<small>' + esc(f.name) + '</small>') + '</div><div class="au-play">' + (on ? '■' : '▶') + '</div></div>' +
        (on ? '<div class="au-player"><iframe src="https://drive.google.com/file/d/' + esc(f.id) + '/preview" allow="autoplay" title="Audio player"></iframe><a target="_blank" rel="noopener" href="https://drive.google.com/file/d/' + esc(f.id) + '/view">Open in Google Drive ↗</a></div>' : '') + '</div>';
    });
    h += '<div class="au-note">Tap a part to open its player, then press ▶. ' + (sr.folderId ? '<a target="_blank" rel="noopener" href="https://drive.google.com/drive/folders/' + esc(sr.folderId) + '">Open this folder in Drive ↗</a>' : '') + ' <a href="#" id="auRefresh">Refresh ↻</a></div>';
    body.innerHTML = h;
  }

  body.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.au-tab'); if (t) { tab = +t.getAttribute('data-t') || 0; playing = null; paint(); body.scrollTop = 0; return; }
    if (e.target.id === 'auRefresh') { e.preventDefault(); loadLive(true); return; }
    var hd = e.target.closest && e.target.closest('.au-head');
    if (hd) { var id = hd.parentNode.getAttribute('data-id'); playing = playing === id ? null : id; paint(); var row = body.querySelector('.au-row.on'); if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  });

  function loadData() {
    return fetch('data/audio.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : { series: [] }; }).catch(function () { return { series: [] }; })
      .then(function (d) { data = d || { series: [] }; paint(); if (!liveTried) loadLive(false); });
  }
  // For a profile page: calls back with [{ title, titleUr, count }] for each series.
  api.summary = function (cb) {
    function give() { cb(series().map(function (x) { return { title: x.title, titleUr: x.titleUr || '', count: filesOf(x).length }; })); }
    if (data === null) loadData().then(give); else give();
  };
  api.open = function (which) {
    if (data === null) loadData().then(function () { pick(which); }); else pick(which);
    paint(); N.showScreen('audio');
  };
  function pick(which) {
    if (typeof which !== 'string' || !which) return;
    var srs = series(), w = which.toLowerCase();
    srs.forEach(function (x, i) { if (x.title.toLowerCase().indexOf(w) === 0) tab = i; });
    paint();
  }
  paint();
})(typeof self !== 'undefined' ? self : this);
