// Canonical video categories — single source of truth used by Home filters,
// the Upload form, and the Explore page.
export const CATEGORIES = [
  "Music", "Coding", "Travel", "Cooking", "Gaming",
  "Fitness", "Podcasts", "Education", "Entertainment", "News", "AI", "Other",
]

export const CATEGORY_EMOJIS = {
  Music:        "🎵",
  Coding:       "💻",
  Travel:       "✈️",
  Cooking:      "🍳",
  Gaming:       "🎮",
  Fitness:      "🏋️",
  Podcasts:     "🎙️",
  Education:    "📚",
  Entertainment: "🎬",
  News:         "📰",
  AI:           "🤖",
  Other:        "✨",
}

// Which categories are "real" filters vs Home-only convenience pills
export const HOME_CATEGORY_PILLS = [
  "All", "Recently uploaded", "New to you", ...CATEGORIES,
]

// Map a Home pill to a backend `category` query param (undefined = no filter)
export function categoryParamFor(pill) {
  if (pill === "All" || pill === "Recently uploaded" || pill === "New to you") return undefined
  return pill
}

// Map a Home pill to a `sortBy` — "New to you" surfaces popular videos
export function sortByFor(pill) {
  return pill === "New to you" ? "views" : "createdAt"
}
