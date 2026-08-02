import { useState, useEffect } from "react"
import VideoCard from "../../components/cards/VideoCard"
import { RiFireLine } from "react-icons/ri"
import { CATEGORIES, CATEGORY_EMOJIS, categoryParamFor } from "../../utils/constants"
import api from "../../services/api"

export default function Explore() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [videos, setVideos]                 = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState("")

  useEffect(() => {
    let cancelled = false

    async function fetchVideos() {
      try {
        setLoading(true)
        const res = await api.get("/videos", {
          params: {
            page: 1,
            limit: 24,
            sortBy: "views",
            sortType: "desc",
            category: categoryParamFor(activeCategory),
          }
        })
        if (!cancelled) setVideos(res.data.data.docs || [])
      } catch {
        if (!cancelled) setError("Failed to load videos.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchVideos()
    return () => { cancelled = true }
  }, [activeCategory])

  const pills = ["All", ...CATEGORIES]

  return (
    <div className="px-6 py-6">
      <div className="max-w-[1100px] mx-auto">

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Explore</h1>
              <p className="text-sm text-zinc-500">Discover videos across all categories.</p>
            </div>

            <div className="flex gap-3 flex-wrap mb-8">
              {pills.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all
                    ${activeCategory === cat
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                      : "bg-zinc-900 border-white/[0.06] text-zinc-400 hover:border-white/[0.14] hover:text-zinc-200"
                    }
                  `}
                >
                  {cat !== "All" && <span>{CATEGORY_EMOJIS[cat] || "✨"}</span>}
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-5">
              <RiFireLine className="text-amber-400 text-lg" />
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">
                Trending in {activeCategory}
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-20 text-zinc-600 text-sm">{error}</div>
            ) : videos.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-zinc-600 text-sm">
                No videos in this category yet — check back soon!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-7">
                {videos.map((video) => (
                  <VideoCard key={video._id} video={video} />
                ))}
              </div>
            )}

      </div>
    </div>
  )
}
