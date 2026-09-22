import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest"
import request from "supertest"
import { cloudinaryMockFactory } from "./mocks.js"
import { connectTestDb, resetTestDb, disconnectTestDb } from "./bootstrap.js"
import { User } from "../src/models/user.model.js"

vi.mock("../src/utils/cloudinary.js", () => cloudinaryMockFactory())

import app from "../src/app.js"
import { register, registerAndLogin, createVideo } from "./helpers.js"

beforeAll(connectTestDb)
beforeEach(resetTestDb)
afterAll(disconnectTestDb)

async function getUser(email) {
  return User.findOne({ email })
}

describe("POST /api/v1/user/verify-email (OTP flow)", () => {
  it("verifies the email with the correct email + code", async () => {
    await register().expect(201)
    const user = await getUser("test@example.com")

    expect(user.isEmailVerified).toBe(false)
    expect(user.emailVerificationToken).toMatch(/^\d{6}$/)

    const res = await request(app)
      .post("/api/v1/user/verify-email")
      .send({ email: user.email, code: user.emailVerificationToken })
      .expect(200)

    expect(res.body.success).toBe(true)
    const verified = await getUser(user.email)
    expect(verified.isEmailVerified).toBe(true)
    expect(verified.emailVerificationToken).toBe("")
    expect(verified.emailVerificationAttempts).toBe(0)
  })

  it("still accepts the link flow (token only, no email)", async () => {
    await register().expect(201)
    const user = await getUser("test@example.com")

    const res = await request(app)
      .post("/api/v1/user/verify-email")
      .send({ token: user.emailVerificationToken })
      .expect(200)
    expect(res.body.data.isEmailVerified).toBe(true)
  })

  it("rejects a missing code with 400", async () => {
    await register().expect(201)
    const res = await request(app)
      .post("/api/v1/user/verify-email")
      .send({ email: "test@example.com" })
      .expect(400)
    expect(res.body.message).toMatch(/token|code/i)
  })

  it("rejects a code submitted without an email with 400 (attempt tracking needs the account)", async () => {
    await register().expect(201)
    const user = await getUser("test@example.com")

    await request(app)
      .post("/api/v1/user/verify-email")
      .send({ code: user.emailVerificationToken })
      .expect(400)

    // The code must still work when submitted properly.
    await request(app)
      .post("/api/v1/user/verify-email")
      .send({ email: "test@example.com", code: user.emailVerificationToken })
      .expect(200)
  })

  it("rejects an unknown email with 400", async () => {
    await request(app)
      .post("/api/v1/user/verify-email")
      .send({ email: "ghost@example.com", code: "123456" })
      .expect(400)
  })

  it("rejects an expired code with 400", async () => {
    await register().expect(201)
    const user = await getUser("test@example.com")
    user.emailVerificationTokenExpiry = new Date(Date.now() - 1000)
    await user.save({ validateBeforeSave: false })

    const res = await request(app)
      .post("/api/v1/user/verify-email")
      .send({ email: user.email, code: user.emailVerificationToken })
      .expect(400)
    expect(res.body.message).toMatch(/expired/i)
  })

  it("locks out with 429 after 5 failed attempts — even the CORRECT code is then rejected", async () => {
    await register().expect(201)
    const user = await getUser("test@example.com")
    const correctCode = user.emailVerificationToken

    for (let i = 0; i < 4; i++) {
      await request(app)
        .post("/api/v1/user/verify-email")
        .send({ email: user.email, code: "000000" })
        .expect(400)
    }

    // 5th failure trips the lockout with 429 (not 400/401)...
    await request(app)
      .post("/api/v1/user/verify-email")
      .send({ email: user.email, code: "111111" })
      .expect(429)

    const locked = await getUser("test@example.com")
    expect(locked.emailVerificationAttempts).toBe(5)
    expect(locked.isEmailVerified).toBe(false)

    // ...and the 6th attempt — with the CORRECT code — is still 429. This
    // proves the OTP was actually invalidated by lockout, not merely
    // rate-limited per-request.
    const res = await request(app)
      .post("/api/v1/user/verify-email")
      .send({ email: user.email, code: correctCode })
      .expect(429)
    expect(res.body.message).toMatch(/too many attempts/i)

    // A fresh resend resets the lockout and a correct code verifies again.
    const stale = await getUser("test@example.com")
    stale.verificationLastIssuedAt = new Date(Date.now() - 61_000)
    await stale.save({ validateBeforeSave: false })
    await request(app)
      .post("/api/v1/user/resend-verification-code")
      .send({ email: user.email })
      .expect(200)
    const refreshed = await getUser("test@example.com")
    expect(refreshed.emailVerificationAttempts).toBe(0)
    await request(app)
      .post("/api/v1/user/verify-email")
      .send({ email: user.email, code: refreshed.emailVerificationToken })
      .expect(200)
  })

  it("counts attempts per-email, not per-IP (another account is unaffected)", async () => {
    await register().expect(201)
    await register({ email: "other@example.com", username: "otheruser" }).expect(201)

    for (let i = 0; i < 3; i++) {
      await request(app)
        .post("/api/v1/user/verify-email")
        .send({ email: "test@example.com", code: "000000" })
        .expect(400)
    }

    const other = await getUser("other@example.com")
    await request(app)
      .post("/api/v1/user/verify-email")
      .send({ email: other.email, code: other.emailVerificationToken })
      .expect(200)
  })
})

