import { useState } from "react"
import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import VideoCard from "../../components/cards/VideoCard"
import { RiFireLine } from "react-icons/ri"

const CATEGORIES = [
  { label: "Music",     emoji: "🎵" },
  { label: "Coding",    emoji: "💻" },
  { label: "Gaming",    emoji: "🎮" },
  { label: "Fitness",   emoji: "🏋️" },
  { label: "News",      emoji: "📰" },
  { label: "Travel",    emoji: "✈️" },
  { label: "AI",        emoji: "🤖" },
  { label: "Education", emoji: "📚" },
]

const ALL_VIDEOS = {
  Music: [
    { _id: "m1", title: "Building a warm analog beat from scratch", thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=80", duration: 843, views: 184200, createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(), owner: { fullname: "Nova Reyes", username: "novasound", avatar: null } },
    { _id: "m2", title: "How I mix vocals to sit in a dense track", thumbnail: "https://images.unsplash.com/photo-1519508234439-4f23643125c1?w=600&q=80", duration: 967, views: 74200, createdAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString(), owner: { fullname: "Nova Reyes", username: "novasound", avatar: null } },
    { _id: "m3", title: "Lo-fi beat in 10 minutes — live session", thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80", duration: 634, views: 98400, createdAt: new Date(Date.now() - 45 * 86400 * 1000).toISOString(), owner: { fullname: "Nova Reyes", username: "novasound", avatar: null } },
  ],
  Coding: [
    { _id: "c1", title: "Building REST APIs with Node.js", thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80", duration: 754, views: 48200, createdAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(), owner: { fullname: "Mayank Sharma", username: "mayank", avatar: null } },
    { _id: "c2", title: "MongoDB aggregation pipelines explained", thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80", duration: 482, views: 22100, createdAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString(), owner: { fullname: "Mayank Sharma", username: "mayank", avatar: null } },
    { _id: "c3", title: "React hooks every developer should know", thumbnail: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=600&q=80", duration: 1447, views: 156000, createdAt: new Date(Date.now() - 21 * 86400 * 1000).toISOString(), owner: { fullname: "Dev Patel", username: "devpatel", avatar: null } },
  ],
  Gaming: [
    { _id: "g1", title: "How I hit Diamond in 30 days — full breakdown", thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80", duration: 1823, views: 310000, createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(), owner: { fullname: "Marco Levi", username: "marcolevi", avatar: null } },
    { _id: "g2", title: "Best PC setup for competitive gaming 2026", thumbnail: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&q=80", duration: 923, views: 89400, createdAt: new Date(Date.now() - 15 * 86400 * 1000).toISOString(), owner: { fullname: "Dev Patel", username: "devpatel", avatar: null } },
    { _id: "g3", title: "Indie game dev — building my first game in 30 days", thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80", duration: 2134, views: 44100, createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(), owner: { fullname: "Sara Bloom", username: "sarabloom", avatar: null } },
  ],
  Fitness: [
    { _id: "f1", title: "Morning run routine that changed my life", thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80", duration: 334, views: 67800, createdAt: new Date(Date.now() - 4 * 86400 * 1000).toISOString(), owner: { fullname: "Lena Kraft", username: "lenakraft", avatar: null } },
    { _id: "f2", title: "Full body workout — no equipment needed", thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80", duration: 1823, views: 203000, createdAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString(), owner: { fullname: "Lena Kraft", username: "lenakraft", avatar: null } },
    { _id: "f3", title: "What I eat in a day — athlete edition", thumbnail: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80", duration: 723, views: 31200, createdAt: new Date(Date.now() - 20 * 86400 * 1000).toISOString(), owner: { fullname: "Marco Levi", username: "marcolevi", avatar: null } },
  ],
  News: [
    { _id: "n1", title: "AI regulation in 2026 — what you need to know", thumbnail: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80", duration: 623, views: 112000, createdAt: new Date(Date.now() - 1 * 86400 * 1000).toISOString(), owner: { fullname: "Sara Bloom", username: "sarabloom", avatar: null } },
    { _id: "n2", title: "The future of remote work — 2026 edition", thumbnail: "https://images.unsplash.com/photo-1585974738771-84483dd9f89f?w=600&q=80", duration: 834, views: 54300, createdAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(), owner: { fullname: "Dev Patel", username: "devpatel", avatar: null } },
    { _id: "n3", title: "Tech layoffs — what is really happening", thumbnail: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600&q=80", duration: 912, views: 89000, createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(), owner: { fullname: "Marco Levi", username: "marcolevi", avatar: null } },
  ],
  Travel: [
    { _id: "t1", title: "Solo hiking the Dolomites for 7 days", thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80", duration: 1102, views: 421900, createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(), owner: { fullname: "Marco Levi", username: "marcolevi", avatar: null } },
    { _id: "t2", title: "Iceland ring road in 10 days", thumbnail: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80", duration: 1574, views: 310000, createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(), owner: { fullname: "Sara Bloom", username: "sarabloom", avatar: null } },
    { _id: "t3", title: "Tokyo on a budget — 7 day guide", thumbnail: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80", duration: 923, views: 189000, createdAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString(), owner: { fullname: "Lena Kraft", username: "lenakraft", avatar: null } },
  ],
  AI: [
    { _id: "a1", title: "Building AI apps with LangChain — full guide", thumbnail: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80", duration: 2341, views: 312000, createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(), owner: { fullname: "Dev Patel", username: "devpatel", avatar: null } },
    { _id: "a2", title: "Fine tuning your own LLM — step by step", thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80", duration: 1823, views: 89400, createdAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString(), owner: { fullname: "Mayank Sharma", username: "mayank", avatar: null } },
    { _id: "a3", title: "Prompt engineering masterclass 2026", thumbnail: "https://images.unsplash.com/photo-1676299081847-824916de030a?w=600&q=80", duration: 1102, views: 203000, createdAt: new Date(Date.now() - 15 * 86400 * 1000).toISOString(), owner: { fullname: "Sara Bloom", username: "sarabloom", avatar: null } },
  ],
  Education: [
    { _id: "e1", title: "How to learn anything fast — science backed", thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80", duration: 923, views: 412000, createdAt: new Date(Date.now() - 20 * 86400 * 1000).toISOString(), owner: { fullname: "Lena Kraft", username: "lenakraft", avatar: null } },
    { _id: "e2", title: "The complete guide to taking notes", thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80", duration: 634, views: 156000, createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(), owner: { fullname: "Marco Levi", username: "marcolevi", avatar: null } },
    { _id: "e3", title: "Feynman technique — understand anything deeply", thumbnail: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=600&q=80", duration: 712, views: 89300, createdAt: new Date(Date.now() - 45 * 86400 * 1000).toISOString(), owner: { fullname: "Dev Patel", username: "devpatel", avatar: null } },
  ],
}

export default function Explore() {
  const [activeCategory, setActiveCategory] = useState("Music")
  const videos = ALL_VIDEOS[activeCategory] || []

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-[1100px] mx-auto">

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Explore</h1>
              <p className="text-sm text-zinc-500">Discover videos across all categories.</p>
            </div>

            <div className="flex gap-3 flex-wrap mb-8">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(cat.label)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all
                    ${activeCategory === cat.label
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                      : "bg-zinc-900 border-white/[0.06] text-zinc-400 hover:border-white/[0.14] hover:text-zinc-200"
                    }
                  `}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-5">
              <RiFireLine className="text-amber-400 text-lg" />
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">
                Trending in {activeCategory}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-7">
              {videos.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
