const SIZES = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
}

export default function Avatar({
  src,
  name,
  size      = "md",
  border    = false,
  className = "",
}) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  const base = `${SIZES[size]} rounded-full shrink-0 flex items-center justify-center font-semibold
    ${border ? "border-2 border-zinc-950" : ""}
    ${className}`

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        className={`${base} object-cover bg-zinc-800`}
      />
    )
  }

  return (
    <div className={`${base} bg-amber-500/20 border border-amber-500/30 text-amber-400`}>
      {initials}
    </div>
  )
}
