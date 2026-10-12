/* Vercel cron job (see vercel.json): once a day it schedules a gentle push at each city's prayer times through OneSignal.
   Phones opt in inside the app (Iman Health), which tags them nudge=1 and city=<nearest listed city>.
   Needs these environment variables in Vercel: ONESIGNAL_APP_ID, ONESIGNAL_REST_KEY, CRON_SECRET. Optional: SITE_URL. */
const crypto = require('crypto');
const Core = require('../js/core.js');
const Cities = require('../js/cities.js');

const NAMES = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
const HORIZON = 30 * 3600 * 1000;      // schedule the next 30 hours; the key below stops duplicates when runs overlap

function ymdPlus(ymd, n) { const t = new Date(Date.UTC(ymd[0], ymd[1] - 1, ymd[2] + n)); return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()]; }
function uuid(s) { const h = crypto.createHash('sha1').update(s).digest('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`; }

// Every prayer, for every city, that falls between now and the horizon.
function plan(nowMs, cities) {
  const out = [];
  (cities || Cities.LIST).forEach(function (c) {
    const [name, lat, lon, tz] = c, today = Core.civilDate(nowMs, tz);
    [0, 1, 2].forEach(function (n) {
      const ymd = ymdPlus(today, n), t = Core.prayerTimes(ymd[0], ymd[1], ymd[2], lat, lon, { method: 'karachi', asr: 'hanafi' });
      if (!t) return;
      Object.keys(NAMES).forEach(function (p) {
        if (t[p] > nowMs + 120000 && t[p] <= nowMs + HORIZON) out.push({ city: name, prayer: p, at: t[p], key: uuid(`noor-nudge:${name}:${p}:${ymd.join('-')}`) });
      });
    });
  });
  return out;
}

async function send(item, env, site, fetchFn) {
  const body = {
    app_id: env.ONESIGNAL_APP_ID, target_channel: 'push', idempotency_key: item.key,
    filters: [{ field: 'tag', key: 'nudge', relation: '=', value: '1' }, { operator: 'AND' }, { field: 'tag', key: 'city', relation: '=', value: item.city }],
    headings: { en: 'Noor-ul-Hasrat' }, contents: { en: `${NAMES[item.prayer]} time. May Allah accept your prayer. Tap to open Noor.` },
    url: site + '/?nudge=1', send_after: new Date(item.at).toISOString(), ttl: 3600
  };
  const r = await fetchFn('https://api.onesignal.com/notifications?c=push', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Key ' + env.ONESIGNAL_REST_KEY }, body: JSON.stringify(body) });
  return r.ok ? 'ok' : 'fail:' + r.status;
}

async function run(env, nowMs, fetchFn) {
  const site = (env.SITE_URL || 'https://noor-ul-hasrat.vercel.app').replace(/\/$/, ''), items = plan(nowMs), res = { planned: items.length, ok: 0, failed: 0, errors: [] };
  for (let i = 0; i < items.length; i += 10) {
    const out = await Promise.all(items.slice(i, i + 10).map(function (it) { return send(it, env, site, fetchFn).catch(function (e) { return 'fail:' + e.message; }); }));
    out.forEach(function (o) { if (o === 'ok') res.ok++; else { res.failed++; if (res.errors.length < 5) res.errors.push(o); } });
  }
  return res;
}

module.exports = async function handler(req, res) {
  const env = process.env;
  if (!env.CRON_SECRET || (req.headers.authorization || '') !== 'Bearer ' + env.CRON_SECRET) { res.status(401).json({ error: 'unauthorized' }); return; }
  if (!env.ONESIGNAL_APP_ID || !env.ONESIGNAL_REST_KEY) { res.status(500).json({ error: 'ONESIGNAL_APP_ID and ONESIGNAL_REST_KEY are not set' }); return; }
  res.status(200).json(await run(env, Date.now(), fetch));
};
module.exports.plan = plan; module.exports.run = run; module.exports.uuid = uuid;
