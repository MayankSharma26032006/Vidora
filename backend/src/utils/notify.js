import { Notification } from "../models/notification.model.js"
import { publishToUser } from "./realtime.js"


export async function createNotification({ owner, actor, type, video }) {
  try {
    if (!owner || !actor) return
    if (owner.toString() === actor.toString()) return
    await Notification.create({ owner, actor, type, video })
    
    publishToUser(owner, { type: "notifications-changed" })
  } catch (error) {
    
    
    console.error("Failed to create notification:", error.message)
  }
}


export async function removeNotification({ owner, actor, type, video }) {
  try {
    const result = await Notification.deleteMany({ owner, actor, type, video })
    if (result.deletedCount > 0) {
      publishToUser(owner, { type: "notifications-changed" })
    }
  } catch (error) {
    console.error("Failed to remove notification:", error.message)
  }
}
