const VARIANTS = {
  primary:   "bg-amber-500 hover:bg-amber-400 text-zinc-950 border-transparent",
  secondary: "bg-white/[0.07] hover:bg-white/[0.12] text-zinc-200 border-white/[0.08]",
  outline:   "bg-transparent hover:bg-white/[0.05] text-zinc-300 border-white/[0.12] hover:border-white/[0.2]",
  ghost:     "bg-transparent hover:bg-white/[0.05] text-zinc-400 hover:text-zinc-200 border-transparent",
  danger:    "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 hover:border-red-500/40",
}

const SIZES = {
  sm:   "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md:   "px-4 py-2.5 text-sm rounded-xl gap-2",
  lg:   "px-6 py-3 text-sm rounded-xl gap-2",
  icon: "w-9 h-9 rounded-xl",
}

export default function Button({
  children,
  variant  = "primary",
  size     = "md",
  loading  = false,
  disabled = false,
  icon,
  iconRight,
  fullWidth = false,
  onClick,
  type = "button",
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium border transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]}
        ${SIZES[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        <>
          {icon && <span className="text-[16px] shrink-0">{icon}</span>}
          {children}
          {iconRight && <span className="text-[16px] shrink-0">{iconRight}</span>}
        </>
      )}
    </button>
  )
}
