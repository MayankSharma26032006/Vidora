import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body

    if (!content?.trim()) {
        throw new ApiError(400, "Tweet content is required")
    }

    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id
    })

    if (!tweet) {
        throw new ApiError(500, "Something went wrong while creating tweet")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, tweet, "Tweet created successfully"))
})


const getAllTweets = asyncHandler(async (req, res) => {
    const tweets = await Tweet.aggregate([
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
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Tweets fetched successfully"))
})


const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
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
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "User tweets fetched successfully"))
})


const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Tweet content is required")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this tweet")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { $set: { content: content.trim() } },
        { new: true }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"))
})


const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this tweet")
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet deleted successfully"))
})


export {
    getAllTweets,
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}