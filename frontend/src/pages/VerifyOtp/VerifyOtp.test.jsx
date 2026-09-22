import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter, useLocation } from "react-router-dom"
import VerifyOtp from "./VerifyOtp"

vi.mock("../../services/api", () => ({
  default: { post: vi.fn() },
}))

import api from "../../services/api"

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="loc">{location.pathname}</div>
}

function renderPage(email = "test@example.com") {
  return render(
    <MemoryRouter
      initialEntries={[
        email
          ? { pathname: "/verify-account", state: { email, fullname: "Test User" } }
          : "/verify-account",
      ]}
    >
      <VerifyOtp />
      <LocationProbe />
    </MemoryRouter>
  )
}

function digitInputs() {
  return screen.getAllByLabelText(/Digit \d/)
}

describe("VerifyOtp", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset()
  })

  it("redirects to /register when opened without a registration context", async () => {
    renderPage("")
    await waitFor(() => expect(screen.getByTestId("loc").textContent).toBe("/register"))
    expect(api.post).not.toHaveBeenCalled()
  })

  it("renders six digit boxes and shows the recipient email", () => {
    renderPage("test@example.com")
    expect(digitInputs()).toHaveLength(6)
    expect(screen.getByText("test@example.com")).toBeInTheDocument()
  })

  it("auto-advances focus as digits are typed", () => {
    renderPage()
    const inputs = digitInputs()
    fireEvent.change(inputs[0], { target: { value: "1" } })
    expect(document.activeElement).toBe(inputs[1])
    fireEvent.change(inputs[1], { target: { value: "2" } })
    expect(document.activeElement).toBe(inputs[2])
  })

  it("distributes a pasted 6-digit code across the boxes and verifies it", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } })
    renderPage()
    const inputs = digitInputs()

    fireEvent.change(inputs[0], { target: { value: "123456" } })
    inputs.forEach((input, i) => expect(input).toHaveValue(String(i + 1)))

    fireEvent.click(screen.getByRole("button", { name: /verify email/i }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/user/verify-email", {
        email: "test@example.com",
        code: "123456",
      })
    )
    await waitFor(() => expect(screen.getByText("Email verified")).toBeInTheDocument())
  })

  it("shows the API error and clears the boxes on a failed verification", async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: { data: { message: "Too many attempts. Request a new code." } },
    })
    renderPage()
    fireEvent.change(digitInputs()[0], { target: { value: "000000" } })

    fireEvent.click(screen.getByRole("button", { name: /verify email/i }))

    expect(await screen.findByText("Too many attempts. Request a new code.")).toBeInTheDocument()
    digitInputs().forEach((input) => expect(input).toHaveValue(""))
  })

  it("resends via the pre-login endpoint and starts the cooldown", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } })
    renderPage()

    fireEvent.click(screen.getByRole("button", { name: /resend code/i }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/user/resend-verification-code", {
        email: "test@example.com",
      })
    )
    expect(await screen.findByText(/New code sent/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("button", { name: /resend code in/i })).toBeDisabled())
  })
})
