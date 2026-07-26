import { useState } from "react"
import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import { RiThumbUpLine, RiThumbUpFill, RiChat1Line, RiShareLine, RiMoreLine, RiImageLine } from "react-icons/ri"

const MOCK_POSTS = [
  { _id: "p1", owner: { fullname: "Nova Reyes", username: "novasound", avatar: null }, createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), text: "Just finished recording the most satisfying analog drum loop. Sometimes the imperfections in hardware are exactly what makes it feel alive. No plugins, no grid snapping — just raw timing and a little tape saturation. 🎛️", image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80", likes: 1420, comments: 89 },
  { _id: "p2", owner: { fullname: "Mayank Sharma", username: "mayank", avatar: null }, createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), text: "Big milestone — just pushed the final commit on my first full stack project. Backend in Node.js + Express + MongoDB, frontend in React + Tailwind. Took 3 months of consistent work. If you're learning to code, just keep building. 🚀\n\nNext up: deployment on Railway + a proper README.", image: null, likes: 847, comments: 134 },
  { _id: "p3", owner: { fullname: "Marco Levi", username: "marcolevi", avatar: null }, createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), text: "Dolomites in the early morning before the fog lifts is something I'll never stop chasing. Already planning a return trip for winter — snowshoeing the Alta Via 1.", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", likes: 2341, comments: 201 },
  { _id: "p4", owner: { fullname: "Dev Patel", username: "devpatel", avatar: null }, createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), text: "Hot take: most people overcomplicate learning to code. You don't need 10 courses. You need 1 project you actually care about and the patience to get unstuck.\n\nWhat project got YOU into coding? Drop it below 👇", image: null, likes: 3102, comments: 412 },
  { _id: "p5", owner: { fullname: "Lena Kraft", username: "lenakraft", avatar: null }, createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(), text: "5am run streak — day 47. The city before it wakes up is a different world entirely. Cold air, empty streets, and your thoughts. There's no better thinking time.", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80", likes: 923, comments: 67 },
]

function formatTime(dateString) {
  const diff = Math.floor((Date.now() - new Date(dateString)) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function Avatar({ name, size = "md" }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm" }
  const initials = name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?"
  return (
    <div className={`${sizes[size]} rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-semibold shrink-0`}>
      {initials}
    </div>
  )
}

function PostCard({ post }) {
  const [liked, setLiked] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar name={post.owner.fullname} />
            <div>
              <p className="text-sm font-semibold text-zinc-200">{post.owner.fullname}</p>
              <p className="text-xs text-zinc-600">@{post.owner.username} · {formatTime(post.createdAt)}</p>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setMenuOpen(p => !p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.05] transition-all">
              <RiMoreLine className="text-[16px]" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 w-36 bg-zinc-800 border border-white/[0.08] rounded-xl overflow-hidden z-10 shadow-xl">
                {["Save post", "Copy link", "Report"].map(item => (
                  <button key={item} onClick={() => setMenuOpen(false)} className="w-full px-4 py-2.5 text-left text-xs text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors">{item}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line mb-4">{post.text}</p>
      </div>

      {post.image && (
        <div className="w-full aspect-video bg-zinc-800 overflow-hidden">
          <img src={post.image} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="px-5 py-3 flex items-center gap-1 border-t border-white/[0.04]">
        <button onClick={() => setLiked(p => !p)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${liked ? "text-amber-400 bg-amber-500/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"}`}>
          {liked ? <RiThumbUpFill className="text-[16px]" /> : <RiThumbUpLine className="text-[16px]" />}
          {formatCount(post.likes + (liked ? 1 : 0))}
        </button>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-all">
          <RiChat1Line className="text-[16px]" />
          {formatCount(post.comments)}
        </button>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-all">
          <RiShareLine className="text-[16px]" />
          Share
        </button>
      </div>
    </div>
  )
}

function CreatePost() {
  const [text, setText] = useState("")
  return (
    <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl p-5 mb-6">
      <div className="flex gap-3">
        <Avatar name="Mayank Sharma" />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Share something with your community..."
            rows={3}
            className="w-full bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 outline-none resize-none"
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
            <button className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              <RiImageLine className="text-[15px]" /> Add image
            </button>
            <button disabled={!text.trim()} className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Posts() {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-[680px] mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-1">Community</h1>
              <p className="text-sm text-zinc-500">Posts from creators you follow.</p>
            </div>
            <CreatePost />
            <div className="flex flex-col gap-4">
              {MOCK_POSTS.map(post => <PostCard key={post._id} post={post} />)}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
