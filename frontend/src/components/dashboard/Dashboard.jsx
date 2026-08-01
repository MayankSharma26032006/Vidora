import { useState, useEffect } from "react"
import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import api from "../../services/api"
import {
  RiUploadLine, RiUserFollowLine, RiEyeLine, RiVideoLine, RiThumbUpLine,
  RiEditLine, RiDeleteBinLine, RiEyeOffLine, RiArrowUpLine, RiMoreLine,
} from "react-icons/ri"
import { formatCount } from "../../utils/formatters"

function StatCard({ icon: Icon, label, value, change, color }) {
  return (
    <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="text-[18px]" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-white mb-1">{formatCount(value)}</p>
        <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
          <RiArrowUpLine className="text-[13px]" />
          <span>+{change}% this month</span>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  if (status === "published" || status === true) {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Published</span>
  }
  return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-500 border border-white/[0.06]">Draft</span>
}

function ActionMenu({ videoId, isPublished, onDelete, onToggle }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(p => !p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-all">
        <RiMoreLine className="text-[16px]" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 w-40 bg-zinc-900 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-20">
          <button onClick={() => { onToggle(videoId); setOpen(false) }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors">
            <RiEyeOffLine className="text-[14px]" /> Toggle publish
          </button>
          <div className="border-t border-white/[0.06]" />
          <button onClick={() => { onDelete(videoId); setOpen(false) }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/[0.05] transition-colors">
            <RiDeleteBinLine className="text-[14px]" /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats]   = useState(null)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    try {
      const [statsRes, videosRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/videos"),
      ])
      setStats(statsRes.data.data)
      setVideos(videosRes.data.data || [])
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(videoId) {
    try {
      await api.delete(`/videos/${videoId}`)
      setVideos(prev => prev.filter(v => v._id !== videoId))
    } catch {}
  }

  async function handleToggle(videoId) {
    try {
      await api.patch(`/videos/${videoId}`)
      setVideos(prev => prev.map(v => v._id === videoId ? { ...v, isPublished: !v.isPublished } : v))
    } catch {}
  }

  const statCards = [
    { icon: RiUserFollowLine, label: "Subscribers", value: stats?.subscribersCount || 0,  change: 7.2, color: "bg-amber-500/15 text-amber-400"    },
    { icon: RiEyeLine,        label: "Total views", value: stats?.totalViews || 0,         change: 9.0, color: "bg-blue-500/15 text-blue-400"      },
    { icon: RiVideoLine,      label: "Videos",      value: stats?.totalVideos || 0,        change: 8.1, color: "bg-purple-500/15 text-purple-400"  },
    { icon: RiThumbUpLine,    label: "Total likes", value: stats?.totalLikes || 0,         change: 3.3, color: "bg-emerald-500/15 text-emerald-400" },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-[1200px] mx-auto">

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Creator Studio</h1>
                <p className="text-sm text-zinc-500">Welcome back. Here is how your channel is doing.</p>
              </div>
              <button onClick={() => window.location.href = "/upload"} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors">
                <RiUploadLine className="text-[16px]" /> Upload video
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {statCards.map(card => <StatCard key={card.label} {...card} />)}
                </div>

                <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                    <h2 className="text-sm font-semibold text-zinc-200">Your content</h2>
                    <span className="text-xs text-zinc-500">Sorted by newest</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/[0.04]">
                          <th className="text-left px-6 py-3 text-xs font-medium text-zinc-600 uppercase tracking-widest">Video</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-zinc-600 uppercase tracking-widest">Views</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-zinc-600 uppercase tracking-widest">Likes</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-zinc-600 uppercase tracking-widest">Status</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {videos.map(video => (
                          <tr key={video._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="relative shrink-0">
                                  <img src={video.thumbnail} alt={video.title} className="w-24 h-14 rounded-lg object-cover bg-zinc-800" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-zinc-200 line-clamp-2 leading-snug mb-1">{video.title}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-zinc-400">{video.views > 0 ? formatCount(video.views) : "—"}</td>
                            <td className="px-4 py-4 text-sm text-zinc-400">{video.totalLikes > 0 ? formatCount(video.totalLikes) : "—"}</td>
                            <td className="px-4 py-4"><StatusBadge status={video.isPublished} /></td>
                            <td className="px-4 py-4">
                              <ActionMenu
                                videoId={video._id}
                                isPublished={video.isPublished}
                                onDelete={handleDelete}
                                onToggle={handleToggle}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {videos.length === 0 && (
                      <div className="flex items-center justify-center py-16 text-zinc-600 text-sm">No videos yet. Upload your first video!</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
