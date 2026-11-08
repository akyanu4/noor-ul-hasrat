/* Sends the app's emails through a Gmail account (free, about 500 emails a day).
   Vercel environment: GMAIL_USER (the address, e.g. noorulhasrat.app@gmail.com) and GMAIL_APP_PASSWORD
   (a 16-letter "app password" made in that Google account under Security → 2-Step Verification → App passwords). */
let transport = null;

function getTransport(env) {
  if (!transport) {
    const nodemailer = require('nodemailer');
    transport = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true,
      auth: { user: env.GMAIL_USER, pass: String(env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '') } });
  }
  return transport;
}

function ready(env) { return !!(env.GMAIL_USER && env.GMAIL_APP_PASSWORD); }

function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// A plain, phone-friendly email body. `blocks` is HTML the caller has already escaped.
function layout(title, blocks, site, footer) {
  return '<!doctype html><html><body style="margin:0;background:#f4efe3;font-family:Segoe UI,Roboto,Arial,sans-serif;color:#1a2421">' +
    '<div style="max-width:520px;margin:0 auto;padding:20px 14px">' +
    '<div style="background:#0f3d3e;color:#f5f1e2;border-radius:14px 14px 0 0;padding:16px 18px;font-size:13px;letter-spacing:.06em;text-transform:uppercase">Noor-ul-Hasrat</div>' +
    '<div style="background:#fff;border:1px solid #e4ddc9;border-top:0;border-radius:0 0 14px 14px;padding:18px">' +
    '<h1 style="font-size:20px;margin:0 0 12px">' + esc(title) + '</h1>' + blocks + '</div>' +
    '<p style="font-size:12px;color:#6b7570;line-height:1.5;margin:14px 4px">' + (footer || ('You get this because you asked for it in the Noor-ul-Hasrat app. To stop these emails, open the app → More → My Account and turn them off.')) +
    ' <a href="' + esc(site) + '" style="color:#0f3d3e">' + esc(site.replace(/^https?:\/\//, '')) + '</a></p></div></body></html>';
}

function button(href, label) {
  return '<p style="margin:18px 0"><a href="' + esc(href) + '" style="display:inline-block;background:#0f3d3e;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">' + esc(label) + '</a></p>';
}

async function send(env, msg) {
  const from = '"Noor-ul-Hasrat" <' + env.GMAIL_USER + '>';
  return getTransport(env).sendMail(Object.assign({ from }, msg));
}

module.exports = { ready, send, layout, button, esc, _setTransport: t => { transport = t; } };
