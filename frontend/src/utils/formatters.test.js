import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { formatViews, formatCount, formatDuration, formatTimeAgo } from "./formatters"

describe("formatViews", () => {
  it("handles falsy values", () => {
    expect(formatViews(0)).toBe("0")
    expect(formatViews(null)).toBe("0")
    expect(formatViews(undefined)).toBe("0")
  })

  it("returns plain numbers below 1k", () => {
    expect(formatViews(999)).toBe("999")
  })

  it("formats thousands with one decimal", () => {
    expect(formatViews(1_000)).toBe("1.0K")
    expect(formatViews(12_345)).toBe("12.3K")
    expect(formatViews(999_999)).toBe("1000.0K")
  })

  it("formats millions with one decimal", () => {
    expect(formatViews(1_000_000)).toBe("1.0M")
    expect(formatViews(2_500_000)).toBe("2.5M")
    expect(formatViews(12_000_000)).toBe("12.0M")
  })
})

describe("formatCount", () => {
  it("handles falsy values", () => {
    expect(formatCount(0)).toBe("0")
    expect(formatCount(null)).toBe("0")
  })

  it("formats thousands and millions", () => {
    expect(formatCount(850)).toBe("850")
    expect(formatCount(1_500)).toBe("1.5K")
    expect(formatCount(3_000_000)).toBe("3.0M")
  })
})

describe("formatDuration", () => {
  it("handles falsy values", () => {
    expect(formatDuration(0)).toBe("0:00")
    expect(formatDuration(null)).toBe("0:00")
  })

  it("floors fractional seconds", () => {
    expect(formatDuration(46.613)).toBe("0:46")
    expect(formatDuration(5.758005)).toBe("0:05")
    expect(formatDuration(10.216009)).toBe("0:10")
    expect(formatDuration(59.9)).toBe("0:59")
  })

  it("formats minutes", () => {
    expect(formatDuration(65)).toBe("1:05")
    expect(formatDuration(600)).toBe("10:00")
  })

  it("formats hours", () => {
    expect(formatDuration(3661.7)).toBe("1:01:01")
    expect(formatDuration(3_600)).toBe("1:00:00")
  })
})

describe("formatTimeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-06T12:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns empty string for missing dates", () => {
    expect(formatTimeAgo(null)).toBe("")
    expect(formatTimeAgo(undefined)).toBe("")
  })

  it("says 'just now' under a minute", () => {
    expect(formatTimeAgo("2026-08-06T11:59:30Z")).toBe("just now")
  })

  it("formats minutes", () => {
    expect(formatTimeAgo("2026-08-06T11:55:00Z")).toBe("5 minutes ago")
  })

  it("formats hours", () => {
    expect(formatTimeAgo("2026-08-06T10:00:00Z")).toBe("2 hours ago")
  })

  it("formats days with correct pluralization", () => {
    expect(formatTimeAgo("2026-08-05T12:00:00Z")).toBe("1 day ago")
    expect(formatTimeAgo("2026-08-03T12:00:00Z")).toBe("3 days ago")
  })

  it("formats weeks", () => {
    expect(formatTimeAgo("2026-07-30T12:00:00Z")).toBe("1 week ago")
  })

  it("formats months", () => {
    expect(formatTimeAgo("2026-06-06T12:00:00Z")).toBe("2 months ago")
  })

  it("formats years", () => {
    expect(formatTimeAgo("2024-08-06T12:00:00Z")).toBe("2 years ago")
  })
})
