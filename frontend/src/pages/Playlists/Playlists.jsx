import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import VideoCard from "../../components/cards/VideoCard"
import Modal from "../../components/ui/Modal"
import ConfirmDialog from "../../components/ui/ConfirmDialog"
import { useAuth } from "../../context/AuthContext"
import api from "../../services/api"
import { RiPlayListLine, RiCloseLine, RiLockLine, RiAddLine, RiDeleteBinLine } from "react-icons/ri"
import { formatTimeAgo } from "../../utils/formatters"

function CreatePlaylistModal({ open, onClose, onCreated }) {
  const [name, setName]           = useState("")
  const [description, setDescription] = useState("")
  const [creating, setCreating]   = useState(false)
  const [error, setError]         = useState("")

  async function handleCreate() {
    if (!name.trim() || creating) return
    setCreating(true)
    setError("")
    try {
      await api.post("/playlists", { name: name.trim(), description: description.trim() })
      setName("")
      setDescription("")
      onCreated()
      onClose()
    } catch {
      setError("Couldn't create playlist. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New playlist" size="sm">
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="playlist-name" className="block text-xs font-medium text-zinc-500 mb-1.5">Name</label>
          <input
            id="playlist-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Watch later"
            className="w-full px-4 py-2.5 rounded-xl border border-white/[0.08] bg-zinc-950 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
          />
        </div>
        <div>
          <label htmlFor="playlist-description" className="block text-xs font-medium text-zinc-500 mb-1.5">Description <span className="text-zinc-700">(optional)</span></label>
          <textarea
            id="playlist-description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            placeholder="What's this playlist about?"
            className="w-full px-4 py-2.5 rounded-xl border border-white/[0.08] bg-zinc-950 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors resize-none"
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-zinc-400 text-sm font-medium hover:text-zinc-200 hover:border-white/[0.16] transition-all">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creating ? "Creating..." : "Create playlist"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function PlaylistModal({ playlist, onClose, onChanged }) {
  const [videos, setVideos]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [removingId, setRemovingId] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting]   = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchPlaylist() {
      try {
        setLoading(true)
        const res = await api.get(`/playlists/${playlist._id}`)
        if (!cancelled) setVideos(res.data.data?.videos || [])
      } catch {
        if (!cancelled) setVideos([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchPlaylist()
    return () => { cancelled = true }
  }, [playlist._id])

  async function handleRemove(videoId) {
    setRemovingId(videoId)
    try {
      await api.patch(`/playlists/remove/${videoId}/${playlist._id}`)
      setVideos(vs => vs.filter(v => v._id !== videoId))
      onChanged?.()
    } catch {
      // keep current state on failure
    } finally {
      setRemovingId(null)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/playlists/${playlist._id}`)
      onChanged?.()
      onClose()
    } catch {
      // stay open on failure
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-zinc-900 border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">{playlist.name}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{videos.length} videos</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeleteOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              aria-label="Delete playlist"
            >
              <RiDeleteBinLine className="text-[17px]" />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-all">
              <RiCloseLine className="text-[18px]" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
              {videos.map(video => (
                <div key={video._id} className="relative group">
                  <VideoCard video={video} />
                  <button
                    onClick={() => handleRemove(video._id)}
                    disabled={removingId === video._id}
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg bg-black/70 border border-white/10 flex items-center justify-center text-zinc-300 opacity-0 group-hover:opacity-100 hover:bg-red-500/80 hover:text-white transition-all disabled:opacity-40"
                    aria-label="Remove from playlist"
                  >
                    <RiCloseLine className="text-[15px]" />
                  </button>
                </div>
              ))}
              {videos.length === 0 && <p className="text-zinc-600 text-sm col-span-2 text-center py-10">No videos in this playlist.</p>}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete playlist?"
        description={`"${playlist.name}" and its ${videos.length} videos will be removed. This can't be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}

function PlaylistCard({ playlist, onClick }) {
  return (
    <div onClick={onClick} className="group cursor-pointer flex flex-col gap-3">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-800">
        {playlist.thumbnail
          ? <img src={playlist.thumbnail} alt={playlist.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><RiPlayListLine className="text-zinc-600 text-3xl" /></div>
        }
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/80 text-white text-xs font-medium">
          <RiPlayListLine className="text-[12px]" />
          {playlist.totalVideos || 0} videos
        </div>
        {playlist.isPrivate && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 text-zinc-300 text-[10px]">
            <RiLockLine className="text-[11px]" /> Private
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors mb-1">{playlist.name}</h3>
        <p className="text-xs text-zinc-600">{playlist.updatedAt ? `Updated ${formatTimeAgo(playlist.updatedAt)}` : ""}</p>
      </div>
    </div>
  )
}

export default function Playlists() {
  const { user }                          = useAuth()
  const [playlists, setPlaylists]         = useState([])
  const [selected, setSelected]           = useState(null)
  const [createOpen, setCreateOpen]       = useState(false)
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchPlaylists() {
      if (!user?._id) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const res = await api.get(`/playlists/user/${user._id}`)
        if (!cancelled) setPlaylists(res.data.data || [])
      } catch {
        if (!cancelled) setPlaylists([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPlaylists()
    return () => { cancelled = true }
  }, [user?._id])

  function refresh() {
    if (user?._id) {
      api.get(`/playlists/user/${user._id}`).then(res => {
        setPlaylists(res.data.data || [])
      }).catch(() => {})
    }
  }

  return (
    <div className="px-6 py-6">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Playlists</h1>
            <p className="text-sm text-zinc-500">Your saved collections.</p>
          </div>
          {user && (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors shrink-0"
            >
              <RiAddLine className="text-[17px]" />
              New playlist
            </button>
          )}
        </div>

        {!user ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <RiPlayListLine className="text-amber-400 text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300 mb-1">Sign in to see your playlists</p>
              <p className="text-xs text-zinc-600">Playlists are tied to your account.</p>
            </div>
            <Link to="/login" className="mt-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors">
              Sign in
            </Link>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          </div>
        ) : playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-600 text-sm gap-3">
            No playlists yet.
            <button onClick={() => setCreateOpen(true)} className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-zinc-300 text-sm font-medium hover:bg-white/[0.1] transition-colors">
              Create your first playlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-7">
            {playlists.map(playlist => (
              <PlaylistCard key={playlist._id} playlist={playlist} onClick={() => setSelected(playlist)} />
            ))}
          </div>
        )}
      </div>

      {selected && <PlaylistModal playlist={selected} onClose={() => setSelected(null)} onChanged={refresh} />}
      <CreatePlaylistModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refresh} />
    </div>
  )
}
