import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import api from "../../services/api"
import useNotificationStream from "../../hooks/useNotificationStream"
import { formatTimeAgo } from "../../utils/formatters"
import {
  RiNotification3Line, RiHeartLine, RiChat3Line, RiUserHeartLine,
  RiCheckDoubleLine, RiArrowRightLine,
} from "react-icons/ri"

const TYPE_META = {
  subscribe: { icon: RiUserHeartLine, text: "subscribed to your channel", color: "text-violet-400" },
  like:      { icon: RiHeartLine,     text: "liked your video",           color: "text-pink-400" },
  comment:   { icon: RiChat3Line,     text: "commented on your video",    color: "text-amber-400" },
}

function GuestPrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <RiNotification3Line className="text-amber-400 text-2xl" />
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-300 mb-1">Sign in to see your notifications</p>
        <p className="text-xs text-zinc-600 max-w-xs">
          Likes, comments, and new subscribers will show up here.
        </p>
      </div>
      <Link
        to="/login"
        className="mt-2 px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors"
      >
        Sign in
      </Link>
    </div>
  )
}

export default function Notifications() {
  const { user }                     = useAuth()
  const navigate                     = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]        = useState(true)
  const [error, setError]            = useState(null)
  
  
  const [refreshKey, setRefreshKey]  = useState(0)

  
  
  const hasLoadedRef = useRef(false)
  
  const inFlightRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function fetchNotifications() {
      if (!user?._id) {
        setLoading(false)
        return
      }
      if (inFlightRef.current) return
      inFlightRef.current = true
      try {
        const res = await api.get("/notifications")
        if (!cancelled) {
          hasLoadedRef.current = true
          setNotifications(res.data.data || [])
          setError(null)
        }
      } catch {
        if (!cancelled && !hasLoadedRef.current) {
          setError("Failed to load notifications.")
        }
      } finally {
        inFlightRef.current = false
        if (!cancelled) setLoading(false)
      }
    }

    fetchNotifications()
    
    const interval = setInterval(fetchNotifications, 60_000)
    const handleFocus = () => fetchNotifications()
    window.addEventListener("focus", handleFocus)

    return () => {
      cancelled = true
      
      
      inFlightRef.current = false
      clearInterval(interval)
      window.removeEventListener("focus", handleFocus)
    }
  }, [user?._id, refreshKey])

  
  useNotificationStream(!!user?._id, () => setRefreshKey(k => k + 1))

  async function handleMarkAllRead() {
    try {
      await api.patch("/notifications/read-all")
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch {
      
    }
  }

  function handleOpen(n) {
    if (n.video?._id) navigate(`/watch/${n.video._id}`)
  }

  if (!user) {
    return (
      <div className="px-6 py-6">
        <div className="max-w-[720px] mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Notifications</h1>
            <p className="text-sm text-zinc-500">Stay up to date with your channel.</p>
          </div>
          <GuestPrompt />
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-6">
      <div className="max-w-[720px] mx-auto">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Notifications</h1>
            <p className="text-sm text-zinc-500">Stay up to date with your channel.</p>
          </div>
          {notifications.some(n => !n.read) && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <RiCheckDoubleLine className="text-[15px]" />
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <p className="text-sm text-zinc-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <RiNotification3Line className="text-amber-400 text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300 mb-1">No notifications yet</p>
              <p className="text-xs text-zinc-600 max-w-xs">
                When someone subscribes to your channel, comments on your videos, or likes your content, it will show up here.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.05] border border-white/[0.06] rounded-xl overflow-hidden bg-white/[0.02]">
            {notifications.map(n => {
              const meta = TYPE_META[n.type] || { icon: RiNotification3Line, text: "did something", color: "text-zinc-400" }
              const Icon = meta.icon
              const clickable = Boolean(n.video?._id)
              return (
                <li key={n._id}>
                  <button
                    onClick={() => handleOpen(n)}
                    disabled={!clickable}
                    className={`w-full flex items-center gap-4 px-4 py-4 text-left transition-colors ${clickable ? "hover:bg-white/[0.04] cursor-pointer" : "cursor-default"} ${n.read ? "" : "bg-amber-500/[0.04]"}`}
                  >
                    <div className="relative shrink-0">
                      {n.actor?.avatar ? (
                        <img src={n.actor.avatar} alt={n.actor.fullname} className="w-11 h-11 rounded-full object-cover border border-white/[0.08]" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-amber-500/20 border border-white/[0.08] flex items-center justify-center text-amber-400 text-sm font-semibold">
                          {(n.actor?.fullname || "?").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-900 border border-white/[0.08] flex items-center justify-center ${meta.color}`}>
                        <Icon className="text-[11px]" />
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 leading-snug">
                        <span className="font-semibold text-white">{n.actor?.fullname || "Someone"}</span>{" "}
                        {meta.text}
                        {n.video?.title && (
                          <span className="text-zinc-500"> — “{n.video.title}”</span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-600 mt-1">{formatTimeAgo(n.createdAt)}</p>
                    </div>

                    {!n.read && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" aria-label="Unread" />}
                    {clickable && <RiArrowRightLine className="text-zinc-600 shrink-0 text-[16px]" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
