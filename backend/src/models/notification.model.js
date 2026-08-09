import mongoose, { Schema } from "mongoose"

const notificationSchema = new Schema(
  {
    
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["subscribe", "like", "comment"],
      required: true,
    },
    
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

notificationSchema.index({ owner: 1, createdAt: -1 })
notificationSchema.index({ owner: 1, read: 1 })

export const Notification = mongoose.model("Notification", notificationSchema)
