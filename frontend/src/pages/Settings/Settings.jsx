import { useState, useRef } from "react"
import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import {
  RiUser3Line, RiBellLine, RiLockLine, RiShieldLine,
  RiSunLine, RiMoonLine, RiUploadLine, RiDeleteBinLine,
  RiCheckLine, RiEyeLine, RiEyeOffLine,
} from "react-icons/ri"

const TABS = [
  { id: "profile",       label: "Profile",       icon: RiUser3Line   },
  { id: "appearance",    label: "Appearance",    icon: RiSunLine      },
  { id: "notifications", label: "Notifications", icon: RiBellLine     },
  { id: "privacy",       label: "Privacy",       icon: RiShieldLine   },
  { id: "password",      label: "Password",      icon: RiLockLine     },
]

function FormField({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-300">{label}</label>
        {hint && <span className="text-xs text-zinc-600">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Input({ value, onChange, type = "text", placeholder, disabled }) {
  return (
    <input
      value={value}
      onChange={onChange}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-950 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-950 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors resize-none"
    />
  )
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        {description && <p className="text-xs text-zinc-600 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-amber-500" : "bg-zinc-700"}`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  )
}

function SaveButton({ onClick }) {
  const [saved, setSaved] = useState(false)
  function handle() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onClick?.()
  }
  return (
    <button
      onClick={handle}
      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors"
    >
      {saved ? <><RiCheckLine /> Saved</> : "Save changes"}
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

function ProfileTab() {
  const [fullname, setFullname]   = useState("Mayank Sharma")
  const [username, setUsername]   = useState("mayank")
  const [email, setEmail]         = useState("mayank@gmail.com")
  const [bio, setBio]             = useState("Building backends and shipping products. Node.js · MongoDB · React.")
  const [preview, setPreview]     = useState(null)
  const inputRef                  = useRef(null)

  function handleAvatar(e) {
    const file = e.target.files[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Profile Picture" description="Upload a photo that represents you.">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl font-bold overflow-hidden shrink-0">
            {preview ? <img src={preview} alt="avatar" className="w-full h-full object-cover" /> : "MS"}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.1] text-sm text-zinc-300 hover:border-white/[0.2] hover:text-white transition-all"
            >
              <RiUploadLine className="text-[15px]" /> Upload photo
            </button>
            <p className="text-xs text-zinc-600">JPG or PNG. Max 2MB.</p>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Profile Information" description="Update your public profile details.">
        <FormField label="Full Name">
          <Input value={fullname} onChange={(e) => setFullname(e.target.value)} placeholder="Your full name" />
        </FormField>
        <FormField label="Username">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-950 text-sm text-zinc-200 outline-none focus:border-amber-500/40 transition-colors"
            />
          </div>
        </FormField>
        <FormField label="Email">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="your@email.com" />
        </FormField>
        <FormField label="Bio" hint={`${bio.length}/200`}>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 200))} placeholder="Tell people about yourself..." rows={3} />
        </FormField>
        <div className="flex justify-end pt-1">
          <SaveButton />
        </div>
      </SectionCard>

      <SectionCard title="Delete Account" description="Permanently delete your account and all your content.">
        <p className="text-sm text-zinc-500">This action cannot be undone. All your videos, comments, and data will be permanently removed.</p>
        <div>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-all">
            <RiDeleteBinLine className="text-[15px]" /> Delete my account
          </button>
        </div>
      </SectionCard>
    </div>
  )
}

function AppearanceTab() {
  const [theme, setTheme] = useState("dark")
  const themes = [
    { id: "dark",   label: "Dark",   icon: RiMoonLine, desc: "Easy on the eyes" },
    { id: "light",  label: "Light",  icon: RiSunLine,  desc: "Classic and clean" },
    { id: "system", label: "System", icon: RiSunLine,  desc: "Follows your OS" },
  ]
  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Theme Preference" description="Choose how CreatorHub looks for you.">
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${theme === t.id ? "border-amber-500/40 bg-amber-500/5" : "border-white/[0.06] hover:border-white/[0.12]"}`}
            >
              <t.icon className={`text-xl ${theme === t.id ? "text-amber-400" : "text-zinc-500"}`} />
              <span className={`text-sm font-medium ${theme === t.id ? "text-amber-400" : "text-zinc-400"}`}>{t.label}</span>
              <span className="text-xs text-zinc-600">{t.desc}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <SaveButton />
        </div>
      </SectionCard>
    </div>
  )
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    newSubscriber:  true,
    comments:       true,
    likes:          false,
    newUploads:     true,
    weeklyDigest:   false,
    emailNotifs:    true,
  })
  function toggle(key) { setPrefs((p) => ({ ...p, [key]: !p[key] })) }
  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Notification Preferences" description="Control what you get notified about.">
        <div className="divide-y divide-white/[0.04]">
          <Toggle checked={prefs.newSubscriber} onChange={() => toggle("newSubscriber")} label="New subscribers" description="When someone subscribes to your channel" />
          <Toggle checked={prefs.comments} onChange={() => toggle("comments")} label="Comments" description="When someone comments on your video" />
          <Toggle checked={prefs.likes} onChange={() => toggle("likes")} label="Likes" description="When someone likes your video" />
          <Toggle checked={prefs.newUploads} onChange={() => toggle("newUploads")} label="New uploads" description="When a channel you follow uploads" />
          <Toggle checked={prefs.weeklyDigest} onChange={() => toggle("weeklyDigest")} label="Weekly digest" description="A summary of your channel's performance" />
          <Toggle checked={prefs.emailNotifs} onChange={() => toggle("emailNotifs")} label="Email notifications" description="Receive notifications via email" />
        </div>
        <div className="flex justify-end">
          <SaveButton />
        </div>
      </SectionCard>
    </div>
  )
}

