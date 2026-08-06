import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

// vitest runs with globals:false, so RTL cannot auto-register its cleanup.
// Unmount rendered trees after every test to avoid DOM leakage.
afterEach(() => {
  cleanup()
})
