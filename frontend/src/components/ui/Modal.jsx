import { useEffect } from "react"
import { RiCloseLine } from "react-icons/ri"

const SIZES = {
  sm:   "max-w-sm",
  md:   "max-w-lg",
  lg:   "max-w-2xl",
  xl:   "max-w-4xl",
  full: "max-w-[95vw]",
}

export default function Modal({
  open      = false,
  onClose,
  title,
  children,
  footer,
  size      = "md",
  closable  = true,
  className = "",
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closable ? onClose : undefined}
      />
      <div className={`
        relative w-full ${SIZES[size]} bg-zinc-900 border border-white/[0.08]
        rounded-2xl shadow-2xl shadow-black/60 flex flex-col max-h-[90vh] z-10
        ${className}
      `}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {closable && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <RiCloseLine className="text-[18px]" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-white/[0.06] shrink-0 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
