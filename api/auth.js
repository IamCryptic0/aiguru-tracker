import { makeToken, SESSION_COOKIE } from '../lib/auth.js';

const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body || '{}'); } catch (_) { body = {}; } }
  if (!body || typeof body !== 'object') body = {};

  // Logout
  if (body.action === 'logout') {
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
    return res.status(200).json({ ok: true });
  }

  const expected = process.env.APP_PASSWORD;
  // Open mode: no password configured
  if (!expected) return res.status(200).json({ ok: true, open: true });

  if (body.password && body.password === expected) {
    const token = makeToken();
    res.setHeader('Set-Cookie',
      `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`);
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false, error: 'Invalid password' });
}
