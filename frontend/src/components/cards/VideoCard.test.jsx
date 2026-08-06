import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import VideoCard from "./VideoCard"

const video = {
  _id: "64f0abc1234567890def0001",
  title: "My test video",
  thumbnail: null,
  duration: 46.613,
  views: 1_500,
  createdAt: "2026-08-06T10:00:00.000Z",
  owner: {
    fullname: "Test Creator",
    username: "testcreator",
    avatar: null,
  },
}

function renderAt(path, element) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={element} />
        <Route path="/watch/:videoId" element={<div>WATCH PAGE</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe("VideoCard", () => {
  it("renders title, channel, formatted views and a clean duration", () => {
    renderAt("/", <VideoCard video={video} />)

    expect(screen.getByText("My test video")).toBeInTheDocument()
    expect(screen.getByText("@testcreator")).toBeInTheDocument()
    expect(screen.getByText(/1.5K views/)).toBeInTheDocument()
    // duration floors the seconds — no more "0:46.613"
    expect(screen.getByText("0:46")).toBeInTheDocument()
  })

  it("renders a placeholder avatar with initials when the owner has none", () => {
    renderAt("/", <VideoCard video={video} />)
    expect(screen.getByText("TC")).toBeInTheDocument()
  })

  it("navigates to /watch/:id when clicked", () => {
    renderAt("/", <VideoCard video={video} />)
    fireEvent.click(screen.getByText("My test video"))
    expect(screen.getByText("WATCH PAGE")).toBeInTheDocument()
  })
})
