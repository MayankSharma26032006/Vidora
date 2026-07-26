import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri"

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  className = "",
}) {
  if (totalPages <= 1) return null

  function getPages() {
    const pages = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }
    pages.push(1)
    if (page > 3) pages.push("...")
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push("...")
    pages.push(totalPages)
    return pages
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08] text-zinc-500 hover:text-zinc-200 hover:border-white/[0.16] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <RiArrowLeftSLine className="text-[18px]" />
      </button>

      {getPages().map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-zinc-600 text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all border ${
              p === page
                ? "bg-amber-500 text-zinc-950 border-amber-500"
                : "border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.16]"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08] text-zinc-500 hover:text-zinc-200 hover:border-white/[0.16] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <RiArrowRightSLine className="text-[18px]" />
      </button>
    </div>
  )
}
