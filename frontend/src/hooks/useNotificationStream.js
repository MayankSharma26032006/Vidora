import { useEffect, useRef } from "react"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"


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
        
      }
    }

    
    

    return () => es.close()
  }, [enabled])
}
