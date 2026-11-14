// What the phone shows for each narration line (version 2 narration: voice_*_v2_daro.wav, script.md A2/B2). Times are
// narration seconds (work/times_<A|B>.json from align.py, plus the shorter pauses inside lines found with
// silencedetect noise=-36dB d=0.15; the words those pauses separate are noted beside the actions). Each segment: a = narration time it starts,
// setup = unrecorded preparation (a cut), run = visible actions, timed with h.at(t).
const fs = require('fs'), path = require('path');
const T = s => JSON.parse(fs.readFileSync(path.join(__dirname, 'work', `times_${s}.json`)));
const tA = T('A'), tB = T('B');
const S = (t, i) => t[i - 1][0], E = (t, i) => t[i - 1][1];      // start / end of script line i (1-based)
const after = (t, i) => E(t, i) + 0.05;                          // a cut placed in the pause after line i

const home = async h => { await h.route('home'); await h.scrollTo(0, { ms: 1 }); };
const closeViewer = async h => { await h.page.evaluate(() => { const x = document.querySelector('.fv:not([hidden]) .fv-x'); if (x) x.click(); }); await h.sleep(200); };
const shortsPage = async h => { await closeViewer(h); await h.page.evaluate(() => NoorFamily.open('azam')); await h.sleep(900); await h.scrollTo(0, { ms: 1 }); };
const tile = (h, label) => h.page.locator('#moreSections .ftile', { hasText: label }).first();
const text = (h, sel, t) => h.page.locator(sel, { hasText: t }).first();

const A = [
  { name: 'A1 Bismillah: Home', a: 0, setup: home,
    run: async h => { await h.at(0.5); await h.ring('.ev-feat'); } },
  { name: 'A2 Noor-ul-Hasrat app, your spiritual companion', a: after(tA, 1),
    run: async h => { await h.at(2.75); await h.scrollTo('#quickGrid', { off: 330, ms: 1300 }); await h.at(4.3); await h.ring('.bay-home'); } },
  { name: 'A3 Prayer Times | Qibla finder | Islamic Calendar', a: after(tA, 2),
    run: async h => {   // pauses after "Prayer Times hain" 8.71 and "Qibla finder hai" 10.01
      await h.at(6.15); await h.tap('.prayer-card', { pre: 220, post: 300 }); await h.at(8.6); await h.tap('.screen.active .backbtn', { pre: 150, post: 200 });
      await h.tap(text(h, '#quickGrid .qcard', 'Qibla'), { pre: 200, post: 250 });
      await h.at(10.0); await h.tap('.screen.active .backbtn', { pre: 150, post: 200 }); await h.tap(text(h, '#quickGrid .qcard', 'Calendar'), { pre: 200, post: 250 });
    } },
  { name: 'A4 dars & Shorts | a new Short of the Day', a: after(tA, 3),
    run: async h => {   // pause 15.43-15.80 before "har roz ek naya Short of the Day"
      await h.tap('.screen.active .backbtn', { pre: 150, post: 200 });
      await h.scrollTo('#homeShorts', { off: 75, ms: 1300 });
      await h.at(15.85); await h.ring('.sh-sotd');
      await h.at(16.8); await h.tap('.sh-sotd .sh-go', { pre: 220, post: 250 });
    } },
  { name: 'A5 Series in order | watched ones get a tick', a: after(tA, 4),
    setup: async h => { await shortsPage(h); await h.scrollTo(text(h, '#fmBody .sh-h', 'Series'), { off: 80, ms: 1 }); },
    run: async h => {   // pause 19.65-19.85 before "jo dekh liya us par tick"
      await h.at(18.15); await h.ring(text(h, '#fmBody .sh-ser', 'Haqeeqat'));
      await h.at(18.8); await h.tap(text(h, '#fmBody .sh-ser', 'Haqeeqat'), { pre: 200, post: 250 });
      await h.at(19.95); await h.ring('.sh-row.done >> nth=0'); await h.at(20.5); await h.ring('.sh-row.done >> nth=1'); await h.at(21.05); await h.ring('.sh-row.done >> nth=2');
    } },
  { name: 'A6 Mystic Meditations, with pictures', a: after(tA, 5),
    run: async h => {
      await h.tap('.navitem[data-tab="practice"]', { pre: 200, post: 250 });
      await h.tap(text(h, '#worshipList .rowitem', 'Mystic Meditations'), { pre: 220, post: 250 });
      await h.scrollTo('.md-il[data-topic="run-from-it"]', { off: 330, ms: 700 });
      await h.at(24.75); await h.tap('.md-il[data-topic="run-from-it"]', { pre: 200, post: 250 });
      await h.scrollTo('.md-pic', { off: 70, ms: 700 });
    } },
  { name: 'A7 after Bai’at, under the Shaykh’s guidance', a: after(tA, 6),
    run: async h => { await h.scrollTo(0, { ms: 600 }); await h.at(27.6); await h.ring('.md-bay'); await h.at(29.0); await h.ring('.md-bay'); } },
  { name: 'A8 Bai’at request from the app', a: after(tA, 7),
    setup: async h => { await h.signIn(); await h.route('bayah'); await h.sleep(600); await h.scrollTo('#byReq', { off: 70, ms: 1 }); },
    run: async h => {
      await h.at(31.1); await h.tap('#byWith', { click: false, pre: 200, post: 150 }); await h.page.selectOption('#byWith', { index: 1 });
      await h.at(31.9); await h.tap('#byPhone', { pre: 200, post: 120 }); await h.type('#byPhone', '+91 98765 43210', 40);
      await h.at(33.4); await h.tap('.by-send', { post: 500 }); await h.scrollTo('#byReq', { off: 70, ms: 400 });
      await h.at(34.6); await h.ring('#byReq');
    } },
  { name: 'A9 Saturday halqa, join online', a: after(tA, 8),
    setup: home,
    run: async h => { await h.at(36.3); await h.ring('.ev-feat'); await h.at(37.0); await h.tap(text(h, '#quickGrid .qcard', 'Halqa'), { pre: 220, post: 300 }); await h.at(38.0); await h.ring('#joinNow'); } },
  { name: 'A9b and Iman Health', a: 39.1,   // "aur Iman Health se apna haal dekhiye" (no pause: by length)
    setup: async h => { await h.route('iman'); },
    run: async h => {
      await h.at(39.3); await h.tap('#screen-iman .ih-chip >> nth=0', { pre: 200, post: 200 }); await h.tap('#screen-iman .ih-chip >> nth=3', { pre: 200, post: 200 });
      await h.tap('#screen-iman .ih-chip >> nth=7', { pre: 200, post: 200 }); await h.scrollTo(0, { ms: 600 });
    } },
  { name: 'A10 completely free', a: after(tA, 9),
    setup: async h => { await h.goto('install.html'); },
    run: async h => { await h.at(42.15); await h.ring('h1'); await h.at(42.9); await h.tap(h.page.getByText('Download the Android app').first(), { click: false }); } },
  { name: 'A11 light up the heart: Tasbeeh', a: after(tA, 10),
    setup: async h => { await h.goto('index.html'); await h.route('tasbeeh'); },
    run: async h => { for (let i = 0; i < 5; i++) await h.tap('#ring', { pre: 150, post: 250 }); } },
];

