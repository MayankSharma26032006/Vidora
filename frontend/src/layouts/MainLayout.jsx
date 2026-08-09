import { useState } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "../components/sidebar/Sidebar"
import Navbar from "../components/navbar/Navbar"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import { RiMailSendLine, RiCloseLine } from "react-icons/ri"

// Shared app shell — every logged-in page renders inside this.
// Pages only provide their own content; Sidebar/Navbar/scroll live here.
export default function MainLayout() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  // Non-blocking nudge: unverified users can use the app freely, the banner
  // just reminds them to confirm their email (dismissible per session).
  const showVerifyBanner = user && user.isEmailVerified === false && !dismissed

  async function handleResend() {
    setResending(true)
    try {
      await api.post("/user/resend-verification")
      setResent(true)
    } catch {
      // A failed resend shouldn't break the app — the banner just stays
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        {showVerifyBanner && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20">
            <RiMailSendLine className="text-amber-400 shrink-0" />
            <p className="text-sm text-amber-400 flex-1 min-w-0">
              {resent
                ? "Verification email sent. Check your inbox."
                : "Please verify your email to unlock commenting and notifications."}
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
