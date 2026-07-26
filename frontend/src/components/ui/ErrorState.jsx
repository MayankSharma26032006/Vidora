import { RiRefreshLine } from "react-icons/ri"

const VARIANTS = {
  network:    { emoji: "📡", title: "No internet connection",  color: "text-red-400",   bg: "bg-red-500/10 border-red-500/20"     },
  server:     { emoji: "⚙️",  title: "Something went wrong",   color: "text-zinc-400",  bg: "bg-zinc-800 border-white/[0.06]"     },
  notFound:   { emoji: "🔍", title: "Not found",              color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  permission: { emoji: "🔒", title: "Access denied",          color: "text-zinc-400",  bg: "bg-zinc-800 border-white/[0.06]"     },
  generic:    { emoji: "⚠️",  title: "An error occurred",      color: "text-red-400",   bg: "bg-red-500/10 border-red-500/20"     },
}

export default function ErrorState({
  variant     = "generic",
  title,
  description,
  onRetry,
  retryLabel  = "Try again",
  className   = "",
}) {
  const config = VARIANTS[variant] || VARIANTS.generic

  return (
    <div className={`flex flex-col items-center justify-center py-20 px-6 text-center ${className}`}>
      <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-5 text-2xl ${config.bg}`}>
        {config.emoji}
      </div>
      <h3 className={`text-base font-semibold mb-2 ${config.color}`}>
        {title || config.title}
      </h3>
      {description && (
        <p className="text-sm text-zinc-600 max-w-xs leading-relaxed mb-6">{description}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors"
        >
          <RiRefreshLine className="text-[15px]" />
          {retryLabel}
        </button>
      )}
    </div>
  )
}
