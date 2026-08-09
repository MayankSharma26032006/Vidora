


const clients = new Map()





const MAX_CONNECTIONS_PER_USER = 3

export function addSSEClient(userId, res) {
  const key = userId?.toString?.() || userId
  if (!key) return
  if (!clients.has(key)) clients.set(key, new Set())
  const set = clients.get(key)
  if (set.size >= MAX_CONNECTIONS_PER_USER) {
    const oldest = set.values().next().value
    set.delete(oldest)
    try { oldest.end() } catch {  }
  }
  set.add(res)
}

export function removeSSEClient(userId, res) {
  const key = userId?.toString?.() || userId
  if (!key) return
  clients.get(key)?.delete(res)
  if (clients.get(key)?.size === 0) clients.delete(key)
}


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
      
    }
  }
}

