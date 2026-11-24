// Exploration helper: screenshots of the live app (local copy) states, with the recorder's mocks. node explore.js
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'); const M = require('./mocks.js');
const BASE = 'http://localhost:8765', OUT = path.join(__dirname, 'work', 'explore'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const slugs = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../data/library/index.json'))).map(a => a.slug);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, serviceWorkers: 'block', timezoneId: 'Asia/Kolkata', locale: 'en-IN',
    geolocation: { latitude: 17.385, longitude: 78.4867 }, permissions: ['geolocation'] });
  await ctx.clock.install({ time: new Date('2026-11-14T20:18:00+05:30') });
  const ok = {}; slugs.forEach(s => ok[s] = { by: 'teacher', name: 'Teacher', at: Date.now() });
  const mock = await M.install(ctx, { reciteSecs: 6, seed: { 'collective/current': { title: 'Collective dhikr', arabic: 'سُبْحَانَ اللّٰه', target: 100000, endsOn: '', count: 41286 }, library_ok: ok } });
  await ctx.addInitScript(() => { localStorage.setItem('noor_apk_dismissed', String(Date.now())); });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 140)); });
  await page.goto(BASE + '/index.html'); await sleep(4000);
  const shot = async n => { await page.screenshot({ path: path.join(OUT, n + '.png') }); };
  await shot('01_home_top');
  const info = await page.evaluate(() => ({ screens: [...document.querySelectorAll('.screen')].map(s => s.id), home: [...document.querySelectorAll('#screen-home > *')].map(e => (e.id || e.className).toString().slice(0, 40)), nav: [...document.querySelectorAll('.navitem')].map(n => n.dataset.tab) }));
  console.log(JSON.stringify(info));
  for (const [name, fn] of [
    ['02_library', () => Noor.route('library')], ['03_course', () => Noor.route('course')], ['04_welcome', () => NoorJourney && NoorJourney.open()], ['05_rewards', () => Noor.route('rewards')], ['06_bayah', () => Noor.route('bayah')],
    ['07_halqa', () => Noor.route('halqa')], ['08_more', () => Noor.route('more')], ['09_tasbeeh', () => Noor.route('tasbeeh')], ['10_quran', () => { Noor.setNav('quran'); Noor.showScreen('quran'); }], ['11_duas', () => Noor.route('duas')],
  ]) { try { await page.evaluate(fn); await sleep(2200); await shot(name); } catch (e) { console.log(name, 'ERR', e.message.split('\n')[0]); } }
  console.log('errors:', errs.slice(0, 8)); await browser.close();
})();
