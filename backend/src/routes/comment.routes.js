import { Router } from "express"
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js"
import { verifyJWT, optionalAuth } from "../middlewares/auth.middleware.js"

const router = Router()

// Reading comments is public (optional auth so private videos stay hidden) —
// only writes require auth
router.route("/:videoId").get(optionalAuth, getVideoComments).post(verifyJWT, addComment)
router.route("/c/:commentId").patch(verifyJWT, updateComment).delete(verifyJWT, deleteComment)

export default router 
