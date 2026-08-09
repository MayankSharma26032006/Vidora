import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import VideoCard from "../../components/cards/VideoCard"
import Avatar from "../../components/ui/Avatar"
import { VideoPlayer, CommentSection } from "../../components/video"
import PlaylistPicker from "../../components/playlists/PlaylistPicker"
import { useAuth } from "../../context/AuthContext"
import api from "../../services/api"
import {
  RiThumbUpLine, RiThumbUpFill,
  RiShareLine, RiBookmarkLine,
  RiMoreLine,
} from "react-icons/ri"
import { formatViews, formatTimeAgo } from "../../utils/formatters"

function Description({ text }) {
  const [expanded, setExpanded] = useState(false)
  if (!text) return null
  const lines = text.split("\n")
  const preview = lines.slice(0, 3).join("\n")
  return (
    <div className="mt-4 bg-white/[0.04] rounded-xl p-4">
      <pre className="text-sm text-zinc-400 font-sans leading-relaxed whitespace-pre-wrap">
        {expanded ? text : preview}
      </pre>
      <button onClick={() => setExpanded(p => !p)} className="mt-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  )
}

export default function Watch() {
  const { videoId }                       = useParams()
  const navigate                          = useNavigate()
  const { user }                          = useAuth()
  const [video, setVideo]                 = useState(null)
  const [relatedVideos, setRelatedVideos] = useState([])
  const [liked, setLiked]                 = useState(false)
  const [likesCount, setLikesCount]       = useState(0)
  const [subscribed, setSubscribed]       = useState(false)
  const [saved, setSaved]                 = useState(false)
  const [moreOpen, setMoreOpen]           = useState(false)
  const [moreView, setMoreView]           = useState("main") // "main" | "playlists"
  const moreRef                           = useRef(null)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState("")

  useEffect(() => {
    if (!videoId) return
    let cancelled = false

    async function fetchVideo() {
      try {
        setLoading(true)
        const res = await api.get(`/videos/${videoId}`)
        if (cancelled) return
        setVideo(res.data.data)
        setLiked(!!res.data.data.isLiked)
        // likesCount already includes the current user's own like
        setLikesCount(res.data.data.likesCount || 0)
        setSubscribed(!!res.data.data.isSubscribed)
        setSaved(!!res.data.data.isSaved)
      } catch {
        if (!cancelled) setError("Video not found.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    async function fetchRelated() {
      try {
        const res = await api.get("/videos", { params: { page: 1, limit: 5 } })
        if (!cancelled) setRelatedVideos(res.data.data.docs || [])
      } catch {
        if (!cancelled) setRelatedVideos([])
      }
    }

    fetchVideo()
    fetchRelated()

    return () => { cancelled = true }
  }, [videoId])

  async function handleLike() {
    if (!user) { navigate("/login"); return }
    try {
      await api.post(`/likes/toggle/v/${videoId}`)
      setLiked(p => !p)
      setLikesCount(c => c + (liked ? -1 : 1))
    } catch {
      // keep current state on failure
    }
  }

  async function handleSubscribe() {
    if (!user) { navigate("/login"); return }
    try {
      await api.post(`/subscriptions/c/${video?.owner?._id}`)
      setSubscribed(p => !p)
    } catch {
      // keep current state on failure
    }
  }

  async function handleSave() {
    if (!user) { navigate("/login"); return }
    try {
      await api.post(`/user/saved-videos/${videoId}`)
      setSaved(p => !p)
    } catch {
      // keep current state on failure
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/watch/${videoId}`
    navigator.clipboard?.writeText(url).catch(() => {})
  }

  function openMore() {
    setMoreView("main")
    setMoreOpen(p => !p)
  }

  // close the menu (and reset its sub-view) when clicking anywhere outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false)
        setMoreView("main")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-zinc-500">{error}</div>
    )
  }

  return (
    <div className="px-6 py-6">
      <div className="flex gap-6 max-w-[1400px] mx-auto">

        <div className="flex-1 min-w-0">
          <VideoPlayer video={video} />

          <div className="mt-4">
            <h1 className="text-lg font-semibold text-white leading-snug mb-3">{video?.title}</h1>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={video?.owner?.fullname} src={video?.owner?.avatar} size="md" />
                <div>
                  <p className="text-sm font-medium text-zinc-200">{video?.owner?.fullname}</p>
                  <p className="text-xs text-zinc-500">{formatViews(video?.subscribersCount || 0)} subscribers</p>
                </div>
                <button
                  onClick={handleSubscribe}
                  className={`ml-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${subscribed ? "bg-white/[0.08] text-zinc-400 hover:bg-white/[0.12]" : "bg-white text-zinc-950 hover:bg-zinc-100"}`}
                >
                  {subscribed ? "Subscribed" : "Subscribe"}
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${liked ? "bg-amber-500/15 border-amber-500/40 text-amber-400" : "bg-white/[0.06] border-white/[0.08] text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-200"}`}
                >
                  {liked ? <RiThumbUpFill className="text-[16px]" /> : <RiThumbUpLine className="text-[16px]" />}
                  <span>{formatViews(likesCount)}</span>
                </button>
                <button
                  onClick={handleSave}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${saved ? "bg-amber-500/15 border-amber-500/40 text-amber-400" : "bg-white/[0.06] border-white/[0.08] text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-200"}`}
                >
                  <RiBookmarkLine className="text-[16px]" /> {saved ? "Saved" : "Save"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border bg-white/[0.06] border-white/[0.08] text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-200 transition-all"
                >
                  <RiShareLine className="text-[16px]" /> Share
                </button>
                <div className="relative" ref={moreRef}>
                  <button onClick={openMore} aria-label="More options" className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 transition-all">
                    <RiMoreLine className="text-[16px]" />
                  </button>
                  {moreOpen && (
                    moreView === "playlists" ? (
                      <div className="absolute right-0 top-10 bg-zinc-900 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-20">
                        <PlaylistPicker
                          videoId={videoId}
                          onBack={() => setMoreView("main")}
                          onClose={() => { setMoreOpen(false); setMoreView("main") }}
                        />
                      </div>
                    ) : (
                      <div className="absolute right-0 top-10 w-40 bg-zinc-900 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-20">
                        <button onClick={() => setMoreView("playlists")} className="w-full text-left px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors">Save to playlist</button>
                        <button onClick={() => { handleShare(); setMoreOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors">Copy link</button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-600 mt-2">
              {formatViews(video?.views || 0)} views · {formatTimeAgo(video?.createdAt)}
            </p>

            <Description text={video?.description} />

            <CommentSection videoId={videoId} user={user} />
          </div>
        </div>

        <aside className="w-[340px] shrink-0 hidden lg:flex flex-col gap-4">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Up next</p>
          {relatedVideos.map(v => (
            <VideoCard key={v._id} video={v} variant="horizontal" />
          ))}
        </aside>
      </div>
    </div>
  )
}
