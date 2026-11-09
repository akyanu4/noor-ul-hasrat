/* Noor: "About & Support" (More → About & Support): who made the app and whom to contact. */
(function (root) {
  'use strict';
  var N = root.Noor, doc = root.document;
  if (!N || !doc) return;
  var esc = N.esc;
  var PHONE = '+919347524980', PHONE_SHOW = '+91 93475 24980';
  var SILSILA = 'Qadri · Chishti · Naqshbandi';

  var css = doc.createElement('style');
  css.textContent =
    '.ab-hero{background:linear-gradient(135deg,var(--teal),#0f3a33);color:#f5f1e2;border-radius:16px;padding:16px;margin-bottom:12px}.ab-hero b{font-size:19px}.ab-hero p{margin:6px 0 0;font-size:13.5px;line-height:1.55;opacity:.93}.ab-hero p b{font-size:inherit;color:var(--gold-soft)}' +
    '.ab-card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:12px}.ab-card h3{margin:0 0 8px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--gold)}' +
    '.ab-p{display:flex;gap:12px;align-items:flex-start;padding:8px 0;border-top:1px solid var(--line)}.ab-p:first-of-type{border-top:0}.ab-av{flex:none;width:38px;height:38px;border-radius:50%;background:var(--cream);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:18px}' +
    '.ab-p b{display:block;font-size:15px}.ab-p small{display:block;color:var(--muted);font-size:12.5px;line-height:1.45;margin-top:1px}' +
    '.ab-num{font-size:20px;font-weight:700;letter-spacing:.02em;margin:4px 0 8px;font-variant-numeric:tabular-nums}.ab-btns{display:flex;flex-wrap:wrap;gap:8px}' +
    '.ab-btn{flex:1;min-width:96px;text-align:center;text-decoration:none;border-radius:11px;padding:10px 8px;font-size:14px;font-weight:600;border:1px solid var(--line);background:var(--cream);color:var(--ink);cursor:pointer;font-family:inherit}.ab-btn.pri{background:var(--teal);border-color:var(--teal);color:#fff}' +
    '.ab-note{font-size:12px;color:var(--muted);line-height:1.5;margin:8px 2px}';
  doc.head.appendChild(css);

  var s = N.el('div', 'screen', '<div class="subhead"><div class="backbtn" id="abBack">←</div><div class="subtitle">About &amp; Support</div></div><div id="abBody"></div>');
  s.id = 'screen-about'; doc.querySelector('.screens').appendChild(s);
  s.querySelector('#abBack').addEventListener('click', function () { N.backTab(); });

  function person(ic, name, sub) { return '<div class="ab-p"><div class="ab-av" aria-hidden="true">' + ic + '</div><div><b>' + esc(name) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div></div>'; }
  s.querySelector('#abBody').innerHTML =
    '<div class="ab-hero"><b>Noor-ul-Hasrat</b><p>The complete application, the Shorts and full dars videos, the transcripts, the editing and the visualisation were made by <b>GiraffeTech</b>.</p></div>' +
    '<div class="ab-card"><h3>Contact</h3><div class="ab-note" style="margin:0 0 4px">To support the application or for any help, call or message:</div>' +
      '<div class="ab-num">' + PHONE_SHOW + '</div><div class="ab-btns">' +
      '<a class="ab-btn pri" href="tel:' + PHONE + '">📞 Call</a>' +
      '<a class="ab-btn" href="https://wa.me/' + PHONE.replace('+', '') + '" target="_blank" rel="noopener">💬 WhatsApp</a>' +
      '<button class="ab-btn" type="button" id="abCopy">📋 Copy number</button></div>' +
      '</div>' +
    '<div class="ab-card"><h3>General support</h3>' + person('🕊️', 'Alhaj Rasheed Khan (Ayub)', 'Khalifa · ' + SILSILA) + '</div>' +
    '<div class="ab-card"><h3>Technical support &amp; development</h3>' +
      person('💻', 'Amjad Khan', 'Murid of Hazrat Azam Pasha R.A. · ' + SILSILA) + person('💻', 'Ahmed Khan', '') + '</div>' +
    '<div class="ab-note">Made under GiraffeTech. <a href="privacy.html">Privacy</a></div>';
  // On Home: a small "Made by GiraffeTech" card at the bottom, opening this page.
  var home = doc.getElementById('screen-home');
  if (home) {
    var hc = doc.createElement('style');
    hc.textContent = '.gt-home{display:flex;align-items:center;gap:12px;margin:18px 0 6px;padding:12px 14px;border-radius:14px;background:var(--panel);border:1px solid var(--line);cursor:pointer}' +
      '.gt-home .lg{flex:none;width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#e8c46b,#c9a24b);display:flex;align-items:center;justify-content:center;font-size:22px}' +
      '.gt-home .tx{flex:1;min-width:0}.gt-home b{display:block;font-size:14.5px;color:var(--ink)}.gt-home small{display:block;font-size:12px;color:var(--muted);line-height:1.4;margin-top:1px}.gt-home .go{color:var(--muted);font-size:20px}';
    doc.head.appendChild(hc);
    var card = N.el('div', 'gt-home', '<div class="lg" aria-hidden="true">🦒</div><div class="tx"><b>Made by GiraffeTech</b><small>App, Shorts, full dars, transcripts and visuals. Contact: ' + PHONE_SHOW + '</small></div><div class="go" aria-hidden="true">›</div>');
    card.setAttribute('role', 'button'); card.tabIndex = 0; card.setAttribute('aria-label', 'About GiraffeTech and support');
    card.addEventListener('click', function () { N.showScreen('about'); });
    home.appendChild(card);
  }
  s.querySelector('#abCopy').addEventListener('click', function (e) {
    var b = e.currentTarget;
    try { navigator.clipboard.writeText(PHONE_SHOW).then(function () { b.textContent = '✓ Copied'; setTimeout(function () { b.textContent = '📋 Copy number'; }, 2000); }); } catch (er) { root.prompt && root.prompt('Copy this number:', PHONE_SHOW); }
  });
})(typeof self !== 'undefined' ? self : this);
