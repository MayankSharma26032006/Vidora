
import { useState } from "react"
import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import VideoCard from "../../components/cards/VideoCard"
import {
  RiBellLine,
  RiBellFill,
  RiLinksLine,
  RiTwitterXLine,
  RiInstagramLine,
} from "react-icons/ri"

const MOCK_CHANNEL = {
  _id: "u1",
  fullname: "Nova Reyes",
  username: "novasound",
  avatar: null,
  coverImage: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1400&q=80",
  bio: "Producer and sound designer based in Berlin. New beats, gear breakdowns, and mixing sessions every week. I make music with hardware only — no plugins.",
  subscribersCount: 284000,
  totalViews: 4800000,
  totalVideos: 48,
  joinedAt: "2022-03-15T00:00:00.000Z",
  links: [
    { label: "novasound.io", url: "#", icon: RiLinksLine },
    { label: "twitter", url: "#", icon: RiTwitterXLine },
    { label: "instagram", url: "#", icon: RiInstagramLine },
  ],
}

const MOCK_VIDEOS = [
  {
    _id: "v1",
    title: "Building a warm analog beat from scratch (no plugins)",
    thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=80",
    duration: 843,
    views: 184200,
    createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
    owner: { fullname: "Nova Reyes", username: "novasound", avatar: null },
  },
  {
    _id: "v2",
    title: "How I mix vocals to sit in a dense track",
    thumbnail: "https://images.unsplash.com/photo-1519508234439-4f23643125c1?w=600&q=80",
    duration: 967,
    views: 74200,
    createdAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString(),
    owner: { fullname: "Nova Reyes", username: "novasound", avatar: null },
  },
  {
    _id: "v3",
    title: "My entire hardware studio setup — 2026 edition",
    thumbnail: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600&q=80",
    duration: 1245,
    views: 312000,
    createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
    owner: { fullname: "Nova Reyes", username: "novasound", avatar: null },
  },
  {
    _id: "v4",
    title: "Lo-fi beat in 10 minutes — live session",
    thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80",
    duration: 634,
    views: 98400,
    createdAt: new Date(Date.now() - 45 * 86400 * 1000).toISOString(),
    owner: { fullname: "Nova Reyes", username: "novasound", avatar: null },
  },
  {
    _id: "v5",
    title: "Roland TR-8S deep dive — every feature explained",
    thumbnail: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=600&q=80",
    duration: 2134,
    views: 156000,
    createdAt: new Date(Date.now() - 60 * 86400 * 1000).toISOString(),
    owner: { fullname: "Nova Reyes", username: "novasound", avatar: null },
  },
  {
    _id: "v6",
    title: "Why I stopped using plugins entirely",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80",
    duration: 756,
    views: 421000,
    createdAt: new Date(Date.now() - 90 * 86400 * 1000).toISOString(),
    owner: { fullname: "Nova Reyes", username: "novasound", avatar: null },
  },
]

const TABS = ["Videos", "Playlists", "Community", "About"]

function formatCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function ChannelAvatar({ name, src }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?"
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-24 h-24 rounded-full object-cover border-4 border-zinc-950 shrink-0"
      />
    )
  }
  return (
    <div className="w-24 h-24 rounded-full bg-amber-500/20 border-4 border-zinc-950 flex items-center justify-center text-amber-400 text-3xl font-bold shrink-0">
      {initials}
    </div>
  )
}

function VideosTab({ videos }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-7 pb-8">
      {videos.map((video) => (
        <VideoCard key={video._id} video={video} />
      ))}
    </div>
  )
}

function PlaylistsTab() {
  return (
    <div className="flex items-center justify-center py-24 text-zinc-600 text-sm">
      No playlists created yet.
    </div>
  )
}

function CommunityTab() {
  return (
    <div className="flex items-center justify-center py-24 text-zinc-600 text-sm">
      No community posts yet.
    </div>
  )
}

