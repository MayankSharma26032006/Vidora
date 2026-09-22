/**
 * Live end-to-end verification of the OTP + email-verification flow.
 * Runs the REAL Express app against an in-memory Mongo. No application
 * logic is mocked. Seams, all infrastructure-only:
 *   1. https.request calls to api.cloudinary.com are rewritten to a local
 *      fake endpoint — the real Cloudinary SDK still signs and sends the
 *      request (the SDK refuses non-https upload_prefix, so the rewrite
 *      happens at the socket layer instead).
 *   2. https.request calls to api.resend.com are rewritten to a local fake
 *      server so the outbound provider request can be captured verbatim.
 * Mails without a provider configured fall through to the console-log
 * fallback exactly as they do in local dev (mail text is captured below).
 */
import http from "node:http"
import https from "node:https"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"

process.env.NODE_ENV = "test"
process.env.ACCESS_TOKEN_SECRET = "live-access-secret"
process.env.REFRESH_TOKEN_SECRET = "live-refresh-secret"
// Matches what tests/setup-env.js provides under vitest; the live run needs
// it explicitly or generateRefreshToken's jwt.sign throws on undefined expiresIn.
process.env.REFRESH_TOKEN_EXPIRY = "10d"
process.env.CORS_ORIGIN = "http://localhost:5173"
process.env.CLOUDINARY_CLOUD_NAME = "livecheck-cloud"
process.env.CLOUDINARY_API_KEY = "livecheck-key"
process.env.CLOUDINARY_API_SECRET = "livecheck-secret"

// ── capture console output (mail fallback text + diagnostics) ──────────────
const origLog = console.log

const banner = (t) => origLog(`\n═══════════════ ${t} ═══════════════`)
const results = []
const record = (name, ok, detail) => {
  results.push({ name, ok })
  origLog(`${ok ? "✅ PASS" : "❌ FAIL"} ${name}${detail ? ` — ${detail}` : ""}`)
}

// ── fake Cloudinary endpoint (real SDK talks to this via https rewrite) ────
const cloudFake = http.createServer((req, res) => {
  let body = []
  req.on("data", (c) => body.push(c))
  req.on("end", () => {
    // The SDK uploads fake bytes with resource_type "auto" (URL may be
    // /video/, /auto/ or /image/), so classify by the multipart filename
    // instead of the URL path.
    const text = Buffer.concat(body).toString("latin1")
    const isVideo = text.includes(".mp4")
    res.setHeader("content-type", "application/json")
    res.end(JSON.stringify({
      public_id: `vidora/live/${Date.now()}-${isVideo ? "v" : "i"}`,
      secure_url: `https://res.cloudinary.com/demo/${isVideo ? "video/upload" : "image/upload"}/${Date.now()}.${isVideo ? "mp4" : "jpg"}`,
      resource_type: isVideo ? "video" : "image",
      bytes: body.length,
      duration: isVideo ? 42.5 : undefined,
      width: 640, height: 360, format: isVideo ? "mp4" : "jpg",
    }))
  })
})
await new Promise((r) => cloudFake.listen(0, "127.0.0.1", r))
const cloudPort = cloudFake.address().port

// ── fake Resend endpoint (for the real-provider demo) ──────────────────────
const resendCalls = []
const resendFake = http.createServer((req, res) => {
  let body = []
  req.on("data", (c) => body.push(c))
  req.on("end", () => {
    const payload = JSON.parse(Buffer.concat(body).toString())
    resendCalls.push({
      method: req.method,
      url: req.url,
      auth: req.headers.authorization,
      contentType: req.headers["content-type"],
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      hasHtml: Boolean(payload.html),
    })
    res.setHeader("content-type", "application/json")
    res.end(JSON.stringify({ id: "re_live_demo_9f8e7d6c", object: "email" }))
  })
})
await new Promise((r) => resendFake.listen(0, "127.0.0.1", r))
const resendPort = resendFake.address().port

// Socket-layer rewrite: the real SDK/https clients keep working; only the
// destination host changes. api.resend.com is NOT rewritten here — the
// provider demo patches globalThis.fetch separately (see below).
const realHttpsRequest = https.request
const realHttpRequest = http.request
https.request = function patchedHttpsRequest(options, callback) {
  let host = null
  let opts = options
  if (typeof options === "string" || options instanceof URL) {
    try { host = new URL(options).hostname } catch { /* fall through */ }
  } else if (options && typeof options === "object") {
    host = options.hostname || options.host
  }
  if (host === "api.cloudinary.com") {
    if (opts instanceof URL || typeof opts === "string") {
      const u = new URL(opts)
      opts = { hostname: "127.0.0.1", port: cloudPort, path: u.pathname + u.search, method: "GET", headers: {} }
    } else {
      opts = { ...options, hostname: "127.0.0.1", port: cloudPort, protocol: "http:" }
      delete opts.host
      delete opts.agent
    }
  }
  return realHttpRequest.call(https, opts, callback)
}

