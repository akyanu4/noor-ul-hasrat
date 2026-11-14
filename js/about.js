/* Noor: "About & Support" (More → About & Support): who made the app and whom to contact. */
(function (root) {
  'use strict';
  var N = root.Noor, doc = root.document;
  if (!N || !doc) return;
  var esc = N.esc;
  var PHONE = '+919347524980', PHONE_SHOW = '+91 93475 24980';
  var SILSILA = 'Qadri · Chishti · Naqshbandi';
  var SITE = 'https://www.giraffestech.com', SITE_SHOW = 'giraffestech.com';

  var css = doc.createElement('style');
  css.textContent =
    '.ab-hero{background:linear-gradient(135deg,var(--teal),#0f3a33);color:#f5f1e2;border-radius:16px;padding:16px;margin-bottom:12px}.ab-hero b{font-size:19px}.ab-hero p{margin:6px 0 0;font-size:13.5px;line-height:1.55;opacity:.93}.ab-hero p b{font-size:inherit;color:var(--gold-soft)}' +
    '.ab-card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:12px}.ab-card h3{margin:0 0 8px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--gold)}' +
    '.ab-p{display:flex;gap:12px;align-items:flex-start;padding:8px 0;border-top:1px solid var(--line)}.ab-p:first-of-type{border-top:0}.ab-av{flex:none;width:38px;height:38px;border-radius:50%;background:var(--cream);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:18px}' +
    '.ab-p b{display:block;font-size:15px}.ab-p small{display:block;color:var(--muted);font-size:12.5px;line-height:1.45;margin-top:1px}' +
    '.ab-num{font-size:20px;font-weight:700;letter-spacing:.02em;margin:4px 0 8px;font-variant-numeric:tabular-nums}.ab-btns{display:flex;flex-wrap:wrap;gap:8px}' +
    '.ab-btn{flex:1;min-width:96px;text-align:center;text-decoration:none;border-radius:11px;padding:10px 8px;font-size:14px;font-weight:600;border:1px solid var(--line);background:var(--cream);color:var(--ink);cursor:pointer;font-family:inherit}.ab-btn.pri{background:var(--teal);border-color:var(--teal);color:#fff}' +
    '.ab-note{font-size:12px;color:var(--muted);line-height:1.5;margin:8px 2px}' +
    '.hp-f label{display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:10px 0 4px}.hp-f input,.hp-f select,.hp-f textarea{width:100%;box-sizing:border-box;font:inherit;font-size:15px;padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:var(--cream);color:var(--ink)}' +
    '.hp-f textarea{min-height:96px;resize:vertical}.hp-f .hp-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}.hp-msg{font-size:13.5px;line-height:1.5;margin-top:10px;padding:10px 12px;border-radius:10px;background:var(--cream)}.hp-msg.ok{background:#e3f1e8;color:#14532d}.hp-msg.err{background:#fbe9e7;color:#8a1c12}';
  doc.head.appendChild(css);

  var s = N.el('div', 'screen', '<div class="subhead"><div class="backbtn" id="abBack">←</div><div class="subtitle">About &amp; Support</div></div><div id="abBody"></div>');
  s.id = 'screen-about'; doc.querySelector('.screens').appendChild(s);
  s.querySelector('#abBack').addEventListener('click', function () { N.backTab(); });

  function person(ic, name, sub) { return '<div class="ab-p"><div class="ab-av" aria-hidden="true">' + ic + '</div><div><b>' + esc(name) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div></div>'; }
  s.querySelector('#abBody').innerHTML =
    '<div class="ab-hero"><b>Noor-ul-Hasrat</b><p>The complete application, the Shorts and full dars videos, the transcripts, the editing and the visualisation were made by <b>GiraffeTech</b>.</p>' +
      '<a class="ab-btn" style="display:inline-block;flex:none;margin-top:10px;background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.25);color:#f5f1e2" href="' + SITE + '" target="_blank" rel="noopener">🌐 ' + SITE_SHOW + '</a></div>' +
    '<div class="ab-card"><h3>Contact</h3><div class="ab-note" style="margin:0 0 4px">To support the application or for any help, call or message:</div>' +
      '<div class="ab-num">' + PHONE_SHOW + '</div><div class="ab-btns">' +
      '<a class="ab-btn pri" href="tel:' + PHONE + '">📞 Call</a>' +
      '<a class="ab-btn" href="https://wa.me/' + PHONE.replace('+', '') + '" target="_blank" rel="noopener">💬 WhatsApp</a>' +
      '<button class="ab-btn" type="button" id="abCopy">📋 Copy number</button></div>' +
      '</div>' +
    '<div class="ab-card" id="abHelp"><h3>Ask for technical help</h3><div class="ab-note" style="margin:0">App not installing, cannot sign in, a video not playing? Send us a request and we will reply on WhatsApp or email, in shaa Allah. No sign-in needed.</div>' +
      '<form class="hp-f" id="hpForm" novalidate>' +
      '<label for="hpName">Your name</label><input id="hpName" maxlength="60" autocomplete="name" required>' +
      '<label for="hpContact">WhatsApp / phone or email (to reply)</label><input id="hpContact" maxlength="80" autocomplete="email" inputmode="email" required>' +
      '<label for="hpTopic">What is it about?</label><select id="hpTopic"><option>Installing the app</option><option>Signing in / account</option><option>Prayer times / Qibla</option><option>Videos / Shorts</option><option>Notifications / reminders</option><option>Bai&rsquo;at request</option><option>Something else</option></select>' +
      '<label for="hpMsg">What happened?</label><textarea id="hpMsg" maxlength="1000" placeholder="e.g. On my iPhone I cannot find Add to Home Screen" required></textarea>' +
      '<div class="hp-hp" aria-hidden="true"><label for="hpWeb">Website</label><input id="hpWeb" tabindex="-1" autocomplete="off"></div>' +
      '<div class="ab-btns" style="margin-top:12px"><button class="ab-btn pri" type="submit" id="hpSend">📨 Send request</button></div>' +
      '<div class="ab-note" style="margin:8px 0 0">Your phone type and browser are sent with it, to help us fix it faster.</div><div id="hpOut" role="status" aria-live="polite"></div></form></div>' +
    '<div class="ab-card"><h3>Charity, Dargah &amp; Events</h3><div class="ab-note" style="margin:0 0 4px">For any kind of charity or support to the Dargah and Events, please contact:</div>' +
      person('🕌', 'Nooruddin (Nayeem Pasha)', '+91 96763 78351') +
      '<div class="ab-btns" style="margin-top:6px"><a class="ab-btn pri" href="tel:+919676378351">📞 Call</a><a class="ab-btn" href="https://wa.me/919676378351" target="_blank" rel="noopener">💬 WhatsApp</a></div></div>' +
    '<div class="ab-card"><h3>General support</h3>' + person('🕊️', 'Alhaj Rasheed Khan (Ayub)', 'Khalifa · ' + SILSILA) + '</div>' +
    '<div class="ab-card"><h3>Technical support &amp; development</h3>' +
      person('💻', 'Amjad Khan', 'Murid of Hazrat Azam Pasha R.A. · ' + SILSILA) + person('💻', 'Ahmed Khan', '') + '</div>' +
    '<div class="ab-note">Made under GiraffeTech · <a href="' + SITE + '" target="_blank" rel="noopener">' + SITE_SHOW + '</a> · <a href="privacy.html">Privacy</a></div>';
  // On Home: a small "Made by GiraffeTech" card at the bottom, opening this page.
  var home = doc.getElementById('screen-home');
  if (home) {
    var hc = doc.createElement('style');
    hc.textContent = '.gt-home{display:flex;align-items:center;gap:12px;margin:18px 0 6px;padding:12px 14px;border-radius:14px;background:var(--panel);border:1px solid var(--line);cursor:pointer}' +
      '.gt-home .lg{flex:none;width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#e8c46b,#c9a24b);display:flex;align-items:center;justify-content:center;font-size:22px}' +
      '.gt-home .tx{flex:1;min-width:0}.gt-home b{display:block;font-size:14.5px;color:var(--ink)}.gt-home small{display:block;font-size:12px;color:var(--muted);line-height:1.4;margin-top:1px}.gt-home .go{color:var(--muted);font-size:20px}';
    doc.head.appendChild(hc);
    var card = N.el('div', 'gt-home', '<div class="lg" aria-hidden="true">🦒</div><div class="tx"><b>Made by GiraffeTech</b><small>App, Shorts, full dars, transcripts and visuals. ' + SITE_SHOW + ' · ' + PHONE_SHOW + '</small></div><div class="go" aria-hidden="true">›</div>');
    card.setAttribute('role', 'button'); card.tabIndex = 0; card.setAttribute('aria-label', 'About GiraffeTech and support');
    card.addEventListener('click', function () { N.showScreen('about'); });
    // A slim Donate button at the very top of Home (opens Donate: charity, Dargah & Events)
    hc.textContent += '.don-top{display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;margin:0 0 12px;padding:10px 14px;border-radius:12px;cursor:pointer;font:inherit;text-align:left;' +
      'background:linear-gradient(135deg,#e8c46b,#c9a24b);color:#1c1a12;border:0;box-shadow:0 3px 10px rgba(201,162,75,.3)}.don-top .ic{font-size:20px}.don-top b{font-size:15px}.don-top span.s{flex:1;font-size:12.5px;opacity:.8}.don-top .go{font-size:18px}';
    var dt = N.el('button', 'don-top', '<span class="ic" aria-hidden="true">🤲</span><b>Donate</b><span class="s">Charity, Dargah &amp; Events</span><span class="go" aria-hidden="true">›</span>');
    dt.type = 'button'; dt.addEventListener('click', function () { N.route('donate'); });
    home.insertBefore(dt, home.firstChild);
    home.appendChild(card);
  }
  s.querySelector('#abCopy').addEventListener('click', function (e) {
    var b = e.currentTarget;
    try { navigator.clipboard.writeText(PHONE_SHOW).then(function () { b.textContent = '✓ Copied'; setTimeout(function () { b.textContent = '📋 Copy number'; }, 2000); }); } catch (er) { root.prompt && root.prompt('Copy this number:', PHONE_SHOW); }
  });

  // ---- Technical help form → /api/help (saved for the admin page and emailed to the team)
  function deviceInfo() {
    var ua = navigator.userAgent || '', os = /iPhone|iPad|iPod/.test(ua) ? 'iPhone/iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : 'Other';
    var br = /CriOS|Chrome\//.test(ua) && !/Edg\//.test(ua) ? 'Chrome' : /Edg\//.test(ua) ? 'Edge' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : /SamsungBrowser/.test(ua) ? 'Samsung' : 'Other';
    var inst = (root.matchMedia && root.matchMedia('(display-mode: standalone)').matches) || navigator.standalone ? 'installed' : 'in browser';
    return os + ' · ' + br + ' · ' + inst + ' · ' + (root.innerWidth || '') + 'px';
  }
  var hf = s.querySelector('#hpForm'), hOut = s.querySelector('#hpOut'), hSend = s.querySelector('#hpSend');
  function hMsg(t, cls) { hOut.innerHTML = t ? '<div class="hp-msg ' + (cls || '') + '">' + t + '</div>' : ''; }
  function prefill() {
    var A = root.NoorAccount, u = A && A.user && A.user(), p = A && A.profile && A.profile();
    var nm = s.querySelector('#hpName'), ct = s.querySelector('#hpContact');
    if (p && p.name && !nm.value) nm.value = p.name;
    if (!ct.value) ct.value = (p && p.phone) || (u && u.email) || '';
  }
  s.addEventListener('focusin', function (e) { if (e.target.closest && e.target.closest('#hpForm')) prefill(); });
  hf.addEventListener('submit', function (e) {
    e.preventDefault();
    var A = root.NoorAccount, u = A && A.user && A.user();
    var b = { name: s.querySelector('#hpName').value, contact: s.querySelector('#hpContact').value, topic: s.querySelector('#hpTopic').value,
      message: s.querySelector('#hpMsg').value, website: s.querySelector('#hpWeb').value, device: deviceInfo(), page: 'about', uid: (u && u.uid) || '' };
    if (!b.name.trim()) { hMsg('Please write your name.', 'err'); return; }
    if (b.contact.trim().length < 5) { hMsg('Please give a WhatsApp/phone number or an email so we can reply.', 'err'); return; }
    if (b.message.trim().length < 5) { hMsg('Please tell us a little about the problem.', 'err'); return; }
    if (!navigator.onLine) { hMsg('You are offline. Please connect to the internet, or call/WhatsApp ' + esc(PHONE_SHOW) + '.', 'err'); return; }
    hSend.disabled = true; hSend.textContent = 'Sending…'; hMsg('');
    fetch('/api/help', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (x) {
        if (x.ok && x.d.ok) { hMsg('✓ JazakAllah khair, your request is sent. We will reply on ' + esc(b.contact.trim()) + ', in shaa Allah.', 'ok'); s.querySelector('#hpMsg').value = ''; }
        else hMsg(esc(x.d.error || 'Could not send. Please try again, or call/WhatsApp ' + PHONE_SHOW + '.'), 'err');
      }, function () { hMsg('Could not send. Please check your internet, or call/WhatsApp ' + esc(PHONE_SHOW) + '.', 'err'); })
      .then(function () { hSend.disabled = false; hSend.textContent = '📨 Send request'; });
  });
  // ?help=1 opens this page at the form (used by the printed cards and the WhatsApp invite)
  try { if (/[?&]help=1/.test(root.location.search)) setTimeout(function () { N.showScreen('about'); var c = s.querySelector('#abHelp'); c && c.scrollIntoView({ block: 'start' }); }, 600); } catch (er) {}
})(typeof self !== 'undefined' ? self : this);
