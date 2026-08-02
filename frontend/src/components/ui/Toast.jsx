import { useState, useEffect, createContext, useContext, useCallback } from "react"
import { RiCheckLine, RiErrorWarningLine, RiInformationLine, RiCloseLine, RiAlertLine } from "react-icons/ri"

const ToastContext = createContext(null)

const ICONS = {
  success: { icon: RiCheckLine,         color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  error:   { icon: RiErrorWarningLine,  color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20"         },
  warning: { icon: RiAlertLine,         color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20"     },
  info:    { icon: RiInformationLine,   color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20"       },
}

function ToastItem({ toast, onRemove }) {
  const config = ICONS[toast.type] || ICONS.info
  const Icon   = config.icon

  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), toast.duration || 3500)
    return () => clearTimeout(t)
  }, [toast.id, toast.duration, onRemove])

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl shadow-black/40 min-w-[280px] max-w-sm ${config.bg}`}>
      <Icon className={`${config.color} text-[18px] shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        {toast.title && <p className="text-sm font-semibold text-zinc-200 mb-0.5">{toast.title}</p>}
        <p className="text-sm text-zinc-400">{toast.message}</p>
      </div>
      <button onClick={() => onRemove(toast.id)} className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0">
        <RiCloseLine className="text-[16px]" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id))
  }, [])

  const add = useCallback((toast) => {
    const id = Date.now() + Math.random()
    setToasts(p => [...p, { ...toast, id }])
    return id
  }, [])

  return (
    <ToastContext.Provider value={{ add, remove }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={remove} />)}
      </div>
    </ToastContext.Provider>
  )
}

// Hook + provider live together for convenience; disable fast-refresh rule
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside ToastProvider")
  const toast = {
    success: (message, title) => ctx.add({ type: "success", message, title }),
    error:   (message, title) => ctx.add({ type: "error",   message, title }),
    warning: (message, title) => ctx.add({ type: "warning", message, title }),
    info:    (message, title) => ctx.add({ type: "info",    message, title }),
  }
  return toast
}
