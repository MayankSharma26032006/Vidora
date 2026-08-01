import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { RiEyeLine, RiEyeOffLine, RiCheckLine, RiUploadLine, RiCloseLine } from "react-icons/ri"
import { useAuth } from "../../context/AuthContext"

export default function Register() {
  const [fullname, setFullname] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm]   = useState("")
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [avatar, setAvatar]     = useState(null)
  const [preview, setPreview]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const inputRef                = useRef(null)

  const { register } = useAuth()
  const navigate      = useNavigate()

  const match    = password && confirm && password === confirm
  const mismatch = password && confirm && password !== confirm

  function handleAvatar(e) {
    const file = e.target.files[0]
    if (file) { setAvatar(file); setPreview(URL.createObjectURL(file)) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!fullname || !username || !email || !password || !confirm) { setError("Please fill in all fields."); return }
    if (mismatch) { setError("Passwords do not match."); return }
    setError("")
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("fullName", fullname)
      formData.append("username", username)
      formData.append("email", email)
      formData.append("password", password)
      if (avatar) formData.append("avatar", avatar)

      await register(formData)
      navigate("/login")
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-zinc-950">

      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-zinc-900 border-r border-white/[0.06] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />

        <div className="relative z-10 flex items-center gap-2">
          <span className="text-amber-400 text-2xl">▶</span>
          <span className="text-white font-bold text-xl tracking-tight">
            Creator<span className="text-amber-400">Hub</span>
          </span>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
            Start your<br />
            <span className="text-amber-400">creator journey.</span>
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-sm mb-8">
            Upload your first video today and reach an audience that's waiting for your content.
          </p>
          <div className="flex flex-col gap-3">
            {[
              "Upload unlimited videos",
              "Track views and subscribers",
              "Build your creator studio",
              "Connect with your audience",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <RiCheckLine className="text-amber-400 text-[11px]" />
                </div>
                <span className="text-sm text-zinc-400">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6">
          {["48K+", "2M+", "Free"].map((stat, i) => (
            <div key={i}>
              <p className="text-xl font-bold text-white">{stat}</p>
              <p className="text-xs text-zinc-600">{["Creators", "Monthly views", "Forever"][i]}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="text-amber-400 text-xl">▶</span>
            <span className="text-white font-bold text-lg">Creator<span className="text-amber-400">Hub</span></span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Create an account</h1>
            <p className="text-sm text-zinc-500">Join the creator community today.</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-300">Profile picture</label>
              <div className="flex items-center gap-4">
                <div
                  onClick={() => inputRef.current?.click()}
                  className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-dashed border-white/[0.12] hover:border-amber-500/40 flex items-center justify-center cursor-pointer transition-all overflow-hidden shrink-0"
                >
                  {preview
                    ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                    : <RiUploadLine className="text-zinc-600 text-xl" />
                  }
                </div>
                <div>
                  <button type="button" onClick={() => inputRef.current?.click()} className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
                    {preview ? "Change photo" : "Upload photo"}
                  </button>
                  <p className="text-xs text-zinc-600 mt-0.5">Optional · JPG or PNG</p>
                </div>
                {preview && (
                  <button type="button" onClick={() => { setPreview(null); setAvatar(null) }} className="ml-auto text-zinc-600 hover:text-zinc-300 transition-colors">
                    <RiCloseLine className="text-lg" />
                  </button>
                )}
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-300">Full name</label>
              <input
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-900 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-300">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="yourhandle"
                  autoComplete="username"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-900 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
                />
              </div>
            </div>

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
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  className="w-full px-4 pr-11 py-3 rounded-xl border border-white/[0.08] bg-zinc-900 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
                />
                <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors">
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-300">Confirm password</label>
              <div className="relative">
                <input
                  type={showConf ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className={`w-full px-4 pr-11 py-3 rounded-xl border bg-zinc-900 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none transition-colors ${mismatch ? "border-red-500/40 focus:border-red-500/60" : match ? "border-emerald-500/40" : "border-white/[0.08] focus:border-amber-500/40"}`}
                />
                <button type="button" onClick={() => setShowConf(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors">
                  {showConf ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
              {mismatch && <p className="text-xs text-red-400">Passwords do not match</p>}
              {match && <p className="text-xs text-emerald-400 flex items-center gap-1"><RiCheckLine /> Passwords match</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-600 mt-6">
            Already have an account?{" "}
            <a href="/login" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  )
}
