import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { createNotification, removeNotification } from "../utils/notify.js"


const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    
    
    const video = await Video.findById(videoId).select("owner isPublished")
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    if (!video.isPublished && (!req.user || video.owner.toString() !== req.user._id.toString())) {
        throw new ApiError(404, "Video not found")
    }

    const pipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
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
    ]

    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const options = {
        page: Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1,
        limit: Number.isFinite(limitNum) && limitNum > 0 ? Math.min(limitNum, 50) : 10
    }

    const comments = await Comment.aggregatePaginate(
        Comment.aggregate(pipeline),
        options
    )

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"))
})


const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }

    
    
    const video = await Video.findById(videoId).select("owner isPublished")
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    if (!video.isPublished && video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(404, "Video not found")
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id
    })

    if (!comment) {
        throw new ApiError(500, "Something went wrong while adding comment")
    }

    
    
    await comment.populate({ path: "owner", select: "fullname username avatar" })

    
    await createNotification({
        owner: video?.owner,
        actor: req.user._id,
        type: "comment",
        video: videoId
    })

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"))
})


const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { $set: { content: content.trim() } },
        { returnDocument: 'after' }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment updated successfully"))
})


const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    
    await Like.deleteMany({ comment: commentId })

    
    if (deletedComment) {
      const video = await Video.findById(deletedComment.video).select("owner")
      await removeNotification({
        owner: video?.owner,
        actor: req.user._id,
        type: "comment",
        video: deletedComment.video
      })
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"))
})


export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}