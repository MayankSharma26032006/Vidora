import { Router } from "express"
import {
    getNotifications,
    getUnreadCount,
    markAllRead
} from "../controllers/notification.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { addSSEClient, removeSSEClient } from "../utils/realtime.js"

const router = Router()


router.use(verifyJWT)



router.route("/stream").get((req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        
        "X-Accel-Buffering": "no",
    })
    
    res.write(`retry: 3000\n\n`)

    addSSEClient(req.user._id, res)

    
    const heartbeat = setInterval(() => {
        try {
            res.write(`: ping\n\n`)
        } catch {
            
        }
    }, 25_000)

    res.on("close", () => {
        clearInterval(heartbeat)
        removeSSEClient(req.user._id, res)
    })
})

router.route("/").get(getNotifications)
router.route("/unread-count").get(getUnreadCount)
router.route("/read-all").patch(markAllRead)

export default router
