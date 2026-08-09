import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest"
import request from "supertest"
import { cloudinaryMockFactory } from "./mocks.js"
import { connectTestDb, resetTestDb, disconnectTestDb } from "./bootstrap.js"



vi.mock("../src/utils/cloudinary.js", () => cloudinaryMockFactory())


import app from "../src/app.js"
import { register, registerAndLogin, cookieFrom } from "./helpers.js"

beforeAll(connectTestDb)
beforeEach(resetTestDb)
afterAll(disconnectTestDb)






describe("POST /api/v1/user/register", () => {
  it("registers a user and returns it without password/refreshToken", async () => {
    const res = await register().expect(201)

    expect(res.body.success).toBe(true)
    expect(res.body.data.username).toBe("testuser")
    expect(res.body.data.email).toBe("test@example.com")
    expect(res.body.data.fullname).toBe("Test User") 
    expect(res.body.data.password).toBeUndefined()
    expect(res.body.data.refreshToken).toBeUndefined()
  })

  it("uploads the register avatar into the avatars folder", async () => {
    const { uploadOnCloudinary } = await import("../src/utils/cloudinary.js")
    uploadOnCloudinary.mockClear()
    await register({ username: "folderuser", email: "folder@example.com" }).expect(201)

    expect(uploadOnCloudinary).toHaveBeenCalledWith(expect.any(String), "vidora/avatars")
  })

  it("rejects a duplicate email or username with 409", async () => {
    await register().expect(201)
    const res = await register().expect(409)
    expect(res.body.message).toBe("User already exists")
  })

  it("rejects a malformed email with 400", async () => {
    const res = await register({ email: "not-an-email" }).expect(400)
    expect(res.body.message).toBe("Invalid email format")
    await register({ email: "missing@tld" }).expect(400)
    await register({ email: "@nodomain.com" }).expect(400)
  })

  it("rejects missing required fields with 400", async () => {
    const res = await register({ password: "" }).expect(400)
    expect(res.body.success).toBe(false)
  })

  it("rejects registration without an avatar file with 400", async () => {
    const res = await request(app)
      .post("/api/v1/user/register")
      .field("fullName", "No Avatar")
      .field("email", "noavatar@example.com")
      .field("username", "noavatar")
      .field("password", "password123")
      .expect(400)
    expect(res.body.message).toBe("Avatar is required")
  })
})





describe("POST /api/v1/user/login", () => {
  it("logs in with email and sets auth cookies", async () => {
    await register().expect(201)
    const res = await request(app)
      .post("/api/v1/user/login")
      .send({ email: "test@example.com", password: "password123" })
      .expect(200)

    expect(res.body.data.accessToken).toBeTruthy()
    expect(res.body.data.refreshToken).toBeTruthy()
    expect(cookieFrom(res, "accessToken")).toBeTruthy()
    expect(cookieFrom(res, "refreshToken")).toBeTruthy()
    expect(res.body.data.user.username).toBe("testuser")
  })

  it("logs in with username instead of email", async () => {
    await register().expect(201)
    const res = await request(app)
      .post("/api/v1/user/login")
      .send({ username: "testuser", password: "password123" })
      .expect(200)
    expect(res.body.success).toBe(true)
  })

  it("logs in regardless of email/username case and surrounding spaces", async () => {
    await register().expect(201)
    
    const res = await request(app)
      .post("/api/v1/user/login")
      .send({ email: "  Test@Example.COM ", password: "password123" })
      .expect(200)
    expect(res.body.success).toBe(true)

    const byUsername = await request(app)
      .post("/api/v1/user/login")
      .send({ username: "TestUser", password: "password123" })
      .expect(200)
    expect(byUsername.body.success).toBe(true)
  })

  it("rejects a malformed email in the login field with 400", async () => {
    const res = await request(app)
      .post("/api/v1/user/login")
      .send({ email: "garbage", password: "password123" })
      .expect(400)
    expect(res.body.message).toBe("Invalid email format")
  })

  it("rejects a wrong password with 401", async () => {
    await register().expect(201)
    const res = await request(app)
      .post("/api/v1/user/login")
      .send({ email: "test@example.com", password: "wrong-password" })
      .expect(401)
    expect(res.body.message).toBe("Invalid user credentials")
  })

  it("rejects an unknown user with 404", async () => {
    const res = await request(app)
      .post("/api/v1/user/login")
      .send({ email: "ghost@example.com", password: "password123" })
      .expect(404)
    expect(res.body.message).toBe("user does not exists")
  })

  it("rejects missing credentials with 400", async () => {
    await request(app)
      .post("/api/v1/user/login")
      .send({ password: "password123" })
      .expect(400)
  })
})





