import { useState } from "react"
import Avatar from "../ui/Avatar"
import { RiMoreLine, RiShareLine } from "react-icons/ri"

function formatTime(dateString) {
  const diff = Math.floor((Date.now() - new Date(dateString)) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function PostCard({ post, canDelete, onDelete }) {
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
