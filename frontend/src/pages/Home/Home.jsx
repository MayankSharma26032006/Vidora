import { useState } from "react"
import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import VideoCard from "../../components/cards/VideoCard"
import { RiFireLine, RiSparklingLine } from "react-icons/ri"
const CATEGORIES = [
  "All",
  "Music",
  "Coding",
  "Travel",
  "Cooking",
  "Gaming",
  "Fitness",
  "Podcasts",
  "Recently uploaded",
  "New to you",
]

const MOCK_VIDEOS = [
  {
    _id: "1",
    title: "Building a warm analog beat from scratch (no plugins)",
    thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=80",
    duration: 843,
    views: 184200,
    createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
    owner: { fullname: "Nova Reyes", username: "novasound", avatar: null },
  },
  {
    _id: "2",
    title: "Solo hiking the Dolomites for 7 days — full journey",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    duration: 1102,
    views: 421900,
    createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
    owner: { fullname: "Marco Levi", username: "marcolevi", avatar: null },
  },
  {
    _id: "3",
    title: "How I mix vocals to sit in a dense track",
    thumbnail: "https://images.unsplash.com/photo-1519508234439-4f23643125c1?w=600&q=80",
    duration: 967,
    views: 74200,
    createdAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString(),
    owner: { fullname: "Nova Reyes", username: "novasound", avatar: null },
  },
  {
    _id: "4",
    title: "The complete guide to building REST APIs with Node.js",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80",
    duration: 754,
    views: 48200,
    createdAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    owner: { fullname: "Mayank Sharma", username: "mayank", avatar: null },
  },
  {
    _id: "5",
    title: "Iceland ring road in 10 days — what no one tells you",
    thumbnail: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80",
    duration: 1574,
    views: 310000,
    createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
    owner: { fullname: "Sara Bloom", username: "sarabloom", avatar: null },
  },
  {
    _id: "6",
    title: "MongoDB aggregation pipelines explained simply",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
    duration: 482,
    views: 22100,
    createdAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
    owner: { fullname: "Mayank Sharma", username: "mayank", avatar: null },
  },
  {
    _id: "7",
    title: "Making authentic Neapolitan pizza at home — step by step",
    thumbnail: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
    duration: 621,
    views: 93400,
    createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
    owner: { fullname: "Giulia Romano", username: "giuliaeats", avatar: null },
  },
  {
    _id: "8",
    title: "React hooks every developer should actually know",
    thumbnail: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=600&q=80",
    duration: 1447,
    views: 156000,
    createdAt: new Date(Date.now() - 21 * 86400 * 1000).toISOString(),
    owner: { fullname: "Dev Patel", username: "devpatel", avatar: null },
  },
  {
    _id: "9",
    title: "Morning run routine that changed my life — 5am club",
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80",
    duration: 334,
    views: 67800,
    createdAt: new Date(Date.now() - 4 * 86400 * 1000).toISOString(),
    owner: { fullname: "Lena Kraft", username: "lenakraft", avatar: null },
  },
]

function CategoryPills({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`
            shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150
            ${active === cat
              ? "bg-white text-zinc-950"
              : "bg-white/[0.07] text-zinc-400 hover:bg-white/[0.12] hover:text-zinc-200"
            }
          `}
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
        <h1 className="text-white text-2xl font-semibold leading-snug mb-2">
          {video.title}
        </h1>
        <p className="text-zinc-400 text-sm mb-4">
          {video.owner.fullname} · {(video.views / 1000).toFixed(1)}K views · 2 days ago
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

  const featured = MOCK_VIDEOS[0]
  const trending = MOCK_VIDEOS.slice(1, 4)
  const forYou   = MOCK_VIDEOS.slice(4)

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 px-6 py-6 overflow-y-auto">
          <FeaturedBanner video={featured} />

          <div className="mb-7">
            <CategoryPills active={activeCategory} onChange={setActiveCategory} />
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : (
            <>
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
