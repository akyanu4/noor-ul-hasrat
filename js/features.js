/* Noor live features: Qibla compass, Halqa (join, RSVP, reminders), shared dhikr count, live class list, push.
 * Needs the hooks exposed by index.html (window.Noor), core.js and backend.js. */
(function () {
  'use strict';
  var N = window.Noor, C = window.NoorCore, cfg = window.NOOR_CONFIG || {};
  if (!N || !C || !window.NoorBackend) return;

  var store = (function () { try { localStorage.setItem('_t', '1'); localStorage.removeItem('_t'); return localStorage; } catch (e) { return null; } })();
  function sget(k) { try { return store && store.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { store && store.setItem(k, v); } catch (e) {} }
  var B = NoorBackend.create(cfg, {
    fetch: window.fetch.bind(window), core: C, storage: store, crypto: window.crypto,
    isVisible: function () { return document.visibilityState !== 'hidden'; }
  });
  if (B.enabled && !B.authEnabled && window.console) console.warn('Noor: rtdbUrl is set but firebaseApiKey is empty, so the app is not signed in and the database will answer "Permission denied". Add firebaseApiKey in js/config.js (see SETUP.md, step 1).');
  var el = N.el, esc = N.esc, $ = function (id) { return document.getElementById(id); };
  var host = document.querySelector('.screens').parentNode, activeScreen = 'home';
  var buzz = function (ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

  function toast(msg, onTap) {
    var old = host.querySelector('.toast'); if (old) old.remove();
    var t = el('div', 'toast', esc(msg)); host.appendChild(t);
    t.addEventListener('click', function () { t.remove(); onTap && onTap(); });
    setTimeout(function () { t.remove(); }, 7000);
  }

  /* ================= Qibla ================= */
  var CITIES = [
    ['Hyderabad', 17.385, 78.4867, 'Asia/Kolkata'], ['Mumbai', 19.076, 72.8777, 'Asia/Kolkata'], ['Delhi', 28.6139, 77.209, 'Asia/Kolkata'],
    ['Jeddah', 21.5433, 39.1728, 'Asia/Riyadh'], ['Riyadh', 24.7136, 46.6753, 'Asia/Riyadh'], ['Kuwait City', 29.3759, 47.9774, 'Asia/Kuwait'],
    ['Dubai', 25.2048, 55.2708, 'Asia/Dubai'], ['London', 51.5074, -0.1278, 'Europe/London'], ['New York', 40.7128, -74.006, 'America/New_York'],
    ['Toronto', 43.6532, -79.3832, 'America/Toronto']
  ];
  var cityNames = CITIES.map(function (c) { return c[0]; });
  function deviceTz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; } }
  var loc = null;
  try { loc = JSON.parse(sget('noor_loc') || 'null'); } catch (e) {}
  if (!loc || typeof loc.lat !== 'number') loc = { name: 'Hyderabad', lat: CITIES[0][1], lon: CITIES[0][2], tz: CITIES[0][3] };
  if (!loc.tz) { var ci = cityNames.indexOf(loc.name); loc.tz = ci >= 0 ? CITIES[ci][3] : deviceTz(); }

  // One place, shared by the Qibla compass and the prayer times.
  var pickers = [];
  function syncPickers() { pickers.forEach(function (p) { p.value = loc.name === 'My location' ? 'gps' : String(Math.max(0, cityNames.indexOf(loc.name))); }); }
  function setLoc(l) { loc = l; sset('noor_loc', JSON.stringify(l)); paintStatic(); renderPrayers(); }
  function bindPicker(selEl, gpsBtn, say) {
    CITIES.forEach(function (c, i) { selEl.appendChild(el('option', '', esc(c[0]))).value = String(i); });
    selEl.appendChild(el('option', '', 'My location')).value = 'gps';
    pickers.push(selEl);
    function locate() {
      if (!navigator.geolocation) { say('Location is not available here. Pick your city from the list.'); syncPickers(); return; }
      say('Finding your location…');
      navigator.geolocation.getCurrentPosition(function (p) {
        setLoc({ name: 'My location', lat: p.coords.latitude, lon: p.coords.longitude, tz: deviceTz() });
        say('Your location is used only on this device to work out direction and prayer times. It is not sent anywhere.');
      }, function () { say('Could not get your location. Pick your city from the list instead.'); syncPickers(); }, { timeout: 10000, maximumAge: 600000 });
    }
    selEl.addEventListener('change', function () {
      if (selEl.value === 'gps') { locate(); return; }
      var c = CITIES[Number(selEl.value)]; setLoc({ name: c[0], lat: c[1], lon: c[2], tz: c[3] });
    });
    gpsBtn.addEventListener('click', locate);
  }

  var q = el('div', 'screen', '');
  q.id = 'screen-qibla';
  q.innerHTML =
    '<div class="subhead"><div class="backbtn" id="qiblaBack">←</div><div class="subtitle">Qibla</div></div>' +
    '<div class="qibla-wrap">' +
      '<div class="qibla-place">Showing for <b id="qPlace"></b><select id="qCity" aria-label="Choose a city"></select></div>' +
      '<div class="qibla-dial" id="qDial"><div class="qibla-rose" id="qRose">' +
        '<span class="qn">N</span><span class="qe">E</span><span class="qs">S</span><span class="qw">W</span>' +
        '<div class="qibla-arm" id="qArm"><div class="qibla-kaaba">🕋</div></div></div><div class="qibla-top"></div></div>' +
      '<div class="qibla-read" id="qRead"></div><div class="qibla-sub" id="qSub"></div>' +
      '<div class="qibla-actions"><div class="tbtn" id="qLoc">📍 Use my location</div><div class="tbtn" id="qStart">🧭 Start compass</div></div>' +
      '<div class="placeholder-note" id="qHelp">Hold your phone flat. If the compass seems off, move it in a figure-8 to calibrate, and keep it away from magnets and metal. ' +
        'Phone compasses point to magnetic north, so near the edge of the dial treat the bearing number as the reference.</div>' +
    '</div>';
  document.querySelector('.screens').appendChild(q);

  var heading = null, rot = 0, bearing = 0, wasAligned = false, listening = false;

  function paintStatic() {
    bearing = C.qiblaBearing(loc.lat, loc.lon);
    $('qPlace').textContent = loc.name;
    syncPickers();
    $('qArm').style.transform = 'rotate(' + bearing + 'deg)';
    $('qSub').textContent = 'Qibla is ' + Math.round(bearing) + '° (' + C.compassPoint(bearing) + ') from north · ' +
      Math.round(C.distanceKm(loc.lat, loc.lon)).toLocaleString() + ' km to the Kaaba';
    paintHeading();
  }
  function paintHeading() {
    var dial = $('qDial');
    if (heading == null) {
      $('qRose').style.transform = 'rotate(0deg)'; dial.classList.remove('aligned');
      $('qRead').textContent = Math.round(bearing) + '° ' + C.compassPoint(bearing);
      return;
    }
    rot += C.angleDiff(rot, -heading);
    $('qRose').style.transform = 'rotate(' + rot + 'deg)';
    var d = C.angleDiff(heading, bearing), aligned = Math.abs(d) <= 3;
    dial.classList.toggle('aligned', aligned);
    $('qRead').textContent = aligned ? 'You are facing the Qibla ✓' : 'Turn ' + (d > 0 ? 'right' : 'left') + ' ' + Math.round(Math.abs(d)) + '°';
    if (aligned && !wasAligned) buzz(30);
    wasAligned = aligned;
  }
  function onOrient(e) {
    var h = C.headingFromEvent(e); if (h == null) return;
    heading = heading == null ? h : (heading + 0.3 * C.angleDiff(heading, h) + 360) % 360;
    paintHeading();
  }
  function help(msg) { $('qHelp').textContent = msg; }
  function listen() {
    if (listening) return; listening = true;
    window.addEventListener('deviceorientationabsolute', onOrient, true);
    window.addEventListener('deviceorientation', onOrient, true);
    setTimeout(function () { if (listening && heading == null) help('No compass signal from this device. Face the bearing shown above, measured clockwise from north.'); }, 2500);
  }
  function unlisten() {
    listening = false; heading = null; wasAligned = false;
    window.removeEventListener('deviceorientationabsolute', onOrient, true);
    window.removeEventListener('deviceorientation', onOrient, true);
  }
  function startCompass() {
    var D = window.DeviceOrientationEvent;
    if (!D) { help('This browser has no compass sensor. Face the bearing shown above, measured clockwise from north.'); return; }
    if (typeof D.requestPermission === 'function') {     // iPhone / iPad: needs a tap
      D.requestPermission().then(function (r) { r === 'granted' ? listen() : help('Compass access was declined. You can allow it in the browser settings.'); })
        .catch(function () { help('Could not start the compass.'); });
    } else listen();
  }
  bindPicker($('qCity'), $('qLoc'), function (m) { $('qHelp').textContent = m; });
  $('qStart').addEventListener('click', startCompass);
  $('qiblaBack').addEventListener('click', function () { N.showScreen('home'); N.setNav('home'); });
  paintStatic();

  /* ================= Prayer times ================= */
  var pset = { method: 'karachi', asr: 'hanafi' };
  try { var saved = JSON.parse(sget('noor_prayer') || '{}'); if (C.METHODS[saved.method]) pset.method = saved.method; if (saved.asr === 'standard' || saved.asr === 'hanafi') pset.asr = saved.asr; } catch (e) {}
  var LABEL = { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };

  var pr = el('div', 'screen', '');
  pr.id = 'screen-prayers';
  pr.innerHTML =
    '<div class="subhead"><div class="backbtn" id="prayersBack">←</div><div class="subtitle">Prayer Times</div></div>' +
    '<div class="qibla-sub" id="pDate" style="text-align:left"></div>' +
    '<div class="ptimes" id="pList"></div>' +
    '<div class="pset-row"><label for="pCity">Place</label><select id="pCity"></select></div>' +
    '<div class="pset-row"><div class="tbtn" id="pLoc">📍 Use my location</div></div>' +
    '<div class="pset-row"><label for="pMethod">Method</label><select id="pMethod"></select></div>' +
    '<div class="pset-row"><label for="pAsr">Asr</label><select id="pAsr"><option value="hanafi">Hanafi (shadow = 2×)</option><option value="standard">Shafi\'i, Maliki, Hanbali (shadow = 1×)</option></select></div>' +
    '<div class="placeholder-note" id="pHelp">Times are calculated on your device from your location, so they work offline. Methods differ by a few minutes; if your local mosque publishes a timetable, follow that.</div>';
  document.querySelector('.screens').appendChild(pr);
  Object.keys(C.METHODS).forEach(function (k) { var o = el('option', '', esc(C.METHODS[k].name)); o.value = k; $('pMethod').appendChild(o); });
  $('pMethod').value = pset.method; $('pAsr').value = pset.asr;
  bindPicker($('pCity'), $('pLoc'), function (m) { $('pHelp').textContent = m; });
  function savePset() { sset('noor_prayer', JSON.stringify(pset)); renderPrayers(); }
  $('pMethod').addEventListener('change', function () { pset.method = this.value; savePset(); });
  $('pAsr').addEventListener('change', function () { pset.asr = this.value; savePset(); });
  $('prayersBack').addEventListener('click', function () { N.showScreen('home'); N.setNav('home'); });
  document.querySelector('.prayer-card').addEventListener('click', function () { N.route('prayers'); });

  function renderPrayers() {
    var now = Date.now(), r = null;
    try { r = C.nextPrayer(now, loc.lat, loc.lon, loc.tz, pset); } catch (e) {}
    $('prayerPlace').textContent = '📍 ' + loc.name + ' · ' + C.METHODS[pset.method].name.replace(/ \(.*/, '');
    var row = $('prayerRow'); row.innerHTML = '';
    if (!r) {
      $('nextPrayerName').textContent = '—'; $('nextPrayerTime').textContent = 'Not available at this latitude';
      $('pList').innerHTML = '<div class="ptime dim"><span>Prayer times can\'t be calculated here. Choose another place.</span></div>'; return;
    }
    var t = r.times;
    ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(function (k) {
      var when = (k === 'fajr' && r.tomorrow) ? r.tomorrow.fajr : t[k];
      row.appendChild(el('div', 'p' + (k === r.name ? ' active' : ''), '<span>' + LABEL[k] + '</span><b>' + esc(C.formatClock(when, loc.tz)) + '</b>'));
    });
    $('nextPrayerName').textContent = LABEL[r.name];
    $('nextPrayerTime').textContent = 'in ' + C.formatCountdown(r.msUntil) + ' · ' + C.formatClock(r.at, loc.tz) + (r.tomorrow ? ' tomorrow' : '');
    try { $('pDate').textContent = new Date(now).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', timeZone: loc.tz }) + ' · ' + loc.name; } catch (e) {}
    var list = $('pList'); list.innerHTML = '';
    ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(function (k) {
      list.appendChild(el('div', 'ptime' + (k === 'sunrise' ? ' dim' : '') + (k === r.name && !r.tomorrow ? ' next' : '') + (k === 'fajr' && r.tomorrow ? ' next' : ''),
        '<span>' + LABEL[k] + '</span><b>' + esc(C.formatClock(t[k], loc.tz)) + '</b>'));
    });
  }
  setInterval(renderPrayers, 20000);
  renderPrayers();

  /* ================= Halqa ================= */
  var halqaTimer = null, mineRsvp = null, curWeek = null, joinedCount = null;
  function localTimeLine(h) {
    try { return 'Your time: ' + new Date(h.start).toLocaleString([], { weekday: 'long', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }); } catch (e) { return ''; }
  }
  function renderHalqa() {
    var h = C.nextHalqa(Date.now());
    $('halqaLocal').textContent = localTimeLine(h);
    var join = $('joinNow');
    if (h.state === 'live') { $('halqaCountdown').textContent = '🔴 Live now · ends in ' + C.formatCountdown(h.end - Date.now()); join.textContent = 'Join the halqa now'; }
    else if (h.state === 'opening') { $('halqaCountdown').textContent = 'Room is open · starts in ' + C.formatCountdown(h.msUntilStart); join.textContent = 'Join the halqa'; }
    else { $('halqaCountdown').textContent = 'Starts in ' + C.formatCountdown(h.msUntilStart); join.textContent = 'Room opens 15 min before'; }
    join.classList.toggle('disabled', h.state === 'upcoming');
    join.classList.toggle('pulse', h.state !== 'upcoming');
    if (curWeek !== h.weekKey) { curWeek = h.weekKey; mineRsvp = sget('noor_rsvp_' + curWeek); refreshRsvp(); }
  }
  function renderRsvp() {
    var on = $('rsvpOnline'), off = $('rsvpOffline');
    [[on, 'online', "I'll join online", "You're joining online ✓"], [off, 'offline', "I'll attend in person", "You're attending in person ✓"]].forEach(function (b) {
      var active = mineRsvp === b[1]; b[0].textContent = active ? b[3] : b[2];
      b[0].classList.toggle('joined', active); b[0].classList.toggle('primary', !active && b[1] === 'online'); b[0].classList.toggle('ghost', !active && b[1] === 'offline');
    });
    $('attendNote').textContent = joinedCount == null ? '' : joinedCount + (joinedCount === 1 ? ' person' : ' people') + ' joining this week';
  }
  function refreshRsvp() {
    renderRsvp();
    if (!B.enabled || !curWeek) return Promise.resolve();
    var wk = curWeek;
    return Promise.all([B.rsvp.mine(wk), B.rsvp.count(wk)]).then(function (r) {
      if (wk !== curWeek) return;
      mineRsvp = r[0]; sset('noor_rsvp_' + wk, mineRsvp || ''); joinedCount = r[1]; renderRsvp();
    }).catch(function () {});
  }
  function setRsvp(mode) {
    var wk = curWeek, prev = mineRsvp, next = prev === mode ? null : mode;
    mineRsvp = next; sset('noor_rsvp_' + wk, next || ''); renderRsvp(); buzz(20);
    tagPush('halqa_rsvp', next || '');
    if (!B.enabled) return;
    (next ? B.rsvp.set(wk, next) : B.rsvp.clear(wk)).then(refreshRsvp).catch(function (e) {
      mineRsvp = prev; sset('noor_rsvp_' + wk, prev || ''); renderRsvp(); toast(e && e.status === 401 ? "Couldn't save your RSVP — the sign-in for this app isn't set up yet." : "Couldn't save your RSVP. Check your connection and try again.");
    });
  }
  $('rsvpOnline').addEventListener('click', function () { setRsvp('online'); });
  $('rsvpOffline').addEventListener('click', function () { setRsvp('offline'); });

  // video room: embedded when a Daily room is configured, otherwise the free Jitsi link in a new tab
  var call = el('div', 'call', '<div class="player-bar"><div class="backbtn" id="callClose" aria-label="Leave">✕</div><div class="subtitle">Halqa-e-Zikr</div></div>' +
    '<iframe id="callFrame" src="about:blank" title="Halqa video room" allow="camera; microphone; autoplay; display-capture; fullscreen"></iframe>');
  host.appendChild(call);
  function closeCall() { $('callFrame').src = 'about:blank'; call.classList.remove('open'); }
  $('callClose').addEventListener('click', closeCall);
  $('joinNow').addEventListener('click', function () {
    var h = C.nextHalqa(Date.now());
    if (h.state === 'upcoming') { toast('The room opens 15 minutes before the halqa starts.'); return; }
    if (/^https:\/\//.test(cfg.halqaVideoUrl || '')) { $('callFrame').src = cfg.halqaVideoUrl; call.classList.add('open'); }
    else window.open('https://meet.jit.si/' + encodeURIComponent(cfg.halqaRoom || 'NoorHalqaEZikr') + '#config.startWithVideoMuted=true&config.startWithAudioMuted=true', '_blank', 'noopener');
  });

  $('addCal').addEventListener('click', function () {
    var ics = C.buildHalqaICS(Date.now(), {
      title: 'Halqa-e-Zikr', description: 'Weekly zikr circle. To join online, open the Noor app and tap Join the halqa. Please keep audio and video off.',
      location: 'Online (Noor app) and in person', url: location.href.split('#')[0]
    });
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    a.download = 'halqa-e-zikr.ics'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    toast('Calendar file ready — open it to add the weekly halqa with a 30-minute reminder.');
  });

  function showNotice() {
    if (!B.enabled) return Promise.resolve();
    return B.notice().then(function (t) { var n = $('halqaNotice'); n.hidden = !t; n.textContent = t; }).catch(function () {});
  }

  /* ================= Collective dhikr ================= */
  var tally = B.createTally(), meta = { title: 'Collective dhikr', arabic: '', target: 0, endsOn: '' };
  function renderCollective(v) {
    $('campaignTitle').textContent = meta.title || 'Collective dhikr';
    var ar = $('campaignArabic'); ar.hidden = !meta.arabic; ar.textContent = meta.arabic || '';
    var sub = [];
    if (meta.target) sub.push('Goal ' + Number(meta.target).toLocaleString());
    if (meta.endsOn) sub.push('by ' + meta.endsOn);
    $('campaignSub').textContent = B.enabled ? sub.join(' · ') : 'Shared counting will switch on soon.';
    var total = v.total == null ? null : v.total;
    $('campaignCount').textContent = total == null ? (B.enabled ? 'Loading…' : '') : total.toLocaleString() + ' recited together';
    var pct = meta.target && total != null ? Math.min(100, Math.round(total / meta.target * 100)) : 0;
    $('campaignFill').style.width = pct + '%'; $('campaignPct').textContent = meta.target && total != null ? pct + '%' : '';
    $('myTally').textContent = v.mine ? 'Your part: ' + v.mine.toLocaleString() + (v.failing ? (v.status === 401 || v.status === 403 ? ' · NOT saved: the database refused the update (' + v.status + '). Check sign-in and rules.' : v.status >= 400 ? ' · NOT saved: server error ' + v.status + ', will retry' : ' · will sync when you are back online') : '') : 'Tap to add what you recite — everyone sees the total grow.';
  }
  function refreshCollective() {
    if (!B.enabled) return Promise.resolve();
    return B.getCollective().then(function (c) {
      if (c && typeof c === 'object') meta = { title: c.title || meta.title, arabic: c.arabic || '', target: Number(c.target) || 0, endsOn: c.endsOn || '' };
      tally.setServer(c && Number(c.count) || 0); renderCollective(tally.view());
    }).catch(function () {});
  }
  tally.onChange(renderCollective);
  document.querySelectorAll('#screen-halqa .tallybtn').forEach(function (b) {
    if (!B.enabled) b.classList.add('off');
    b.addEventListener('click', function () { tally.add(Number(b.getAttribute('data-add'))); buzz(15); });
  });
  $('shareT').addEventListener('click', function () {
    var n = N.tasbeeh.get();
    if (!B.enabled) { toast('Shared counting will switch on soon.'); return; }
    if (n < 1) { toast('Count something first, then add it.'); return; }
    tally.add(n); N.tasbeeh.reset(); toast('Added ' + n + ' to the community count. JazakAllah khair.');
  });
  tally.resume();
  function flushNow() { tally.flush(true); }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushNow(); else tally.resume(); });
  window.addEventListener('pagehide', flushNow);

  /* ================= Push (OneSignal) ================= */
  function pushOn() { return !!cfg.oneSignalAppId; }
  function withPush(fn) { if (!pushOn()) return; window.OneSignalDeferred = window.OneSignalDeferred || []; window.OneSignalDeferred.push(function (OS) { try { return fn(OS); } catch (e) {} }); }
  function tagPush(k, v) { withPush(function (OS) { OS.User.addTag(k, v); }); }
  function granted() { return typeof Notification !== 'undefined' && Notification.permission === 'granted'; }
  function paintRemind() { var b = $('remindBtn'); b.hidden = !pushOn(); b.textContent = granted() ? '🔔 Reminders on' : '🔔 Remind me'; }
  if (pushOn()) {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    var s = document.createElement('script'); s.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'; s.defer = true; document.head.appendChild(s);
    window.OneSignalDeferred.push(function (OS) {
      return OS.init({ appId: cfg.oneSignalAppId, serviceWorkerPath: 'sw.js', serviceWorkerParam: { scope: new URL('./', location.href).pathname },
        notifyButton: { enable: false }, allowLocalhostAsSecureOrigin: true });
    });
  }
  $('remindBtn').addEventListener('click', function () {
    if (granted()) { toast('Reminders are on. You will hear about the weekly halqa and new classes.'); return; }
    withPush(function (OS) {
      return OS.Notifications.requestPermission().then(function () {
        if (granted()) { OS.User.addTag('halqa', '1'); OS.User.addTag('classes', '1'); toast('Reminders on. JazakAllah khair.'); }
        else toast('Notifications are blocked. Allow them in your browser or phone settings.');
        paintRemind();
      });
    });
  });
  paintRemind();
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches && pushOn()) {
    $('remindBtn').textContent = '🔔 Remind me (add to Home Screen first)';
  }

  /* ================= Live class list ================= */
  function checkNew(items) {
    var seen = null; try { seen = JSON.parse(sget('noor_seen') || 'null'); } catch (e) {}
    var ids = items.map(function (i) { return i.id; });
    if (seen) {
      var fresh = items.filter(function (i) { return seen.indexOf(i.id) === -1; });
      if (fresh.length) {
        var f = fresh[0];
        toast(fresh.length === 1 ? 'New class: ' + f.title : fresh.length + ' new classes on the channel', function () { if (fresh.length === 1) N.playById(f.id); else { N.route('classes'); } });
      }
    }
    sset('noor_seen', JSON.stringify((seen || []).concat(ids.filter(function (i) { return !seen || seen.indexOf(i) === -1; })).slice(-300)));
  }
  function loadClasses(force) {
    var note = $('feedNote');
    return B.loadYouTube(force).then(function (r) {
      note.hidden = false;
      if (r.source === 'unconfigured') { note.innerHTML = 'Live list is not connected: add <b>youtubeApiKey</b> to js/config.js. Showing the saved classes only.'; return; }
      if (!r.items.length) { note.innerHTML = 'Could not load the latest uploads' + (r.error && r.error.message ? ' (' + esc(String(r.error.message)) + ')' : '') + '. <a href="#" id="feedRefresh">Try again</a>'; bindRefresh(); return; }
      N.setClasses(C.mergeFeed(N.curated, r.items));
      var t = new Date(); note.innerHTML = 'Live from the DAR UL ILM channel · ' + r.items.length + ' recent uploads' + (r.source === 'stale' ? ' (offline copy)' : '') + ' · checked ' + ('0' + t.getHours()).slice(-2) + ':' + ('0' + t.getMinutes()).slice(-2) + ' · <a href="#" id="feedRefresh">Refresh ↻</a>';
      bindRefresh();
      if (r.source === 'network') checkNew(r.items);
    }).catch(function () {});
  }
  function bindRefresh() {
    var a = $('feedRefresh'); if (!a) return;
    a.addEventListener('click', function (e) { e.preventDefault(); a.textContent = 'Refreshing…'; loadClasses(true); });
  }
  loadClasses(false);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') loadClasses(false); });

  /* ================= screen wiring ================= */
  function refreshHalqa() { renderHalqa(); return Promise.all([refreshRsvp(), refreshCollective(), showNotice()]); }
  N.onScreen(function (id) {
    activeScreen = id;
    clearInterval(halqaTimer);
    if (id === 'prayers') { renderPrayers(); syncPickers(); }
    if (id === 'halqa') { refreshHalqa(); halqaTimer = setInterval(renderHalqa, 1000); paintRemind(); }
    if (id === 'qibla') { if (!(window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission === 'function')) listen(); paintStatic(); }
    else unlisten();
    if (id === 'classes') loadClasses(false);
  });
  B.poll(function () { if (activeScreen === 'halqa') return Promise.all([refreshCollective(), refreshRsvp(), showNotice()]); }, 12000);
  renderHalqa(); renderCollective(tally.view());
})();
