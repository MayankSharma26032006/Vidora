import { useState, useEffect } from "react"
import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import VideoCard from "../../components/cards/VideoCard"
import { RiFireLine, RiSparklingLine } from "react-icons/ri"
import api from "../../services/api"

const CATEGORIES = [
  "All", "Music", "Coding", "Travel", "Cooking",
  "Gaming", "Fitness", "Podcasts", "Recently uploaded", "New to you",
]

function CategoryPills({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${active === cat ? "bg-white text-zinc-950" : "bg-white/[0.07] text-zinc-400 hover:bg-white/[0.12] hover:text-zinc-200"}`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <Icon className="text-amber-400 text-lg" />
      <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">{title}</h2>
    </div>
  )
}

function FeaturedBanner({ video }) {
  if (!video) return null
  return (
    <div className="relative w-full rounded-2xl overflow-hidden h-64 mb-8 group cursor-pointer">
      <img
        src={video.thumbnail}
        alt={video.title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
      <div className="absolute bottom-0 left-0 p-7 max-w-xl">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium mb-3">
          <RiFireLine className="text-[13px]" />
          Featured today
        </span>
        <h1 className="text-white text-2xl font-semibold leading-snug mb-2">{video.title}</h1>
        <p className="text-zinc-400 text-sm mb-4">
          {video.owner?.fullname} · {((video.views || 0) / 1000).toFixed(1)}K views
        </p>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 transition-colors">
          ▶ Watch now
        </button>
      </div>
    </div>
  )
}

function VideoGrid({ videos }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-7">
      {videos.map((video) => (
        <VideoCard key={video._id} video={video} />
      ))}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="w-full aspect-video rounded-xl bg-white/[0.06]" />
      <div className="flex gap-2.5">
        <div className="w-8 h-8 rounded-full bg-white/[0.06] shrink-0" />
        <div className="flex-1 flex flex-col gap-2 pt-1">
          <div className="h-3 rounded bg-white/[0.06] w-3/4" />
          <div className="h-3 rounded bg-white/[0.06] w-1/2" />
          <div className="h-3 rounded bg-white/[0.06] w-1/3" />
        </div>
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-7">
      {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [videos, setVideos]                 = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState("")

  useEffect(() => {
    fetchVideos()
  }, [])

  async function fetchVideos() {
    try {
      setLoading(true)
      const res = await api.get("/videos", {
        params: { page: 1, limit: 20, sortBy: "createdAt", sortType: "desc" }
      })
      setVideos(res.data.data.docs || [])
    } catch {
      setError("Failed to load videos.")
    } finally {
      setLoading(false)
    }
  }

  const featured = videos[0] || null
  const trending = videos.slice(1, 4)
  const forYou   = videos.slice(4)

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 px-6 py-6 overflow-y-auto">

          {loading ? (
            <SkeletonGrid />
          ) : error ? (
            <div className="flex items-center justify-center py-20 text-zinc-600 text-sm">{error}</div>
          ) : (
            <>
              <FeaturedBanner video={featured} />
              <div className="mb-7">
                <CategoryPills active={activeCategory} onChange={setActiveCategory} />
              </div>
              <section className="mb-10">
                <SectionHeader icon={RiFireLine} title="Trending" />
                <VideoGrid videos={trending} />
              </section>
              <section>
                <SectionHeader icon={RiSparklingLine} title="For you" />
                <VideoGrid videos={forYou} />
              </section>
            </>
          )}

        </main>
      </div>
    </div>
  )
}
