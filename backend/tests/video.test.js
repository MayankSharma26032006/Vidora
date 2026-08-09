import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest"
import request from "supertest"
import { cloudinaryMockFactory } from "./mocks.js"
import { connectTestDb, resetTestDb, disconnectTestDb } from "./bootstrap.js"

// Mock Cloudinary so publishAVideo needs no network access or credentials.
vi.mock("../src/utils/cloudinary.js", () => cloudinaryMockFactory())

import fs from "fs"
import path from "path"
import app from "../src/app.js"
import { registerAndLogin, createVideo, TEMP_DIR } from "./helpers.js"
import { Video } from "../src/models/video.model.js"
import { Like } from "../src/models/like.model.js"
import { Comment } from "../src/models/comment.model.js"

beforeAll(connectTestDb)
beforeEach(resetTestDb)
afterAll(disconnectTestDb)

async function userAndVideo(userOverrides = {}, videoOverrides = {}) {
  const session = await registerAndLogin(userOverrides)
  const res = await createVideo(session.accessCookie, videoOverrides).expect(201)
  return { session, video: res.body.data }
}

// ---------------------------------------------------------------------------
// publish
// ---------------------------------------------------------------------------

describe("POST /api/v1/videos", () => {
  it("requires authentication", async () => {
    await request(app).post("/api/v1/videos").expect(401)
  })

  it("rejects a missing title with 400", async () => {
    const { accessCookie } = await registerAndLogin()
    const res = await createVideo(accessCookie, { title: "" }).expect(400)
    expect(res.body.message).toBe("Title is required")
  })

  it("rejects a missing description with 400", async () => {
    const { accessCookie } = await registerAndLogin()
    const res = await createVideo(accessCookie, { description: "" }).expect(400)
    expect(res.body.message).toBe("Description is required")
  })

  it("cleans up temp files when validation fails (no disk leak)", async () => {
    const { accessCookie } = await registerAndLogin()
    const before = fs.readdirSync(TEMP_DIR).length

    // multer writes both files, then the controller rejects for a missing title
    await createVideo(accessCookie, { title: "" }).expect(400)

    const after = fs.readdirSync(TEMP_DIR).length
    expect(after).toBe(before)
  })

  it("deletes the uploaded video from Cloudinary when the thumbnail upload fails (no orphan)", async () => {
    const { uploadOnCloudinary, deleteFromCloudinary } = await import("../src/utils/cloudinary.js")
    const { accessCookie } = await registerAndLogin()

    // First call (videoFile) succeeds, second call (thumbnail) fails
    uploadOnCloudinary
      .mockClear()
      .mockImplementationOnce(async () => ({ url: "https://cdn.test/v.mp4", public_id: "video-orphan", duration: 42.5 }))
      .mockImplementationOnce(async () => null)

    const res = await createVideo(accessCookie).expect(500)
    expect(res.body.message).toBe("Failed to upload thumbnail to Cloudinary")

    // the already-uploaded video file must be removed from Cloudinary
    expect(deleteFromCloudinary).toHaveBeenCalledWith("video-orphan", "video")
  })

  it("deletes uploaded assets from Cloudinary when the DB write fails (no orphan)", async () => {
    const { uploadOnCloudinary, deleteFromCloudinary } = await import("../src/utils/cloudinary.js")
    const { accessCookie } = await registerAndLogin()

    // both uploads succeed, but Video.create fails (duration missing)
    uploadOnCloudinary
      .mockClear()
      .mockImplementationOnce(async () => ({ url: "https://cdn.test/v.mp4", public_id: "video-orphan2", duration: undefined }))
      .mockImplementationOnce(async () => ({ url: "https://cdn.test/t.jpg", public_id: "thumb-orphan2" }))

    await createVideo(accessCookie).expect(500)

    expect(deleteFromCloudinary).toHaveBeenCalledWith("video-orphan2", "video")
    expect(deleteFromCloudinary).toHaveBeenCalledWith("thumb-orphan2", "image")
  })

  it("rejects a missing video file with 400", async () => {
    const { accessCookie } = await registerAndLogin()
    const res = await request(app)
      .post("/api/v1/videos")
      .set("Cookie", accessCookie)
      .field("title", "Test video")
      .field("description", "Test description")
      .attach("thumbnail", Buffer.from("fake-thumb-bytes"), "thumb.jpg")
      .expect(400)
    expect(res.body.message).toBe("Video file is required")
  })

  it("rejects a missing thumbnail with 400", async () => {
    const { accessCookie } = await registerAndLogin()
    const res = await request(app)
      .post("/api/v1/videos")
      .set("Cookie", accessCookie)
      .field("title", "Test video")
      .field("description", "Test description")
      .attach("videoFile", Buffer.from("fake-video-bytes"), "video.mp4")
      .expect(400)
    expect(res.body.message).toBe("Thumbnail is required")
  })

  it("publishes a video with owner, duration and cloudinary urls", async () => {
    const { session, video } = await userAndVideo()

    expect(video.owner).toBe(session.user._id)
    expect(video.title).toBe("Test video")
    expect(video.duration).toBe(42.5)
    expect(video.isPublished).toBe(true)
    expect(video.category).toBe("Music")
    // filenames are randomized for safety, but the extension must be preserved
    expect(video.videoFile).toMatch(/\.mp4$/)
    expect(video.thumbnail).toMatch(/\.jpg$/)
  })

  it("uploads video files and thumbnails into their own Cloudinary folders", async () => {
    const { uploadOnCloudinary } = await import("../src/utils/cloudinary.js")
    uploadOnCloudinary.mockClear()
    await userAndVideo()

    expect(uploadOnCloudinary).toHaveBeenCalledWith(expect.any(String), "vidora/videos")
    expect(uploadOnCloudinary).toHaveBeenCalledWith(expect.any(String), "vidora/thumbnails")
  })
})

