import { RiAlertLine } from "react-icons/ri"

const VARIANTS = {
  danger:  { color: "text-red-400",   bg: "bg-red-500/10 border-red-500/20",     btn: "bg-red-500 hover:bg-red-400 text-white"              },
  warning: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", btn: "bg-amber-500 hover:bg-amber-400 text-zinc-950"       },
  info:    { color: "text-blue-400",  bg: "bg-blue-500/10 border-blue-500/20",   btn: "bg-blue-500 hover:bg-blue-400 text-white"            },
}

export default function ConfirmDialog({
  open        = false,
  onClose,
  onConfirm,
  title       = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel  = "Cancel",
  variant      = "danger",
  loading      = false,
}) {
  if (!open) return null

  const config = VARIANTS[variant] || VARIANTS.danger

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-zinc-900 border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 z-10 overflow-hidden">

        <div className="p-6">
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${config.bg}`}>
            <RiAlertLine className={`text-xl ${config.color}`} />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
          {description && (
            <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
          )}
        </div>

        <div className="px-6 pb-6 flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-zinc-400 text-sm font-medium hover:text-zinc-200 hover:border-white/[0.16] transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${config.btn}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Loading...
              </span>
            ) : confirmLabel}
          </button>
        </div>

      </div>
    </div>
  )
}
