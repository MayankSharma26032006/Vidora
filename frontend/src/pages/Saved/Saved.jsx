import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import VideoCard from "../../components/cards/VideoCard"
import { useAuth } from "../../context/AuthContext"
import api from "../../services/api"
import { RiBookmarkLine } from "react-icons/ri"

export default function Saved() {
  const { user }                  = useAuth()
  const [videos, setVideos]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState("")

  useEffect(() => {
    let cancelled = false

    async function fetchSaved() {
      if (!user?._id) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const res = await api.get("/user/saved-videos")
        if (!cancelled) setVideos(res.data.data || [])
      } catch {
        if (!cancelled) setError("Failed to load saved videos.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSaved()
    return () => { cancelled = true }
  }, [user?._id])

  return (
    <div className="px-6 py-6">
      <div className="max-w-[1100px] mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Saved videos</h1>
          <p className="text-sm text-zinc-500">Videos you've bookmarked.</p>
        </div>

        {!user ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <RiBookmarkLine className="text-amber-400 text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300 mb-1">Sign in to see your saved videos</p>
              <p className="text-xs text-zinc-600">Saved videos are tied to your account.</p>
            </div>
            <Link to="/login" className="mt-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors">
              Sign in
            </Link>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-zinc-600 text-sm">{error}</div>
        ) : videos.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-zinc-600 text-sm">
            No saved videos yet. Tap the bookmark button on a video to save it here.
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