describe("POST /api/v1/user/resend-verification-code (pre-login resend)", () => {
  it("issues a fresh code that resets the attempt counter", async () => {
    await register().expect(201)
    const user = await getUser("test@example.com")
    const oldToken = user.emailVerificationToken

    // Burn some attempts against the old code.
    await request(app).post("/api/v1/user/verify-email").send({ email: user.email, code: "000000" }).expect(400)
    await request(app).post("/api/v1/user/verify-email").send({ email: user.email, code: "000000" }).expect(400)

    // Cooldown (60s since registration) → backdate to simulate elapsed time.
    user.verificationLastIssuedAt = new Date(Date.now() - 61_000)
    user.verificationResendWindowStart = new Date(Date.now() - 61_000)
    await user.save({ validateBeforeSave: false })

    await request(app)
      .post("/api/v1/user/resend-verification-code")
      .send({ email: user.email })
      .expect(200)

    const refreshed = await getUser(user.email)
    expect(refreshed.emailVerificationToken).toMatch(/^\d{6}$/)
    expect(refreshed.emailVerificationToken).not.toBe(oldToken)
    expect(refreshed.emailVerificationAttempts).toBe(0)

    // The fresh code verifies successfully.
    await request(app)
      .post("/api/v1/user/verify-email")
      .send({ email: user.email, code: refreshed.emailVerificationToken })
      .expect(200)
  })

  it("enforces the 60s cooldown with 429", async () => {
    await register().expect(201)
    const res = await request(app)
      .post("/api/v1/user/resend-verification-code")
      .send({ email: "test@example.com" })
      .expect(429)
    expect(res.body.message).toMatch(/wait/i)
  })

  it("caps total resends at 5 per 15 minutes with 429", async () => {
    await register().expect(201)
    const email = "test@example.com"

    for (let i = 0; i < 5; i++) {
      // Slide the window forward past the cooldown for each resend.
      const user = await getUser(email)
      user.verificationLastIssuedAt = new Date(Date.now() - 61_000)
      user.verificationResendWindowStart = new Date(Date.now() - 10 * 60_000)
      await user.save({ validateBeforeSave: false })

      await request(app)
        .post("/api/v1/user/resend-verification-code")
        .send({ email })
        .expect(200)
    }

    // Backdate ONLY the issuance time (the counter keeps its value) so the
    // request reaches the cap check instead of tripping the 60s cooldown.
    const capped = await getUser(email)
    capped.verificationLastIssuedAt = new Date(Date.now() - 61_000)
    await capped.save({ validateBeforeSave: false })

    const res = await request(app)
      .post("/api/v1/user/resend-verification-code")
      .send({ email })
      .expect(429)
    expect(res.body.message).toMatch(/too many codes/i)

    // The code that was valid before the cap still verifies.
    const user = await getUser(email)
    await request(app)
      .post("/api/v1/user/verify-email")
      .send({ email, code: user.emailVerificationToken })
      .expect(200)
  })

  it("returns a generic 200 for unknown emails (no account enumeration)", async () => {
    const res = await request(app)
      .post("/api/v1/user/resend-verification-code")
      .send({ email: "nobody-whatsoever@example.com" })
      .expect(200)
    expect(res.body.message).toMatch(/if that email/i)
  })

  it("returns a generic 200 for already-verified emails", async () => {
    const { user } = await registerAndLogin()
    await User.findByIdAndUpdate(user._id, { isEmailVerified: true })

    const res = await request(app)
      .post("/api/v1/user/resend-verification-code")
      .send({ email: user.email })
      .expect(200)
    expect(res.body.message).toMatch(/if that email/i)
  })

  it("rejects a malformed email with 400", async () => {
    await request(app)
      .post("/api/v1/user/resend-verification-code")
      .send({ email: "not-an-email" })
      .expect(400)
  })
})

