/**
 * Lightweight in-memory registry of Server-Sent Events connections,
 * keyed by user id. Used to push "your notifications changed" events
 * to every open tab of a user the moment a notification is created,
 * removed, or marked as read — no refresh needed.
 */

// userId (string) -> Set<http.ServerResponse>
const clients = new Map()

// A real browser tab needs exactly one connection. Cap per-user connections so
// a buggy client (or an attacker) can't hold unbounded sockets / memory by
// opening EventSource repeatedly. When the cap is hit, the oldest connection is
// evicted — the client auto-reconnects and gets a fresh slot.
const MAX_CONNECTIONS_PER_USER = 3

export function addSSEClient(userId, res) {
  const key = userId?.toString?.() || userId
  if (!key) return
  if (!clients.has(key)) clients.set(key, new Set())
  const set = clients.get(key)
  if (set.size >= MAX_CONNECTIONS_PER_USER) {
    const oldest = set.values().next().value
    set.delete(oldest)
    try { oldest.end() } catch { /* already gone */ }
  }
  set.add(res)
}

export function removeSSEClient(userId, res) {
  const key = userId?.toString?.() || userId
  if (!key) return
  clients.get(key)?.delete(res)
  if (clients.get(key)?.size === 0) clients.delete(key)
}

/** Write a JSON payload to every open connection of a user (best-effort). */
export function publishToUser(userId, payload) {
  const key = userId?.toString?.() || userId
  if (!key) return
  const set = clients.get(key)
  if (!set || set.size === 0) return
  const data = `data: ${JSON.stringify(payload)}\n\n`
  for (const res of set) {
    try {
      res.write(data)
    } catch {
      // connection is gone; the close handler will clean it up
    }
  }
}

