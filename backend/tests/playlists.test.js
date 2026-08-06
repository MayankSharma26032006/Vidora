import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest"
import request from "supertest"
import { cloudinaryMockFactory } from "./mocks.js"
import { connectTestDb, resetTestDb, disconnectTestDb } from "./bootstrap.js"

vi.mock("../src/utils/cloudinary.js", () => cloudinaryMockFactory())

import app from "../src/app.js"
import { registerAndLogin, createVideo } from "./helpers.js"

beforeAll(connectTestDb)
beforeEach(resetTestDb)
afterAll(disconnectTestDb)

async function ownerWithPlaylist(name = "Watch later", description = "") {
  const owner = await registerAndLogin({ username: "owner", email: "owner@example.com" })
  const res = await request(app)
    .post("/api/v1/playlists")
    .set("Cookie", owner.accessCookie)
    .send({ name, description })
    .expect(201)
  return { owner, playlist: res.body.data }
}

describe("POST /api/v1/playlists", () => {
  it("requires authentication", async () => {
    await request(app).post("/api/v1/playlists").send({ name: "X" }).expect(401)
  })

  it("creates a playlist", async () => {
    const owner = await registerAndLogin({ username: "powner", email: "powner@example.com" })
    const res = await request(app)
      .post("/api/v1/playlists")
      .set("Cookie", owner.accessCookie)
      .send({ name: "Favorites", description: "My faves" })
      .expect(201)
    expect(res.body.data.name).toBe("Favorites")
    expect(res.body.data.description).toBe("My faves")
    expect(res.body.data.videos).toEqual([])
  })

  it("rejects a missing name", async () => {
    const owner = await registerAndLogin({ username: "powner2", email: "powner2@example.com" })
    const res = await request(app)
      .post("/api/v1/playlists")
      .set("Cookie", owner.accessCookie)
      .send({})
      .expect(400)
    expect(res.body.message).toBe("Playlist name is required")
  })
})

describe("GET /api/v1/playlists/user/:userId", () => {
  it("lists a user's playlists with totals", async () => {
    const { owner, playlist } = await ownerWithPlaylist()
    const video = (await createVideo(owner.accessCookie).expect(201)).body.data
    await request(app)
      .patch(`/api/v1/playlists/add/${video._id}/${playlist._id}`)
      .set("Cookie", owner.accessCookie)
      .expect(200)

    const res = await request(app)
      .get(`/api/v1/playlists/user/${owner.user._id}`)
      .set("Cookie", owner.accessCookie)
      .expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].totalVideos).toBe(1)
    expect(res.body.data[0].totalViews).toBe(0)
  })

  it("rejects an invalid user id", async () => {
    const { accessCookie } = await registerAndLogin()
    await request(app).get("/api/v1/playlists/user/not-an-id").set("Cookie", accessCookie).expect(400)
  })
})

describe("GET /api/v1/playlists/:playlistId", () => {
  it("returns the playlist with videos and owner", async () => {
    const { owner, playlist } = await ownerWithPlaylist()
    const video = (await createVideo(owner.accessCookie).expect(201)).body.data
    await request(app)
      .patch(`/api/v1/playlists/add/${video._id}/${playlist._id}`)
      .set("Cookie", owner.accessCookie)
      .expect(200)

    const res = await request(app).get(`/api/v1/playlists/${playlist._id}`).set("Cookie", owner.accessCookie).expect(200)
    expect(res.body.data.name).toBe("Watch later")
    expect(res.body.data.totalVideos).toBe(1)
    expect(res.body.data.owner.username).toBe("owner")
    expect(res.body.data.videos[0].title).toBe("Test video")
  })

  it("returns 404 for an unknown playlist", async () => {
    const { accessCookie } = await registerAndLogin()
    await request(app).get("/api/v1/playlists/64f0abc1234567890def0001").set("Cookie", accessCookie).expect(404)
  })
})

