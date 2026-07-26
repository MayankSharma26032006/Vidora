import { useState } from "react"
import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import VideoCard from "../../components/cards/VideoCard"
import {
  RiThumbUpLine, RiThumbUpFill,
  RiShareLine, RiBookmarkLine,
  RiMoreLine, RiSendPlaneLine,
} from "react-icons/ri"

const MOCK_VIDEO = {
  _id: "1",
  title: "Building a warm analog beat from scratch (no plugins)",
  description: `In this video I walk through my full hardware chain and show you how to layer a lo-fi track live using only analog synths and a drum machine — no plugins, no DAW tricks.

I cover:
• Setting up the signal chain from scratch
• Layering drums with the TR-8S
• Adding warmth with the Juno-106
• Live mixing and final mastering tips

Gear used:
- Roland TR-8S
- Roland Juno-106
- Tascam Portastudio 414 MKII
- Neve 1073 preamp clone

Timestamps:
00:00 Intro
02:14 Signal chain setup
08:30 Drum programming
18:45 Synth layers
28:10 Live mix
38:00 Final thoughts`,
  views: 184200,
  createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
  duration: 843,
  isLiked: false,
  likesCount: 7400,
  owner: {
    _id: "u1",
    fullname: "Nova Reyes",
    username: "novasound",
    avatar: null,
    subscribersCount: 284000,
    isSubscribed: false,
  },
}

const MOCK_COMMENTS = [
  {
    _id: "c1",
    content: "This is exactly what I needed. The signal chain explanation at 2:14 finally made things click for me.",
    owner: { fullname: "Jake Thornton", username: "jakethornton", avatar: null },
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    likesCount: 142,
  },
  {
    _id: "c2",
    content: "The Juno-106 section is incredible. That warmth is so hard to replicate digitally.",
    owner: { fullname: "Priya Mehta", username: "priyamehta", avatar: null },
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    likesCount: 89,
  },
  {
    _id: "c3",
    content: "Been watching your channel for 2 years. This is your best video yet. The live mix at the end was stunning.",
    owner: { fullname: "Marcus Webb", username: "marcuswebb", avatar: null },
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    likesCount: 56,
  },
  {
    _id: "c4",
    content: "Can you do a follow-up on the Tascam workflow? I have one gathering dust and this made me want to use it again.",
    owner: { fullname: "Lena Kraft", username: "lenakraft", avatar: null },
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    likesCount: 34,
  },
  {
    _id: "c5",
    content: "The TR-8S section alone is worth 10 tutorials I've watched. Subscribed instantly.",
    owner: { fullname: "Dev Patel", username: "devpatel", avatar: null },
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    likesCount: 21,
  },
]

const RELATED_VIDEOS = [
  {
    _id: "r1",
    title: "How I mix vocals to sit in a dense track",
    thumbnail: "https://images.unsplash.com/photo-1519508234439-4f23643125c1?w=400&q=80",
    duration: 967,
    views: 74200,
    createdAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString(),
    owner: { fullname: "Nova Reyes", username: "novasound", avatar: null },
  },
  {
    _id: "r2",
    title: "Solo hiking the Dolomites for 7 days",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
    duration: 1102,
    views: 421900,
    createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
    owner: { fullname: "Marco Levi", username: "marcolevi", avatar: null },
  },
  {
    _id: "r3",
    title: "The complete guide to building REST APIs with Node.js",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80",
    duration: 754,
    views: 48200,
    createdAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    owner: { fullname: "Mayank Sharma", username: "mayank", avatar: null },
  },
  {
    _id: "r4",
    title: "MongoDB aggregation pipelines explained simply",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80",
    duration: 482,
    views: 22100,
    createdAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
    owner: { fullname: "Mayank Sharma", username: "mayank", avatar: null },
  },
  {
    _id: "r5",
    title: "React hooks every developer should actually know",
    thumbnail: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&q=80",
    duration: 1447,
    views: 156000,
    createdAt: new Date(Date.now() - 21 * 86400 * 1000).toISOString(),
    owner: { fullname: "Dev Patel", username: "devpatel", avatar: null },
  },
]

function formatViews(views) {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`
  return String(views)
}

function formatTimeAgo(dateString) {
  const diff = Math.floor((Date.now() - new Date(dateString)) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
  const days = Math.floor(diff / 86400)
  if (diff < 604800) return `${days} ${days === 1 ? "day" : "days"} ago`
  const weeks = Math.floor(diff / 604800)
  if (diff < 2592000) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`
  const months = Math.floor(diff / 2592000)
  if (diff < 31536000) return `${months} ${months === 1 ? "month" : "months"} ago`
  return `${Math.floor(diff / 31536000)} years ago`
}

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

