import { createContext, useContext, useState, useEffect } from "react"
import api, { setSessionActive } from "../services/api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
  }, [])

  // The axios interceptor fires this when a refresh fails while the user had a
  // real session (e.g. the refresh token itself expired after 30 days). Send
  // them to the login screen with a clear message instead of silently dropping
  // them at a blank login.
  useEffect(() => {
    function onSessionExpired() {
      setUser(null)
      setSessionActive(false)
      window.location.href = "/login?expired=1"
    }
    window.addEventListener("vidora:session-expired", onSessionExpired)
    return () => window.removeEventListener("vidora:session-expired", onSessionExpired)
  }, [])

  async function getCurrentUser() {
    try {
      const res = await api.get("/user/current-user")
      setSessionActive(true)
      setUser(res.data.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function login(email, password) {
    const res = await api.post("/user/login", { email, password })
    setSessionActive(true)
    setUser(res.data.data.user)
    return res.data
  }

  async function register(formData) {
    const res = await api.post("/user/register", formData)
    return res.data
  }

  async function logout() {
    await api.post("/user/logout")
    setSessionActive(false)
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, getCurrentUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// Provider + hook share one file
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}