import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest"
import request from "supertest"
import { cloudinaryMockFactory } from "./mocks.js"
import { connectTestDb, resetTestDb, disconnectTestDb } from "./bootstrap.js"

vi.mock("../src/utils/cloudinary.js", () => cloudinaryMockFactory())

import app from "../src/app.js"
import { registerAndLogin } from "./helpers.js"
import { Notification } from "../src/models/notification.model.js"

beforeAll(connectTestDb)
beforeEach(resetTestDb)
afterAll(disconnectTestDb)

describe("POST /api/v1/subscriptions/c/:channelId", () => {
  it("requires authentication", async () => {
    await request(app).post("/api/v1/subscriptions/c/64f0abc1234567890def0001").expect(401)
  })

  it("rejects subscribing to a nonexistent channel with 404", async () => {
    const fan = await registerAndLogin({ username: "ghostfan", email: "ghostfan@example.com" })
    await request(app)
      .post("/api/v1/subscriptions/c/64f0abc1234567890def0001")
      .set("Cookie", fan.accessCookie)
      .expect(404)
  })

  it("subscribes to a channel and notifies it", async () => {
    const channel = await registerAndLogin({ username: "channel", email: "channel@example.com" })
    const fan = await registerAndLogin({ username: "fan", email: "fan@example.com" })

    const res = await request(app)
      .post(`/api/v1/subscriptions/c/${channel.user._id}`)
      .set("Cookie", fan.accessCookie)
      .expect(200)
    expect(res.body.data.isSubscribed).toBe(true)

    const notifs = await Notification.find({ owner: channel.user._id, type: "subscribe" })
    expect(notifs).toHaveLength(1)
    expect(notifs[0].actor.toString()).toBe(fan.user._id.toString())
  })

  it("unsubscribes and removes the notification", async () => {
    const channel = await registerAndLogin({ username: "channel2", email: "channel2@example.com" })
    const fan = await registerAndLogin({ username: "fan2", email: "fan2@example.com" })
    await request(app)
      .post(`/api/v1/subscriptions/c/${channel.user._id}`)
      .set("Cookie", fan.accessCookie)
      .expect(200)

    const res = await request(app)
      .post(`/api/v1/subscriptions/c/${channel.user._id}`)
      .set("Cookie", fan.accessCookie)
      .expect(200)
    expect(res.body.data.isSubscribed).toBe(false)
    expect(await Notification.countDocuments({ owner: channel.user._id, type: "subscribe" })).toBe(0)
  })

  it("rejects subscribing to yourself", async () => {
    const user = await registerAndLogin()
    const res = await request(app)
      .post(`/api/v1/subscriptions/c/${user.user._id}`)
      .set("Cookie", user.accessCookie)
      .expect(400)
    expect(res.body.message).toBe("You cannot subscribe to yourself")
  })

  it("rejects an invalid channel id", async () => {
    const { accessCookie } = await registerAndLogin()
    await request(app).post("/api/v1/subscriptions/c/not-an-id").set("Cookie", accessCookie).expect(400)
  })
})

describe("GET /api/v1/subscriptions/c/:channelId", () => {
  it("lists a channel's subscribers", async () => {
    const channel = await registerAndLogin({ username: "channel3", email: "channel3@example.com" })
    const fan = await registerAndLogin({ username: "fan3", email: "fan3@example.com" })
    await request(app)
      .post(`/api/v1/subscriptions/c/${channel.user._id}`)
      .set("Cookie", fan.accessCookie)
      .expect(200)

    const res = await request(app)
      .get(`/api/v1/subscriptions/c/${channel.user._id}`)
      .set("Cookie", channel.accessCookie)
      .expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].subscriber.username).toBe("fan3")
  })
})

describe("GET /api/v1/subscriptions/u/:subscriberId", () => {
  it("lists the channels a user subscribes to", async () => {
    const channel = await registerAndLogin({ username: "channel4", email: "channel4@example.com" })
    const fan = await registerAndLogin({ username: "fan4", email: "fan4@example.com" })
    await request(app)
      .post(`/api/v1/subscriptions/c/${channel.user._id}`)
      .set("Cookie", fan.accessCookie)
      .expect(200)

    const res = await request(app)
      .get(`/api/v1/subscriptions/u/${fan.user._id}`)
      .set("Cookie", fan.accessCookie)
      .expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].channel.username).toBe("channel4")
  })
})
