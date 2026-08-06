import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest"
import request from "supertest"
import { cloudinaryMockFactory } from "./mocks.js"
import { connectTestDb, resetTestDb, disconnectTestDb } from "./bootstrap.js"

vi.mock("../src/utils/cloudinary.js", () => cloudinaryMockFactory())

import app from "../src/app.js"
import { registerAndLogin, createVideo } from "./helpers.js"
import { Notification } from "../src/models/notification.model.js"
import { Comment } from "../src/models/comment.model.js"

beforeAll(connectTestDb)
beforeEach(resetTestDb)
afterAll(disconnectTestDb)

async function setup() {
  const alice = await registerAndLogin({ username: "alice", email: "alice@example.com" })
  const bob = await registerAndLogin({ username: "bob", email: "bob@example.com" })
  const video = (await createVideo(alice.accessCookie).expect(201)).body.data
  return { alice, bob, video }
}

function addComment(accessCookie, videoId, content = "Nice video!") {
  return request(app)
    .post(`/api/v1/comments/${videoId}`)
    .set("Cookie", accessCookie)
    .send({ content })
}

describe("GET /api/v1/comments/:videoId", () => {
  it("is public and returns comments newest first with owner", async () => {
    const { bob, video } = await setup()
    const first = (await addComment(bob.accessCookie, video._id, "First").expect(201)).body.data
    // Backdate so ordering can't flake on same-millisecond creates
    await Comment.findByIdAndUpdate(first._id, { $set: { createdAt: new Date("2026-01-01") } })
    await addComment(bob.accessCookie, video._id, "Second").expect(201)

    const res = await request(app).get(`/api/v1/comments/${video._id}`).expect(200)
    expect(res.body.data.docs).toHaveLength(2)
    expect(res.body.data.docs[0].content).toBe("Second")
    expect(res.body.data.docs[0].owner.username).toBe("bob")
  })

  it("rejects an invalid video id", async () => {
    await request(app).get("/api/v1/comments/not-an-id").expect(400)
  })
})

describe("POST /api/v1/comments/:videoId", () => {
  it("requires authentication", async () => {
    const { video } = await setup()
    await request(app).post(`/api/v1/comments/${video._id}`).send({ content: "x" }).expect(401)
  })

  it("adds a comment and notifies the video owner", async () => {
    const { alice, bob, video } = await setup()
    const res = await addComment(bob.accessCookie, video._id, "Amazing!").expect(201)
    expect(res.body.data.content).toBe("Amazing!")

    const notifs = await Notification.find({ owner: alice.user._id, type: "comment" })
    expect(notifs).toHaveLength(1)
    expect(notifs[0].actor.toString()).toBe(bob.user._id.toString())
  })

  it("does not notify the owner about their own comment", async () => {
    const { alice, video } = await setup()
    await addComment(alice.accessCookie, video._id).expect(201)
    expect(await Notification.countDocuments({ owner: alice.user._id })).toBe(0)
  })

  it("rejects empty content", async () => {
    const { bob, video } = await setup()
    const res = await addComment(bob.accessCookie, video._id, "   ").expect(400)
    expect(res.body.message).toBe("Comment content is required")
  })
})

describe("PATCH /api/v1/comments/c/:commentId", () => {
  it("lets the owner update their comment", async () => {
    const { bob, video } = await setup()
    const comment = (await addComment(bob.accessCookie, video._id).expect(201)).body.data

    const res = await request(app)
      .patch(`/api/v1/comments/c/${comment._id}`)
      .set("Cookie", bob.accessCookie)
      .send({ content: "Updated!" })
      .expect(200)
    expect(res.body.data.content).toBe("Updated!")
  })

  it("forbids non-owners with 403", async () => {
    const { alice, bob, video } = await setup()
    const comment = (await addComment(bob.accessCookie, video._id).expect(201)).body.data

    const res = await request(app)
      .patch(`/api/v1/comments/c/${comment._id}`)
      .set("Cookie", alice.accessCookie)
      .send({ content: "Hijacked" })
      .expect(403)
    expect(res.body.message).toBe("You are not allowed to update this comment")
  })

  it("returns 404 for an unknown comment", async () => {
    const { accessCookie } = await registerAndLogin()
    await request(app)
      .patch("/api/v1/comments/c/64f0abc1234567890def0001")
      .set("Cookie", accessCookie)
      .send({ content: "x" })
      .expect(404)
  })
})

describe("DELETE /api/v1/comments/c/:commentId", () => {
  it("lets the owner delete and removes the notification", async () => {
    const { alice, bob, video } = await setup()
    const comment = (await addComment(bob.accessCookie, video._id).expect(201)).body.data
    expect(await Notification.countDocuments({ owner: alice.user._id, type: "comment" })).toBe(1)

    const res = await request(app)
      .delete(`/api/v1/comments/c/${comment._id}`)
      .set("Cookie", bob.accessCookie)
      .expect(200)
    expect(res.body.message).toBe("Comment deleted successfully")
    expect(await Notification.countDocuments({ owner: alice.user._id, type: "comment" })).toBe(0)
  })

  it("forbids non-owners with 403", async () => {
    const { alice, bob, video } = await setup()
    const comment = (await addComment(bob.accessCookie, video._id).expect(201)).body.data

    await request(app)
      .delete(`/api/v1/comments/c/${comment._id}`)
      .set("Cookie", alice.accessCookie)
      .expect(403)
  })
})
