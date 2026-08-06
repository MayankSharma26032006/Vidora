import { useEffect, useRef } from "react"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"

/**
 * Opens a Server-Sent Events connection to the backend and calls `onChange`
 * whenever the user's notifications change (created / removed / read).
 * The connection auto-reconnects (built into EventSource); the regular
 * polling in the Navbar / Notifications page acts as a fallback.
 */
export default function useNotificationStream(enabled, onChange) {
  const cbRef = useRef(onChange)

  useEffect(() => {
    cbRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!enabled) return undefined

    const es = new EventSource(`${API_BASE}/notifications/stream`, {
      withCredentials: true,
    })

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === "notifications-changed") cbRef.current?.()
      } catch {
        // ignore malformed frames (heartbeats, etc.)
      }
    }

    // onerror: EventSource reconnects automatically; the fallback poll covers
    // the window while reconnecting, so there is nothing to do here.

    return () => es.close()
  }, [enabled])
}
