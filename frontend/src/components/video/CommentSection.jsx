import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import Avatar from "../ui/Avatar"
import { RiThumbUpLine, RiThumbUpFill, RiSendPlaneLine } from "react-icons/ri"
import { formatTimeAgo } from "../../utils/formatters"

function CommentItem({ comment, onReply }) {
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
          <button onClick={onReply} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Reply</button>
        </div>
      </div>
    </div>
  )
}

// Self-contained comment thread for a video: fetches, posts, and supports
// @-reply prefills. Needs `videoId` and the current `user` (guest-safe).
export default function CommentSection({ videoId, user }) {
  const navigate                      = useNavigate()
  const [comments, setComments]       = useState([])
  const [commentText, setCommentText] = useState("")
  const [commentInput, setCommentInput] = useState(null)

  useEffect(() => {
    if (!videoId) return
    let cancelled = false

    async function fetchComments() {
      try {
        const res = await api.get(`/comments/${videoId}`, { params: { page: 1, limit: 20 } })
        if (!cancelled) setComments(res.data.data.docs || [])
      } catch {
        if (!cancelled) setComments([])
      }
    }

    fetchComments()
    return () => { cancelled = true }
  }, [videoId])

  async function handleComment(e) {
    e.preventDefault()
    if (!user) { navigate("/login"); return }
    if (!commentText.trim()) return
    try {
      const res = await api.post(`/comments/${videoId}`, { content: commentText.trim() })
      setComments(prev => [res.data.data, ...prev])
      setCommentText("")
    } catch {
      // keep current state on failure
    }
  }

  function handleReply(username) {
    setCommentText(prev => prev ? `${prev.trim()} @${username} ` : `@${username} `)
    commentInput?.focus()
  }

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest mb-5">
        {comments.length} Comments
      </h3>

      <form onSubmit={handleComment} className="flex gap-3 mb-7">
        <Avatar name={user?.fullname} src={user?.avatar} size="sm" />
        <div className="flex-1">
          <input
            ref={setCommentInput}
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
          <CommentItem key={comment._id} comment={comment} onReply={() => handleReply(comment.owner?.username)} />
        ))}
      </div>
    </div>
  )
}
