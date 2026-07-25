import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import VideoCard from "../../components/cards/VideoCard"

const now = Date.now()

const MOCK_HISTORY = {
  Today: [
    { _id: "h1", title: "Building a warm analog beat from scratch (no plugins)", thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=80", duration: 843, views: 184200, createdAt: new Date(now - 2 * 86400 * 1000).toISOString(), owner: { fullname: "Nova Reyes", username: "novasound", avatar: null } },
    { _id: "h2", title: "Building REST APIs with Node.js — complete guide", thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80", duration: 754, views: 48200, createdAt: new Date(now - 3 * 86400 * 1000).toISOString(), owner: { fullname: "Mayank Sharma", username: "mayank", avatar: null } },
    { _id: "h3", title: "Morning run routine that changed my life", thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80", duration: 334, views: 67800, createdAt: new Date(now - 4 * 86400 * 1000).toISOString(), owner: { fullname: "Lena Kraft", username: "lenakraft", avatar: null } },
  ],
  Yesterday: [
    { _id: "h4", title: "Solo hiking the Dolomites for 7 days — full journey", thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80", duration: 1102, views: 421900, createdAt: new Date(now - 7 * 86400 * 1000).toISOString(), owner: { fullname: "Marco Levi", username: "marcolevi", avatar: null } },
    { _id: "h5", title: "React hooks every developer should actually know", thumbnail: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=600&q=80", duration: 1447, views: 156000, createdAt: new Date(now - 21 * 86400 * 1000).toISOString(), owner: { fullname: "Dev Patel", username: "devpatel", avatar: null } },
  ],
  "Last Week": [
    { _id: "h6", title: "MongoDB aggregation pipelines explained simply", thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80", duration: 482, views: 22100, createdAt: new Date(now - 10 * 86400 * 1000).toISOString(), owner: { fullname: "Mayank Sharma", username: "mayank", avatar: null } },
    { _id: "h7", title: "Tailwind CSS full course — build anything", thumbnail: "https://images.unsplash.com/photo-1587620962725-abab19836100?w=600&q=80", duration: 1823, views: 203000, createdAt: new Date(now - 30 * 86400 * 1000).toISOString(), owner: { fullname: "Marco Levi", username: "marcolevi", avatar: null } },
    { _id: "h8", title: "How I mix vocals to sit in a dense track", thumbnail: "https://images.unsplash.com/photo-1519508234439-4f23643125c1?w=600&q=80", duration: 967, views: 74200, createdAt: new Date(now - 14 * 86400 * 1000).toISOString(), owner: { fullname: "Nova Reyes", username: "novasound", avatar: null } },
  ],
  Older: [
    { _id: "h9", title: "Iceland ring road in 10 days — what no one tells you", thumbnail: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80", duration: 1574, views: 310000, createdAt: new Date(now - 30 * 86400 * 1000).toISOString(), owner: { fullname: "Sara Bloom", username: "sarabloom", avatar: null } },
    { _id: "h10", title: "Full stack app from scratch — MERN 2026", thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80", duration: 3241, views: 412000, createdAt: new Date(now - 60 * 86400 * 1000).toISOString(), owner: { fullname: "Mayank Sharma", username: "mayank", avatar: null } },
    { _id: "h11", title: "Roland TR-8S deep dive — every feature explained", thumbnail: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=600&q=80", duration: 2134, views: 156000, createdAt: new Date(now - 60 * 86400 * 1000).toISOString(), owner: { fullname: "Nova Reyes", username: "novasound", avatar: null } },
  ],
}

export default function History() {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-[1100px] mx-auto">

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Watch History</h1>
              <p className="text-sm text-zinc-500">Videos you have watched recently.</p>
            </div>

            {Object.entries(MOCK_HISTORY).map(([group, videos]) => (
              <section key={group} className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{group}</h2>
                  <div className="flex-1 h-px bg-white/[0.04]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-7">
                  {videos.map((video) => (
                    <VideoCard key={video._id} video={video} />
                  ))}
                </div>
              </section>
            ))}

          </div>
        </main>
      </div>
    </div>
  )
}