describe("PATCH /api/v1/playlists/:playlistId", () => {
  it("lets the owner update name and description", async () => {
    const { owner, playlist } = await ownerWithPlaylist()
    const res = await request(app)
      .patch(`/api/v1/playlists/${playlist._id}`)
      .set("Cookie", owner.accessCookie)
      .send({ name: "Renamed", description: "New desc" })
      .expect(200)
    expect(res.body.data.name).toBe("Renamed")
    expect(res.body.data.description).toBe("New desc")
  })

  it("forbids non-owners with 403", async () => {
    const { playlist } = await ownerWithPlaylist()
    const intruder = await registerAndLogin({ username: "intruder", email: "intruder@example.com" })
    await request(app)
      .patch(`/api/v1/playlists/${playlist._id}`)
      .set("Cookie", intruder.accessCookie)
      .send({ name: "Hijacked" })
      .expect(403)
  })

  it("rejects empty updates", async () => {
    const { owner, playlist } = await ownerWithPlaylist()
    const res = await request(app)
      .patch(`/api/v1/playlists/${playlist._id}`)
      .set("Cookie", owner.accessCookie)
      .send({})
      .expect(400)
    expect(res.body.message).toBe("Name or description is required")
  })
})

describe("PATCH /api/v1/playlists/add/:videoId/:playlistId", () => {
  it("adds a video without duplicating it", async () => {
    const { owner, playlist } = await ownerWithPlaylist()
    const video = (await createVideo(owner.accessCookie).expect(201)).body.data

    await request(app)
      .patch(`/api/v1/playlists/add/${video._id}/${playlist._id}`)
      .set("Cookie", owner.accessCookie)
      .expect(200)
    await request(app)
      .patch(`/api/v1/playlists/add/${video._id}/${playlist._id}`)
      .set("Cookie", owner.accessCookie)
      .expect(200)

    const res = await request(app).get(`/api/v1/playlists/${playlist._id}`).set("Cookie", owner.accessCookie).expect(200)
    expect(res.body.data.totalVideos).toBe(1)
  })

  it("forbids non-owners with 403", async () => {
    const { playlist } = await ownerWithPlaylist()
    const intruder = await registerAndLogin({ username: "intruder2", email: "intruder2@example.com" })
    const video = (await createVideo(intruder.accessCookie).expect(201)).body.data
    await request(app)
      .patch(`/api/v1/playlists/add/${video._id}/${playlist._id}`)
      .set("Cookie", intruder.accessCookie)
      .expect(403)
  })
})

describe("PATCH /api/v1/playlists/remove/:videoId/:playlistId", () => {
  it("removes a video from the playlist", async () => {
    const { owner, playlist } = await ownerWithPlaylist()
    const video = (await createVideo(owner.accessCookie).expect(201)).body.data
    await request(app)
      .patch(`/api/v1/playlists/add/${video._id}/${playlist._id}`)
      .set("Cookie", owner.accessCookie)
      .expect(200)

    const res = await request(app)
      .patch(`/api/v1/playlists/remove/${video._id}/${playlist._id}`)
      .set("Cookie", owner.accessCookie)
      .expect(200)
    expect(res.body.data.videos).toEqual([])
  })
})

describe("DELETE /api/v1/playlists/:playlistId", () => {
  it("lets the owner delete the playlist", async () => {
    const { owner, playlist } = await ownerWithPlaylist()
    await request(app).delete(`/api/v1/playlists/${playlist._id}`).set("Cookie", owner.accessCookie).expect(200)
    await request(app).get(`/api/v1/playlists/${playlist._id}`).set("Cookie", owner.accessCookie).expect(404)
  })

  it("forbids non-owners with 403", async () => {
    const { playlist } = await ownerWithPlaylist()
    const intruder = await registerAndLogin({ username: "intruder3", email: "intruder3@example.com" })
    await request(app)
      .delete(`/api/v1/playlists/${playlist._id}`)
      .set("Cookie", intruder.accessCookie)
      .expect(403)
  })
})
