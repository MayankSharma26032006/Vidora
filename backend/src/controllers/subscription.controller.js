import mongoose, { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { createNotification, removeNotification } from "../utils/notify.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    
    if (channelId.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself")
    }

    
    const channelExists = await User.exists({ _id: channelId })
    if (!channelExists) {
        throw new ApiError(404, "Channel not found")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id)
        
        await removeNotification({
            owner: channelId,
            actor: req.user._id,
            type: "subscribe"
        })
        return res
            .status(200)
            .json(new ApiResponse(200, { isSubscribed: false }, "Unsubscribed successfully"))
    }

    await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    })

    
    await createNotification({
        owner: channelId,
        actor: req.user._id,
        type: "subscribe"
    })

    return res
        .status(200)
        .json(new ApiResponse(200, { isSubscribed: true }, "Subscribed successfully"))
})


const getSubscriptionsFeed = asyncHandler(async (req, res) => {
    
    const limitNum = parseInt(req.query.limit, 10)
    const limit = Number.isFinite(limitNum) && limitNum > 0 ? Math.min(limitNum, 50) : 12

    const subs = await Subscription.find({ subscriber: req.user._id }).select("channel")
    const channelIds = subs.map((s) => s.channel).filter(Boolean)

    if (channelIds.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(200, [], "Subscriptions feed fetched successfully"))
    }

    const videos = await Video.aggregate([
        {
            $match: {
                owner: { $in: channelIds },
                isPublished: true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
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
                owner: { $first: "$owner" }
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $limit: limit
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Subscriptions feed fetched successfully"))
})


const getSubscriberList = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
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
                subscriber: { $first: "$subscriber" }
            }
        },
        {
            $project: {
                subscriber: 1,
                _id: 0
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))
})


const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID")
    }

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
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
                channel: { $first: "$channel" }
            }
        },
        {
            $project: {
                channel: 1,
                _id: 0
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, channels, "Subscribed channels fetched successfully"))
})


export {
    toggleSubscription,
    getSubscriberList,
    getSubscribedChannels,
    getSubscriptionsFeed
}