import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter, useLocation } from "react-router-dom"
import SearchInput from "./SearchInput"

vi.mock("../../services/api", () => ({
  default: { get: vi.fn() },
}))

import api from "../../services/api"

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="loc">{location.pathname + location.search}</div>
}

function renderInput() {
  return render(
    <MemoryRouter>
      <SearchInput />
      <LocationProbe />
    </MemoryRouter>
  )
}

describe("SearchInput", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(api.get).mockReset()
  })

  it("shows matching video titles and channel names as live suggestions", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: {
          docs: [
            { _id: "1", title: "motivation video", owner: { username: "shivank" } },
            { _id: "2", title: "Beach",            owner: { username: "motivator" } },
          ],
        },
      },
    })

    renderInput()
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "mot" } })

    await waitFor(() => expect(screen.getByText("motivation video")).toBeInTheDocument(), { timeout: 2000 })
    expect(screen.getByText("Video")).toBeInTheDocument()
    // channel names matching the query are listed too
    expect(screen.getByText("motivator")).toBeInTheDocument()
    expect(screen.getByText("Channel")).toBeInTheDocument()
  })

  it("fills the search bar with the term and navigates when a suggestion is clicked", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { data: { docs: [{ _id: "1", title: "motivation video", owner: { username: "shivank" } }] } },
    })

    renderInput()
    const input = screen.getByRole("searchbox")
    fireEvent.change(input, { target: { value: "mot" } })

    await waitFor(() => expect(screen.getByText("motivation video")).toBeInTheDocument(), { timeout: 2000 })
    fireEvent.click(screen.getByText("motivation video"))

    // the clicked term is added to the search bar, like YouTube
    expect(input).toHaveValue("motivation video")
    expect(screen.getByTestId("loc").textContent).toBe("/search?q=motivation%20video")
  })

  it("shows recent searches from localStorage when focused with an empty query", () => {
    localStorage.setItem("vidora_recent_searches", JSON.stringify(["beach", "motivation"]))

    renderInput()
    fireEvent.focus(screen.getByRole("searchbox"))

    expect(screen.getByText("Recent searches")).toBeInTheDocument()
    expect(screen.getByText("beach")).toBeInTheDocument()
    expect(screen.getByText("motivation")).toBeInTheDocument()
  })
})
