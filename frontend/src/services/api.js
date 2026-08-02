import axios from "axios"

// Overridable via frontend/.env (VITE_API_URL); defaults to local dev backend
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

// login and refresh-token must never retry. current-user is intentionally NOT
// here: if the access token expired, a reload's current-user call must trigger
// a refresh instead of silently logging the user out.
const SKIP_RETRY_URLS = ["/user/refresh-token", "/user/login"]

// Single-flight token refresh. The backend rotates the refresh token on every
// refresh, so concurrent 401s must share ONE refresh call — otherwise each
// refresh invalidates the next one and the session dies mid-load.
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
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api