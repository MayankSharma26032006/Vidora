import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import api from "../../services/api"
import {
  RiArrowLeftLine, RiCheckLine, RiAddLine, RiPlayListLine,
} from "react-icons/ri"


export default function PlaylistPicker({ videoId, onBack, onClose }) {
  const navigate    = useNavigate()
  const { user }    = useAuth()
  const [playlists, setPlaylists]       = useState(null)
  const [loadError, setLoadError]       = useState(false)
  const [creating, setCreating]         = useState(false)
  const [newName, setNewName]           = useState("")
  const [pendingId, setPendingId]       = useState(null)
  const [error, setError]               = useState("")

  
  useEffect(() => {
    if (!user?._id) return undefined
    let cancelled = false
    api.get(`/playlists/user/${user._id}`)
      .then(res => { if (!cancelled) setPlaylists(res.data.data || []) })
      .catch(() => { if (!cancelled) setLoadError(true) })
    return () => { cancelled = true }
  }, [user?._id])

  async function loadPlaylists() {
    setLoadError(false)
    try {
      const res = await api.get(`/playlists/user/${user._id}`)
      setPlaylists(res.data.data || [])
    } catch {
      setLoadError(true)
    }
  }

  async function togglePlaylist(playlist) {
    const contains = (playlist.videoIds || []).includes(videoId)
    setPendingId(playlist._id)
    try {
      await api.patch(
        contains
          ? `/playlists/remove/${videoId}/${playlist._id}`
          : `/playlists/add/${videoId}/${playlist._id}`
      )
      setPlaylists(prev => (prev || []).map(p =>
        p._id === playlist._id
          ? {
              ...p,
              totalVideos: (p.totalVideos || 0) + (contains ? -1 : 1),
              videoIds: contains
                ? (p.videoIds || []).filter(id => id !== videoId)
                : [...(p.videoIds || []), videoId],
            }
          : p
      ))
    } catch {
      setError("Couldn't update playlist.")
    } finally {
      setPendingId(null)
    }
  }

  async function createAndAdd() {
    if (!newName.trim() || creating) return
    setCreating(true)
    setError("")
    try {
      const res = await api.post("/playlists", { name: newName.trim() })
      const playlist = res.data.data
      await api.patch(`/playlists/add/${videoId}/${playlist._id}`)
      setNewName("")
      await loadPlaylists()
    } catch {
      setError("Couldn't create playlist.")
    } finally {
      setCreating(false)
    }
  }

  if (!user) {
    return (
      <div className="w-60 p-4" onClick={e => e.stopPropagation()}>
        <p className="text-sm text-zinc-400 mb-3">Sign in to save videos to playlists.</p>
        <button
          onClick={() => { navigate("/login"); onClose() }}
          className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors"
        >
          Sign in
        </button>
      </div>
    )
  }

  return (
    <div className="w-60" onClick={e => e.stopPropagation()}>
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-white/[0.06]">
        <button
          onClick={onBack}
          className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-all"
          aria-label="Back"
        >
          <RiArrowLeftLine className="text-[15px]" />
        </button>
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Save to playlist</span>
      </div>

      <div className="max-h-56 overflow-y-auto">
        {loadError ? (
          <div className="px-4 py-3 flex flex-col gap-2">
            <p className="text-xs text-zinc-600">Couldn't load your playlists.</p>
            <button
              onClick={loadPlaylists}
              className="w-fit text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : playlists === null ? (
          <p className="px-4 py-3 text-xs text-zinc-600 flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            Loading your playlists...
          </p>
        ) : playlists.length === 0 ? (
          <p className="px-4 py-3 text-xs text-zinc-600">No playlists yet. Create one below.</p>
        ) : (
          playlists.map(playlist => {
            const contains = (playlist.videoIds || []).includes(videoId)
            return (
              <button
                key={playlist._id}
                onClick={() => togglePlaylist(playlist)}
                disabled={pendingId === playlist._id}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.05] transition-colors disabled:opacity-50 text-left"
              >
                <RiPlayListLine className={`text-[16px] shrink-0 ${contains ? "text-amber-400" : "text-zinc-500"}`} />
                <span className="flex-1 truncate">{playlist.name}</span>
                <span className="text-xs text-zinc-600 shrink-0">{playlist.totalVideos || 0}</span>
                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    contains ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "border-white/[0.14] text-transparent"
                  }`}
                >
                  <RiCheckLine className="text-[12px]" />
                </span>
              </button>
            )
          })
        )}
      </div>

      <div className="px-3 py-3 border-t border-white/[0.06] flex items-center gap-2">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") createAndAdd() }}
          placeholder="New playlist name..."
          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-zinc-950 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
        />
        <button
          onClick={createAndAdd}
          disabled={!newName.trim() || creating}
          className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Create playlist"
        >
          <RiAddLine className="text-[14px]" />
        </button>
      </div>

      {error && <p className="px-4 pb-3 text-[11px] text-red-400">{error}</p>}
    </div>
  )
}
