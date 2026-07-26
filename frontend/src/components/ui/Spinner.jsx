const SIZES = {
  xs: "w-3 h-3 border",
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-2",
  xl: "w-12 h-12 border-[3px]",
}

const COLORS = {
  amber: "border-amber-400 border-t-transparent",
  white: "border-white border-t-transparent",
  zinc:  "border-zinc-400 border-t-transparent",
}

export default function Spinner({
  size      = "md",
  color     = "amber",
  label,
  center    = false,
  className = "",
}) {
  const spinner = (
    <div className={`flex flex-col items-center gap-3 ${center ? "w-full h-full flex items-center justify-center py-16" : ""} ${className}`}>
      <div className={`${SIZES[size]} ${COLORS[color]} rounded-full animate-spin`} />
      {label && <p className="text-sm text-zinc-500">{label}</p>}
    </div>
  )

  return spinner
}
