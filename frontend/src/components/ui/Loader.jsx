const SIZES = {
  sm: "h-1",
  md: "h-1.5",
  lg: "h-2",
}

export default function Loader({
  progress,
  size      = "md",
  color     = "amber",
  label,
  className = "",
}) {
  const colors = {
    amber:   "bg-amber-400",
    green:   "bg-emerald-400",
    blue:    "bg-blue-400",
    red:     "bg-red-400",
  }

  const indeterminate = progress === undefined

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">{label}</span>
          {!indeterminate && <span className="text-xs text-zinc-500">{Math.round(progress)}%</span>}
        </div>
      )}
      <div className={`w-full ${SIZES[size]} bg-zinc-800 rounded-full overflow-hidden`}>
        {indeterminate ? (
          <div className={`h-full w-1/3 ${colors[color]} rounded-full animate-[loader_1.4s_ease-in-out_infinite]`}
            style={{ animation: "loader 1.4s ease-in-out infinite" }}
          />
        ) : (
          <div
            className={`h-full ${colors[color]} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        )}
      </div>
      <style>{`
        @keyframes loader {
          0%   { transform: translateX(-100%) }
          100% { transform: translateX(400%) }
        }
      `}</style>
    </div>
  )
}
