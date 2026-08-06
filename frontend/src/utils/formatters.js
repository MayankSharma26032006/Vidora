export function formatViews(views) {
  if (!views) return "0"
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`
  return String(views)
}

export function formatCount(n) {
  if (!n) return "0"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function formatDuration(seconds) {
  if (!seconds) return "0:00"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

export function formatTimeAgo(dateString) {
  if (!dateString) return ""
  const diff = Math.floor((Date.now() - new Date(dateString)) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
  const days = Math.floor(diff / 86400)
  if (diff < 604800) return `${days} ${days === 1 ? "day" : "days"} ago`
  const weeks = Math.floor(diff / 604800)
  if (diff < 2592000) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`
  const months = Math.floor(diff / 2592000)
  if (diff < 31536000) return `${months} ${months === 1 ? "month" : "months"} ago`
  return `${Math.floor(diff / 31536000)} years ago`
}
