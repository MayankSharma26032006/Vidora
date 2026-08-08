import { MongoMemoryServer } from "mongodb-memory-server"
import mongoose from "mongoose"

let mongod

export async function connectTestDb() {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri("videotube_test"))
}

export async function resetTestDb() {
  await mongoose.connection.dropDatabase()
}

export async function disconnectTestDb() {
  // Temp files are cleaned up by uploadOnCloudinary and the global error
  // handler (for validation failures), so no directory wipe is needed here.
  // NOTE: never rmSync the OS temp dir — TEMP_DIR now points at os.tmpdir().
  await mongoose.disconnect()
  await mongod.stop()
}
