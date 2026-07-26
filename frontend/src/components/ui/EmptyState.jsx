export default function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel = "Get started",
  className   = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 px-6 text-center ${className}`}>
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5 text-zinc-600 text-3xl">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-base font-semibold text-zinc-300 mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-zinc-600 max-w-xs leading-relaxed mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
