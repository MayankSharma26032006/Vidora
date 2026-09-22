import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

// Server-side enforcement of email verification. Client-side route guards
// alone can always be bypassed by hitting the API directly, so every
// spam-capable content-creation route checks the flag here. 403 (not 401):
// the session is valid, the account just lacks verification. See the route
// registrations for which actions are gated and why.
export const requireVerifiedEmail = asyncHandler(async (req, _, next) => {
    if (!req.user?.isEmailVerified) {
        const error = new ApiError(403, "Verify your email to continue")
        error.code = "EMAIL_NOT_VERIFIED"
        throw error
    }
    next()
})

export const verifyJWT = asyncHandler(async(req, _,next)=>{
    try {
        const token = req.cookies?.accessToken||req.header("Authorization")?.replace("Bearer ","")
        if(!token){
            throw new ApiError(401,"Unauthorized Request")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        .select("-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry -passwordResetToken -passwordResetTokenExpiry")
        if(!user){
            throw new ApiError(401,"Invalid Access Token")
        }
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401,"Invalid Access Token")
        
    }  
})



export const optionalAuth = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            req.user = undefined
            return next()
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
            .select("-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry -passwordResetToken -passwordResetTokenExpiry")
        if (!user) {
            req.user = undefined
            return next()
        }
        req.user = user
        next()
    } catch (error) {
        req.user = undefined
        next()
    }
})
