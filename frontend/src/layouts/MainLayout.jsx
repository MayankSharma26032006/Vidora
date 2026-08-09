import { useState } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "../components/sidebar/Sidebar"
import Navbar from "../components/navbar/Navbar"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import { RiMailSendLine, RiCloseLine, RiCheckLine } from "react-icons/ri"

export default function MainLayout() {
  const { user, getCurrentUser } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [code, setCode] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState("")
  const [justVerified, setJustVerified] = useState(false)

  const showVerifyBanner = user && user.isEmailVerified === false && !dismissed && user.smtpConfigured === true

  async function handleResend() {
    setResending(true)
    setVerifyError("")
    try {
      await api.post("/user/resend-verification")
      setResent(true)
    } catch {
    } finally {
      setResending(false)
    }
  }

  async function handleVerify() {
    if (!/^\d{6}$/.test(code)) {
      setVerifyError("Enter the 6-digit code from your email.")
      return
    }
    setVerifying(true)
    setVerifyError("")
    try {
      await api.post("/user/verify-email", { code })
      setJustVerified(true)
      await getCurrentUser()
    } catch (err) {
      setVerifyError(err.response?.data?.message || "That code didn't work. Try again.")
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        {showVerifyBanner && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20">
            {justVerified ? (
              <>
                <RiCheckLine className="text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-400 flex-1 min-w-0">
                  Email verified — thanks for confirming your account.
                </p>
              </>
            ) : (
              <>
                <RiMailSendLine className="text-amber-400 shrink-0" />
                <p className="text-sm text-amber-400 flex-1 min-w-0">
                  {resent
                    ? "Verification email sent. Check your inbox."
                    : "Please verify your email to secure your account."}
                  {!resent && (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="ml-2 text-xs font-medium underline hover:text-amber-300 transition-colors disabled:opacity-50"
                    >
                      {resending ? "Sending…" : "Resend email"}
                    </button>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit code"
                    inputMode="numeric"
                    className="w-28 px-3 py-1.5 rounded-lg border border-white/[0.12] bg-zinc-900 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40"
                  />
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={verifying}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 text-xs font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    {verifying ? "Verifying…" : "Verify"}
                  </button>
                </div>
              </>
            )}
            {verifyError && <p className="text-xs text-red-400 w-full">{verifyError}</p>}
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
              className="text-amber-400/70 hover:text-amber-300 transition-colors shrink-0"
            >
              <RiCloseLine className="text-lg" />
            </button>
          </div>
        )}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
