import { Router } from "express"
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

// Reading comments is public — only writes require auth
router.route("/:videoId").get(getVideoComments).post(verifyJWT, addComment)
router.route("/c/:commentId").patch(verifyJWT, updateComment).delete(verifyJWT, deleteComment)

export default router 
