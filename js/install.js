/* Noor: "Install the app" helper. Android/Chrome gets a one-tap install prompt; iPhone gets the Share > Add to Home Screen steps.
 * Hidden once Noor is running as an installed app. Shared by index.html (card + More row) and install.html (standalone page). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.NoorInstall = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function detect(nav, win) {
    nav = nav || {}; var ua = String(nav.userAgent || '');
    var ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && (nav.maxTouchPoints || 0) > 1);
    var android = /android/i.test(ua);
    var safari = ios && /safari/i.test(ua) && !/crios|fxios|edgios|opios|gsa\//i.test(ua);
    var standalone = !!nav.standalone || !!(win && win.matchMedia && win.matchMedia('(display-mode: standalone)').matches);
    return { ios: ios, android: android, safari: safari, standalone: standalone, mobile: ios || android };
  }
  function steps(d) {
    if (d.ios) return d.safari
      ? ['Tap the Share button (the square with an arrow) at the bottom of Safari.', 'Scroll down and tap "Add to Home Screen".', 'Tap "Add". Noor now opens from your home screen like an app.']
      : ['Open this page in Safari (copy the link and paste it into Safari). Other iPhone browsers can\'t install apps reliably.', 'Tap the Share button, then "Add to Home Screen".', 'Tap "Add".'];
    if (d.android) return ['Tap the ⋮ menu at the top right of Chrome.', 'Tap "Install app" (or "Add to Home screen").', 'Tap "Install". Noor now opens from your home screen like an app.'];
    return ['On your phone, open this same address in Chrome (Android) or Safari (iPhone).', 'Android: ⋮ menu, then "Install app". iPhone: Share, then "Add to Home Screen".'];
  }
  var DISMISS_DAYS = 14;
  function dismissed(storage, now) {
    try { var t = Number(storage.getItem('noor_install_dismissed')); return t > 0 && now - t < DISMISS_DAYS * 86400000; } catch (e) { return false; }
  }
  return { detect: detect, steps: steps, dismissed: dismissed, DISMISS_DAYS: DISMISS_DAYS };
});

/* ---- UI inside the app ---- */
(function () {
  if (typeof window === 'undefined' || !window.Noor || !window.NoorInstall) return;
  var N = window.Noor, I = window.NoorInstall, doc = document, d = I.detect(navigator, window), deferred = null;
  if (d.standalone) return;
  var store = null; try { localStorage.setItem('_t', '1'); localStorage.removeItem('_t'); store = localStorage; } catch (e) {}
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; paint(); });
  window.addEventListener('appinstalled', function () { deferred = null; var c = doc.getElementById('installCard'); if (c) c.remove(); var r = doc.getElementById('installRow'); if (r) r.remove(); });

  var css = doc.createElement('style');
  css.textContent = '.icard{display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,var(--teal),var(--teal-deep));color:#f5f1e2;border:1px solid var(--gold-soft);border-radius:14px;padding:12px 14px;margin-bottom:14px}' +
    '.icard .t{flex:1;font-size:13px;line-height:1.4}.icard .t b{display:block;font-size:14.5px}.icard button.go{background:var(--gold);color:#1a2421;border:0;border-radius:10px;padding:9px 13px;font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap}' +
    '.icard button.x{background:none;border:0;color:#f5f1e2;opacity:.7;font-size:18px;cursor:pointer;padding:2px 6px}' +
    '.isheet{position:absolute;inset:0;background:rgba(0,0,0,.55);z-index:80;display:flex;align-items:flex-end}.isheet .in{background:var(--panel);color:var(--ink);width:100%;border-radius:18px 18px 0 0;padding:18px 18px 26px;max-height:80%;overflow:auto}' +
    '.isheet h3{margin:0 0 10px;font-size:17px}.isheet ol{margin:0 0 14px;padding-left:20px;font-size:14px;line-height:1.6}.isheet button{width:100%;background:var(--teal);color:#fff;border:0;border-radius:12px;padding:12px;font-size:14px;font-weight:600;cursor:pointer}';
  doc.head.appendChild(css);

  function sheet() {
    var host = doc.querySelector('.screens').parentNode, s = doc.createElement('div'); s.className = 'isheet';
    s.innerHTML = '<div class="in"><h3>Install Noor</h3><ol>' + I.steps(d).map(function (x) { return '<li>' + x.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</li>'; }).join('') + '</ol><button type="button">Got it</button></div>';
    s.addEventListener('click', function (e) { if (e.target === s || e.target.tagName === 'BUTTON') s.remove(); });
    host.appendChild(s);
  }
  function install() {
    if (deferred) { var p = deferred; deferred = null; try { p.prompt(); } catch (e) { sheet(); } paint(); return; }
    sheet();
  }
  function paint() {
    var home = doc.getElementById('screen-home'); if (!home) return;
    var card = doc.getElementById('installCard');
    if (!d.mobile || I.dismissed(store, Date.now())) { if (card) card.remove(); }
    else if (!card) {
      card = doc.createElement('div'); card.id = 'installCard'; card.className = 'icard';
      card.innerHTML = '<div class="ic" style="font-size:22px">📲</div><div class="t"><b>Install Noor on your phone</b>Opens like an app, with its own icon.</div><button class="go" type="button">' + (d.ios ? 'How' : 'Install') + '</button><button class="x" type="button" aria-label="Hide for now">✕</button>';
      card.querySelector('.go').onclick = install;
      card.querySelector('.x').onclick = function () { try { store && store.setItem('noor_install_dismissed', String(Date.now())); } catch (e) {} card.remove(); };
      home.insertBefore(card, home.firstChild);
    }
    var more = doc.getElementById('resourceList');
    if (more && !doc.getElementById('installRow')) {
      var r = doc.createElement('div'); r.className = 'rowitem'; r.id = 'installRow';
      r.innerHTML = '<div class="ic">📲</div><div class="tx">Install the app<div class="sub">Add Noor to your home screen</div></div><div class="chev">›</div>';
      r.onclick = install; more.insertBefore(r, more.firstChild);
    }
  }
  paint();
  var rl = doc.getElementById('resourceList'); if (rl) new MutationObserver(function () { if (!doc.getElementById('installRow')) paint(); }).observe(rl, { childList: true });
})();
