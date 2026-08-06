import { MongoMemoryServer } from "mongodb-memory-server"
import mongoose from "mongoose"
import fs from "fs"
import { TEMP_DIR } from "./helpers.js"

let mongod

export async function connectTestDb() {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri("videotube_test"))
}

export async function resetTestDb() {
  await mongoose.connection.dropDatabase()
}

export async function disconnectTestDb() {
  // Multer writes uploads to public/temp before controllers validate, so
  // error-path tests can leak files — wipe them and restore the dir.
  fs.rmSync(TEMP_DIR, { recursive: true, force: true })
  fs.mkdirSync(TEMP_DIR, { recursive: true })
  await mongoose.disconnect()
  await mongod.stop()
}
