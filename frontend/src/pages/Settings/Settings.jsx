import { useState, useRef } from "react"
import ConfirmDialog from "../../components/ui/ConfirmDialog"
import { useAuth } from "../../context/AuthContext"
import api from "../../services/api"
import {
  RiUser3Line, RiBellLine, RiLockLine, RiShieldLine, RiSunLine,
  RiUploadLine, RiDeleteBinLine, RiCheckLine, RiEyeLine, RiEyeOffLine,
} from "react-icons/ri"

const TABS = [
  { id: "profile",       label: "Profile",       icon: RiUser3Line   },
  { id: "appearance",    label: "Appearance",    icon: RiSunLine      },
  { id: "notifications", label: "Notifications", icon: RiBellLine     },
  { id: "privacy",       label: "Privacy",       icon: RiShieldLine   },
  { id: "password",      label: "Password",      icon: RiLockLine     },
]

function SaveButton({ onClick, loading }) {
  const [saved, setSaved] = useState(false)
  async function handle() {
    await onClick?.()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  return (
    <button onClick={handle} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors disabled:opacity-50">
      {saved ? <><RiCheckLine /> Saved</> : loading ? "Saving..." : "Save changes"}
    </button>
  )
}

function SectionCard({ title, description, children }) {
  return (
    <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold text-white mb-0.5">{title}</h3>
        {description && <p className="text-xs text-zinc-500">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        {description && <p className="text-xs text-zinc-600 mt-0.5">{description}</p>}
      </div>
      <button onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-amber-500" : "bg-zinc-700"}`}>
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  )
}

function PasswordInput({ value, onChange, show, onToggle, placeholder, autoComplete }) {
  return (
    <div className="relative">
      <input type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete}
        className="w-full px-4 pr-11 py-3 rounded-xl border border-white/[0.08] bg-zinc-950 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors" />
      <button onClick={onToggle} type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors">
        {show ? <RiEyeOffLine /> : <RiEyeLine />}
      </button>
    </div>
  )
}

function ProfileTab({ user }) {
  const { getCurrentUser }         = useAuth()
  const [fullname, setFullname]    = useState(user?.fullname || "")
  const [email, setEmail]          = useState(user?.email || "")
  const [preview, setPreview]      = useState(user?.avatar || null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarStatus, setAvatarStatus]       = useState("") 
  const [avatarMsg, setAvatarMsg] = useState("")
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const avatarRef                 = useRef(null)

  
  
  async function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const blobUrl = URL.createObjectURL(file)
    setPreview(blobUrl)
    setAvatarUploading(true)
    setAvatarStatus("")
    setAvatarMsg("")
    try {
      const fd = new FormData()
      fd.append("avatar", file)
      await api.patch("/user/update-avatar", fd, { headers: { "Content-Type": "multipart/form-data" } })
      URL.revokeObjectURL(blobUrl)
      setAvatarStatus("ok")
      setAvatarMsg("Profile photo updated")
      await getCurrentUser()
    } catch (err) {
      
      URL.revokeObjectURL(blobUrl)
      setPreview(user?.avatar || null)
      setAvatarStatus("error")
      setAvatarMsg(err.response?.data?.message || "Couldn't upload photo. Try again.")
    } finally {
      setAvatarUploading(false)
    }
  }

  async function handleSave() {
    setError("")
    setLoading(true)
    try {
      await api.patch("/user/update-account", { fullName: fullname, email })
      await getCurrentUser() 
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save changes.")
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleteOpen(false)
    setError("Account deletion isn't wired to the backend yet. Please contact support.")
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Profile Picture" description="Upload a photo that represents you — it updates everywhere instantly.">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl font-bold overflow-hidden shrink-0">
            {preview ? <img src={preview} alt="avatar" className="w-full h-full object-cover" /> : (user?.fullname?.[0] || "M")}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => avatarRef.current?.click()}
              disabled={avatarUploading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.1] text-sm text-zinc-300 hover:border-white/[0.2] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {avatarUploading ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  Uploading...
                </>
              ) : (
                <><RiUploadLine className="text-[15px]" /> Upload photo</>
              )}
            </button>
            <p className="text-xs text-zinc-600">JPG or PNG. Max 2MB.</p>
            {avatarStatus === "ok" && <p className="text-xs text-emerald-400 flex items-center gap-1"><RiCheckLine /> {avatarMsg}</p>}
            {avatarStatus === "error" && <p className="text-xs text-red-400">{avatarMsg}</p>}
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Profile Information" description="Update your public profile details.">
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Full Name</label>
          <input value={fullname} onChange={e => setFullname(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-950 text-sm text-zinc-200 outline-none focus:border-amber-500/40 transition-colors" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Username</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">@</span>
            <input value={user?.username || ""} disabled
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-950 text-sm text-zinc-500 outline-none opacity-50 cursor-not-allowed" />
          </div>
          <p className="text-xs text-zinc-600">Username cannot be changed.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-950 text-sm text-zinc-200 outline-none focus:border-amber-500/40 transition-colors" />
        </div>
        <div className="flex justify-end pt-1">
          <SaveButton onClick={handleSave} loading={loading} />
        </div>
      </SectionCard>

      <SectionCard title="Delete Account" description="Permanently delete your account and all your content.">
        <p className="text-sm text-zinc-500">This action cannot be undone.</p>
        <div>
          <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-all">
            <RiDeleteBinLine className="text-[15px]" /> Delete my account
          </button>
        </div>
        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDeleteAccount}
          title="Delete your account?"
          description="Account deletion isn't wired to the backend yet — but when it is, this will permanently remove your account and all your content."
          confirmLabel="Delete account"
          variant="danger"
        />
      </SectionCard>
    </div>
  )
}

