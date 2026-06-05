import { put, head } from '@vercel/blob';
import { isAuthed } from '../lib/auth.js';

const KEY = 'state.json';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      try {
        const meta = await head(KEY);
        const r = await fetch(meta.url, { cache: 'no-store' });
        const json = await r.json();
        return res.status(200).json(json);
      } catch (e) {
        // No state stored yet
        return res.status(200).json({ data: null, collapsed: {}, updatedAt: 0 });
      }
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body || '{}'); } catch (_) { body = {}; } }
      if (!body || typeof body !== 'object') body = {};
      const updatedAt = Date.now();
      const payload = JSON.stringify({
        data: Array.isArray(body.data) ? body.data : [],
        collapsed: body.collapsed && typeof body.collapsed === 'object' ? body.collapsed : {},
        updatedAt,
      });
      await put(KEY, payload, {
        access: 'public',
        contentType: 'application/json',
        allowOverwrite: true,
        addRandomSuffix: false,
        cacheControlMaxAge: 0,
      });
      return res.status(200).json({ ok: true, updatedAt });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
