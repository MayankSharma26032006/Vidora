import { useState } from "react"

const POSITIONS = {
  top:    "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left:   "right-full top-1/2 -translate-y-1/2 mr-2",
  right:  "left-full top-1/2 -translate-y-1/2 ml-2",
}

export default function Tooltip({
  children,
  content,
  position  = "top",
  className = "",
}) {
  const [visible, setVisible] = useState(false)

  if (!content) return children

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className={`
          absolute z-50 px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-white/[0.08]
          text-xs text-zinc-200 whitespace-nowrap shadow-xl pointer-events-none
          ${POSITIONS[position]}
          ${className}
        `}>
          {content}
        </div>
      )}
    </div>
  )
}
