/* Vercel cron job (see vercel.json), once a day at 9:00 am in Hyderabad. Emails registered members who asked for it:
     - gatherings: one email on the day of any gathering (weekly halqa, monthly mehfil, Urs, Salgirah), and the day
       before an Urs or Salgirah. Sent together, members in Bcc, so nobody sees anyone else's address.
     - Fridays: each member's own Iman Health summary for the last 7 days (only to themselves).
     - the admin (ADMIN_EMAIL, or the app's Gmail): a short list of Bai'at waiting for approval, if there are any.
   Members choose these under More → My Account. Gmail allows about 500 emails a day, which is plenty for the circle.
   Environment: FIREBASE_SERVICE_ACCOUNT, GMAIL_USER, GMAIL_APP_PASSWORD, CRON_SECRET. Optional: SITE_URL, HIJRI_ADJ, RTDB_URL.
   Add ?dry=1 to see what would be sent without sending anything. */
const G = require('../js/gatherings.js');
const GG = require('./_google.js');
const M = require('./_mail.js');

const IST = 330 * 60000, BCC_CHUNK = 40;

function istWeekday(nowMs) { return new Date(nowMs + IST).getUTCDay(); }

// What to tell members about today: [{ when: 'Today' | 'Tonight' | 'Tomorrow', g }]
function gatheringNews(nowMs, adj) {
  const out = [];
  G.upcoming(nowMs, adj, 1).forEach(x => {
    if (x.days === 0) out.push({ when: x.g.id === 'halqa' ? 'Tonight' : 'Today', g: x.g });
    else if (x.days === 1 && x.g.kind === 'yearly') out.push({ when: 'Tomorrow', g: x.g });
  });
  return out;
}

