import request from "supertest"
import app from "../src/app.js"


export { TEMP_DIR } from "../src/middlewares/multer.middleware.js"

export function cookieFrom(res, name) {
  const header = res.headers["set-cookie"] || []
  const row = header.find((c) => c.startsWith(`${name}=`))
  return row ? row.split(";")[0] : null
}


export function register(overrides = {}) {
  const body = {
    fullName: "Test User",
    email: "test@example.com",
    username: "testuser",
    password: "password123",
    ...overrides,
  }
  return request(app)
    .post("/api/v1/user/register")
    .field("fullName", body.fullName)
    .field("email", body.email)
    .field("username", body.username)
    .field("password", body.password)
    .attach("avatar", Buffer.from("fake-avatar-bytes"), "avatar.jpg")
}



let userCounter = 0




export async function registerAndLogin(overrides = {}) {
  userCounter += 1
  const email = overrides.email ?? `user${userCounter}@example.com`
  const username = overrides.username ?? `user${userCounter}`
  const password = overrides.password ?? "password123"
  await register({ email, username, password, ...overrides }).expect(201)
  const login = await request(app)
    .post("/api/v1/user/login")
    .send({ email, password })
    .expect(200)
  return {
    user: login.body.data.user,
    accessToken: login.body.data.accessToken,
    refreshToken: login.body.data.refreshToken,
    accessCookie: cookieFrom(login, "accessToken"),
    refreshCookie: cookieFrom(login, "refreshToken"),
  }
}


export function createVideo(accessCookie, video = {}) {
  return request(app)
    .post("/api/v1/videos")
    .set("Cookie", accessCookie)
    .field("title", video.title ?? "Test video")
    .field("description", video.description ?? "Test description")
    .field("category", video.category ?? "Music")
    .attach("videoFile", Buffer.from("fake-video-bytes"), "video.mp4")
    .attach("thumbnail", Buffer.from("fake-thumb-bytes"), "thumb.jpg")
}
