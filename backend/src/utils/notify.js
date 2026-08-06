import { Notification } from "../models/notification.model.js"
import { publishToUser } from "./realtime.js"

/**
 * Create a notification for `owner` about an action performed by `actor`.
 * Never notifies a user about their own action.
 */
export async function createNotification({ owner, actor, type, video }) {
  try {
    if (!owner || !actor) return
    if (owner.toString() === actor.toString()) return
    await Notification.create({ owner, actor, type, video })
    // tell every open tab of the owner that the feed changed
    publishToUser(owner, { type: "notifications-changed" })
  } catch (error) {
    // Notifications are best-effort — never let a notification failure
    // break the primary action (like/comment/subscribe).
    console.error("Failed to create notification:", error.message)
  }
}

/**
 * Remove a notification (e.g. when a like/comment/subscription is undone).
 */
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
