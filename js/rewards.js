/* Noor: Rewards tab (bottom bar).
   Not signed in: what members get, and a button to sign up / sign in.
   Signed in: "Rewards this week", posted by the admin on admin.html into the database at rewards/
     rewards = { week: "17–23 Nov", note: "...", items: { <id>: { t: title, by: from / shop, d: details, code: "", until: "YYYY-MM-DD", link: "https://..." } } }
   The database rules let only signed-in members (with an email) read rewards/, and only admins write it. */
(function (root) {
  'use strict';
  var N = root.Noor, doc = root.document, B = N && N.backend;
  if (!N || !doc) return;
  var esc = N.esc;

  var css = doc.createElement('style');
  css.textContent =
    '.rw-hero{background:linear-gradient(135deg,var(--teal),#0f3a33);color:#f5f1e2;border-radius:16px;padding:18px 16px;margin-bottom:12px}' +
    '.rw-hero b{font-size:19px}.rw-hero p{margin:6px 0 0;font-size:13.5px;line-height:1.5;opacity:.92}.rw-hero ul{margin:10px 0 0;padding-left:20px;font-size:13.5px;line-height:1.7}' +
    '.rw-btn{display:block;width:100%;border:0;border-radius:12px;background:var(--gold);color:#1d2b27;font:inherit;font-size:15px;font-weight:700;padding:13px;cursor:pointer;margin-top:14px}' +
    '.rw-card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:13px 14px;margin-bottom:10px}' +
    '.rw-card .t{font-weight:700;font-size:15px}.rw-card .by{font-size:12.5px;color:var(--muted);margin-top:2px}.rw-card .d{font-size:13.5px;line-height:1.5;margin-top:6px}' +
    '.rw-code{display:inline-block;margin-top:8px;font-weight:700;letter-spacing:.06em;border:1px dashed var(--gold);border-radius:8px;padding:4px 10px;background:var(--cream);cursor:pointer}' +
    '.rw-until{font-size:12px;color:var(--muted);margin-top:6px}.rw-link{display:inline-block;margin-top:8px;font-size:13px;font-weight:600;color:var(--teal)}' +
    '.rw-wk{font-size:12.5px;color:var(--muted);margin:-6px 2px 12px}.rw-empty{text-align:center;color:var(--muted);font-size:14px;line-height:1.6;padding:24px 10px}';
  doc.head.appendChild(css);

  var s = N.el('div', 'screen', '<h2 class="section-title" style="margin-top:2px">🎁 Rewards</h2><div id="rwBody"></div>');
  s.id = 'screen-rewards';
  doc.querySelector('.screens').appendChild(s);
  var body = s.querySelector('#rwBody');

  function acct() { return root.NoorAccount; }
  function user() { var a = acct(); return a && a.user ? a.user() : null; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function fmtDay(k) { try { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); } catch (e) { return k; } }

  function paintSignup() {
    body.innerHTML = '<div class="rw-hero"><b>Rewards for members</b><p>Create your free account to see this week’s rewards.</p><ul>' +
      '<li>🎁 Gifts and rewards each week</li><li>🏷️ Member discounts from our vendors</li><li>📿 Your Iman Health kept safe, even on a new phone</li><li>🔔 Reminders before our gatherings</li></ul>' +
      '<button class="rw-btn" id="rwJoin" type="button">Sign up / Sign in</button></div>' +
      '<div class="rw-card"><div class="d" style="margin:0">It’s free and there’s no password: you sign in with a code sent to your email.</div></div>';
    body.querySelector('#rwJoin').addEventListener('click', function () { var a = acct(); if (a && a.openAccount) a.openAccount(); else N.showScreen('account'); });
  }

  var loading = false;
  function paintRewards() {
    if (!B || !B.admin) { body.innerHTML = '<div class="rw-empty">Rewards could not be loaded. Please try again later.</div>'; return; }
    if (loading) return; loading = true;
    if (!body.querySelector('.rw-card,.rw-empty')) body.innerHTML = '<div class="rw-empty">Loading this week’s rewards…</div>';
    B.admin.get('rewards').then(function (r) {
      loading = false;
      if (!user()) { paintSignup(); return; }
      r = r || {};
      var t = today(), items = Object.keys(r.items || {}).map(function (id) { return r.items[id] || {}; })
        .filter(function (x) { return x.t && (!x.until || x.until >= t); })
        .sort(function (a, b) { return (a.order || 0) - (b.order || 0) || String(a.t).localeCompare(String(b.t)); });
      var h = '<div class="rw-wk">Rewards this week' + (r.week ? ' · ' + esc(r.week) : '') + '</div>';
      if (r.note) h += '<div class="rw-card" style="border-color:var(--gold)"><div class="d" style="margin:0">' + esc(r.note) + '</div></div>';
      if (!items.length) h += '<div class="rw-empty">This week’s rewards are being prepared, in shaa Allah.<br>Check back soon.</div>';
      items.forEach(function (x) {
        var link = /^https:\/\//.test(x.link || '') ? x.link : '';
        h += '<div class="rw-card"><div class="t">' + esc(x.t) + '</div>' + (x.by ? '<div class="by">' + esc(x.by) + '</div>' : '') +
          (x.d ? '<div class="d">' + esc(x.d) + '</div>' : '') +
          (x.code ? '<div class="rw-code" data-code="' + esc(x.code) + '" title="Tap to copy">' + esc(x.code) + '</div>' : '') +
          (link ? '<div><a class="rw-link" href="' + esc(link) + '" target="_blank" rel="noopener">Open ›</a></div>' : '') +
          (x.until ? '<div class="rw-until">Until ' + esc(fmtDay(x.until)) + '</div>' : '') + '</div>';
      });
      body.innerHTML = h;
    }, function () {
      loading = false;
      body.innerHTML = '<div class="rw-empty">Rewards could not be loaded. Check your internet and try again.</div>';
    });
  }

  body.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('[data-code]'); if (!c) return;
    var code = c.getAttribute('data-code');
    try { root.navigator.clipboard.writeText(code).then(function () { c.textContent = 'Copied ✓'; setTimeout(function () { c.textContent = code; }, 1500); }); } catch (er) {}
  });

  function paint() { if (user()) paintRewards(); else paintSignup(); }
  N.onScreen(function (id) { if (id === 'rewards') paint(); });
  setTimeout(function () { var a = acct(); if (a && a.onChange) a.onChange(function () { if (s.classList.contains('active')) paint(); }); }, 0);
  paint();
})(typeof self !== 'undefined' ? self : this);
