/* Noor: scholar profile page (opened by tapping a shaykh photo that has "profile" set in config.js).
   Every fact here comes from the sources listed at the bottom of the page. Nothing is added from memory. */
(function (root) {
  'use strict';

  var PROFILES = {
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
      map: 'https://www.google.com/maps/search/?api=1&query=Siddiq+Gulshan+Bahadurpura+Hyderabad',
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
      '<div class="sch-ar">' + esc(p.ar) + '</div><div class="sch-nm">' + esc(p.name) + '</div><div class="sch-pen">"' + esc(p.pen) + '"</div><div class="sch-sub">' + esc(p.sub) + '</div></div>';
    h += '<div class="sch-card">' + p.facts.map(function (f) { return '<div class="sch-row"><b>' + esc(f[0]) + '</b><span>' + esc(f[1]) + '</span></div>'; }).join('') + '</div>';
    p.sections.forEach(function (s) {
      h += '<h2 class="section-title" style="margin-top:14px">' + esc(s[0]) + '</h2><div class="sch-card"><ul>' + s[1].map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';
    });
    h += '<button class="sch-btn" id="schVideos" type="button" style="width:100%;border:0;cursor:pointer">Poetry &amp; Naat ›</button>';
    h += '<a class="sch-btn" style="background:var(--panel);color:var(--ink);border:1px solid var(--line)" target="_blank" rel="noopener" href="' + esc(safeUrl(p.map)) + '">Find Siddiq Gulshan on the map ›</a>';
    h += '<div class="sch-note">Compiled from the pages below. Where sources differ (for example on his exact title or his age at passing) we have left the detail out. Please check anything important with the family, the khanqah or your teachers.</div>';
    h += '<div class="sch-src">Sources: ' + p.sources.map(function (s) { return '<a target="_blank" rel="noopener" href="' + esc(safeUrl(s[1])) + '">' + esc(s[0]) + '</a>'; }).join(' · ') + '</div>';
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
    '.sch-note,.sch-src{font-size:12px;color:var(--muted);line-height:1.55;margin:8px 2px}.sch-src a{color:var(--teal)}';
  doc.head.appendChild(css);

  var screens = doc.querySelector('.screens');
  var s = N.el('div', 'screen', '<div class="subhead"><div class="backbtn" id="schBack">←</div><div class="subtitle">Shaykh profile</div></div><div id="schBody"></div>');
  s.id = 'screen-scholar'; screens.appendChild(s);
  s.querySelector('#schBack').addEventListener('click', function () { N.backTab(); });
  api.open = function (id, photo) {
    var p = PROFILES[id]; if (!p) return false;
    s.querySelector('#schBody').innerHTML = html(p, photo);
    var vb = s.querySelector('#schVideos'); if (vb) vb.onclick = function () { if (root.NoorFamily && root.NoorFamily.open) root.NoorFamily.open('poetry'); };
    N.showScreen('scholar');
    return true;
  };
})(typeof self !== 'undefined' ? self : this);
