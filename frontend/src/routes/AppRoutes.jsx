import { lazy, Suspense } from "react"
import { Routes, Route } from "react-router-dom"
import MainLayout from "../layouts/MainLayout"

const Home          = lazy(() => import("../pages/Home/Home"))
const Watch         = lazy(() => import("../pages/Watch/Watch"))
const Channel       = lazy(() => import("../pages/Channel/Channel"))
const Dashboard     = lazy(() => import("../pages/Dashboard/Dashboard"))
const Upload        = lazy(() => import("../pages/Upload/Upload"))
const Search        = lazy(() => import("../pages/Search/Search"))
const Explore       = lazy(() => import("../pages/Explore/Explore"))
const Trending      = lazy(() => import("../pages/Trending/Trending"))
const LikedVideos   = lazy(() => import("../pages/LikedVideos/LikedVideos"))
const Saved         = lazy(() => import("../pages/Saved/Saved"))
const Playlists     = lazy(() => import("../pages/Playlists/Playlists"))
const History       = lazy(() => import("../pages/History/History"))
const Subscriptions = lazy(() => import("../pages/Subscriptions/Subscriptions"))
const Settings      = lazy(() => import("../pages/Settings/Settings"))
const Login         = lazy(() => import("../pages/Login/Login"))
const Register      = lazy(() => import("../pages/Register/Register"))
const ForgotPassword = lazy(() => import("../pages/ForgotPassword/ForgotPassword"))
const ResetPassword  = lazy(() => import("../pages/ResetPassword/ResetPassword"))
const VerifyEmail    = lazy(() => import("../pages/VerifyEmail/VerifyEmail"))
const NotFound      = lazy(() => import("../pages/NotFound/NotFound"))
const Notifications = lazy(() => import("../pages/Notifications/Notifications"))
const Posts         = lazy(() => import("../pages/Posts/Posts"))

function PageLoader() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {}
        <Route element={<MainLayout />}>
          <Route path="/"                  element={<Home />} />
          <Route path="/watch/:videoId"    element={<Watch />} />
          <Route path="/channel/:username" element={<Channel />} />
          <Route path="/studio"            element={<Dashboard />} />
          <Route path="/upload"            element={<Upload />} />
          <Route path="/search"            element={<Search />} />
          <Route path="/explore"           element={<Explore />} />
          <Route path="/trending"          element={<Trending />} />
          <Route path="/liked-videos"      element={<LikedVideos />} />
          <Route path="/saved"             element={<Saved />} />
          <Route path="/playlists"         element={<Playlists />} />
          <Route path="/history"           element={<History />} />
          <Route path="/subscriptions"     element={<Subscriptions />} />
          <Route path="/settings"          element={<Settings />} />
          <Route path="/notifications"     element={<Notifications />} />
          <Route path="/community"         element={<Posts />} />
        </Route>

        {}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="*"         element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
