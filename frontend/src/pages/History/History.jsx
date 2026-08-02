import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import VideoCard from "../../components/cards/VideoCard"
import { useAuth } from "../../context/AuthContext"
import api from "../../services/api"
import { RiHistoryLine } from "react-icons/ri"

function groupByDate(videos) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today - 86400000)
  const lastWeek = new Date(today - 7 * 86400000)

  const groups = { Today: [], Yesterday: [], "Last Week": [], Older: [] }

  videos.forEach(video => {
    const date = new Date(video.createdAt)
    if (date >= today) groups.Today.push(video)
    else if (date >= yesterday) groups.Yesterday.push(video)
    else if (date >= lastWeek) groups["Last Week"].push(video)
    else groups.Older.push(video)
  })

  return groups
}

export default function History() {
  const { user }                  = useAuth()
  const [groups, setGroups]       = useState({})
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState("")

  useEffect(() => {
    let cancelled = false

    async function fetchHistory() {
      if (!user?._id) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const res = await api.get("/user/watch-history")
        const videos = res.data.data || []
        if (!cancelled) setGroups(groupByDate(videos))
      } catch {
        if (!cancelled) setError("Failed to load watch history.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchHistory()
    return () => { cancelled = true }
  }, [user?._id])

  return (
    <div className="px-6 py-6">
      <div className="max-w-[1100px] mx-auto">

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Watch History</h1>
              <p className="text-sm text-zinc-500">Videos you have watched recently.</p>
            </div>

        {!user ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <RiHistoryLine className="text-amber-400 text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300 mb-1">Sign in to see your watch history</p>
              <p className="text-xs text-zinc-600">History is tied to your account.</p>
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
        ) : (
          Object.entries(groups).map(([group, videos]) =>
            videos.length > 0 ? (
              <section key={group} className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{group}</h2>
                  <div className="flex-1 h-px bg-white/[0.04]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-7">
                  {videos.map(video => <VideoCard key={video._id} video={video} />)}
                </div>
              </section>
            ) : null
          )
        )}

            {!loading && !error && Object.values(groups).every(g => g.length === 0) && (
              <div className="flex items-center justify-center py-20 text-zinc-600 text-sm">
                No watch history yet. Start watching videos!
              </div>
            )}

      </div>
    </div>
  )
}
