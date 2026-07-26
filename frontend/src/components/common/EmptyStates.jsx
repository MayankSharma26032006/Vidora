import { RiVideoLine, RiPlayListLine, RiSearchLine, RiBellLine, RiTimeLine, RiUserFollowLine } from "react-icons/ri"

function EmptyState({ icon: Icon, title, description, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5">
        <Icon className="text-zinc-600 text-3xl" />
      </div>
      <h3 className="text-base font-semibold text-zinc-300 mb-2">{title}</h3>
      <p className="text-sm text-zinc-600 max-w-xs leading-relaxed mb-6">{description}</p>
      {action && (
        <button onClick={action} className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors">
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export function NoVideos({ onUpload }) {
  return (
    <EmptyState
      icon={RiVideoLine}
      title="No videos yet"
      description="Upload your first video to start building your channel and reaching your audience."
      action={onUpload}
      actionLabel="Upload a video"
    />
  )
}

export function NoPlaylists({ onCreate }) {
  return (
    <EmptyState
      icon={RiPlayListLine}
      title="No playlists yet"
      description="Create playlists to organise videos you love and share collections with others."
      action={onCreate}
      actionLabel="Create a playlist"
    />
  )
}

export function NoSearchResults({ query }) {
  return (
    <EmptyState
      icon={RiSearchLine}
      title="No results found"
      description={query ? `We couldn't find anything for "${query}". Try different keywords or check your spelling.` : "Enter a search term to find videos, channels, and playlists."}
    />
  )
}

export function NoNotifications() {
  return (
    <EmptyState
      icon={RiBellLine}
      title="You're all caught up"
      description="No new notifications right now. We'll let you know when something happens on your channel."
    />
  )
}

export function NoHistory({ onExplore }) {
  return (
    <EmptyState
      icon={RiTimeLine}
      title="No watch history"
      description="Videos you watch will appear here so you can easily find them again."
      action={onExplore}
      actionLabel="Explore videos"
    />
  )
}

export function NoSubscriptions({ onExplore }) {
  return (
    <EmptyState
      icon={RiUserFollowLine}
      title="No subscriptions yet"
      description="Subscribe to creators you love and their latest videos will show up here."
      action={onExplore}
      actionLabel="Discover creators"
    />
  )
}
