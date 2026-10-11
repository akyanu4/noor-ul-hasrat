/* Noor backend client.
 * - Shared counters and RSVPs: Firebase Realtime Database over plain HTTPS (REST). No SDK, no build step.
 *   Polling, not streaming: the free plan allows only 100 simultaneous connections.
 * - Live class list: YouTube Data API v3 (uploads playlist).
 * - Optional anonymous sign-in (Firebase Auth over REST, no SDK): when config.firebaseApiKey is set every database
 *   call carries a sign-in token, and the rules then tie each RSVP to the person who made it.
 * Everything degrades to "not connected" when config.js has no keys. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NoorBackend = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MAX_STEP = 500;            // largest single increment the database rules accept
  var FEED_TTL = 5 * 60 * 1000; // reuse the YouTube list for 5 minutes (a list call costs 1 of the 10,000 free daily units)

  function httpError(res, what) { var e = new Error(what + ' failed (' + res.status + ')'); e.status = res.status; return e; }

  function safeStorage(s) {
    var mem = {};
    return {
      getItem: function (k) { try { var v = s && s.getItem(k); return v == null ? (k in mem ? mem[k] : null) : v; } catch (e) { return k in mem ? mem[k] : null; } },
      setItem: function (k, v) { mem[k] = String(v); try { s && s.setItem(k, v); } catch (e) {} },
      removeItem: function (k) { delete mem[k]; try { s && s.removeItem(k); } catch (e) {} }
    };
  }

  function create(cfg, deps) {
    cfg = cfg || {}; deps = deps || {};
    var fetchFn = deps.fetch, core = deps.core;
    var storage = safeStorage(deps.storage);
    var now = deps.now || Date.now;
    var visible = deps.isVisible || function () { return true; };
    var base = String(cfg.rtdbUrl || '').replace(/\/+$/, '');
    var enabled = /^(https:\/\/|http:\/\/(127\.0\.0\.1|localhost)(:|\/|$))/.test(base);   // https only; plain http just for local testing

    /* ---------- anonymous sign-in (Firebase Auth REST) ---------- */
    var authOn = !!cfg.firebaseApiKey && enabled;
    var identityBase = (cfg.authBase || 'https://identitytoolkit.googleapis.com').replace(/\/+$/, '');
    var tokenBase = (cfg.tokenBase || 'https://securetoken.googleapis.com').replace(/\/+$/, '');
    var session = null, authPromise = null;            // {uid, id, refresh, exp}
    try { session = JSON.parse(storage.getItem('noor_auth') || 'null'); } catch (e) {}
    function saveSession(s) { session = s; storage.setItem('noor_auth', JSON.stringify(s)); return s; }
    function postJSON(u, body, form) {
      return fetchFn(u, { method: 'POST', headers: { 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json' }, body: form ? body : JSON.stringify(body) })
        .then(function (res) { if (!res.ok) throw httpError(res, 'sign-in'); return res.json(); });
    }
    function signUp() {
      return postJSON(identityBase + '/v1/accounts:signUp?key=' + encodeURIComponent(cfg.firebaseApiKey), { returnSecureToken: true }).then(function (d) {
        return saveSession({ uid: d.localId, id: d.idToken, refresh: d.refreshToken, exp: now() + Number(d.expiresIn || 3600) * 1000 });
      });
    }
    function refreshToken() {
      return postJSON(tokenBase + '/v1/token?key=' + encodeURIComponent(cfg.firebaseApiKey),
        'grant_type=refresh_token&refresh_token=' + encodeURIComponent(session.refresh), true).then(function (d) {
        return saveSession({ uid: d.user_id, id: d.id_token, refresh: d.refresh_token, exp: now() + Number(d.expires_in || 3600) * 1000 });
      });
    }
    // Resolves to a valid session, or null when sign-in is not configured. Never runs twice at once.
    function ensureAuth(force) {
      if (!authOn) return Promise.resolve(null);
      if (!force && session && session.id && session.exp - now() > 60000) return Promise.resolve(session);
      if (authPromise) return authPromise;
      var p = (session && session.refresh ? refreshToken().catch(function () { return signUp(); }) : signUp());
      authPromise = p.then(function (s) { authPromise = null; return s; }, function (e) { authPromise = null; throw e; });
      return authPromise;
    }

    /* ---------- REST helpers ---------- */
    function url(path, query) { return base + '/' + path.replace(/^\/+/, '') + '.json' + (query ? '?' + query : ''); }
    function call(method, path, body, query, keepalive, retried) {
      if (!enabled) return Promise.reject(new Error('backend not configured'));
      return ensureAuth(false).then(function (sess) {
        var q = (sess ? 'auth=' + encodeURIComponent(sess.id) : '') + (sess && query ? '&' : '') + (query || '');
        var init = { method: method, keepalive: !!keepalive };
        if (body !== undefined) { init.body = JSON.stringify(body); init.headers = { 'Content-Type': 'application/json' }; }
        return fetchFn(url(path, q), init).then(function (res) {
          // A token the server no longer accepts: get a fresh one and try once more.
          if (res.status === 401 && sess && !retried) return ensureAuth(true).then(function () { return call(method, path, body, query, keepalive, true); });
          if (!res.ok) throw httpError(res, method + ' ' + path);
          return res.json();
        });
      });
    }
    var get = function (p, q) { return call('GET', p, undefined, q); };

    function increment(path, by, keepalive) {
      return call('PUT', path, { '.sv': { increment: by } }, undefined, keepalive);
    }

    /* ---------- device id (anonymous, random, stays on this device) ---------- */
    function deviceId() {
      var id = storage.getItem('noor_device');
      if (!id) {
        var a = new Uint8Array(12);
        (deps.crypto || { getRandomValues: function (x) { for (var i = 0; i < x.length; i++) x[i] = Math.floor(Math.random() * 256); return x; } }).getRandomValues(a);
        id = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
        storage.setItem('noor_device', id);
      }
      return id;
    }

    /* ---------- polling ---------- */
    // Calls fn(value) now and then every `ms`, only while the page is visible. Returns stop().
    function poll(fn, ms) {
      var stopped = false, timer = null;
      function tick() {
        if (stopped) return;
        var p = visible() ? Promise.resolve().then(fn).catch(function () {}) : Promise.resolve();
        p.then(function () { if (!stopped) timer = setTimeout(tick, ms); });
      }
      tick();
      return function () { stopped = true; clearTimeout(timer); };
    }

    /* ---------- collective counter ---------- */
    var COLLECTIVE = 'collective/current';
    function getCollective() { return get(COLLECTIVE); }   // {title, arabic, target, endsOn, count} or null

    // Batches taps into few writes, survives closing the tab, never double counts.
    function createTally(opts) {
      opts = opts || {};
      var pKey = 'noor_tally_pending', mKey = 'noor_tally_mine';
      var pending = Number(storage.getItem(pKey)) || 0, mine = Number(storage.getItem(mKey)) || 0;
      var inflight = 0, server = null, failures = 0, lastStatus = 0, timer = null, firstTapAt = 0, listeners = [];
      var debounce = opts.debounceMs == null ? 1500 : opts.debounceMs, maxWait = opts.maxWaitMs == null ? 5000 : opts.maxWaitMs;
      var retryBase = opts.retryBaseMs || 2000;

      function view() { return { server: server, pending: pending, inflight: inflight, mine: mine, total: server == null ? null : server + pending + inflight, failing: failures > 0, status: lastStatus }; }
      function emit() { var v = view(); listeners.forEach(function (fn) { fn(v); }); }
      function persist() { storage.setItem(pKey, pending); storage.setItem(mKey, mine); }
      function schedule(ms) { clearTimeout(timer); timer = setTimeout(flush, ms); }

      function flush(keepalive) {
        clearTimeout(timer);
        if (inflight || pending <= 0) return Promise.resolve();
        var chunk = Math.min(pending, MAX_STEP);
        pending -= chunk; inflight = chunk; firstTapAt = 0; persist(); emit();
        return increment(COLLECTIVE + '/count', chunk, keepalive === true).then(function () {
          server = (server || 0) + chunk; inflight = 0; failures = 0; lastStatus = 0; persist(); emit();
          if (pending > 0) return flush();
        }, function (err) {
          pending += chunk; inflight = 0; failures++; lastStatus = (err && err.status) || 0; persist(); emit();
          schedule(Math.min(60000, retryBase * Math.pow(2, failures - 1)));   // 2s, 4s, 8s … 60s
        });
      }

      return {
        add: function (n) {
          n = Math.floor(n); if (!(n > 0)) return;
          pending += n; mine += n; persist();
          if (!firstTapAt) firstTapAt = now();
          emit();
          schedule(Math.max(0, Math.min(debounce, firstTapAt + maxWait - now())));
        },
        flush: flush,
        // Take the latest server value, unless a write is in flight (it would be counted twice).
        setServer: function (v) { if (typeof v === 'number' && !inflight) { server = v; emit(); } },
        resume: function () { if (pending > 0) schedule(0); },
        onChange: function (fn) { listeners.push(fn); fn(view()); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; },
        view: view
      };
    }

    /* ---------- halqa: RSVP and announcements ---------- */
    function rsvpPath(week, id) { return 'halqa/' + week + '/rsvps' + (id ? '/' + id : ''); }
    // With sign-in on, the RSVP key is the person's account id (the rules require it); otherwise a random device id.
    function whoAmI() { return ensureAuth(false).then(function (sess) { return sess ? sess.uid : deviceId(); }); }
    var rsvp = {
      mine: function (week) { return whoAmI().then(function (id) { return get(rsvpPath(week, id)); }).then(function (v) { return v && v.m || null; }); },
      set: function (week, mode) { return whoAmI().then(function (id) { return call('PUT', rsvpPath(week, id), { m: mode, t: { '.sv': 'timestamp' } }); }); },
      clear: function (week) { return whoAmI().then(function (id) { return call('DELETE', rsvpPath(week, id)); }); },
      count: function (week) { return get(rsvpPath(week), 'shallow=true').then(function (v) { return v ? Object.keys(v).length : 0; }); }
    };
    function notice() { return get('halqa/current/notice').then(function (v) { return typeof v === 'string' ? v : ''; }); }

    /* ---------- YouTube uploads ---------- */
    function loadYouTube(force) {
      var key = cfg.youtubeApiKey, ch = cfg.youtubeChannelId, pl = ch && core.uploadsPlaylistId(ch);
      if (!key || !pl) return Promise.resolve({ items: [], source: 'unconfigured' });
      var cached = null;
      try { cached = JSON.parse(storage.getItem('noor_feed_v1') || 'null'); } catch (e) {}
      if (!force && cached && now() - cached.t < FEED_TTL) return Promise.resolve({ items: cached.items, source: 'cache' });
      var u = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=40&playlistId=' + encodeURIComponent(pl) + '&key=' + encodeURIComponent(key);
      return fetchFn(u).then(function (res) {
        if (!res.ok) throw httpError(res, 'YouTube');
        return res.json();
      }).then(function (data) {
        var items = (data.items || []).map(function (it) {
          var s = it.snippet || {};
          return { id: s.resourceId && s.resourceId.videoId, title: s.title, description: s.description || '', publishedAt: s.publishedAt };
        }).filter(function (v) { return v.id && v.title && v.title !== 'Private video' && v.title !== 'Deleted video'; });
        storage.setItem('noor_feed_v1', JSON.stringify({ t: now(), items: items }));
        return { items: items, source: 'network' };
      }).catch(function (err) {
        return cached ? { items: cached.items, source: 'stale', error: err } : { items: [], source: 'error', error: err };
      });
    }

    return {
      enabled: enabled, authEnabled: authOn, youtubeEnabled: !!(cfg.youtubeApiKey && cfg.youtubeChannelId),
      deviceId: deviceId, poll: poll, getCollective: getCollective, createTally: createTally,
      rsvp: rsvp, notice: notice, loadYouTube: loadYouTube, MAX_STEP: MAX_STEP
    };
  }

  return { create: create };
});
