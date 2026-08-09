import { useEffect, useRef } from "react"

export default function VideoPlayer({ video }) {
  const videoRef = useRef(null)

  
  
  
  
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
