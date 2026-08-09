import { Router } from "express"
import {
    getAllTweets,
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
} from "../controllers/tweet.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()


router.route("/").get(getAllTweets).post(verifyJWT, createTweet)
router.route("/user/:userId").get(getUserTweets)
router.route("/:tweetId").patch(verifyJWT, updateTweet).delete(verifyJWT, deleteTweet)

export default router