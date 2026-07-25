import { useState } from "react"
import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import VideoCard from "../../components/cards/VideoCard"
import { RiBellLine, RiBellFill } from "react-icons/ri"

const MOCK_CREATORS = [
  { _id: "c1", fullname: "Nova Reyes", username: "novasound", avatar: null, subscribersCount: 284000, latestUpload: "Building a warm analog beat from scratch", isSubscribed: true },
  { _id: "c2", fullname: "Mayank Sharma", username: "mayank", avatar: null, subscribersCount: 48200, latestUpload: "Building REST APIs with Node.js", isSubscribed: true },
  { _id: "c3", fullname: "Marco Levi", username: "marcolevi", avatar: null, subscribersCount: 421900, latestUpload: "Solo hiking the Dolomites for 7 days", isSubscribed: true },
  { _id: "c4", fullname: "Dev Patel", username: "devpatel", avatar: null, subscribersCount: 156000, latestUpload: "React hooks every developer should know", isSubscribed: true },
  { _id: "c5", fullname: "Sara Bloom", username: "sarabloom", avatar: null, subscribersCount: 310000, latestUpload: "Iceland ring road in 10 days", isSubscribed: true },
  { _id: "c6", fullname: "Lena Kraft", username: "lenakraft", avatar: null, subscribersCount: 67800, latestUpload: "Morning run routine that changed my life", isSubscribed: false },
]

const LATEST_VIDEOS = [
  { _id: "v1", title: "Building a warm analog beat from scratch (no plugins)", thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=80", duration: 843, views: 184200, createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(), owner: { fullname: "Nova Reyes", username: "novasound", avatar: null } },
  { _id: "v2", title: "Building REST APIs with Node.js — complete guide", thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80", duration: 754, views: 48200, createdAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(), owner: { fullname: "Mayank Sharma", username: "mayank", avatar: null } },
  { _id: "v3", title: "Solo hiking the Dolomites for 7 days", thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80", duration: 1102, views: 421900, createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(), owner: { fullname: "Marco Levi", username: "marcolevi", avatar: null } },
  { _id: "v4", title: "React hooks every developer should actually know", thumbnail: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=600&q=80", duration: 1447, views: 156000, createdAt: new Date(Date.now() - 21 * 86400 * 1000).toISOString(), owner: { fullname: "Dev Patel", username: "devpatel", avatar: null } },
  { _id: "v5", title: "Iceland ring road in 10 days — what no one tells you", thumbnail: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80", duration: 1574, views: 310000, createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(), owner: { fullname: "Sara Bloom", username: "sarabloom", avatar: null } },
  { _id: "v6", title: "Morning run routine that changed my life", thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80", duration: 334, views: 67800, createdAt: new Date(Date.now() - 4 * 86400 * 1000).toISOString(), owner: { fullname: "Lena Kraft", username: "lenakraft", avatar: null } },
]

function formatCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function CreatorCard({ creator }) {
  const [subscribed, setSubscribed] = useState(creator.isSubscribed)
  const [notified, setNotified]     = useState(false)

  const initials = creator.fullname.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()

  return (
    <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl p-5 flex flex-col items-center text-center gap-4">
      <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 text-xl font-bold">
        {initials}
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-200 mb-0.5">{creator.fullname}</p>
        <p className="text-xs text-zinc-600 mb-1">@{creator.username}</p>
        <p className="text-xs text-zinc-500">{formatCount(creator.subscribersCount)} subscribers</p>
        <p className="text-xs text-zinc-600 mt-1 line-clamp-1 px-2">Latest: {creator.latestUpload}</p>
      </div>
      <div className="flex items-center gap-2 w-full">
        <button
          onClick={() => setSubscribed((p) => !p)}
          className={`
            flex-1 py-2 rounded-xl text-xs font-semibold transition-all
            ${subscribed
              ? "bg-white/[0.08] text-zinc-400 hover:bg-white/[0.12]"
              : "bg-white text-zinc-950 hover:bg-zinc-100"
            }
          `}
        >
          {subscribed ? "Subscribed" : "Subscribe"}
        </button>
        {subscribed && (
          <button
            onClick={() => setNotified((p) => !p)}
            className={`
              w-8 h-8 rounded-xl border flex items-center justify-center transition-all shrink-0
              ${notified
                ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                : "bg-white/[0.06] border-white/[0.08] text-zinc-500 hover:text-zinc-300"
              }
            `}
          >
            {notified ? <RiBellFill className="text-[14px]" /> : <RiBellLine className="text-[14px]" />}
          </button>
        )}
      </div>
    </div>
  )
}

export default function Subscriptions() {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-[1100px] mx-auto">

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Subscriptions</h1>
              <p className="text-sm text-zinc-500">Creators you follow.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-10">
              {MOCK_CREATORS.map((creator) => (
                <CreatorCard key={creator._id} creator={creator} />
              ))}
            </div>

            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Latest from subscriptions</h2>
              <div className="flex-1 h-px bg-white/[0.04]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-7 pb-8">
              {LATEST_VIDEOS.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
