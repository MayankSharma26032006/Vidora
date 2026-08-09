import { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { RiCheckLine, RiErrorWarningLine, RiRefreshLine } from "react-icons/ri"
import api from "../../services/api"
import Logo from "../../components/ui/Logo"

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token          = searchParams.get("token") || ""
  const hasToken       = Boolean(token)
  const [status, setStatus] = useState(hasToken ? "verifying" : "error") // verifying | verified | error
  const [error, setError]   = useState(hasToken ? "" : "No verification link found. Check your email for the full link.")
  const [loading, setLoading] = useState(hasToken)

  async function verify() {
    setStatus("verifying")
    setError("")
    setLoading(true)
    try {
      await api.post("/user/verify-email", { token })
      setStatus("verified")
    } catch (err) {
      setStatus("error")
      setError(err.response?.data?.message || "This link is invalid or has expired.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    let cancelled = false
    api.post("/user/verify-email", { token })
      .then(() => { if (!cancelled) setStatus("verified") })
      .catch((err) => { if (!cancelled) { setStatus("error"); setError(err.response?.data?.message || "This link is invalid or has expired.") } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [token])

  return (
    <div className="min-h-screen flex bg-zinc-950">

      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-zinc-900 border-r border-white/[0.06] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6">
          <Logo />
          <p className="text-sm text-zinc-500 max-w-md leading-relaxed">
            Confirm your email to unlock commenting, saving, and the rest of your VidOra account.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-6">
            <Logo />
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900 p-8 flex flex-col items-center text-center">
            {status === "verifying" && (
              <>
                <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mb-4" />
                <h1 className="text-xl font-bold text-white mb-1">Verifying your email</h1>
                <p className="text-sm text-zinc-500">Just a moment...</p>
              </>
            )}

            {status === "verified" && (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4">
                  <RiCheckLine className="text-emerald-400 text-xl" />
                </div>
                <h1 className="text-xl font-bold text-white mb-1">Email verified</h1>
                <p className="text-sm text-zinc-500 mb-6">Your account is ready. Sign in to continue.</p>
                <Link to="/login" className="w-full py-3 rounded-xl bg-amber-500 text-zinc-950 text-sm font-semibold hover:bg-amber-400 transition-all text-center">
                  Sign in
                </Link>
              </>
            )}

            {status === "error" && (
              <>
                <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4">
                  <RiErrorWarningLine className="text-red-400 text-xl" />
                </div>
                <h1 className="text-xl font-bold text-white mb-1">Verification failed</h1>
                <p className="text-sm text-zinc-500 mb-6">{error}</p>
                <button
                  onClick={verify}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-amber-500 text-zinc-950 text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <RiRefreshLine /> {loading ? "Retrying..." : "Try again"}
                </button>              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
