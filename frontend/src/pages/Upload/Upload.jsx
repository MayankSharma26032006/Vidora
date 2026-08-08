import { useState, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import api from "../../services/api"
import { CATEGORIES } from "../../utils/constants"
import {
  RiUploadCloud2Line, RiImageAddLine,
  RiCheckLine, RiVideoLine, RiGlobalLine, RiLockLine,
} from "react-icons/ri"

const UPLOAD_CATEGORIES = ["Select a category", ...CATEGORIES]

function VideoUploadZone({ file, progress, onFile, error }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.type.startsWith("video/")) onFile(dropped)
  }

  if (file) {
    return (
      <div className="w-full rounded-2xl border border-white/[0.08] bg-zinc-900 p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <RiVideoLine className="text-amber-400 text-xl" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate mb-1">{file.name}</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-zinc-500 shrink-0">{progress}%</span>
            </div>
            {progress === 100 && !error && (
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><RiCheckLine /> Upload complete</p>
            )}
            {error && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">Upload failed — {error}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`w-full rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center py-14 gap-4 ${dragging ? "border-amber-500/60 bg-amber-500/5" : "border-white/[0.08] hover:border-white/[0.18] bg-zinc-900"}`}
    >
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <RiUploadCloud2Line className="text-amber-400 text-3xl" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-200 mb-1">Drag and drop your video here</p>
        <p className="text-xs text-zinc-600">or click to browse — MP4, MOV, AVI supported</p>
      </div>
    </div>
  )
}

function ThumbnailUploadZone({ onFile }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)

  function handleFile(f) {
    if (f?.type.startsWith("image/")) {
      onFile(f)
      setPreview(URL.createObjectURL(f))
    }
  }

  if (preview) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900 group">
        <img src={preview} alt="Thumbnail" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button onClick={() => { setPreview(null); onFile(null) }} className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium">Change thumbnail</button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="w-full aspect-video rounded-xl border-2 border-dashed border-white/[0.08] hover:border-white/[0.18] bg-zinc-900 flex flex-col items-center justify-center gap-3 cursor-pointer"
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      <RiImageAddLine className="text-zinc-600 text-2xl" />                      <p className="text-xs text-zinc-600 text-center px-4">Upload thumbnail (required)<br />JPG, PNG — 16:9 recommended</p>
    </div>
  )
}

export default function Upload() {
  const navigate                              = useNavigate()
  const { user }                              = useAuth()
  const [videoFile, setVideoFile]             = useState(null)
  const [thumbnailFile, setThumbnailFile]     = useState(null)
  const [title, setTitle]                     = useState("")
  const [description, setDescription]         = useState("")
  const [category, setCategory]               = useState("Select a category")
  const [isPublished, setIsPublished]         = useState(true)
  const [videoProgress, setVideoProgress]     = useState(0)
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState("")
  const [success, setSuccess]                 = useState(false)

  function handleVideoFile(file) {
    setVideoFile(file)
    setVideoProgress(0)
  }

  async function handleSubmit() {
    if (!videoFile) { setError("Please select a video file."); return }
    if (!title.trim()) { setError("Please enter a title."); return }
    if (!description.trim()) { setError("Please enter a description — it is required."); return }
    if (!thumbnailFile) { setError("Please add a thumbnail — it is required."); return }
    setError("")
    setLoading(true)
    setVideoProgress(0)

    try {
      const formData = new FormData()
      formData.append("videoFile", videoFile)
      formData.append("thumbnail", thumbnailFile)
      formData.append("title", title.trim())
      formData.append("description", description.trim())
      formData.append("category", category === "Select a category" ? "Other" : category)
      formData.append("isPublished", String(isPublished))

      await api.post("/videos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (event.total) {
            const percent = Math.round((event.loaded * 100) / event.total)
            setVideoProgress(Math.min(percent, 100))
          }
        },
      })

      setVideoProgress(100)
      setSuccess(true)
      // leave the green "Uploaded ✓" visible long enough to register before redirecting
      setTimeout(() => navigate("/studio"), 2500)
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  const isReady = videoFile && title.trim() && description.trim() && thumbnailFile

  if (!user) {
    return (
      <div className="px-6 py-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Upload video</h1>
            <p className="text-sm text-zinc-500">Share your content with the world.</p>
          </div>
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <RiUploadCloud2Line className="text-amber-400 text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300 mb-1">Sign in to upload videos</p>
              <p className="text-xs text-zinc-600">Uploads are tied to your account.</p>
            </div>
            <Link to="/login" className="mt-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-6">
      <div className="max-w-[1100px] mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Upload video</h1>
          <p className="text-sm text-zinc-500">Share your content with the world.</p>
        </div>


            {success && (
              <div className="mb-6 flex items-center gap-3 px-5 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                <RiCheckLine className="text-lg shrink-0" /> Video published successfully! Redirecting...
              </div>
            )}

            {error && (
              <div className="mb-6 px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-6 items-start">
              <div className="flex-1 min-w-0 flex flex-col gap-6">

                <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-4">
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">Video file</h2>
                  <VideoUploadZone file={videoFile} progress={videoProgress} onFile={handleVideoFile} error={error} />
                </div>

                <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-5">
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">Details</h2>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-zinc-300">Title</label>
                      <span className="text-xs text-zinc-600">{title.length}/100</span>
                    </div>
                    <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 100))} placeholder="Give your video a great title..."
                      className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-950 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-zinc-300">Description <span className="text-amber-400">*</span></label>
                      <span className="text-xs text-zinc-600">{description.length}/5000</span>
                    </div>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 5000))} placeholder="Tell viewers about your video..." rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-950 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors resize-none" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-zinc-300">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-950 text-sm text-zinc-300 outline-none focus:border-amber-500/40 transition-colors appearance-none cursor-pointer">
                      {UPLOAD_CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="w-72 shrink-0 flex flex-col gap-4">
                <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-4">
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">Thumbnail</h2>
                  <ThumbnailUploadZone onFile={setThumbnailFile} />
                </div>

                <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-4">
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">Visibility</h2>
                  <div onClick={() => setIsPublished(true)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isPublished ? "border-amber-500/40 bg-amber-500/5" : "border-white/[0.06] hover:border-white/[0.12]"}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isPublished ? "border-amber-400" : "border-zinc-600"}`}>
                      {isPublished && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5"><RiGlobalLine className="text-zinc-400 text-[14px]" /><span className="text-sm font-medium text-zinc-200">Public</span></div>
                      <p className="text-xs text-zinc-600 mt-0.5">Everyone can see this</p>
                    </div>
                  </div>
                  <div onClick={() => setIsPublished(false)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${!isPublished ? "border-amber-500/40 bg-amber-500/5" : "border-white/[0.06] hover:border-white/[0.12]"}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${!isPublished ? "border-amber-400" : "border-zinc-600"}`}>
                      {!isPublished && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5"><RiLockLine className="text-zinc-400 text-[14px]" /><span className="text-sm font-medium text-zinc-200">Private</span></div>
                      <p className="text-xs text-zinc-600 mt-0.5">Only you can see this</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={handleSubmit} disabled={!isReady || loading || success}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${success ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950" : "bg-amber-500 hover:bg-amber-400 text-zinc-950"}`}>
                    {loading ? "Uploading..." : success ? "Uploaded ✓" : isPublished ? "Publish video" : "Save & make private"}
                  </button>
                </div>
              </div>
            </div>
      </div>
    </div>
  )
}
