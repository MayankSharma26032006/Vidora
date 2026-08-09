import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { Notification } from "../models/notification.model.js"
import { Like } from "../models/like.model.js"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async(req,res)=>{
    const{
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
    category
    }=req.query

    
    const SORTABLE_FIELDS = ["createdAt", "views", "duration", "title", "updatedAt"]
    const effectiveSortBy = SORTABLE_FIELDS.includes(sortBy) ? sortBy : "createdAt"

    const pipeline = []
    if(userId){
        if(!isValidObjectId(userId)){
            throw new ApiError(404,"Invalid Userid")
        }
        pipeline.push({
        $match:{
            owner:new mongoose.Types.ObjectId(userId)
        }
    })
    }

    
    
    pipeline.push(
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField: "_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            fullname:1,
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{$first:"$owner"}
            }
        }
    )

    if(query){
        
        
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        pipeline.push({
            $match:{
                $or:[
                    {title:{$regex:escapedQuery,$options:"i"}},
                    {description:{$regex:escapedQuery,$options:"i"}},
                    {"owner.username":{$regex:escapedQuery,$options:"i"}},
                    {"owner.fullname":{$regex:escapedQuery,$options:"i"}}
                ]
            }
        })
    }

    if(category){
        pipeline.push({
            $match:{
                category
            }
        })
    }
    
    pipeline.push({
        $match:{isPublished:true}
    })

    pipeline.push(
        {
            $sort:{
                [effectiveSortBy]: sortType === "asc"?1:-1
            }
        }
    )



    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const options = {
        
        
        page: Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1,
        limit: Number.isFinite(limitNum) && limitNum > 0 ? Math.min(limitNum, 50) : 10
    }

    const videos = await Video.aggregatePaginate(
        Video.aggregate(pipeline),
        
        options
    )
    return res
    .status(200)
    .json(new ApiResponse(200,videos,"Videos fetched successfully"))

})

const publishAVideo = asyncHandler(async(req,res)=>{






    const{title,description,isPublished,category} = req.body
    if(!title?.trim()){
        throw new ApiError(400,"Title is required")
    }
    if(!description?.trim()){
        throw new ApiError(400,"Description is required")
    }
    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path
    if(!videoLocalPath){
        throw new ApiError(400,"Video file is required")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail is required")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath, "vidora/videos")
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, "vidora/thumbnails")
    if(!videoFile?.url){
        throw new ApiError(500,"Failed to upload video file to Cloudinary")
    }
    if(!thumbnail?.url){
        
        await deleteFromCloudinary(videoFile.public_id, "video")
        throw new ApiError(500,"Failed to upload thumbnail to Cloudinary")
    }
    let video
    try {
        video = await Video.create({
            videoFile: videoFile.url,
            videoFilePublicId: videoFile.public_id,
            thumbnail: thumbnail.url,
            thumbnailPublicId: thumbnail.public_id,
            title: title.trim(),
            description: (description || "").trim(),
            category: category?.trim() || "Other",
            duration: videoFile.duration,
            owner: req.user._id,
            isPublished: isPublished === undefined ? true : (isPublished === true || isPublished === "true")
        })
    } catch (createError) {
        
        
        await deleteFromCloudinary(videoFile.public_id, "video")
        await deleteFromCloudinary(thumbnail.public_id, "image")
        throw createError
    }
    if(!video){
        
        await deleteFromCloudinary(videoFile.public_id, "video")
        await deleteFromCloudinary(thumbnail.public_id, "image")
        throw new ApiError(500,"Failed to publish video")
    }
    return res
    .status(201)
    .json(new ApiResponse(201,video,"Video published successfully"))

})

