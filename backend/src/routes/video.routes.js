import { Router } from "express"
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()

router.route("/").get(getAllVideos).post(
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishAVideo
)

router.route("/:videoId").get(getVideoById).delete(verifyJWT, deleteVideo).patch(verifyJWT, togglePublishStatus)
router.route("/update/:videoId").patch(verifyJWT, upload.single("thumbnail"), updateVideo)

export default router