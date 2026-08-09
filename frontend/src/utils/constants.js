

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


export const HOME_CATEGORY_PILLS = [
  "All", "Recently uploaded", "New to you", ...CATEGORIES,
]


export function categoryParamFor(pill) {
  if (pill === "All" || pill === "Recently uploaded" || pill === "New to you") return undefined
  return pill
}


export function sortByFor(pill) {
  return pill === "New to you" ? "views" : "createdAt"
}
