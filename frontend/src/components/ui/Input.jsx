export default function Input({
  label,
  hint,
  error,
  prefix,
  suffix,
  type      = "text",
  placeholder,
  value,
  onChange,
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
          {hint && <span className="text-xs text-zinc-600">{hint}</span>}
        </div>
      )}
      <div className={`relative flex items-center rounded-xl border transition-colors
        ${error
          ? "border-red-500/40 focus-within:border-red-500/60"
          : "border-white/[0.08] focus-within:border-amber-500/40"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        bg-zinc-900
      `}>
        {prefix && (
          <span className="pl-4 text-zinc-600 text-sm shrink-0">{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="flex-1 px-4 py-3 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none disabled:cursor-not-allowed"
          {...props}
        />
        {suffix && (
          <span className="pr-4 text-zinc-600 text-sm shrink-0">{suffix}</span>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
