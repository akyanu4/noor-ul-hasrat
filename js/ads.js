/* Noor: vendors and their adverts.
   Vendors are listed in js/config.js (vendors: [...]). Each can have an advert poster with a date range:
     { id, name, about, area, phone, map, logo?, ad: { img, title, sub, from: "YYYY-MM-DD", until: "YYYY-MM-DD" } }
   - Home: a small "Sponsored" card under Events while an advert is running (dates counted in India time).
     Tap: the poster full size, with Call and Directions.
   - Rewards tab: "Our vendors", the list of vendors with Call and Directions (for everyone, signed in or not). */
(function (root) {
  'use strict';
  var N = root.Noor, doc = root.document, cfg = root.NOOR_CONFIG || {};
  if (!N || !doc) return;
  var esc = N.esc, V = (Array.isArray(cfg.vendors) ? cfg.vendors : []).filter(function (v) { return v && v.name; });
  if (!V.length) return;

  function istDay() { var w = new Date(Date.now() + 330 * 60000); return w.toISOString().slice(0, 10); }
  function live(v) { var a = v.ad, d = istDay(); return a && a.img && (!a.from || a.from <= d) && (!a.until || a.until >= d); }
  function tel(p) { return 'tel:' + String(p || '').replace(/[^\d+]/g, ''); }
  function safe(u) { return /^https:\/\//.test(u || '') ? u : ''; }

  var css = doc.createElement('style');
  css.textContent =
    '.ad-card{display:flex;gap:12px;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:10px;margin:0 0 14px;cursor:pointer;position:relative}' +
    '.ad-card img{flex:none;width:84px;height:92px;object-fit:cover;border-radius:10px}.ad-card .tx{flex:1;min-width:0}.ad-card b{display:block;font-size:14.5px;line-height:1.3;padding-right:74px}.ad-card small{display:block;font-size:12.5px;color:var(--muted);line-height:1.45;margin-top:3px}' +
    '.ad-tag{position:absolute;top:6px;right:8px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);border:1px solid var(--line);border-radius:6px;padding:1px 5px;background:var(--cream)}' +
    '.ad-go{display:inline-block;margin-top:6px;font-size:12.5px;font-weight:700;color:var(--teal)}' +
    '.ad-pv{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}' +
    '.ad-pv img{max-width:100%;max-height:calc(100% - 80px);border-radius:12px;object-fit:contain}.ad-pv .x{position:absolute;top:12px;right:14px;background:rgba(255,255,255,.15);color:#fff;border:0;border-radius:50%;width:40px;height:40px;font-size:20px;cursor:pointer}' +
    '.ad-row{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;justify-content:center}.ad-row a{background:#e8c46b;color:#1c1a12;border-radius:999px;font-weight:700;font-size:14px;padding:10px 18px;text-decoration:none}.ad-row a.alt{background:rgba(255,255,255,.16);color:#fff}' +
    '.vd-card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:10px}.vd-card b{font-size:15px}.vd-card .ab{font-size:13px;line-height:1.5;color:var(--muted);margin-top:3px}' +
    '.vd-card .bt{display:flex;gap:8px;margin-top:9px;flex-wrap:wrap}.vd-card .bt a,.vd-card .bt button{font:inherit;font-size:12.5px;font-weight:700;border-radius:999px;padding:7px 12px;text-decoration:none;border:1px solid var(--line);background:var(--cream);color:var(--ink);cursor:pointer}';
  doc.head.appendChild(css);

  function buttons(v, cls) {
    var h = '';
    if (v.phone) h += '<a class="' + (cls || '') + '" href="' + esc(tel(v.phone)) + '">📞 Call</a>';
    if (safe(v.map)) h += '<a class="' + (cls ? cls + ' alt' : '') + '" href="' + esc(v.map) + '" target="_blank" rel="noopener">📍 Directions</a>';
    return h;
  }
  function openAd(v) {
    var pv = doc.createElement('div'); pv.className = 'ad-pv'; pv.setAttribute('role', 'dialog');
    pv.innerHTML = '<button class="x" type="button" aria-label="Close">✕</button><img alt="' + esc(v.ad.title || v.name) + '" src="' + esc(v.ad.img) + '"><div class="ad-row">' + buttons(v, 'x1') + '</div>';
    pv.querySelector('.x').addEventListener('click', function () { pv.remove(); });
    pv.addEventListener('click', function (e) { if (e.target === pv) pv.remove(); });
    doc.body.appendChild(pv);
  }

  // ---- Home: the running advert under Events
  var home = doc.getElementById('screen-home'), card = null;
  function paintHome() {
    var v = V.filter(live)[0];
    if (!v) { if (card) card.hidden = true; return; }
    if (!card) {
      card = N.el('div', 'ad-card', ''); card.setAttribute('role', 'button'); card.tabIndex = 0;
      var ev = doc.getElementById('eventsBox');
      if (ev && ev.parentNode === home) home.insertBefore(card, ev.nextSibling); else if (home) home.insertBefore(card, home.firstChild);
      card.addEventListener('click', function () { var x = V.filter(live)[0]; if (x) openAd(x); });
    }
    card.hidden = false;
    card.innerHTML = '<span class="ad-tag">Sponsored</span><img alt="" src="' + esc(v.ad.img) + '"><div class="tx"><b>' + esc(v.ad.title || v.name) + '</b><small>' + esc(v.ad.sub || v.about || '') + '</small><span class="ad-go">View ›</span></div>';
  }
  if (home) { setTimeout(paintHome, 0); N.onScreen(function (id) { if (id === 'home') paintHome(); }); }

  // ---- Rewards tab: "Our vendors"
  function paintVendors() {
    var s = doc.getElementById('screen-rewards'); if (!s) return;
    var box = s.querySelector('#vdBox');
    if (!box) { box = N.el('div', '', ''); box.id = 'vdBox'; s.appendChild(box); }
    box.innerHTML = '<h2 class="section-title" style="margin-top:16px">Our vendors</h2>' + V.map(function (v, i) {
      return '<div class="vd-card"><b>' + esc(v.name) + '</b>' + (v.area ? ' <span class="ab" style="display:inline">· ' + esc(v.area) + '</span>' : '') +
        (v.about ? '<div class="ab">' + esc(v.about) + '</div>' : '') +
        '<div class="bt">' + buttons(v) + (live(v) ? '<button type="button" data-ad="' + i + '">🎉 ' + esc(v.ad.title || 'Advert') + '</button>' : '') + '</div></div>';
    }).join('');
    box.onclick = function (e) { var b = e.target.closest && e.target.closest('[data-ad]'); if (b) openAd(V[+b.getAttribute('data-ad')]); };
  }
  setTimeout(paintVendors, 0);
  N.onScreen(function (id) { if (id === 'rewards') paintVendors(); });
})(typeof self !== 'undefined' ? self : this);
