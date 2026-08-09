import axios from "axios"


const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"



if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn(
    "[VidOra] VITE_API_URL is not set in this production build — the app will try to reach http://localhost:8000. Set it in frontend/.env (or your build env) and rebuild."
  )
}

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})




const SKIP_RETRY_URLS = ["/user/refresh-token", "/user/login"]




let sessionActive = false

export function setSessionActive(active) {
  sessionActive = active
}



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