describe("GET /api/v1/user/current-user", () => {
  it("returns the authenticated user", async () => {
    const { accessToken, user } = await registerAndLogin()
    const res = await request(app)
      .get("/api/v1/user/current-user")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200)
    expect(res.body.data.username).toBe(user.username)
  })

  it("rejects requests without a token with 401", async () => {
    await request(app).get("/api/v1/user/current-user").expect(401)
  })

  it("rejects requests with an invalid token with 401", async () => {
    await request(app)
      .get("/api/v1/user/current-user")
      .set("Authorization", "Bearer not.a.real.token")
      .expect(401)
  })
})





describe("POST /api/v1/user/refresh-token", () => {
  it("issues a fresh access token when a valid refresh cookie is sent", async () => {
    const { refreshCookie } = await registerAndLogin()
    const res = await request(app)
      .post("/api/v1/user/refresh-token")
      .set("Cookie", refreshCookie)
      .expect(200)

    const newAccessToken = res.body.data.accessToken
    expect(newAccessToken).toBeTruthy()
    expect(cookieFrom(res, "refreshToken")).toBeTruthy()

    
    await request(app)
      .get("/api/v1/user/current-user")
      .set("Authorization", `Bearer ${newAccessToken}`)
      .expect(200)
  })

  it("accepts the same refresh cookie twice (multi-tab safe)", async () => {
    
    
    
    const { refreshCookie } = await registerAndLogin()
    await request(app)
      .post("/api/v1/user/refresh-token")
      .set("Cookie", refreshCookie)
      .expect(200)
    await request(app)
      .post("/api/v1/user/refresh-token")
      .set("Cookie", refreshCookie)
      .expect(200)
  })

  it("rejects a missing refresh token with 401", async () => {
    await request(app).post("/api/v1/user/refresh-token").expect(401)
  })

  it("rejects an invalid refresh token with 401", async () => {
    await request(app)
      .post("/api/v1/user/refresh-token")
      .set("Cookie", "refreshToken=invalid.token.value")
      .expect(401)
  })
})





describe("POST /api/v1/user/logout", () => {
  it("logs out and revokes the refresh token", async () => {
    const { accessCookie, refreshCookie } = await registerAndLogin()

    const res = await request(app)
      .post("/api/v1/user/logout")
      .set("Cookie", accessCookie)
      .expect(200)
    expect(res.body.message).toBe("User logged Out")

    
    await request(app)
      .post("/api/v1/user/refresh-token")
      .set("Cookie", refreshCookie)
      .expect(401)
  })

  it("rejects logout without a valid access token", async () => {
    await request(app).post("/api/v1/user/logout").expect(401)
  })
})





describe("POST /api/v1/user/change-password", () => {
  it("changes the password and revokes old sessions", async () => {
    const { accessCookie, refreshCookie, user } = await registerAndLogin()

    const res = await request(app)
      .post("/api/v1/user/change-password")
      .set("Cookie", accessCookie)
      .send({ oldPassword: "password123", newPassword: "new-password-456" })
      .expect(200)
    expect(res.body.message).toBe("password changed successfully")

    
    await request(app)
      .post("/api/v1/user/refresh-token")
      .set("Cookie", refreshCookie)
      .expect(401)

    
    await request(app)
      .post("/api/v1/user/login")
      .send({ email: user.email, password: "password123" })
      .expect(401)
    await request(app)
      .post("/api/v1/user/login")
      .send({ email: user.email, password: "new-password-456" })
      .expect(200)
  })

  it("rejects a wrong old password with 400", async () => {
    const { accessCookie } = await registerAndLogin()
    const res = await request(app)
      .post("/api/v1/user/change-password")
      .set("Cookie", accessCookie)
      .send({ oldPassword: "wrong", newPassword: "new-password-456" })
      .expect(400)
    expect(res.body.message).toBe("Invalid old password")
  })

  it("rejects missing passwords with 400", async () => {
    const { accessCookie } = await registerAndLogin()
    await request(app)
      .post("/api/v1/user/change-password")
      .set("Cookie", accessCookie)
      .send({})
      .expect(400)
  })
})
