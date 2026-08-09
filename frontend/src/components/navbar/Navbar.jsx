import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import api from "../../services/api"
import Tooltip from "../ui/Tooltip"
import SearchInput from "../search/SearchInput"
import useNotificationStream from "../../hooks/useNotificationStream"
import {
  RiSearchLine, RiVideoAddLine, RiBellLine,
  RiArrowLeftLine, RiSettings3Line,
  RiUser3Line, RiLogoutBoxLine, RiDashboardLine,
} from "react-icons/ri"

function SearchBar({ onClose }) {
  return (
    <div className="flex items-center gap-3 flex-1 max-w-2xl mx-auto">
      <button onClick={onClose} aria-label="Close search" className="text-zinc-400 hover:text-white transition-colors shrink-0">
        <RiArrowLeftLine className="text-xl" />
      </button>
      <SearchInput />
    </div>
  )
}

function ProfileMenu({ onClose }) {
  const menuRef  = useRef(null)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  async function handleLogout() {
    await logout()
    navigate("/login")
    onClose()
  }

  const menuItems = [
    { icon: RiUser3Line,     label: "Your channel",  action: () => { navigate(`/channel/${user?.username}`); onClose() } },
    { icon: RiDashboardLine, label: "Creator Studio", action: () => { navigate("/studio"); onClose() } },
    { icon: RiSettings3Line, label: "Settings",       action: () => { navigate("/settings"); onClose() } },
  ]

  return (
    <div ref={menuRef} role="menu" aria-label="Profile menu"
      className="absolute right-0 top-[calc(100%+10px)] w-52 bg-zinc-900 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <p className="text-sm font-medium text-white truncate">{user?.fullname || "User"}</p>
        <p className="text-xs text-zinc-500 truncate">@{user?.username || ""}</p>
      </div>
      <div className="py-1.5">
        {menuItems.map(item => (
          <button key={item.label} role="menuitem" onClick={item.action}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors">
            <item.icon className="text-[16px] shrink-0" />
            {item.label}
          </button>
        ))}
      </div>
      <div className="py-1.5 border-t border-white/[0.06]">
        <button role="menuitem" onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/[0.05] transition-colors">
          <RiLogoutBoxLine className="text-[16px] shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function Navbar() {
  const { user }                                  = useAuth()
  const navigate                                  = useNavigate()
  const [searchOpen, setSearchOpen]               = useState(false)
  const [profileMenuOpen, setProfileMenuOpen]     = useState(false)
  const [unreadCount, setUnreadCount]             = useState(0)

  
  
  
  
  const sideWidth = user ? "sm:w-[150px]" : "sm:w-[176px]"

  
  useEffect(() => {
    let cancelled = false

    async function fetchUnreadCount() {
      if (!user?._id) {
        setUnreadCount(0)
        return
      }
      try {
        const res = await api.get("/notifications/unread-count")
        if (!cancelled) setUnreadCount(res.data.data?.count || 0)
      } catch {
        
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 60_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [user?._id])

  
  
  useNotificationStream(!!user?._id, () => {
    api.get("/notifications/unread-count")
      .then(res => setUnreadCount(res.data.data?.count || 0))
      .catch(() => {  })
  })

  const initials = user?.fullname
    ? user.fullname.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  return (
    <header role="banner" aria-label="Site header"
      className="sticky top-0 z-40 w-full h-14 flex items-center px-4 gap-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/[0.06]">

      {searchOpen ? (
        <SearchBar onClose={() => setSearchOpen(false)} />
      ) : (
        <>
          {}
          <div aria-hidden="true" className={`hidden sm:block ${sideWidth} shrink-0`} />

          <div className="flex items-center gap-3 flex-1 max-w-2xl mx-auto min-w-[44px]">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              className="flex flex-1 min-w-0 items-center bg-white/[0.05] border border-white/[0.07] rounded-full px-4 py-2 gap-3 hover:border-white/[0.14] transition-colors cursor-text"
            >
              <RiSearchLine className="text-zinc-500 text-[16px] shrink-0" />
              <span className="hidden sm:inline min-w-0 truncate text-sm text-zinc-600 select-none">Search creators and videos...</span>
            </button>
          </div>

          <div className={`flex items-center gap-2 shrink-0 ${sideWidth} sm:justify-end`}>
            <Tooltip content="Upload video" position="bottom">
              <button
                onClick={() => navigate("/upload")}
                aria-label="Upload video"
                className="relative flex items-center justify-center w-9 h-9 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <RiVideoAddLine className="text-[19px]" />
              </button>
            </Tooltip>

            <Tooltip content={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`} position="bottom">
              <button
                onClick={() => navigate("/notifications")}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <RiBellLine className="text-[19px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </Tooltip>

            <div className="relative ml-1">
              {user ? (
                <Tooltip content={user.fullname || "Your profile"} position="bottom">
                  <button
                    onClick={() => setProfileMenuOpen(p => !p)}
                    aria-label="Open profile menu"
                    aria-expanded={profileMenuOpen}
                    aria-haspopup="menu"
                    className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-sm font-semibold hover:bg-amber-500/30 transition-colors overflow-hidden"
                  >
                    {user.avatar
                      ? <img src={user.avatar} alt={user.fullname} className="w-full h-full object-cover" />
                      : initials
                    }
                  </button>
                </Tooltip>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-1.5 whitespace-nowrap rounded-full border border-amber-500/40 text-amber-400 text-sm font-semibold hover:bg-amber-500/10 hover:border-amber-500/70 transition-colors"
                >
                  Sign in
                </button>
              )}
              {profileMenuOpen && user && (
                <ProfileMenu onClose={() => setProfileMenuOpen(false)} />
              )}
            </div>
          </div>
        </>
      )}
    </header>
  )
}
