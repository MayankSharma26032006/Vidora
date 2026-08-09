import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { createNotification, removeNotification } from "../utils/notify.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId).select("owner isPublished")

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    
    if (!video.isPublished && video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(404, "Video not found")
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })

    if (existingLike) {
        
        await Like.findByIdAndDelete(existingLike._id)
        
        await removeNotification({
            owner: video?.owner,
            actor: req.user._id,
            type: "like",
            video: videoId
        })
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Video unliked successfully"))
    }

   
    await Like.create({
        video: videoId,
        likedBy: req.user._id
    })

    
    await createNotification({
        owner: video?.owner,
        actor: req.user._id,
        type: "like",
        video: videoId
    })

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }, "Video liked successfully"))
})


const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Comment unliked successfully"))
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }, "Comment liked successfully"))
})


const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Tweet unliked successfully"))
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }, "Tweet liked successfully"))
})


const getLikedVideos = asyncHandler(async (req, res) => {
    
    
    const viewerId = new mongoose.Types.ObjectId(req.user._id)
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: viewerId,
                video: { $exists: true, $ne: null }
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
                        $match: {
                            $or: [
                                { isPublished: true },
                                { owner: viewerId }
                            ]
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
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            duration: 1,
                            views: 1,
                            owner: 1
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
            $match: {
                video: { $exists: true, $ne: null }
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"))
})


export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}