function VideoPlayer() {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="relative w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden group">
      <img
        src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&q=80"
        alt="Video thumbnail"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40" />

      <button
        onClick={() => setPlaying(p => !p)}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all hover:scale-110">
          {playing
            ? <span className="text-white text-2xl">⏸</span>
            : <span className="text-white text-2xl pl-1">▶</span>
          }
        </div>
      </button>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-full h-1 bg-white/20 rounded-full mb-3">
          <div className="h-full w-[38%] bg-amber-400 rounded-full relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-400" />
          </div>
        </div>
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-3">
            <span>▶ 5:20</span>
            <span className="text-white/60">/ 14:03</span>
            <span>🔊</span>
          </div>
          <div className="flex items-center gap-3">
            <span>HD</span>
            <span>⚙</span>
            <span>⛶</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActionButton({ icon: Icon, activeIcon: ActiveIcon, label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all
        ${active
          ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
          : "bg-white/[0.06] border-white/[0.08] text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-200"
        }
      `}
    >
      {active && ActiveIcon ? <ActiveIcon className="text-[16px]" /> : <Icon className="text-[16px]" />}
      <span>{count !== undefined ? `${formatViews(count)}` : label}</span>
    </button>
  )
}

function CommentItem({ comment }) {
  const [liked, setLiked] = useState(false)

  return (
    <div className="flex gap-3 group">
      <Avatar name={comment.owner.fullname} src={comment.owner.avatar} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-zinc-300">@{comment.owner.username}</span>
          <span className="text-xs text-zinc-600">{formatTimeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed">{comment.content}</p>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => setLiked(p => !p)}
            className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"}`}
          >
            {liked ? <RiThumbUpFill className="text-[13px]" /> : <RiThumbUpLine className="text-[13px]" />}
            {comment.likesCount + (liked ? 1 : 0)}
          </button>
          <button className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Reply</button>
        </div>
      </div>
    </div>
  )
}

function CommentsSection({ comments }) {
  const [commentText, setCommentText] = useState("")
  const [showAll, setShowAll] = useState(false)

  const displayed = showAll ? comments : comments.slice(0, 3)

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest mb-5">
        {comments.length} Comments
      </h3>

      <div className="flex gap-3 mb-7">
        <Avatar name="Mayank Sharma" src={null} size="sm" />
        <div className="flex-1">
          <input
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-transparent border-b border-white/[0.08] focus:border-amber-500/50 pb-2 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none transition-colors"
          />
          {commentText && (
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setCommentText("")}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-1.5 rounded-full bg-amber-500 text-zinc-950 text-xs font-semibold hover:bg-amber-400 transition-colors flex items-center gap-1.5">
                <RiSendPlaneLine className="text-[13px]" />
                Comment
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {displayed.map(comment => (
          <CommentItem key={comment._id} comment={comment} />
        ))}
      </div>

      {!showAll && comments.length > 3 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-5 text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          Show all {comments.length} comments
        </button>
      )}
    </div>
  )
}

function Description({ text }) {
  const [expanded, setExpanded] = useState(false)
  const lines = text.split("\n")
  const preview = lines.slice(0, 3).join("\n")

  return (
    <div className="mt-4 bg-white/[0.04] rounded-xl p-4">
      <pre className="text-sm text-zinc-400 font-sans leading-relaxed whitespace-pre-wrap">
        {expanded ? text : preview}
      </pre>
      <button
        onClick={() => setExpanded(p => !p)}
        className="mt-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  )
}

export default function Watch() {
  const video = MOCK_VIDEO
  const [liked, setLiked] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex gap-6 max-w-[1400px] mx-auto">

            <div className="flex-1 min-w-0">
              <VideoPlayer />

              <div className="mt-4">
                <h1 className="text-lg font-semibold text-white leading-snug mb-3">
                  {video.title}
                </h1>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={video.owner.fullname} src={video.owner.avatar} size="md" />
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{video.owner.fullname}</p>
                      <p className="text-xs text-zinc-500">
                        {formatViews(video.owner.subscribersCount)} subscribers
                      </p>
                    </div>
                    <button
                      onClick={() => setSubscribed(p => !p)}
                      className={`
                        ml-2 px-5 py-2 rounded-full text-sm font-semibold transition-all
                        ${subscribed
                          ? "bg-white/[0.08] text-zinc-400 hover:bg-white/[0.12]"
                          : "bg-white text-zinc-950 hover:bg-zinc-100"
                        }
                      `}
                    >
                      {subscribed ? "Subscribed" : "Subscribe"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <ActionButton
                      icon={RiThumbUpLine}
                      activeIcon={RiThumbUpFill}
                      active={liked}
                      count={video.likesCount + (liked ? 1 : 0)}
                      onClick={() => setLiked(p => !p)}
                    />
                    <ActionButton
                      icon={RiBookmarkLine}
                      label="Save"
                      active={saved}
                      onClick={() => setSaved(p => !p)}
                    />
                    <ActionButton
                      icon={RiShareLine}
                      label="Share"
                      active={false}
                      onClick={() => {}}
                    />
                    <button className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.1] transition-all">
                      <RiMoreLine className="text-[16px]" />
                    </button>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-xs text-zinc-600">
                    {formatViews(video.views)} views · {formatTimeAgo(video.createdAt)}
                  </p>
                </div>

                <Description text={video.description} />
                <CommentsSection comments={MOCK_COMMENTS} />
              </div>
            </div>

            <aside className="w-[340px] shrink-0 hidden lg:flex flex-col gap-4">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Up next</p>
              {RELATED_VIDEOS.map(v => (
                <VideoCard key={v._id} video={v} variant="horizontal" />
              ))}
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}
