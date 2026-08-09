import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest"
import request from "supertest"
import { cloudinaryMockFactory } from "./mocks.js"
import { connectTestDb, resetTestDb, disconnectTestDb } from "./bootstrap.js"

vi.mock("../src/utils/cloudinary.js", () => cloudinaryMockFactory())

import app from "../src/app.js"
import { registerAndLogin } from "./helpers.js"
import { Tweet } from "../src/models/tweet.model.js"

beforeAll(connectTestDb)
beforeEach(resetTestDb)
afterAll(disconnectTestDb)

async function setup() {
  const alice = await registerAndLogin({ username: "alice", email: "alice@example.com" })
  const bob = await registerAndLogin({ username: "bob", email: "bob@example.com" })
  return { alice, bob }
}

describe("POST /api/v1/tweets", () => {
  it("requires authentication", async () => {
    await request(app).post("/api/v1/tweets").send({ content: "x" }).expect(401)
  })

  it("creates a tweet", async () => {
    const { alice } = await setup()
    const res = await request(app)
      .post("/api/v1/tweets")
      .set("Cookie", alice.accessCookie)
      .send({ content: "Hello community!" })
      .expect(201)
    expect(res.body.data.content).toBe("Hello community!")
    expect(res.body.data.owner).toBe(alice.user._id)
  })

  it("rejects empty content", async () => {
    const { alice } = await setup()
    const res = await request(app)
      .post("/api/v1/tweets")
      .set("Cookie", alice.accessCookie)
      .send({ content: "   " })
      .expect(400)
    expect(res.body.message).toBe("Tweet content is required")
  })
})

describe("GET /api/v1/tweets", () => {
  it("is public and returns tweets newest first with owner", async () => {
    const { alice, bob } = await setup()
    const first = (
      await request(app).post("/api/v1/tweets").set("Cookie", alice.accessCookie).send({ content: "Older" }).expect(201)
    ).body.data
    
    await Tweet.findByIdAndUpdate(first._id, { $set: { createdAt: new Date("2026-01-01") } })
    await request(app).post("/api/v1/tweets").set("Cookie", bob.accessCookie).send({ content: "Newer" }).expect(201)

    const res = await request(app).get("/api/v1/tweets").expect(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.data[0].content).toBe("Newer")
    expect(res.body.data[0].owner.username).toBe("bob")
  })
})

describe("GET /api/v1/tweets/user/:userId", () => {
  it("returns only that user's tweets", async () => {
    const { alice, bob } = await setup()
    await request(app).post("/api/v1/tweets").set("Cookie", alice.accessCookie).send({ content: "Alice's" }).expect(201)
    await request(app).post("/api/v1/tweets").set("Cookie", bob.accessCookie).send({ content: "Bob's" }).expect(201)

    const res = await request(app).get(`/api/v1/tweets/user/${alice.user._id}`).expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].content).toBe("Alice's")
  })

  it("rejects an invalid user id", async () => {
    await request(app).get("/api/v1/tweets/user/not-an-id").expect(400)
  })
})

describe("PATCH /api/v1/tweets/:tweetId", () => {
  it("lets the owner update their tweet", async () => {
    const { alice } = await setup()
    const tweet = (
      await request(app).post("/api/v1/tweets").set("Cookie", alice.accessCookie).send({ content: "Original" }).expect(201)
    ).body.data

    const res = await request(app)
      .patch(`/api/v1/tweets/${tweet._id}`)
      .set("Cookie", alice.accessCookie)
      .send({ content: "Edited" })
      .expect(200)
    expect(res.body.data.content).toBe("Edited")
  })

  it("forbids non-owners with 403", async () => {
    const { alice, bob } = await setup()
    const tweet = (
      await request(app).post("/api/v1/tweets").set("Cookie", alice.accessCookie).send({ content: "Alice's" }).expect(201)
    ).body.data

    const res = await request(app)
      .patch(`/api/v1/tweets/${tweet._id}`)
      .set("Cookie", bob.accessCookie)
      .send({ content: "Hijacked" })
      .expect(403)
    expect(res.body.message).toBe("You are not allowed to update this tweet")
  })

  it("rejects an invalid tweet id", async () => {
    const { accessCookie } = await registerAndLogin()
    await request(app).patch("/api/v1/tweets/not-an-id").set("Cookie", accessCookie).send({ content: "x" }).expect(400)
  })

  it("returns 404 for an unknown tweet", async () => {
    const { accessCookie } = await registerAndLogin()
    await request(app)
      .patch("/api/v1/tweets/64f0abc1234567890def0001")
      .set("Cookie", accessCookie)
      .send({ content: "x" })
      .expect(404)
  })
})

describe("DELETE /api/v1/tweets/:tweetId", () => {
  it("lets the owner delete their tweet", async () => {
    const { alice } = await setup()
    const tweet = (
      await request(app).post("/api/v1/tweets").set("Cookie", alice.accessCookie).send({ content: "Bye" }).expect(201)
    ).body.data

    await request(app).delete(`/api/v1/tweets/${tweet._id}`).set("Cookie", alice.accessCookie).expect(200)
    const res = await request(app).get("/api/v1/tweets").expect(200)
    expect(res.body.data).toHaveLength(0)
  })

  it("forbids non-owners with 403", async () => {
    const { alice, bob } = await setup()
    const tweet = (
      await request(app).post("/api/v1/tweets").set("Cookie", alice.accessCookie).send({ content: "Alice's" }).expect(201)
    ).body.data
    await request(app).delete(`/api/v1/tweets/${tweet._id}`).set("Cookie", bob.accessCookie).expect(403)
  })

  it("rejects an invalid tweet id", async () => {
    const { accessCookie } = await registerAndLogin()
    await request(app).delete("/api/v1/tweets/not-an-id").set("Cookie", accessCookie).expect(400)
  })
})
