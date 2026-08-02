import { Outlet } from "react-router-dom"
import Sidebar from "../components/sidebar/Sidebar"
import Navbar from "../components/navbar/Navbar"

// Shared app shell — every logged-in page renders inside this.
// Pages only provide their own content; Sidebar/Navbar/scroll live here.
export default function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
