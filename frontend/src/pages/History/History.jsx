import { useState, useEffect } from "react"
import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import VideoCard from "../../components/cards/VideoCard"
import api from "../../services/api"

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
  const [groups, setGroups]   = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState("")

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    try {
      setLoading(true)
      const res = await api.get("/user/watch-history")
      const videos = res.data.data || []
      setGroups(groupByDate(videos))
    } catch {
      setError("Failed to load watch history.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-[1100px] mx-auto">

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Watch History</h1>
              <p className="text-sm text-zinc-500">Videos you have watched recently.</p>
            </div>

            {loading ? (
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
        </main>
      </div>
    </div>
  )
}
