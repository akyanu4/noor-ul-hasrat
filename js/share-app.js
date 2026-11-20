/* Noor: "Get / share the app" with a QR code, always available (also inside the installed app, so members can show it to friends).
   - More menu: a "Share app · QR" tile.
   - Home: a small row at the bottom, "📲 Get the app · show QR".
   The QR (icons/install-qr.svg) opens install.html?src=qr, so scans are counted on the admin page. */
(function (root) {
  'use strict';
  var N = root.Noor, doc = root.document; if (!N || !doc) return;
  var URL_ = 'https://noor-ul-hasrat.vercel.app/install.html?src=qr', SHOW = 'noor-ul-hasrat.vercel.app/install.html';
  function T(en, ru) { return N.T ? N.T(en, ru) : en; }

  var css = doc.createElement('style');
  css.textContent =
    '.qa-sheet{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:18px}' +
    '.qa-sheet .in{background:var(--panel);color:var(--ink);border-radius:20px;padding:18px;max-width:340px;width:100%;text-align:center;position:relative}' +
    '.qa-sheet h3{margin:0 0 4px;font-size:18px}.qa-sheet p{margin:0 0 12px;font-size:13px;color:var(--muted);line-height:1.45}' +
    '.qa-sheet img{width:230px;height:230px;max-width:100%;border:3px solid var(--gold);border-radius:14px;background:#fff;padding:6px;box-sizing:border-box}' +
    '.qa-sheet .u{font-weight:700;font-size:13px;margin:8px 0 12px;word-break:break-all}' +
    '.qa-sheet .b{display:block;width:100%;border:0;border-radius:12px;padding:12px;font:inherit;font-weight:700;font-size:15px;cursor:pointer;margin-top:8px;text-decoration:none;box-sizing:border-box}' +
    '.qa-sheet .g{background:var(--gold);color:#1a2421}.qa-sheet .l{background:var(--cream);color:var(--ink);border:1px solid var(--line)}' +
    '.qa-sheet .x{position:absolute;top:8px;right:10px;background:none;border:0;font-size:20px;color:var(--muted);cursor:pointer}' +
    '.qa-home{display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;text-align:left;font:inherit;color:var(--ink);background:var(--panel);border:1px dashed var(--gold);border-radius:14px;padding:11px 13px;margin:16px 0 8px;cursor:pointer}' +
    '.qa-home .i{font-size:22px}.qa-home b{display:block;font-size:14px}.qa-home small{display:block;font-size:12px;color:var(--muted)}.qa-home .c{margin-left:auto;color:var(--muted)}';
  doc.head.appendChild(css);

  function open() {
    var s = doc.createElement('div'); s.className = 'qa-sheet'; s.setAttribute('role', 'dialog');
    s.innerHTML = '<div class="in"><button class="x" type="button" aria-label="Close">✕</button>' +
      '<h3>📲 ' + T('Stay connected with Hazrat\'s teachings', 'Hazrat ki taleemaat se jude rahiye') + '</h3>' +
      '<p>' + T('A saying every morning, his dars, Sufi practices and the weekly halqa. Scan with a phone camera to open.', 'Har subah ek qaul, unka dars, Sufi amaal aur haftawar halqa. Phone ke camera se scan karke kholiye.') + '</p>' +
      '<img src="icons/install-qr.svg" alt="QR code for the install page"><div class="u">' + SHOW + '</div>' +
      '<a class="b g" href="install.html">' + T('Install on this phone', 'Is phone par install kijiye') + '</a>' +
      '<button class="b l" type="button" data-share>' + T('Share the link', 'Link share kijiye') + '</button></div>';
    s.addEventListener('click', function (e) {
      var t = e.target;
      if (t === s || t.classList.contains('x')) { s.remove(); return; }
      if (t.hasAttribute('data-share')) {
        var text = T('Stay connected with the teachings of Hazrat Azam Pasha R.A.: a saying every morning, his dars, Sufi practices and the weekly halqa. Free.', 'Hazrat Azam Pasha R.A. ki taleemaat se jude rahiye: har subah ek qaul, unka dars, Sufi amaal aur haftawar halqa. Muft.');
        if (root.navigator.share) root.navigator.share({ title: 'Noor-ul-Hasrat', text: text, url: URL_ }).catch(function () {});
        else root.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + URL_), '_blank');
      }
    });
    doc.body.appendChild(s);
  }
  N.openShareApp = open;

  // Home: a small row at the bottom
  var home = doc.getElementById('screen-home');
  function paintHome() {
    if (!home) return;
    var r = doc.getElementById('qaHome');
    if (!r) { r = doc.createElement('button'); r.type = 'button'; r.id = 'qaHome'; r.className = 'qa-home'; r.onclick = open; home.appendChild(r); }
    else if (r !== home.lastElementChild) home.appendChild(r);
    r.innerHTML = '<span class="i">📲</span><span><b>' + T('Share Hazrat\'s teachings · QR code', 'Hazrat ki taleemaat share kijiye · QR code') + '</b><small>' + T('Invite a friend, or add it to your phone', 'Kisi dost ko bulaiye, ya apne phone mein shamil kijiye') + '</small></span><span class="c">›</span>';
  }
  // More menu: a tile
  function paintMore() {
    var more = doc.getElementById('resourceList');
    if (!more || doc.getElementById('qaMore')) return;
    var tile = more.classList.contains('ftiles');
    var r = doc.createElement(tile ? 'button' : 'div'); r.id = 'qaMore';
    if (tile) { r.type = 'button'; r.className = 'ftile'; r.innerHTML = '<div class="fi" aria-hidden="true">🔳</div><div class="fl">Share app · QR</div>'; }
    else { r.className = 'rowitem'; r.innerHTML = '<div class="ic">🔳</div><div class="tx">Share the app (QR code)<div class="sub">Show the QR code or share the install link</div></div><div class="chev">›</div>'; }
    r.onclick = open;
    var after = doc.getElementById('installRow');
    if (after && after.parentNode === more) more.insertBefore(r, after.nextSibling); else more.insertBefore(r, more.firstChild);
  }
  setTimeout(function () { paintHome(); paintMore(); }, 300);
  N.onScreen(function (id) { if (id === 'home') paintHome(); if (id === 'more') paintMore(); });
  root.addEventListener('noorlang', paintHome);
  var rl = doc.getElementById('resourceList'); if (rl) new MutationObserver(function () { if (!doc.getElementById('qaMore')) paintMore(); }).observe(rl, { childList: true });
})(typeof self !== 'undefined' ? self : this);
