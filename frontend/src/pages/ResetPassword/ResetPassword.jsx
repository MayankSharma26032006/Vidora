import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { RiEyeLine, RiEyeOffLine, RiCheckLine, RiErrorWarningLine } from "react-icons/ri"
import api from "../../services/api"
import Logo from "../../components/ui/Logo"

export default function ResetPassword() {
  const [searchParams]         = useSearchParams()
  const token                   = searchParams.get("token") || ""
  const navigate                = useNavigate()

  const [password, setPassword] = useState("")
  const [confirm, setConfirm]   = useState("")
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const [done, setDone]         = useState(false)

  const match    = password && confirm && password === confirm
  const mismatch = password && confirm && password !== confirm

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) { setError("Password must be at least 8 characters."); return }
    if (mismatch) { setError("Passwords do not match."); return }
    setError("")
    setLoading(true)
    try {
      await api.post("/user/reset-password", { token, newPassword: password })
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The link may be invalid or expired.")
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
            Choose a strong password you haven't used before — then sign in and get back to watching.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-1">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Set a new password</h1>
          <p className="text-sm text-zinc-500 mb-6">Your reset link is valid. Create a new password to continue.</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
              <RiErrorWarningLine className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {done ? (
            <div className="px-5 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-emerald-400 font-medium flex items-center gap-2">
                <RiCheckLine /> Password updated
              </p>
              <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
                Your password has been reset. All other devices are now signed out.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-4 w-full py-3 rounded-xl bg-amber-500 text-zinc-950 text-sm font-semibold hover:bg-amber-400 transition-all"
              >
                Sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="reset-password" className="block text-xs font-medium text-zinc-500 mb-1.5">New password</label>
                <div className="relative">
                  <input
                    id="reset-password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    autoFocus
                    className="w-full px-4 pr-11 py-3 rounded-xl border border-white/[0.08] bg-zinc-900 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors">
                    {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                  </button>
                </div>
                <p className="text-xs text-zinc-600 mt-1">At least 8 characters</p>
              </div>
              <div>
                <label htmlFor="reset-confirm" className="block text-xs font-medium text-zinc-500 mb-1.5">Confirm password</label>
                <div className="relative">
                  <input
                    id="reset-confirm"
                    type={showConf ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`w-full px-4 pr-11 py-3 rounded-xl border bg-zinc-900 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none transition-colors ${mismatch ? "border-red-500/40 focus:border-red-500/60" : match ? "border-emerald-500/40" : "border-white/[0.08] focus:border-amber-500/40"}`}
                  />
                  <button type="button" onClick={() => setShowConf(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors">
                    {showConf ? <RiEyeOffLine /> : <RiEyeLine />}
                  </button>
                </div>
                {mismatch && <p className="text-xs text-red-400 mt-1">Passwords do not match</p>}
                {match && <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><RiCheckLine /> Passwords match</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-amber-500 text-zinc-950 text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-all">
                {loading ? "Resetting..." : "Reset password"}
              </button>
            </form>
          )}

          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-6">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
