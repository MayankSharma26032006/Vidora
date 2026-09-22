import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { RiArrowLeftSLine, RiCheckLine, RiMailSendLine, RiRefreshLine } from "react-icons/ri"
import api from "../../services/api"
import Logo from "../../components/ui/Logo"

const CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

export default function VerifyOtp() {
  const location = useLocation()
  const navigate  = useNavigate()

  const email = location.state?.email || ""
  const fullname = location.state?.fullname || ""

  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""))
  const [verifying, setVerifying] = useState(false)
  const [status, setStatus] = useState("input") // input | verified
  const [error, setError] = useState("")
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const inputsRef = useRef([])

  // Direct visits without having just registered have no email to verify.
  useEffect(() => {
    if (!email) navigate("/register", { replace: true })
  }, [email, navigate])

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return undefined
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const code = digits.join("")
  const isComplete = code.length === CODE_LENGTH && !digits.includes("")

  function setDigit(index, value) {
    const clean = value.replace(/\D/g, "")
    setDigits((prev) => {
      const next = [...prev]
      if (clean.length > 1) {
        // Paste (or typing over a selection): distribute across boxes.
        const chars = clean.slice(0, CODE_LENGTH - index).split("")
        next.splice(index, chars.length, ...chars)
        const focusAt = Math.min(index + chars.length, CODE_LENGTH - 1)
        inputsRef.current[focusAt]?.focus()
        if (index + chars.length >= CODE_LENGTH) inputsRef.current[CODE_LENGTH - 1]?.blur()
      } else {
        next[index] = clean
        if (clean && index < CODE_LENGTH - 1) inputsRef.current[index + 1]?.focus()
      }
      return next
    })
    setError("")
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
      setDigits((prev) => {
        const next = [...prev]
        next[index - 1] = ""
        return next
      })
    }
    if (e.key === "ArrowLeft" && index > 0) inputsRef.current[index - 1]?.focus()
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) inputsRef.current[index + 1]?.focus()
  }

  async function submit(event) {
    event?.preventDefault()
    if (!isComplete || verifying) return
    setVerifying(true)
    setError("")
    try {
      await api.post("/user/verify-email", { email, code })
      setStatus("verified")
    } catch (err) {
      const message = err.response?.data?.message || "That code didn't work. Try again."
      setError(message)
      setDigits(Array(CODE_LENGTH).fill(""))
      inputsRef.current[0]?.focus()
    } finally {
      setVerifying(false)
    }
  }

  async function handleResend() {
    if (resending || cooldown > 0) return
    setResending(true)
    setError("")
    try {
      await api.post("/user/resend-verification-code", { email })
      setResent(true)
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setDigits(Array(CODE_LENGTH).fill(""))
      inputsRef.current[0]?.focus()
      setTimeout(() => setResent(false), 6000)
    } catch (err) {
      // 429 (cooldown or attempt lockout) and other failures surface inline.
      setError(err.response?.data?.message || "Couldn't send a new code. Try again shortly.")
    } finally {
      setResending(false)
    }
  }

  if (status === "verified") {
    return (
      <div className="min-h-screen flex bg-zinc-950">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="flex items-center gap-2 mb-6">
              <Logo />
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900 p-8 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4">
                <RiCheckLine className="text-emerald-400 text-xl" />
              </div>
              <h1 className="text-xl font-bold text-white mb-1">Email verified</h1>
              <p className="text-sm text-zinc-500 mb-6">
                You're all set, {fullname || "creator"}. Sign in to start uploading.
              </p>
              <Link
                to="/login"
                className="w-full py-3 rounded-xl bg-amber-500 text-zinc-950 text-sm font-semibold hover:bg-amber-400 transition-all text-center"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-zinc-950">

      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-zinc-900 border-r border-white/[0.06] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6">
          <Logo />
          <p className="text-sm text-zinc-500 max-w-md leading-relaxed">
            One quick check and your creator journey begins. Enter the code we just sent to unlock uploading, commenting, and everything else.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8">

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Logo size={26} className="shrink-0" />
            <span className="text-white font-bold text-lg">Vid<span className="text-amber-400">Ora</span></span>
          </div>

          <div className="mb-8">
            <div className="w-11 h-11 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4">
              <RiMailSendLine className="text-amber-400 text-lg" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Check your inbox</h1>
            <p className="text-sm text-zinc-500">
              We sent a 6-digit code to{" "}
              <span className="text-zinc-300 font-medium">{email}</span>. It expires in 30 minutes.
            </p>
          </div>

          {resent && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              New code sent — check your inbox.
            </div>
          )}

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-5">
            <div className="flex gap-2 sm:gap-3 justify-between" aria-label="Verification code">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputsRef.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onFocus={(e) => e.target.select()}
                  aria-label={`Digit ${i + 1}`}
                  className="w-12 h-14 sm:w-13 sm:h-16 text-center text-xl font-bold text-white bg-zinc-900 border border-white/[0.08] rounded-xl outline-none focus:border-amber-500/50 focus:bg-zinc-900 transition-colors"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={!isComplete || verifying}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {verifying ? "Verifying..." : "Verify email"}
            </button>
          </form>

          <div className="flex items-center justify-between mt-6 text-sm">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors disabled:text-zinc-600 disabled:cursor-not-allowed disabled:hover:text-zinc-600"
            >
              <RiRefreshLine className={resending ? "animate-spin" : ""} />
              {cooldown > 0
                ? `Resend code in ${cooldown}s`
                : resending
                  ? "Sending..."
                  : "Resend code"}
            </button>

            <Link to="/login" className="flex items-center text-zinc-600 hover:text-zinc-300 transition-colors">
              Verify later
              <RiArrowLeftSLine className="rotate-180 text-base" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
