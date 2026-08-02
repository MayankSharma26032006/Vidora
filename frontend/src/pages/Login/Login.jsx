import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { RiEyeLine, RiEyeOffLine, RiCheckLine } from "react-icons/ri"
import { useAuth } from "../../context/AuthContext"

export default function Login() {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")

  const { login } = useAuth()
  const navigate  = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError("Please fill in all fields."); return }
    setError("")
    setLoading(true)

    try {
      await login(email, password)
      navigate("/")
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-zinc-950">

      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-zinc-900 border-r border-white/[0.06] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-400 text-2xl">▶</span>
            <span className="text-white font-bold text-xl tracking-tight">
              Creator<span className="text-amber-400">Hub</span>
            </span>
          </div>
        </div>

        <div className="relative z-10">
          <div className="w-full aspect-video rounded-2xl bg-zinc-800 border border-white/[0.06] flex items-center justify-center mb-8 overflow-hidden">
            <div className="flex flex-col items-center gap-3 text-zinc-600">
              <span className="text-6xl text-amber-400">▶</span>
              <span className="text-sm">Your content, your audience</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
            Create. Share.<br />
            <span className="text-amber-400">Grow.</span>
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
            Join thousands of creators sharing their work with the world. Upload videos, build your audience, and earn from your content.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6">
          {["48K+", "2M+", "99%"].map((stat, i) => (
            <div key={i}>
              <p className="text-xl font-bold text-white">{stat}</p>
              <p className="text-xs text-zinc-600">{["Creators", "Monthly views", "Uptime"][i]}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="text-amber-400 text-xl">▶</span>
            <span className="text-white font-bold text-lg tracking-tight">
              Creator<span className="text-amber-400">Hub</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
            <p className="text-sm text-zinc-500">Sign in to continue to your account.</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-900 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-300">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full px-4 pr-11 py-3 rounded-xl border border-white/[0.08] bg-zinc-900 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
                />
                <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors">
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setRemember(p => !p)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${remember ? "bg-amber-500 border-amber-500" : "border-white/[0.2] bg-transparent"}`}
                >
                  {remember && <RiCheckLine className="text-zinc-950 text-[11px]" />}
                </button>
                <span className="text-sm text-zinc-400">Remember me</span>
              </label>
              <button type="button" onClick={() => setForgotOpen(p => !p)} className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
                Forgot password?
              </button>
            </div>

            {forgotOpen && (
              <div className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-zinc-400">
                Password reset isn't set up yet — contact support for help recovering your account.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-600 mt-6">
            Don't have an account?{" "}
            <a href="/register" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}