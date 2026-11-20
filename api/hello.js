/* Anonymous usage counts for the admin page. The app calls this at most once a day per phone:
     POST { d: <random id made on the phone>, inst: true if opened as the installed app, plat: android|ios|desktop|other, src: 'qr' or '' }
   Nothing personal is sent or kept: no name, email, IP address or location. Stored (service account; the database rules
   let only admins read it):
     stats/dev/<d>      { first, last, inst, plat, src }   one entry per phone
     stats/total        { visitors, installs, installs_android, installs_ios, installs_desktop, installs_other, qr }
     stats/daily/<day>  number of phones that opened the app that day (IST)
     stats/total/f_w|f_r|f_j|f_s7|f_c7|f_ret  phones that watched, read, signed in, started / finished the 7-day welcome, came back another day
   Environment: FIREBASE_SERVICE_ACCOUNT (and optional RTDB_URL). */
const G = require('./_google.js');

const PLATS = ['android', 'ios', 'desktop', 'other'];
const MAX_NEW_PER_DAY = 3000;
const FLAGS = ['w', 'r', 'j', 's7', 'c7'];

async function handle(env, body, nowMs, fetchFn) {
  if (!env.FIREBASE_SERVICE_ACCOUNT) return { status: 503, error: 'not configured' };
  const d = String(body.d || '');
  if (!/^[a-f0-9]{16,32}$/.test(d)) return { status: 400, error: 'bad id' };
  const plat = PLATS.indexOf(body.plat) >= 0 ? body.plat : 'other';
  const inst = body.inst === true, src = body.src === 'qr' ? 'qr' : '';
  const db = G.db(env, fetchFn);
  const day = new Date(nowMs + 330 * 60000).toISOString().slice(0, 10);   // IST day, the community's
  const inc = { '.sv': { increment: 1 } };
  const rec = await db.get('stats/dev/' + d);
  const ops = [];
  if (!rec) {
    const n = await db.get('stats/newday/' + day);
    if ((n || 0) >= MAX_NEW_PER_DAY) return { status: 200, ok: true, skipped: true };
    ops.push(db.put('stats/newday/' + day, inc), db.put('stats/total/visitors', inc));
    if (src) ops.push(db.put('stats/total/qr', inc));
  }
  if (inst && !(rec && rec.inst)) ops.push(db.put('stats/total/installs', inc), db.put('stats/total/installs_' + plat, inc));
  if (!rec || rec.last !== day) ops.push(db.put('stats/daily/' + day, inc));
  // journey steps, each counted once per phone: w watched, r read, j joined (signed in), s7/c7 the 7-day welcome; ret came back on another day
  const had = (rec && rec.f) || {}, f = Object.assign({}, had);
  const sent = body.f && typeof body.f === 'object' ? body.f : {};
  FLAGS.forEach(function (k) { if (sent[k] && !had[k]) { f[k] = 1; ops.push(db.put('stats/total/f_' + k, inc)); } });
  if (rec && rec.first && rec.first !== day && !had.ret) { f.ret = 1; ops.push(db.put('stats/total/f_ret', inc)); }
  ops.push(db.put('stats/dev/' + d, { first: (rec && rec.first) || day, last: day, inst: inst || !!(rec && rec.inst), plat: plat, src: (rec && rec.src) || src, f: f }));
  await Promise.all(ops);
  return { status: 200, ok: true };
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
    console.error('hello', e && e.message);
    res.status(500).json({ error: 'failed' });
  }
};
module.exports.handle = handle;
