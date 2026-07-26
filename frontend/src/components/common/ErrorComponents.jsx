import { RiWifiOffLine, RiSearchLine, RiServerLine, RiLockLine, RiRefreshLine, RiHome5Line } from "react-icons/ri"

function ErrorBase({ icon: Icon, iconColor, badge, title, description, children }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center mb-5 ${iconColor}`}>
        <Icon className="text-3xl" />
      </div>
      {badge && (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-500 border border-white/[0.06] mb-4">
          {badge}
        </span>
      )}
      <h3 className="text-base font-semibold text-zinc-200 mb-2">{title}</h3>
      <p className="text-sm text-zinc-600 max-w-xs leading-relaxed mb-6">{description}</p>
      {children}
    </div>
  )
}

function RetryButton({ onRetry, label = "Try again" }) {
  return (
    <button
      onClick={onRetry}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors"
    >
      <RiRefreshLine className="text-[15px]" />
      {label}
    </button>
  )
}

function HomeButton() {
  return (
    <a href="/" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.08] text-zinc-400 text-sm hover:text-zinc-200 hover:border-white/[0.16] transition-all">
      <RiHome5Line className="text-[15px]" />
      Go home
    </a>
  )
}

export function NetworkError({ onRetry }) {
  return (
    <ErrorBase
      icon={RiWifiOffLine}
      iconColor="bg-red-500/10 border-red-500/20 text-red-400"
      badge="Network error"
      title="No internet connection"
      description="Please check your connection and try again. Your data is safe and will load when you're back online."
    >
      <div className="flex items-center gap-3">
        <RetryButton onRetry={onRetry} />
        <HomeButton />
      </div>
    </ErrorBase>
  )
}

export function NotFoundError() {
  return (
    <ErrorBase
      icon={RiSearchLine}
      iconColor="bg-amber-500/10 border-amber-500/20 text-amber-400"
      badge="404"
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
    >
      <div className="flex items-center gap-3">
        <HomeButton />
      </div>
    </ErrorBase>
  )
}

export function ServerError({ onRetry }) {
  return (
    <ErrorBase
      icon={RiServerLine}
      iconColor="bg-red-500/10 border-red-500/20 text-red-400"
      badge="500"
      title="Something went wrong"
      description="Our servers are having a moment. This is on us — please try again in a little while."
    >
      <div className="flex items-center gap-3">
        <RetryButton onRetry={onRetry} />
        <HomeButton />
      </div>
    </ErrorBase>
  )
}

export function PermissionDenied() {
  return (
    <ErrorBase
      icon={RiLockLine}
      iconColor="bg-zinc-800 border-white/[0.08] text-zinc-500"
      badge="403"
      title="Access denied"
      description="You don't have permission to view this page. Sign in with the correct account or contact the owner."
    >
      <div className="flex items-center gap-3">
        <a href="/login" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors">
          Sign in
        </a>
        <HomeButton />
      </div>
    </ErrorBase>
  )
}

export { RetryButton }
