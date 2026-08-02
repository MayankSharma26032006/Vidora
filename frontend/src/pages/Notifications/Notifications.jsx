import { RiNotification3Line } from "react-icons/ri"

export default function Notifications() {
  return (
    <div className="px-6 py-6">
      <div className="max-w-[720px] mx-auto">

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Notifications</h1>
              <p className="text-sm text-zinc-500">Stay up to date with your channel.</p>
            </div>

            <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <RiNotification3Line className="text-amber-400 text-2xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-300 mb-1">No notifications yet</p>
                <p className="text-xs text-zinc-600 max-w-xs">
                  When someone subscribes to your channel, comments on your videos, or likes your content, it will show up here.
                </p>
              </div>
            </div>

      </div>
    </div>
  )
}
