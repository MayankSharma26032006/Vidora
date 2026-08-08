import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import VideoCard from "../../components/cards/VideoCard"
import useDebounce from "../../hooks/useDebounce"
import api from "../../services/api"
import { RiSearchLine } from "react-icons/ri"

const SORT_OPTIONS = ["Relevance", "Upload date", "View count", "Rating"]

export default function Search() {
  const [searchParams, setSearchParams]   = useSearchParams()
  const urlQuery = searchParams.get("q") || ""
  const [query, setQuery]                 = useState(urlQuery)
  const [sortBy, setSortBy]               = useState("Relevance")

  // Reset the search when the URL changes while mounted (e.g. picking a
  // suggestion from the navbar search box while already on /search). React's
  // render-time state adjustment — only fires when the URL actually changed,
  // so it never clobbers what the user is currently typing.
  const [prevUrlQuery, setPrevUrlQuery]   = useState(urlQuery)
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery)
    setQuery(urlQuery)
  }
  const [videos, setVideos]               = useState([])
  const [loading, setLoading]             = useState(false)

  // Live search as you type (debounced), still syncs the URL on submit
  const debouncedQuery = useDebounce(query, 350)

  useEffect(() => {
    let cancelled = false

    async function fetchResults() {
      const q = debouncedQuery.trim()
      if (!q) {
        setVideos([])
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const sortMap = { "Upload date": "createdAt", "View count": "views", "Relevance": "createdAt", "Rating": "views" }
        const res = await api.get("/videos", {
          params: { query: q, page: 1, limit: 20, sortBy: sortMap[sortBy] || "createdAt", sortType: "desc" }
        })
        if (!cancelled) setVideos(res.data.data.docs || [])
      } catch {
        if (!cancelled) setVideos([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchResults()
    return () => { cancelled = true }
  }, [debouncedQuery, sortBy])

  function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setSearchParams({ q: query })
  }

  return (
    <div className="px-6 py-6">
      <div className="max-w-[1100px] mx-auto">

            <form onSubmit={handleSearch} className="relative mb-6">
              <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search videos, creators, playlists..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-900 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
              />
            </form>

            <div className="flex items-center justify-end gap-4 mb-6">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-xl border border-white/[0.08] bg-zinc-900 text-sm text-zinc-400 outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map(o => <option key={o} value={o} className="bg-zinc-900">{o}</option>)}
              </select>
            </div>

            {query && (
              <p className="text-xs text-zinc-600 mb-5">
                {videos.length} results for <span className="text-zinc-400">"{query}"</span>
              </p>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-7">
                {videos.map(video => <VideoCard key={video._id} video={video} />)}
                {!loading && query && videos.length === 0 && (
                  <div className="col-span-3 flex items-center justify-center py-20 text-zinc-600 text-sm">
                    No results found for "{query}"
                  </div>
                )}
              </div>
            )}

      </div>
    </div>
  )
}
