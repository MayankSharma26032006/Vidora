import { useEffect, useRef } from "react"

export default function VideoPlayer({ video }) {
  const videoRef = useRef(null)

  // Best-effort autoplay when the page loads: clicking a video should start
  // playback immediately. Browsers may block playback with sound until the user
  // has interacted with the page — in that case the built-in controls let them
  // start manually, so the failure is swallowed silently.
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const tryPlay = () => {
      const promise = el.play()
      if (promise) promise.catch(() => {})
    }
    tryPlay()
    el.addEventListener("loadedmetadata", tryPlay)
    return () => el.removeEventListener("loadedmetadata", tryPlay)
  }, [video?.videoFile])

  return (
    <div className="relative w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden">
      {video?.videoFile ? (
        <video
          ref={videoRef}
          src={video.videoFile}
          controls
          autoPlay
          className="w-full h-full"
          poster={video.thumbnail}
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-zinc-600">
          <span className="text-4xl">▶</span>
        </div>
      )}
    </div>
  )
}
