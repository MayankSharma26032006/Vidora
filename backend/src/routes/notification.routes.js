import { Router } from "express"
import {
    getNotifications,
    getUnreadCount,
    markAllRead
} from "../controllers/notification.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { addSSEClient, removeSSEClient } from "../utils/realtime.js"

const router = Router()

// All notification routes are private
router.use(verifyJWT)

// Real-time push: keeps the connection open and streams an event every time
// this user's notifications change (create / remove / mark-as-read).
router.route("/stream").get((req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        // tells proxies not to buffer the stream
        "X-Accel-Buffering": "no",
    })
    // reconnect after 3s if the connection drops (built into EventSource)
    res.write(`retry: 3000\n\n`)

    addSSEClient(req.user._id, res)

    // heartbeat every 25s so idle connections aren't killed by proxies
    const heartbeat = setInterval(() => {
        try {
            res.write(`: ping\n\n`)
        } catch {
            // connection died; close handler cleans up
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
