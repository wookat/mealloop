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

export async function sendSubscribeConfirm(env, email, confirmToken, unsubToken) {
  const site = env.SITE_URL || 'https://mealloop.zalize.com';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: 'MealLoop <mealloop@zalize.com>',
      to: [email],
      subject: 'Confirm your MealLoop updates subscription',
      text: `You (or someone using this address) asked to get MealLoop product updates.\n\nConfirm your subscription:\n${site}/subscribe/confirm?t=${confirmToken}\n\nIf you didn't request this, ignore this email — you won't be subscribed.\n\nUnsubscribe any time: ${site}/unsubscribe?t=${unsubToken}`,
      headers: {
        'List-Unsubscribe': `<${site}/unsubscribe?t=${unsubToken}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  });
  return res.ok;
}

export async function sendWelcome(env, email, unsubToken) {
  const site = env.SITE_URL || 'https://mealloop.zalize.com';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: 'MealLoop <mealloop@zalize.com>',
      to: [email],
      subject: 'Welcome to MealLoop — plan your first week in a minute',
      text: `Thanks for confirming — you're on the MealLoop updates list.\n\nIf you haven't tried the app yet, here's the one-minute version:\n1. Add a recipe — paste any recipe URL, or type one in: ${site}/app/recipes\n2. Plan a dinner on your week.\n3. Click "Add week's ingredients" — your grocery list writes itself, sorted by aisle.\n\nShare your list with the household from the Share page; anyone can check things off at the store, no account needed.\n\nEverything is free during the open beta: ${site}\n\n— MealLoop (Zalize)\n\nUnsubscribe any time: ${site}/unsubscribe?t=${unsubToken}`,
      headers: {
        'List-Unsubscribe': `<${site}/unsubscribe?t=${unsubToken}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
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
