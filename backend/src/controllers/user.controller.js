import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import{User} from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose, { isValidObjectId } from "mongoose";
import crypto from "crypto";
import { sendMail } from "../utils/mailer.js";




const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (email) => EMAIL_RE.test((email || "").trim());



const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;



const MIN_PASSWORD_LENGTH = 8;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
};


const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const getFrontendUrl = () => process.env.FRONTEND_URL || "http://localhost:5173"
const isSmtpConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);




const sendVerificationEmail = async (user) => {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  user.emailVerificationToken = code;
  user.emailVerificationTokenExpiry = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
  await user.save({ validateBeforeSave: false });
  await sendMail({
    to: user.email,
    subject: "Verify your VidOra account",
    text: `Hi ${user.fullname},\n\nYour VidOra verification code is:\n\n${code}\n\nEnter it on the site to activate your account, or click the link below:\n${getFrontendUrl()}/verify-email?token=${code}\n\nThis code expires in 24 hours.\n\nIf you didn't create this account, you can ignore this email.`,
  });
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
  
  

  const { fullName, email, username, password } = req.body;
  if (!fullName?.trim()) {
      throw new ApiError(400, "Full name is required")
  }

  if (!email?.trim()) {
      throw new ApiError(400, "Email is required")
  }

  if (!isValidEmail(email)) {
      throw new ApiError(400, "Invalid email format")
  }

  if (!password?.trim()) {
      throw new ApiError(400, "Password is required")
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
      throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  }

  if (!username?.trim()) {
      throw new ApiError(400, "Username is required")
  }
  if (!USERNAME_RE.test(username.trim())) {
      throw new ApiError(400, "Username must be 3-20 characters (letters, numbers, underscores)")
  } 
  const existedUser = await User.findOne({
    $or:[{username},{email}]
  })
  if(existedUser){
    throw new ApiError(409,"User already exists")
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path
  let coverImageLocalPath;
  if(req.files&& Array.isArray(req.files.coverImage)&&req.files.coverImage.length>0){
    coverImageLocalPath = req.files.coverImage[0].path
  }



  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath, "vidora/avatars")
  const coverImage = await uploadOnCloudinary(coverImageLocalPath, "vidora/covers")

  if(!avatar){
    
    if (coverImage?.public_id) await deleteFromCloudinary(coverImage.public_id, "image")
    throw new ApiError(400,"Avatar is required")
  }
  let user
  try {
    user = await User.create({
      fullname: fullName,
      avatar: avatar.url,
      avatarPublicId: avatar.public_id,
      coverImage: coverImage?.url || "",
      coverImagePublicId: coverImage?.public_id || "",
      email,
      password,
      username: username.toLowerCase()
    })
  } catch (createError) {
    
    await deleteFromCloudinary(avatar.public_id, "image")
    if (coverImage?.public_id) await deleteFromCloudinary(coverImage.public_id, "image")
    
    
    if (createError?.code === 11000) {
      throw new ApiError(409, "User already exists")
    }
    throw createError
  }

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry -passwordResetToken -passwordResetTokenExpiry"
  )

  if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering")
  }

  
  
  
  sendVerificationEmail(await User.findById(createdUser._id)).catch((mailError) => {
    console.error("Failed to send verification email:", mailError?.message);
  });

  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully. Please verify your email to unlock your account.")
  )
});
const loginUser = asyncHandler(async (req, res) => {
  
  
  
  
  
  
  const { email, username, password } = req.body;
  if (!(email || username)) {
    throw new ApiError(400, "username or email is required");
  }

  if (email && !isValidEmail(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  
  
  
  const normalizedEmail = email?.trim().toLowerCase()
  const normalizedUsername = username?.trim().toLowerCase()
  const user = await User.findOne({
    $or: [{ username: normalizedUsername }, { email: normalizedEmail }]
  });
  if (!user) {
    throw new ApiError(404, "user does not exists");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry -passwordResetToken -passwordResetTokenExpiry");

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          smtpConfigured: isSmtpConfigured(),
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
      returnDocument: 'after'
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
    
    
    
    
    
    const accessToken = user.generateAccessToken()
    return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", incomingRefreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken: incomingRefreshToken },
        "Access token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }
})
const changeCurrentPassword = asyncHandler(async(req,res)=>{
  const{oldPassword, newPassword} = req.body
  if(!oldPassword || !newPassword){
    throw new ApiError(400,"Old and new password are required")
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(400, `New password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  }
  const user = await User.findById(req.user?._id)
  if(!user){
    throw new ApiError(404,"User not found")
  }
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid old password")
  }
  user.password = newPassword
  
  
  user.refreshToken = undefined
  await user.save({validateBeforeSave:false})
  return res
  .status(200)
  .json(new ApiResponse(200,{},"password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(new ApiResponse(200,{ ...req.user.toObject(), smtpConfigured: isSmtpConfigured() },"current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullName,email} = req.body
  if(!fullName || !email){
    throw new ApiError(400,"all fields are required")
  }

  if(!isValidEmail(email)){
    throw new ApiError(400,"Invalid email format")
  }

  let user
  try {
    user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set:{
          fullname: fullName,
          email,
        }
      },
      { returnDocument: 'after' }
    ).select("-password")
  } catch (updateError) {
    
    if (updateError?.code === 11000) {
      throw new ApiError(409, "Email is already in use")
    }
    throw updateError
  }

  if(!user){
    throw new ApiError(404, "User not found")
  }

  return res
  .status(200)
  .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
  
  
  const avatarLocalPath = req.file?.path || req.files?.avatar?.[0]?.path
  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
  }
  const oldAvatar = await User.findById(req.user._id).select("avatar avatarPublicId")
  const avatar = await uploadOnCloudinary(avatarLocalPath, "vidora/avatars")
  if(!avatar?.url){
    throw new ApiError(400,"Error while uploading avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar: avatar.url,
        avatarPublicId: avatar.public_id
      }
    },
    { returnDocument: 'after' }
  ).select("-password")

  if(!user){
    
    await deleteFromCloudinary(avatar.public_id, "image")
    throw new ApiError(404, "User not found")
  }

  
  if (oldAvatar?.avatarPublicId && oldAvatar.avatarPublicId !== avatar.public_id) {
    await deleteFromCloudinary(oldAvatar.avatarPublicId, "image")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"User Avatar Image updated successfully")
  )
})
const updateCoverImage = asyncHandler(async(req,res)=>{
  
  const coverImageLocalPath = req.file?.path || req.files?.coverImage?.[0]?.path
  if(!coverImageLocalPath){
    throw new ApiError(400,"Cover image is missing")
  }
  const oldCover = await User.findById(req.user._id).select("coverImage coverImagePublicId")
  const coverImage = await uploadOnCloudinary(coverImageLocalPath, "vidora/covers")
  if(!coverImage?.url){
    throw new ApiError(400,"Error while uploading cover image")
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage:coverImage.url,
        coverImagePublicId: coverImage.public_id
      }
    },
    { returnDocument: 'after' }
  ).select("-password")

  if(!user){
    
    await deleteFromCloudinary(coverImage.public_id, "image")
    throw new ApiError(404, "User not found")
  }

  
  if (oldCover?.coverImagePublicId && oldCover.coverImagePublicId !== coverImage.public_id) {
    await deleteFromCloudinary(oldCover.coverImagePublicId, "image")
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
      $lookup:{
        from:"videos",
        localField:"_id",
        foreignField:"owner",
        as:"channelVideos"

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
        videoCount:{
          $size:"$channelVideos"
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
        videoCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
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
const toggleSaveVideo = asyncHandler(async(req,res)=>{
  const { videoId } = req.params
  if(!isValidObjectId(videoId)){
    throw new ApiError(400, "Invalid video ID")
  }
  const video = await Video.findById(videoId).select("owner isPublished")
  if(!video){
    throw new ApiError(404, "Video not found")
  }
  
  
  if (!video.isPublished && video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(404, "Video not found")
  }

  const user = await User.findById(req.user._id)
  const hasSaved = user.savedVideos.some(id => id.toString() === videoId)

  if(hasSaved){
    user.savedVideos = user.savedVideos.filter(id => id.toString() !== videoId)
  } else {
    user.savedVideos.push(videoId)
  }
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, { saved: !hasSaved }, hasSaved ? "Removed from saved videos" : "Video saved successfully"))
})

const getSavedVideos = asyncHandler(async(req,res)=>{
  
  
  
  const viewerId = new mongoose.Types.ObjectId(req.user._id)
  const user = await User.aggregate([
    {
      $match:{
        _id: viewerId
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"savedVideos",
        foreignField:"_id",
        as:"savedVideos",
        pipeline:[
          {
            $match:{
              $or:[
                {isPublished:true},
                {owner:viewerId}
              ]
            }
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
      new ApiResponse(200, user[0]?.savedVideos || [], "Saved videos fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req,res)=>{
  
  
  const viewerId = new mongoose.Types.ObjectId(req.user._id)
  const user = await User.aggregate([
    {
      $match:{
        _id: viewerId
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
            $match:{
              $or:[
                {isPublished:true},
                {owner:viewerId}
              ]
            }
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

const verifyEmail = asyncHandler(async(req,res)=>{
  const { token, code } = req.body
  const verification = token || code
  if(!verification){
    throw new ApiError(400,"Verification token or code is required")
  }
  const user = await User.findOne({ emailVerificationToken: verification })
  if(!user){
    throw new ApiError(400,"Invalid or expired verification token")
  }
  if(user.emailVerificationTokenExpiry && user.emailVerificationTokenExpiry < new Date()){
    throw new ApiError(400,"Verification token has expired")
  }
  user.isEmailVerified = true
  user.emailVerificationToken = ""
  user.emailVerificationTokenExpiry = null
  await user.save({ validateBeforeSave: false })
  return res
    .status(200)
    .json(new ApiResponse(200, { isEmailVerified: true }, "Email verified successfully"))
})

const resendVerification = asyncHandler(async(req,res)=>{
  const user = await User.findById(req.user?._id)
  if(!user){
    throw new ApiError(404,"User not found")
  }
  if(user.isEmailVerified){
    throw new ApiError(400,"Email is already verified")
  }
  await sendVerificationEmail(user)
  return res
    .status(200)
    .json(new ApiResponse(200,{},"Verification email sent. Check your inbox."))
})

const forgotPassword = asyncHandler(async(req,res)=>{
  const { email } = req.body
  if(!email || !isValidEmail(email)){
    throw new ApiError(400,"A valid email address is required")
  }
  const user = await User.findOne({ email: email.trim().toLowerCase() })
  if(!user){
    
    return res
      .status(200)
      .json(new ApiResponse(200,{},"If that email is registered, a password reset link has been sent."))
  }
  const token = crypto.randomBytes(32).toString("hex")
  user.passwordResetToken = token
  user.passwordResetTokenExpiry = new Date(Date.now() + RESET_TOKEN_TTL_MS)
  await user.save({ validateBeforeSave: false })
  await sendMail({
    to: user.email,
    subject: "Reset your VidOra password",
    text: `Hi ${user.fullname},\n\nYou requested a password reset. Click the link below to choose a new password:\n${getFrontendUrl()}/reset-password?token=${token}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.`,
  }).catch((mailError) => {
    console.error("Failed to send reset email:", mailError?.message);
  })
  return res
    .status(200)
    .json(new ApiResponse(200,{},"If that email is registered, a password reset link has been sent."))
})

const resetPassword = asyncHandler(async(req,res)=>{
  const { token, newPassword } = req.body
  if(!token){
    throw new ApiError(400,"Reset token is required")
  }
  if(!newPassword || newPassword.length < MIN_PASSWORD_LENGTH){
    throw new ApiError(400, `New password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  }
  const user = await User.findOne({ passwordResetToken: token })
  if(!user){
    throw new ApiError(400,"Invalid or expired reset token")
  }
  if(user.passwordResetTokenExpiry && user.passwordResetTokenExpiry < new Date()){
    throw new ApiError(400,"Reset token has expired")
  }
  user.password = newPassword
  user.passwordResetToken = ""
  user.passwordResetTokenExpiry = null
  
  
  user.refreshToken = undefined
  await user.save({ validateBeforeSave: false })
  return res
    .status(200)
    .json(new ApiResponse(200,{},"Password reset successfully. You can now sign in."))
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
  updateAccountDetails,
  toggleSaveVideo,
  getSavedVideos,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword

 };