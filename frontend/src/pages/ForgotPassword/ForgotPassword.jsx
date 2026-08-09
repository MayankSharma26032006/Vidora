import { useState } from "react"
import { Link } from "react-router-dom"
import { RiMailSendLine, RiArrowLeftLine } from "react-icons/ri"
import api from "../../services/api"
import Logo from "../../components/ui/Logo"

export default function ForgotPassword() {
  const [email, setEmail]    = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [sent, setSent]       = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.")
      return
    }
    setError("")
    setLoading(true)
    try {
      await api.post("/user/forgot-password", { email })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-zinc-950">

      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-zinc-900 border-r border-white/[0.06] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6">
          <Logo />
          <p className="text-sm text-zinc-500 max-w-md leading-relaxed">
            Lost access to your account? We'll email you a secure link to set a new password.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-1">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Forgot password?</h1>
          <p className="text-sm text-zinc-500 mb-6">Enter your account email and we'll send you a reset link.</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {sent ? (
            <div className="px-5 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-emerald-400 font-medium flex items-center gap-2">
                <RiMailSendLine /> Check your inbox
              </p>
              <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
                If an account exists for <span className="text-zinc-200">{email}</span>, a password reset
                link is on its way. The link expires in 1 hour.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="forgot-email" className="block text-xs font-medium text-zinc-500 mb-1.5">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-900 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
                />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-amber-500 text-zinc-950 text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-all">
                {loading ? "Sending link..." : "Send reset link"}
              </button>
            </form>
          )}

          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-6">
            <RiArrowLeftLine /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
