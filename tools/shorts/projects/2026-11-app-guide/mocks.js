// Network mocks for recording the app offline: YouTube Data API (the Shorts list from /tmp/shtest/test.js), real
// thumbnails for i.ytimg.com (work/thumbs, built by thumbs.py), Firebase Auth + Realtime Database (in memory),
// Google Fonts served from work/fonts (fetch with: npm pack @fontsource/inter @fontsource/amiri; Nastaliq from tools/shorts/.fonts).
const fs = require('fs'), path = require('path');
const HERE = __dirname, TH = path.join(HERE, 'work', 'thumbs'), FD = path.join(HERE, 'work', 'fonts');
const now = Date.now(), day = 86400000;
const S = [ // id, title, days ago
 ['TgmQQhX_8tU','Our Soul Was Born',30],['PO-sKtkwc60','From the Womb to the Grave',30],['pWWkdTuJM9c','The Scale',30],['N-8fydZ8lg4','With the One You Love',30],['JCBJ2SK79Q8','Islam and Iman',30],['X4CTCYjFU3o','The Blessed Malida',30],
 ['VlU4EcJGVgQ','The Hand of Allah',25],['r3x7LQru71I',"The Camel's Rein",25],['ObW6ccXEwn4','Two and Two Make Four',25],['gkYbWlFLc3w','A Wali Recognises a Wali',25],['56xW_CnWB0w','The Stone and the Pebble',25],['883RmkRT9mE','Whoever Has No Pir',25],['T4cTs3h1QoI','The Murids Will Rise',24],['50SwaP11-vk','You Have Become My Teacher',24],['TkSFt5BlMzs',"What Is Bai'at? Hand Upon Hand",24],['ufZ_iEByRmI','Why One Trusted Guide?',24],['mWwJL6BTEZY','Neither That Master Nor That Murid',24],['0yhKLLlv5ww',"How to Take Bai'at: Step by Step",23],
 ['iYb70KSdYD4','Your Work Is Only to Pray',15],['cl0bggXGqRk','With the One You Love',15],['Rk6u-LffRrg','Many Paths, One Goal',15],
 ['u6BHgjCPuCo','The Reality of Tawbah',12],['_l27DFmjd6w','As If Newly Born',12],['pqjEFcL1Nlo','Soul and Body',12],['SHyAucT3ojs','The Body Is a Horse',12],['ta6pdvvmJBQ','Fear and Hope',12],['dyHUfOLlVTs','Tasawwur-e-Shaykh: Hold My Picture in Your Heart',12],
 ['oWZt1YfJ3io','Eat Less, Sleep Less, Speak Less',10],['Vz_I-E521r8','The Sufi Is the Son of Time',10],['le1EA7cNRAA','Not Working Is Not Tawakkul',10],['EIcNQnQ_TkQ','Istikhara: Ask Allah First',10],['KCmXwBTioD4','Two Rakats Better Than a Hundred',10],
 ['mwPT8CFRfR0','Sabr, Tasleem, Raza',9],['Imuwo7g6UzE','The Straight Path Is the Shortest',9],['7CIgqlzMN1E','Do Not Think the Snake Is Dead',9],['B-NjNa3UUJ4','The Dog at the Door',9],
 ['cfKWk-fq-BQ','A Passing Thought or a Resolve',1],['PvTqdGvfuQw','Keep Your Gaze on Your Steps',1],['UFGrLXEdwmk','The Eyes Are Hunters',1],['2zH6zC_Z8P4','What Opened My Eyes',1],['trMoVHtadHI','Where Will You Find Tawheed?',1],
];
const items = S.map(([id, t, d], i) => ({ snippet: { title: t + ' #shorts', description: 'Hazrat Azam Pasha', publishedAt: new Date(now - d * day - i * 60000).toISOString(), resourceId: { videoId: id } } }));
const FALLBACK = fs.readFileSync(path.join(TH, '_fallback.jpg'));
function thumb(id) { const f = path.join(TH, id + '.jpg'); return fs.existsSync(f) ? fs.readFileSync(f) : FALLBACK; }
const FONTS = [['Inter', 400, 'inter-latin-400'], ['Inter', 500, 'inter-latin-500'], ['Inter', 600, 'inter-latin-600'], ['Inter', 700, 'inter-latin-700'],
  ['Amiri', 400, 'amiri-arabic-400'], ['Amiri', 700, 'amiri-arabic-700'], ['Amiri', 400, 'amiri-latin-400'], ['Amiri', 700, 'amiri-latin-700'],
  ['Noto Nastaliq Urdu', 400, 'noto-nastaliq-urdu-arabic-400'], ['Noto Nastaliq Urdu', 700, 'noto-nastaliq-urdu-arabic-700']];
