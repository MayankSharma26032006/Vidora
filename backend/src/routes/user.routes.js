import { Router } from "express";
import { loginUser, logOutUser, registerUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory, toggleSaveVideo, getSavedVideos, verifyEmail, resendVerification, forgotPassword, resetPassword } from "../controllers/user.controller.js";
import { verifyJWT, optionalAuth } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1,

        },
        {
            name:"coverImage",
            maxCount:1
        }

    ]),
    registerUser);
router.route("/login").post(loginUser);
// secured routes
router.route("/logout").post(verifyJWT, logOutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/update-cover").patch(verifyJWT, upload.single("coverImage"), updateCoverImage)
router.route("/channel-profile/:username").get(optionalAuth, getUserChannelProfile)
router.route("/watch-history").get(verifyJWT, getWatchHistory)
router.route("/saved-videos/:videoId").post(verifyJWT, toggleSaveVideo)
router.route("/saved-videos").get(verifyJWT, getSavedVideos)
router.route("/verify-email").post(verifyEmail)
router.route("/resend-verification").post(verifyJWT, resendVerification)
router.route("/forgot-password").post(forgotPassword)
router.route("/reset-password").post(resetPassword)
export default router;