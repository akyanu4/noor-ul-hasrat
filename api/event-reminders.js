/* Vercel cron job (see vercel.json): once a day, early morning in Hyderabad, it schedules push reminders for the circle's
   regular gatherings (js/gatherings.js) to everyone who allowed notifications in the app (OneSignal):
     - on the day, at 10:00 am IST: "Today: <gathering>"
     - Urs and Salgirah also the day before, at 7:00 pm IST: "Tomorrow: <gathering>"
     - the weekly halqa also 30 minutes before it starts (8:00 pm IST)
   Each reminder is sent once (OneSignal idempotency key = gathering + date + kind). Hijri dates use the Umm al-Qura
   calendar like the app; set HIJRI_ADJ (-2..2) in Vercel if the local moon sighting runs a day off.
   Environment: ONESIGNAL_APP_ID, ONESIGNAL_REST_KEY, CRON_SECRET (as for the other jobs). Optional: SITE_URL, HIJRI_ADJ. */
const crypto = require('crypto');
const G = require('../js/gatherings.js');

const IST = 330 * 60000;
function uuid(s) { const h = crypto.createHash('sha1').update(s).digest('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`; }
const ist = (day, hh, mm) => day + (hh * 60 + mm) * 60000 - IST;   // a wall-clock time in Hyderabad on that civil day

// The reminders due between now and the next run (+ a little overlap), as { key, at, heading, text }.
function plan(nowMs, adj) {
  const out = [], until = nowMs + 26 * 3600000;
  G.upcoming(nowMs, adj, 3).forEach(function (x) {
    const g = x.g, d = new Date(x.day).toISOString().slice(0, 10);
    const add = (kind, at, heading, text) => { if (at > nowMs + 60000 && at <= until) out.push({ key: uuid(`noor-gathering:${g.id}:${d}:${kind}`), at, heading, text }); };
    if (g.id === 'halqa') {
      add('day', ist(x.day, 10, 0), 'Tonight: ' + g.name, 'Weekly zikr circle at 8:30–9:30 pm (India time). Tap to open Noor.');
      add('soon', ist(x.day, 20, 0), g.name + ' in 30 minutes', 'The weekly zikr circle starts at 8:30 pm (India time).');
    } else {
      add('day', ist(x.day, 10, 0), 'Today: ' + g.name, g.note + '.');
      if (g.kind === 'yearly') add('eve', ist(x.day - 86400000, 19, 0), 'Tomorrow: ' + g.name, g.note + '.');
    }
  });
  return out;
}

async function send(it, env, site, fetchFn) {
  const body = {
    app_id: env.ONESIGNAL_APP_ID, target_channel: 'push', idempotency_key: it.key, included_segments: ['Total Subscriptions'],
    headings: { en: it.heading }, contents: { en: it.text }, url: site + '/?events=1',
    send_after: new Date(it.at).toISOString(), ttl: 6 * 3600
  };
  const r = await fetchFn('https://api.onesignal.com/notifications?c=push', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Key ' + env.ONESIGNAL_REST_KEY }, body: JSON.stringify(body) });
  return r.ok ? 'ok' : 'fail:' + r.status;
}

async function run(env, nowMs, fetchFn) {
  const site = (env.SITE_URL || 'https://noor-ul-hasrat.vercel.app').replace(/\/$/, '');
  let adj = parseInt(env.HIJRI_ADJ, 10) || 0; if (adj < -2 || adj > 2) adj = 0;
  const items = plan(nowMs, adj), res = { planned: items.map(i => i.heading + ' @ ' + new Date(i.at).toISOString()), ok: 0, failed: 0, errors: [] };
  for (const it of items) { const o = await send(it, env, site, fetchFn).catch(e => 'fail:' + e.message); if (o === 'ok') res.ok++; else { res.failed++; res.errors.push(o); } }
  return res;
}

module.exports = async function handler(req, res) {
  const env = process.env;
  if (!env.CRON_SECRET || (req.headers.authorization || '') !== 'Bearer ' + env.CRON_SECRET) { res.status(401).json({ error: 'unauthorized' }); return; }
  if (!env.ONESIGNAL_APP_ID || !env.ONESIGNAL_REST_KEY) { res.status(500).json({ error: 'ONESIGNAL_APP_ID and ONESIGNAL_REST_KEY are not set' }); return; }
  res.status(200).json(await run(env, Date.now(), fetch));
};
module.exports.plan = plan; module.exports.run = run;