const FONT_CSS = FONTS.map(([f, w, n]) => `@font-face{font-family:'${f}';font-weight:${w};font-style:normal;font-display:block;src:url(/__fonts/${n}-normal.woff2) format('woff2')}`).join('\n');

// signedIn: put a member session in localStorage before the app loads (email link sign-in done)
async function install(ctx, opts = {}) {
  const db = {};   // in-memory Realtime Database: path -> value
  const tok = { idToken: 'demo-id', refreshToken: 'demo-refresh', expiresIn: '3600', localId: 'demo-uid' };
  await ctx.route(/^https?:\/\/(?!localhost)/, async r => {
    const req = r.request(), u = req.url(), m = req.method();
    if (u.includes('/__fonts/')) return r.fulfill({ status: 200, contentType: 'font/woff2', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(path.join(FD, path.basename(new URL(u).pathname))) });
    if (u.includes('fonts.googleapis.com')) return r.fulfill({ status: 200, contentType: 'text/css', body: FONT_CSS });
    if (u.includes('i.ytimg.com')) { const id = (u.match(/\/vi\/([\w-]{11})\//) || [])[1]; return r.fulfill({ status: 200, contentType: 'image/jpeg', body: thumb(id) }); }
    if (u.includes('googleapis.com/youtube/v3/playlistItems')) {
      const json = u.includes('UUSHn5J7zggR3cV4sCYlEjgZJA') ? { items } : { items: [] };
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
    }
    if (u.includes('googleapis.com/youtube/v3/videos')) {
      const ids = (new URL(u).searchParams.get('id') || '').split(',');
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: ids.map(id => ({ id, statistics: { viewCount: String(1000 + (id.charCodeAt(0) * 37) % 5000), likeCount: String((id.charCodeAt(1) * 13) % 300) } })) }) });
    }
    if (u.includes('googleapis.com/youtube')) return r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' });
    if (u.includes('identitytoolkit.googleapis.com')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(tok) });
    if (u.includes('securetoken.googleapis.com')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id_token: 'demo-id', refresh_token: 'demo-refresh', expires_in: '3600', user_id: 'demo-uid' }) });
    if (u.includes('firebaseio.com')) {
      const p = new URL(u).pathname.replace(/\.json$/, '');
      if (m === 'GET') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(p in db ? db[p] : null) });
      let v = null; try { v = JSON.parse(req.postData() || 'null'); } catch (e) {}
      if (m === 'PUT') db[p] = v; else if (m === 'PATCH') db[p] = Object.assign({}, db[p] || {}, v);
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(m === 'POST' ? { name: '-demo' + Date.now() } : v) });
    }
    if (u.includes('/api/')) return r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    return r.abort();
  });
  // the Shorts viewer's YouTube player: the Short's own picture, slowly moving, with a progress line (YouTube is not reachable here)
  await ctx.route(/youtube(-nocookie)?\.com\/embed\//, r => {
    const id = (r.request().url().match(/embed\/([\w-]{11})/) || [])[1] || '';
    r.fulfill({ status: 200, contentType: 'text/html', body: `<!doctype html><html><body style="margin:0;background:#000;overflow:hidden"><img src="https://i.ytimg.com/vi/${id}/oardefault.jpg" style="width:100%;height:100vh;object-fit:cover;animation:z 14s linear forwards"><div style="position:fixed;left:0;bottom:0;height:3px;background:#f00;animation:p 30s linear forwards"></div><style>@keyframes z{to{transform:scale(1.12)}}@keyframes p{from{width:0}to{width:100%}}</style></body></html>` });
  });
  await ctx.route(/^http:\/\/localhost:\d+\/__fonts\//, r => r.fulfill({ status: 200, contentType: 'font/woff2', body: fs.readFileSync(path.join(FD, path.basename(new URL(r.request().url()).pathname))) }));
  await ctx.route(/^http:\/\/localhost:\d+\/api\//, r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  if (opts.signedIn) await ctx.addInitScript(() => {
    if (!localStorage.getItem('noor_auth')) localStorage.setItem('noor_auth', JSON.stringify({ uid: 'demo-uid', id: 'demo-id', refresh: 'demo-refresh', exp: Date.now() + 86400000, em: 'reader@example.com' }));
  });
}
module.exports = { install, items, S };
