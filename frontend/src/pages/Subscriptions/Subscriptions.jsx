import { useState, useEffect } from "react"
import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import VideoCard from "../../components/cards/VideoCard"
import { useAuth } from "../../context/AuthContext"
import api from "../../services/api"
import { RiBellLine, RiBellFill } from "react-icons/ri"
import { formatCount } from "../../utils/formatters"

function CreatorCard({ creator }) {
  const [subscribed, setSubscribed] = useState(true)
  const [notified, setNotified]     = useState(false)
  const initials = creator.fullname?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?"

  async function handleUnsubscribe() {
    try {
      await api.post(`/subscriptions/c/${creator._id}`)
      setSubscribed(false)
    } catch {}
  }

  return (
    <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl p-5 flex flex-col items-center text-center gap-4">
      <div className="w-16 h-16 rounded-full overflow-hidden shrink-0">
        {creator.avatar
          ? <img src={creator.avatar} alt={creator.fullname} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-amber-500/20 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 text-xl font-bold">{initials}</div>
        }
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-200 mb-0.5">{creator.fullname}</p>
        <p className="text-xs text-zinc-600 mb-1">@{creator.username}</p>
        <p className="text-xs text-zinc-500">{formatCount(creator.subscribersCount || 0)} subscribers</p>
      </div>
      <div className="flex items-center gap-2 w-full">
        <button
          onClick={handleUnsubscribe}
          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all bg-white/[0.08] text-zinc-400 hover:bg-white/[0.12]"
        >
          {subscribed ? "Subscribed" : "Subscribe"}
        </button>
        {subscribed && (
          <button
            onClick={() => setNotified(p => !p)}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all shrink-0 ${notified ? "bg-amber-500/15 border-amber-500/40 text-amber-400" : "bg-white/[0.06] border-white/[0.08] text-zinc-500 hover:text-zinc-300"}`}
          >
            {notified ? <RiBellFill className="text-[14px]" /> : <RiBellLine className="text-[14px]" />}
          </button>
        )}
      </div>
    </div>
  )
}

export default function Subscriptions() {
  const { user }                          = useAuth()
  const [creators, setCreators]           = useState([])
  const [latestVideos, setLatestVideos]   = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    if (user?._id) fetchSubscriptions()
  }, [user])

  async function fetchSubscriptions() {
    try {
      setLoading(true)
      const res = await api.get(`/subscriptions/u/${user._id}`)
      const channels = (res.data.data || []).map(s => s.channel || s).filter(Boolean)
      setCreators(channels)

      const videosRes = await api.get("/videos", { params: { page: 1, limit: 6, sortBy: "createdAt", sortType: "desc" } })
      setLatestVideos(videosRes.data.data.docs || [])
    } catch {
      setCreators([])
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
              <h1 className="text-2xl font-bold text-white mb-1">Subscriptions</h1>
              <p className="text-sm text-zinc-500">Creators you follow.</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              </div>
            ) : (
              <>
                {creators.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-10">
                    {creators.map(creator => <CreatorCard key={creator._id} creator={creator} />)}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-10 text-zinc-600 text-sm mb-10">
                    You haven't subscribed to anyone yet.
                  </div>
                )}

                {latestVideos.length > 0 && (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Latest from subscriptions</h2>
                      <div className="flex-1 h-px bg-white/[0.04]" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-7 pb-8">
                      {latestVideos.map(video => <VideoCard key={video._id} video={video} />)}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
