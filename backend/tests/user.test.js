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

describe("GET /api/v1/user/channel-profile/:username", () => {
  it("returns a channel profile with counts", async () => {
    const alice = await registerAndLogin({ username: "alice", email: "alice@example.com" })
    const bob = await registerAndLogin({ username: "bob", email: "bob@example.com" })
    await createVideo(alice.accessCookie).expect(201)
    await request(app).post(`/api/v1/subscriptions/c/${alice.user._id}`).set("Cookie", bob.accessCookie).expect(200)

    const res = await request(app).get("/api/v1/user/channel-profile/alice").expect(200)
    expect(res.body.data.username).toBe("alice")
    expect(res.body.data.videoCount).toBe(1)
    expect(res.body.data.subscribersCount).toBe(1)
    expect(res.body.data.channelsSubscribedToCount).toBe(0)
    expect(res.body.data.isSubscribed).toBe(false) // anonymous requester
  })

  it("marks isSubscribed for a subscribed requester", async () => {
    const alice = await registerAndLogin({ username: "alice2", email: "alice2@example.com" })
    const bob = await registerAndLogin({ username: "bob2", email: "bob2@example.com" })
    await request(app).post(`/api/v1/subscriptions/c/${alice.user._id}`).set("Cookie", bob.accessCookie).expect(200)

    const res = await request(app)
      .get("/api/v1/user/channel-profile/alice2")
      .set("Cookie", bob.accessCookie)
      .expect(200)
    expect(res.body.data.isSubscribed).toBe(true)
  })

  it("returns 404 for an unknown channel", async () => {
    await request(app).get("/api/v1/user/channel-profile/ghost").expect(404)
  })
})

describe("GET /api/v1/user/watch-history", () => {
  it("requires authentication", async () => {
    await request(app).get("/api/v1/user/watch-history").expect(401)
  })

  it("is empty for a user with no history", async () => {
    const { accessCookie } = await registerAndLogin()
    const res = await request(app).get("/api/v1/user/watch-history").set("Cookie", accessCookie).expect(200)
    expect(res.body.data).toEqual([])
  })

  it("records watched videos with the owner's fullname", async () => {
    const alice = await registerAndLogin({ username: "alice3", email: "alice3@example.com" })
    const bob = await registerAndLogin({ username: "bob3", email: "bob3@example.com" })
    const video = (await createVideo(bob.accessCookie).expect(201)).body.data

    // watching as alice records into her history
    await request(app).get(`/api/v1/videos/${video._id}`).set("Cookie", alice.accessCookie).expect(200)

    const res = await request(app).get("/api/v1/user/watch-history").set("Cookie", alice.accessCookie).expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0]._id.toString()).toBe(video._id.toString())
    // owner fullname comes through (regression: projection used fullName, not fullname)
    expect(res.body.data[0].owner.fullname).toBe("test user")
  })
})

describe("GET /api/v1/user/saved-videos", () => {
  it("requires authentication", async () => {
    await request(app).get("/api/v1/user/saved-videos").expect(401)
  })

  it("returns saved videos with their owner", async () => {
    const alice = await registerAndLogin({ username: "alice4", email: "alice4@example.com" })
    const bob = await registerAndLogin({ username: "bob4", email: "bob4@example.com" })
    const video = (await createVideo(bob.accessCookie).expect(201)).body.data

    await request(app)
      .post(`/api/v1/user/saved-videos/${video._id}`)
      .set("Cookie", alice.accessCookie)
      .expect(200)

    const res = await request(app).get("/api/v1/user/saved-videos").set("Cookie", alice.accessCookie).expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0]._id.toString()).toBe(video._id.toString())
    expect(res.body.data[0].owner.username).toBe("bob4")
  })
})

describe("PATCH /api/v1/user/update-account", () => {
  it("requires authentication", async () => {
    await request(app).patch("/api/v1/user/update-account").send({ fullName: "X", email: "x@example.com" }).expect(401)
  })

  it("updates fullname and email", async () => {
    const { accessCookie } = await registerAndLogin()
    const res = await request(app)
      .patch("/api/v1/user/update-account")
      .set("Cookie", accessCookie)
      .send({ fullName: "New Name", email: "newname@example.com" })
      .expect(200)
    expect(res.body.data.fullname).toBe("new name") // schema lowercases
    expect(res.body.data.email).toBe("newname@example.com")
  })

  it("rejects missing fields", async () => {
    const { accessCookie } = await registerAndLogin()
    await request(app).patch("/api/v1/user/update-account").set("Cookie", accessCookie).send({}).expect(400)
  })
})

describe("PATCH /api/v1/user/update-avatar", () => {
  it("requires authentication", async () => {
    await request(app).patch("/api/v1/user/update-avatar").expect(401)
  })

  it("rejects a missing file", async () => {
    const { accessCookie } = await registerAndLogin()
    const res = await request(app)
      .patch("/api/v1/user/update-avatar")
      .set("Cookie", accessCookie)
      .expect(400)
    expect(res.body.message).toBe("Avatar file is missing")
  })

  it("updates the avatar", async () => {
    const { accessCookie } = await registerAndLogin()
    const res = await request(app)
      .patch("/api/v1/user/update-avatar")
      .set("Cookie", accessCookie)
      .attach("avatar", Buffer.from("fake-avatar"), "new-avatar.jpg")
      .expect(200)
    expect(res.body.data.avatar).toMatch(/\.jpg$/)
  })
})

describe("PATCH /api/v1/user/update-cover", () => {
  it("updates the cover image", async () => {
    const { accessCookie } = await registerAndLogin()
    const res = await request(app)
      .patch("/api/v1/user/update-cover")
      .set("Cookie", accessCookie)
      .attach("coverImage", Buffer.from("fake-cover"), "new-cover.jpg")
      .expect(200)
    expect(res.body.data.coverImage).toMatch(/\.jpg$/)
  })
})
