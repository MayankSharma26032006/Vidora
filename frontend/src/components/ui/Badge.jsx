const VARIANTS = {
  default:  "bg-zinc-800 text-zinc-400 border-white/[0.06]",
  amber:    "bg-amber-500/15 text-amber-400 border-amber-500/25",
  green:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  red:      "bg-red-500/15 text-red-400 border-red-500/25",
  blue:     "bg-blue-500/15 text-blue-400 border-blue-500/25",
  purple:   "bg-purple-500/15 text-purple-400 border-purple-500/25",
}

const SIZES = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1 text-sm",
}

export default function Badge({
  children,
  variant = "default",
  size    = "md",
  dot     = false,
  className = "",
}) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full border font-medium
      ${VARIANTS[variant]}
      ${SIZES[size]}
      ${className}
    `}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      )}
      {children}
    </span>
  )
}
