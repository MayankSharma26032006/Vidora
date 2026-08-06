import mongoose from "mongoose"
import { Notification } from "../models/notification.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { publishToUser } from "../utils/realtime.js"


const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "actor",
                foreignField: "_id",
                as: "actor",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                actor: { $first: "$actor" }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                video: { $first: "$video" }
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $limit: 50
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, notifications, "Notifications fetched successfully"))
})


const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({
        owner: req.user._id,
        read: false
    })

    return res
        .status(200)
        .json(new ApiResponse(200, { count }, "Unread notification count fetched successfully"))
})


const markAllRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        {
            owner: req.user._id,
            read: false
        },
        {
            $set: { read: true }
        }
    )

    // every open tab of this user clears its badge instantly
    publishToUser(req.user._id, { type: "notifications-changed" })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "All notifications marked as read"))
})


export {
    getNotifications,
    getUnreadCount,
    markAllRead
}
