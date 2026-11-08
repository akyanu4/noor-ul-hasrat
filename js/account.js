/* Noor: optional account ("My Account" under More).
   Sign-in is by an emailed link (no password). Signing up is never required; it adds:
     - Iman Health saved to the account (works on a new phone), visible to the person and the app admin (they agree to this)
     - email reminders of the circle's gatherings and a weekly Iman Health summary (each can be switched off)
     - app notifications tied to the account
   Exposes window.NoorAccount: { user(), onChange(fn), mine, profile() } for js/iman.js. */
(function (root) {
  'use strict';
  var N = root.Noor, doc = root.document, B = N && N.backend;
  if (!N || !doc || !B || !B.account) return;
  var A = B.account, esc = N.esc, cfg = root.NOOR_CONFIG || {};
  var PKEY = 'noor_signup', SKEY = 'noor_signin_sent', PRKEY = 'noor_profile';
  function sget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function jget(k) { try { return JSON.parse(sget(k) || 'null'); } catch (e) { return null; } }

  var listeners = [], profile = jget(PRKEY), state = '', msg = '', isAdmin = false;
  var mode = sget('noor_last_email') ? 'signin' : 'signup';   // a phone that has signed in before opens on "Sign in"
  // Before accounts are switched on for everyone, open the app once with ?accounts=1 to try them on this phone.
  if (/[?&]accounts=1/.test(root.location.search || '')) { sset('noor_accounts_preview', '1'); try { root.history.replaceState(null, '', root.location.pathname); } catch (e) {} setTimeout(function () { N.showScreen('account'); }, 300); }
  var accountsOn = !!cfg.accountsOn || sget('noor_accounts_preview') === '1';
  function emit() { var u = A.user(); listeners.forEach(function (fn) { try { fn(u, profile); } catch (e) {} }); }

  var css = doc.createElement('style');
  css.textContent =
    '.ac-hero{background:linear-gradient(135deg,var(--teal),#0f3a33);color:#f5f1e2;border-radius:16px;padding:16px;margin-bottom:12px}.ac-hero b{font-size:18px}.ac-hero p{margin:6px 0 0;font-size:13px;line-height:1.5;opacity:.92}.ac-hero ul{margin:8px 0 0;padding-left:18px;font-size:13px;line-height:1.6}' +
    '.ac-card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:12px}' +
    '.ac-f{display:block;margin:0 0 12px}.ac-f span{display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin-bottom:4px}.ac-f input{width:100%;box-sizing:border-box;border:1px solid var(--line);background:var(--cream);color:var(--ink);border-radius:10px;padding:11px 12px;font:inherit;font-size:15px}' +
    '.ac-ck{display:flex;gap:10px;align-items:flex-start;padding:8px 0;font-size:13.5px;line-height:1.45;cursor:pointer}.ac-ck input{width:20px;height:20px;flex:none;margin:1px 0 0;accent-color:var(--teal)}.ac-ck small{display:block;color:var(--muted);font-size:12px}' +
    '.ac-btn{display:block;width:100%;border:0;border-radius:12px;background:var(--teal);color:#fff;font:inherit;font-size:15px;font-weight:700;padding:13px;cursor:pointer;margin-top:6px}.ac-btn[disabled]{opacity:.55;cursor:default}.ac-btn.alt{background:var(--cream);color:var(--ink);border:1px solid var(--line);font-weight:600}' +
    '.ac-msg{font-size:13px;line-height:1.5;margin:8px 2px;color:var(--ink)}.ac-msg.err{color:#c0392b}.ac-sub{font-size:12px;color:var(--muted);line-height:1.5}.ac-link{background:none;border:0;color:var(--muted);text-decoration:underline;font:inherit;font-size:12.5px;cursor:pointer;padding:8px 2px}' +
    '.ac-tabs{display:flex;background:var(--cream);border:1px solid var(--line);border-radius:12px;padding:3px;margin-bottom:12px}.ac-tabs button{flex:1;border:0;background:none;padding:9px;border-radius:9px;font:inherit;font-size:14px;font-weight:600;color:var(--muted);cursor:pointer}.ac-tabs button.on{background:var(--panel);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.12)}' +
    '.ac-f[hidden],#acBayWithL[hidden]{display:none!important}' +
    '.ac-pill{color:#fff;font-size:11.5px;font-weight:700;border-radius:999px;padding:3px 10px;white-space:nowrap}.ac-sel{width:100%;box-sizing:border-box;border:1px solid var(--line);background:var(--cream);color:var(--ink);border-radius:10px;padding:11px 12px;font:inherit;font-size:15px}' +
    '.ac-bay.hl{outline:2px solid var(--gold);outline-offset:6px;border-radius:8px}' +
    '.ac-row{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:14px}.ac-row:last-child{border-bottom:0}.ac-row span{color:var(--muted)}';
  doc.head.appendChild(css);

  var s = N.el('div', 'screen', '<div class="subhead"><div class="backbtn" id="acBack">←</div><div class="subtitle">My Account</div></div><div id="acBody"></div>');
  s.id = 'screen-account'; doc.querySelector('.screens').appendChild(s);
  s.querySelector('#acBack').addEventListener('click', function () { N.backTab(); });
  var body = s.querySelector('#acBody');

  function cityList() { var c = root.NoorCities && (root.NoorCities.LIST || root.NoorCities.list); return Array.isArray(c) ? c.map(function (x) { return x.name || x[0]; }).filter(Boolean) : ['Hyderabad']; }
  function ck(id, on, label, sub) { return '<label class="ac-ck"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '><div>' + label + (sub ? '<small>' + sub + '</small>' : '') + '</div></label>'; }
  function fields(p, noBay) {
    p = p || {}; var r = p.remind || { gather: true, weekly: true, push: false };
    return '<label class="ac-f"><span>Your name</span><input id="acName" autocomplete="name" maxlength="60" value="' + esc(p.name || '') + '"></label>' +
      '<label class="ac-f"><span>Mobile number (optional)</span><input id="acPhone" type="tel" autocomplete="tel" maxlength="20" placeholder="+91 …" value="' + esc(p.phone || '') + '"></label>' +
      '<label class="ac-f"><span>City</span><input id="acCity" list="acCities" maxlength="40" value="' + esc(p.city || '') + '"><datalist id="acCities">' + cityList().map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist></label>' +
      '<div class="ac-sub" style="margin:2px 0 4px;font-weight:600">Reminders</div>' +
      ck('acGather', r.gather, 'Email me before our gatherings', 'Weekly halqa, monthly mehfil, Urs and Salgirah.') +
      ck('acWeekly', r.weekly, 'Email me my Iman Health each Friday', 'A short, private summary of your week.') +
      ck('acPush', r.push, 'App notifications on this phone', 'Halqa and new classes. Your phone will ask to allow them.') +
      (noBay ? '' : bayahFields(p));
  }
  // Bai'at: members who have taken it can watch the full dars and the dhikr-practice Shorts.
  // Shaykhs / Khalifas to choose from (config.js bayahGuides adds or replaces them), and "Other" to type a name.
  var GUIDES_NOW = (cfg.bayahGuides && cfg.bayahGuides.length) ? cfg.bayahGuides : ['Alhaj Rasheed Khan (Ayub), Khalifa'];
  var GUIDES_PAST = cfg.bayahGuidesPast || [];
  var GUIDES = GUIDES_NOW.concat(GUIDES_PAST);
  function bayahFields(p, inCard) {
    var b = p.bayah || {}, w = b.with || '', known = GUIDES.indexOf(w) >= 0, other = !!w && !known;
    return '<div id="acBayah" class="ac-bay">' + (inCard ? '<div style="height:6px"></div>' : '<div class="ac-sub" style="margin:10px 0 4px;font-weight:600">Bai’at</div>') +
      ck('acBay', b.taken, 'I have taken Bai’at', 'With a Shaykh or his Khalifa. The full dars and the dhikr practices are for murids, after approval.') +
      '<div id="acBayWithL"' + (b.taken ? '' : ' hidden') + '><label class="ac-f"><span>With (Shaykh / Khalifa)</span><select id="acBaySel" class="ac-sel">' +
        '<option value="">Choose…</option>' + (function () {
          var opt = function (g) { return '<option' + (g === w ? ' selected' : '') + '>' + esc(g) + '</option>'; };
          return GUIDES_PAST.length ? '<optgroup label="Giving Bai\u2019at today">' + GUIDES_NOW.map(opt).join('') + '</optgroup><optgroup label="In their lifetime">' + GUIDES_PAST.map(opt).join('') + '</optgroup>' : GUIDES_NOW.map(opt).join('');
        })() +
        '<option value="__other"' + (other ? ' selected' : '') + '>Other (type the name)</option></select></label>' +
      '<label class="ac-f" id="acBayOtherL"' + (other ? '' : ' hidden') + '><span>Name of the Shaykh / Khalifa</span><input id="acBayWith" maxlength="80" value="' + esc(other ? w : '') + '"></label></div>' +
      '<div class="ac-sub" style="margin:-4px 0 6px">Not yet? <a href="#" id="acBayHow">How to take Bai’at →</a></div></div>';
  }
  function readBayah() {
    var cb = body.querySelector('#acBay'); if (!cb) return null;
    var sel = body.querySelector('#acBaySel'), sv = sel ? sel.value : '', w = sv === '__other' ? ((body.querySelector('#acBayWith') || {}).value || '').trim() : sv;
    return { taken: cb.checked, with: cb.checked ? w.slice(0, 80) : '' };
  }
  // Approval (written only by an admin to bayah_ok/<uid>): 'none' | 'pending' | 'approved' | 'rejected'
  var bayOk = jget('noor_bayah_ok');
  function bayStatus() {
    if (!(profile && profile.bayah && profile.bayah.taken)) return 'none';
    return bayOk && bayOk.approved ? 'approved' : bayOk && bayOk.rejected ? 'rejected' : 'pending';
  }
  function loadBayOk() {
    if (!A.user()) return Promise.resolve();
    return B.mine.get('bayah_ok').then(function (v) { bayOk = v || null; sset('noor_bayah_ok', v ? JSON.stringify(v) : null); emit(); if (s.classList.contains('active')) paint(); }, function () {});
  }
  function bayahCard() {
    var st = bayStatus(), pill = { none: ['Not marked', '#9aa5a1'], pending: ['Waiting for approval', '#d39b1e'], approved: ['Approved ✓', '#2f9e63'], rejected: ['Not approved', '#d0564c'] }[st];
    var note = st === 'pending' ? 'JazakAllah khair. The admin will confirm your Bai’at, then the full dars and dhikr practices open here.'
      : st === 'approved' ? 'The full dars and the dhikr-practice Shorts are open for you.'
      : st === 'rejected' ? 'Your Bai’at could not be confirmed yet. Please contact Alhaj Rasheed Khan (Ayub) (More → About & Support), then save again.'
      : 'If you have taken Bai’at with a Shaykh or his Khalifa, mark it here. After the admin approves it, the full dars and the dhikr practices open for you.';
    return '<div class="ac-card" style="border-color:var(--gold)"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><b style="font-size:15px">🤝 Bai’at</b>' +
      '<span class="ac-pill" style="background:' + pill[1] + '">' + pill[0] + '</span></div><div class="ac-sub" style="margin:6px 0 0">' + esc(note) + '</div>' +
      bayahFields(profile || {}, true) + '<button class="ac-btn" id="acBaySave" type="button">Save Bai’at</button><div class="ac-msg" id="acBayMsg"></div></div>';
  }
  function readFields() {
    var v = function (id) { var e = body.querySelector('#' + id); return e ? e.value.trim() : ''; }, c = function (id) { var e = body.querySelector('#' + id); return !!(e && e.checked); };
    return { name: v('acName').slice(0, 60), phone: v('acPhone').replace(/[^\d+ -]/g, '').slice(0, 20), city: v('acCity').slice(0, 40), remind: { gather: c('acGather'), weekly: c('acWeekly'), push: c('acPush') },
      bayah: readBayah() || (profile && profile.bayah) || { taken: false } };
  }

  function paint() {
    var u = A.user(), h = '';
    if (!A.available || (!accountsOn && !u)) { body.innerHTML = '<div class="ac-hero"><b>Accounts are coming soon</b><p>Soon you can create a free account to keep your Iman Health safe on a new phone and get email reminders before our gatherings, in shaa Allah.</p></div>'; return; }
    if (state === 'verifying') { body.innerHTML = '<div class="ac-card"><div class="ac-msg">Signing you in…</div></div>'; return; }
    if (u) {
      var p = profile || {};
      h += '<div class="ac-hero"><b>Assalamu alaikum' + (p.name ? ', ' + esc(p.name.split(' ')[0]) : '') + '</b><p>Signed in as ' + esc(u.email) + '. Your Iman Health is saved to your account.</p></div>';
      if (!p.name) h += '<div class="ac-card"><div class="ac-msg"><b>One more step:</b> add your name below, tick the agreement, and tap Save to finish your account.</div>' +
        '<label class="ac-ck"><input type="checkbox" id="acConsent2"><div>I agree that my Iman Health is saved to my account and that the Noor-ul-Hasrat admin can see it.</div></label></div>';
      h += bayahCard();
      h += '<div class="ac-card">' + fields(p, true) + '<button class="ac-btn" id="acSave" type="button">Save</button><div class="ac-msg' + (/^!/.test(msg) ? ' err' : '') + '" id="acMsg">' + esc(msg.replace(/^!/, '')) + '</div></div>';
      h += '<div class="ac-card"><div class="ac-row"><span>Email</span>' + esc(u.email) + '</div><div class="ac-row"><span>Iman Health</span>' + esc((root.NoorImanSync && root.NoorImanSync.status()) || 'Saved to your account') + '</div>' +
        (p.joined ? '<div class="ac-row"><span>Member since</span>' + esc(new Date(p.joined).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })) + '</div>' : '') + '</div>';
      if (isAdmin) h += '<button class="ac-btn alt" id="acAdmin" type="button">Open the admin page</button>';
      h += '<div class="ac-sub" style="margin:12px 2px">Your Iman Health (prayers, fasting, dhikr, good deeds, zakat paid or not) is saved to your account. You and the Noor-ul-Hasrat admin can see it. Your saved masjid places stay on this phone only. <a href="privacy.html">Privacy</a></div>' +
        '<button class="ac-link" id="acOut" type="button">Sign out of this phone</button> · <button class="ac-link" id="acDel" type="button">Delete my account</button>';
      body.innerHTML = h; return;
    }
    var sent = jget(SKEY);
    if (sent && Date.now() - sent.t < 30 * 60000) {
      h += '<div class="ac-hero"><b>Check your email</b><p>We sent a sign-in link to <b>' + esc(sent.email) + '</b>. Open it on this phone and you are in. It works for 30 minutes.</p><p>Not there? Look in Spam or Promotions.</p></div>' +
        '<div class="ac-msg' + (/^!/.test(msg) ? ' err' : '') + '">' + esc(msg.replace(/^!/, '')) + '</div>' +
        '<button class="ac-btn alt" id="acResend" type="button">Send the link again</button><button class="ac-link" id="acOther" type="button">Use a different email</button>';
      body.innerHTML = h; return;
    }
    var pend = jget(PKEY) || {};
    if (mode === 'signin') {
      h += '<div class="ac-tabs"><button type="button" class="on" data-mode="signin">Sign in</button><button type="button" data-mode="signup">Create account</button></div>' +
        '<div class="ac-card"><div class="ac-sub" style="margin:0 0 10px">Already a member? Enter your email and we will send you a sign-in link. No password.</div>' +
        '<label class="ac-f"><span>Email</span><input id="acEmail" type="email" autocomplete="email" inputmode="email" maxlength="120" value="' + esc(pend.email || sget('noor_last_email') || '') + '"></label>' +
        '<button class="ac-btn" id="acSignIn" type="button">Email me a sign-in link</button><div class="ac-msg' + (/^!/.test(msg) ? ' err' : '') + '" id="acMsg">' + esc(msg.replace(/^!/, '')) + '</div>' +
        '<div class="ac-sub">New here? <a href="#" data-mode="signup">Create a free account</a></div></div>';
      body.innerHTML = h; return;
    }
    h += '<div class="ac-tabs"><button type="button" data-mode="signin">Sign in</button><button type="button" class="on" data-mode="signup">Create account</button></div>';
    h += '<div class="ac-hero"><b>Create your free account</b><p>Optional. Everything in Noor works without it. With an account:</p><ul><li>Your Iman Health is kept safe, even on a new phone</li><li>Email reminders before our gatherings</li><li>Your Iman Health summary each Friday</li></ul></div>' +
      '<div class="ac-card"><label class="ac-f"><span>Email</span><input id="acEmail" type="email" autocomplete="email" inputmode="email" maxlength="120" value="' + esc(pend.email || '') + '"></label>' + fields(pend) +
      '<label class="ac-ck" style="border-top:1px solid var(--line);margin-top:4px;padding-top:12px"><input type="checkbox" id="acConsent"' + (pend.consent ? ' checked' : '') + '><div>I agree that my Iman Health is saved to my account and that the Noor-ul-Hasrat admin can see it.<small>Prayers, fasting, dhikr, good deeds and zakat (paid or not, never an amount). Your location is never sent.</small></div></label>' +
      '<button class="ac-btn" id="acSend" type="button">Email me a sign-in link</button><div class="ac-msg' + (/^!/.test(msg) ? ' err' : '') + '" id="acMsg">' + esc(msg.replace(/^!/, '')) + '</div>' +
      '<div class="ac-sub">No password. Already have an account? <a href="#" data-mode="signin">Sign in</a> · <a href="privacy.html">Privacy</a></div></div>' +
      '<div class="ac-card" style="border-color:var(--gold)"><div class="ac-msg" style="margin:0"><b>🤝 Full dars and dhikr practices</b><br>Members can watch the full dars and the Shorts that teach a practice of dhikr. ' + esc((root.NoorFamily && root.NoorFamily.BAYAH_EN) || '') + '</div></div>';
    body.innerHTML = h;
  }

  function say(t) { msg = t; var m = body.querySelector('#acMsg'); if (m) { m.textContent = t.replace(/^!/, ''); m.className = 'ac-msg' + (/^!/.test(t) ? ' err' : ''); } }

  function askPush() {
    if (!cfg.oneSignalAppId) return;
    root.OneSignalDeferred = root.OneSignalDeferred || [];
    root.OneSignalDeferred.push(function (OS) { try { return OS.Notifications.requestPermission().then(function () { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') { OS.User.addTag('halqa', '1'); OS.User.addTag('classes', '1'); } }); } catch (e) {} });
  }
  function linkPush(u) {
    if (!cfg.oneSignalAppId || !u) return;
    root.OneSignalDeferred = root.OneSignalDeferred || [];
    root.OneSignalDeferred.push(function (OS) { try { return OS.login(u.uid); } catch (e) {} });
  }

  function saveProfile(p) {
    var u = A.user(); if (!u) return Promise.reject(new Error('not signed in'));
    var ob = (profile && profile.bayah) || {}, nb = p.bayah || {};
    var bay = nb.taken ? { taken: true, with: nb.with || '', at: ob.taken && ob.at ? ob.at : Date.now() } : { taken: false };
    var full = { name: p.name, email: u.email, phone: p.phone || '', city: p.city || '', remind: p.remind, bayah: bay,
      consent: (profile && profile.consent) || { admin: true, at: Date.now() }, joined: (profile && profile.joined) || Date.now(), updated: Date.now() };
    return B.mine.put('profiles', '', full).then(function () { profile = full; sset(PRKEY, JSON.stringify(full)); emit(); return full; });
  }

  function afterSignIn(u) {
    sset('noor_last_email', u.email);
    var pend = jget(PKEY);
    sset(SKEY, null);
    return B.mine.get('profiles').then(function (remote) {
      if (remote && remote.name) { profile = remote; sset(PRKEY, JSON.stringify(remote)); sset(PKEY, null); return; }
      if (pend && pend.name && pend.email === u.email) { sset(PKEY, null); return saveProfile(pend).then(function () { if (pend.remind && pend.remind.push) askPush(); }); }
      profile = null; sset(PRKEY, null);
    }).catch(function () {}).then(function () {
      linkPush(u);
      B.admin.isAdmin().then(function (a) { isAdmin = a; if (s.classList.contains('active')) paint(); });
      loadBayOk();
      emit();
    });
  }

  body.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'acBay') { var l = body.querySelector('#acBayWithL'); if (l) l.hidden = !e.target.checked; }
    if (e.target && e.target.id === 'acBaySel') { var o = body.querySelector('#acBayOtherL'); if (o) o.hidden = e.target.value !== '__other'; }
  });
  body.addEventListener('click', function (e) {
    var md = e.target.closest && e.target.closest('[data-mode]');
    if (md) { e.preventDefault(); mode = md.getAttribute('data-mode'); msg = ''; paint(); return; }
    if (e.target && e.target.id === 'acBayHow') { e.preventDefault(); N.route('bayah'); return; }
    var t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
    if (t.id === 'acSignIn') {
      var em = (body.querySelector('#acEmail').value || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { say('!Please enter your email address.'); return; }
      t.disabled = true; say('Sending…');
      A.requestLink(em).then(function () { msg = ''; sset(SKEY, JSON.stringify({ email: em, t: Date.now() })); paint(); },
        function (er) { t.disabled = false; say('!' + (er && er.message || 'Could not send the email. Check your internet and try again.')); });
      return;
    }
    if (t.id === 'acSend' || t.id === 'acResend') {
      var pend = t.id === 'acResend' ? { email: (jget(SKEY) || {}).email } : Object.assign({ email: (body.querySelector('#acEmail').value || '').trim().toLowerCase(), consent: body.querySelector('#acConsent').checked }, readFields());
      if (t.id === 'acSend') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(pend.email)) { say('!Please enter your email address.'); return; }
        if (!pend.name) { say('!Please enter your name.'); return; }
        if (!pend.consent) { say('!Please tick the box to agree, so your Iman Health can be saved to your account.'); return; }
        if (pend.bayah && pend.bayah.taken && !pend.bayah.with) { say('!Please write the name of the Shaykh or Khalifa you took Bai\u2019at with.'); return; }
        sset(PKEY, JSON.stringify(pend));
      }
      t.disabled = true; say('Sending…');
      A.requestLink(pend.email).then(function () { msg = ''; sset(SKEY, JSON.stringify({ email: pend.email, t: Date.now() })); paint(); },
        function (er) { t.disabled = false; say('!' + (er && er.message || 'Could not send the email. Check your internet and try again.')); });
      return;
    }
    if (t.id === 'acOther') { sset(SKEY, null); msg = ''; paint(); return; }
    if (t.id === 'acSave') {
      var p = readFields(); if (!p.name) { say('!Please enter your name.'); return; }
      var c2 = body.querySelector('#acConsent2'); if (c2 && !c2.checked) { say('!Please tick the agreement above to finish your account.'); return; }
      t.disabled = true; say('Saving…');
      saveProfile(p).then(function () { if (p.remind.push) askPush(); msg = 'Saved.'; paint(); }, function () { t.disabled = false; say('!Could not save. Check your internet and try again.'); });
      return;
    }
    if (t.id === 'acBaySave') {
      var bb = readBayah(), bm = body.querySelector('#acBayMsg'), bsay = function (x) { bm.textContent = x.replace(/^!/, ''); bm.className = 'ac-msg' + (/^!/.test(x) ? ' err' : ''); };
      if (bb.taken && !bb.with) { bsay('!Please choose or write the name of the Shaykh or Khalifa.'); return; }
      var ob2 = (profile && profile.bayah) || {}, nv = bb.taken ? { taken: true, with: bb.with, at: ob2.taken && ob2.at && ob2.with === bb.with ? ob2.at : Date.now() } : { taken: false };
      t.disabled = true; bsay('Saving…');
      B.mine.put('profiles', 'bayah', nv).then(function () {
        profile = Object.assign({}, profile || {}, { bayah: nv, updated: Date.now() }); sset(PRKEY, JSON.stringify(profile)); emit(); paint();
        var m2 = body.querySelector('#acBayMsg'); if (m2) m2.textContent = nv.taken ? (bayStatus() === 'approved' ? 'Saved.' : 'Saved. Waiting for the admin’s approval.') : 'Saved.';
      }, function () { t.disabled = false; bsay('!Could not save. Check your internet and try again.'); });
      return;
    }
    if (t.id === 'acAdmin') { root.location.href = 'admin.html'; return; }
    if (t.id === 'acOut') {
      if (!root.confirm('Sign out on this phone? Your Iman Health stays on this phone and in your account.')) return;
      A.signOut(); profile = null; isAdmin = false; sset(PRKEY, null); bayOk = null; sset('noor_bayah_ok', null); msg = ''; mode = 'signin';
      if (cfg.oneSignalAppId) { root.OneSignalDeferred = root.OneSignalDeferred || []; root.OneSignalDeferred.push(function (OS) { try { return OS.logout(); } catch (er) {} }); }
      emit(); paint(); return;
    }
    if (t.id === 'acDel') {
      if (!root.confirm('Delete your account? Your profile and the Iman Health saved in your account are erased for good. What is on this phone stays until you erase it in Iman Health.')) return;
      t.disabled = true;
      A.deleteAccount().then(function () { profile = null; isAdmin = false; sset(PRKEY, null); sset('noor_last_email', null); mode = 'signup'; msg = 'Your account was deleted.'; emit(); paint(); },
        function () { t.disabled = false; root.alert('Could not delete the account. Check your internet and try again.'); });
    }
  });

  // Opening the emailed link: https://…/?signin=<token>
  var m = /[?&]signin=([A-Za-z0-9_.-]+)/.exec(root.location.search || '');
  if (m) {
    try { root.history.replaceState(null, '', root.location.pathname); } catch (e) {}
    state = 'verifying';
    setTimeout(function () { N.showScreen('account'); }, 300);
    A.completeLink(m[1]).then(function (u) { state = ''; msg = ''; return afterSignIn(u); }, function (er) {
      state = ''; msg = '!' + (er && er.message || 'Could not sign you in. Try again.');
    }).then(function () { paint(); });
  } else if (A.user()) {
    // Signed in earlier: refresh the profile and admin flag quietly.
    B.mine.get('profiles').then(function (p) { if (p) { profile = p; sset(PRKEY, JSON.stringify(p)); emit(); } }).catch(function () {});
    B.admin.isAdmin().then(function (a) { isAdmin = a; });
    loadBayOk();
    linkPush(A.user());
  }

  N.onScreen(function (id) { if (id === 'account') { if (state !== 'verifying' && !/^!/.test(msg)) msg = ''; paint(); loadBayOk(); } });
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden && A.user()) loadBayOk(); });   // an approval shows up the next time the app is opened

  /* ---------- on Home: a header button (👤, or your initial once signed in) and a sign-up card for signed-out visitors ---------- */
  var hcss = doc.createElement('style');
  hcss.textContent = '.acc-hbtn{font-size:17px!important;font-weight:700}.acc-home[hidden]{display:none!important}.acc-home{display:flex;align-items:center;gap:12px;margin:10px 0 2px;padding:11px 14px;border-radius:14px;cursor:pointer;background:var(--panel);border:1px solid var(--gold)}' +
    '.acc-home .ic{flex:none;width:40px;height:40px;border-radius:50%;background:var(--cream);display:flex;align-items:center;justify-content:center;font-size:20px}.acc-home .tx{flex:1;min-width:0}.acc-home b{display:block;font-size:15px;color:var(--ink)}.acc-home small{display:block;font-size:12px;color:var(--muted);margin-top:1px}' +
    '.acc-home .bt{flex:none;background:var(--teal);color:#fff;font-weight:700;font-size:13px;border-radius:999px;padding:8px 14px}';
  doc.head.appendChild(hcss);
  var hbtn = null, hcard = null;
  function paintHome() {
    if (!A.available || !accountsOn) return;
    var u = A.user(), mb = doc.getElementById('menuBtn');
    if (mb && !hbtn) {
      hbtn = N.el('button', 'menubtn acc-hbtn', '👤'); hbtn.type = 'button'; hbtn.id = 'accBtn';
      hbtn.addEventListener('click', function () { N.showScreen('account'); });
      mb.parentNode.insertBefore(hbtn, mb);
    }
    if (hbtn) {
      var nm = profile && profile.name ? profile.name.trim() : '';
      hbtn.textContent = u ? (nm ? nm.charAt(0).toUpperCase() : '✓') : '👤';
      hbtn.setAttribute('aria-label', u ? 'My Account (signed in as ' + u.email + ')' : 'Sign in or create an account');
      hbtn.title = u ? 'My Account' : 'Sign in / Sign up';
    }
    var home = doc.getElementById('screen-home'), after = home && home.querySelector('.bay-home');
    if (!hcard && home) {
      hcard = N.el('div', 'acc-home', '<div class="ic" aria-hidden="true">👤</div><div class="tx"><b>Create your free account</b><small>Keep your Iman Health safe · email reminders · members’ videos</small></div><span class="bt">Sign up / Sign in</span>');
      hcard.setAttribute('role', 'button'); hcard.tabIndex = 0;
      hcard.addEventListener('click', function () { N.showScreen('account'); });
      if (after && after.nextSibling) home.insertBefore(hcard, after.nextSibling); else if (after) home.appendChild(hcard); else home.insertBefore(hcard, home.firstChild);
    }
    if (hcard) hcard.hidden = !!u;
  }
  listeners.push(function () { paintHome(); });
  setTimeout(paintHome, 0);
  N.onScreen(function (id) { if (id === 'home') paintHome(); });

  root.NoorAccount = {
    on: !!(A.available && accountsOn),
    hasBayah: function () { return !!A.user() && bayStatus() === 'approved'; },
    bayahStatus: function () { return A.user() ? bayStatus() : 'signin'; },
    // open My Account at the Bai'at question (from a locked video)
    askBayah: function () { N.showScreen('account'); setTimeout(function () { var b = body.querySelector('#acBayah'); if (b) { b.classList.add('hl'); if (b.scrollIntoView) b.scrollIntoView({ block: 'center' }); } }, 120); },
    user: function () { return A.user(); },
    profile: function () { return profile; },
    onChange: function (fn) { listeners.push(fn); },
    mine: B.mine
  };
})(typeof self !== 'undefined' ? self : this);