// ---------------------------------------------------------------------------
// list / search
// ---------------------------------------------------------------------------

describe("GET /api/v1/videos", () => {
  it("returns published videos with an embedded owner", async () => {
    const { video } = await userAndVideo({ username: "alice", email: "alice@example.com" })

    const res = await request(app).get("/api/v1/videos").expect(200)
    expect(res.body.data.docs).toHaveLength(1)
    expect(res.body.data.docs[0]._id.toString()).toBe(video._id.toString())
    expect(res.body.data.docs[0].owner.username).toBe("alice")
    expect(res.body.data.docs[0].owner.fullname).toBeTruthy()
  })

  it("excludes unpublished videos", async () => {
    const { session } = await userAndVideo()
    await Video.create({
      videoFile: "https://cdn.test/unpublished.mp4",
      videoFilePublicId: "unpublished",
      thumbnail: "https://cdn.test/unpublished.jpg",
      thumbnailPublicId: "unpublished",
      title: "Unpublished video",
      description: "Should not appear",
      duration: 10,
      owner: session.user._id,
      isPublished: false,
    })

    const res = await request(app).get("/api/v1/videos").expect(200)
    expect(res.body.data.docs).toHaveLength(1)
    expect(res.body.data.docs[0].title).toBe("Test video")
  })

  it("hides unpublished videos from non-owners by direct URL", async () => {
    const owner = await registerAndLogin({ username: "ownervid", email: "ownervid@example.com" })
    const stranger = await registerAndLogin({ username: "strangervid", email: "strangervid@example.com" })
    const res = await request(app)
      .post("/api/v1/videos")
      .set("Cookie", owner.accessCookie)
      .field("title", "Secret")
      .field("description", "Private")
      .field("isPublished", "false")
      .attach("videoFile", Buffer.from("fake-video-bytes"), "video.mp4")
      .attach("thumbnail", Buffer.from("fake-thumb-bytes"), "thumb.jpg")
      .expect(201)

    // owner can view their own private video
    await request(app)
      .get(`/api/v1/videos/${res.body.data._id}`)
      .set("Cookie", owner.accessCookie)
      .expect(200)
    // anyone else gets 404 — no leaked private content
    await request(app)
      .get(`/api/v1/videos/${res.body.data._id}`)
      .set("Cookie", stranger.accessCookie)
      .expect(404)
    await request(app).get(`/api/v1/videos/${res.body.data._id}`).expect(404)
  })

  it("paginates results", async () => {
    const { accessCookie } = await registerAndLogin()
    for (let i = 1; i <= 3; i += 1) {
      await createVideo(accessCookie, { title: `Video ${i}` }).expect(201)
    }

    const page1 = await request(app).get("/api/v1/videos").query({ limit: 2 }).expect(200)
    expect(page1.body.data.docs).toHaveLength(2)
    expect(page1.body.data.totalDocs).toBe(3)

    const page2 = await request(app).get("/api/v1/videos").query({ limit: 2, page: 2 }).expect(200)
    expect(page2.body.data.docs).toHaveLength(1)
  })

  it("sorts by newest first by default", async () => {
    const { accessCookie } = await registerAndLogin()
    const a = (await createVideo(accessCookie, { title: "Older" }).expect(201)).body.data
    const b = (await createVideo(accessCookie, { title: "Newer" }).expect(201)).body.data
    await Video.findByIdAndUpdate(a._id, { $set: { createdAt: new Date("2026-01-01") } })

    const res = await request(app).get("/api/v1/videos").expect(200)
    expect(res.body.data.docs[0]._id.toString()).toBe(b._id.toString())
    expect(res.body.data.docs[1]._id.toString()).toBe(a._id.toString())
  })

  it("searches by title case-insensitively", async () => {
    const { video } = await userAndVideo()
    const res = await request(app).get("/api/v1/videos").query({ query: "TEST VIDEO" }).expect(200)
    expect(res.body.data.docs.some((v) => v._id.toString() === video._id.toString())).toBe(true)
  })

  it("searches by channel name", async () => {
    const { video } = await userAndVideo({ username: "chansearch", email: "chan@example.com" })
    const res = await request(app).get("/api/v1/videos").query({ query: "chansearch" }).expect(200)
    expect(res.body.data.docs.some((v) => v._id.toString() === video._id.toString())).toBe(true)
  })

  it("filters by userId", async () => {
    const { session } = await userAndVideo({ username: "owneruser", email: "owner@example.com" })
    const res = await request(app).get("/api/v1/videos").query({ userId: session.user._id }).expect(200)
    expect(res.body.data.docs).toHaveLength(1)
  })

  it("rejects an invalid userId filter", async () => {
    const res = await request(app).get("/api/v1/videos").query({ userId: "not-an-object-id" }).expect(404)
    expect(res.body.message).toBe("Invalid Userid")
  })
})

