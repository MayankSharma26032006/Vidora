import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import api from "../../services/api"
import Avatar from "../../components/ui/Avatar"
import PostCard from "../../components/posts/PostCard"

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