const getVideoById = asyncHandler(async(req,res)=>{
    const{videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }
    await Video.findByIdAndUpdate(videoId,{
        $inc:{views:1}
    })
    const video = await Video.aggregate([
        {
            $match:{_id: new mongoose.Types.ObjectId(videoId)}
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            fullname:1,
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{$first:"$owner"}
            }
        },
        {
            
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes"
            }
        },
        {
            $addFields:{
                likesCount:{$size:"$likes"},
                isLiked: req.user
                    ? {$in:[req.user._id, "$likes.likedBy"]}
                    : false
            }
        },
        {
            
            $lookup:{
                from:"subscriptions",
                localField:"owner._id",
                foreignField:"channel",
                as:"ownerSubscribers"
            }
        },
        {
            $addFields:{
                subscribersCount:{$size:"$ownerSubscribers"},
                isSubscribed: req.user
                    ? {$in:[req.user._id, "$ownerSubscribers.subscriber"]}
                    : false
            }
        },
        {
            $project:{
                likes:0,
                ownerSubscribers:0
            }
        }
    ])
    if(!video?.length){
        throw new ApiError(404,"Video not found")
    }
    
    
    if (!video[0].isPublished) {
        const ownerId = video[0].owner?._id?.toString?.()
        if (!req.user || ownerId !== req.user._id.toString()) {
            throw new ApiError(404, "Video not found")
        }
    }
    if (req.user) {
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { watchHistory: new mongoose.Types.ObjectId(videoId) }
        })
        video[0].isSaved = (req.user.savedVideos || []).some(id => id.toString() === videoId)
    } else {
        video[0].isSaved = false
    }
    return res
    .status(200)
    .json(new ApiResponse(200,video[0],"Video fetched successfully"))
})
const updateVideo = asyncHandler(async(req,res)=>{
    const{videoId} = req.params
    const { title, description } = req.body;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }
    if(!title?.trim()&&!description?.trim()&&!req.file){
        throw new ApiError(400,"At least one field is required to update")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    if(video.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to update this video")
    }
    const updateFields = {}
    if(title?.trim()){
        updateFields.title = title.trim()
    }
    if(description?.trim()){
        updateFields.description = description.trim()
    }
    if(req.file?.path){
    
    
    const thumbnail = await uploadOnCloudinary(req.file.path, "vidora/thumbnails")
    if(!thumbnail?.url){
        throw new ApiError(500,"Failed to upload thumbnail to Cloudinary")
    }
    updateFields.thumbnail = thumbnail.url
    updateFields.thumbnailPublicId = thumbnail.public_id
}
    const updatedVideo = await Video.findByIdAndUpdate(videoId,{
        $set:updateFields
    },{ returnDocument: 'after' })

    
    
    
    if (updateFields.thumbnailPublicId && video.thumbnailPublicId !== updateFields.thumbnailPublicId) {
        await deleteFromCloudinary(video.thumbnailPublicId, "image")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,updatedVideo,"Video updated successfully"))
})

const deleteVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    if(video.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You are not allowed to delete this video")
    }
    await Video.findByIdAndDelete(videoId)
    await User.updateMany(
        {watchHistory:videoId},
        {$pull:{watchHistory:videoId}}
    )
    await User.updateMany(
        {savedVideos:videoId},
        {$pull:{savedVideos:videoId}}
    )
    
    const commentIds = await Comment.find({ video: videoId }).distinct("_id")
    
    await Notification.deleteMany({ video: videoId })
    await Like.deleteMany({ video: videoId })
    
    await Comment.deleteMany({ video: videoId })
    
    if (commentIds.length > 0) await Like.deleteMany({ comment: { $in: commentIds } })
    await deleteFromCloudinary(video.videoFilePublicId, "video")
    await deleteFromCloudinary(video.thumbnailPublicId, "image")
        return res
        .status(200)
        .json(new ApiResponse(200,{},"Video deleted successfully"))
})
const togglePublishStatus = asyncHandler(async(req,res)=>{
    const{videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video ID")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    if(video.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You are not allowed to do this")
    }
    video.isPublished = !video.isPublished
    await video.save({validateBeforeSave:false})
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {isPublished:video.isPublished},
            `Video${video.isPublished? "published" : "unpublished"}successfully`

        )
    )
})

export{
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}