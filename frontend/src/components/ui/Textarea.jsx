export default function Textarea({
  label,
  hint,
  error,
  placeholder,
  value,
  onChange,
  rows      = 4,
  maxLength,
  disabled  = false,
  required  = false,
  className = "",
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-300">
            {label}{required && <span className="text-amber-400 ml-0.5">*</span>}
          </label>
          {maxLength && value !== undefined && (
            <span className="text-xs text-zinc-600">{value.length}/{maxLength}</span>
          )}
          {hint && !maxLength && <span className="text-xs text-zinc-600">{hint}</span>}
        </div>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        required={required}
        className={`
          w-full px-4 py-3 rounded-xl border bg-zinc-900 text-sm text-zinc-200
          placeholder:text-zinc-600 outline-none resize-none transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error
            ? "border-red-500/40 focus:border-red-500/60"
            : "border-white/[0.08] focus:border-amber-500/40"
          }
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
