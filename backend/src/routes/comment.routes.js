import { Router } from "express"
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js"
import { verifyJWT, optionalAuth, requireVerifiedEmail } from "../middlewares/auth.middleware.js"

const router = Router()



// Gated: comments are publicly visible (spam vector).
router.route("/:videoId").get(optionalAuth, getVideoComments).post(verifyJWT, requireVerifiedEmail, addComment)
router.route("/c/:commentId").patch(verifyJWT, updateComment).delete(verifyJWT, deleteComment)

export default router 
