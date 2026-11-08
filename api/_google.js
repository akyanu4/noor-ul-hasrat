/* Server-side Google helpers for the account features (files starting with "_" are not Vercel functions).
   Uses the Firebase service account in FIREBASE_SERVICE_ACCOUNT (the JSON from Firebase console → Project settings →
   Service accounts → Generate new private key, pasted whole into a Vercel environment variable). No SDK: plain JWTs.
     - customToken(): signs a Firebase custom token, so the app can sign a person in after they open their email link.
     - db(): reads and writes the Realtime Database with full access (the database rules do not apply to it). */
const crypto = require('crypto');

const DEFAULT_RTDB = 'https://siddiqgulshan-25903-default-rtdb.firebaseio.com';
const b64u = x => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');

function serviceAccount(env) {
  const raw = env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');
  let j; try { j = JSON.parse(raw); } catch (e) { throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON'); }
  if (!j.client_email || !j.private_key) throw new Error('FIREBASE_SERVICE_ACCOUNT is missing client_email or private_key');
  return { email: j.client_email, key: j.private_key.replace(/\\n/g, '\n') };
}

function jwt(payload, key) {
  const head = b64u({ alg: 'RS256', typ: 'JWT' }) + '.' + b64u(payload);
  return head + '.' + crypto.sign('RSA-SHA256', Buffer.from(head), key).toString('base64url');
}

// One stable account id per email address, so the same person gets the same account on every phone.
function uidFor(email) { return 'm' + crypto.createHash('sha256').update('noor:' + String(email).trim().toLowerCase()).digest('hex').slice(0, 27); }

// A Firebase custom token (valid 1 hour). `claims` show up in the database rules as auth.token.<name>.
function customToken(env, uid, claims, nowS) {
  const sa = serviceAccount(env);
  nowS = nowS || Math.floor(Date.now() / 1000);
  return jwt({ iss: sa.email, sub: sa.email, aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: nowS, exp: nowS + 3600, uid, claims }, sa.key);
}

let cached = null, pending = null;
function accessToken(env, fetchFn) {
  const nowS = Math.floor(Date.now() / 1000);
  if (cached && cached.exp - 120 > nowS) return Promise.resolve(cached.tok);
  if (!pending) pending = fetchToken(env, fetchFn, nowS).finally(() => { pending = null; });   // one request even when several calls start together
  return pending;
}
async function fetchToken(env, fetchFn, nowS) {
  const sa = serviceAccount(env);
  const assertion = jwt({ iss: sa.email, scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
    aud: 'https://oauth2.googleapis.com/token', iat: nowS, exp: nowS + 3600 }, sa.key);
  const r = await fetchFn('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + assertion });
  if (!r.ok) throw new Error('Google sign-in for the server failed (' + r.status + ')');
  const d = await r.json();
  cached = { tok: d.access_token, exp: nowS + (d.expires_in || 3600) };
  return cached.tok;
}

function db(env, fetchFn) {
  const base = String(env.RTDB_URL || DEFAULT_RTDB).replace(/\/+$/, '');
  async function call(method, path, body, query) {
    const tok = await accessToken(env, fetchFn);
    const u = base + '/' + String(path).replace(/^\/+/, '') + '.json?access_token=' + encodeURIComponent(tok) + (query ? '&' + query : '');
    const init = { method };
    if (body !== undefined) { init.body = JSON.stringify(body); init.headers = { 'Content-Type': 'application/json' }; }
    const r = await fetchFn(u, init);
    if (!r.ok) throw new Error('database ' + method + ' ' + path + ' failed (' + r.status + ')');
    return r.json();
  }
  return {
    get: (p, q) => call('GET', p, undefined, q),
    put: (p, v) => call('PUT', p, v),
    patch: (p, v) => call('PATCH', p, v),
    del: p => call('DELETE', p)
  };
}

module.exports = { serviceAccount, jwt, uidFor, customToken, db, _reset: () => { cached = null; pending = null; } };
