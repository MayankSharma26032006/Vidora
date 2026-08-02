import { useState } from "react"

export default function Tabs({
  tabs      = [],
  defaultTab,
  onChange,
  variant   = "underline",
  className = "",
}) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id)

  function handleChange(id) {
    setActive(id)
    onChange?.(id)
  }

  const isUnderline = variant === "underline"

  return (
    <div className={className}>
      <div className={`flex ${isUnderline ? "border-b border-white/[0.06] gap-0" : "gap-2 flex-wrap"}`}>
        {tabs.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleChange(tab.id)}
              className={`
                flex items-center gap-2 text-sm font-medium transition-all
                ${isUnderline
                  ? `px-4 pb-3 border-b-2 -mb-[1px] ${isActive ? "text-white border-white" : "text-zinc-500 border-transparent hover:text-zinc-300"}`
                  : `px-4 py-2 rounded-xl border ${isActive ? "bg-amber-500/15 border-amber-500/40 text-amber-400" : "bg-transparent border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.12]"}`
                }
              `}
            >
              {tab.icon && <span className="text-[16px]">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${isActive ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-500"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        {tabs.find(t => t.id === active)?.content}
      </div>
    </div>
  )
}
