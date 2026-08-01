import { useState, useEffect } from "react"
import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import VideoCard from "../../components/cards/VideoCard"
import { useAuth } from "../../context/AuthContext"
import api from "../../services/api"
import { RiPlayListLine, RiCloseLine, RiLockLine } from "react-icons/ri"
import { formatTimeAgo } from "../../utils/formatters"

function PlaylistModal({ playlist, onClose }) {
  const [videos, setVideos]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPlaylist() {
      try {
        const res = await api.get(`/playlists/${playlist._id}`)
        setVideos(res.data.data?.videos || [])
      } catch {
        setVideos([])
      } finally {
        setLoading(false)
      }
    }
    fetchPlaylist()
  }, [playlist._id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-zinc-900 border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">{playlist.name}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{videos.length} videos</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-all">
            <RiCloseLine className="text-[18px]" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
              {videos.map(video => <VideoCard key={video._id} video={video} />)}
              {videos.length === 0 && <p className="text-zinc-600 text-sm col-span-2 text-center py-10">No videos in this playlist.</p>}
            </div>
          )}
        </div>
      </div>
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
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    if (user?._id) fetchPlaylists()
  }, [user])

  async function fetchPlaylists() {
    try {
      setLoading(true)
      const res = await api.get(`/playlists/user/${user._id}`)
      setPlaylists(res.data.data || [])
    } catch {
      setPlaylists([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-[1100px] mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Playlists</h1>
              <p className="text-sm text-zinc-500">Your saved collections.</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              </div>
            ) : playlists.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-zinc-600 text-sm">No playlists yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-7">
                {playlists.map(playlist => (
                  <PlaylistCard key={playlist._id} playlist={playlist} onClick={() => setSelected(playlist)} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      {selected && <PlaylistModal playlist={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