// ---------------------------------------------------------------------------
// get by id
// ---------------------------------------------------------------------------

describe("GET /api/v1/videos/:videoId", () => {
  it("returns the video and increments views on each fetch", async () => {
    const { session, video } = await userAndVideo()
    await request(app).get(`/api/v1/videos/${video._id}`).expect(200)

    const res = await request(app).get(`/api/v1/videos/${video._id}`).expect(200)
    expect(res.body.data.views).toBe(2)
    expect(res.body.data.owner.username).toBe(session.user.username)
    expect(res.body.data.likesCount).toBe(0)
    expect(res.body.data.subscribersCount).toBe(0)
  })

  it("rejects an invalid id with 400", async () => {
    await request(app).get("/api/v1/videos/not-an-object-id").expect(400)
  })

  it("returns 404 for an unknown id", async () => {
    await request(app).get("/api/v1/videos/64f0abc1234567890def0001").expect(404)
  })

  it("marks saved videos for authenticated users", async () => {
    const { session, video } = await userAndVideo()
    await request(app)
      .post(`/api/v1/user/saved-videos/${video._id}`)
      .set("Cookie", session.accessCookie)
      .expect(200)

    const authed = await request(app)
      .get(`/api/v1/videos/${video._id}`)
      .set("Cookie", session.accessCookie)
      .expect(200)
    expect(authed.body.data.isSaved).toBe(true)

    const guest = await request(app).get(`/api/v1/videos/${video._id}`).expect(200)
    expect(guest.body.data.isSaved).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

describe("PATCH /api/v1/videos/update/:videoId", () => {
  it("forbids non-owners with 403", async () => {
    const { video } = await userAndVideo({ username: "alice", email: "alice@example.com" })
    const bob = await registerAndLogin({ username: "bob", email: "bob@example.com" })

    const res = await request(app)
      .patch(`/api/v1/videos/update/${video._id}`)
      .set("Cookie", bob.accessCookie)
      .send({ title: "Hijacked" })
      .expect(403)
    expect(res.body.message).toBe("You are not authorized to update this video")
  })

  it("lets the owner update the title", async () => {
    const { session, video } = await userAndVideo()
    const res = await request(app)
      .patch(`/api/v1/videos/update/${video._id}`)
      .set("Cookie", session.accessCookie)
      .send({ title: "Renamed video" })
      .expect(200)

    expect(res.body.data.title).toBe("Renamed video")
    expect(res.body.data.description).toBe("Test description")
  })

  it("rejects an update with no fields", async () => {
    const { session, video } = await userAndVideo()
    const res = await request(app)
      .patch(`/api/v1/videos/update/${video._id}`)
      .set("Cookie", session.accessCookie)
      .send({})
      .expect(400)
    expect(res.body.message).toBe("At least one field is required to update")
  })

  it("returns 404 for an unknown video", async () => {
    const { accessCookie } = await registerAndLogin()
    await request(app)
      .patch("/api/v1/videos/update/64f0abc1234567890def0001")
      .set("Cookie", accessCookie)
      .send({ title: "X" })
      .expect(404)
  })
})

// ---------------------------------------------------------------------------
// publish toggle
// ---------------------------------------------------------------------------

describe("PATCH /api/v1/videos/:videoId (publish toggle)", () => {
  it("lets the owner unpublish and hides the video from listings", async () => {
    const { session, video } = await userAndVideo()
    const res = await request(app)
      .patch(`/api/v1/videos/${video._id}`)
      .set("Cookie", session.accessCookie)
      .expect(200)
    expect(res.body.data.isPublished).toBe(false)

    const listing = await request(app).get("/api/v1/videos").expect(200)
    expect(listing.body.data.docs.some((v) => v._id.toString() === video._id.toString())).toBe(false)
  })

  it("forbids non-owners with 403", async () => {
    const { video } = await userAndVideo({ username: "alice", email: "alice@example.com" })
    const bob = await registerAndLogin({ username: "bob", email: "bob@example.com" })
    await request(app)
      .patch(`/api/v1/videos/${video._id}`)
      .set("Cookie", bob.accessCookie)
      .expect(403)
  })
})

// ---------------------------------------------------------------------------
// delete
// ---------------------------------------------------------------------------

describe("DELETE /api/v1/videos/:videoId", () => {
  it("forbids non-owners with 403", async () => {
    const { video } = await userAndVideo({ username: "alice", email: "alice@example.com" })
    const bob = await registerAndLogin({ username: "bob", email: "bob@example.com" })
    await request(app)
      .delete(`/api/v1/videos/${video._id}`)
      .set("Cookie", bob.accessCookie)
      .expect(403)
  })

  it("lets the owner delete the video and cleans up saved references", async () => {
    const { session, video } = await userAndVideo()
    await request(app)
      .post(`/api/v1/user/saved-videos/${video._id}`)
      .set("Cookie", session.accessCookie)
      .expect(200)

    const res = await request(app)
      .delete(`/api/v1/videos/${video._id}`)
      .set("Cookie", session.accessCookie)
      .expect(200)
    expect(res.body.message).toBe("Video deleted successfully")

    await request(app).get(`/api/v1/videos/${video._id}`).expect(404)

    // The deleted video no longer lingers in the user's saved list.
    const saved = await request(app)
      .get("/api/v1/user/saved-videos")
      .set("Cookie", session.accessCookie)
      .expect(200)
    expect(saved.body.data).toHaveLength(0)
  })

  it("removes comments when the video is deleted (no orphans)", async () => {
    const { session, video } = await userAndVideo()
    const commenter = await registerAndLogin({ username: "commenter", email: "commenter@example.com" })
    await request(app)
      .post(`/api/v1/comments/${video._id}`)
      .set("Cookie", commenter.accessCookie)
      .send({ content: "nice" })
      .expect(201)

    const before = await Comment.countDocuments({ video: video._id })
    expect(before).toBe(1)

    await request(app)
      .delete(`/api/v1/videos/${video._id}`)
      .set("Cookie", session.accessCookie)
      .expect(200)

    expect(await Comment.countDocuments({ video: video._id })).toBe(0)
  })

  it("rejects an invalid id with 400", async () => {
    const { accessCookie } = await registerAndLogin()
    await request(app)
      .delete("/api/v1/videos/not-an-object-id")
      .set("Cookie", accessCookie)
      .expect(400)
  })

  it("deleting a video removes its likes", async () => {
    const alice = await registerAndLogin({ username: "alice2", email: "alice2@example.com" })
    const bob = await registerAndLogin({ username: "bob2", email: "bob2@example.com" })
    const video = (await createVideo(alice.accessCookie).expect(201)).body.data

    await request(app)
      .post(`/api/v1/likes/toggle/v/${video._id}`)
      .set("Cookie", bob.accessCookie)
      .expect(200)
    expect(await Like.countDocuments({ video: video._id })).toBe(1)

    await request(app).delete(`/api/v1/videos/${video._id}`).set("Cookie", alice.accessCookie).expect(200)
    expect(await Like.countDocuments({ video: video._id })).toBe(0)
  })
})