function gatheringEmail(news, site, meetUrl) {
  const subject = news.length === 1 ? news[0].when + ': ' + news[0].g.name : news[0].when + ': ' + news[0].g.name + ' and more';
  const blocks = news.map(n => '<div style="border:1px solid #e4ddc9;border-radius:12px;padding:12px 14px;margin:0 0 10px">' +
    '<div style="font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:#a07d2c;font-weight:700">' + M.esc(n.when) + '</div>' +
    '<div style="font-size:16px;font-weight:700;margin:2px 0">' + M.esc(n.g.ic + ' ' + n.g.name) + '</div>' +
    '<div style="font-size:14px;color:#3d4a46;line-height:1.5">' + M.esc(n.g.note) + (n.g.start ? ' (India time)' : '') + '</div></div>').join('');
  const html = M.layout(subject, '<p style="margin:0 0 12px;line-height:1.55">Assalamu alaikum. A reminder from Noor-ul-Hasrat:</p>' + blocks +
    M.button(site + '/?events=1', 'Open Noor-ul-Hasrat') +
    (meetUrl ? '<p style="font-size:13px;color:#6b7570;margin:0">Joining online? Google Meet: <a href="' + M.esc(meetUrl) + '" style="color:#0f3d3e">' + M.esc(meetUrl.replace(/^https:\/\//, '')) + '</a></p>' : ''), site);
  const text = 'Assalamu alaikum. A reminder from Noor-ul-Hasrat:\n\n' + news.map(n => n.when + ': ' + n.g.name + '\n' + n.g.note).join('\n\n') +
    '\n\nOpen the app: ' + site + (meetUrl ? '\nGoogle Meet: ' + meetUrl : '') + '\n\nTo stop these emails: More → My Account in the app.';
  return { subject, html, text };
}

function weeklyEmail(p, s, site, nowMs) {
  const first = String(p.name || '').split(' ')[0] || 'friend';
  const stale = !s || !s.updated || nowMs - s.updated > 8 * 86400000;
  if (stale) {
    const subject = 'Your Iman Health this week';
    const html = M.layout(subject, '<p style="line-height:1.55;margin:0">Assalamu alaikum ' + M.esc(first) + '. We have not seen your Iman Health this week. ' +
      'A small step today: open Noor and mark the prayers you have prayed. Every prayer counts.</p>' + M.button(site + '/?nudge=1', 'Open Iman Health'), site);
    return { subject, html, text: 'Assalamu alaikum ' + first + '. We have not seen your Iman Health this week. Open Noor and mark the prayers you have prayed: ' + site + '/?nudge=1' };
  }
  const subject = 'Your Iman Health: ' + s.score + ' · ' + s.label;
  const row = (k, v) => '<tr><td style="padding:6px 0;border-top:1px solid #eee5cf;color:#6b7570">' + k + '</td><td style="padding:6px 0;border-top:1px solid #eee5cf;text-align:right;font-weight:600">' + v + '</td></tr>';
  const html = M.layout('Your week: ' + s.score + ' · ' + s.label,
    '<p style="line-height:1.55;margin:0 0 12px">Assalamu alaikum ' + M.esc(first) + '. Here is your Iman Health for the last 7 days. It is a private reminder, not a judgment.</p>' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px">' +
    row('Prayers on time', (s.onTime || 0) + ' (' + (s.masjid || 0) + ' at the masjid)') + row('Fasts', s.fasts || 0) + row('Dhikr', (s.dhikrCount || 0).toLocaleString('en-US')) + row('Good deeds', s.goodDeeds || 0) + '</table>' +
    '<p style="line-height:1.55;margin:14px 0 0;background:#f4efe3;border-radius:10px;padding:10px 12px">' + M.esc(s.tip || '') + '</p>' +
    M.button(site + '/?nudge=1', 'Open Iman Health'), site);
  const text = 'Assalamu alaikum ' + first + '. Your Iman Health for the last 7 days: ' + s.score + ' (' + s.label + ').\nPrayers on time: ' + (s.onTime || 0) +
    ' (' + (s.masjid || 0) + ' at the masjid)\nFasts: ' + (s.fasts || 0) + '\nDhikr: ' + (s.dhikrCount || 0) + '\nGood deeds: ' + (s.goodDeeds || 0) + '\n\n' + (s.tip || '') + '\n\n' + site + '/?nudge=1';
  return { subject, html, text };
}

async function run(env, nowMs, fetchFn, dry) {
  const site = (env.SITE_URL || 'https://noor-ul-hasrat.vercel.app').replace(/\/$/, '');
  let adj = parseInt(env.HIJRI_ADJ, 10) || 0; if (adj < -2 || adj > 2) adj = 0;
  const d = GG.db(env, fetchFn);
  const profiles = (await d.get('profiles')) || {};
  const people = Object.keys(profiles).map(id => ({ id, p: profiles[id] || {} })).filter(x => x.p.email && x.p.remind);
  const res = { gatherings: [], gatheringTo: 0, weeklyTo: 0, sent: 0, failed: 0, errors: [], dry: !!dry };

  const send = async msg => {
    if (dry) { res.sent++; return; }
    try { await M.send(env, msg); res.sent++; } catch (e) { res.failed++; res.errors.push(e.message); }
  };

  const news = gatheringNews(nowMs, adj);
  res.gatherings = news.map(n => n.when + ': ' + n.g.name);
  const gTo = people.filter(x => x.p.remind.gather).map(x => x.p.email);
  res.gatheringTo = gTo.length;
  if (news.length && gTo.length) {
    const e = gatheringEmail(news, site, env.MEET_URL || 'https://meet.google.com/mxc-pqnb-xba');
    for (let i = 0; i < gTo.length; i += BCC_CHUNK) await send(Object.assign({ to: env.GMAIL_USER, bcc: gTo.slice(i, i + BCC_CHUNK) }, e));
  }

  // Bai'at waiting for the admin's approval (admin.html → Approve)
  const okMap = (await d.get('bayah_ok')) || {};
  const waiting = Object.keys(profiles).map(id => ({ id, p: profiles[id] || {} })).filter(x => x.p.bayah && x.p.bayah.taken && !(okMap[x.id] && (okMap[x.id].approved || okMap[x.id].rejected)));
  res.bayahWaiting = waiting.length;
  if (waiting.length) {
    const rows = waiting.map(x => '<li style="margin:4px 0"><b>' + M.esc(x.p.name || '') + '</b>, Bai\u2019at with ' + M.esc(x.p.bayah.with || '?') + ' (' + M.esc(x.p.email || '') + (x.p.phone ? ', ' + M.esc(x.p.phone) : '') + ')</li>').join('');
    await send({ to: env.ADMIN_EMAIL || env.GMAIL_USER, subject: waiting.length + ' Bai\u2019at waiting for your approval',
      html: M.layout('Bai\u2019at waiting for approval', '<p style="margin:0 0 8px;line-height:1.55">These members marked that they have taken Bai\u2019at. Approve them on the admin page to open the full dars and dhikr practices for them.</p><ul style="padding-left:18px;margin:0">' + rows + '</ul>' + M.button(site + '/admin.html', 'Open the admin page'), site, 'Sent to the Noor-ul-Hasrat admin.'),
      text: waiting.map(x => '- ' + (x.p.name || '') + ', with ' + (x.p.bayah.with || '?') + ' (' + (x.p.email || '') + ')').join('\n') + '\n\nApprove: ' + site + '/admin.html' });
  }

  if (istWeekday(nowMs) === 5) {                       // Friday
    const weekly = people.filter(x => x.p.remind.weekly);
    res.weeklyTo = weekly.length;
    if (weekly.length) {
      const sums = (await d.get('summaries')) || {};
      for (const x of weekly) await send(Object.assign({ to: x.p.email }, weeklyEmail(x.p, sums[x.id], site, nowMs)));
    }
  }
  return res;
}

module.exports = async function handler(req, res) {
  const env = process.env;
  if (!env.CRON_SECRET || (req.headers.authorization || '') !== 'Bearer ' + env.CRON_SECRET) { res.status(401).json({ error: 'unauthorized' }); return; }
  if (!env.FIREBASE_SERVICE_ACCOUNT || !M.ready(env)) { res.status(500).json({ error: 'FIREBASE_SERVICE_ACCOUNT, GMAIL_USER and GMAIL_APP_PASSWORD must be set' }); return; }
  const dry = /[?&]dry=1/.test(req.url || '');
  try { res.status(200).json(await run(env, Date.now(), fetch, dry)); } catch (e) { res.status(500).json({ error: e.message }); }
};
module.exports.run = run; module.exports.gatheringNews = gatheringNews; module.exports.weeklyEmail = weeklyEmail; module.exports.gatheringEmail = gatheringEmail;