const B = [
  { name: 'B1 assalamu alaikum, welcome | let us see', a: 0, setup: home,
    run: async h => { await h.at(1.4); await h.ring('.topbar .brand'); await h.at(3.75); await h.scrollBy(420, 700); await h.at(4.6); await h.scrollTo(0, { ms: 500 }); } },
  { name: 'B2 install: the address | Download app | Add to Home screen', a: after(tB, 1),
    setup: async h => { await h.goto('install.html'); },
    run: async h => {   // pauses after "browser mein" 7.80, after the address 10.40
      await h.at(6.0); await h.ring(h.page.getByText('Prayer times, Qur').first());
      await h.at(8.1); await h.ring('h1');
      await h.at(11.0); await h.tap(h.page.getByText('Download the Android app').first(), { click: false }); await h.ring(h.page.getByText('Download the Android app').first());
      await h.at(13.0); await h.scrollTo(h.page.getByText('Or add it from Chrome').first(), { off: 60, ms: 900 }); await h.ring(text(h, 'li', 'Install app'));
    } },
  { name: 'B3 Home: next mehfil or halqa | Join online', a: after(tB, 2),
    setup: async h => { await h.goto('index.html'); await home(h); },
    run: async h => { await h.at(16.0); await h.ring('.ev-feat'); await h.at(17.6); await h.ring('.ev-feat'); await h.at(19.1); await h.tap('.ev-act', { click: false }); await h.ring('.ev-act'); } },
  { name: 'B4 Short of the Day | Start here | chosen Shorts in order', a: after(tB, 3),
    run: async h => {   // pauses after "Short of the Day" 22.11 and "Start here" 23.42
      await h.scrollTo('#homeShorts', { off: 75, ms: 700 }); await h.at(21.9); await h.ring('.sh-sotd');
      await h.at(22.4); await h.scrollTo(text(h, '#homeHub .sh-h', 'Start here'), { off: 120, ms: 800 });
      await h.ring(text(h, '#homeHub .sh-h', 'Start here')); await h.at(23.8); await h.hscroll('#homeHub .fm-hs >> nth=0', 560, 1500);
    } },
  { name: 'B5 Series parts in order | Next', a: after(tB, 4),
    setup: async h => { await h.scrollTo('.sh-cont', { off: 200, ms: 1 }); },
    run: async h => {   // pause 30.58 before "Short khatam ho to Next dabaein"
      await h.at(26.5); await h.ring('.sh-cont'); await h.at(27.6); await h.tap('.sh-cont');
      await h.at(29.0); await h.ring('.fv-t');
      await h.at(30.9); await h.ring('.fv-next'); await h.at(31.7); await h.tap('.fv-next', { reveal: false });
    } },
  { name: 'B6 Topics: Tawbah, Khatrat, Tasawwur, Sabr | one tap', a: after(tB, 5),
    setup: shortsPage,
    run: async h => {   // pauses after each topic word: 33.91, 35.28, 36.05, 36.84
      await h.at(32.9); await h.ring('#fmBody .fm-chips');
      await h.at(33.5); await h.tap('#fmBody [data-st="tawbah"]', { pre: 200, post: 200 });
      await h.at(34.6); await h.tap('#fmBody [data-st="khatrat"]', { pre: 200, post: 200 });
      await h.at(35.55); await h.tap('#fmBody [data-st="tasawwur"]', { pre: 200, post: 200 });
      await h.at(36.35); await h.tap('#fmBody [data-st="sabr"]', { pre: 200, post: 200 });
      await h.at(37.2); await h.scrollTo('#fmBody .fm-grid', { off: 140, ms: 800 });
    } },
  { name: 'B7 WhatsApp', a: after(tB, 6),
    run: async h => { await h.at(39.1); await h.ring('#fmBody .fm-grid .fm-wa >> nth=0'); await h.at(39.7); await h.tap('#fmBody .fm-grid .fm-wa >> nth=0', { click: false, pre: 200, post: 200 }); await h.ring('#fmBody .fm-grid .fm-wa >> nth=1'); } },
  { name: 'B8 Practices: Mystic Meditations | open a topic | picture, method, Short', a: after(tB, 7),
    run: async h => {   // pauses after "Mystic Meditations hain" 43.79, "topic kholein" 44.79
      await h.at(41.0); await h.tap('.navitem[data-tab="practice"]', { pre: 220, post: 300 });
      await h.at(42.6); await h.tap(text(h, '#worshipList .rowitem', 'Mystic Meditations'), { pre: 220, post: 250 });
      await h.at(43.4); await h.scrollTo('.md-il[data-topic="run-from-it"]', { off: 330, ms: 700 });
      await h.at(44.2); await h.tap('.md-il[data-topic="run-from-it"]', { pre: 200, post: 250 });
      await h.at(45.0); await h.scrollTo('.md-pic', { off: 70, ms: 700 });
      await h.at(45.9); await h.scrollTo(text(h, '#screen-meditations *', 'How Hazrat taught it').last(), { off: 120, ms: 700 });
      await h.at(47.0); await h.scrollTo('#screen-meditations .fm-grid', { off: 100, ms: 600 });
    } },
  { name: 'B9 after Bai’at only', a: after(tB, 8),
    run: async h => { await h.scrollTo(0, { ms: 700 }); await h.at(49.2); await h.ring('.md-bay'); await h.at(51.0); await h.ring('.md-bay'); await h.at(52.4); await h.ring('.md-tobay'); } },
  { name: 'B10 for Bai’at | More > Bai’at | the steps', a: after(tB, 9),
    run: async h => {   // pauses after "Bai'at ke liye" 54.97, "Bai'at kholein" 56.20
      await h.at(54.0); await h.tap('#menuBtn', { pre: 220, post: 250 });
      await h.scrollTo(tile(h, "Bay'ah"), { off: 330, ms: 600 }); await h.at(55.5); await h.tap(tile(h, "Bay'ah"), { pre: 220, post: 250 });
      await h.at(56.65); await h.scrollTo('.by-step', { off: 70, ms: 700 }); await h.at(57.4); await h.scrollBy(500, 600);
    } },
  { name: 'B11 Request to take Bai’at | free account | email only, no password', a: after(tB, 10),
    setup: async h => { await h.scrollTo(0, { ms: 1 }); },
    run: async h => {   // pauses after "dabaein" 61.01, "banaein" 61.99, "sirf email" 62.93, "password nahin" 63.35, "link kholein" 64.90
      await h.at(58.7); await h.ring('#byReq'); await h.at(60.2); await h.tap('.by-signup', { pre: 220, post: 300 });
      await h.at(61.1); await h.tap('#acEmail', { pre: 200, post: 100 }); await h.type('#acEmail', 'reader@example.com', 28);
      await h.tap('#acName', { pre: 150, post: 80 }); await h.type('#acName', 'Abdullah', 35);
      await h.tap('#acConsent', { pre: 150, post: 120 }); await h.tap('#acSend', { pre: 180, post: 500 });
      await h.at(63.7); await h.ring('#acBody .ac-hero');
    } },
  { name: 'B11b signed in: choose Shaykh or Khalifa | mobile number | send', a: 65.02,
    setup: async h => { await h.signIn(); await h.route('bayah'); await h.sleep(600); await h.scrollTo('#byReq', { off: 70, ms: 1 }); },
    run: async h => {   // pause 67.56 before "aur request send kar dein"
      await h.at(65.2); await h.tap('#byWith', { click: false, pre: 200, post: 150 }); await h.page.selectOption('#byWith', { index: 1 });
      await h.at(65.8); await h.ring('#byWith');
      await h.at(66.3); await h.tap('#byPhone', { pre: 200, post: 100 }); await h.type('#byPhone', '+91 98765 43210', 38);
      await h.at(67.75); await h.tap('.by-send', { pre: 220, post: 450 }); await h.scrollTo('#byReq', { off: 70, ms: 400 }); await h.at(68.6); await h.ring('#byReq');
    } },
  { name: 'B12 My Account: tick if you took Bai’at', a: after(tB, 11),
    run: async h => {
      await h.at(68.85); await h.tap('#accBtn', { pre: 200, post: 250 });   // the sheet and its scroll take ~2 s
      await h.tap('#acBay', { pre: 200, post: 200 });
      await h.tap('#acBaySel', { click: false, pre: 180, post: 100 }); await h.page.selectOption('#acBaySel', { index: 1 });
      await h.tap('#acBaySave', { pre: 200, post: 300 }); await h.ring('#acBayah');
    } },
  { name: 'B12b after approval: members’ videos open', a: 72.8,   // "approval ke baad members ke videos" (no pause: by length)
    setup: async h => { await shortsPage(h); await h.scrollTo(text(h, '#fmBody .sh-h', 'For murids'), { off: 80, ms: 1 }); },
    run: async h => {
      await h.at(72.85); await h.ring(text(h, '#fmBody .sh-h', 'For murids'));
      const row = h.page.locator('#fmBody .sh-h', { hasText: 'For murids' }).locator('xpath=following-sibling::*[1]');
      await h.at(73.3); await h.hscroll(row, 380, 900);
    } },
  { name: 'B13 Iman Health: namaz, zikr, fasting', a: after(tB, 12),
    setup: async h => { await closeViewer(h); await h.route('iman'); },
    run: async h => {
      await h.at(75.1); await h.ring('#screen-iman .ih-chip >> nth=0');
      await h.at(76.0); await h.tap('#screen-iman .ih-chip >> nth=0', { pre: 200, post: 200 });
      await h.at(76.6); await h.tap('#screen-iman .ih-chip >> nth=3', { pre: 200, post: 200 }); await h.tap('#screen-iman .ih-chip >> nth=7', { pre: 200, post: 200 });
      await h.at(78.3); await h.scrollTo(0, { ms: 700 }); await h.ring(h.page.locator('#screen-iman .section-title, #screen-iman [class*="ih-"]').first());
    } },
  { name: 'B14 Tasbeeh | Duas | Prayer Times | Qibla finder, Calendar', a: after(tB, 13),
    run: async h => {   // pauses after "Tasbeeh" 81.29, "Duas" 82.10, "Prayer Times" 83.15, "Islamic Calendar" 85.24
      await h.route('tasbeeh'); for (let i = 0; i < 2; i++) await h.tap('#ring', { pre: 150, post: 200 });
      await h.at(81.5); await h.route('duas');
      await h.at(82.45); await h.route('prayers');
      await h.at(83.45); await h.route('qibla');
      await h.at(84.45); await h.route('calendar');
    } },
  { name: 'B15 notifications on', a: after(tB, 14),
    run: async h => {
      await h.route('more'); await h.scrollTo(tile(h, 'Notifications'), { off: 330, ms: 700 });
      await h.at(87.5); await h.tap(tile(h, 'Notifications'), { pre: 220, post: 300 });
      await h.at(88.5); await h.tap('#remindBtn', { click: false }); await h.ring('#remindBtn'); await h.at(89.6); await h.ring('#remindBtn');
    } },
  { name: 'B16 free, for everyone | du’a', a: after(tB, 15),
    setup: home,
    run: async h => { await h.at(91.0); await h.ring('.topbar .brand'); await h.at(94.2); await h.scrollBy(380, 2000); await h.at(96.6); await h.scrollTo(0, { ms: 1400 }); } },
];
module.exports = { A, B };
