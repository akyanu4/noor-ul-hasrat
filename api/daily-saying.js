/* Daily push at 7:00 AM India time: today's "Saying of the day", the same one the Home card shows (js/wisdom.js).
   Only sayings from Library articles a teacher has approved are used. Tapping opens the saying in the app.
   Needs ONESIGNAL_APP_ID, ONESIGNAL_REST_KEY, CRON_SECRET. The OneSignal idempotency key is per day, so a re-run never repeats. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const RTDB = 'https://siddiqgulshan-25903-default-rtdb.firebaseio.com';
function uuid(s) { const h = crypto.createHash('sha1').update(s).digest('hex'); return h.slice(0, 8) + '-' + h.slice(8, 12) + '-5' + h.slice(13, 16) + '-a' + h.slice(17, 20) + '-' + h.slice(20, 32); }
function dayNo(ms) { return Math.floor((ms + 330 * 60000) / 86400000); }
function pick(sayings, ok, ms) { const pool = sayings.filter(x => ok && ok[x.s]); return pool.length ? pool[dayNo(ms) % pool.length] : null; }

async function run(env, nowMs, fetchFn) {
  const sayings = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'library', 'sayings.json'), 'utf8'));
  const r = await fetchFn((env.RTDB_URL || RTDB).replace(/\/$/, '') + '/library_ok.json');
  const ok = r.ok ? (await r.json()) || {} : {};
  const x = pick(sayings, ok, nowMs);
  if (!x) return { sent: false, reason: 'no approved sayings yet' };
  const site = (env.SITE_URL || 'https://noor-ul-hasrat.vercel.app').replace(/\/$/, '');
  const text = x.q.length > 170 ? x.q.slice(0, 169).replace(/\s+\S*$/, '') + '…' : x.q;
  const body = {
    app_id: env.ONESIGNAL_APP_ID, target_channel: 'push', idempotency_key: uuid('noor-saying:' + dayNo(nowMs)),
    included_segments: ['Total Subscriptions'],
    headings: { en: '🌙 Saying of the day · Hazrat Azam Pasha R.A.' }, contents: { en: '“' + text + '”' },
    url: site + '/?q=' + x.s + '.' + x.i, ttl: 20 * 3600
  };
  const s = await fetchFn('https://api.onesignal.com/notifications?c=push', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Key ' + env.ONESIGNAL_REST_KEY }, body: JSON.stringify(body) });
  return s.ok ? { sent: true, saying: x.s + '.' + x.i } : { sent: false, error: s.status + ' ' + (await s.text().catch(() => '')).slice(0, 200) };
}

module.exports = async function handler(req, res) {
  const env = process.env;
  if (!env.CRON_SECRET || (req.headers.authorization || '') !== 'Bearer ' + env.CRON_SECRET) { res.status(401).json({ error: 'unauthorized' }); return; }
  if (!env.ONESIGNAL_APP_ID || !env.ONESIGNAL_REST_KEY) { res.status(500).json({ error: 'ONESIGNAL_APP_ID and ONESIGNAL_REST_KEY are not set' }); return; }
  try { res.status(200).json(await run(env, Date.now(), fetch)); } catch (e) { res.status(502).json({ error: String(e.message || e) }); }
};
module.exports.run = run; module.exports.pick = pick;
