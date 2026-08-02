import { useEffect, useState } from "react"

// Returns `value` after it has stopped changing for `delay` ms —
// used to debounce fast-changing inputs like search queries.
export default function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
