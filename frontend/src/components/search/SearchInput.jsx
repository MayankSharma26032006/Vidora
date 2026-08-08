import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import useDebounce from "../../hooks/useDebounce"
import { RiSearchLine, RiCloseLine, RiTimeLine, RiUserSmileLine } from "react-icons/ri"

const RECENT_KEY = "vidora_recent_searches"
const MAX_RECENT = 6

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").slice(0, MAX_RECENT)
  } catch {
    return []
  }
}

function saveRecent(term) {
  const next = [term, ...loadRecent().filter(t => t.toLowerCase() !== term.toLowerCase())].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
}

// Search box with a YouTube-style suggestions dropdown:
// - recent searches (localStorage) when focused/empty
// - live autocomplete of matching video titles + channel names while typing
export default function SearchInput() {
  const navigate                    = useNavigate()
  const inputRef                    = useRef(null)
  const [query, setQuery]           = useState("")
  const [recent]                    = useState(loadRecent)
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen]             = useState(false)
  const [active, setActive]         = useState(-1)

  const debouncedQuery = useDebounce(query, 250)

  useEffect(() => { inputRef.current?.focus() }, [])

  // Live autocomplete — top matching video titles + channel names
  useEffect(() => {
    const q = debouncedQuery.trim()
    if (!q) return
    let cancelled = false

    api.get("/videos", { params: { query: q, page: 1, limit: 8, sortBy: "views", sortType: "desc" } })
      .then(res => {
        if (cancelled) return
        const docs = res.data?.data?.docs || []
        const seen = new Set()
        const items = []
        for (const v of docs) {
          const title = v.title?.trim()
          if (title && title.toLowerCase().includes(q.toLowerCase())) {
            const key = "v:" + title.toLowerCase()
            if (!seen.has(key)) { seen.add(key); items.push({ term: title, type: "video" }) }
          }
          const channel = v.owner?.username?.trim()
          if (channel && channel.toLowerCase().includes(q.toLowerCase())) {
            const key = "c:" + channel.toLowerCase()
            if (!seen.has(key)) { seen.add(key); items.push({ term: channel, type: "channel" }) }
          }
          if (items.length >= 6) break
        }
        setSuggestions(items)
      })
      .catch(() => { if (!cancelled) setSuggestions([]) })

    return () => { cancelled = true }
  }, [debouncedQuery])

  const showRecent = !query.trim() && recent.length > 0
  const items = showRecent
    ? recent.map(t => ({ term: t, type: "recent" }))
    : debouncedQuery.trim() ? suggestions : []

  function runSearch(term) {
    const t = term.trim()
    if (!t) return
    saveRecent(t)
    setQuery(t)          // fill the search bar with the selected term (YouTube-style)
    setOpen(false)
    setActive(-1)
    navigate(`/search?q=${encodeURIComponent(t)}`)
    // Deliberately keep the search bar open with the term visible, like
    // YouTube — the user dismisses it with the back arrow. (Closing it here
    // made the suggestion feel like a dead "showpiece": the term vanished.)
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      if (items.length) { e.preventDefault(); setActive(i => (i + 1) % items.length) }
    } else if (e.key === "ArrowUp") {
      if (items.length) { e.preventDefault(); setActive(i => (i - 1 + items.length) % items.length) }
    } else if (e.key === "Enter") {
      if (active >= 0 && items[active]) { e.preventDefault(); runSearch(items[active].term) }
    } else if (e.key === "Escape") {
      setOpen(false)
      setActive(-1)
    }
  }

  return (
    <div className="relative flex-1" onKeyDown={handleKeyDown}>
      <form
        onSubmit={(e) => { e.preventDefault(); runSearch(query) }}
        className="flex flex-1 items-center bg-white/[0.06] border border-white/[0.08] rounded-full px-4 py-2.5 gap-3 focus-within:border-amber-500/50 transition-colors"
      >
        <RiSearchLine className="text-zinc-500 text-[17px] shrink-0" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(-1) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => { setOpen(false); setActive(-1) }, 120)}
          aria-label="Search creators and videos"
          aria-expanded={open}
          aria-controls="search-suggestions"
          placeholder="Search creators and videos..."
          className="bg-transparent flex-1 text-sm text-white placeholder:text-zinc-500 outline-none"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus() }} aria-label="Clear search" className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0">
            <RiCloseLine className="text-[17px]" />
          </button>
        )}
      </form>

      {open && items.length > 0 && (
        <div
          id="search-suggestions"
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-[calc(100%+8px)] left-0 right-0 bg-zinc-900 border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 py-1.5"
        >
          {showRecent && (
            <p className="px-4 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Recent searches</p>
          )}
          {items.map((item, i) => (
            <button
              key={`${item.type}-${item.term}`}
              role="option"
              aria-selected={i === active}
              // Keep focus on the input when clicking an option, otherwise the
              // input's onBlur closes the dropdown mid-click and slow clicks
              // are silently dropped (the button unmounts before mouseup).
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => runSearch(item.term)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${i === active ? "bg-white/[0.06] text-white" : "text-zinc-300"}`}
            >
              {item.type === "recent" ? (
                <RiTimeLine className="text-[15px] text-zinc-500 shrink-0" />
              ) : item.type === "channel" ? (
                <RiUserSmileLine className="text-[15px] text-amber-400/80 shrink-0" />
              ) : (
                <RiSearchLine className="text-[15px] text-zinc-500 shrink-0" />
              )}
              <span className="truncate">{item.term}</span>
              {item.type !== "recent" && (
                <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide text-zinc-600">
                  {item.type === "channel" ? "Channel" : "Video"}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
