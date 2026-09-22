import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import{User} from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose, { isValidObjectId } from "mongoose";
import crypto from "crypto";
import { sendMail, isEmailDeliveryConfigured } from "../utils/emailSender.js";




const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (email) => EMAIL_RE.test((email || "").trim());



const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;



const MIN_PASSWORD_LENGTH = 8;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
};


// OTP validity: 30 minutes. A 6-digit code on a public (rate-limited but
// still guessable) endpoint should not stay valid for a full day; a fresh
// one can be re-issued in seconds. See expiry_minutes in the email template.
const VERIFY_TOKEN_TTL_MS = 30 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// Failed OTP verification attempts allowed before the code is invalidated
// (tracked per-email on the user document, not per-IP).
const VERIFY_OTP_MAX_ATTEMPTS = 5;

// Minimum gap between two issued codes (resend cooldown). Fresh
// registrations are never throttled by this.
const OTP_ISSUANCE_COOLDOWN_MS = 60 * 1000;

// Resend cap: max resends per email within a rolling window. Protects the
// email provider's quota and real inboxes from slow-drip abuse.
const RESEND_MAX_COUNT = 5;
const RESEND_WINDOW_MS = 15 * 60 * 1000;

const getFrontendUrl = () => process.env.FRONTEND_URL || "http://localhost:5173"




