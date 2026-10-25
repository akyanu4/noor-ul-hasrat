/* Vercel cron job (see vercel.json): once a day it looks for Shorts published on the Azam Pasha Zikr channel since the
   last run and sends one push notification per new Short to everyone who allowed notifications in the app (OneSignal).
   Each Short is announced once: the OneSignal idempotency key is made from the video id, so a re-run never repeats it.
   Needs these environment variables in Vercel (the same ones the prayer nudges use): ONESIGNAL_APP_ID, ONESIGNAL_REST_KEY,
   CRON_SECRET. Optional: SITE_URL, YOUTUBE_API_KEY (otherwise the public key in js/config.js is used). */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const WINDOW = 26 * 3600 * 1000;      // the job runs every 24 hours; a little overlap so nothing is missed

function uuid(s) { const h = crypto.createHash('sha1').update(s).digest('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`; }

function config() {
  try {
    const t = fs.readFileSync(path.join(__dirname, '..', 'js', 'config.js'), 'utf8');
    const key = (t.match(/youtubeApiKey:\s*"([\w-]+)"/) || [])[1];
    const ch = (t.match(/azamChannel:\s*\{\s*id:\s*"(UC[\w-]{22})"/) || [])[1];
    return { key, channel: ch || 'UCn5J7zggR3cV4sCYlEjgZJA' };
  } catch (e) { return { channel: 'UCn5J7zggR3cV4sCYlEjgZJA' }; }
}

// Shorts published since `sinceMs`, newest first. Reads the channel's Shorts playlist (UUSH…).
async function newShorts(key, channel, sinceMs, fetchFn) {
  const pl = 'UUSH' + channel.slice(2);
  const u = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=20&playlistId=' + pl + '&key=' + encodeURIComponent(key);
  const r = await fetchFn(u);
  if (!r.ok) throw new Error('YouTube said ' + r.status);
  const d = await r.json();
  return (d.items || []).map(function (it) {
    const sn = it.snippet || {}, cd = it.contentDetails || {};
    return { id: cd.videoId || (sn.resourceId || {}).videoId, title: sn.title || 'New Short', at: Date.parse(cd.videoPublishedAt || sn.publishedAt || '') || 0 };
  }).filter(function (v) { return /^[\w-]{11}$/.test(v.id || '') && v.at >= sinceMs; }).sort(function (a, b) { return b.at - a.at; });
}

function cleanTitle(t) { return String(t).replace(/\s*#\w+/g, '').replace(/\s*\|\s*Hazrat Azam Pasha R\.A\.?\s*$/i, '').trim() || 'New Short'; }

async function send(v, env, site, fetchFn) {
  const body = {
    app_id: env.ONESIGNAL_APP_ID, target_channel: 'push', idempotency_key: uuid('noor-short:' + v.id),
    included_segments: ['Total Subscriptions'],
    headings: { en: 'New Short · Hazrat Azam Pasha R.A.' }, contents: { en: cleanTitle(v.title) + ' — tap to watch in Noor-ul-Hasrat.' },
    url: site + '/?short=' + v.id, chrome_web_image: 'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg', ttl: 3 * 86400
  };
  const r = await fetchFn('https://api.onesignal.com/notifications?c=push', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Key ' + env.ONESIGNAL_REST_KEY }, body: JSON.stringify(body) });
  return r.ok ? 'ok' : 'fail:' + r.status + ' ' + (await r.text().catch(function () { return ''; })).slice(0, 200);
}

async function run(env, nowMs, fetchFn) {
  const site = (env.SITE_URL || 'https://noor-ul-hasrat.vercel.app').replace(/\/$/, ''), cfg = config();
  const key = env.YOUTUBE_API_KEY || cfg.key;
  if (!key) return { error: 'no YouTube API key' };
  const list = (await newShorts(key, cfg.channel, nowMs - WINDOW, fetchFn)).slice(0, 3);   // at most three alerts a day
  const res = { found: list.length, sent: [], failed: [] };
  for (const v of list) {
    const o = await send(v, env, site, fetchFn).catch(function (e) { return 'fail:' + e.message; });
    (o === 'ok' ? res.sent : res.failed).push(o === 'ok' ? v.id : v.id + ' ' + o);
  }
  return res;
}

module.exports = async function handler(req, res) {
  const env = process.env;
  if (!env.CRON_SECRET || (req.headers.authorization || '') !== 'Bearer ' + env.CRON_SECRET) { res.status(401).json({ error: 'unauthorized' }); return; }
  if (!env.ONESIGNAL_APP_ID || !env.ONESIGNAL_REST_KEY) { res.status(500).json({ error: 'ONESIGNAL_APP_ID and ONESIGNAL_REST_KEY are not set' }); return; }
  try { res.status(200).json(await run(env, Date.now(), fetch)); } catch (e) { res.status(502).json({ error: String(e.message || e) }); }
};
module.exports.run = run; module.exports.newShorts = newShorts; module.exports.cleanTitle = cleanTitle;
