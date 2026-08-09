import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id

    
    const totalSubscribers = await Subscription.countDocuments({
        channel: userId
    })

    
    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" },
                totalLikes: { $sum: { $size: "$likes" } }
            }
        }
    ])

    const stats = {
        totalSubscribers,
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        totalLikes: videoStats[0]?.totalLikes || 0
    }

    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Channel stats fetched successfully"))
})


const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const { page = 1, limit = 12 } = req.query
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)

    
    
    const safe = {
        page: Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1,
        limit: Number.isFinite(limitNum) && limitNum > 0 ? Math.min(limitNum, 50) : 12
    }

    const pipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                totalLikes: { $size: "$likes" }
            }
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                totalLikes: 1,
                createdAt: 1
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]

    
    
    
    const [totalResult, videos] = await Promise.all([
        Video.aggregate([...pipeline, { $count: "total" }]),
        Video.aggregate([
            ...pipeline,
            { $skip: (safe.page - 1) * safe.limit },
            { $limit: safe.limit }
        ])
    ])

    const totalVideos = totalResult[0]?.total || 0
    const totalPages = Math.max(1, Math.ceil(totalVideos / safe.limit))

    return res
        .status(200)
        .json(new ApiResponse(200, {
            videos,
            page: safe.page,
            limit: safe.limit,
            totalVideos,
            totalPages,
            hasNextPage: safe.page < totalPages
        }, "Channel videos fetched successfully"))
})


export {
    getChannelStats,
    getChannelVideos
}