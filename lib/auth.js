import crypto from 'crypto';

const SECRET = process.env.APP_SECRET || 'dev-insecure-secret-change-me';

/** Create a signed session token. */
export function makeToken() {
  const payload = `aig.${Date.now()}`;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

/** Verify a session token's signature. */
export function verifyToken(token) {
  if (!token) return false;
  const i = token.lastIndexOf('.');
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch (_) {
    return false;
  }
}

/** Parse the Cookie header into a plain object. */
export function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

/**
 * Is the request authenticated?
 * If APP_PASSWORD is not set, the app runs in open mode (no login required).
 */
export function isAuthed(req) {
  if (!process.env.APP_PASSWORD) return true;
  return verifyToken(parseCookies(req).aig_session);
}

export const SESSION_COOKIE = 'aig_session';