function PrivacyTab() {
  const [prefs, setPrefs] = useState({
    privateAccount:    false,
    showWatchHistory:  true,
    showLikedVideos:   false,
    showSubscriptions: true,
    dataCollection:    true,
  })
  function toggle(key) { setPrefs((p) => ({ ...p, [key]: !p[key] })) }
  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Privacy Settings" description="Control your account visibility and data.">
        <div className="divide-y divide-white/[0.04]">
          <Toggle checked={prefs.privateAccount} onChange={() => toggle("privateAccount")} label="Private account" description="Only approved followers can see your content" />
          <Toggle checked={prefs.showWatchHistory} onChange={() => toggle("showWatchHistory")} label="Show watch history" description="Let others see what you have watched" />
          <Toggle checked={prefs.showLikedVideos} onChange={() => toggle("showLikedVideos")} label="Show liked videos" description="Make your liked videos public" />
          <Toggle checked={prefs.showSubscriptions} onChange={() => toggle("showSubscriptions")} label="Show subscriptions" description="Make your subscriptions visible to others" />
          <Toggle checked={prefs.dataCollection} onChange={() => toggle("dataCollection")} label="Personalised recommendations" description="Use your watch history to improve suggestions" />
        </div>
        <div className="flex justify-end">
          <SaveButton />
        </div>
      </SectionCard>
    </div>
  )
}

function PasswordTab() {
  const [current, setCurrent]   = useState("")
  const [newPass, setNewPass]   = useState("")
  const [confirm, setConfirm]   = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const match = newPass && confirm && newPass === confirm
  const mismatch = newPass && confirm && newPass !== confirm

  function PasswordInput({ value, onChange, show, onToggle, placeholder }) {
    return (
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 pr-11 py-3 rounded-xl border border-white/[0.08] bg-zinc-950 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
        />
        <button onClick={onToggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors">
          {show ? <RiEyeOffLine /> : <RiEyeLine />}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Change Password" description="Update your password to keep your account secure.">
        <FormField label="Current password">
          <PasswordInput value={current} onChange={(e) => setCurrent(e.target.value)} show={showCurrent} onToggle={() => setShowCurrent(p => !p)} placeholder="Enter current password" />
        </FormField>
        <FormField label="New password">
          <PasswordInput value={newPass} onChange={(e) => setNewPass(e.target.value)} show={showNew} onToggle={() => setShowNew(p => !p)} placeholder="Enter new password" />
        </FormField>
        <FormField label="Confirm new password">
          <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} show={showConfirm} onToggle={() => setShowConfirm(p => !p)} placeholder="Confirm new password" />
          {mismatch && <p className="text-xs text-red-400 mt-1">Passwords do not match</p>}
          {match && <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><RiCheckLine /> Passwords match</p>}
        </FormField>
        <div className="flex justify-end">
          <SaveButton />
        </div>
      </SectionCard>
    </div>
  )
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile")

  const tabContent = {
    profile:       <ProfileTab />,
    appearance:    <AppearanceTab />,
    notifications: <NotificationsTab />,
    privacy:       <PrivacyTab />,
    password:      <PasswordTab />,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-[1000px] mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
              <p className="text-sm text-zinc-500">Manage your account and preferences.</p>
            </div>
            <div className="flex gap-6 items-start">
              <nav className="w-52 shrink-0 flex flex-col gap-1 sticky top-0">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${activeTab === tab.id ? "bg-amber-500/10 text-amber-400" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"}`}
                  >
                    <tab.icon className="text-[16px] shrink-0" />
                    {tab.label}
                  </button>
                ))}
              </nav>
              <div className="flex-1 min-w-0">
                {tabContent[activeTab]}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
