/*
 * members.js — maps the owner NAME used in the tracker to their identity.
 *
 * `chatId` is the person's Google Chat user ID (a number like "1234567890"),
 * NOT their email. A webhook can only @mention someone by this ID.
 *
 * Until a chatId is filled in, that owner appears as bold text in the Chat
 * message instead of a real @mention (still useful, just not a ping).
 *
 * How to find a chatId (one option):
 *   - In the Google Chat space, @mention the person in a normal message.
 *   - Use the Chat API `spaces.members.list`, or the Admin SDK Directory API,
 *     to read their `name` field — the trailing number is the chatId.
 *   See README.md → "Google Chat mentions".
 */
export const MEMBERS = {
  // "Ashok":    { email: "ashok@example.com",    chatId: "" },
  // "Abhishek": { email: "abhishek@example.com", chatId: "" },
};

/** Build a Chat mention string for an owner name. */
export function mentionFor(name) {
  const m = MEMBERS[name];
  if (m && m.chatId) return `<users/${m.chatId}>`;
  return `*${name}*`;
}
