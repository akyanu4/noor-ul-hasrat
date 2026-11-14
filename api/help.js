/* "Technical help" requests from the app (More → About & Support → Ask for technical help). Works without signing in,
   so people who cannot install or sign in can still ask.
     POST { name, contact, topic, device, message, page, uid?, website? }  → saves helpreq/<id> and emails the support team.
   `website` is a hidden field people never see: if it is filled, the request is quietly dropped (bots fill every box).
   Limits: 3 requests an hour from one connection, 80 a day in total.
   Environment: FIREBASE_SERVICE_ACCOUNT. Optional: GMAIL_USER + GMAIL_APP_PASSWORD (to email the team),
   HELP_EMAIL (where the email goes; default GMAIL_USER), SITE_URL, RTDB_URL. */
const crypto = require('crypto');
const G = require('./_google.js');
const M = require('./_mail.js');

const PER_HOUR_IP = 3, PER_DAY_ALL = 80;
const TOPICS = ['Installing the app', 'Signing in / account', 'Prayer times / Qibla', 'Videos / Shorts', 'Notifications / reminders', 'Bai’at request', 'Something else'];
const EMAIL_RE = /^[^\s@<>"',;]{1,64}@[A-Za-z0-9.-]{1,180}\.[A-Za-z]{2,24}$/;

const clip = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);

async function handle(env, body, nowMs, fetchFn, ip) {
  if (!env.FIREBASE_SERVICE_ACCOUNT) return { status: 503, error: 'Help requests are not switched on yet. Please call or WhatsApp the number on this page.' };
  if (body.website) return { status: 200, ok: true };
  const r = {
    name: clip(body.name, 60), contact: clip(body.contact, 80), topic: clip(body.topic, 40),
    device: clip(body.device, 160), message: clip(body.message, 1000), page: clip(body.page, 40), uid: clip(body.uid, 40)
  };
  if (TOPICS.indexOf(r.topic) === -1) r.topic = 'Something else';
  if (!r.name) return { status: 400, error: 'Please write your name.' };
  if (r.contact.length < 5) return { status: 400, error: 'Please give a phone/WhatsApp number or an email so we can reply.' };
  if (r.message.length < 5) return { status: 400, error: 'Please tell us a little about the problem.' };

  const d = G.db(env, fetchFn), day = new Date(nowMs).toISOString().slice(0, 10), hour = Math.floor(nowMs / 3600000);
  const ipKey = crypto.createHash('sha256').update('noor-help:' + (ip || '?')).digest('hex').slice(0, 20);
  const [mine, all] = await Promise.all([d.get('helpmeta/ip/' + ipKey), d.get('helpmeta/day/' + day)]);
  const n = mine && mine.hour === hour ? mine.n || 0 : 0;
  if (n >= PER_HOUR_IP) return { status: 429, error: 'We already have your request. Please wait an hour before sending another, or call/WhatsApp us.' };
  if ((all || 0) >= PER_DAY_ALL) return { status: 503, error: 'Too many requests today. Please call or WhatsApp the number on this page.' };

  const id = new Date(nowMs).toISOString().slice(0, 10).replace(/-/g, '') + '-' + crypto.randomBytes(4).toString('hex');
  const rec = Object.assign({}, r, { at: nowMs, status: 'new' });
  await d.put('helpreq/' + id, rec);
  await Promise.all([
    d.put('helpmeta/ip/' + ipKey, { hour, n: n + 1 }),
    d.put('helpmeta/day/' + day, { '.sv': { increment: 1 } })
  ]);

  const to = env.HELP_EMAIL || env.GMAIL_USER;
  if (M.ready(env) && to) {
    const site = (env.SITE_URL || 'https://noor-ul-hasrat.vercel.app').replace(/\/$/, '');
    const row = (k, v) => v ? '<p style="margin:0 0 6px;line-height:1.5"><b>' + M.esc(k) + ':</b> ' + M.esc(v) + '</p>' : '';
    const html = M.layout('Help request: ' + r.topic,
      row('Name', r.name) + row('Contact', r.contact) + row('Topic', r.topic) + row('Phone / browser', r.device) + row('Signed in', r.uid ? 'yes (' + r.uid + ')' : 'no') +
      '<p style="margin:10px 0 0;line-height:1.55;white-space:pre-wrap;background:#f7f2e3;border-radius:10px;padding:10px">' + M.esc(r.message) + '</p>' +
      M.button(site + '/admin.html', 'Open the admin page'),
      site, 'Sent by the Help form in the Noor-ul-Hasrat app.');
    const msg = { to, subject: '[Noor help] ' + r.topic + ' · ' + r.name, html,
      text: r.name + ' (' + r.contact + ')\n' + r.topic + '\n' + r.device + '\n\n' + r.message };
    if (EMAIL_RE.test(r.contact)) msg.replyTo = r.contact;
    try { await M.send(env, msg); } catch (e) { console.error('help mail', e && e.message); }
  }
  return { status: 200, ok: true, id };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const ip = String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '').split(',')[0].trim();
  try {
    const out = await handle(process.env, body || {}, Date.now(), fetch, ip);
    const status = out.status; delete out.status;
    res.setHeader('Cache-Control', 'no-store');
    res.status(status).json(out);
  } catch (e) {
    console.error('help', e && e.message);
    res.status(500).json({ error: 'Could not send right now. Please try again in a minute, or call/WhatsApp us.' });
  }
};
module.exports.handle = handle; module.exports.TOPICS = TOPICS;
