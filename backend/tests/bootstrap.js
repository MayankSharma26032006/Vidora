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
  
  
  
  await mongoose.disconnect()
  await mongod.stop()
}
