import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { RiEyeLine, RiEyeOffLine, RiCheckLine, RiTimeLine, RiMailSendLine } from "react-icons/ri"
import { useAuth } from "../../context/AuthContext"
import api from "../../services/api"
import Logo from "../../components/ui/Logo"

export default function Login() {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const [unverified, setUnverified] = useState(false)
  const [resending, setResending]   = useState(false)
  const [resent, setResent]         = useState(false)
  const [searchParams]          = useSearchParams()
  const sessionExpired          = searchParams.get("expired") === "1"

  const { login } = useAuth()
  const navigate  = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError("Please fill in all fields."); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email address."); return }
    setError("")
    setLoading(true)

    try {
      const data = await login(email, password)
      const user = data?.data?.user
      if (user && user.isEmailVerified === false) {
        setUnverified(true)
        return
      }
      navigate("/")
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.")
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setResent(false)
    try {
      await api.post("/user/resend-verification")
      setResent(true)
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't resend the email. Please try again.")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-zinc-950">

      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-zinc-900 border-r border-white/[0.06] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <Logo size={30} className="shrink-0" />
            <span className="text-white font-bold text-xl tracking-tight">
              Vid<span className="text-amber-400">Ora</span>
            </span>
          </div>
        </div>

        <div className="relative z-10">
          <div className="w-full aspect-video rounded-2xl bg-zinc-800 border border-white/[0.06] flex items-center justify-center mb-8 overflow-hidden">
            <div className="flex flex-col items-center gap-3 text-zinc-600">
              <Logo size={76} className="opacity-90" />
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

          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <Logo size={26} className="shrink-0" />
            <span className="text-white font-bold text-lg tracking-tight">
              Vid<span className="text-amber-400">Ora</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
            <p className="text-sm text-zinc-500">Sign in to continue to your account.</p>
          </div>

          {sessionExpired && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-center gap-2.5">
              <RiTimeLine className="shrink-0" />
              Your session expired — please sign in again.
            </div>
          )}

          {unverified && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-400 text-sm font-medium flex items-center gap-2">
                <RiMailSendLine className="shrink-0" />
                {resent ? "Verification email sent." : "Please verify your email."}
              </p>
              <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
                Check your inbox and click the link we sent you to activate your account.
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resent}
                className="mt-2.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? "Sending..." : resent ? "Email sent" : "Resend verification email"}
              </button>
            </div>
          )}

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
              <Link to="/forgot-password" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
                Forgot password?
              </Link>
            </div>

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