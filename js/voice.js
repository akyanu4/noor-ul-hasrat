/* Noor: "Count by voice (beta)" for the Tasbeeh screen.
   Fully offline: the microphone is read on the device and only the loudness is looked at. Nothing is recorded, stored or sent.
   It counts one recitation each time a burst of sound starts after a quiet moment. It does not understand words, so a cough,
   a passing car or someone talking will count too. Very fast recitation (under about half a second apart) runs together. */
(function (root) {
  'use strict';

  var STEP = 20;                                   // ms between loudness readings
  var K = [8, 6, 4.5, 3.5, 2.5];                   // how far above the room's noise a sound must rise, by sensitivity 1..5
  var MIN_HI = 0.012, MIN_GAP = 700, HANG = 100, MAX_BURST = 4000;

  // Pure detector: feed it loudness (0..1) with a timestamp; it says when a new recitation starts.
  function createDetector(sens) {
    var s = Math.min(5, Math.max(1, Math.round(sens || 3)));
    var floor = null, env = 0, active = false, lastCount = -1e9, belowSince = null, activeSince = 0, calib = [], t0 = null, hi = MIN_HI, lo = MIN_HI * 0.55;
    return {
      setSensitivity: function (v) { s = Math.min(5, Math.max(1, Math.round(v || 3))); },
      level: function () { return Math.min(1.5, env / hi); },
      push: function (rms, t) {
        if (t0 === null) t0 = t;
        env += (rms > env ? 0.6 : 0.35) * (rms - env);
        if (floor === null) {                        // first half second: just listen to the room
          calib.push(env);
          if (t - t0 >= 500) { floor = Math.max(0.0015, calib.reduce(function (a, b) { return a + b; }, 0) / calib.length); }
          return false;
        }
        hi = Math.max(MIN_HI, floor * K[s - 1]); lo = Math.max(floor * 1.6, hi * 0.55);
        var fired = false;
        if (!active) {
          if (env < lo) floor = Math.max(0.0015, floor + (env - floor) * (env < floor ? 0.2 : 0.01));    // follow slow changes in room noise, but only while it is quiet (not between recitations)
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

  var api = { createDetector: createDetector, STEP: STEP };
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
    '<div class="vc-meter" id="vcMeterBox" hidden><i id="vcMeter"></i></div><div class="vc-st" id="vcStatus"></div>' +
    '<div class="vc-row" id="vcSensRow" hidden><span>Quiet room</span><input id="vcSens" type="range" min="1" max="5" step="1" aria-label="Sensitivity"><span>Noisy room</span></div>' +
    '<div class="vc-fix"><button class="tbtn" id="vcMinus" type="button" aria-label="Take one off the count">− 1</button><button class="tbtn" id="vcPlus" type="button" aria-label="Add one to the count">+ 1</button></div>' +
    '<div class="vc-note">Sound is analysed on your phone only. Nothing is recorded or sent anywhere. It counts sounds, not words, so it is close but not exact: use − 1 / + 1 to correct it, and tap the circle any time.</div>';
  wrap.appendChild(box);
  var $ = function (id) { return doc.getElementById(id); };
  var tog = $('vcToggle'), st = $('vcStatus'), meter = $('vcMeter'), sensEl = $('vcSens');
  var stream = null, actx = null, timer = 0, det = null, wake = null, sens = 3;
  try { var sv = parseInt(localStorage.getItem('noor_voice_sens'), 10); if (sv >= 1 && sv <= 5) sens = sv; } catch (e) {}
  sensEl.value = String(sens);

  function bump() {
    N.tasbeeh.add(1);
    var r = $('ring'); if (r) { r.classList.remove('hit'); void r.offsetWidth; r.classList.add('hit'); }
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} }
  }
  function stop(msg) {
    clearInterval(timer); timer = 0;
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    if (actx) { try { actx.close(); } catch (e) {} actx = null; }
    if (wake) { try { wake.release(); } catch (e) {} wake = null; }
    tog.classList.remove('on'); tog.textContent = '🎙️ Count by voice (beta)';
    $('vcMeterBox').hidden = true; $('vcSensRow').hidden = true; meter.style.width = '0';
    st.textContent = msg || '';
  }
  function start() {
    var md = navigator.mediaDevices;
    if (!md || !md.getUserMedia || !(root.AudioContext || root.webkitAudioContext)) { st.textContent = 'This browser cannot use the microphone here. Try Chrome or Safari, and open Noor over https.'; return; }
    st.textContent = 'Asking for the microphone…';
    md.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (s) {
      stream = s; var AC = root.AudioContext || root.webkitAudioContext; actx = new AC();
      if (actx.state === 'suspended') actx.resume();
      var an = actx.createAnalyser(); an.fftSize = 1024; actx.createMediaStreamSource(s).connect(an);
      var buf = new Float32Array(an.fftSize); det = createDetector(sens);
      timer = setInterval(function () {
        an.getFloatTimeDomainData(buf);
        var sum = 0, i; for (i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        if (det.push(Math.sqrt(sum / buf.length), performance.now())) bump();
        meter.style.width = Math.min(100, Math.round(det.level() * 100)) + '%';
      }, STEP);
      tog.classList.add('on'); tog.textContent = '⏹ Stop listening';
      $('vcMeterBox').hidden = false; $('vcSensRow').hidden = false;
      st.textContent = 'Getting used to the room… stay quiet for a moment, then begin.';
      setTimeout(function () { if (timer) st.textContent = 'Listening. Recite at a steady pace.'; }, 900);
      try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (w) { wake = w; }).catch(function () {}); } catch (e) {}
    }).catch(function (err) {
      st.textContent = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError') ? 'The microphone is blocked. Allow it for Noor in your browser or phone settings, then try again.' : 'Could not start the microphone' + (err && err.name ? ' (' + err.name + ')' : '') + '.';
    });
  }
  tog.addEventListener('click', function () { if (timer || stream) stop('Stopped.'); else start(); });
  sensEl.addEventListener('input', function () { sens = +sensEl.value; if (det) det.setSensitivity(sens); try { localStorage.setItem('noor_voice_sens', String(sens)); } catch (e) {} });
  $('vcMinus').addEventListener('click', function () { N.tasbeeh.add(-1); });
  $('vcPlus').addEventListener('click', function () { N.tasbeeh.add(1); });
  N.onScreen(function (id) { if (id !== 'tasbeeh-full' && (timer || stream)) stop(''); });
  doc.addEventListener('visibilitychange', function () { if (doc.hidden && (timer || stream)) stop('Stopped because the app went to the background.'); });
})(typeof self !== 'undefined' ? self : this);
