import { uid, token } from './util.js';

const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days
const CODE_TTL = 60 * 10;

export async function sendMagicCode(env, email) {
  const sendKey = `sends:${email.toLowerCase()}`;
  const sends = parseInt((await env.KV.get(sendKey)) || '0', 10);
  if (sends >= 3) return false;
  await env.KV.put(sendKey, String(sends + 1), { expirationTtl: CODE_TTL });
  const code = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
  await env.KV.put(`code:${email.toLowerCase()}`, code, { expirationTtl: CODE_TTL });
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: 'MealLoop <mealloop@zalize.com>',
      to: [email],
      subject: `${code} is your MealLoop login code`,
      text: `Your MealLoop login code is ${code}. It expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`,
    }),
  });
  return res.ok;
}

export async function verifyCode(env, email, code) {
  const key = `code:${email.toLowerCase()}`;
  const attemptsKey = `attempts:${email.toLowerCase()}`;
  const attempts = parseInt((await env.KV.get(attemptsKey)) || '0', 10);
  if (attempts >= 5) {
    await env.KV.delete(key);
    return null;
  }
  const stored = await env.KV.get(key);
  if (!stored || stored !== code.trim()) {
    await env.KV.put(attemptsKey, String(attempts + 1), { expirationTtl: CODE_TTL });
    return null;
  }
  await env.KV.delete(key);
  await env.KV.delete(attemptsKey);
  let user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email.toLowerCase()).first();
  if (!user) {
    const id = uid();
    await env.DB.prepare('INSERT INTO users (id, email) VALUES (?, ?)').bind(id, email.toLowerCase()).run();
    user = { id, email: email.toLowerCase() };
  }
  const sess = token(32);
  await env.KV.put(`sess:${sess}`, user.id, { expirationTtl: SESSION_TTL });
  return sess;
}

export async function getUser(c) {
  const sess = getCookie(c.req.raw, 'ml_session');
  if (!sess) return null;
  const userId = await c.env.KV.get(`sess:${sess}`);
  if (!userId) return null;
  return c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
}

export async function logout(c) {
  const sess = getCookie(c.req.raw, 'ml_session');
  if (sess) await c.env.KV.delete(`sess:${sess}`);
}

export function sessionCookie(sess) {
  return `ml_session=${sess}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL}`;
}

export function clearCookie() {
  return 'ml_session=; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=0';
}

function getCookie(req, name) {
  const h = req.headers.get('Cookie') || '';
  const m = h.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? m[1] : null;
}
