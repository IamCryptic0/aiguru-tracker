import { isAuthed } from '../lib/auth.js';
import { mentionFor } from '../lib/members.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized' });

  const webhook = process.env.GCHAT_WEBHOOK_URL;
  if (!webhook) return res.status(200).json({ ok: false, skipped: 'GCHAT_WEBHOOK_URL not configured' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body || '{}'); } catch (_) { body = {}; } }
  const t = body && body.task;
  if (!t || !t.sub) return res.status(400).json({ error: 'Missing task' });

  const owners = (t.owner || '').split(',').map((s) => s.trim()).filter(Boolean);
  const mentions = owners.map(mentionFor).join(' ');

  const lines = [
    `🆕 *New task added* — _${t.group || 'Ungrouped'}_`,
    `• *${t.sub}*`,
    `• Priority: *${t.prio || '—'}*   |   Status: *${t.status || '—'}*`,
  ];
  if (owners.length) lines.push(`• Assigned: ${mentions}`);
  if (t.desc) lines.push(`• ${t.desc}`);

  try {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ text: lines.join('\n') }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return res.status(502).json({ ok: false, status: r.status, detail: detail.slice(0, 300) });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String((e && e.message) || e) });
  }
}
