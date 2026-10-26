/* The circle's own regular gatherings (shared by the app's Events banner and the daily reminder job, api/event-reminders.js).
   Dates follow the Islamic (Umm al-Qura) calendar the app uses; times are Hyderabad time (IST, UTC+5:30).
   Kinds: weekly (weekday 0=Sun..6=Sat), monthly (Hijri day), yearly (Hijri month + day). */
(function (root, factory) {
  var F = (typeof module === 'object' && module.exports) ? require('./faith.js') : root.NoorFaith;
  var api = factory(F);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.NoorGatherings = api;
})(typeof self !== 'undefined' ? self : this, function (F) {
  'use strict';
  var DAY = 86400000, IST = 330;

  var LIST = [
    { id: 'halqa', kind: 'weekly', weekday: 6, start: [20, 30], end: [21, 30], ic: '🕯️',
      name: 'Haftawar halqa-e-zikr', note: 'Weekly zikr circle, 8:30–9:30 pm' },
    { id: 'mehfil', kind: 'monthly', d: 16, ic: '🌕',
      name: 'Mahana mehfil', note: 'Fatiha of Hazrat Azam Piya R.A. · Qasida-e-Burda Sharif in the evening' },
    { id: 'urs-azam', kind: 'yearly', m: 3, d: 16, ic: '🌹',
      name: 'Urs Sharif: Hazrat Azam Piya R.A. & Hazrat Khaja Baba R.A.', note: 'Yearly fatiha, 16 Rabi-ul-Awwal' },
    { id: 'urs-azeem', kind: 'yearly', m: 4, d: 1, ic: '🌹',
      name: 'Urs Sharif: Hazrat Azeem Piya R.A.', note: '1 Rabi-ul-Thani' },
    { id: 'salgirah', kind: 'yearly', m: 6, d: 9, ic: '🎉',
      name: 'Salgirah Mubarak: Nooruddin (Nayeem Pasha)', note: '9 Jamada-al-Thani · evening program' }
  ];

  // Today's date in Hyderabad, as a UTC-midnight timestamp of that civil day.
  function istDay(nowMs) { var w = new Date(nowMs + IST * 60000); return Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate()); }

  // Every gathering in the next `days` civil days (Hyderabad dates), soonest first.
  // Each: { g, day (UTC midnight of the civil day), days (0 = today), at (start time, ms) or null, h (Hijri date) }.
  function upcoming(nowMs, adj, days) {
    var out = [], d0 = istDay(nowMs), i;
    for (i = 0; i <= (days == null ? 400 : days); i++) {
      var day = d0 + i * DAY, h = F && F.hijriAt ? F.hijriAt(day, adj || 0) : null, wd = new Date(day).getUTCDay();
      LIST.forEach(function (g) {
        var hit = g.kind === 'weekly' ? wd === g.weekday : !h ? false : g.kind === 'monthly' ? h.d === g.d : (h.m === g.m && h.d === g.d);
        if (!hit) return;
        var at = g.start ? day + (g.start[0] * 60 + g.start[1] - IST) * 60000 : null, end = g.end ? day + (g.end[0] * 60 + g.end[1] - IST) * 60000 : null;
        if (end && nowMs >= end) return;          // this week's halqa is already over
        out.push({ g: g, day: day, days: i, at: at, h: h });
      });
    }
    return out;
  }
  function next(nowMs, adj, id) { var u = upcoming(nowMs, adj, 400); for (var i = 0; i < u.length; i++) if (u[i].g.id === id) return u[i]; return null; }

  return { LIST: LIST, IST: IST, istDay: istDay, upcoming: upcoming, next: next };
});