function PasswordTab() {
  const [current, setCurrent]         = useState("")
  const [newPass, setNewPass]         = useState("")
  const [confirm, setConfirm]         = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState("")

  const match    = newPass && confirm && newPass === confirm
  const mismatch = newPass && confirm && newPass !== confirm

  async function handleSave() {
    if (!current || !newPass || !confirm) { setError("Please fill in all fields."); return }
    if (mismatch) { setError("Passwords do not match."); return }
    setError("")
    setLoading(true)
    try {
      await api.post("/user/change-password", { oldPassword: current, newPassword: newPass })
      setCurrent(""); setNewPass(""); setConfirm("")
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Change Password" description="Update your password to keep your account secure.">
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Current password</label>
          <PasswordInput value={current} onChange={e => setCurrent(e.target.value)} show={showCurrent} onToggle={() => setShowCurrent(p => !p)} placeholder="Enter current password" autoComplete="current-password" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">New password</label>
          <PasswordInput value={newPass} onChange={e => setNewPass(e.target.value)} show={showNew} onToggle={() => setShowNew(p => !p)} placeholder="Enter new password" autoComplete="new-password" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Confirm new password</label>
          <PasswordInput value={confirm} onChange={e => setConfirm(e.target.value)} show={showNew} onToggle={() => setShowNew(p => !p)} placeholder="Confirm new password" autoComplete="new-password" />
          {mismatch && <p className="text-xs text-red-400">Passwords do not match</p>}
          {match && <p className="text-xs text-emerald-400 flex items-center gap-1"><RiCheckLine /> Passwords match</p>}
        </div>
        <div className="flex justify-end">
          <SaveButton onClick={handleSave} loading={loading} />
        </div>
      </SectionCard>
    </div>
  )
}

const NOTIF_STORAGE_KEY = "vidora_notification_prefs"

function loadPrefs(key, defaults) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
  } catch {
    return defaults
  }
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState(() => loadPrefs(NOTIF_STORAGE_KEY, { newSubscriber: true, comments: true, likes: false, newUploads: true, weeklyDigest: false, emailNotifs: true }))
  function toggle(key) { setPrefs(p => ({ ...p, [key]: !p[key] })) }
  function save() { localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(prefs)) }
  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Notification Preferences" description="Control what you get notified about.">
        <div className="divide-y divide-white/[0.04]">
          <Toggle checked={prefs.newSubscriber} onChange={() => toggle("newSubscriber")} label="New subscribers" description="When someone subscribes to your channel" />
          <Toggle checked={prefs.comments} onChange={() => toggle("comments")} label="Comments" description="When someone comments on your video" />
          <Toggle checked={prefs.likes} onChange={() => toggle("likes")} label="Likes" description="When someone likes your video" />
          <Toggle checked={prefs.newUploads} onChange={() => toggle("newUploads")} label="New uploads" description="When a channel you follow uploads" />
          <Toggle checked={prefs.emailNotifs} onChange={() => toggle("emailNotifs")} label="Email notifications" description="Receive notifications via email" />
        </div>
        <div className="flex justify-end"><SaveButton onClick={save} /></div>
      </SectionCard>
    </div>
  )
}

const PRIVACY_STORAGE_KEY = "vidora_privacy_prefs"

function PrivacyTab() {
  const [prefs, setPrefs] = useState(() => loadPrefs(PRIVACY_STORAGE_KEY, { privateAccount: false, showWatchHistory: true, showLikedVideos: false, showSubscriptions: true }))
  function toggle(key) { setPrefs(p => ({ ...p, [key]: !p[key] })) }
  function save() { localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(prefs)) }
  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Privacy Settings" description="Control your account visibility and data.">
        <div className="divide-y divide-white/[0.04]">
          <Toggle checked={prefs.privateAccount} onChange={() => toggle("privateAccount")} label="Private account" description="Only approved followers can see your content" />
          <Toggle checked={prefs.showWatchHistory} onChange={() => toggle("showWatchHistory")} label="Show watch history" description="Let others see what you have watched" />
          <Toggle checked={prefs.showLikedVideos} onChange={() => toggle("showLikedVideos")} label="Show liked videos" description="Make your liked videos public" />
          <Toggle checked={prefs.showSubscriptions} onChange={() => toggle("showSubscriptions")} label="Show subscriptions" description="Make your subscriptions visible" />
        </div>
        <div className="flex justify-end"><SaveButton onClick={save} /></div>
      </SectionCard>
    </div>
  )
}

export default function Settings() {
  const { user }              = useAuth()
  const [activeTab, setActiveTab] = useState("profile")

  const tabContent = {
    profile:       <ProfileTab user={user} />,
    appearance:    <div className="text-zinc-500 text-sm py-10 text-center">Appearance settings coming soon.</div>,
    notifications: <NotificationsTab />,
    privacy:       <PrivacyTab />,
    password:      <PasswordTab />,
  }

  return (
    <div className="px-6 py-6">
      <div className="max-w-[1000px] mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
              <p className="text-sm text-zinc-500">Manage your account and preferences.</p>
            </div>
            <div className="flex gap-6 items-start">
              <nav className="w-52 shrink-0 flex flex-col gap-1 sticky top-0">
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${activeTab === tab.id ? "bg-amber-500/10 text-amber-400" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"}`}>
                    <tab.icon className="text-[16px] shrink-0" />
                    {tab.label}
                  </button>
                ))}
              </nav>
              <div className="flex-1 min-w-0">{tabContent[activeTab]}</div>
            </div>
      </div>
    </div>
  )
}
