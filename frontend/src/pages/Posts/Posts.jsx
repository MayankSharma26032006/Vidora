import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import api from "../../services/api"
import Avatar from "../../components/ui/Avatar"
import { RiMoreLine, RiShareLine } from "react-icons/ri"

function formatTime(dateString) {
  const diff = Math.floor((Date.now() - new Date(dateString)) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function PostCard({ post, canDelete, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)

  function handleShare() {
    navigator.clipboard?.writeText(`${window.location.origin}/community`).catch(() => {})
  }

  return (
    <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar name={post.owner?.fullname} src={post.owner?.avatar} />
            <div>
              <p className="text-sm font-semibold text-zinc-200">{post.owner?.fullname || "Unknown"}</p>
              <p className="text-xs text-zinc-600">@{post.owner?.username || ""} · {formatTime(post.createdAt)}</p>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setMenuOpen(p => !p)} aria-label="Post options" className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.05] transition-all">
              <RiMoreLine className="text-[16px]" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 w-36 bg-zinc-800 border border-white/[0.08] rounded-xl overflow-hidden z-10 shadow-xl">
                <button onClick={() => { handleShare(); setMenuOpen(false) }} className="w-full px-4 py-2.5 text-left text-xs text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors">
                  Copy link
                </button>
                {canDelete && (
                  <button onClick={() => { onDelete(post._id); setMenuOpen(false) }} className="w-full px-4 py-2.5 text-left text-xs text-red-400 hover:text-red-300 hover:bg-white/[0.05] transition-colors">
                    Delete post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{post.content}</p>
      </div>

      <div className="px-5 py-3 flex items-center gap-1 border-t border-white/[0.04]">
        <button onClick={handleShare} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-all">
          <RiShareLine className="text-[16px]" />
          Share
        </button>
      </div>
    </div>
  )
}

function CreatePost({ onPost }) {
  const [text, setText] = useState("")

  function handlePost() {
    if (!text.trim()) return
    onPost(text.trim())
    setText("")
  }

  return (
    <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl p-5 mb-6">
      <div className="flex gap-3">
        <Avatar name="You" />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Share something with your community..."
            rows={3}
            className="w-full bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 outline-none resize-none"
          />
          <div className="flex items-center justify-end mt-3 pt-3 border-t border-white/[0.06]">
            <button
              onClick={handlePost}
              disabled={!text.trim()}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Posts() {
  const { user }                    = useAuth()
  const navigate                    = useNavigate()
  const [posts, setPosts]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState("")

  useEffect(() => {
    let cancelled = false

    async function fetchTweets() {
      try {
        setLoading(true)
        const res = await api.get("/tweets")
        if (!cancelled) setPosts(res.data.data || [])
      } catch {
        if (!cancelled) setError("Failed to load community posts.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchTweets()
    return () => { cancelled = true }
  }, [])

  async function handlePost(content) {
    try {
      const res = await api.post("/tweets", { content })
      const created = res.data.data
      setPosts(prev => [
        {
          ...created,
          // include _id so canDelete works immediately (the create response only has a raw owner id)
          owner: { _id: user?._id, fullname: user?.fullname, username: user?.username, avatar: user?.avatar },
        },
        ...prev,
      ])
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post. Please try again.")
    }
  }

  async function handleDelete(tweetId) {
    try {
      await api.delete(`/tweets/${tweetId}`)
      setPosts(prev => prev.filter(p => p._id !== tweetId))
    } catch { /* delete failures surface on the next feed refresh */ }
  }

  return (
    <div className="px-6 py-6">
      <div className="max-w-[680px] mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-1">Community</h1>
              <p className="text-sm text-zinc-500">Posts from the VidOra community.</p>
            </div>

            {error && (
              <div className="mb-6 px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            {user ? (
              <CreatePost onPost={handlePost} />
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="w-full mb-6 flex items-center justify-between px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-left hover:bg-white/[0.05] transition-colors"
              >
                <span className="text-sm text-zinc-400">Sign in to join the conversation</span>
                <span className="text-xs text-amber-400 font-semibold">Sign in →</span>
              </button>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-zinc-600 text-sm">
                No posts yet — be the first to share something!
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {posts.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                    canDelete={post.owner?._id === user?._id}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
      </div>
    </div>
  )
}
