import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"

const Home          = lazy(() => import("./pages/Home/Home"))
const Watch         = lazy(() => import("./pages/Watch/Watch"))
const Channel       = lazy(() => import("./pages/Channel/Channel"))
const Dashboard     = lazy(() => import("./pages/Dashboard/Dashboard"))
const Upload        = lazy(() => import("./pages/Upload/Upload"))
const Search        = lazy(() => import("./pages/Search/Search"))
const Explore       = lazy(() => import("./pages/Explore/Explore"))
const Playlists     = lazy(() => import("./pages/Playlists/Playlists"))
const History       = lazy(() => import("./pages/History/History"))
const Subscriptions = lazy(() => import("./pages/Subscriptions/Subscriptions"))
const Settings      = lazy(() => import("./pages/Settings/Settings"))
const Login         = lazy(() => import("./pages/Login/Login"))
const Register      = lazy(() => import("./pages/Register/Register"))
const NotFound      = lazy(() => import("./pages/NotFound/NotFound"))
const Notifications = lazy(() => import("./pages/Notifications/Notifications"))
const Posts         = lazy(() => import("./pages/Posts/Posts"))

function PageLoader() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"                  element={<Home />} />
          <Route path="/watch/:videoId"    element={<Watch />} />
          <Route path="/channel/:username" element={<Channel />} />
          <Route path="/studio"            element={<Dashboard />} />
          <Route path="/upload"            element={<Upload />} />
          <Route path="/search"            element={<Search />} />
          <Route path="/explore"           element={<Explore />} />
          <Route path="/playlists"         element={<Playlists />} />
          <Route path="/history"           element={<History />} />
          <Route path="/subscriptions"     element={<Subscriptions />} />
          <Route path="/settings"          element={<Settings />} />
          <Route path="/login"             element={<Login />} />
          <Route path="/register"          element={<Register />} />
          <Route path="/notifications"     element={<Notifications />} />
          <Route path="/community"         element={<Posts />} />
          <Route path="*"                  element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