// ── Single "issue an OTP" code path ──────────────────────────────────────
// Used by BOTH registration and every resend flow. This is what guarantees
// the failed-attempt counter is reset whenever a fresh code supersedes an
// old one — a user can never be locked out by attempts made against a code
// that has already been re-issued, because there is no alternate issuance
// path that could skip the reset.
//
// throwOnSend: false → mail failures are logged and swallowed (used during
// registration so signup never fails because of the mail provider).
// true → mail/provider errors propagate (429 from cooldown/cap included).
// sendEmail: false → persist the code and return it WITHOUT delivering;
// registration uses this so the code is stored deterministically before the
// 201 response, then triggers delivery itself in the background.
const issueVerificationCode = async (user, { throwOnSend = false, sendEmail = true } = {}) => {
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const now = Date.now();
  const lastIssued = user.verificationLastIssuedAt?.getTime?.() || 0;

  // Rolling resend window bookkeeping (shared by both resend endpoints).
  let resendCount = user.verificationResendCount || 0;
  let resendWindowStart = user.verificationResendWindowStart;
  if (!resendWindowStart || now - resendWindowStart.getTime() > RESEND_WINDOW_MS) {
    resendCount = 0;
    resendWindowStart = new Date(now);
  }

  // Cooldown between two codes.
  if (lastIssued && now - lastIssued < OTP_ISSUANCE_COOLDOWN_MS) {
    if (throwOnSend) {
      throw new ApiError(429, "Please wait a minute before requesting a new code.");
    }
    return { throttled: true };
  }

  // Total-resend cap (per email, rolling window). The very first issuance —
  // registration — is exempt: the cap exists to stop slow-drip abuse of the
  // resend endpoints, not to penalize fresh signups.
  if (lastIssued && resendCount >= RESEND_MAX_COUNT) {
    if (throwOnSend) {
      throw new ApiError(429, "Too many codes requested. Try again later.");
    }
    return { throttled: true };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  user.emailVerificationToken = code;
  user.emailVerificationTokenExpiry = new Date(now + VERIFY_TOKEN_TTL_MS);
  // A fresh code invalidates any lockout accumulated against the old one.
  user.emailVerificationAttempts = 0;
  user.verificationResendCount = lastIssued ? resendCount + 1 : 0;
  user.verificationResendWindowStart = resendWindowStart;
  user.verificationLastIssuedAt = new Date(now);
  await user.save({ validateBeforeSave: false });

  // Registration path: the code is persisted (above); delivery is the
  // caller's job, run in the background.
  if (!sendEmail) return { throttled: false, code };

  try {
    await sendVerificationEmail(user, code);
  } catch (mailError) {
    console.error("Failed to send verification email:", mailError?.message);
    if (throwOnSend) throw mailError;
  }
  return { throttled: false, code };
};

// Email-crafting for verification codes — kept separate from issuance so
// registration can persist the code synchronously and send mail in the
// background (a slow provider must never delay or fail signup).
const sendVerificationEmail = async (user, code) => {
  const expiryMinutes = Math.round(VERIFY_TOKEN_TTL_MS / 60000);
  await sendMail({
    to: user.email,
    subject: "Verify your VidOra account",
    text: `Hi ${user.fullname},\n\nYour VidOra verification code is:\n\n${code}\n\nEnter it on the site within ${expiryMinutes} minutes, or click the link below:\n${getFrontendUrl()}/verify-email?token=${code}\n\nIf you didn't create this account, you can ignore this email.`,
    html: `<p>Hi ${user.fullname},</p><p>Your VidOra verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px;">${code}</p><p>Enter it on the site within ${expiryMinutes} minutes, or <a href="${getFrontendUrl()}/verify-email?token=${code}">click here to verify</a>.</p><p>If you didn't create this account, you can ignore this email.</p>`,
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

  
  
  
  // Same issuance path as resends — resets the attempt counter and is never
  // throttled for a brand-new account. The code is PERSISTED BEFORE the 201
  // is returned so the OTP screen (and any client flow) can rely on it
  // existing the moment signup succeeds; only the mail send runs in the
  // background so a slow provider can never delay or fail registration.
  const freshUser = await User.findById(createdUser._id);
  const { code: freshCode } = await issueVerificationCode(freshUser, { sendEmail: false });
  if (freshCode) {
    sendVerificationEmail(freshUser, freshCode).catch((mailError) => {
      console.error("Failed to send verification email:", mailError?.message);
    });
  }

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
          // True when any real delivery provider (Resend / EmailJS / SMTP) is
          // configured — drives the "verify your email" banner visibility.
          smtpConfigured: isEmailDeliveryConfigured(),
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
  .json(new ApiResponse(200,{ ...req.user.toObject(), smtpConfigured: isEmailDeliveryConfigured() },"current user fetched successfully"))
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
  const { token, code, email } = req.body
  if(!token && !code){
    throw new ApiError(400,"Verification token or code is required")
  }

  // Link flow: { token } uniquely identifies the user, so no email is needed.
  // OTP flow: { email, code } — the email pins the attempt counter to a
  // single user so a failed attempt against one account can't affect others.
  let user
  if (token) {
    user = await User.findOne({ emailVerificationToken: token })
  } else {
    if(!email || !isValidEmail(email)){
      throw new ApiError(400,"A valid email address is required to verify a code")
    }
    user = await User.findOne({ email: email.trim().toLowerCase() })
  }

  if(!user || !user.emailVerificationToken){
    throw new ApiError(400,"Invalid or expired verification token")
  }
  // Lockout check FIRST: once VERIFY_OTP_MAX_ATTEMPTS wrong codes have been
  // consumed, every subsequent OTP attempt — even one carrying the CORRECT
  // code — is rejected with 429 until a fresh code is issued (any resend
  // resets the counter). The token is deliberately kept in place so the
  // client sees a consistent "locked, request a new code" status instead of
  // a 400 that could be mistaken for a typo. The email-link flow (token)
  // still works after lockout: it carries the same secret delivered to the
  // same inbox, so it proves possession just as strongly.
  if (!token && code && (user.emailVerificationAttempts || 0) >= VERIFY_OTP_MAX_ATTEMPTS) {
    throw new ApiError(429, "Too many attempts. Request a new code.")
  }
  if (code && !token && user.emailVerificationToken !== String(code).trim()) {
    // Wrong code for this account → count the attempt.
    const attempts = (user.emailVerificationAttempts || 0) + 1
    if (attempts >= VERIFY_OTP_MAX_ATTEMPTS) {
      // Lockout point. 429 (not 400/401) so the frontend can treat this
      // like any other rate-limit case and offer a resend.
      user.emailVerificationAttempts = attempts
      await user.save({ validateBeforeSave: false })
      throw new ApiError(429, "Too many attempts. Request a new code.")
    }
    user.emailVerificationAttempts = attempts
    await user.save({ validateBeforeSave: false })
    throw new ApiError(400, "Invalid or expired verification token")
  }
  if(user.emailVerificationTokenExpiry && user.emailVerificationTokenExpiry < new Date()){
    throw new ApiError(400,"Verification token has expired")
  }
  user.isEmailVerified = true
  user.emailVerificationToken = ""
  user.emailVerificationTokenExpiry = null
  user.emailVerificationAttempts = 0
  await user.save({ validateBeforeSave: false })
  return res
    .status(200)
    .json(new ApiResponse(200, { isEmailVerified: true }, "Email verified successfully"))
})

// Logged-in resend (used by the in-app banner after login).
const resendVerification = asyncHandler(async(req,res)=>{
  const user = await User.findById(req.user?._id)
  if(!user){
    throw new ApiError(404,"User not found")
  }
  if(user.isEmailVerified){
    throw new ApiError(400,"Email is already verified")
  }
  await issueVerificationCode(user, { throwOnSend: true })
  return res
    .status(200)
    .json(new ApiResponse(200,{},"Verification email sent. Check your inbox."))
})

// Pre-login resend for the OTP screen: identified by email only. Always
// returns a generic 200 for unknown/verified addresses so the endpoint can't
// be used to enumerate which emails have accounts.
const resendVerificationCode = asyncHandler(async(req,res)=>{
  const { email } = req.body
  if(!email || !isValidEmail(email)){
    throw new ApiError(400,"A valid email address is required")
  }
  const user = await User.findOne({ email: email.trim().toLowerCase() })
  if(!user || user.isEmailVerified){
    return res
      .status(200)
      .json(new ApiResponse(200,{},"If that email has an unverified account, a new code has been sent."))
  }
  // Same issuance path as registration (resets attempts) — plus cooldown and
  // the per-email rolling resend cap to stop slow-drip abuse of the mail
  // provider's quota or a real user's inbox.
  await issueVerificationCode(user, { throwOnSend: true })
  return res
    .status(200)
    .json(new ApiResponse(200,{},"If that email has an unverified account, a new code has been sent."))
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
  // Same pattern as registration's OTP: the token is persisted synchronously
  // (above) and the mail send runs in the BACKGROUND — a slow or hanging
  // provider must never delay (or time out) the response. Nothing downstream
  // depends on the send completing before the 200: the user acts on the link
  // from their inbox whenever it arrives. There is deliberately no
  // sendPasswordResetEmail wrapper — forgot-password is the only caller.
  sendMail({
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
  resendVerificationCode,
  forgotPassword,
  resetPassword

 };