/* Noor: scholar profile page (opened by tapping a shaykh photo that has "profile" set in config.js).
   Every fact here comes from the sources listed at the bottom of the page. Nothing is added from memory. */
(function (root) {
  'use strict';

  var PROFILES = {
    shaykh1: {
      name: 'Azam Pasha', pen: '', ar: 'ذكر', sub: 'Zikr and teachings · tap a video to watch',
      facts: [], sections: [], map: '', sources: [], plain: true, shorts: true, audio: true
    },
    hasrat: {
      name: 'Hazrat Maulana Mohammed Abdul Qadeer Siddiqui',
      pen: 'Hasrat',
      ar: 'بحر العلوم',
      sub: 'Bahr ul-Uloom, "Ocean of Knowledge" · Hyderabad',
      facts: [
        ['Born', '12 October 1871 (27 Rajab 1288 AH), Hyderabad'],
        ['Passed away', '24 March 1962 (17 Shawwal 1381 AH), Hyderabad'],
        ['Known as', 'Hasrat (his pen name), Bahr ul-Uloom. His followers called him "Qadeer Piya".'],
        ['Lineage', 'Described as a descendant of Hadhrat Abu Bakr as-Siddiq (28th generation on his father\'s side) and, through his mother, of Imam Hussain. Hence "Siddiqui al-Hussaini". His family came originally from Cheenak, near Ahmedabad, Gujarat.']
      ],
      sections: [
        ['His life and learning', [
          'He was educated first by spiritual teachers, then took the Maulvi Fazil and Munshi Fazil qualifications of Punjab University.',
          'His spiritual guide (murshid) was his maternal uncle, Hazrat Syed Khawaja Muhammad Siddiq Mahboobullah. After his shaykh passed away he travelled through Muslim countries to seek further knowledge.',
          'He was a mufassir (Qur\'an commentator), muhaddith and Sufi, and wrote poetry in Urdu, Arabic and Persian.'
        ]],
        ['Achievements', [
          'He was the first head of the Theology faculty at Osmania University, founded by the 7th Nizam. Sources word the title slightly differently (Dean of the Faculty, or Head of the Department of Theology / Islamic Studies). After retiring he kept teaching at his home.',
          'He wrote over fifty books, mostly in Urdu. His most important work is Tafseer-e-Siddiqui, a six-volume commentary on the Qur\'an. He also wrote a tafsir of Surah al-Fatihah and of Juz\' Amma.',
          'His Hanafi fiqh work Ad-Din was included in the Osmania University curriculum, and his interpretive Urdu translation of Ibn Arabi\'s Fusus al-Hikam was used in the Punjab University curriculum.',
          'His poetry is collected in Kulliyyat-e-Hasrat (hamd, na\'at and manqabat).',
          'Thousands attended his funeral prayer at Makkah Masjid, Hyderabad.'
        ]],
        ['His writings and teachings', [
          'We have not summarised his teachings in our own words, so that nothing is misquoted. The titles of his books show the subjects he taught, and they are best read from the books themselves or with a teacher who knows them.',
          'Tawheed and belief: Hikmat-e-Islamiyyah (a treatise on Islamic monotheism), Al-Tawhid, Usool-e-Islam.',
          'Qur\'an: Tafseer-e-Siddiqui, and his tafsir of Surah al-Fatihah and Juz\' Amma.',
          'The path of tasawwuf: Haqiqat-e-Bay\'at (the reality of the pledge), Nizamul Amal-e-Fuqara (the schedule of deeds of the seekers), Sama\'.',
          'The Ascension: Haqiqat-e-Mi\'raj.',
          'Questions of daily life: the issues of usury (Sud ka Mas\'alah), divorce, and wills and inheritance, and poetry recital in Islam.',
          'His kalaam and naat videos are under "Poetry & Naat" in the app (button below).',
          'Some of his works have been translated and explained in English by Shaikh Mir Asedullah Quadri, for example "Islamic Wisdom" (Hikmat-e-Islamiyyah).'
        ]],
        ['His resting place and Urs', [
          'He is buried at Siddiq Gulshan, Bahadurpura, Hyderabad.',
          'His Urs is observed every year on the 16th, 17th and 18th of Shawwal.',
          'Please confirm visiting times and the exact dates of the Urs with the family or the community each year, because Hijri dates depend on moon sighting.'
        ]],
        ['Further reading about him', [
          'Biographies in Urdu: Toor-e-Tajalli; Yaad-e-Hasrat Ayaat (compiled by his son, Dr. Moosa Abdur Rehman Siddiqui); Abdullah (compiled by his grandson, Muhammad Anwaruddin Siddiqui).'
        ]]
      ],
      map: 'https://www.google.com/maps/place/Dargah+Hazrat+Muhammad+Abdul+Qadeer+Siddiqui+Quadri/@17.3596579,78.4543992,17z/data=!3m1!4b1!4m6!3m5!1s0x3bcb9794617efeab:0xc49331e24aa305c5!8m2!3d17.3596528!4d78.4569741!16s%2Fg%2F11r9zq827',
      sources: [
        ['Siddiq Gulshan (family site)', 'https://siddiqgulshan.com/index.php/family-members/prof-mohammed-abdul-qadeer-siddiqui/'],
        ['Hasrat Chicago, scholar profile', 'https://hasratchicago.com/scholars/hazrat-muhammad-abdul-qadeer-siddiqui-hasrat/'],
        ['Sahih Iman, books and translations', 'https://sahihiman.com/tasawwuf/shaikh-abdul-qadeer-siddiqui/']
      ]
    }
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function safeUrl(u) { return /^https:\/\//i.test(u) ? u : '#'; }

  function html(p, photo) {
    var h = '<div class="sch-hero">' + (photo ? '<img class="sch-img" alt="' + esc(p.name) + '" src="' + esc(photo) + '">' : '') +
      '<div class="sch-ar">' + esc(p.ar) + '</div><div class="sch-nm">' + esc(p.name) + '</div>' + (p.pen ? '<div class="sch-pen">"' + esc(p.pen) + '"</div>' : '') + '<div class="sch-sub">' + esc(p.sub) + '</div></div>';
    if (p.facts.length) h += '<div class="sch-card">' + p.facts.map(function (f) { return '<div class="sch-row"><b>' + esc(f[0]) + '</b><span>' + esc(f[1]) + '</span></div>'; }).join('') + '</div>';
    p.sections.forEach(function (s) {
      h += '<h2 class="section-title" style="margin-top:14px">' + esc(s[0]) + '</h2><div class="sch-card"><ul>' + s[1].map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';
    });
    h += '<div id="schWatch"></div>' + (p.shorts ? '<div id="schShorts"></div>' : '') + (p.audio ? '<div id="schAudio"></div>' : '') + '<div id="schGallery"></div>';
    if (!p.plain) {
    h += '<button class="sch-btn" id="schVideos" type="button" style="width:100%;border:0;cursor:pointer">Poetry &amp; Naat ›</button>';
    h += '<button class="sch-btn" id="schDars" type="button" style="width:100%;border:1px solid var(--line);cursor:pointer;background:var(--panel);color:var(--ink)">Dars &amp; Tafseer videos ›</button>';
    h += '<button class="sch-btn" id="schZikr" type="button" style="width:100%;border:1px solid var(--line);cursor:pointer;background:var(--panel);color:var(--ink)">Zikr &amp; Sama videos ›</button>';
    h += '<a class="sch-btn" style="background:var(--panel);color:var(--ink);border:1px solid var(--line)" target="_blank" rel="noopener" href="' + esc(safeUrl(p.map)) + '">Open the Dargah on Google Maps ›</a>';
    h += '<div class="sch-note">Compiled from the pages below. Where sources differ (for example on his exact title or his age at passing) we have left the detail out. Please check anything important with the family, the khanqah or your teachers.</div>';
    h += '<div class="sch-src">Sources: ' + p.sources.map(function (s) { return '<a target="_blank" rel="noopener" href="' + esc(safeUrl(s[1])) + '">' + esc(s[0]) + '</a>'; }).join(' · ') + '</div>';
    }
    return h;
  }

  var api = { PROFILES: PROFILES, html: html, esc: esc, safeUrl: safeUrl };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NoorScholar = api;

  var N = root.Noor, doc = root.document;
  if (!N || !doc) return;
  var css = doc.createElement('style');
  css.textContent =
    '.sch-hero{background:linear-gradient(160deg,var(--teal),#0f3a33);color:#f5f1e2;border-radius:16px;padding:18px 14px;text-align:center;margin-bottom:12px}' +
    '.sch-img{width:112px;height:112px;object-fit:cover;border-radius:50%;border:3px solid var(--gold);margin-bottom:8px}' +
    '.sch-ar{font-family:Amiri,serif;font-size:26px;color:var(--gold-soft)}.sch-nm{font-size:18px;font-weight:700;margin-top:2px}.sch-pen{font-size:15px;color:var(--gold-soft)}.sch-sub{font-size:12.5px;opacity:.85;margin-top:4px}' +
    '.sch-card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:10px}' +
    '.sch-row{display:flex;gap:10px;padding:7px 0;border-bottom:1px solid var(--line);font-size:13.5px;line-height:1.45}.sch-row:last-child{border-bottom:0}.sch-row b{flex:none;width:92px;color:var(--teal)}.sch-row span{flex:1}' +
    '.sch-card ul{margin:0;padding-left:18px;font-size:13.5px;line-height:1.55}.sch-card li{margin:6px 0}' +
    '.sch-btn{display:block;text-align:center;background:var(--gold);color:#1a2421;font-weight:700;border-radius:12px;padding:13px;font-size:15px;text-decoration:none;margin:12px 0}' +
    '.sch-gal{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:6px}.sch-gal button{padding:0;border:0;border-radius:10px;overflow:hidden;aspect-ratio:1/1;background:var(--line);cursor:pointer}.sch-gal img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.sch-lb{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.93);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px}.sch-lb img{max-width:100%;max-height:78vh;object-fit:contain;border-radius:8px}.sch-lb .cp{color:#f5f1e2;font-size:14px;margin-top:10px;text-align:center;max-width:90%}.sch-lb .ct{color:#aaa;font-size:12px;margin-top:4px}' +
    '.sch-lb button{position:absolute;background:rgba(255,255,255,.15);color:#fff;border:0;border-radius:50%;width:44px;height:44px;font-size:22px;cursor:pointer}.sch-lb .x{top:14px;right:14px}.sch-lb .pv{left:10px;top:50%}.sch-lb .nx{right:10px;top:50%}' +
    '.sch-vd{margin-bottom:10px;background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden}.sch-vth{position:relative;aspect-ratio:16/9;background:#000;cursor:pointer}.sch-vth img,.sch-vth iframe{width:100%;height:100%;object-fit:cover;display:block;border:0}.sch-vth .pl{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:34px;text-shadow:0 2px 10px rgba(0,0,0,.6)}.sch-vd .t{padding:10px 12px;font-size:13.5px;font-weight:600;line-height:1.4}' +
    '.sch-au{display:flex;align-items:center;gap:12px;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:8px;cursor:pointer}.sch-au .ic{flex:none;width:42px;height:42px;border-radius:50%;background:var(--teal);color:#fff;display:flex;align-items:center;justify-content:center;font-size:19px}.sch-au .tx{flex:1;min-width:0}.sch-au .tx b{display:block;font-size:14.5px}.sch-au .tx small{display:block;color:var(--muted);font-size:12px;margin-top:2px}.sch-au .ur{font-family:Amiri,serif;font-size:19px;color:var(--teal);direction:rtl}' +
    '.sch-note,.sch-src{font-size:12px;color:var(--muted);line-height:1.55;margin:8px 2px}.sch-src a{color:var(--teal)}';
  doc.head.appendChild(css);

  var screens = doc.querySelector('.screens');
  var s = N.el('div', 'screen', '<div class="subhead"><div class="backbtn" id="schBack">←</div><div class="subtitle">Shaykh profile</div></div><div id="schBody"></div>');
  s.id = 'screen-scholar'; screens.appendChild(s);
  s.querySelector('#schBack').addEventListener('click', function () { N.backTab(); });
  function loadWatch(id) {
    var box = s.querySelector('#schWatch'); if (!box || !root.fetch) return;
    fetch('data/pinned.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (g) {
      var list = ((g && g[id]) || []).filter(function (v) { return v && /^[\w-]{11}$/.test(v.id || '') && v.title; });
      if (!list.length) return;
      box.innerHTML = '<h2 class="section-title" style="margin-top:14px">Watch</h2>' + list.map(function (v) {
        return '<div class="sch-vd"><div class="sch-vth" data-id="' + v.id + '" role="button" aria-label="Play ' + esc(v.title) + '"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/' + v.id + '/mqdefault.jpg"><div class="pl">▶</div></div><div class="t">' + esc(v.title) + '</div></div>';
      }).join('');
      box.onclick = function (e) {
        var t = e.target.closest && e.target.closest('.sch-vth'); if (!t || t.querySelector('iframe')) return;
        t.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + t.getAttribute('data-id') + '?autoplay=1&rel=0&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Video"></iframe>';
      };
    }).catch(function () {});
  }
  // "Azam Pasha Zikr" Shorts: the newest six on the profile, and a button to the full list.
  var SHORTS_ON_PROFILE = 6;
  function loadShorts() {
    var box = s.querySelector('#schShorts'), F = root.NoorFamily;
    if (!box || !F || !F.azamShorts) return;
    box.innerHTML = '<h2 class="section-title" style="margin-top:14px">Zikr Shorts</h2><div class="sch-note">Loading…</div>';
    F.azamShorts(function (st) {
      if (!s.querySelector('#schShorts')) return;
      var list = st.items || [];
      if (!list.length) { box.innerHTML = st.error && st.error !== 'stale' ? '' : '<h2 class="section-title" style="margin-top:14px">Zikr Shorts</h2><div class="sch-note">No Shorts yet.</div>'; return; }
      box.innerHTML = '<h2 class="section-title" style="margin-top:14px">Zikr Shorts</h2>' + F.shortsGrid(list.slice(0, SHORTS_ON_PROFILE)) +
        '<button class="sch-btn" id="schAllShorts" type="button" style="width:100%;border:0;cursor:pointer">All Azam Pasha Zikr Shorts (' + list.length + ') ›</button>';
      box.onclick = function (e) {
        if (e.target.closest && e.target.closest('#schAllShorts')) { F.open('azam'); return; }
        F.playShort(e.target.closest && e.target.closest('.fm-sth'));
      };
    });
  }
  // Audio Dars on the profile: one card per series; tapping opens that series in the Audio Dars screen.
  function loadAudio() {
    var box = s.querySelector('#schAudio'), A = root.NoorAudio;
    if (!box || !A || !A.summary) return;
    A.summary(function (list) {
      if (!s.querySelector('#schAudio') || !list.length) return;
      box.innerHTML = '<h2 class="section-title" style="margin-top:14px">Audio Dars</h2>' + list.map(function (x, i) {
        return '<div class="sch-au" data-i="' + i + '" role="button"><div class="ic">🎧</div><div class="tx"><b>' + esc(x.title) + '</b><small>' + x.count + ' recording' + (x.count === 1 ? '' : 's') + '</small></div>' + (x.titleUr ? '<div class="ur">' + esc(x.titleUr) + '</div>' : '') + '</div>';
      }).join('');
      box.onclick = function (e) { var c = e.target.closest && e.target.closest('.sch-au'); if (c) A.open(list[+c.getAttribute('data-i')].title); };
    });
  }
  function loadGallery(id) {
    var box = s.querySelector('#schGallery'); if (!box || !root.fetch) return;
    fetch('data/gallery.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (g) {
      var list = ((g && g[id]) || []).filter(function (p) { return p && /^(photos\/|https:\/\/)[^"<>\s]+$/.test(p.src || ''); });
      if (!list.length) return;
      box.innerHTML = '<h2 class="section-title" style="margin-top:14px">Gallery</h2><div class="sch-gal">' + list.map(function (p, i) { return '<button type="button" data-i="' + i + '" aria-label="' + esc(p.caption || 'Photo ' + (i + 1)) + '"><img loading="lazy" alt="' + esc(p.caption || '') + '" src="' + esc(p.src) + '"></button>'; }).join('') + '</div>';
      box.querySelector('.sch-gal').addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('button[data-i]'); if (b) lightbox(list, +b.getAttribute('data-i')); });
    }).catch(function () {});
  }
  function lightbox(list, i) {
    var lb = N.el('div', 'sch-lb', '<button class="x" type="button" aria-label="Close">✕</button><button class="pv" type="button" aria-label="Previous">‹</button><button class="nx" type="button" aria-label="Next">›</button><img alt=""><div class="cp"></div><div class="ct"></div>');
    function show() { var p = list[i]; lb.querySelector('img').src = p.src; lb.querySelector('img').alt = p.caption || ''; lb.querySelector('.cp').textContent = p.caption || ''; lb.querySelector('.ct').textContent = (i + 1) + ' / ' + list.length; lb.querySelector('.pv').style.display = lb.querySelector('.nx').style.display = list.length > 1 ? '' : 'none'; }
    function close() { lb.remove(); doc.removeEventListener('keydown', key); }
    function key(e) { if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') { i = (i + 1) % list.length; show(); } else if (e.key === 'ArrowLeft') { i = (i - 1 + list.length) % list.length; show(); } }
    lb.querySelector('.x').onclick = close; lb.querySelector('.pv').onclick = function () { i = (i - 1 + list.length) % list.length; show(); }; lb.querySelector('.nx').onclick = function () { i = (i + 1) % list.length; show(); };
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    var x0 = null; lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50 && list.length > 1) { i = (i + (dx < 0 ? 1 : -1) + list.length) % list.length; show(); } }, { passive: true });
    doc.addEventListener('keydown', key); doc.body.appendChild(lb); show();
  }
  api.open = function (id, photo) {
    var p = PROFILES[id]; if (!p) return false;
    s.querySelector('#schBody').innerHTML = html(p, photo);
    var db = s.querySelector('#schDars'); if (db) db.onclick = function () { if (root.NoorFamily && root.NoorFamily.open) root.NoorFamily.open('dars'); };
    loadGallery(id); loadWatch(id); if (p.shorts) loadShorts(); if (p.audio) loadAudio();
    var zb = s.querySelector('#schZikr'); if (zb) zb.onclick = function () { if (root.NoorFamily && root.NoorFamily.open) root.NoorFamily.open('zikr'); };
    var vb = s.querySelector('#schVideos'); if (vb) vb.onclick = function () { if (root.NoorFamily && root.NoorFamily.open) root.NoorFamily.open('poetry'); };
    N.showScreen('scholar');
    return true;
  };
})(typeof self !== 'undefined' ? self : this);
