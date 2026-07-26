function Pulse({ className }) {
  return <div className={`animate-pulse bg-white/[0.06] rounded-lg ${className}`} />
}

export function VideoCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Pulse className="w-full aspect-video rounded-xl" />
      <div className="flex gap-2.5">
        <Pulse className="w-8 h-8 rounded-full shrink-0" />
        <div className="flex-1 flex flex-col gap-2 pt-1">
          <Pulse className="h-3 w-3/4" />
          <Pulse className="h-3 w-1/2" />
          <Pulse className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  )
}

export function VideoCardSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-7">
      {Array.from({ length: count }).map((_, i) => <VideoCardSkeleton key={i} />)}
    </div>
  )
}

export function ChannelSkeleton() {
  return (
    <div>
      <Pulse className="w-full h-44" />
      <div className="px-6 pt-4">
        <div className="flex items-end gap-5 -mt-12 mb-6">
          <Pulse className="w-24 h-24 rounded-full shrink-0" />
          <div className="flex-1 pb-1 flex flex-col gap-2">
            <Pulse className="h-5 w-48" />
            <Pulse className="h-3 w-64" />
          </div>
        </div>
        <div className="flex gap-0 border-b border-white/[0.06] mb-6">
          {Array.from({ length: 4 }).map((_, i) => <Pulse key={i} className="h-8 w-20 mr-4 rounded-none rounded-t-lg" />)}
        </div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-7">
          {Array.from({ length: 6 }).map((_, i) => <VideoCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-2">
          <Pulse className="h-7 w-48" />
          <Pulse className="h-3 w-64" />
        </div>
        <Pulse className="h-10 w-36 rounded-xl" />
      </div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex justify-between">
              <Pulse className="h-3 w-24" />
              <Pulse className="w-9 h-9 rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Pulse className="h-8 w-32" />
              <Pulse className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <Pulse className="h-4 w-32" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04]">
            <Pulse className="w-24 h-14 rounded-lg shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <Pulse className="h-3 w-3/4" />
              <Pulse className="h-3 w-1/4" />
            </div>
            <Pulse className="h-3 w-16" />
            <Pulse className="h-3 w-16" />
            <Pulse className="h-6 w-20 rounded-md" />
            <Pulse className="w-8 h-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CommentsSkeleton({ count = 4 }) {
  return (
    <div className="flex flex-col gap-6 mt-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Pulse className="w-7 h-7 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex gap-2">
              <Pulse className="h-3 w-24" />
              <Pulse className="h-3 w-16" />
            </div>
            <Pulse className="h-3 w-full" />
            <Pulse className="h-3 w-4/5" />
            <div className="flex gap-3 mt-1">
              <Pulse className="h-3 w-8" />
              <Pulse className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function NavbarSkeleton() {
  return (
    <div className="sticky top-0 z-40 w-full h-14 flex items-center px-4 gap-4 bg-[#0a0a0a]/90 border-b border-white/[0.06]">
      <div className="flex-1 max-w-2xl mx-auto">
        <Pulse className="h-9 w-full rounded-full" />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Pulse className="w-9 h-9 rounded-xl" />
        <Pulse className="w-9 h-9 rounded-xl" />
        <Pulse className="w-8 h-8 rounded-full" />
      </div>
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <div className="w-[220px] h-screen bg-[#0d0d0d] border-r border-white/[0.06] flex flex-col shrink-0">
      <div className="h-14 px-4 flex items-center border-b border-white/[0.06]">
        <Pulse className="h-6 w-32" />
      </div>
      <div className="flex-1 px-3 py-3 flex flex-col gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <Pulse key={i} className="h-10 w-full rounded-xl" />
        ))}
      </div>
      <div className="px-3 pb-4 pt-2 border-t border-white/[0.06]">
        <Pulse className="h-10 w-full rounded-xl" />
      </div>
    </div>
  )
}
