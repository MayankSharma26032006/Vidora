import { useState } from "react"
import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import VideoCard from "../../components/cards/VideoCard"
import { RiPlayListLine, RiCloseLine, RiLockLine, RiGlobalLine } from "react-icons/ri"

const MOCK_PLAYLISTS = [
  {
    _id: "p1",
    name: "Backend Development",
    description: "Everything about building backends",
    isPrivate: false,
    updatedAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80",
    videos: [
      { _id: "v1", title: "Building REST APIs with Node.js", thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80", duration: 754, views: 48200, createdAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(), owner: { fullname: "Mayank Sharma", username: "mayank", avatar: null } },
      { _id: "v2", title: "MongoDB aggregation pipelines explained", thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80", duration: 482, views: 22100, createdAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString(), owner: { fullname: "Mayank Sharma", username: "mayank", avatar: null } },
      { _id: "v3", title: "JWT authentication from scratch", thumbnail: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&q=80", duration: 834, views: 67800, createdAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString(), owner: { fullname: "Dev Patel", username: "devpatel", avatar: null } },
    ],
  },
  {
    _id: "p2",
    name: "Travel Favorites",
    description: "Best travel videos I keep coming back to",
    isPrivate: false,
    updatedAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
    videos: [
      { _id: "t1", title: "Solo hiking the Dolomites for 7 days", thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80", duration: 1102, views: 421900, createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(), owner: { fullname: "Marco Levi", username: "marcolevi", avatar: null } },
      { _id: "t2", title: "Iceland ring road in 10 days", thumbnail: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80", duration: 1574, views: 310000, createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(), owner: { fullname: "Sara Bloom", username: "sarabloom", avatar: null } },
    ],
  },
  {
    _id: "p3",
    name: "Watch Later",
    description: "Private collection",
    isPrivate: true,
    updatedAt: new Date(Date.now() - 1 * 86400 * 1000).toISOString(),
    thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80",
    videos: [
      { _id: "m1", title: "Building a warm analog beat from scratch", thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=80", duration: 843, views: 184200, createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(), owner: { fullname: "Nova Reyes", username: "novasound", avatar: null } },
      { _id: "m2", title: "Lo-fi beat in 10 minutes", thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80", duration: 634, views: 98400, createdAt: new Date(Date.now() - 45 * 86400 * 1000).toISOString(), owner: { fullname: "Nova Reyes", username: "novasound", avatar: null } },
      { _id: "m3", title: "React hooks every developer should know", thumbnail: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=600&q=80", duration: 1447, views: 156000, createdAt: new Date(Date.now() - 21 * 86400 * 1000).toISOString(), owner: { fullname: "Dev Patel", username: "devpatel", avatar: null } },
      { _id: "m4", title: "Tailwind CSS full course", thumbnail: "https://images.unsplash.com/photo-1587620962725-abab19836100?w=600&q=80", duration: 1823, views: 203000, createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(), owner: { fullname: "Marco Levi", username: "marcolevi", avatar: null } },
    ],
  },
  {
    _id: "p4",
    name: "Fitness & Health",
    description: "Workout and wellness videos",
    isPrivate: false,
    updatedAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString(),
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
    videos: [
      { _id: "f1", title: "Morning run routine that changed my life", thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80", duration: 334, views: 67800, createdAt: new Date(Date.now() - 4 * 86400 * 1000).toISOString(), owner: { fullname: "Lena Kraft", username: "lenakraft", avatar: null } },
      { _id: "f2", title: "Full body workout — no equipment needed", thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80", duration: 1823, views: 203000, createdAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString(), owner: { fullname: "Lena Kraft", username: "lenakraft", avatar: null } },
    ],
  },
]

function formatTimeAgo(dateString) {
  const diff = Math.floor((Date.now() - new Date(dateString)) / 1000)
  const days = Math.floor(diff / 86400)
  const weeks = Math.floor(diff / 604800)
  const months = Math.floor(diff / 2592000)
  if (diff < 86400) return "today"
  if (diff < 604800) return `${days} ${days === 1 ? "day" : "days"} ago`
  if (diff < 2592000) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`
  return `${months} ${months === 1 ? "month" : "months"} ago`
}

function PlaylistModal({ playlist, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-zinc-900 border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">{playlist.name}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{playlist.videos.length} videos · Updated {formatTimeAgo(playlist.updatedAt)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-all">
            <RiCloseLine className="text-[18px]" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
          {playlist.videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PlaylistCard({ playlist, onClick }) {
  return (
    <div onClick={onClick} className="group cursor-pointer flex flex-col gap-3">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-800">
        <img src={playlist.thumbnail} alt={playlist.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/80 text-white text-xs font-medium">
          <RiPlayListLine className="text-[12px]" />
          {playlist.videos.length} videos
        </div>
        {playlist.isPrivate && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 text-zinc-300 text-[10px]">
            <RiLockLine className="text-[11px]" /> Private
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors mb-1">{playlist.name}</h3>
        <p className="text-xs text-zinc-600">Updated {formatTimeAgo(playlist.updatedAt)}</p>
      </div>
    </div>
  )
}

export default function Playlists() {
  const [selected, setSelected] = useState(null)

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-7">
              {MOCK_PLAYLISTS.map((playlist) => (
                <PlaylistCard key={playlist._id} playlist={playlist} onClick={() => setSelected(playlist)} />
              ))}
            </div>
          </div>
        </main>
      </div>
      {selected && <PlaylistModal playlist={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
