/* Noor: "Count by voice (beta)" for the Tasbeeh screen.
   Fully offline. You teach it your phrase once (about 5 recitations). It keeps only a small numeric "sound shape" of each one
   (not the audio) in this browser, then counts a recitation only when what it hears has that same shape, so coughs, other words
   and background talk are not counted. Nothing is recorded or sent anywhere. It is tuned to your voice and the phrase you taught. */
(function (root) {
  'use strict';

  var STEP = 20;                                   // ms between loudness readings
  var K = [8, 6, 4.5, 3.5, 2.5];                   // how far above the room's noise a sound must rise, by sensitivity 1..5
  var MIN_HI = 0.005, MIN_GAP = 700, HANG = 100, MAX_BURST = 4000;

  // Pure detector: feed it loudness (0..1) with a timestamp; it says when a new recitation starts.
  function createDetector(sens) {
    var s = Math.min(5, Math.max(1, Math.round(sens || 3)));
    var floor = null, env = 0, active = false, lastCount = -1e9, belowSince = null, activeSince = 0, calib = [], t0 = null, hi = MIN_HI, lo = MIN_HI * 0.55;
    return {
      setSensitivity: function (v) { s = Math.min(5, Math.max(1, Math.round(v || 3))); },
      level: function () { return Math.min(1.5, env / hi); },
      env: function () { return env; },
      threshold: function () { return hi; },
      ready: function () { return floor !== null; },
      quiet: function () { return env < lo; },
      push: function (rms, t) {
        if (t0 === null) t0 = t;
        env += (rms > env ? 0.6 : 0.35) * (rms - env);
        if (floor === null) {                        // first half second: just listen to the room
          calib.push(env);
          if (t - t0 >= 500) { calib.sort(function (a, b) { return a - b; }); floor = Math.max(0.0008, calib[Math.floor(calib.length * 0.2)]); }
          return false;
        }
        hi = Math.max(MIN_HI, floor * K[s - 1]); lo = Math.max(floor * 1.6, hi * 0.55);
        var fired = false;
        if (!active) {
          if (env < lo) floor = Math.max(0.0008, floor + (env - floor) * (env < floor ? 0.2 : 0.01));    // follow slow changes in room noise, but only while it is quiet (not between recitations)
          if (env > hi && t - lastCount >= MIN_GAP) { active = true; activeSince = t; belowSince = null; lastCount = t; fired = true; }
        } else {
          if (env < lo) { if (belowSince === null) belowSince = t; if (t - belowSince >= HANG) { active = false; belowSince = null; } }
          else belowSince = null;
          if (active && t - activeSince > MAX_BURST) { floor = Math.max(floor, env * 0.9); active = false; }   // constant noise: treat as the new background
        }
        return fired;
      }
    };
  }


  /* ---------- Sound shape (MFCC) and matching (DTW). Pure functions, tested in Node. ---------- */
  var NF = 26, NC = 12, FL = 0.025, FH = 0.020, TRIM_DB = 28;
  var bankCache = {};
  function mel(f) { return 2595 * Math.log(1 + f / 700) / Math.LN10; }
  function imel(m) { return 700 * (Math.pow(10, m / 2595) - 1); }
  function bankFor(sr, nfft) {
    var key = sr + ':' + nfft; if (bankCache[key]) return bankCache[key];
    var lo = mel(80), hi = mel(Math.min(5200, sr / 2 - 100)), pts = [], i, k, b = [];
    for (i = 0; i < NF + 2; i++) pts.push(Math.floor((nfft + 1) * imel(lo + (hi - lo) * i / (NF + 1)) / sr));
    for (i = 1; i <= NF; i++) {
      var f = new Float64Array(nfft / 2 + 1);
      for (k = pts[i - 1]; k < pts[i]; k++) f[k] = (k - pts[i - 1]) / Math.max(1, pts[i] - pts[i - 1]);
      for (k = pts[i]; k < pts[i + 1]; k++) f[k] = (pts[i + 1] - k) / Math.max(1, pts[i + 1] - pts[i]);
      b.push(f);
    }
    return (bankCache[key] = b);
  }
  function fft(re, im) {
    var n = re.length, i, j = 0, k, t;
    for (i = 1; i < n; i++) { var bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (var len = 2; len <= n; len <<= 1) {
      var ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (i = 0; i < n; i += len) {
        var cr = 1, ci = 0;
        for (k = 0; k < len / 2; k++) {
          var ur = re[i + k], ui = im[i + k], xr = re[i + k + len / 2], xi = im[i + k + len / 2];
          var vr = xr * cr - xi * ci, vi = xr * ci + xi * cr;
          re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
          var nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
        }
      }
    }
  }
  // samples -> list of 12-number frames (every 20 ms), with the silence at both ends cut off and the overall tone/volume removed.
  function features(x, sr) {
    var fl = Math.round(sr * FL), fh = Math.round(sr * FH), nfft = 1; while (nfft < fl) nfft <<= 1;
    var n = Math.floor((x.length - fl) / fh) + 1; if (n < 6) return null;
    var win = new Float64Array(fl), i, m, f, k; for (i = 0; i < fl; i++) win[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (fl - 1));
    var bank = bankFor(sr, nfft), re = new Float64Array(nfft), im = new Float64Array(nfft), E = new Float64Array(n), L = [];
    for (f = 0; f < n; f++) {
      var o = f * fh, tot = 0;
      re.fill(0); im.fill(0);
      for (i = 0; i < fl; i++) { var p = o + i > 0 ? x[o + i - 1] : 0; re[i] = (x[o + i] - 0.97 * p) * win[i]; }
      fft(re, im);
      var pw = new Float64Array(nfft / 2 + 1); for (k = 0; k <= nfft / 2; k++) { pw[k] = re[k] * re[k] + im[k] * im[k]; tot += pw[k]; }
      E[f] = 10 * Math.log(tot + 1e-12) / Math.LN10;
      var lm = new Float64Array(NF); for (m = 0; m < NF; m++) { var sum = 0, bm = bank[m]; for (k = 0; k <= nfft / 2; k++) sum += pw[k] * bm[k]; lm[m] = Math.log(sum + 1e-10); }
      L.push(lm);
    }
    var mx = -1e9; for (f = 0; f < n; f++) if (E[f] > mx) mx = E[f];
    var a = 0, b; while (a < n && E[a] < mx - TRIM_DB) a++;
    // The recitation ends at the first real pause (about a quarter of a second of near-silence), so the start of the next one is not mixed in.
    var run = 0, lm = -1e9; b = n - 1;
    for (f = a; f < n; f++) { if (E[f] > lm) lm = E[f]; if (E[f] < lm - TRIM_DB) { run++; if (run >= 13) { b = f - run; break; } } else run = 0; }
    while (b > a && E[b] < lm - TRIM_DB) b--;
    a = Math.max(0, a - 1); b = Math.min(n - 1, b + 1);
    if (b - a + 1 < 6) return null;
    var out = [], mean = new Float64Array(NC), c, sc = Math.sqrt(2 / NF);
    for (f = a; f <= b; f++) {
      var v = new Float64Array(NC);
      for (c = 1; c <= NC; c++) { var s2 = 0; for (m = 0; m < NF; m++) s2 += L[f][m] * Math.cos(Math.PI * c * (m + 0.5) / NF); v[c - 1] = s2 * sc; mean[c - 1] += v[c - 1]; }
      out.push(v);
    }
    for (f = 0; f < out.length; f++) for (c = 0; c < NC; c++) out[f][c] -= mean[c] / out.length;
    return out;
  }
  function dist(p, q) { var s = 0; for (var i = 0; i < NC; i++) { var d = p[i] - q[i]; s += d * d; } return Math.sqrt(s); }
  // How far the start of "a" is from template "b" (smaller = more alike). The end of "a" may run on past the template.
  function dtw(a, b) {
    var N = a.length, M = b.length, w = Math.ceil(M * 0.5) + 4, INF = 1e12, prev = new Float64Array(M).fill(INF), cur = new Float64Array(M), best = INF, i, j;
    for (i = 0; i < N; i++) {
      if (i - w > M - 1) break;
      cur.fill(INF);
      for (j = Math.max(0, i - w); j <= Math.min(M - 1, i + w); j++) {
        var d = dist(a[i], b[j]), v;
        if (i === 0 && j === 0) v = 2 * d;
        else {
          v = INF;
          if (i > 0 && j > 0 && prev[j - 1] < INF) v = prev[j - 1] + 2 * d;
          if (i > 0 && prev[j] < INF && prev[j] + d < v) v = prev[j] + d;
          if (j > 0 && cur[j - 1] < INF && cur[j - 1] + d < v) v = cur[j - 1] + d;
        }
        cur[j] = v;
      }
      if (cur[M - 1] < INF) { var sc = cur[M - 1] / (i + M + 1); if (sc < best) best = sc; }
      var t = prev; prev = cur; cur = t;
    }
    return best;
  }
  function nearest(feat, tpls) { var best = 1e9; for (var i = 0; i < tpls.length; i++) { var d = dtw(feat, tpls[i]); if (d < best) best = d; } return best; }
  // From the taught samples, work out how different a real recitation may be and still count.
  function limitFor(tpls) {
    var worst = 0, i, j;
    for (i = 0; i < tpls.length; i++) { var nn = 1e9; for (j = 0; j < tpls.length; j++) if (i !== j) { var d = dtw(tpls[i], tpls[j]); if (d < nn) nn = d; } if (nn > worst) worst = nn; }
    return Math.max(1, worst * 1.3);
  }
  var STRICT = [0.8, 0.95, 1.1, 1.3, 1.55];

  var api = { createDetector: createDetector, STEP: STEP, features: features, dtw: dtw, nearest: nearest, limitFor: limitFor, STRICT: STRICT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NoorVoice = api;

  var N = root.Noor, doc = root.document;
  if (!N || !N.tasbeeh || !doc) return;
  var wrap = doc.querySelector('#screen-tasbeeh-full .tasbeeh-wrap'); if (!wrap) return;

  var css = doc.createElement('style');
  css.textContent =
    '.vc{width:100%;max-width:340px;margin-top:22px;text-align:center}.vc .tbtn{display:inline-block}.vc .on{background:var(--teal);color:#fff;border-color:var(--teal)}' +
    '.vc-meter{height:8px;border-radius:4px;background:var(--line);margin:12px auto 6px;overflow:hidden;max-width:260px}.vc-meter i{display:block;height:100%;width:0;background:var(--gold);transition:width .08s}' +
    '.vc-st{font-size:12.5px;color:var(--muted);min-height:18px}.vc-row{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;font-size:12.5px;color:var(--muted)}' +
    '.vc-row input{flex:0 1 150px;accent-color:var(--teal)}.vc-fix{display:flex;gap:10px;justify-content:center;margin-top:12px}.vc-note{font-size:11.5px;color:var(--muted);line-height:1.5;margin-top:12px}' +
    '.counter-ring.hit{animation:vchit .25s}@keyframes vchit{50%{transform:scale(1.04)}}';
  doc.head.appendChild(css);

  var box = doc.createElement('div'); box.className = 'vc';
  box.innerHTML = '<button class="tbtn" id="vcToggle" type="button">🎙️ Count by voice (beta)</button>' +
    '<div class="vc-meter" id="vcMeterBox" hidden><i id="vcMeter"></i></div><div class="vc-st" id="vcStatus"></div><div class="vc-st" id="vcDebug" style="font-size:11px;opacity:.8"></div>' +
    '<div class="vc-row" id="vcSensRow" hidden><span>Strict</span><input id="vcSens" type="range" min="1" max="5" step="1" aria-label="How closely it must match"><span>Forgiving</span></div>' +
    '<div class="vc-fix"><button class="tbtn" id="vcTeach" type="button">🎓 Teach my phrase</button></div>' +
    '<div class="vc-fix"><button class="tbtn" id="vcMinus" type="button" aria-label="Take one off the count">− 1</button><button class="tbtn" id="vcPlus" type="button" aria-label="Add one to the count">+ 1</button></div>' +
    '<div class="vc-note">First, teach it your phrase: say it 5 times, with a short pause between. It counts only that sound, so coughs and other words are ignored, and the phone can sit a little away from you. Everything stays on your phone: only a small numeric shape is saved, never the audio. It is close but not exact, so use − 1 / + 1 to correct it.</div>';
  wrap.appendChild(box);
  var $ = function (id) { return doc.getElementById(id); };
  var tog = $('vcToggle'), st = $('vcStatus'), meter = $('vcMeter'), sensEl = $('vcSens'), teachBtn = $('vcTeach');
  var stream = null, actx = null, proc = null, mute = null, det = null, wake = null, running = false;
  var strict = 3, TEACH_N = 5, PRE = 15;
  var KEY = 'noor_voice_tpl_v1';
  try { var sv = parseInt(localStorage.getItem('noor_voice_match'), 10); if (sv >= 1 && sv <= 5) strict = sv; } catch (e) {}
  sensEl.value = String(strict);

  var tpls = [], limit = 1, mode = 'count', taught = [], cap = null, pending = [], lastStart = -1e9;
  function loadTpl() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (o && o.t && o.t.length >= 3) { tpls = o.t.map(function (t) { return t.map(function (f) { return Float64Array.from(f); }); }); limit = o.limit || limitFor(tpls); return; }
    } catch (e) {}
    tpls = [];
  }
  function saveTpl() {
    try { localStorage.setItem(KEY, JSON.stringify({ limit: limit, t: tpls.map(function (t) { return t.map(function (f) { return Array.prototype.map.call(f, function (v) { return Math.round(v * 100) / 100; }); }); }) })); } catch (e) {}
  }
  function clearTpl() { tpls = []; try { localStorage.removeItem(KEY); } catch (e) {} }
  function label() {
    tog.textContent = running ? '⏹ Stop listening' : '🎙️ Count by voice (beta)';
    teachBtn.textContent = tpls.length ? '🎓 Teach a different phrase' : '🎓 Teach my phrase';
  }
  loadTpl(); label();
  function teachMsg() { return 'Say your phrase (' + (taught.length + 1) + ' of ' + TEACH_N + '), then pause.'; }
  function beginTeach() { mode = 'teach'; taught = []; cap = null; pending = []; st.textContent = 'Getting used to the room… stay quiet a moment, then say your phrase.'; }

  function bump() {
    N.tasbeeh.add(1);
    var r = $('ring'); if (r) { r.classList.remove('hit'); void r.offsetWidth; r.classList.add('hit'); }
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} }
  }
  function stop(msg) {
    running = false;
    if (proc) { try { proc.onaudioprocess = null; proc.disconnect(); } catch (e) {} proc = null; }
    if (mute) { try { mute.disconnect(); } catch (e) {} mute = null; }
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    if (actx) { try { actx.close(); } catch (e) {} actx = null; }
    if (wake) { try { wake.release(); } catch (e) {} wake = null; }
    cap = null; pending = [];
    $('vcMeterBox').hidden = true; $('vcSensRow').hidden = true; meter.style.width = '0'; $('vcDebug').textContent = '';
    label(); st.textContent = msg || '';
  }

  function start() {
    var md = navigator.mediaDevices, AC = root.AudioContext || root.webkitAudioContext;
    if (!md || !md.getUserMedia || !AC) { st.textContent = 'This browser cannot use the microphone here. Try Chrome or Safari, and open Noor over https.'; return; }
    // The audio engine must be created and started right here, inside the tap. On iPhone it stays paused if it is started later.
    try { actx = new AC(); if (actx.resume) actx.resume(); } catch (e) { actx = null; }
    st.textContent = 'Asking for the microphone…';
    md.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (s) {
      stream = s; if (!actx) actx = new AC();
      if (actx.state !== 'running' && actx.resume) actx.resume();
      if (!actx.createScriptProcessor) { stop('This browser cannot analyse sound here. Try Chrome or Safari.'); return; }
      var sr = actx.sampleRate, hopN = Math.round(sr * STEP / 1000), src = actx.createMediaStreamSource(s);
      proc = actx.createScriptProcessor(2048, 1, 1); mute = actx.createGain(); mute.gain.value = 0;
      src.connect(proc); proc.connect(mute); mute.connect(actx.destination);
      det = createDetector(4);                                  // a little eager on purpose: the shape check below throws out the wrong sounds
      if (tpls.length) { mode = 'count'; pending = []; } else beginTeach();
      var carry = new Float32Array(0), ring = [], base = 0, hopIdx = 0, peak = 0, since = performance.now(), warned = false, shown = 0, lastNote = '';

      function seg(a, b) {                                      // samples of hops [a, b)
        a = Math.max(a, base); var parts = [], len = 0, i;
        for (i = a; i < b && i - base < ring.length; i++) { parts.push(ring[i - base]); len += hopN; }
        var out = new Float32Array(len), o = 0; parts.forEach(function (p) { out.set(p, o); o += hopN; }); return out;
      }
      function finishTeach(a, b) {
        var f = features(seg(a, b), sr);
        if (!f || f.length < 12) { st.textContent = 'That was too short or too faint. Try again, a little louder or closer. (' + (taught.length) + ' of ' + TEACH_N + ' so far)'; return; }
        taught.push(f);
        if (taught.length < TEACH_N) { st.textContent = 'Got it. ' + teachMsg(); return; }
        tpls = taught; taught = []; limit = limitFor(tpls); saveTpl(); mode = 'count'; pending = []; lastStart = -1e9; label();
        st.textContent = 'Learned. Now recite and I will count it.';
      }
      function judge(p) {
        var f = features(seg(p.start, p.end), sr); if (!f) return;
        var d = nearest(f, tpls), lim = limit * STRICT[strict - 1], ok = d <= lim;
        (api.log = api.log || []).push(+d.toFixed(2)); if (api.log.length > 50) api.log.shift();
        lastNote = 'Match ' + d.toFixed(2) + ' (limit ' + lim.toFixed(2) + ') ' + (ok ? '✓' : '✗');
        if (ok) {
          var minF = Math.min.apply(null, tpls.map(function (t) { return t.length; }));
          if (p.start - lastStart < Math.ceil(minF * 0.5)) return;      // same recitation seen twice
          lastStart = p.start; bump();
        }
      }
      function onHop(h) {
        var sum = 0, i; for (i = 0; i < h.length; i++) sum += h[i] * h[i];
        var rms = Math.sqrt(sum / h.length); if (rms > peak) peak = rms;
        var t = hopIdx * STEP, fired = det.push(rms, t);
        ring.push(h); if (ring.length > 700) { ring.shift(); base++; }
        if (mode === 'teach') {
          if (!cap && fired) cap = { start: hopIdx - PRE, quiet: 0 };
          else if (cap) {
            cap.quiet = det.quiet() ? cap.quiet + 1 : 0;
            if (cap.quiet >= 22 || hopIdx - cap.start > 220) { var c = cap; cap = null; finishTeach(c.start, hopIdx + 1); }
          }
        } else if (tpls.length) {
          if (fired) { var maxF = Math.max.apply(null, tpls.map(function (t) { return t.length; })); pending.push({ start: hopIdx - PRE, end: hopIdx + Math.ceil(maxF * 1.25) + 15 }); }
          while (pending.length && pending[0].end <= hopIdx) judge(pending.shift());
        }
        hopIdx++;
        meter.style.width = Math.min(100, Math.round(det.level() * 100)) + '%';
        var now = performance.now();
        if (now - shown > 250) { shown = now; $('vcDebug').textContent = det.ready() ? 'Hearing ' + Math.round(det.env() * 1000) + ' · needs ' + Math.round(det.threshold() * 1000) + (lastNote ? ' · ' + lastNote : '') : ''; }
        if (!warned && now - since > 3500 && peak < 0.0004) {
          warned = true;
          if (actx && actx.state !== 'running') { st.textContent = 'The audio engine is paused. Tap anywhere on this screen once.'; if (actx.resume) actx.resume(); }
          else st.textContent = 'The microphone is sending no sound. Check that another app is not using it and that Noor is allowed to use it.';
        }
        if (mode === 'teach' && !cap && det.ready() && taught.length === 0 && st.textContent.indexOf('Getting used') === 0 && hopIdx > 50) st.textContent = teachMsg();
        if (mode === 'count' && st.textContent.indexOf('Getting used') === 0 && hopIdx > 50) st.textContent = 'Listening for your phrase.';
      }
      proc.onaudioprocess = function (e) {
        var inp = e.inputBuffer.getChannelData(0), buf = new Float32Array(carry.length + inp.length), o = 0;
        buf.set(carry, 0); buf.set(inp, carry.length);
        while (buf.length - o >= hopN) { onHop(buf.slice(o, o + hopN)); o += hopN; }
        carry = buf.slice(o);
      };
      running = true; label();
      $('vcMeterBox').hidden = false; $('vcSensRow').hidden = false;
      st.textContent = 'Getting used to the room… stay quiet a moment' + (mode === 'teach' ? ', then say your phrase.' : ', then begin.');
      var kick = function () { if (actx && actx.state !== 'running' && actx.resume) actx.resume(); doc.removeEventListener('touchend', kick); doc.removeEventListener('click', kick); };
      doc.addEventListener('touchend', kick); doc.addEventListener('click', kick);
      try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (w) { wake = w; }).catch(function () {}); } catch (e) {}
      api._beginTeach = function () { beginTeach(); st.textContent = teachMsg(); };
    }).catch(function (err) {
      if (actx) { try { actx.close(); } catch (e) {} actx = null; }
      st.textContent = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError') ? 'The microphone is blocked. Allow it for Noor in your browser or phone settings, then try again.' : 'Could not start the microphone' + (err && err.name ? ' (' + err.name + ')' : '') + '.';
    });
  }
  tog.addEventListener('click', function () { if (running || stream) stop('Stopped.'); else start(); });
  teachBtn.addEventListener('click', function () {
    clearTpl(); label();
    if (running && api._beginTeach) { api._beginTeach(); } else if (!running && !stream) { start(); }
  });
  sensEl.addEventListener('input', function () { strict = +sensEl.value; try { localStorage.setItem('noor_voice_match', String(strict)); } catch (e) {} });
  $('vcMinus').addEventListener('click', function () { N.tasbeeh.add(-1); });
  $('vcPlus').addEventListener('click', function () { N.tasbeeh.add(1); });
  N.onScreen(function (id) { if (id !== 'tasbeeh-full' && (running || stream)) stop(''); });
  doc.addEventListener('visibilitychange', function () { if (doc.hidden && (running || stream)) stop('Stopped because the app went to the background.'); });
})(typeof self !== 'undefined' ? self : this);
