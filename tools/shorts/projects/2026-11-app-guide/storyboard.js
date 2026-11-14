// What the phone shows for each narration line. Times are narration seconds (work/times_<A|B>.json from align.py,
// plus the shorter pauses inside lines found with silencedetect d=0.12). Each segment: a = narration time it starts,
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
    run: async h => { await h.at(0.9); await h.ring('.ev-feat'); } },
  { name: 'A2 your spiritual companion', a: after(tA, 1),
    run: async h => { await h.at(4.3); await h.scrollTo('#quickGrid', { off: 330, ms: 1600 }); await h.at(5.9); await h.ring('.bay-home'); } },
  { name: 'A3 prayer times, qibla, calendar', a: after(tA, 2),
    run: async h => {
      await h.tap('.prayer-card'); await h.at(10.9); await h.tap('.screen.active .backbtn', { post: 250 });
      await h.at(11.6); await h.tap(text(h, '#quickGrid .qcard', 'Qibla'));
      await h.at(13.1); await h.tap('.screen.active .backbtn', { post: 250 }); await h.tap(text(h, '#quickGrid .qcard', 'Calendar'));
    } },
  { name: 'A4 dars & Shorts, Short of the Day', a: after(tA, 3),
    run: async h => {
      await h.tap('.screen.active .backbtn', { post: 200 });
      await h.scrollTo('#homeShorts', { off: 75, ms: 1500 });
      await h.at(18.3); await h.ring('.sh-sotd');
      await h.at(20.9); await h.tap('.sh-sotd .sh-go');
    } },
  { name: 'A5 series in order, watched ticks', a: after(tA, 4),
    setup: async h => { await shortsPage(h); await h.scrollTo(text(h, '#fmBody .sh-h', 'Series'), { off: 80, ms: 1 }); },
    run: async h => {
      await h.at(23.6); await h.ring(text(h, '#fmBody .sh-ser', 'Haqeeqat'));
      await h.at(25.3); await h.tap(text(h, '#fmBody .sh-ser', 'Haqeeqat'));
      await h.at(28.5); await h.ring('.sh-row.done >> nth=0'); await h.at(29.4); await h.ring('.sh-row.done >> nth=1'); await h.at(30.2); await h.ring('.sh-row.done >> nth=2');
    } },
  { name: 'A6 mystic meditations, pictures', a: after(tA, 5),
    run: async h => {
      await h.tap('.navitem[data-tab="practice"]', { post: 300 });
      await h.tap(text(h, '#worshipList .rowitem', 'Mystic Meditations'));
      await h.at(34.0); await h.scrollTo('.md-il[data-topic="run-from-it"]', { off: 330, ms: 1000 });
      await h.at(35.4); await h.tap('.md-il[data-topic="run-from-it"]');
      await h.scrollTo('.md-pic', { off: 70, ms: 900 });
    } },
  { name: 'A7 after Bay’ah, under the Shaykh', a: after(tA, 6),
    run: async h => { await h.scrollTo(0, { ms: 900 }); await h.at(39.6); await h.ring('.md-bay'); await h.at(41.8); await h.ring('.md-bay'); } },
  { name: 'A8 Bai’at request from the app', a: after(tA, 7),
    setup: async h => { await h.signIn(); await h.route('bayah'); await h.sleep(600); await h.scrollTo('#byReq', { off: 70, ms: 1 }); },
    run: async h => {
      await h.at(44.9); await h.tap('#byWith', { click: false, post: 150 }); await h.page.selectOption('#byWith', { index: 1 });
      await h.at(46.0); await h.tap('#byPhone', { post: 150 }); await h.type('#byPhone', '+91 98765 43210', 45);
      await h.at(48.2); await h.tap('.by-send', { post: 600 }); await h.scrollTo('#byReq', { off: 70, ms: 500 });
      await h.at(49.6); await h.ring('#byReq');
    } },
  { name: 'A9 halqa online', a: after(tA, 8),
    setup: home,
    run: async h => { await h.at(52.7); await h.ring('.ev-feat'); await h.at(53.5); await h.tap(text(h, '#quickGrid .qcard', 'Halqa')); await h.at(54.4); await h.ring('#joinNow'); } },
  { name: 'A9b Iman Health', a: 56.1,
    setup: async h => { await h.route('iman'); },
    run: async h => {
      await h.at(56.5); await h.tap('#screen-iman .ih-chip >> nth=0', { post: 250 }); await h.tap('#screen-iman .ih-chip >> nth=3', { post: 250 });
      await h.tap('#screen-iman .ih-chip >> nth=7', { post: 250 }); await h.scrollTo(0, { ms: 700 });
    } },
  { name: 'A10 free, the address', a: after(tA, 9),
    setup: async h => { await h.goto('install.html'); },
    run: async h => { await h.at(60.5); await h.ring('h1'); await h.at(61.9); await h.tap(h.page.getByText('Download the Android app').first(), { click: false }); } },
  { name: 'A11 light up the heart: Tasbeeh', a: after(tA, 10),
    setup: async h => { await h.goto('index.html'); await h.route('tasbeeh'); },
    run: async h => { for (let i = 0; i < 6; i++) await h.tap('#ring', { pre: 160, post: 260 }); } },
];

