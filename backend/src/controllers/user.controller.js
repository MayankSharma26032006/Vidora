import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import{User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
};

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found while generating tokens");
    }

    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw new ApiError(500, "ACCESS_TOKEN_SECRET is not configured");
    }
    if (!process.env.REFRESH_TOKEN_SECRET) {
      throw new ApiError(500, "REFRESH_TOKEN_SECRET is not configured");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("generateAccessAndRefreshTokens error:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error.message || "something went wrong while generating refresh and access token");
  }
}



const registerUser = asyncHandler(async (req, res) => {
  // console.log('ENTER registerUser')


  // get user details
  // validation - not empty
  // check if user already exists
  // check for img, avatar
  // upload img to cloudinary, avatar
  // create user object - create entry in db
  // remove password, refresh token from response
  // check for user creation
  // return response

  const { fullName, email, username, password } = req.body;
  // console.log("email:", email);
  if (!fullName?.trim()) {
      throw new ApiError(400, "Full name is required")
  }

  if (!email?.trim()) {
      throw new ApiError(400, "Email is required")
  }

  if (!password?.trim()) {
      throw new ApiError(400, "Password is required")
  }

  if (!username?.trim()) {
      throw new ApiError(400, "Username is required")
  } 
  const existedUser = await User.findOne({
    $or:[{username},{email}]
  })
  if(existedUser){
    throw new ApiError(409,"User already exists")
  }

  // console.log('DEBUG content-type:', req.headers['content-type'])
  // console.log('DEBUG req.files:', req.files)
  // console.log('DEBUG req.body:', req.body)

  const avatarLocalPath = req.files?.avatar?.[0]?.path
  let coverImageLocalPath;
  if(req.files&& Array.isArray(req.files.coverImage)&&req.files.coverImage.length>0){
    coverImageLocalPath = req.files.coverImage[0].path
  }



  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400,"Avatar is required")
  }
  const user = await User.create({
    fullname: fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering")
  }
  

  return res.status(201).json(
    new ApiResponse(201,createdUser,"User registered successfully")
  )
});
const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  // check if user exists
  // password check
  // refresh and access token
  // send cookies
  const { email, username, password } = req.body;
  if (!(email || username)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  });
  if (!user) {
    throw new ApiError(404, "user does not exists");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        "User logged in successfully"
      )
    );
});

const logOutUser = asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset:{
        refreshToken: 1
      }
    },
    {
      new :true
    }

  )

  return res
  .status(200)
  .clearCookie("accessToken", cookieOptions)
  .clearCookie("refreshToken", cookieOptions)
  .json(new ApiResponse(200,{},"User logged Out"))



})
const refreshAccessToken = asyncHandler(async(req,res)=>{
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if(!incomingRefreshToken){
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken, 
      process.env.REFRESH_TOKEN_SECRET
    )
    const user = await User.findById(decodedToken?._id)
    if(!user){
      throw new ApiError(401,"Invalid refresh token")
    }
    if(incomingRefreshToken !== user.refreshToken){
      throw new ApiError(401,"Refresh token is expired or used")
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }
})
const changeCurrentPassword = asyncHandler(async(req,res)=>{
  const{oldPassword, newPassword} = req.body
  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid old password")
  }
  user.password = newPassword
  await user.save({validateBeforeSave:false})
  return res
  .status(200)
  .json(new ApiResponse(200,{},"password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(new ApiResponse(200,req.user,"current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullName,email} = req.body
  if(!fullName || !email){
    throw new ApiError(400,"all fields are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullname: fullName,
        email,
      }
    },
    {new:true}
  ).select("-password")

  if(!user){
    throw new ApiError(404, "User not found")
  }

  return res
  .status(200)
  .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
  const avatarLocalPath = req.files?.avatar?.[0]?.path
  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if(!avatar?.url){
    throw new ApiError(400,"Error while uploading avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar: avatar.url
      }
    },
    {new:true}
  ).select("-password")

  if(!user){
    throw new ApiError(404, "User not found")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"User Avatar Image updated successfully")
  )
})
const updateCoverImage = asyncHandler(async(req,res)=>{
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path
  if(!coverImageLocalPath){
    throw new ApiError(400,"Cover image is missing")
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  if(!coverImage?.url){
    throw new ApiError(400,"Error while uploading cover image")
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage:coverImage.url
      }
    },
    {new:true}
  ).select("-password")

  if(!user){
    throw new ApiError(404, "User not found")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"User cover image updated successfully")
  )
})
const getUserChannelProfile = asyncHandler(async(req,res)=>{
  const{username} = req.params
  if(!username?.trim()){
    throw new ApiError(400,"username is missing")
  }
  const channel = await User.aggregate([
    {
      $match:{
        username:username?.toLowerCase()
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"

      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size:"$subscribers"
        },
        channelsSubscribedToCount:{
          $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            if:{$in:[req.user?._id,"$subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project:{
        fullname:1,
        username:1,
        subscribersCount:1,
        channelsSubscribedToCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1,
      }
    }
  ])
  if(!channel?.length){
    throw new ApiError(404,"Channel does not exist")
  }
  return res
  .status(200)
  .json(
    new ApiResponse(200,channel[0],"Channel profile fetched successfully")
  )


})
const getWatchHistory = asyncHandler(async(req,res)=>{
  const user = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
  ])
  return res
  .status(200)
  .json(
    new ApiResponse(200,user[0].watchHistory,"User watch history fetched successfully")
  )
  
})

export { registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
  getUserChannelProfile,
  getWatchHistory,
  updateCoverImage,
  updateAccountDetails

 };