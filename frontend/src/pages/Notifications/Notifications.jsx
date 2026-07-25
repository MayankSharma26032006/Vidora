import { useState } from "react"
import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import {
  RiUserFollowLine, RiChat1Line, RiThumbUpLine,
  RiPlayListLine, RiVideoLine, RiCheckLine,
} from "react-icons/ri"

const MOCK_NOTIFICATIONS = {
  Today: [
    { _id: "n1", type: "subscriber", message: "Nova Reyes subscribed to your channel", time: "2 minutes ago", read: false, avatar: "NR" },
    { _id: "n2", type: "comment", message: "Dev Patel commented on your video: \"This is exactly what I needed!\"", time: "15 minutes ago", read: false, avatar: "DP" },
    { _id: "n3", type: "like", message: "Marco Levi and 142 others liked your video", time: "1 hour ago", read: false, avatar: "ML" },
    { _id: "n4", type: "published", message: "Your video \"Building REST APIs\" was published successfully", time: "3 hours ago", read: true, avatar: null },
  ],
  Yesterday: [
    { _id: "n5", type: "subscriber", message: "Sara Bloom subscribed to your channel", time: "Yesterday at 9:14 PM", read: true, avatar: "SB" },
    { _id: "n6", type: "playlist", message: "Lena Kraft saved your video to their playlist", time: "Yesterday at 4:30 PM", read: true, avatar: "LK" },
    { _id: "n7", type: "comment", message: "Marco Levi replied to your comment", time: "Yesterday at 2:10 PM", read: true, avatar: "ML" },
    { _id: "n8", type: "like", message: "89 people liked your comment on Dev Patel's video", time: "Yesterday at 11:00 AM", read: true, avatar: "DP" },
  ],
  Earlier: [
    { _id: "n9",  type: "published", message: "Your video \"MongoDB aggregation\" was published", time: "3 days ago", read: true, avatar: null },
    { _id: "n10", type: "subscriber", message: "Dev Patel subscribed to your channel", time: "4 days ago", read: true, avatar: "DP" },
    { _id: "n11", type: "playlist", message: "Nova Reyes saved your video to their playlist", time: "5 days ago", read: true, avatar: "NR" },
    { _id: "n12", type: "comment", message: "Lena Kraft commented: \"Can you do a follow up on this?\"", time: "1 week ago", read: true, avatar: "LK" },
  ],
}

const TYPE_CONFIG = {
  subscriber: { icon: RiUserFollowLine, color: "bg-amber-500/15 text-amber-400"  },
  comment:    { icon: RiChat1Line,      color: "bg-blue-500/15 text-blue-400"     },
  like:       { icon: RiThumbUpLine,    color: "bg-red-500/15 text-red-400"       },
  playlist:   { icon: RiPlayListLine,   color: "bg-purple-500/15 text-purple-400" },
  published:  { icon: RiVideoLine,      color: "bg-emerald-500/15 text-emerald-400" },
}

function NotificationItem({ notification, onRead }) {
  const config = TYPE_CONFIG[notification.type]
  const Icon   = config.icon

  return (
    <div
      onClick={() => onRead(notification._id)}
      className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all ${notification.read ? "hover:bg-white/[0.03]" : "bg-amber-500/[0.04] border border-amber-500/[0.08] hover:bg-amber-500/[0.06]"}`}
    >
      <div className="relative shrink-0">
        {notification.avatar ? (
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300 border border-white/[0.08]">
            {notification.avatar}
          </div>
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}>
            <Icon className="text-[17px]" />
          </div>
        )}
        {notification.avatar && (
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-950 ${config.color}`}>
            <Icon className="text-[10px]" />
          </div>
        )}
        {!notification.read && (
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-zinc-950" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed ${notification.read ? "text-zinc-400" : "text-zinc-200"}`}>
          {notification.message}
        </p>
        <p className="text-xs text-zinc-600 mt-1">{notification.time}</p>
      </div>
    </div>
  )
}

export default function Notifications() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

  const unreadCount = Object.values(notifications).flat().filter(n => !n.read).length

  function markRead(id) {
    setNotifications((prev) => {
      const updated = {}
      for (const [group, items] of Object.entries(prev)) {
        updated[group] = items.map(n => n._id === id ? { ...n, read: true } : n)
      }
      return updated
    })
  }

  function markAllRead() {
    setNotifications((prev) => {
      const updated = {}
      for (const [group, items] of Object.entries(prev)) {
        updated[group] = items.map(n => ({ ...n, read: true }))
      }
      return updated
    })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-[720px] mx-auto">

            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-white">Notifications</h1>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-xs font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500">Stay up to date with your channel.</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] text-zinc-400 text-sm hover:text-zinc-200 hover:border-white/[0.16] transition-all"
                >
                  <RiCheckLine className="text-[14px]" />
                  Mark all read
                </button>
              )}
            </div>

            {Object.entries(notifications).map(([group, items]) => (
              <section key={group} className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{group}</h2>
                  <div className="flex-1 h-px bg-white/[0.04]" />
                </div>
                <div className="flex flex-col gap-1">
                  {items.map((notification) => (
                    <NotificationItem
                      key={notification._id}
                      notification={notification}
                      onRead={markRead}
                    />
                  ))}
                </div>
              </section>
            ))}

          </div>
        </main>
      </div>
    </div>
  )
}
