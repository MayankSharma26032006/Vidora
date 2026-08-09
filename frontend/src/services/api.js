import axios from "axios"

// Overridable via frontend/.env (VITE_API_URL); defaults to local dev backend
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"

// Production builds must set VITE_API_URL — otherwise the app would call the
// VISITOR'S localhost:8000 and appear completely broken with no obvious cause.
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn(
    "[VidOra] VITE_API_URL is not set in this production build — the app will try to reach http://localhost:8000. Set it in frontend/.env (or your build env) and rebuild."
  )
}

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

// login and refresh-token must never retry. current-user is intentionally NOT
// here: if the access token expired, a reload's current-user call must trigger
// a refresh instead of silently logging the user out.
const SKIP_RETRY_URLS = ["/user/refresh-token", "/user/login"]

// True once the user has a valid session this page load (set by AuthContext).
// Used to only treat refresh failures as "session expired" when the user WAS
// signed in — guests hitting 401s must not be bounced to the login page.
let sessionActive = false

export function setSessionActive(active) {
  sessionActive = active
}

// Single-flight token refresh: concurrent 401s share ONE refresh call so the
// session doesn't die mid-load.
let refreshPromise = null

function refreshTokens() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${API_BASE}/user/refresh-token`,
        {},
        { withCredentials: true }
      )
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    const shouldSkip = SKIP_RETRY_URLS.some(url =>
      originalRequest.url?.includes(url)
    )

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !shouldSkip
    ) {
      originalRequest._retry = true

      try {
        await refreshTokens()
        return api(originalRequest)
      } catch {
        // Refresh failed AND the user had a real session → it genuinely
        // expired. Tell the app to show the "session expired" login screen.
        if (sessionActive) {
          sessionActive = false
          window.dispatchEvent(new Event("vidora:session-expired"))
        }
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api