const B = [
  { name: 'B1 welcome', a: 0, setup: home,
    run: async h => { await h.at(2.9); await h.ring('.topbar .brand'); await h.at(6.3); await h.scrollBy(520, 1900); await h.at(8.5); await h.scrollTo(0, { ms: 800 }); } },
  { name: 'B2 install', a: after(tB, 1),
    setup: async h => { await h.goto('install.html'); },
    run: async h => {
      await h.at(11.5); await h.ring('h1');
      await h.at(14.0); await h.ring(h.page.getByText('Prayer times, Qur').first());
      await h.at(17.6); await h.tap(h.page.getByText('Download the Android app').first(), { click: false }); await h.ring(h.page.getByText('Download the Android app').first());
      await h.at(21.2); await h.scrollTo(h.page.getByText('Or add it from Chrome').first(), { off: 60, ms: 1100 }); await h.ring(text(h, 'li', 'Install app'));
    } },
  { name: 'B3 Home: events, join online', a: after(tB, 2),
    setup: async h => { await h.goto('index.html'); await home(h); },
    run: async h => { await h.at(26.0); await h.ring('.ev-feat'); await h.at(28.3); await h.ring('.ev-feat'); await h.at(30.5); await h.tap('.ev-act', { click: false }); await h.ring('.ev-act'); } },
  { name: 'B4 Short of the Day, Start here', a: after(tB, 3),
    run: async h => {
      await h.scrollTo('#homeShorts', { off: 75, ms: 1300 }); await h.at(34.4); await h.ring('.sh-sotd');
      await h.at(37.0); await h.scrollTo(text(h, '#homeHub .sh-h', 'Start here'), { off: 120, ms: 1000 });
      await h.ring(text(h, '#homeHub .sh-h', 'Start here')); await h.at(38.5); await h.hscroll('#homeHub .fm-hs >> nth=0', 560, 1500);
    } },
  { name: 'B5 series in order, Next', a: after(tB, 4),
    setup: async h => { await h.scrollTo('.sh-cont', { off: 200, ms: 1 }); },
    run: async h => {
      await h.at(42.1); await h.ring('.sh-cont'); await h.at(43.9); await h.tap('.sh-cont');
      await h.at(46.3); await h.ring('.fv-t');
      await h.at(48.9); await h.ring('.fv-next'); await h.at(49.4); await h.tap('.fv-next', { reveal: false });
    } },
  { name: 'B6 topics', a: after(tB, 5),
    setup: shortsPage,
    run: async h => {
      await h.at(52.2); await h.ring('#fmBody .fm-chips');
      await h.at(53.3); await h.tap('#fmBody [data-st="tawbah"]', { pre: 200, post: 200 });
      await h.at(54.4); await h.tap('#fmBody [data-st="khatrat"]', { pre: 200, post: 200 });
      await h.at(55.4); await h.tap('#fmBody [data-st="tasawwur"]', { pre: 200, post: 200 });
      await h.at(56.5); await h.tap('#fmBody [data-st="sabr"]', { pre: 200, post: 200 });
      await h.at(58.0); await h.scrollTo('#fmBody .fm-grid', { off: 140, ms: 900 });
    } },
  { name: 'B7 WhatsApp', a: after(tB, 6),
    run: async h => { await h.at(60.9); await h.ring('#fmBody .fm-grid .fm-wa >> nth=0'); await h.at(61.9); await h.tap('#fmBody .fm-grid .fm-wa >> nth=0', { click: false }); await h.ring('#fmBody .fm-grid .fm-wa >> nth=1'); } },
  { name: 'B8 Practices: Mystic Meditations, a topic', a: after(tB, 7),
    run: async h => {
      await h.at(64.4); await h.tap('.navitem[data-tab="practice"]', { post: 300 });
      await h.at(65.9); await h.tap(text(h, '#worshipList .rowitem', 'Mystic Meditations'));
      await h.at(67.6); await h.scrollTo('.md-il[data-topic="run-from-it"]', { off: 330, ms: 1200 });
      await h.at(69.6); await h.tap('.md-il[data-topic="run-from-it"]');
      await h.at(71.0); await h.scrollTo('.md-pic', { off: 70, ms: 900 });
      await h.at(72.6); await h.scrollTo(text(h, '#screen-meditations *', 'How Hazrat taught it').last(), { off: 120, ms: 900 });
      await h.at(73.8); await h.scrollTo('#screen-meditations .fm-grid', { off: 100, ms: 800 });
    } },
  { name: 'B9 after Bay’ah only', a: after(tB, 8),
    run: async h => { await h.scrollTo(0, { ms: 900 }); await h.at(76.0); await h.ring('.md-bay'); await h.at(79.2); await h.ring('.md-bay'); await h.at(81.0); await h.ring('.md-tobay'); } },
  { name: 'B10 More > Bay’ah, the steps', a: after(tB, 9),
    run: async h => {
      await h.at(83.2); await h.tap('#menuBtn', { post: 300 });
      await h.scrollTo(tile(h, "Bay'ah"), { off: 330, ms: 800 }); await h.at(85.4); await h.tap(tile(h, "Bay'ah"));
      await h.at(86.9); await h.scrollTo('.by-step', { off: 70, ms: 1100 }); await h.at(88.3); await h.scrollBy(560, 1300);
    } },
  { name: 'B11 request: free account, email only', a: after(tB, 10),
    setup: async h => { await h.scrollTo(0, { ms: 1 }); },
    run: async h => {
      await h.at(91.2); await h.ring('#byReq'); await h.at(92.3); await h.tap('.by-signup');
      await h.at(93.2); await h.tap('#acEmail', { post: 120 }); await h.type('#acEmail', 'reader@example.com', 30);
      await h.tap('#acName', { post: 100 }); await h.type('#acName', 'Abdullah', 45);
      await h.tap('#acConsent', { post: 150 }); await h.tap('#acSend', { post: 600 });
      await h.at(97.6); await h.ring('#acBody .ac-hero'); await h.at(99.4); await h.ring('#acBody .ac-hero');
    } },
  { name: 'B11b signed in: choose, phone, send', a: 100.67,
    setup: async h => { await h.signIn(); await h.route('bayah'); await h.sleep(600); await h.scrollTo('#byReq', { off: 70, ms: 1 }); },
    run: async h => {
      await h.at(100.9); await h.tap('#byWith', { click: false, post: 200 }); await h.page.selectOption('#byWith', { index: 1 });
      await h.at(102.4); await h.ring('#byWith');
      await h.at(104.2); await h.tap('#byPhone', { post: 120 }); await h.type('#byPhone', '+91 98765 43210', 40);
      await h.at(106.3); await h.tap('.by-send', { post: 600 }); await h.scrollTo('#byReq', { off: 70, ms: 500 }); await h.at(107.6); await h.ring('#byReq');
    } },
  { name: 'B12 My Account: I have taken Bai’at', a: after(tB, 11),
    run: async h => {
      await h.at(109.3); await h.tap('#accBtn', { post: 400 });
      await h.scrollTo('#acBayah', { off: 200, ms: 900 });
      await h.at(111.9); await h.tap('#acBay', { post: 300 });
      await h.at(113.0); await h.tap('#acBaySel', { click: false, post: 150 }); await h.page.selectOption('#acBaySel', { index: 1 });
      await h.at(114.4); await h.tap('#acBaySave', { post: 500 }); await h.ring('#acBayah');
    } },
  { name: 'B12b after approval: murid Shorts open', a: 116.1,
    setup: async h => { await shortsPage(h); await h.scrollTo(text(h, '#fmBody .sh-h', 'For murids'), { off: 80, ms: 1 }); },
    run: async h => {
      await h.at(117.2); await h.ring(text(h, '#fmBody .sh-h', 'For murids'));
      const row = h.page.locator('#fmBody .sh-h', { hasText: 'For murids' }).locator('xpath=following-sibling::*[1]');
      await h.at(118.9); await h.hscroll(row, 380, 1500);
      await h.at(121.4); await h.tap(row.locator('.fm-sth').nth(1));
    } },
  { name: 'B13 Iman Health', a: after(tB, 12),
    setup: async h => { await closeViewer(h); await h.route('iman'); },
    run: async h => {
      await h.at(125.0); await h.ring('#screen-iman .ih-chip >> nth=0');
      await h.at(127.8); await h.tap('#screen-iman .ih-chip >> nth=0', { post: 250 });
      await h.at(129.2); await h.tap('#screen-iman .ih-chip >> nth=3', { post: 250 }); await h.tap('#screen-iman .ih-chip >> nth=7', { post: 250 });
      await h.at(130.6); await h.scrollTo(0, { ms: 800 }); await h.ring(h.page.locator('#screen-iman .section-title, #screen-iman [class*="ih-"]').first());
    } },
  { name: 'B14 tasbeeh, duas, times, qibla, calendar', a: after(tB, 13),
    run: async h => {
      await h.route('tasbeeh'); await h.sleep(250); for (let i = 0; i < 3; i++) await h.tap('#ring', { pre: 150, post: 230 });
      await h.at(134.6); await h.route('duas');
      await h.at(136.0); await h.route('prayers');
      await h.at(137.3); await h.route('qibla');
      await h.at(138.8); await h.route('calendar');
    } },
  { name: 'B15 notifications', a: after(tB, 14),
    run: async h => {
      await h.route('more'); await h.sleep(150); await h.scrollTo(tile(h, 'Notifications'), { off: 330, ms: 900 });
      await h.at(142.4); await h.tap(tile(h, 'Notifications'));
      await h.at(143.9); await h.tap('#remindBtn', { click: false }); await h.ring('#remindBtn'); await h.at(145.8); await h.ring('#remindBtn');
    } },
  { name: 'B16 free for all, du’a', a: after(tB, 15),
    setup: home,
    run: async h => { await h.at(148.4); await h.ring('.topbar .brand'); await h.at(150.6); await h.scrollBy(380, 3000); await h.at(154.5); await h.scrollTo(0, { ms: 1800 }); } },
];
module.exports = { A, B };
