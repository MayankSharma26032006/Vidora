import { useState, useMemo } from "react"
import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import VideoCard from "../../components/cards/VideoCard"
import { RiSearchLine, RiEqualizerLine } from "react-icons/ri"

const FILTERS = ["All", "Videos", "Channels", "Playlists", "Live"]
const SORT_OPTIONS = ["Relevance", "Upload date", "View count", "Rating"]

const MOCK_RESULTS = [
  { _id: "1", title: "Building REST APIs with Node.js — complete guide", thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80", duration: 754, views: 48200, createdAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(), owner: { fullname: "Mayank Sharma", username: "mayank", avatar: null } },
  { _id: "2", title: "Node.js crash course for beginners 2026", thumbnail: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=600&q=80", duration: 1447, views: 156000, createdAt: new Date(Date.now() - 21 * 86400 * 1000).toISOString(), owner: { fullname: "Dev Patel", username: "devpatel", avatar: null } },
  { _id: "3", title: "MongoDB aggregation pipelines explained simply", thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80", duration: 482, views: 22100, createdAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString(), owner: { fullname: "Mayank Sharma", username: "mayank", avatar: null } },
  { _id: "4", title: "Express.js middleware — everything you need to know", thumbnail: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&q=80", duration: 623, views: 31400, createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(), owner: { fullname: "Sara Bloom", username: "sarabloom", avatar: null } },
  { _id: "5", title: "JWT authentication from scratch", thumbnail: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&q=80", duration: 834, views: 67800, createdAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString(), owner: { fullname: "Dev Patel", username: "devpatel", avatar: null } },
  { _id: "6", title: "React hooks every developer should know", thumbnail: "https://images.unsplash.com/photo-1581276879432-15e50529f34b?w=600&q=80", duration: 912, views: 89300, createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(), owner: { fullname: "Lena Kraft", username: "lenakraft", avatar: null } },
  { _id: "7", title: "Tailwind CSS full course — build anything", thumbnail: "https://images.unsplash.com/photo-1587620962725-abab19836100?w=600&q=80", duration: 1823, views: 203000, createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(), owner: { fullname: "Marco Levi", username: "marcolevi", avatar: null } },
  { _id: "8", title: "Docker for Node.js developers", thumbnail: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=600&q=80", duration: 1102, views: 44100, createdAt: new Date(Date.now() - 45 * 86400 * 1000).toISOString(), owner: { fullname: "Sara Bloom", username: "sarabloom", avatar: null } },
  { _id: "9", title: "Full stack app from scratch — MERN 2026", thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80", duration: 3241, views: 412000, createdAt: new Date(Date.now() - 60 * 86400 * 1000).toISOString(), owner: { fullname: "Mayank Sharma", username: "mayank", avatar: null } },
]

export default function Search() {
  const [query, setQuery]         = useState("node js")
  const [activeFilter, setFilter] = useState("All")
  const [sortBy, setSortBy]       = useState("Relevance")

  const results = useMemo(() => {
    let list = [...MOCK_RESULTS]
    if (sortBy === "View count") list.sort((a, b) => b.views - a.views)
    if (sortBy === "Upload date") list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return list
  }, [sortBy])

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-[1100px] mx-auto">

            <div className="relative mb-6">
              <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search videos, creators, playlists..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-900 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <RiEqualizerLine className="text-zinc-500 text-[16px] shrink-0" />
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeFilter === f ? "bg-white text-zinc-950" : "bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-200"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-xl border border-white/[0.08] bg-zinc-900 text-sm text-zinc-400 outline-none focus:border-amber-500/40 transition-colors cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o} value={o} className="bg-zinc-900">{o}</option>
                ))}
              </select>
            </div>

            <p className="text-xs text-zinc-600 mb-5">
              {results.length} results for <span className="text-zinc-400">"{query}"</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-7">
              {results.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
