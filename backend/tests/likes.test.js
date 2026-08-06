import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest"
import request from "supertest"
import { cloudinaryMockFactory } from "./mocks.js"
import { connectTestDb, resetTestDb, disconnectTestDb } from "./bootstrap.js"

vi.mock("../src/utils/cloudinary.js", () => cloudinaryMockFactory())

import app from "../src/app.js"
import { registerAndLogin, createVideo } from "./helpers.js"
import { Like } from "../src/models/like.model.js"
import { Notification } from "../src/models/notification.model.js"

beforeAll(connectTestDb)
beforeEach(resetTestDb)
afterAll(disconnectTestDb)

async function aliceBobWithVideo() {
  const alice = await registerAndLogin({ username: "alice", email: "alice@example.com" })
  const bob = await registerAndLogin({ username: "bob", email: "bob@example.com" })
  const video = (await createVideo(alice.accessCookie).expect(201)).body.data
  return { alice, bob, video }
}

describe("POST /api/v1/likes/toggle/v/:videoId", () => {
  it("requires authentication", async () => {
    await request(app).post("/api/v1/likes/toggle/v/64f0abc1234567890def0001").expect(401)
  })

  it("rejects an invalid video id", async () => {
    const { accessCookie } = await registerAndLogin()
    const res = await request(app)
      .post("/api/v1/likes/toggle/v/not-an-id")
      .set("Cookie", accessCookie)
      .expect(400)
    expect(res.body.message).toBe("Invalid video ID")
  })

  it("returns 404 for a video that does not exist", async () => {
    const { accessCookie } = await registerAndLogin()
    await request(app)
      .post("/api/v1/likes/toggle/v/64f0abc1234567890def0001")
      .set("Cookie", accessCookie)
      .expect(404)
  })

  it("likes a video and notifies the owner", async () => {
    const { alice, bob, video } = await aliceBobWithVideo()

    const res = await request(app)
      .post(`/api/v1/likes/toggle/v/${video._id}`)
      .set("Cookie", bob.accessCookie)
      .expect(200)
    expect(res.body.data.isLiked).toBe(true)

    expect(await Like.countDocuments({ video: video._id, likedBy: bob.user._id })).toBe(1)
    const notifs = await Notification.find({ owner: alice.user._id, type: "like" })
    expect(notifs).toHaveLength(1)
    expect(notifs[0].actor.toString()).toBe(bob.user._id.toString())
  })

  it("unlikes and removes the notification", async () => {
    const { alice, bob, video } = await aliceBobWithVideo()
    await request(app).post(`/api/v1/likes/toggle/v/${video._id}`).set("Cookie", bob.accessCookie).expect(200)

    const res = await request(app)
      .post(`/api/v1/likes/toggle/v/${video._id}`)
      .set("Cookie", bob.accessCookie)
      .expect(200)
    expect(res.body.data.isLiked).toBe(false)
    expect(await Like.countDocuments({ video: video._id })).toBe(0)
    expect(await Notification.countDocuments({ owner: alice.user._id, type: "like" })).toBe(0)
  })

  it("does not notify the owner about their own like", async () => {
    const { alice, video } = await aliceBobWithVideo()
    await request(app).post(`/api/v1/likes/toggle/v/${video._id}`).set("Cookie", alice.accessCookie).expect(200)
    expect(await Notification.countDocuments({ owner: alice.user._id })).toBe(0)
  })
})

describe("GET /api/v1/likes/videos", () => {
  it("lists the videos the user liked", async () => {
    const { bob, video } = await aliceBobWithVideo()
    await request(app).post(`/api/v1/likes/toggle/v/${video._id}`).set("Cookie", bob.accessCookie).expect(200)

    const res = await request(app).get("/api/v1/likes/videos").set("Cookie", bob.accessCookie).expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].video._id.toString()).toBe(video._id.toString())
  })

  it("is empty after unliking", async () => {
    const { bob, video } = await aliceBobWithVideo()
    await request(app).post(`/api/v1/likes/toggle/v/${video._id}`).set("Cookie", bob.accessCookie).expect(200)
    await request(app).post(`/api/v1/likes/toggle/v/${video._id}`).set("Cookie", bob.accessCookie).expect(200)

    const res = await request(app).get("/api/v1/likes/videos").set("Cookie", bob.accessCookie).expect(200)
    expect(res.body.data).toHaveLength(0)
  })
})

describe("POST /api/v1/likes/toggle/c/:commentId", () => {
  it("likes and unlikes a comment", async () => {
    const { alice, bob, video } = await aliceBobWithVideo()
    const comment = (
      await request(app)
        .post(`/api/v1/comments/${video._id}`)
        .set("Cookie", bob.accessCookie)
        .send({ content: "Great video!" })
        .expect(201)
    ).body.data

    await request(app).post(`/api/v1/likes/toggle/c/${comment._id}`).set("Cookie", alice.accessCookie).expect(200)
    expect(await Like.countDocuments({ comment: comment._id })).toBe(1)

    const res = await request(app)
      .post(`/api/v1/likes/toggle/c/${comment._id}`)
      .set("Cookie", alice.accessCookie)
      .expect(200)
    expect(res.body.data.isLiked).toBe(false)
    expect(await Like.countDocuments({ comment: comment._id })).toBe(0)
  })

  it("rejects an invalid comment id", async () => {
    const { accessCookie } = await registerAndLogin()
    await request(app).post("/api/v1/likes/toggle/c/not-an-id").set("Cookie", accessCookie).expect(400)
  })
})

describe("POST /api/v1/likes/toggle/t/:tweetId", () => {
  it("likes and unlikes a tweet", async () => {
    const { alice, bob } = await aliceBobWithVideo()
    const tweet = (
      await request(app)
        .post("/api/v1/tweets")
        .set("Cookie", alice.accessCookie)
        .send({ content: "Hello community!" })
        .expect(201)
    ).body.data

    await request(app).post(`/api/v1/likes/toggle/t/${tweet._id}`).set("Cookie", bob.accessCookie).expect(200)
    expect(await Like.countDocuments({ tweet: tweet._id, likedBy: bob.user._id })).toBe(1)

    await request(app).post(`/api/v1/likes/toggle/t/${tweet._id}`).set("Cookie", bob.accessCookie).expect(200)
    expect(await Like.countDocuments({ tweet: tweet._id })).toBe(0)
  })
})
