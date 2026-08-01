import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import VideoCard from "../../components/cards/VideoCard"
import { useAuth } from "../../context/AuthContext"
import api from "../../services/api"
import {
  RiThumbUpLine, RiThumbUpFill,
  RiShareLine, RiBookmarkLine,
  RiMoreLine, RiSendPlaneLine,
} from "react-icons/ri"
import { formatViews, formatTimeAgo } from "../../utils/formatters"

function Avatar({ name, src, size = "md" }) {
  const sizes = { sm: "w-7 h-7 text-[11px]", md: "w-9 h-9 text-sm", lg: "w-11 h-11 text-base" }
  const initials = name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?"
  if (src) return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover shrink-0`} />
  return (
    <div className={`${sizes[size]} rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-semibold shrink-0`}>
      {initials}
    </div>
  )
}

function VideoPlayer({ video }) {
  const [playing, setPlaying] = useState(false)
  return (
    <div className="relative w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden group">
      {video?.thumbnail && (
        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-black/40" />
      <button onClick={() => setPlaying(p => !p)} className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all hover:scale-110">
          <span className="text-white text-2xl">{playing ? "⏸" : "▶"}</span>
        </div>
      </button>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-full h-1.5 bg-white/20 rounded-full mb-3">
          <div className="h-full w-[38%] bg-amber-400 rounded-full" />
        </div>
        <div className="flex items-center justify-between text-white text-xs">
          <span>▶ 5:20 / {video?.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, "0")}` : "0:00"}</span>
          <span>⛶</span>
        </div>
      </div>
    </div>
  )
}

function CommentItem({ comment, onLike }) {
  const [liked, setLiked] = useState(false)
  return (
    <div className="flex gap-3">
      <Avatar name={comment.owner?.fullname} src={comment.owner?.avatar} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-zinc-300">@{comment.owner?.username}</span>
          <span className="text-xs text-zinc-600">{formatTimeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed">{comment.content}</p>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => setLiked(p => !p)}
            className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"}`}
          >
            {liked ? <RiThumbUpFill className="text-[13px]" /> : <RiThumbUpLine className="text-[13px]" />}
          </button>
          <button className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Reply</button>
        </div>
      </div>
    </div>
  )
}

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
  const [comments, setComments]           = useState([])
  const [relatedVideos, setRelatedVideos] = useState([])
  const [liked, setLiked]                 = useState(false)
  const [subscribed, setSubscribed]       = useState(false)
  const [saved, setSaved]                 = useState(false)
  const [commentText, setCommentText]     = useState("")
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState("")

  useEffect(() => {
    if (videoId) {
      fetchVideo()
      fetchComments()
      fetchRelated()
    }
  }, [videoId])

  async function fetchVideo() {
    try {
      setLoading(true)
      const res = await api.get(`/videos/${videoId}`)
      setVideo(res.data.data)
    } catch {
      setError("Video not found.")
    } finally {
      setLoading(false)
    }
  }

  async function fetchComments() {
    try {
      const res = await api.get(`/comments/${videoId}`, { params: { page: 1, limit: 20 } })
      setComments(res.data.data.docs || [])
    } catch {
      setComments([])
    }
  }

  async function fetchRelated() {
    try {
      const res = await api.get("/videos", { params: { page: 1, limit: 5 } })
      setRelatedVideos(res.data.data.docs || [])
    } catch {
      setRelatedVideos([])
    }
  }

  async function handleLike() {
    if (!user) { navigate("/login"); return }
    try {
      await api.post(`/likes/toggle/v/${videoId}`)
      setLiked(p => !p)
    } catch {}
  }

  async function handleSubscribe() {
    if (!user) { navigate("/login"); return }
    try {
      await api.post(`/subscriptions/c/${video?.owner?._id}`)
      setSubscribed(p => !p)
    } catch {}
  }

  async function handleComment(e) {
    e.preventDefault()
    if (!user) { navigate("/login"); return }
    if (!commentText.trim()) return
    try {
      const res = await api.post(`/comments/${videoId}`, { content: commentText.trim() })
      setComments(prev => [res.data.data, ...prev])
      setCommentText("")
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-zinc-950">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen overflow-hidden bg-zinc-950">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Navbar />
          <div className="flex-1 flex items-center justify-center text-zinc-500">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
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
                      <p className="text-xs text-zinc-500">{formatViews(video?.owner?.subscribersCount || 0)} subscribers</p>
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
                      <span>{formatViews((video?.likesCount || 0) + (liked ? 1 : 0))}</span>
                    </button>
                    <button
                      onClick={() => setSaved(p => !p)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${saved ? "bg-amber-500/15 border-amber-500/40 text-amber-400" : "bg-white/[0.06] border-white/[0.08] text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-200"}`}
                    >
                      <RiBookmarkLine className="text-[16px]" /> Save
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border bg-white/[0.06] border-white/[0.08] text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-200 transition-all">
                      <RiShareLine className="text-[16px]" /> Share
                    </button>
                    <button className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 transition-all">
                      <RiMoreLine className="text-[16px]" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 mt-2">
                  {formatViews(video?.views || 0)} views · {formatTimeAgo(video?.createdAt)}
                </p>

                <Description text={video?.description} />

                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest mb-5">
                    {comments.length} Comments
                  </h3>

                  <form onSubmit={handleComment} className="flex gap-3 mb-7">
                    <Avatar name={user?.fullname} src={user?.avatar} size="sm" />
                    <div className="flex-1">
                      <input
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder={user ? "Add a comment..." : "Sign in to comment"}
                        disabled={!user}
                        className="w-full bg-transparent border-b border-white/[0.08] focus:border-amber-500/50 pb-2 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none transition-colors disabled:opacity-50"
                      />
                      {commentText && (
                        <div className="flex justify-end gap-2 mt-2">
                          <button type="button" onClick={() => setCommentText("")} className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Cancel</button>
                          <button type="submit" className="px-4 py-1.5 rounded-full bg-amber-500 text-zinc-950 text-xs font-semibold hover:bg-amber-400 transition-colors flex items-center gap-1.5">
                            <RiSendPlaneLine className="text-[13px]" /> Comment
                          </button>
                        </div>
                      )}
                    </div>
                  </form>

                  <div className="flex flex-col gap-6">
                    {comments.map(comment => (
                      <CommentItem key={comment._id} comment={comment} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <aside className="w-[340px] shrink-0 hidden lg:flex flex-col gap-4">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Up next</p>
              {relatedVideos.map(v => (
                <VideoCard key={v._id} video={v} variant="horizontal" />
              ))}
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}
