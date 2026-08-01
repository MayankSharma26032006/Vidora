import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import VideoCard from "../../components/cards/VideoCard"
import api from "../../services/api"
import { RiSearchLine, RiEqualizerLine } from "react-icons/ri"

const FILTERS = ["All", "Videos", "Channels", "Playlists", "Live"]
const SORT_OPTIONS = ["Relevance", "Upload date", "View count", "Rating"]

export default function Search() {
  const [searchParams, setSearchParams]   = useSearchParams()
  const [query, setQuery]                 = useState(searchParams.get("q") || "")
  const [activeFilter, setFilter]         = useState("All")
  const [sortBy, setSortBy]               = useState("Relevance")
  const [videos, setVideos]               = useState([])
  const [loading, setLoading]             = useState(false)

  useEffect(() => {
    const q = searchParams.get("q")
    if (q) { setQuery(q); fetchResults(q) }
  }, [searchParams])

  async function fetchResults(q) {
    if (!q?.trim()) return
    try {
      setLoading(true)
      const sortMap = { "Upload date": "createdAt", "View count": "views", "Relevance": "createdAt", "Rating": "views" }
      const res = await api.get("/videos", {
        params: { query: q, page: 1, limit: 20, sortBy: sortMap[sortBy] || "createdAt", sortType: "desc" }
      })
      setVideos(res.data.data.docs || [])
    } catch {
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setSearchParams({ q: query })
    fetchResults(query)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
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

            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <RiEqualizerLine className="text-zinc-500 text-[16px] shrink-0" />
                {FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeFilter === f ? "bg-white text-zinc-950" : "bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-200"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
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
        </main>
      </div>
    </div>
  )
}
