import { useState, useEffect } from "react"
import VideoCard from "../../components/cards/VideoCard"
import api from "../../services/api"
import { RiFireLine } from "react-icons/ri"

export default function Trending() {
  const [videos, setVideos]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState("")

  useEffect(() => {
    let cancelled = false

    async function fetchTrending() {
      try {
        setLoading(true)
        const res = await api.get("/videos", {
          params: { page: 1, limit: 20, sortBy: "views", sortType: "desc" }
        })
        if (!cancelled) setVideos(res.data.data.docs || [])
      } catch {
        if (!cancelled) setError("Failed to load trending videos.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchTrending()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="px-6 py-6">
      <div className="max-w-[1100px] mx-auto">

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Trending</h1>
              <p className="text-sm text-zinc-500">What the world is watching right now.</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-20 text-zinc-600 text-sm">{error}</div>
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <RiFireLine className="text-amber-400 text-2xl" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-300 mb-1">No trending videos yet</p>
                  <p className="text-xs text-zinc-600">Once videos rack up views, they'll show up here.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-7 pb-8">
                {videos.map(video => <VideoCard key={video._id} video={video} />)}
              </div>
            )}

      </div>
    </div>
  )
}
