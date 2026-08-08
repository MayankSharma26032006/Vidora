import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import VideoCard from "../../components/cards/VideoCard"
import PostCard from "../../components/posts/PostCard"
import { useAuth } from "../../context/AuthContext"
import api from "../../services/api"
import { RiBellLine, RiBellFill } from "react-icons/ri"
import { formatCount } from "../../utils/formatters"

const TABS = ["Videos", "Playlists", "Community", "About"]

function ChannelAvatar({ name, src }) {
  const initials = name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?"
  if (src) return <img src={src} alt={name} className="w-24 h-24 rounded-full object-cover border-4 border-zinc-950 shrink-0" />
  return (
    <div className="w-24 h-24 rounded-full bg-amber-500/20 border-4 border-zinc-950 flex items-center justify-center text-amber-400 text-3xl font-bold shrink-0">
      {initials}
    </div>
  )
}

export default function Channel() {
  const { username }                      = useParams()
  const navigate                          = useNavigate()
  const { user }                          = useAuth()
  const [channel, setChannel]             = useState(null)
  const [videos, setVideos]               = useState([])
  const [tweets, setTweets]               = useState([])
  const [subscribed, setSubscribed]       = useState(false)
  const [notified, setNotified]           = useState(false)
  const [joined, setJoined]               = useState(false)
  const [activeTab, setActiveTab]         = useState("Videos")
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    if (!username) return
    let cancelled = false

    async function fetchChannel() {
      try {
        setLoading(true)
        const res = await api.get(`/user/channel-profile/${username}`)
        if (cancelled) return
        const data = res.data.data
        setChannel(data)
        setSubscribed(data.isSubscribed || false)

        const videosRes = await api.get("/videos", {
          params: { page: 1, limit: 12, userId: data._id }
        })
        if (!cancelled) setVideos(videosRes.data.data.docs || [])

        const tweetsRes = await api.get(`/tweets/user/${data._id}`)
        if (!cancelled) setTweets(tweetsRes.data.data || [])
      } catch {
        if (!cancelled) setChannel(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchChannel()
    return () => { cancelled = true }
  }, [username])

  async function handleSubscribe() {
    if (!user) { navigate("/login"); return }
    try {
      await api.post(`/subscriptions/c/${channel?._id}`)
      setSubscribed(p => !p)
      if (subscribed) setNotified(false)
    } catch {
      // keep current state on failure
    }
  }

  async function handleDeleteTweet(tweetId) {
    try {
      await api.delete(`/tweets/${tweetId}`)
      setTweets(prev => prev.filter(t => t._id !== tweetId))
    } catch { /* keep the post visible if the delete fails */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-zinc-500">Channel not found.</div>
    )
  }

  return (
    <>
      <div className="relative w-full h-44 bg-zinc-900 overflow-hidden">
        {channel.coverImage && (
          <img src={channel.coverImage} alt="Channel cover" className="w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
      </div>

      <div className="px-6 max-w-[1200px] mx-auto">
            <div className="flex flex-wrap items-end gap-5 -mt-12 mb-6 relative z-10">
              <ChannelAvatar name={channel.fullname} src={channel.avatar} />
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-2xl font-bold text-white mb-1">{channel.fullname}</h1>
                <p className="text-sm text-zinc-500">
                  @{channel.username}
                  <span className="mx-2">·</span>
                  {formatCount(channel.subscribersCount || 0)} subscribers
                  <span className="mx-2">·</span>
                  {channel.videoCount || 0} videos
                </p>
              </div>

              <div className="flex items-center gap-2 pb-1 shrink-0">
                {subscribed && (
                  <button
                    onClick={() => setNotified(p => !p)}
                    className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${notified ? "bg-amber-500/15 border-amber-500/40 text-amber-400" : "bg-white/[0.06] border-white/[0.08] text-zinc-400 hover:text-zinc-200"}`}
                  >
                    {notified ? <RiBellFill className="text-[17px]" /> : <RiBellLine className="text-[17px]" />}
                  </button>
                )}
                <button
                  onClick={handleSubscribe}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${subscribed ? "bg-white/[0.08] text-zinc-400 hover:bg-white/[0.12]" : "bg-white text-zinc-950 hover:bg-zinc-100"}`}
                >
                  {subscribed ? "Subscribed" : "Subscribe"}
                </button>
                <button
                  onClick={() => setJoined(p => !p)}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold border transition-all ${joined ? "bg-amber-500/15 border-amber-500/40 text-amber-400" : "border-white/[0.12] text-zinc-300 hover:bg-white/[0.06]"}`}
                >
                  {joined ? "Joined" : "Join"}
                </button>
              </div>
            </div>

            <div className="flex gap-0 border-b border-white/[0.06] mb-6">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 pb-3 text-sm font-medium transition-all border-b-2 -mb-[1px] ${activeTab === tab ? "text-white border-white" : "text-zinc-500 border-transparent hover:text-zinc-300"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "Videos" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-7 pb-8">
                {videos.map(video => <VideoCard key={video._id} video={video} />)}
                {videos.length === 0 && <p className="text-zinc-600 text-sm col-span-3 py-10 text-center">No videos yet.</p>}
              </div>
            )}
            {activeTab === "Playlists" && <div className="flex items-center justify-center py-24 text-zinc-600 text-sm">No playlists yet.</div>}
            {activeTab === "Community" && (
              <div className="flex flex-col gap-4 pb-8 max-w-2xl">
                {tweets.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                    canDelete={channel._id === user?._id}
                    onDelete={handleDeleteTweet}
                  />
                ))}
                {tweets.length === 0 && <p className="text-zinc-600 text-sm py-16 text-center">No community posts yet.</p>}
              </div>
            )}
            {activeTab === "About" && (
              <div className="max-w-2xl py-6 pb-8">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Bio</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">{channel.bio || "No bio yet."}</p>
              </div>
            )}
      </div>
    </>
  )
}
