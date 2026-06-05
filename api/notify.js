import { isAuthed } from '../lib/auth.js';
import { mentionFor } from '../lib/members.js';

function ownersOf(t) {
  return ((t && t.owner) || '').split(',').map((s) => s.trim()).filter(Boolean);
}
function mentions(t) {
  const o = ownersOf(t);
  return o.length ? o.map(mentionFor).join(' ') : '';
}

function buildText(ev) {
  const t = ev.task || {};
  const grp = t.group || ev.group || 'Ungrouped';
  switch (ev.kind) {
    case 'subtask_added': {
      const lines = [
        `🆕 *New subtask added* — _${grp}_`,
        `• *${t.sub}*`,
        `• Priority: *${t.prio || '—'}*  |  Status: *${t.status || '—'}*`,
      ];
      const m = mentions(t);
      if (m) lines.push(`• Assigned: ${m}`);
      if (t.desc) lines.push(`• ${t.desc}`);
      return lines.join('\n');
    }
    case 'subtask_updated': {
      const lines = [`✏️ *Subtask updated* — _${grp}_`, `• *${t.sub}*`];
      (ev.changes || []).forEach((c) => lines.push(`• ${c.label}: ${c.from} → *${c.to}*`));
      const m = mentions(t);
      if (m) lines.push(`• Assigned: ${m}`);
      return lines.join('\n');
    }
    case 'subtask_deleted': {
      const lines = [`🗑️ *Subtask deleted* — _${grp}_`, `• *${t.sub}*`];
      const m = mentions(t);
      if (m) lines.push(`• Was assigned: ${m}`);
      return lines.join('\n');
    }
    case 'task_added': {
      const lines = [`📦 *New task added*`, `• *${ev.group || grp}*`];
      if (ev.task && ev.task.sub) lines.push(`• First subtask: *${ev.task.sub}*`);
      return lines.join('\n');
    }
    case 'task_renamed':
      return `✏️ *Task renamed*\n• _${ev.from}_ → *${ev.to}*`;
    case 'task_deleted':
      return `🗑️ *Task deleted*\n• *${ev.group}*  (${ev.count || 0} subtask${ev.count === 1 ? '' : 's'} removed)`;
    default:
      return null;
  }
}

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
  // Back-compat: an older client sent { task } meaning a new subtask.
  const ev = body && (body.event || (body.task ? { kind: 'subtask_added', task: body.task } : null));
  if (!ev || !ev.kind) return res.status(400).json({ error: 'Missing event' });

  const text = buildText(ev);
  if (!text) return res.status(400).json({ error: 'Unknown event kind: ' + ev.kind });

  try {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ text }),
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
