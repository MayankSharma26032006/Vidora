import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
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
        // sorting for newest comments
        {
            $sort: { createdAt: -1 }
        }
    ]

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
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

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id
    })

    if (!comment) {
        throw new ApiError(500, "Something went wrong while adding comment")
    }

    // include the owner's profile in the response so the UI can render the
    // avatar + username immediately (matches the list endpoint's shape)
    await comment.populate({ path: "owner", select: "fullname username avatar" })

    // notify the video owner about the new comment
    const video = await Video.findById(videoId).select("owner")
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

    // only the owner can update
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

    // only the owner can delete
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    // undo the notification when a comment is removed
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