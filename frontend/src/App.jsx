import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home/Home"
import Watch from "./pages/Watch/Watch"
import Channel from "./pages/Channel/Channel"
import Dashboard from "./pages/Dashboard/Dashboard"
import Upload from "./pages/Upload/Upload"
import Search from "./pages/Search/Search"
import Explore from "./pages/Explore/Explore"
import Playlists from "./pages/Playlists/Playlists"
import History from "./pages/History/History"
import Subscriptions from "./pages/Subscriptions/Subscriptions"
import Settings from "./pages/Settings/Settings"
import Login from "./pages/Login/Login"
import Register from "./pages/Register/Register"
import NotFound from "./pages/NotFound/NotFound"
import Notifications from "./pages/Notifications/Notifications"
import Posts from "./pages/Posts/Posts"

function App() {
  return (
    <BrowserRouter>
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
        <Route path="*"                  element={<NotFound />} />
        <Route path="/community" element={<Posts />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App