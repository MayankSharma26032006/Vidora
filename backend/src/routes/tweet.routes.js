import { Router } from "express"
import {
    getAllTweets,
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
} from "../controllers/tweet.controller.js"
import { verifyJWT, requireVerifiedEmail } from "../middlewares/auth.middleware.js"

const router = Router()

// Gated: posts are publicly visible (spam vector).
router.route("/").get(getAllTweets).post(verifyJWT, requireVerifiedEmail, createTweet)
router.route("/user/:userId").get(getUserTweets)
router.route("/:tweetId").patch(verifyJWT, updateTweet).delete(verifyJWT, deleteTweet)

export default router