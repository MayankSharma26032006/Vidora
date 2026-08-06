import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  RiMoreLine, RiPlayCircleLine, RiBookmarkLine, RiShareLine,
} from "react-icons/ri"
import { formatViews, formatDuration, formatTimeAgo } from "../../utils/formatters"
import PlaylistPicker from "../playlists/PlaylistPicker"

function ContextMenu({ videoId, onClose }) {
  const [view, setView]     = useState("main")
  const [done, setDone]     = useState(null)

  function handleAction(item) {
    if (item.key === "save") {
      setView("playlists")
      return
    }
    if (item.key === "share") {
      const url = `${window.location.origin}/watch/${videoId}`
      navigator.clipboard?.writeText(url).catch(() => {})
    }
    setDone(item.key)
    setTimeout(onClose, 1200)
  }

  const mainItems = [
    { key: "queue", icon: RiPlayCircleLine, label: "Add to queue",     doneLabel: "Added to queue"   },
    { key: "save",  icon: RiBookmarkLine,   label: "Save to playlist", doneLabel: "Saved to playlist" },
    { key: "share", icon: RiShareLine,      label: "Share",            doneLabel: "Link copied"       },
  ]

  return (
    <div
      role="menu"
      className="absolute right-0 top-8 bg-zinc-900 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-20"
      onMouseLeave={onClose}
    >
      {view === "playlists" ? (
        <PlaylistPicker videoId={videoId} onBack={() => setView("main")} onClose={onClose} />
      ) : (
        mainItems.map(item => (
          <button
            key={item.key}
            role="menuitem"
            onClick={(e) => { e.stopPropagation(); handleAction(item) }}
            className="w-44 flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <item.icon className="text-[15px] shrink-0" />
            {done === item.key ? item.doneLabel : item.label}
          </button>
        ))
      )}
    </div>
  )
}

function Thumbnail({ thumbnail, duration, title }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-800 group"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {thumbnail ? (
        <img src={thumbnail} alt={title} loading="lazy" decoding="async"
          className={`w-full h-full object-cover transition-transform duration-500 ${hovered ? "scale-105" : "scale-100"}`} />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
          <RiPlayCircleLine className="text-zinc-600 text-4xl" />
        </div>
      )}
      <div className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`} />
      {duration !== undefined && (
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 text-white text-[11px] font-medium tracking-wide">
          {formatDuration(duration)}
        </span>
      )}
      {hovered && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <RiPlayCircleLine className="text-white text-2xl" />
          </div>
        </div>
      )}
    </div>
  )
}

function Avatar({ src, name }) {
  const initials = name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?"
  if (src) return <img src={src} alt={name} loading="lazy" className="w-8 h-8 rounded-full object-cover shrink-0 bg-zinc-700" />
  return (
    <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-semibold shrink-0">
      {initials}
    </div>
  )
}

export default function VideoCard({ video = {}, variant = "default" }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate                = useNavigate()

  const {
    _id       = "",
    title     = "Untitled video",
    thumbnail = null,
    duration  = 0,
    views     = 0,
    createdAt = new Date().toISOString(),
    owner     = {},
  } = video

  const { fullname = "Unknown", username = "", avatar = null } = owner

  function handleClick() {
    if (_id) navigate(`/watch/${_id}`)
  }

  if (variant === "horizontal") {
    return (
      <article className="flex gap-3 group cursor-pointer" onClick={handleClick}>
        <div className="w-40 shrink-0">
          <Thumbnail thumbnail={thumbnail} duration={duration} title={title} />
        </div>
        <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
          <div>
            <h3 className="text-sm font-medium text-zinc-100 line-clamp-2 leading-snug group-hover:text-white transition-colors">{title}</h3>
            <p className="text-xs text-zinc-500 mt-1.5">{fullname}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{formatViews(views)} views · {formatTimeAgo(createdAt)}</p>
          </div>
          <div className="relative self-start">
            <button onClick={e => { e.stopPropagation(); setMenuOpen(p => !p) }} aria-label="More options" className="text-zinc-600 hover:text-zinc-300 transition-colors">
              <RiMoreLine className="text-[17px]" />
            </button>
            {menuOpen && <ContextMenu videoId={_id} onClose={() => setMenuOpen(false)} />}
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="flex flex-col gap-3 group cursor-pointer" onClick={handleClick}>
      <Thumbnail thumbnail={thumbnail} duration={duration} title={title} />
      <div className="flex gap-2.5">
        <Avatar src={avatar} name={fullname} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-sm font-medium text-zinc-100 line-clamp-2 leading-snug group-hover:text-white transition-colors">{title}</h3>
            <div className="relative shrink-0">
              <button onClick={e => { e.stopPropagation(); setMenuOpen(p => !p) }} aria-label="More options"
                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-200 transition-all p-0.5 rounded">
                <RiMoreLine className="text-[16px]" />
              </button>
              {menuOpen && <ContextMenu videoId={_id} onClose={() => setMenuOpen(false)} />}
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-1 hover:text-zinc-300 transition-colors truncate">
            {username ? `@${username}` : fullname}
          </p>
          <p className="text-xs text-zinc-600 mt-0.5">{formatViews(views)} views · {formatTimeAgo(createdAt)}</p>
        </div>
      </div>
    </article>
  )
}
