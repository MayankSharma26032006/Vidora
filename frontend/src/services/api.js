import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  withCredentials: true,
})

const SKIP_RETRY_URLS = ["/user/refresh-token", "/user/current-user", "/user/login"]

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
        await axios.post(
          "http://localhost:8000/api/v1/user/refresh-token",
          {},
          { withCredentials: true }
        )
        return api(originalRequest)
      } catch {
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api