describe("requireVerifiedEmail gating", () => {
  it("blocks video upload for an unverified user with 403", async () => {
    await register().expect(201)
    const login = await request(app)
      .post("/api/v1/user/login")
      .send({ email: "test@example.com", password: "password123" })
      .expect(200)
    const accessCookie = login.headers["set-cookie"].find((c) => c.startsWith("accessToken="))

    const res = await createVideo(accessCookie).expect(403)
    expect(res.body.message).toMatch(/verify your email/i)
    expect(res.body.code).toBe("EMAIL_NOT_VERIFIED")
  })

  it("allows video upload once verified (no re-login required)", async () => {
    await register().expect(201)
    const login = await request(app)
      .post("/api/v1/user/login")
      .send({ email: "test@example.com", password: "password123" })
      .expect(200)
    const accessCookie = login.headers["set-cookie"].find((c) => c.startsWith("accessToken="))

    const user = await getUser("test@example.com")
    await request(app)
      .post("/api/v1/user/verify-email")
      .send({ email: user.email, code: user.emailVerificationToken })
      .expect(200)

    await createVideo(accessCookie).expect(201)
  })

  it("blocks comments and posts for an unverified user with 403", async () => {
    // Verified uploader creates a video to comment on / a tweet target.
    const { accessCookie } = await registerAndLogin({ email: "author@example.com", username: "author" })
    const video = await createVideo(accessCookie).expect(201)
    const videoId = video.body.data._id

    // Unverified commenter.
    await register({ email: "commenter@example.com", username: "commenter" }).expect(201)
    const login = await request(app)
      .post("/api/v1/user/login")
      .send({ email: "commenter@example.com", password: "password123" })
      .expect(200)
    const commenterCookie = login.headers["set-cookie"].find((c) => c.startsWith("accessToken="))

    const comment = await request(app)
      .post(`/api/v1/comments/${videoId}`)
      .set("Cookie", commenterCookie)
      .send({ content: "nice video" })
      .expect(403)
    expect(comment.body.message).toMatch(/verify your email/i)
    expect(comment.body.code).toBe("EMAIL_NOT_VERIFIED")

    const tweet = await request(app)
      .post("/api/v1/tweets")
      .set("Cookie", commenterCookie)
      .send({ content: "hello world" })
      .expect(403)
    expect(tweet.body.message).toMatch(/verify your email/i)
  })

  it("leaves playlist creation open for unverified users (deliberate: private, no public spam surface)", async () => {
    await register().expect(201)
    const login = await request(app)
      .post("/api/v1/user/login")
      .send({ email: "test@example.com", password: "password123" })
      .expect(200)
    const accessCookie = login.headers["set-cookie"].find((c) => c.startsWith("accessToken="))

    await request(app)
      .post("/api/v1/playlists")
      .set("Cookie", accessCookie)
      .send({ name: "Watch later", description: "private list" })
      .expect(201)
  })
})

