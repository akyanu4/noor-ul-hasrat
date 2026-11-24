// Record the real app (served from the repo by `python3 -m http.server 8765`) for the app-guide videos.
//   node record.js A|B            -> work/rec_<A|B>/frames/*.jpg + work/rec_<A|B>/timeline.json
// The phone (390x844 CSS px at deviceScaleFactor 2) is captured with the Chrome DevTools screencast (every repaint,
// JPEG q92). The narration is cut into segments (storyboard.js); before each segment an unrecorded setup step may
// navigate or reload, then the segment's actions play against the narration clock. compose.py maps audio time t in a
// segment to the frame shown at wall time (segment start + t - segment audio start), so set-up never shows and the
// on-screen actions line up with the words.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const M = require('./mocks.js');
const SB = (process.argv[2]||'').toUpperCase()==='UR' ? require('./storyboard_ur.js') : require('./storyboard.js');

const SEC = (process.argv[2] || 'A').toUpperCase();
const BASE = process.env.NOOR_BASE || 'http://localhost:8765';
const HERE = __dirname, OUT = path.join(HERE, 'work', 'rec_' + SEC), FR = path.join(OUT, 'frames');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true });
const times = JSON.parse(fs.readFileSync(path.join(HERE, 'work', `times_${SEC}.json`)));
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Visible taps: a soft finger dot and ripple, drawn in the page so the screencast captures it. Smooth scrolling helper.
const OVERLAY = () => {
  const css = `
    ::-webkit-scrollbar{display:none!important} *{scrollbar-width:none!important}
    .__tap{position:fixed;z-index:2147483647;pointer-events:none;border-radius:50%;transform:translate(-50%,-50%)}
    .__dot{width:34px;height:34px;background:rgba(255,255,255,.55);box-shadow:0 0 0 2px rgba(201,162,75,.9),0 3px 12px rgba(0,0,0,.35);animation:__d .75s ease-out forwards}
    .__rip{width:20px;height:20px;border:3px solid rgba(201,162,75,.95);background:rgba(201,162,75,.18);animation:__r .7s ease-out forwards}
    .__ring{border:3px solid rgba(201,162,75,.95);border-radius:14px;box-shadow:0 0 0 6px rgba(201,162,75,.22);transform:none;animation:__g 1.6s ease-in-out forwards}
    @keyframes __d{0%{opacity:0;transform:translate(-50%,-50%) scale(1.25)}18%{opacity:1;transform:translate(-50%,-50%) scale(.92)}65%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(.9)}}
    @keyframes __r{0%{opacity:0;width:20px;height:20px}15%{opacity:1}100%{opacity:0;width:96px;height:96px}}
    @keyframes __g{0%{opacity:0}20%{opacity:1}75%{opacity:1}100%{opacity:0}}`;
  const add = () => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); };
  if (document.head) add(); else document.addEventListener('DOMContentLoaded', add);
  window.__tap = (x, y) => {
    const d = document.createElement('div'); d.className = '__tap __dot'; d.style.left = x + 'px'; d.style.top = y + 'px';
    const r = document.createElement('div'); r.className = '__tap __rip'; r.style.left = x + 'px'; r.style.top = y + 'px';
    document.body.appendChild(d); setTimeout(() => document.body.appendChild(r), 120);
    setTimeout(() => { d.remove(); r.remove(); }, 1000);
  };
  window.__ring = (x, y, w, h) => {   // a gold outline that fades in and out around something being talked about
    const d = document.createElement('div'); d.className = '__tap __ring';
    Object.assign(d.style, { left: (x - 4) + 'px', top: (y - 4) + 'px', width: (w + 8) + 'px', height: (h + 8) + 'px' });
    document.body.appendChild(d); setTimeout(() => d.remove(), 1700);
  };
  window.__scroll = (el, prop, to, ms) => new Promise(res => {
    const from = el[prop], t0 = performance.now(), d = to - from;
    if (Math.abs(d) < 1) return res();
    const step = () => { const f = Math.min(1, (performance.now() - t0) / ms), e = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      el[prop] = from + d * e; if (f < 1) requestAnimationFrame(step); else res(); };
    requestAnimationFrame(step);
  });
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: false, serviceWorkers: 'block',
    timezoneId: 'Asia/Kolkata', locale: 'en-IN', geolocation: { latitude: 17.385, longitude: 78.4867 }, permissions: ['geolocation'],
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36' });
  // Saturday evening, 10 minutes before the weekly halqa (8:30 PM India time), so Home shows "Tonight · Join online".
  await ctx.clock.install({ time: new Date('2026-11-14T20:18:00+05:30') });
  // Version 3: a Collective dhikr campaign in the (in-memory) database. Illustrative figures, not the live count.
  // Recitation audio: a silent stand-in, 3.2 s in the Short and 6 s in the walkthrough, so the pages visibly turn with it.
  const mock = await M.install(ctx, { reciteSecs: SEC === 'A' ? 3.2 : 6,
    seed: { library_ok: Object.fromEntries(JSON.parse(fs.readFileSync(path.join(HERE,'../../../../data/library/index.json'))).map(a=>[a.slug,{by:'teacher',name:'Teacher',at:Date.now()}])), 'collective/current': { title: 'Collective dhikr', arabic: 'سُبْحَانَ اللّٰه', target: 100000, endsOn: '', count: 41286 } } });
  await ctx.addInitScript(OVERLAY);
  await ctx.addInitScript(() => { localStorage.setItem('noor_apk_dismissed', String(Date.now())); });   // the "Get the Android app" banner was closed before
  await ctx.addInitScript(() => {   // a returning reader: three Shorts of Haqeeqat-e-Bai'at already watched
    if (!localStorage.getItem('noor_shorts_watched_v1')) { const t = Date.now(); localStorage.setItem('noor_shorts_watched_v1', JSON.stringify({ VlU4EcJGVgQ: t - 3e5, r3x7LQru71I: t - 2e5, ObW6ccXEwn4: t - 1e5 })); }
  });
  await ctx.addInitScript(() => {   // a returning Qur'an reader: last at page 786 (Al-Mulk), read 6 days running, one bookmark
    if (localStorage.getItem('noor_quran')) return;
    const read = {}, t = Date.now(); for (let p = 1; p <= 60; p++) read[p] = t - 9e8; for (let p = 770; p <= 785; p++) read[p] = t - 3e8;
    const days = {}, n = [3, 2, 4, 2, 3, 1]; n.forEach((c, i) => { const d = new Date(t - (5 - i) * 864e5 + 5.5 * 36e5); days[d.toISOString().slice(0, 10)] = c; });
    localStorage.setItem('noor_quran', JSON.stringify({ last: 786, read, days, goal: 2, marks: [407], khatam: 0, ver: 1 }));
    localStorage.setItem('noor_reciter', 'afasy'); localStorage.setItem('noor_follow', '1');
  });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e)));

  // ---- screencast
  const cdp = await ctx.newCDPSession(page);
  const frames = []; let n = 0;
  cdp.on('Page.screencastFrame', async f => {
    const file = String(n++).padStart(6, '0') + '.jpg';
    fs.writeFileSync(path.join(FR, file), Buffer.from(f.data, 'base64'));
    frames.push([file, f.metadata.timestamp]);
    try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch (e) {}
  });
  const startCast = () => cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });

  // ---- helpers for the storyboard
  let seg = null;                                  // {a, wall}
  const h = {
    page, BASE, sleep,
    now: () => Date.now() / 1000,
    // wait until narration time t (seconds) inside the current segment
    at: async t => { const w = seg.wall + (t - seg.a) - Date.now() / 1000; if (w > 0) await sleep(w * 1000); else if (w < -0.25) console.warn(`  late by ${(-w).toFixed(2)}s for t=${t}`); },
    loc: s => typeof s === 'string' ? page.locator(s).first() : s,
    box: async s => { const b = await h.loc(s).boundingBox(); if (!b) throw new Error('no box for ' + s); return b; },
    scroller: async () => page.evaluateHandle(() => { const a = document.querySelector('.screen.active'); const s = document.querySelector('.screens'); return s && a ? s : document.scrollingElement; }),
    // smooth-scroll the app so that the element sits `off` px below the top bar (or to an absolute y)
    scrollTo: async (s, { off = 90, ms = 900 } = {}) => {
      const sc = await h.scroller();
      if (typeof s === 'number') return page.evaluate(([el, y, ms]) => window.__scroll(el, 'scrollTop', y, ms), [sc, s, ms]);
      const el = await h.loc(s).elementHandle();
      await page.evaluate(([sc, el, off, ms]) => { const r = el.getBoundingClientRect(), top = sc === document.scrollingElement ? 0 : sc.getBoundingClientRect().top;
        const y = Math.max(0, Math.min(sc.scrollHeight - sc.clientHeight, sc.scrollTop + r.top - top - off)); return window.__scroll(sc, 'scrollTop', y, ms); }, [sc, el, off, ms]);
    },
    scrollBy: async (dy, ms = 900) => { const sc = await h.scroller(); await page.evaluate(([el, dy, ms]) => window.__scroll(el, 'scrollTop', el.scrollTop + dy, ms), [sc, dy, ms]); },
    hscroll: async (s, dx, ms = 900) => { const el = await h.loc(s).elementHandle(); await page.evaluate(([el, dx, ms]) => window.__scroll(el, 'scrollLeft', el.scrollLeft + dx, ms), [el, dx, ms]); },
    // make sure an element is fully visible (scrolling smoothly if needed)
    reveal: async (s, opt = {}) => { const b = await h.box(s); if (b.y < 70 || b.y + b.height > 844 - 80) await h.scrollTo(s, opt); },
    tap: async (s, { click = true, pre = 280, post = 350, reveal = true, dx = 0.5, dy = 0.5 } = {}) => {
      if (reveal) await h.reveal(s, { off: 160 });
      const b = await h.box(s), x = b.x + b.width * dx, y = b.y + b.height * dy;
      await page.evaluate(([x, y]) => window.__tap(x, y), [x, y]); await sleep(pre);
      if (click) await page.mouse.click(x, y);
      await sleep(post);
    },
    ring: async (s, ms = 0) => { const b = await h.box(s); await page.evaluate(b => window.__ring(b.x, b.y, b.width, b.height), b); if (ms) await sleep(ms); },
    type: async (s, text, delay = 55) => { await h.loc(s).pressSequentially(text, { delay }); },
    route: async target => { await page.evaluate(t => { if (['home', 'practice', 'books', 'more'].includes(t)) { Noor.setNav(t); Noor.showScreen(t); } else Noor.route(t); }, target); await sleep(250); },
    settle: ms => sleep(ms || 500),
    goto: async url => { await page.goto(url.startsWith('http') ? url : BASE + '/' + url); await startCast(); await sleep(1500); },
    signIn: async () => {   // the member opened the emailed sign-in link: a session with a finished profile
      await page.evaluate(() => {
        localStorage.setItem('noor_auth', JSON.stringify({ uid: 'demo-uid', id: 'demo-id', refresh: 'demo-refresh', exp: Date.now() + 864e5, em: 'reader@example.com' }));
        localStorage.setItem('noor_profile', JSON.stringify({ name: 'Abdullah', consent: true, city: 'Hyderabad', updated: Date.now() }));
        localStorage.removeItem('noor_bayah_want'); localStorage.removeItem('noor_signup');
      });
      await page.reload(); await startCast(); await sleep(2500);
    },
    signOut: async () => {   // a visitor without an account (nothing is sent: the session is only removed from this browser)
      await page.evaluate(() => { localStorage.removeItem('noor_auth'); localStorage.removeItem('noor_profile'); localStorage.removeItem('noor_bayah_want'); localStorage.removeItem('noor_signup');
        localStorage.removeItem('noor_signin_sent'); localStorage.removeItem('noor_last_email'); });   // never had an account on this phone
      await page.reload(); await startCast(); await sleep(2500);
    }
  };

  await page.goto(BASE + '/index.html');
  await page.waitForSelector('#homeShorts:not([hidden]) .sh-sotd', { timeout: 20000 });
  await startCast(); await sleep(1500);

  const story = SB[SEC];
  const D = times[times.length - 1][1] + 0.5;
  const marks = [];
  for (let i = 0; i < story.length; i++) {
    const s = story[i], a = s.a, b = i + 1 < story.length ? story[i + 1].a : D + 1;
    console.log(`segment ${i} @${a.toFixed(2)}s ${s.name || ''}`);
    if (s.setup) await s.setup(h);
    await sleep(600);                              // let the screen settle so the last frame is the set-up state
    seg = { a, wall: Date.now() / 1000 }; marks.push({ a, b, wall: seg.wall, name: s.name || '' });
    if (s.run) await s.run(h);
    const left = seg.wall + (b - a) - Date.now() / 1000;
    if (left > 0) await sleep(left * 1000); else console.warn(`  segment ${i} overran by ${(-left).toFixed(2)}s`);
  }
  await sleep(300);
  await cdp.send('Page.stopScreencast').catch(() => {});
  await sleep(300);
  fs.writeFileSync(path.join(OUT, 'timeline.json'), JSON.stringify({ section: SEC, duration: D, segments: marks, frames }, null, 0));
  console.log(`${frames.length} frames, ${marks.length} segments -> ${OUT}`);
  if (errors.length) console.log('page errors:', errors);
  console.log(`writes answered by the mocks (none reached a real server): ${mock.writes.length}`, mock.writes.slice(0, 40));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
