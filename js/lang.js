/* Noor: reading language for teachings (English or Roman Urdu), shared by every screen that has both.
   N.lang()            → 'en' or 'ru'
   N.setLang(l)        → saves it and tells every screen (event 'noorlang' on window)
   N.langSwitch()      → HTML for the English | Roman Urdu switch (buttons carry data-lang)
   N.T(en, ru)         → the text in the chosen language (falls back to English when no Roman Urdu is given)
   A click on any [data-lang] button anywhere switches the language. */
(function (root) {
  'use strict';
  var N = root.Noor, doc = root.document; if (!N || !doc) return;
  var KEY = 'noor_lib_lang', lang = 'en';
  try { lang = localStorage.getItem(KEY) === 'ru' ? 'ru' : 'en'; } catch (e) {}
  N.lang = function () { return lang; };
  N.setLang = function (l) {
    l = l === 'ru' ? 'ru' : 'en'; if (l === lang) return; lang = l;
    try { localStorage.setItem(KEY, l); } catch (e) {}
    try { root.dispatchEvent(new CustomEvent('noorlang', { detail: l })); } catch (e) {}
  };
  N.T = function (en, ru) { return lang === 'ru' && ru ? ru : en; };
  // the small chip in the corner of a reading page (articles, lessons, a day, Bai'at, meditations)
  N.langChip = function () {
    return '<div class="lg-chip" role="group" aria-label="Language"><button type="button" data-lang="en"' + (lang === 'en' ? ' class="on"' : '') + '>EN</button><button type="button" data-lang="ru"' + (lang === 'ru' ? ' class="on"' : '') + '>Roman Urdu</button></div>';
  };
  N.langSwitch = function (extraStyle) {
    return '<div class="lb-lang" role="group" aria-label="Language"' + (extraStyle ? ' style="' + extraStyle + '"' : '') + '><button type="button" data-lang="en"' + (lang === 'en' ? ' class="on"' : '') + '>English</button><button type="button" data-lang="ru"' + (lang === 'ru' ? ' class="on"' : '') + '>Roman Urdu</button></div>';
  };
  var css = doc.createElement('style');
  css.textContent = '.lb-lang{display:inline-flex;border:1px solid var(--line);border-radius:999px;padding:2px;margin:0 0 10px;background:var(--panel)}.lb-lang button{border:0;background:none;color:var(--ink);font:inherit;font-size:12.5px;font-weight:600;padding:5px 12px;border-radius:999px;cursor:pointer}.lb-lang button.on{background:var(--teal);color:#fff}' +
    '.lg-chip{display:flex;width:max-content;margin:0 0 6px auto;border:1px solid var(--line);border-radius:999px;padding:1px;background:var(--panel)}.lg-chip button{border:0;background:none;color:var(--muted);font:inherit;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;cursor:pointer}.lg-chip button.on{background:var(--teal);color:#fff}';
  doc.head.appendChild(css);
  // Home: the switch at the top, so people choose once for the whole app
  function homeBar() {
    var home = doc.getElementById('screen-home'); if (!home) return;
    var bar = doc.getElementById('langHome');
    if (!bar) { bar = doc.createElement('div'); bar.id = 'langHome'; bar.style.cssText = 'display:flex;justify-content:flex-end;align-items:center;gap:8px;margin:0 0 8px'; home.insertBefore(bar, home.firstChild); }
    else if (bar !== home.firstElementChild) home.insertBefore(bar, home.firstChild);
    // Events (with Donate) right under the language bar, at the top of Home
    var ev = doc.getElementById('eventsBox'); if (ev && ev.parentNode === home && bar.nextElementSibling !== ev) home.insertBefore(ev, bar.nextSibling);
    bar.innerHTML = '<span style="font-size:12px;color:var(--muted)">' + (lang === 'ru' ? 'Zabaan' : 'Language') + '</span>' + N.langSwitch('margin:0');
  }
  setTimeout(homeBar, 0); setTimeout(homeBar, 1500);
  root.addEventListener('noorlang', homeBar);
  if (N.onScreen) N.onScreen(function (id) { if (id === 'home') homeBar(); });
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-lang]'); if (!b) return;
    N.setLang(b.getAttribute('data-lang'));
  });
})(typeof self !== 'undefined' ? self : this);