describe("POST /api/v1/user/resend-verification (logged-in banner resend)", () => {
  it("issues a fresh code for an unverified user", async () => {
    await register().expect(201)
    const login = await request(app)
      .post("/api/v1/user/login")
      .send({ email: "test@example.com", password: "password123" })
      .expect(200)
    const accessCookie = login.headers["set-cookie"].find((c) => c.startsWith("accessToken="))
    const oldToken = (await getUser("test@example.com")).emailVerificationToken

    const user = await getUser("test@example.com")
    user.verificationLastIssuedAt = new Date(Date.now() - 61_000)
    user.verificationResendWindowStart = new Date(Date.now() - 61_000)
    await user.save({ validateBeforeSave: false })

    const res = await request(app)
      .post("/api/v1/user/resend-verification")
      .set("Cookie", accessCookie)
      .expect(200)

    const refreshed = await getUser("test@example.com")
    expect(refreshed.emailVerificationToken).not.toBe(oldToken)
    expect(res.body.success).toBe(true)
  })

  it("rejects an already-verified user with 400", async () => {
    const { accessCookie } = await registerAndLogin({ email: "already@example.com" })
    const user = await getUser("already@example.com")
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

describe("password reset flows (unchanged, smoke coverage)", () => {
  // ── Regression guards for the forgot-password mail pattern ─────────────
  // The reset token is persisted synchronously and the mail send runs in the
  // BACKGROUND (same pattern as registration's OTP). These tests force the
  // Resend path with a fetch stub that never resolves until released: if the
  // handler ever starts awaiting the provider again, the response never
  // arrives and these fail by timeout.
  async function withHungResend(testFn) {
    const envVars = ["RESEND_API_KEY", "EMAILJS_SERVICE_ID", "EMAILJS_TEMPLATE_ID", "EMAILJS_PUBLIC_KEY", "EMAILJS_PRIVATE_KEY", "SMTP_HOST", "SMTP_USER", "SMTP_PASS"]
    const savedEnv = Object.fromEntries(envVars.map((k) => [k, process.env[k]]))
    for (const k of envVars) delete process.env[k]
    process.env.RESEND_API_KEY = "re_test_key"

    const originalFetch = globalThis.fetch
    let releaseSend
    const gate = new Promise((resolve) => { releaseSend = resolve })
    globalThis.fetch = vi.fn(() => gate)
    try {
      await testFn()
    } finally {
      releaseSend()
      globalThis.fetch = originalFetch
      for (const k of envVars) {
        if (savedEnv[k] === undefined) delete process.env[k]
        else process.env[k] = savedEnv[k]
      }
    }
  }

  it("responds 200 without waiting for the mail provider (background send)", async () => {
    await withHungResend(async () => {
      await register().expect(201)
      const res = await request(app)
        .post("/api/v1/user/forgot-password")
        .send({ email: "test@example.com" })
        .expect(200)
      expect(res.body.message).toMatch(/reset link/i)
    })
  })

  it("persists the reset token before the 200 (state race guard)", async () => {
    await withHungResend(async () => {
      await register().expect(201)
      await request(app)
        .post("/api/v1/user/forgot-password")
        .send({ email: "test@example.com" })
        .expect(200)
      // Read straight after the response while the provider is still hung —
      // proves the token was persisted before the response, not after.
      const user = await getUser("test@example.com")
      expect(user.passwordResetToken).toBeTruthy()
      expect(user.passwordResetTokenExpiry).toBeTruthy()
    })
  })

  it("forgot-password responds generically and creates a token", async () => {
    await register().expect(201)
    const res = await request(app)
      .post("/api/v1/user/forgot-password")
      .send({ email: "test@example.com" })
      .expect(200)

    expect(res.body.message).toMatch(/reset link/i)
    const user = await getUser("test@example.com")
    expect(user.passwordResetToken).toBeTruthy()
  })

  it("forgot-password does not reveal unknown emails", async () => {
    const res = await request(app)
      .post("/api/v1/user/forgot-password")
      .send({ email: "nobody@example.com" })
      .expect(200)
    expect(res.body.message).toMatch(/if that email is registered/i)
  })

  it("resets the password with a valid token and revokes sessions", async () => {
    const { user } = await registerAndLogin()
    await request(app)
      .post("/api/v1/user/forgot-password")
      .send({ email: user.email })
      .expect(200)

    const withToken = await User.findById(user._id)
    await request(app)
      .post("/api/v1/user/reset-password")
      .send({ token: withToken.passwordResetToken, newPassword: "newpassword123" })
      .expect(200)

    await request(app)
      .post("/api/v1/user/login")
      .send({ email: user.email, password: "newpassword123" })
      .expect(200)
    await request(app)
      .post("/api/v1/user/login")
      .send({ email: user.email, password: "password123" })
      .expect(401)
  })
})

describe("email provider switch (emailSender.js)", () => {
  const providerVars = ["RESEND_API_KEY", "EMAILJS_SERVICE_ID", "EMAILJS_TEMPLATE_ID", "EMAILJS_PUBLIC_KEY", "EMAILJS_PRIVATE_KEY", "SMTP_HOST", "SMTP_USER", "SMTP_PASS"]
  let savedEnv

  beforeEach(() => {
    savedEnv = Object.fromEntries(providerVars.map((k) => [k, process.env[k]]))
    for (const k of providerVars) delete process.env[k]
  })

  afterEach(() => {
    for (const k of providerVars) {
      if (savedEnv[k] === undefined) delete process.env[k]
      else process.env[k] = savedEnv[k]
    }
  })

  it("falls back to console logging when no provider is configured", async () => {
    const esm = await import("../src/utils/emailSender.js")
    expect(esm.isEmailDeliveryConfigured()).toBe(false)
    // Resolves (logs) rather than throwing — signup must not fail on mail.
    await expect(esm.sendMail({ to: "x@y.com", subject: "s", text: "t" })).resolves.toBeUndefined()
  })

  it("prefers Resend when RESEND_API_KEY is set", async () => {
    const calls = []
    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url, init })
      return { ok: true, status: 200 }
    })
    process.env.RESEND_API_KEY = "re_test_key"
    try {
      const esm = await import("../src/utils/emailSender.js")
      expect(esm.isEmailDeliveryConfigured()).toBe(true)
      await esm.sendMail({ to: "a@b.com", subject: "Hi", text: "t", html: "<p>t</p>" })
      expect(calls).toHaveLength(1)
      expect(calls[0].url).toBe("https://api.resend.com/emails")
      expect(calls[0].init.headers.Authorization).toBe("Bearer re_test_key")
      const body = JSON.parse(calls[0].init.body)
      expect(body.from).toBe("onboarding@resend.dev")
      expect(body.to).toBe("a@b.com")
      expect(body.subject).toBe("Hi")
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("uses EmailJS REST when EMAILJS_* is set and Resend is not", async () => {
    const calls = []
    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url, init })
      return { ok: true, status: 200 }
    })
    process.env.EMAILJS_SERVICE_ID = "svc"
    process.env.EMAILJS_TEMPLATE_ID = "tpl"
    process.env.EMAILJS_PUBLIC_KEY = "pub"
    process.env.EMAILJS_PRIVATE_KEY = "priv"
    try {
      const esm = await import("../src/utils/emailSender.js")
      await esm.sendMail({ to: "a@b.com", subject: "Hi", text: "t" })
      expect(calls[0].url).toBe("https://api.emailjs.com/api/v1.0/email/send")
      const body = JSON.parse(calls[0].init.body)
      expect(body.accessToken).toBe("priv")
      expect(body.template_params.to_email).toBe("a@b.com")
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("counts SMTP as configured (nodemailer path, no REST call needed)", async () => {
    process.env.SMTP_HOST = "smtp.test"
    process.env.SMTP_USER = "u"
    process.env.SMTP_PASS = "p"
    const esm = await import("../src/utils/emailSender.js")
    expect(esm.isEmailDeliveryConfigured()).toBe(true)
  })

  it("Resend wins over EmailJS when both are configured (priority order)", async () => {
    const calls = []
    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn(async (url) => {
      calls.push(url)
      return { ok: true, status: 200 }
    })
    process.env.RESEND_API_KEY = "re_x"
    process.env.EMAILJS_SERVICE_ID = "svc"
    process.env.EMAILJS_TEMPLATE_ID = "tpl"
    process.env.EMAILJS_PUBLIC_KEY = "pub"
    process.env.EMAILJS_PRIVATE_KEY = "priv"
    try {
      const esm = await import("../src/utils/emailSender.js")
      await esm.sendMail({ to: "a@b.com", subject: "Hi", text: "t" })
      expect(calls).toEqual(["https://api.resend.com/emails"])
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
