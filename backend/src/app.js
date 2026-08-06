import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

// routers
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import commentRouter from './routes/comment.routes.js'
import likeRouter from './routes/like.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import playlistRouter from './routes/playlist.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import notificationRouter from './routes/notification.routes.js'

const app = express()

// middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
// Express 5 leaves req.body undefined when nothing was parsed (e.g. a POST
// with no content-type). Normalize to {} so controllers can destructure safely
// and report proper 4xx errors instead of crashing with a 500.
app.use((req, res, next) => {
  if (!req.body) req.body = {}
  next()
})
app.use(express.static("public"))
app.use(cookieParser())

// routes
app.use("/api/v1/user", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/notifications", notificationRouter)

// global error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500
    const message = err.message || "Internal Server Error"
    return res.status(statusCode).json({
        statusCode,
        message,
        success: false
    })
})

export default app


