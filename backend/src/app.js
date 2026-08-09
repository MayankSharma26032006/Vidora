import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import fs from 'fs'

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

// Automated tests fire hundreds of requests from one IP, so rate limiting is
// skipped in the test environment (Vitest sets NODE_ENV=test automatically).
const isTest = process.env.NODE_ENV === 'test'

// Trust the first hop when deployed behind a reverse proxy (Render/Railway/
// NGINX) so rate limiting sees the real client IP. Only enabled in production
// to avoid trusting arbitrary proxies in local development.
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1)
}

// ---------- security headers ----------
// crossOriginResourcePolicy must allow cross-origin access: the frontend loads
// media from Cloudinary and opens a cross-origin EventSource (notifications).
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}))

// ---------- CORS ----------
// Allow every origin listed in CORS_ORIGIN (comma-separated, e.g.
// "http://localhost:5173,https://vidora.example.com").
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

app.use(cors({
    origin(origin, callback) {
        // requests without an Origin header (curl, Postman, server-to-server)
        // are not browser CORS requests and pass through
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }
        // disallowed origins get no CORS headers; the browser blocks them
        return callback(null, false)
    },
    credentials: true
}))

// ---------- rate limiting ----------
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000
// generous general guard: a browsing session fires several requests per page
// view, so keep this high enough to never bother real users (tune via env)
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 600
const AUTH_RATE_LIMIT_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX) || 20

const tooManyRequests = {
    statusCode: 429,
    message: 'Too many requests, please try again later.',
    success: false
}

// strict limiter for credential endpoints (brute-force protection)
const authLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyRequests
})

// general guard for the whole API
const apiLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyRequests
})

if (!isTest) {
    app.use('/api/v1/user/login', authLimiter)
    app.use('/api/v1/user/register', authLimiter)
    app.use('/api/v1/user/refresh-token', authLimiter)
    // email abuse protection — same strict cap, so forgot-password /
    // resend-verification can't be used to spam an inbox or probe addresses
    app.use('/api/v1/user/forgot-password', authLimiter)
    app.use('/api/v1/user/resend-verification', authLimiter)
    app.use('/api', apiLimiter)
}

// middlewares
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
// Express 5 leaves req.body undefined when nothing was parsed (e.g. a POST
// with no content-type). Normalize to {} so controllers can destructure safely
// and report proper 4xx errors instead of crashing with a 500.
app.use((req, res, next) => {
  if (!req.body) req.body = {}
  next()
})
// NOTE: no express.static for "public" — multer's temp files live in the OS
// temp dir now, so there is nothing static to serve from the backend.
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
    // Multer already wrote files to the temp dir before the controller threw
    // (e.g. validation failed). Remove them so failed uploads don't leak files
    // and slowly fill the server disk. uploadOnCloudinary deletes its own files;
    // this catches everything that never reached it.
    const writtenFiles = []
    if (req.file?.path) writtenFiles.push(req.file.path)
    if (req.files) {
        const lists = Array.isArray(req.files) ? req.files : Object.values(req.files)
        for (const list of lists) {
            for (const f of list || []) {
                if (f?.path) writtenFiles.push(f.path)
            }
        }
    }
    for (const filePath of writtenFiles) {
        try { fs.unlinkSync(filePath) } catch { /* already gone */ }
    }

    const statusCode = err.statusCode || 500
    const message = err.message || "Internal Server Error"
    return res.status(statusCode).json({
        statusCode,
        message,
        success: false
    })
})

export default app
