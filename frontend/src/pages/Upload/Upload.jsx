import { useState, useRef } from "react"
import Sidebar from "../../components/sidebar/Sidebar"
import Navbar from "../../components/navbar/Navbar"
import {
  RiUploadCloud2Line,
  RiImageAddLine,
  RiCloseLine,
  RiCheckLine,
  RiVideoLine,
  RiPriceTag3Line,
  RiGlobalLine,
  RiLockLine,
  RiAddLine,
} from "react-icons/ri"

const CATEGORIES = [
  "Select a category",
  "Music",
  "Coding",
  "Travel",
  "Cooking",
  "Gaming",
  "Fitness",
  "Podcasts",
  "Education",
  "Entertainment",
  "News",
  "Other",
]

function ProgressRing({ progress, size = 40, stroke = 3 }) {
  const radius = (size - stroke * 2) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#27272a"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#EF9F27"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
    </svg>
  )
}

function VideoUploadZone({ file, progress, onFile }) {
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
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-zinc-500 shrink-0">{progress}%</span>
            </div>
            {progress === 100 && (
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <RiCheckLine /> Upload complete
              </p>
            )}
          </div>
          <ProgressRing progress={progress} />
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
      className={`
        w-full rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
        flex flex-col items-center justify-center py-14 gap-4
        ${dragging
          ? "border-amber-500/60 bg-amber-500/5"
          : "border-white/[0.08] hover:border-white/[0.18] bg-zinc-900 hover:bg-zinc-900/80"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <RiUploadCloud2Line className="text-amber-400 text-3xl" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-200 mb-1">
          Drag and drop your video here
        </p>
        <p className="text-xs text-zinc-600">or click to browse — MP4, MOV, AVI supported</p>
      </div>
      <button className="px-5 py-2 rounded-full border border-white/[0.1] text-sm text-zinc-400 hover:text-zinc-200 hover:border-white/[0.2] transition-all">
        Browse files
      </button>
    </div>
  )
}

function ThumbnailUploadZone({ file, onFile }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(null)

  function handleFile(f) {
    if (f?.type.startsWith("image/")) {
      onFile(f)
      setPreview(URL.createObjectURL(f))
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  if (preview) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900 group">
        <img src={preview} alt="Thumbnail" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={() => { setPreview(null); onFile(null) }}
            className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition-all"
          >
            Change thumbnail
          </button>
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
      className={`
        w-full aspect-video rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
        flex flex-col items-center justify-center gap-3
        ${dragging
          ? "border-amber-500/60 bg-amber-500/5"
          : "border-white/[0.08] hover:border-white/[0.18] bg-zinc-900"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <RiImageAddLine className="text-zinc-600 text-2xl" />
      <p className="text-xs text-zinc-600 text-center px-4">
        Upload thumbnail<br />JPG, PNG — 16:9 recommended
      </p>
    </div>
  )
}

function TagsInput({ tags, onChange }) {
  const [input, setInput] = useState("")

  function addTag() {
    const val = input.trim().replace(/^#/, "")
    if (val && !tags.includes(val)) {
      onChange([...tags, val])
    }
    setInput("")
  }

  function removeTag(tag) {
    onChange(tags.filter((t) => t !== tag))
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag()
    }
    if (e.key === "Backspace" && !input && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="w-full min-h-[44px] flex flex-wrap gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-zinc-900 focus-within:border-amber-500/40 transition-colors">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium"
        >
          #{tag}
          <button onClick={() => removeTag(tag)} className="hover:text-amber-200 transition-colors">
            <RiCloseLine className="text-[12px]" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={tags.length === 0 ? "Add tags — press Enter or comma" : ""}
        className="flex-1 min-w-[140px] bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 outline-none"
      />
    </div>
  )
}

function FormField({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-300">{label}</label>
        {hint && <span className="text-xs text-zinc-600">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export default function Upload() {
  const [videoFile, setVideoFile]       = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [title, setTitle]               = useState("")
  const [description, setDescription]   = useState("")
  const [category, setCategory]         = useState("Select a category")
  const [tags, setTags]                 = useState([])
  const [isPublished, setIsPublished]   = useState(true)
  const [videoProgress, setVideoProgress] = useState(0)
  const [submitted, setSubmitted]       = useState(false)

  function handleVideoFile(file) {
    setVideoFile(file)
    setVideoProgress(0)
    let p = 0
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 12) + 3
      if (p >= 100) { p = 100; clearInterval(interval) }
      setVideoProgress(p)
    }, 300)
  }

  function handleSubmit(asDraft) {
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  const isReady = videoFile && title.trim()

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-[1100px] mx-auto">

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Upload video</h1>
              <p className="text-sm text-zinc-500">Share your content with the world.</p>
            </div>

            {submitted && (
              <div className="mb-6 flex items-center gap-3 px-5 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                <RiCheckLine className="text-lg shrink-0" />
                {isPublished ? "Video published successfully!" : "Draft saved successfully!"}
              </div>
            )}

            <div className="flex gap-6 items-start">

              <div className="flex-1 min-w-0 flex flex-col gap-6">

                <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-4">
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">
                    Video file
                  </h2>
                  <VideoUploadZone
                    file={videoFile}
                    progress={videoProgress}
                    onFile={handleVideoFile}
                  />
                </div>

                <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-5">
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">
                    Details
                  </h2>

                  <FormField label="Title" hint={`${title.length}/100`}>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                      placeholder="Give your video a great title..."
                      className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-950 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
                    />
                  </FormField>

                  <FormField label="Description" hint={`${description.length}/5000`}>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
                      placeholder="Tell viewers about your video..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-950 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors resize-none"
                    />
                  </FormField>

                  <FormField label="Category">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-950 text-sm text-zinc-300 outline-none focus:border-amber-500/40 transition-colors appearance-none cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-zinc-900">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Tags" hint="Press Enter or comma to add">
                    <TagsInput tags={tags} onChange={setTags} />
                  </FormField>
                </div>

              </div>

              <div className="w-72 shrink-0 flex flex-col gap-4">

                <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-4">
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">
                    Thumbnail
                  </h2>
                  <ThumbnailUploadZone file={thumbnailFile} onFile={setThumbnailFile} />
                  <p className="text-xs text-zinc-600 text-center">
                    Upload a custom thumbnail or we'll generate one from your video.
                  </p>
                </div>

                <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-4">
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">
                    Visibility
                  </h2>

                  <div
                    onClick={() => setIsPublished(true)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isPublished ? "border-amber-500/40 bg-amber-500/5" : "border-white/[0.06] hover:border-white/[0.12]"}`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isPublished ? "border-amber-400" : "border-zinc-600"}`}>
                      {isPublished && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <RiGlobalLine className="text-zinc-400 text-[14px]" />
                        <span className="text-sm font-medium text-zinc-200">Public</span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-0.5">Everyone can see this</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setIsPublished(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${!isPublished ? "border-amber-500/40 bg-amber-500/5" : "border-white/[0.06] hover:border-white/[0.12]"}`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${!isPublished ? "border-amber-400" : "border-zinc-600"}`}>
                      {!isPublished && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <RiLockLine className="text-zinc-400 text-[14px]" />
                        <span className="text-sm font-medium text-zinc-200">Private</span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-0.5">Only you can see this</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={!isReady}
                    className={`
                      w-full py-3 rounded-xl text-sm font-semibold transition-all
                      ${isReady
                        ? "bg-amber-500 hover:bg-amber-400 text-zinc-950"
                        : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                      }
                    `}
                  >
                    {isPublished ? "Publish video" : "Save & make private"}
                  </button>
                  <button
                    onClick={() => handleSubmit(true)}
                    className="w-full py-3 rounded-xl text-sm font-semibold border border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.16] transition-all"
                  >
                    Save as draft
                  </button>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
