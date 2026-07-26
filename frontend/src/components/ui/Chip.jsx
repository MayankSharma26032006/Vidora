import { RiCloseLine } from "react-icons/ri"

export default function Chip({
  label,
  active    = false,
  removable = false,
  onRemove,
  onClick,
  icon,
  disabled  = false,
  className = "",
}) {
  return (
    <span
      onClick={!disabled ? onClick : undefined}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
        border transition-all duration-150 select-none
        ${onClick && !disabled ? "cursor-pointer" : ""}
        ${disabled ? "opacity-40 cursor-not-allowed" : ""}
        ${active
          ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
          : "bg-white/[0.06] border-white/[0.08] text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-200"
        }
        ${className}
      `}
    >
      {icon && <span className="text-[14px]">{icon}</span>}
      {label}
      {removable && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove?.() }}
          className="text-current hover:text-white transition-colors"
        >
          <RiCloseLine className="text-[14px]" />
        </button>
      )}
    </span>
  )
}
