/* Share page for one Short: /s/<videoId> (rewrite in vercel.json).
   WhatsApp, Telegram, Facebook, X etc. read the Open Graph tags here and show a rich card with the video thumbnail and
   title (a play mark on WhatsApp/Telegram), instead of plain text. People who open the link go straight to the Short
   in the Noor-ul-Hasrat app (/?short=<id>), with a "Watch on YouTube" link as a fallback. */
const fs = require('fs');
const path = require('path');

function key() {
  if (process.env.YOUTUBE_API_KEY) return process.env.YOUTUBE_API_KEY;
  try { return (fs.readFileSync(path.join(__dirname, '..', 'js', 'config.js'), 'utf8').match(/youtubeApiKey:\s*"([\w-]+)"/) || [])[1]; } catch (e) { return null; }
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = t => String(t || '').replace(/\s*#\w+/g, '').trim();

async function info(id) {
  const k = key(); if (!k) return null;
  try {
    const r = await fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + id + '&key=' + encodeURIComponent(k));
    if (!r.ok) return null;
    const sn = (((await r.json()).items || [])[0] || {}).snippet;
    if (!sn) return null;
    const th = sn.thumbnails || {};
    const best = th.maxres || th.standard || th.high || th.medium || th.default || {};
    return { title: clean(sn.title), desc: String(sn.description || '').split('\n').find(l => l.trim()) || '', img: best.url, w: best.width, h: best.height };
  } catch (e) { return null; }
}

module.exports = async function (req, res) {
  const id = String((req.query && req.query.id) || '').trim();
  if (!/^[\w-]{11}$/.test(id)) { res.statusCode = 302; res.setHeader('Location', '/'); return res.end(); }
  const site = (process.env.SITE_URL || 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'noor-ul-hasrat.vercel.app')).replace(/\/$/, '');
  const v = (await info(id)) || {};
  const title = v.title || 'Hazrat Azam Pasha R.A. | Noor-ul-Hasrat';
  const desc = (v.desc || 'A dars Short of Hazrat Azam Pasha Rahmatullah Alaih, in Urdu with English captions.').slice(0, 200);
  const img = v.img || 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
  const app = site + '/?short=' + id, yt = 'https://www.youtube.com/shorts/' + id, embed = 'https://www.youtube.com/embed/' + id;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(site + '/s/' + id)}">
<meta property="og:site_name" content="Noor-ul-Hasrat">
<meta property="og:type" content="video.other">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(site + '/s/' + id)}">
<meta property="og:image" content="${esc(img)}">${v.w ? `\n<meta property="og:image:width" content="${v.w}"><meta property="og:image:height" content="${v.h}">` : ''}
<meta property="og:video" content="${esc(embed)}"><meta property="og:video:secure_url" content="${esc(embed)}">
<meta property="og:video:type" content="text/html"><meta property="og:video:width" content="1080"><meta property="og:video:height" content="1920">
<meta name="twitter:card" content="player"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}"><meta name="twitter:player" content="${esc(embed)}"><meta name="twitter:player:width" content="1080"><meta name="twitter:player:height" content="1920">
<meta http-equiv="refresh" content="1;url=${esc(app)}">
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f2a24;color:#f3e7c9;font:16px/1.5 Georgia,serif;text-align:center;padding:16px}a{color:#e8c46b}img{max-width:260px;border-radius:12px;display:block;margin:0 auto 14px}</style>
</head><body><div><img src="${esc(img)}" alt=""><div>${esc(title)}</div><p>Opening in the Noor-ul-Hasrat app…</p><p><a href="${esc(app)}">Open in the app</a> · <a href="${esc(yt)}">Watch on YouTube</a></p></div>
<script>location.replace(${JSON.stringify(app)})</script></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400');
  res.end(html);
};
