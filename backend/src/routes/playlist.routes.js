import { Router } from "express"
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
// DELIBERATE DECISION: playlist creation (POST /) is NOT gated by
// requireVerifiedEmail. Unlike videos/comments/posts, playlists are private
// organizational tools with no public spam surface, so verification adds
// friction without meaningful protection. Revisit only if playlists ever
// become publicly shareable.

const router = Router()

router.use(verifyJWT)

router.route("/").post(createPlaylist)
router.route("/user/:userId").get(getUserPlaylists)
router.route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist)
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist)

export default router