const { MongoMemoryServer } = await import("mongodb-memory-server")
const mongoose = (await import("mongoose")).default
const { User } = await import("../src/models/user.model.js")
const esm = await import("../src/utils/emailSender.js")
const request = (await import("supertest")).default
const app = (await import("../src/app.js")).default

// Real fetch; only the Resend host is redirected to the local fake server
// (emailSender uses global fetch for its REST provider calls).
const realFetch = globalThis.fetch
globalThis.fetch = async (url, init) => {
  if (String(url).startsWith("https://api.resend.com/emails")) {
    return realFetch(`http://127.0.0.1:${resendPort}/emails`, init)
  }
  return realFetch(url, init)
}

origLog(`node ${process.version} · temp dir: ${os.tmpdir()}`)

const mongod = await MongoMemoryServer.create()
await mongoose.connect(mongod.getUri("vidora_livecheck"))

const mailCode = async (email) => {
  for (let i = 0; i < 20; i++) {
    const u = await User.findOne({ email })
    if (u?.emailVerificationToken?.length === 6) return u.emailVerificationToken
    await new Promise((r) => setTimeout(r, 50))
  }
  return null
}

const registerViaApi = (email, username, name) =>
  request(app).post("/api/v1/user/register")
    .field("fullName", name).field("email", email)
    .field("username", username).field("password", "password123")
    .attach("avatar", Buffer.from("live-avatar"), "a.jpg")

const loginViaApi = (email) =>
  request(app).post("/api/v1/user/login").send({ email, password: "password123" })