function AboutTab({ channel }) {
  return (
    <div className="max-w-2xl py-6 flex flex-col gap-8 pb-8">
      <div>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          Bio
        </h3>
        <p className="text-sm text-zinc-300 leading-relaxed">{channel.bio}</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          Links
        </h3>
        <div className="flex flex-col gap-2">
          {channel.links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors w-fit"
            >
              <link.icon className="text-[15px]" />
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          Channel stats
        </h3>
        <div className="flex flex-col gap-1.5 text-sm text-zinc-400">
          <p>
            Joined{" "}
            {new Date(channel.joinedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
            })}
          </p>
          <p>{formatCount(channel.totalViews)} total views</p>
          <p>{channel.totalVideos} videos published</p>
        </div>
      </div>
    </div>
  )
}

export default function Channel() {
  const [subscribed, setSubscribed] = useState(false)
  const [notified, setNotified]     = useState(false)
  const [activeTab, setActiveTab]   = useState("Videos")

  function handleSubscribe() {
    setSubscribed((p) => !p)
    if (subscribed) setNotified(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">

          <div className="relative w-full h-44 bg-zinc-900 overflow-hidden">
            <img
              src={MOCK_CHANNEL.coverImage}
              alt="Channel cover"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
          </div>

          <div className="px-6 max-w-[1200px] mx-auto">

            <div className="flex flex-wrap items-end gap-5 -mt-12 mb-6 relative z-10">
              <ChannelAvatar name={MOCK_CHANNEL.fullname} src={MOCK_CHANNEL.avatar} />

              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-2xl font-bold text-white mb-1">
                  {MOCK_CHANNEL.fullname}
                </h1>
                <p className="text-sm text-zinc-500">
                  @{MOCK_CHANNEL.username}
                  <span className="mx-2">·</span>
                  {formatCount(MOCK_CHANNEL.subscribersCount)} subscribers
                  <span className="mx-2">·</span>
                  {MOCK_CHANNEL.totalVideos} videos
                </p>
                <p className="text-sm text-zinc-500 mt-1 line-clamp-1 max-w-md">
                  {MOCK_CHANNEL.bio}
                </p>
              </div>

              <div className="flex items-center gap-2 pb-1 shrink-0">
                {subscribed && (
                  <button
                    onClick={() => setNotified((p) => !p)}
                    className={`
                      w-9 h-9 rounded-full border flex items-center justify-center transition-all
                      ${notified
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                        : "bg-white/[0.06] border-white/[0.08] text-zinc-400 hover:text-zinc-200"
                      }
                    `}
                  >
                    {notified
                      ? <RiBellFill className="text-[17px]" />
                      : <RiBellLine className="text-[17px]" />
                    }
                  </button>
                )}

                <button
                  onClick={handleSubscribe}
                  className={`
                    px-6 py-2.5 rounded-full text-sm font-semibold transition-all
                    ${subscribed
                      ? "bg-white/[0.08] text-zinc-400 hover:bg-white/[0.12]"
                      : "bg-white text-zinc-950 hover:bg-zinc-100"
                    }
                  `}
                >
                  {subscribed ? "Subscribed" : "Subscribe"}
                </button>

                <button className="px-6 py-2.5 rounded-full text-sm font-semibold border border-white/[0.12] text-zinc-300 hover:bg-white/[0.06] transition-all">
                  Join
                </button>
              </div>
            </div>

            <div className="flex gap-0 border-b border-white/[0.06] mb-6">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    px-4 pb-3 text-sm font-medium transition-all border-b-2 -mb-[1px]
                    ${activeTab === tab
                      ? "text-white border-white"
                      : "text-zinc-500 border-transparent hover:text-zinc-300"
                    }
                  `}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "Videos"    && <VideosTab videos={MOCK_VIDEOS} />}
            {activeTab === "Playlists" && <PlaylistsTab />}
            {activeTab === "Community" && <CommunityTab />}
            {activeTab === "About"     && <AboutTab channel={MOCK_CHANNEL} />}

          </div>
        </main>
      </div>
    </div>
  )
}
