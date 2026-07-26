import { RiArrowDownSLine } from "react-icons/ri"

export default function Select({
  label,
  hint,
  error,
  options   = [],
  value,
  onChange,
  placeholder = "Select an option",
  disabled  = false,
  required  = false,
  className = "",
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-300">
            {label}{required && <span className="text-amber-400 ml-0.5">*</span>}
          </label>
          {hint && <span className="text-xs text-zinc-600">{hint}</span>}
        </div>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`
            w-full px-4 py-3 pr-10 rounded-xl border bg-zinc-900 text-sm
            outline-none transition-colors appearance-none cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error
              ? "border-red-500/40 focus:border-red-500/60 text-zinc-200"
              : "border-white/[0.08] focus:border-amber-500/40 text-zinc-200"
            }
            ${!value ? "text-zinc-600" : "text-zinc-200"}
          `}
        >
          {placeholder && (
            <option value="" className="bg-zinc-900 text-zinc-600">{placeholder}</option>
          )}
          {options.map((opt) => {
            const val   = typeof opt === "object" ? opt.value : opt
            const label = typeof opt === "object" ? opt.label : opt
            return (
              <option key={val} value={val} className="bg-zinc-900 text-zinc-200">
                {label}
              </option>
            )
          })}
        </select>
        <RiArrowDownSLine className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px] pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
