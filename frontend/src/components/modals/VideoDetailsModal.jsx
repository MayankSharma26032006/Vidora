import { RiCloseLine, RiEyeLine, RiTimeLine, RiCalendarLine, RiPriceTag3Line } from "react-icons/ri"

function formatViews(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

function StatItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-950 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
        <Icon className="text-amber-400 text-[15px]" />
      </div>
      <div>
        <p className="text-xs text-zinc-600">{label}</p>
        <p className="text-sm font-medium text-zinc-200">{value}</p>
      </div>
    </div>
  )
}

export default function VideoDetailsModal({ video, onClose }) {
  if (!video) return null

  const {
    title       = "Untitled",
    thumbnail   = null,
    views       = 0,
    createdAt   = new Date().toISOString(),
    category    = "Uncategorized",
    duration    = 0,
    description = "No description provided.",
  } = video

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl shadow-black/60 z-10 max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
          <h2 className="text-sm font-semibold text-zinc-200">Video details</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all">
            <RiCloseLine className="text-[18px]" />
          </button>
        </div>

        <div className="overflow-y-auto">
          <div className="relative w-full aspect-video bg-zinc-800 shrink-0">
            {thumbnail
              ? <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-4xl">▶</div>
            }
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/80 text-white text-xs font-medium">
              {formatDuration(duration)}
            </div>
          </div>

          <div className="p-5 flex flex-col gap-5">
            <h3 className="text-base font-semibold text-white leading-snug">{title}</h3>

            <div className="grid grid-cols-2 gap-2">
              <StatItem icon={RiEyeLine}      label="Views"       value={formatViews(views)} />
              <StatItem icon={RiTimeLine}     label="Duration"    value={formatDuration(duration)} />
              <StatItem icon={RiCalendarLine} label="Upload date" value={new Date(createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
              <StatItem icon={RiPriceTag3Line} label="Category"   value={category} />
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2">Description</p>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{description}</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-white/[0.06] shrink-0">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-white/[0.08] text-zinc-400 text-sm hover:text-zinc-200 hover:border-white/[0.16] transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