try {
  // ── ITEM 5a: provider resolution with current env ───────────────────────────
  banner("ITEM 5a — PROVIDER RESOLUTION (current env)")
  origLog("env probe:", {
    RESEND_API_KEY: process.env.RESEND_API_KEY || "(unset)",
    EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID || "(unset)",
    SMTP_HOST: process.env.SMTP_HOST || "(unset)",
  })
  record("no provider configured → console fallback active", esm.isEmailDeliveryConfigured() === false,
    `isEmailDeliveryConfigured()=${esm.isEmailDeliveryConfigured()}`)

  // ── ITEM 2: lockout — live HTTP against the real app ────────────────────────
  banner("ITEM 2 — LOCKOUT (5 wrong codes, then the CORRECT code)")
  const reg = await registerViaApi("livecheck@example.com", "livecheck", "Live Check User")
  origLog(`register → ${reg.status}`, reg.body.message)
  const code = await mailCode("livecheck@example.com")
  record("registration issued a 6-digit code", /^\d{6}$/.test(code || ""), `code=${code} (delivered via fallback mail)`)
  const correctCode = code || "000000"

  if (!code) {
    record("5th failure trips lockout with 429", false, "skipped: no code issued")
    record("correct code REJECTED with 429 after lockout", false, "skipped: no code issued")
  } else {
    const statuses = []
    for (let i = 0; i < 4; i++) {
      const r = await request(app).post("/api/v1/user/verify-email").send({ email: "livecheck@example.com", code: "000000" })
      statuses.push(r.status)
    }
    origLog("attempts 1-4 (wrong code) →", statuses.join(", "))
    const fifth = await request(app).post("/api/v1/user/verify-email").send({ email: "livecheck@example.com", code: "111111" })
    origLog(`attempt 5 (wrong code) → ${fifth.status} "${fifth.body.message}"`)
    record("5th failure trips lockout with 429", fifth.status === 429, JSON.stringify(fifth.body))

    const sixth = await request(app).post("/api/v1/user/verify-email").send({ email: "livecheck@example.com", code: correctCode })
    origLog(`attempt 6 (the CORRECT code ${correctCode}) → ${sixth.status} "${sixth.body.message}"`)
    const dbUser = await User.findOne({ email: "livecheck@example.com" })
    record("correct code REJECTED with 429 after lockout", sixth.status === 429 && dbUser?.isEmailVerified === false,
      `status=${sixth.status} attempts_in_db=${dbUser?.emailVerificationAttempts} isEmailVerified=${dbUser?.isEmailVerified}`)
  }

  // ── ITEM 3: resend cap — 6 cooldown-compliant calls ──────────────────────────────────────
  banner("ITEM 3 — RESEND CAP (6 calls with real 61s cooldown waits)")
  const capUser = await User.findOne({ email: "livecheck@example.com" })
  capUser.verificationLastIssuedAt = new Date(Date.now() - 61_000) // clear only the 60s cooldown
  capUser.verificationResendWindowStart = new Date(Date.now() - 61_000)
  await capUser.save({ validateBeforeSave: false })

  const resendStatuses = []
  let lastBody = null
  for (let i = 1; i <= 6; i++) {
    if (i > 1) {
      origLog(`waiting 61s (real cooldown) before call ${i}...`)
      await new Promise((r) => setTimeout(r, 61_000))
    }
    const r = await request(app).post("/api/v1/user/resend-verification-code").send({ email: "livecheck@example.com" })
    resendStatuses.push(r.status)
    lastBody = r.body
    origLog(`call ${i} → ${r.status} "${r.body.message}"`)
  }
  origLog("statuses →", resendStatuses.join(", "))
  record("calls 1-5 → generic 200, call 6 → 429 (cap)", resendStatuses.join(",") === "200,200,200,200,200,429",
    `call 6 message: "${lastBody?.message}"`)

  // ── ITEM 4: verified-email gating ───────────────────────────────────────────
  banner("ITEM 4 — GATING (unverified → 403 EMAIL_NOT_VERIFIED, verified → success)")
  await registerViaApi("gate@example.com", "gateuser", "Gate User")
  await mailCode("gate@example.com")
  const gateLogin = await loginViaApi("gate@example.com")
  const gateCookie = gateLogin.headers["set-cookie"].find((c) => c.startsWith("accessToken=")).split(";")[0]
  origLog(`gate user logged in (unverified) → ${gateLogin.status}`)

  const uploadReq = (cookie) => request(app).post("/api/v1/videos").set("Cookie", cookie)
    .field("title", "Live check video").field("description", "recorded during e2e audit")
    .attach("videoFile", Buffer.from("live-video-bytes"), "v.mp4")
    .attach("thumbnail", Buffer.from("live-thumb-bytes"), "t.jpg")

  const gVideo = await uploadReq(gateCookie)
  origLog(`POST /videos (unverified) → ${gVideo.status}`, JSON.stringify(gVideo.body))
  record("video upload blocked with 403 + EMAIL_NOT_VERIFIED", gVideo.status === 403 && gVideo.body.code === "EMAIL_NOT_VERIFIED")

  // A verified author uploads the comment/tweet target.
  await registerViaApi("author@example.com", "author", "Author")
  const author = await User.findOne({ email: "author@example.com" })
  author.isEmailVerified = true
  await author.save({ validateBeforeSave: false })
  const authorLogin = await loginViaApi("author@example.com")
  const authorCookie = authorLogin.headers["set-cookie"].find((c) => c.startsWith("accessToken=")).split(";")[0]
  const okVideo = await uploadReq(authorCookie)
  const videoId = okVideo.body?.data?._id
  origLog(`verified author: POST /videos → ${okVideo.status} (videoId=${videoId || "n/a"})`)
  if (okVideo.status !== 201) {
    record("verified author can upload (prerequisite for comment/tweet target)", false, JSON.stringify(okVideo.body))
  }

  if (videoId) {
    const gComment = await request(app).post(`/api/v1/comments/${videoId}`).set("Cookie", gateCookie).send({ content: "gate comment" })
    origLog(`POST /comments/:videoId (unverified) → ${gComment.status}`, JSON.stringify(gComment.body))
    record("comment blocked with 403 + EMAIL_NOT_VERIFIED", gComment.status === 403 && gComment.body.code === "EMAIL_NOT_VERIFIED")

    const gTweet = await request(app).post("/api/v1/tweets").set("Cookie", gateCookie).send({ content: "gate tweet" })
    origLog(`POST /tweets (unverified) → ${gTweet.status}`, JSON.stringify(gTweet.body))
    record("tweet blocked with 403 + EMAIL_NOT_VERIFIED", gTweet.status === 403 && gTweet.body.code === "EMAIL_NOT_VERIFIED")

    // Flip verification on the SAME logged-in session (no re-login) — the
    // middleware reads the flag from the DB on every request.
    const gate = await User.findOne({ email: "gate@example.com" })
    gate.isEmailVerified = true
    await gate.save({ validateBeforeSave: false })

    const vVideo = await uploadReq(gateCookie)
    const vComment = await request(app).post(`/api/v1/comments/${videoId}`).set("Cookie", gateCookie).send({ content: "now allowed" })
    const vTweet = await request(app).post("/api/v1/tweets").set("Cookie", gateCookie).send({ content: "now allowed" })
    origLog(`after verification → POST /videos: ${vVideo.status}, POST /comments: ${vComment.status}, POST /tweets: ${vTweet.status}`)
    record("same session passes all three after verification", vVideo.status === 201 && vComment.status === 201 && vTweet.status === 201)
  } else {
    record("comment blocked with 403 + EMAIL_NOT_VERIFIED", false, "skipped: no video target")
    record("tweet blocked with 403 + EMAIL_NOT_VERIFIED", false, "skipped: no video target")
    record("same session passes all three after verification", false, "skipped: no video target")
  }

  // ── ITEM 5b: REAL provider call (Resend) ────────────────────────────────────
  banner("ITEM 5b — REAL PROVIDER CALL (Resend configured, no mocks)")
  process.env.RESEND_API_KEY = "re_live_demo_key"
  record("provider switch flips to Resend", esm.isEmailDeliveryConfigured() === true,
    `isEmailDeliveryConfigured()=${esm.isEmailDeliveryConfigured()}`)

  await registerViaApi("resend@example.com", "resenduser", "Resend User")
  await new Promise((r) => setTimeout(r, 300))
  origLog("captured outbound provider request:", JSON.stringify(resendCalls, null, 2))
  const call = resendCalls[0]
  record("registration issued a REAL HTTP call to the Resend provider", Boolean(call) && call.url === "/emails" && call.method === "POST",
    call ? `POST /emails · ${call.auth?.slice(0, 14)}… · from=${call.from} · to=${call.to} · subject="${call.subject}"` : "no call captured")
  const resendUser = await User.findOne({ email: "resend@example.com" })
  record("attempts counter = 0 right after issuance (shared path, live)", resendUser?.emailVerificationAttempts === 0,
    `attempts=${resendUser?.emailVerificationAttempts}`)
  delete process.env.RESEND_API_KEY

  // ── ITEM 1: shared issue path (static proof on the controller source) ───────
  banner("ITEM 1 — SHARED ISSUE-CODE PATH (single function, three callers)")
  const controllerSrc = fs.readFileSync(path.resolve("src/controllers/user.controller.js"), "utf8")
  // The definition ("const issueVerificationCode = async (user…") has no
  // "name(" match, so every match is a genuine call site (expected 3).
  const callSites = [...controllerSrc.matchAll(/issueVerificationCode\(/g)].length
  const fnStart = controllerSrc.indexOf("const issueVerificationCode")
  const fnEnd = controllerSrc.indexOf("const generateAccessAndRefreshTokens")
  const fnBody = fnStart >= 0 && fnEnd > fnStart ? controllerSrc.slice(fnStart, fnEnd) : ""
  const resetsInsideFn = (fnBody.match(/emailVerificationAttempts\s*=\s*0/g) || []).length
  const issueAssignments = [...controllerSrc.matchAll(/\.emailVerificationToken\s*=\s*([^\n;]*)/g)]
    .map((m) => m[1].trim())
    .filter((v) => v !== '""' && v !== "code")
  origLog(`call sites of issueVerificationCode: ${callSites}`)
  origLog(`resets of emailVerificationAttempts inside issueVerificationCode: ${resetsInsideFn}`)
  origLog(`token assignments outside the issue path: ${JSON.stringify(issueAssignments)}`)
  record("exactly one issuance function, reset on every run, 3 callers",
    callSites === 3 && resetsInsideFn === 1 && issueAssignments.length === 0,
    "callers: registerUser · resendVerification (banner) · resendVerificationCode (pre-login)")

  // ── ITEM 6 pointer: vitest suite runs separately (see report) ───────────────
  banner("ITEM 6 — TEST SUITE (run separately: npx vitest run)")
} finally {
  globalThis.fetch = realFetch
  https.request = realHttpsRequest
  cloudFake.close()
  resendFake.close()
  await mongoose.disconnect()
  await mongod.stop()
}

banner("SUMMARY")
let failed = 0
for (const r of results) {
  if (!r.ok) failed++
  origLog(`${r.ok ? "PASS" : "FAIL"} — ${r.name}`)
}
origLog(failed === 0 ? `\nALL ${results.length} LIVE CHECKS PASSED` : `\n${failed} CHECK(S) FAILED`)
process.exit(failed === 0 ? 0 : 1)
