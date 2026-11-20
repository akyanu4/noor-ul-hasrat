/* Share pages for sayings, Library articles and lessons (rewrites in vercel.json):
     /q/<slug>.<n>  → a saying of Hazrat Azam Pasha R.A.   opens /?q=<slug>.<n>
     /a/<slug>      → a Library article                   opens /?a=<slug>
     /l/<lessonId>  → a lesson of "Learn Sufi Practices"   opens /?lesson=<lessonId>
   WhatsApp and others read the Open Graph tags and show a card (title, text, picture). Only articles a teacher has
   approved (library_ok/<slug>, public in the database) are described; anything else gets a plain card. */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const RTDB = 'https://siddiqgulshan-25903-default-rtdb.firebaseio.com';
function readJson(p) { try { return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8')); } catch (e) { return null; } }
async function approved(slug) {
  try { const r = await fetch((process.env.RTDB_URL || RTDB).replace(/\/$/, '') + '/library_ok/' + encodeURIComponent(slug) + '.json'); return r.ok && !!(await r.json()); } catch (e) { return false; }
}
function cut(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; }

async function describe(k, id) {
  if (k === 'q') {
    const m = /^([a-z0-9-]+)\.(\d+)$/.exec(id); if (!m) return null;
    const x = (readJson('data/library/sayings.json') || []).find(y => y.s === m[1] && y.i === +m[2]);
    if (!x || !(await approved(x.s))) return null;
    return { title: '“' + cut(x.q, 90) + '”', desc: '— Hazrat Azam Pasha R.A.' + (x.label ? ' · ' + x.label : ''), to: '/?q=' + id };
  }
  if (k === 'a') {
    if (!/^[a-z0-9-]+$/.test(id)) return null;
    const a = readJson('data/library/' + id + '.json');
    if (!a || !(await approved(id))) return null;
    return { title: a.title + ' · Noor-ul-Hasrat', desc: cut(a.summary || '', 190), to: '/?a=' + id };
  }
  if (k === 'l') {
    if (!/^[a-z0-9_-]+$/.test(id)) return null;
    const c = readJson('data/course/foundations.json') || { lessons: [] };
    const l = (c.lessons || []).find(x => x.id === id); if (!l) return null;
    return { title: 'Learn Sufi Practices: ' + l.title, desc: 'A lesson from the dars of Hazrat Azam Pasha R.A., at your own pace, under the guidance of your Shaykh.', to: '/?lesson=' + id };
  }
  return null;
}

module.exports = async function (req, res) {
  const k = String((req.query && req.query.k) || ''), id = String((req.query && req.query.id) || '').trim();
  const site = (process.env.SITE_URL || 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'noor-ul-hasrat.vercel.app')).replace(/\/$/, '');
  const d = (await describe(k, id).catch(() => null)) || { title: 'Noor-ul-Hasrat', desc: 'Stay connected with the teachings, wisdom and spiritual guidance of Hazrat Azam Pasha R.A.', to: '/' };
  const app = site + d.to, img = site + '/photos/share-card.jpg', self = site + '/' + k + '/' + id;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.title)}</title><meta name="description" content="${esc(d.desc)}"><link rel="canonical" href="${esc(self)}">
<meta property="og:site_name" content="Noor-ul-Hasrat"><meta property="og:type" content="article">
<meta property="og:title" content="${esc(d.title)}"><meta property="og:description" content="${esc(d.desc)}"><meta property="og:url" content="${esc(self)}">
<meta property="og:image" content="${esc(img)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(d.title)}"><meta name="twitter:description" content="${esc(d.desc)}"><meta name="twitter:image" content="${esc(img)}">
<meta http-equiv="refresh" content="1;url=${esc(app)}">
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f3d3e;color:#f6f0e2;font:17px/1.55 Georgia,serif;text-align:center;padding:20px}a{color:#e8c46b}</style>
</head><body><div><p>${esc(d.title)}</p><p style="opacity:.8">${esc(d.desc)}</p><p>Opening in the Noor-ul-Hasrat app… <a href="${esc(app)}">Open</a></p></div>
<script>location.replace(${JSON.stringify(app)})</script></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
  res.end(html);
};
module.exports.describe = describe;
