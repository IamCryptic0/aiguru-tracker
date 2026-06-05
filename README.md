# AI Guru — Task Tracker

A lightweight, shared task tracker for the AI Guru rollout. Tasks group into
modules with subtasks (numbered 1·2·3 / lettered A·B·C), color-coded by
**priority** and **status**, with live metrics. State is shared across everyone
via a cloud store, gated behind a team login, and new tasks ping a Google Chat
space.

## Features

- **Tasks → subtasks** with priority (P0/P1/P2), status, multiple owners,
  dependencies, timeline, notes.
- **Color coding** by priority (left border) and status (row tint + badge).
- **Live metrics** — counts by status and priority, completion %.
- **Shared cloud state** via Vercel Blob — everyone sees the same board, with
  ~5s auto-refresh polling and a sync indicator.
- **Login gate** — single shared team password (optional; open mode if unset).
- **Google Chat alerts** — adding a task posts a message to a space webhook and
  @mentions the assigned owners.
- **CSV export** for syncing back to a spreadsheet.

## Tech / layout

Static front-end + Vercel serverless functions. No build step.

```
.
├── index.html            # main app
├── login.html            # login page
├── assets/
│   ├── styles.css        # all styles
│   ├── data.js           # constants + seed data + helpers
│   ├── app.js            # UI, rendering, sync, notifications
│   └── login.js          # login page logic
├── api/
│   ├── state.js          # GET/POST shared board state (Vercel Blob)
│   ├── auth.js           # POST login / logout (signed session cookie)
│   └── notify.js         # POST -> Google Chat webhook (server-side)
├── lib/
│   ├── auth.js           # cookie signing / verification helpers
│   └── members.js        # owner name -> { email, chatId } mention map
├── vercel.json
├── package.json
└── .env.example
```

## Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (and in
`.env.local` for local `vercel dev`):

| Variable | Required | Purpose |
|---|---|---|
| `APP_PASSWORD` | optional | Team login password. Unset ⇒ open mode (no login). |
| `APP_SECRET` | recommended | Signs session cookies. Long random string. |
| `GCHAT_WEBHOOK_URL` | optional | Google Chat incoming webhook. Unset ⇒ alerts skipped. |
| `BLOB_READ_WRITE_TOKEN` | auto | Added when a Vercel Blob store is connected. |

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deploy (GitHub → Vercel)

1. Push this folder to a GitHub repo.
2. In Vercel, **New Project → Import** the repo (framework preset: *Other*).
3. **Storage → Connect a Blob store** to the project (creates
   `BLOB_READ_WRITE_TOKEN`).
4. Add `APP_PASSWORD`, `APP_SECRET`, `GCHAT_WEBHOOK_URL`.
5. Deploy. Every push to the default branch auto-deploys.

## Google Chat mentions

A webhook can only **@mention** a person by their **Google Chat user ID**
(a number), not their email. Fill in `lib/members.js`:

```js
export const MEMBERS = {
  "Ashok":    { email: "ashok@example.com",    chatId: "1234567890" },
  "Abhishek": { email: "abhishek@example.com", chatId: "9876543210" },
};
```

The map key must match the **owner name** typed in the tracker. Until a `chatId`
is provided, that owner shows as bold text (no ping). To find a chatId, use the
Chat API `spaces.members.list` or the Admin SDK Directory API and read the
trailing number of the member's `name` field.

## Notes

- Concurrency is **last-write-wins**; polling pulls in others' changes and
  pauses while a modal is open so it never clobbers an in-progress edit.
- The Blob store is public-access; the state URL is unguessable but not secret.
  The login gate protects the `/api` endpoints.
