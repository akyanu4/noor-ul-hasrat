/* Sign-in by email link, no password.
     POST { action: "send",   email }  → emails a one-time link (valid 30 minutes) to that address.
     POST { action: "verify", token }  → checks the link and returns a Firebase custom token for that person's account.
   The link is signed with a secret only the server knows (AUTH_LINK_SECRET, or derived from the service account key),
   so nobody can make one for another person's email. Each link works once.
   Limits so the Gmail account is never abused: 1 email a minute and 5 a day per address, 300 a day in total.
   Environment: FIREBASE_SERVICE_ACCOUNT, GMAIL_USER, GMAIL_APP_PASSWORD. Optional: AUTH_LINK_SECRET, SITE_URL, RTDB_URL. */
const crypto = require('crypto');
const G = require('./_google.js');
const M = require('./_mail.js');

const LINK_MINUTES = 30, PER_MINUTE_GAP = 60000, PER_DAY_ADDR = 5, PER_DAY_ALL = 300;
const EMAIL_RE = /^[^\s@<>"',;]{1,64}@[A-Za-z0-9.-]{1,180}\.[A-Za-z]{2,24}$/;

function secret(env) {
  if (env.AUTH_LINK_SECRET) return env.AUTH_LINK_SECRET;
  return crypto.createHash('sha256').update('noor-link:' + G.serviceAccount(env).key).digest('hex');
}
function sign(env, s) { return crypto.createHmac('sha256', secret(env)).update(s).digest('base64url'); }

function makeToken(env, email, nowMs) {
  const body = Buffer.from(JSON.stringify({ e: email, x: nowMs + LINK_MINUTES * 60000, n: crypto.randomBytes(9).toString('hex') })).toString('base64url');
  return body + '.' + sign(env, body);
}
// → { email, nonce } or throws an Error whose .code is 'bad' or 'expired'
function readToken(env, token, nowMs) {
  const m = /^([A-Za-z0-9_-]{10,400})\.([A-Za-z0-9_-]{20,80})$/.exec(String(token || ''));
  const fail = code => { const e = new Error(code); e.code = code; return e; };
  if (!m) throw fail('bad');
  const want = Buffer.from(sign(env, m[1])), got = Buffer.from(m[2]);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) throw fail('bad');
  let p; try { p = JSON.parse(Buffer.from(m[1], 'base64url').toString()); } catch (e) { throw fail('bad'); }
  if (!p || typeof p.e !== 'string' || typeof p.n !== 'string') throw fail('bad');
  if (!(p.x > nowMs)) throw fail('expired');
  return { email: p.e, nonce: p.n };
}

const today = nowMs => new Date(nowMs).toISOString().slice(0, 10);
const addrKey = email => crypto.createHash('sha256').update(email).digest('hex').slice(0, 24);

async function sendLink(env, email, nowMs, fetchFn, site) {
  const d = G.db(env, fetchFn), day = today(nowMs), k = addrKey(email);
  const [mine, all] = await Promise.all([d.get('authlinks/addr/' + k), d.get('authlinks/day/' + day)]);
  const n = mine && mine.day === day ? mine.n || 0 : 0;
  if (mine && nowMs - (mine.last || 0) < PER_MINUTE_GAP) return { status: 429, error: 'A link was sent a moment ago. Please wait a minute, then try again.' };
  if (n >= PER_DAY_ADDR) return { status: 429, error: 'Too many links were sent to this email today. Please use the last one, or try again tomorrow.' };
  if ((all || 0) >= PER_DAY_ALL) return { status: 503, error: 'Sign-in emails are busy today. Please try again tomorrow.' };
  const link = site + '/?signin=' + makeToken(env, email, nowMs);
  const html = M.layout('Sign in to Noor-ul-Hasrat',
    '<p style="line-height:1.55;margin:0">Assalamu alaikum. Tap the button to sign in to the Noor-ul-Hasrat app on this phone.</p>' +
    M.button(link, 'Sign in to Noor-ul-Hasrat') +
    '<p style="font-size:13px;color:#6b7570;line-height:1.5;margin:0">The link works once, for ' + LINK_MINUTES + ' minutes. If you did not ask for it, you can ignore this email: nothing happens without the link.</p>',
    site, 'This email was sent because someone asked to sign in to the Noor-ul-Hasrat app with this address.');
  await M.send(env, { to: email, subject: 'Your Noor-ul-Hasrat sign-in link', html,
    text: 'Assalamu alaikum. Open this link on your phone to sign in to Noor-ul-Hasrat (it works once, for ' + LINK_MINUTES + ' minutes):\n\n' + link + '\n\nIf you did not ask for it, ignore this email.' });
  await Promise.all([
    d.put('authlinks/addr/' + k, { last: nowMs, day, n: n + 1 }),
    d.put('authlinks/day/' + day, { '.sv': { increment: 1 } })
  ]);
  return { status: 200, ok: true };
}

async function verify(env, token, nowMs, fetchFn) {
  let t;
  try { t = readToken(env, token, nowMs); } catch (e) {
    return { status: 400, error: e.code === 'expired' ? 'This sign-in link has expired. Ask for a new one in the app.' : 'This sign-in link is not valid. Ask for a new one in the app.' };
  }
  const d = G.db(env, fetchFn);
  if (await d.get('authlinks/used/' + t.nonce)) return { status: 400, error: 'This sign-in link was already used. If it was not you, ask for a new one in the app.' };
  await d.put('authlinks/used/' + t.nonce, nowMs);
  const uid = G.uidFor(t.email);
  return { status: 200, ok: true, uid, email: t.email, token: G.customToken(env, uid, { em: t.email }, Math.floor(nowMs / 1000)) };
}

async function handle(env, body, nowMs, fetchFn) {
  const site = (env.SITE_URL || 'https://noor-ul-hasrat.vercel.app').replace(/\/$/, '');
  if (!env.FIREBASE_SERVICE_ACCOUNT) return { status: 503, error: 'Accounts are not switched on yet (FIREBASE_SERVICE_ACCOUNT is not set).' };
  if (body.action === 'send') {
    if (!M.ready(env)) return { status: 503, error: 'Sign-in emails are not switched on yet (GMAIL_USER / GMAIL_APP_PASSWORD are not set).' };
    const email = String(body.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return { status: 400, error: 'Please check the email address.' };
    return sendLink(env, email, nowMs, fetchFn, site);
  }
  if (body.action === 'verify') return verify(env, body.token, nowMs, fetchFn);
  return { status: 400, error: 'unknown action' };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  try {
    const out = await handle(process.env, body || {}, Date.now(), fetch);
    const status = out.status; delete out.status;
    res.setHeader('Cache-Control', 'no-store');
    res.status(status).json(out);
  } catch (e) {
    console.error('auth-link', e && e.message);
    res.status(500).json({ error: 'Something went wrong. Please try again in a minute.' });
  }
};
module.exports.handle = handle; module.exports.makeToken = makeToken; module.exports.readToken = readToken;
