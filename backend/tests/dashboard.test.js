import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest"
import request from "supertest"
import { cloudinaryMockFactory } from "./mocks.js"
import { connectTestDb, resetTestDb, disconnectTestDb } from "./bootstrap.js"

vi.mock("../src/utils/cloudinary.js", () => cloudinaryMockFactory())

import app from "../src/app.js"
import { registerAndLogin, createVideo } from "./helpers.js"

beforeAll(connectTestDb)
beforeEach(resetTestDb)
afterAll(disconnectTestDb)

describe("GET /api/v1/dashboard/stats", () => {
  it("requires authentication", async () => {
    await request(app).get("/api/v1/dashboard/stats").expect(401)
  })

  it("returns zeros for a fresh channel", async () => {
    const { accessCookie } = await registerAndLogin()
    const res = await request(app).get("/api/v1/dashboard/stats").set("Cookie", accessCookie).expect(200)
    expect(res.body.data).toEqual({
      totalSubscribers: 0,
      totalVideos: 0,
      totalViews: 0,
      totalLikes: 0,
    })
  })

  it("aggregates subscribers, videos, views and likes", async () => {
    const alice = await registerAndLogin({ username: "alice", email: "alice@example.com" })
    const bob = await registerAndLogin({ username: "bob", email: "bob@example.com" })

    const v1 = (await createVideo(alice.accessCookie, { title: "Video 1" }).expect(201)).body.data
    await createVideo(alice.accessCookie, { title: "Video 2" }).expect(201)

    
    await request(app).post(`/api/v1/subscriptions/c/${alice.user._id}`).set("Cookie", bob.accessCookie).expect(200)
    await request(app).post(`/api/v1/likes/toggle/v/${v1._id}`).set("Cookie", bob.accessCookie).expect(200)
    
    await request(app).get(`/api/v1/videos/${v1._id}`).expect(200)

    const res = await request(app).get("/api/v1/dashboard/stats").set("Cookie", alice.accessCookie).expect(200)
    expect(res.body.data.totalSubscribers).toBe(1)
    expect(res.body.data.totalVideos).toBe(2)
    expect(res.body.data.totalViews).toBe(1)
    expect(res.body.data.totalLikes).toBe(1)
  })
})

describe("GET /api/v1/dashboard/videos", () => {
  it("requires authentication", async () => {
    await request(app).get("/api/v1/dashboard/videos").expect(401)
  })

  it("lists only the user's own videos with like counts", async () => {
    const alice = await registerAndLogin({ username: "alice2", email: "alice2@example.com" })
    const bob = await registerAndLogin({ username: "bob2", email: "bob2@example.com" })

    const aliceVideo = (await createVideo(alice.accessCookie, { title: "Alice's" }).expect(201)).body.data
    await createVideo(alice.accessCookie, { title: "Alice's second" }).expect(201)
    await createVideo(bob.accessCookie, { title: "Bob's" }).expect(201)
    await request(app).post(`/api/v1/likes/toggle/v/${aliceVideo._id}`).set("Cookie", bob.accessCookie).expect(200)

    const res = await request(app).get("/api/v1/dashboard/videos").set("Cookie", alice.accessCookie).expect(200)
    expect(res.body.data.videos).toHaveLength(2)
    expect(res.body.data.totalVideos).toBe(2)
    expect(res.body.data.page).toBe(1)
    expect(res.body.data.totalPages).toBe(1)
    expect(res.body.data.hasNextPage).toBe(false)
    expect(res.body.data.videos.every((v) => v.title.startsWith("Alice's"))).toBe(true)
    const liked = res.body.data.videos.find((v) => v._id.toString() === aliceVideo._id.toString())
    expect(liked.totalLikes).toBe(1)
  })

  it("paginates results", async () => {
    const alice = await registerAndLogin({ username: "alice3", email: "alice3@example.com" })
    for (let i = 0; i < 5; i++) {
      await createVideo(alice.accessCookie, { title: `Video ${i}` }).expect(201)
    }

    const res = await request(app)
      .get("/api/v1/dashboard/videos?page=2&limit=2")
      .set("Cookie", alice.accessCookie)
      .expect(200)

    expect(res.body.data.videos).toHaveLength(2)
    expect(res.body.data.totalVideos).toBe(5)
    expect(res.body.data.page).toBe(2)
    expect(res.body.data.totalPages).toBe(3)
    expect(res.body.data.hasNextPage).toBe(true)
  })
})
