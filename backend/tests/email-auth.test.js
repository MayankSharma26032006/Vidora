import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest"
import request from "supertest"
import { cloudinaryMockFactory } from "./mocks.js"
import { connectTestDb, resetTestDb, disconnectTestDb } from "./bootstrap.js"
import { User } from "../src/models/user.model.js"

vi.mock("../src/utils/cloudinary.js", () => cloudinaryMockFactory())


import app from "../src/app.js"
import { register, registerAndLogin } from "./helpers.js"

beforeAll(connectTestDb)
beforeEach(resetTestDb)
afterAll(disconnectTestDb)





describe("POST /api/v1/user/verify-email", () => {
  it("verifies the email with a valid token", async () => {
    await register().expect(201)
    const user = await User.findOne({ email: "test@example.com" })

    expect(user.isEmailVerified).toBe(false)
    expect(user.emailVerificationToken).toBeTruthy()

    const res = await request(app)
      .post("/api/v1/user/verify-email")
      .send({ token: user.emailVerificationToken })
      .expect(200)

    expect(res.body.success).toBe(true)

    const verified = await User.findById(user._id)
    expect(verified.isEmailVerified).toBe(true)
    expect(verified.emailVerificationToken).toBe("")
  })

  it("rejects an unknown token with 400", async () => {
    await register().expect(201)
    const res = await request(app)
      .post("/api/v1/user/verify-email")
      .send({ token: "definitely-not-a-real-token" })
      .expect(400)
    expect(res.body.message).toMatch(/invalid|expired/i)
  })

  it("rejects an expired token with 400", async () => {
    await register().expect(201)
    const user = await User.findOne({ email: "test@example.com" })
    user.emailVerificationTokenExpiry = new Date(Date.now() - 1000)
    await user.save({ validateBeforeSave: false })

    const res = await request(app)
      .post("/api/v1/user/verify-email")
      .send({ token: user.emailVerificationToken })
      .expect(400)
    expect(res.body.message).toMatch(/expired/i)
  })

  it("rejects a missing token with 400", async () => {
    const res = await request(app)
      .post("/api/v1/user/verify-email")
      .send({})
      .expect(400)
    expect(res.body.message).toMatch(/token/i)
  })
})





describe("POST /api/v1/user/resend-verification", () => {
  it("sends a fresh verification token for an unverified user", async () => {
    const { accessCookie } = await registerAndLogin()
    const oldToken = (await User.findOne({ email: "user1@example.com" })).emailVerificationToken

    const res = await request(app)
      .post("/api/v1/user/resend-verification")
      .set("Cookie", accessCookie)
      .expect(200)
    expect(res.body.success).toBe(true)

    const user = await User.findOne({ email: "user1@example.com" })
    expect(user.emailVerificationToken).toBeTruthy()
    expect(user.emailVerificationToken).not.toBe(oldToken)
  })

  it("rejects an already-verified user with 400", async () => {
    const { accessCookie } = await registerAndLogin({ email: "already@example.com" })
    const user = await User.findOne({ email: "already@example.com" })
    user.isEmailVerified = true
    await user.save({ validateBeforeSave: false })

    const res = await request(app)
      .post("/api/v1/user/resend-verification")
      .set("Cookie", accessCookie)
      .expect(400)
    expect(res.body.message).toMatch(/already verified/i)
  })

  it("rejects unauthenticated requests with 401", async () => {
    await request(app)
      .post("/api/v1/user/resend-verification")
      .expect(401)
  })
})





describe("POST /api/v1/user/forgot-password", () => {
  it("creates a reset token for a registered email", async () => {
    await register().expect(201)
    const res = await request(app)
      .post("/api/v1/user/forgot-password")
      .send({ email: "test@example.com" })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.message).toMatch(/reset link/i)

    const user = await User.findOne({ email: "test@example.com" })
    expect(user.passwordResetToken).toBeTruthy()
    expect(user.passwordResetTokenExpiry).toBeInstanceOf(Date)
  })

  it("does not reveal whether an email is registered", async () => {
    const known = await request(app)
      .post("/api/v1/user/forgot-password")
      .send({ email: "nobody@example.com" })
      .expect(200)

    const message = "If that email is registered, a password reset link has been sent."
    expect(known.body.message).toBe(message)
  })

  it("rejects a malformed email with 400", async () => {
    const res = await request(app)
      .post("/api/v1/user/forgot-password")
      .send({ email: "not-an-email" })
      .expect(400)
    expect(res.body.message).toMatch(/valid email/i)
  })
})





describe("POST /api/v1/user/reset-password", () => {
  it("resets the password and revokes the old session", async () => {
    const { user, accessCookie, refreshCookie } = await registerAndLogin()
    const dbUser = await User.findById(user._id)
    const token = dbUser.passwordResetToken

    
    const resetRes = await request(app)
      .post("/api/v1/user/forgot-password")
      .send({ email: dbUser.email })
      .expect(200)
    expect(resetRes.body.success).toBe(true)

    const withResetToken = await User.findById(user._id)
    const reset = await request(app)
      .post("/api/v1/user/reset-password")
      .send({ token: withResetToken.passwordResetToken, newPassword: "newpassword123" })
      .expect(200)
    expect(reset.body.success).toBe(true)

    
    const refreshed = await User.findById(user._id)
    expect(refreshed.refreshToken).toBeUndefined()
    expect(refreshed.passwordResetToken).toBe("")

    
    const current = await request(app)
      .get("/api/v1/user/current-user")
      .set("Cookie", accessCookie)
    expect([200, 401]).toContain(current.status)

    
    const login = await request(app)
      .post("/api/v1/user/login")
      .send({ email: dbUser.email, password: "newpassword123" })
      .expect(200)
    expect(login.body.success).toBe(true)

    
    await request(app)
      .post("/api/v1/user/login")
      .send({ email: dbUser.email, password: "password123" })
      .expect(401)
  })

  it("rejects an unknown reset token with 400", async () => {
    const res = await request(app)
      .post("/api/v1/user/reset-password")
      .send({ token: "not-a-real-token", newPassword: "newpassword123" })
      .expect(400)
    expect(res.body.message).toMatch(/invalid|expired/i)
  })

  it("rejects an expired reset token with 400", async () => {
    await register().expect(201)
    const user = await User.findOne({ email: "test@example.com" })
    user.passwordResetToken = "expired-token"
    user.passwordResetTokenExpiry = new Date(Date.now() - 1000)
    await user.save({ validateBeforeSave: false })

    const res = await request(app)
      .post("/api/v1/user/reset-password")
      .send({ token: "expired-token", newPassword: "newpassword123" })
      .expect(400)
    expect(res.body.message).toMatch(/expired/i)
  })

  it("rejects a password shorter than 8 characters with 400", async () => {
    await register().expect(201)
    const user = await User.findOne({ email: "test@example.com" })
    user.passwordResetToken = "short-pass-token"
    user.passwordResetTokenExpiry = new Date(Date.now() + 10000)
    await user.save({ validateBeforeSave: false })

    const res = await request(app)
      .post("/api/v1/user/reset-password")
      .send({ token: "short-pass-token", newPassword: "short" })
      .expect(400)
    expect(res.body.message).toMatch(/at least 8/i)
  })
})
