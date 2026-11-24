// Storyboard for the Urdu walkthrough (voice_ur_walkthrough_daro.wav, script_v4.md UR_W01-W13). One segment per narration
// line; times from work/times_UR.json (line start/end). Every action is wrapped so one missing element never stops a take.
const fs = require('fs'), path = require('path');
const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'work', 'times_UR.json')));
const S = i => T[i - 1][0], E = i => T[i - 1][1], D = i => E(i) - S(i);
const at = (i, f) => S(i) + D(i) * f;                       // time at fraction f of line i
const safe = fn => async h => { try { await fn(h); } catch (e) { console.warn('  step skipped:', e.message.split('\n')[0]); } };
const closeViewer = async h => { await h.page.evaluate(() => { const x = document.querySelector('.fv:not([hidden]) .fv-x'); if (x) x.click(); }); await h.sleep(200); };
const home = async h => { await closeViewer(h); await h.page.evaluate(() => { const x = document.querySelector('.qa-sheet .x, .qa-modal .x, [class*="qa-"] .x'); if (x) x.click(); document.querySelectorAll('.qa-sheet, .qa-modal, .qa-back, .qa-ov').forEach(e => e.remove()); }); await h.route('home'); await h.scrollTo(0, { ms: 1 }); };
const back = async h => { await h.tap('.screen.active .backbtn, .screen.active #lbBack, .screen.active #csBack, .screen.active #wjBack', { pre: 150, post: 250, reveal: false }); };
const ring = (h, s, ms = 0) => h.ring(s, ms);

module.exports = { UR: [
  { name: 'W01 welcome', a: 0, setup: safe(home), run: safe(async h => { await h.at(2); await ring(h, '.ev-feat'); await h.at(at(1, 0.6)); await h.scrollTo('#wsCard', { off: 250, ms: 1800 }); }) },
  { name: 'W02 language', a: S(2), setup: safe(home), run: safe(async h => { await h.at(S(2) + 0.6); await ring(h, '#langHome'); await h.at(at(2, 0.55)); await ring(h, '#langHome'); }) },
  { name: 'W03 saying of the day', a: S(3), setup: safe(async h => { await home(h); await h.scrollTo('#wsCard', { off: 90, ms: 1 }); }),
    run: safe(async h => { await h.at(S(3) + 0.8); await ring(h, '#wsCard'); await h.at(at(3, 0.35)); await ring(h, '#wsCard [data-ws="play"]'); await h.at(at(3, 0.5)); await ring(h, '#wsCard [data-ws="read"]');
      await h.at(at(3, 0.65)); await ring(h, '#wsCard [data-ws="share"]'); }) },
  { name: 'W04 seven days', a: S(4), setup: safe(async h => { await home(h); await h.scrollTo('.wj-home', { off: 120, ms: 1 }); }),
    run: safe(async h => { await h.at(S(4) + 0.6); await ring(h, '.wj-home'); await h.at(at(4, 0.45)); await h.tap('.wj-home', { pre: 250, post: 400, reveal: false }); await h.scrollBy(200, 1400); }) },
  { name: 'W05 events and halqa', a: S(5), setup: safe(async h => { await home(h); }),
    run: safe(async h => { await h.at(S(5) + 0.5); await ring(h, '.ev-feat'); await h.at(at(5, 0.3)); await h.route('halqa'); await h.at(at(5, 0.5)); await ring(h, '#screen-halqa .campaign-card, #screen-halqa .hq-card, #screen-halqa .screen-body > *:first-child');
      await h.at(at(5, 0.75)); await h.scrollBy(420, 1300); await h.at(at(5, 0.92)); }) },
  { name: 'W06 dars highlights', a: S(6), setup: safe(async h => { await closeViewer(h); await h.page.evaluate(() => NoorFamily.open('azam')); await h.sleep(1200); await h.scrollTo(0, { ms: 1 }); }),
    run: safe(async h => { await h.at(S(6) + 0.8); await h.scrollBy(380, 1500); await h.at(at(6, 0.5)); await h.scrollBy(380, 1500); await h.at(at(6, 0.8)); await h.tap('.sh-card, .sh-sotd .sh-go, #fmBody .sh-ser', { pre: 250, post: 500, reveal: false }); }) },
  { name: 'W07 library', a: S(7), setup: safe(async h => { await closeViewer(h); await h.route('library'); await h.sleep(1500); }),
    run: safe(async h => { await h.at(S(7) + 0.8); await h.scrollBy(300, 1400); await h.at(at(7, 0.4)); await h.scrollTo(0, { ms: 700 }); await h.at(at(7, 0.55));
      await h.tap('#lbBody .lb-item, #lbBody .lb-card, #lbBody > div > *', { pre: 250, post: 900, reveal: false }); await h.at(at(7, 0.8)); await h.scrollBy(450, 1600); }) },
  { name: 'W08 learn sufi practices', a: S(8), setup: safe(async h => { await h.route('course'); await h.sleep(1500); }),
    run: safe(async h => { await h.at(S(8) + 0.8); await h.scrollBy(300, 1500); await h.at(at(8, 0.4)); await h.scrollBy(300, 1500); await h.at(at(8, 0.75)); await h.scrollTo(0, { ms: 900 }); }) },
  { name: 'W09 baiat', a: S(9), setup: safe(async h => { await h.route('bayah'); await h.sleep(1200); }),
    run: safe(async h => { await h.at(S(9) + 0.8); await h.scrollBy(380, 1600); await h.at(at(9, 0.45)); await h.scrollBy(380, 1600); await h.at(at(9, 0.8)); await h.scrollBy(300, 1200); }) },
  { name: 'W10 prayers quran duas tasbeeh', a: S(10), setup: safe(async h => { await home(h); await h.route('more'); await h.sleep(900); }),
    run: safe(async h => { await h.at(S(10) + 0.5); await h.scrollTo(0, { ms: 1 }); await h.at(at(10, 0.2)); await h.route('prayers'); await h.at(at(10, 0.4));
      await h.page.evaluate(() => { Noor.setNav('quran'); Noor.showScreen('quran'); }); await h.at(at(10, 0.62)); await h.route('duas'); await h.at(at(10, 0.8)); await h.route('tasbeeh'); }) },
  { name: 'W11 sign in and rewards', a: S(11), setup: safe(async h => { await home(h); }),
    run: safe(async h => { await h.at(S(11) + 0.4); await ring(h, '.hdr button:has-text("Sign in"), header button:has-text("Sign in"), button:has-text("Sign in")'); await h.at(at(11, 0.2));
      await h.page.evaluate(() => { Noor.setNav('rewards'); Noor.showScreen('rewards'); }); await h.at(at(11, 0.4)); await h.scrollBy(300, 1500); await h.at(at(11, 0.7)); await h.scrollBy(300, 1500); }) },
  { name: 'W12 share and install', a: S(12), setup: safe(async h => { await home(h); await h.scrollTo('#qaHome', { off: 400, ms: 1 }); }),
    run: safe(async h => { await h.at(S(12) + 0.6); await ring(h, '#qaHome'); await h.at(at(12, 0.25)); await h.tap('#qaHome', { pre: 250, post: 600, reveal: false }); await h.at(at(12, 0.6)); await h.scrollBy(300, 1400); }) },
  { name: 'W13 closing', a: S(13), setup: safe(home), run: safe(async h => { await h.at(S(13) + 0.5); await ring(h, '.ev-feat'); }) },
] };
