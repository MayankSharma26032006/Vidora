import { RiHome5Line, RiCompassLine } from "react-icons/ri"
import Logo from "../../components/ui/Logo"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/3 via-transparent to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/3 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        <div className="flex items-center gap-2.5 mb-12">
          <Logo size={30} className="shrink-0" />
          <span className="text-white font-bold text-xl tracking-tight">
            Vid<span className="text-amber-400">Ora</span>
          </span>
        </div>

        <p className="text-[120px] font-black text-white leading-none mb-2 tracking-tighter">
          4<span className="text-amber-400">0</span>4
        </p>

        <h1 className="text-xl font-semibold text-white mb-3">Page not found</h1>
        <p className="text-sm text-zinc-500 leading-relaxed mb-10">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors"
          >
            <RiHome5Line className="text-[16px]" />
            Go home
          </a>
          <a
            href="/explore"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/[0.1] text-zinc-300 text-sm font-medium hover:border-white/[0.2] hover:text-white transition-all"
          >
            <RiCompassLine className="text-[16px]" />
            Explore videos
          </a>
        </div>
      </div>
    </div>
  )
}
