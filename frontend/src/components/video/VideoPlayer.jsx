export default function VideoPlayer({ video }) {
  return (
    <div className="relative w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden">
      {video?.videoFile ? (
        <video
          src={video.videoFile}
          controls
          autoPlay={false}
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
