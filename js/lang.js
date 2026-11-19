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
  N.langSwitch = function (extraStyle) {
    return '<div class="lb-lang" role="group" aria-label="Language"' + (extraStyle ? ' style="' + extraStyle + '"' : '') + '><button type="button" data-lang="en"' + (lang === 'en' ? ' class="on"' : '') + '>English</button><button type="button" data-lang="ru"' + (lang === 'ru' ? ' class="on"' : '') + '>Roman Urdu</button></div>';
  };
  var css = doc.createElement('style');
  css.textContent = '.lb-lang{display:inline-flex;border:1px solid var(--line);border-radius:999px;padding:2px;margin:0 0 10px;background:var(--panel)}.lb-lang button{border:0;background:none;color:var(--ink);font:inherit;font-size:12.5px;font-weight:600;padding:5px 12px;border-radius:999px;cursor:pointer}.lb-lang button.on{background:var(--teal);color:#fff}';
  doc.head.appendChild(css);
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-lang]'); if (!b) return;
    N.setLang(b.getAttribute('data-lang'));
  });
})(typeof self !== 'undefined' ? self : this);
