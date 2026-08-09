import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import fs from 'fs'


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



const isTest = process.env.NODE_ENV === 'test'




if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1)
}




app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}))




const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

app.use(cors({
    origin(origin, callback) {
        
        
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }
        
        return callback(null, false)
    },
    credentials: true
}))


const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000


const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 600
const AUTH_RATE_LIMIT_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX) || 20

const tooManyRequests = {
    statusCode: 429,
    message: 'Too many requests, please try again later.',
    success: false
}


const authLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyRequests
})


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
    
    
    app.use('/api/v1/user/forgot-password', authLimiter)
    app.use('/api/v1/user/resend-verification', authLimiter)
    app.use('/api', apiLimiter)
}


app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))



app.use((req, res, next) => {
  if (!req.body) req.body = {}
  next()
})


app.use(cookieParser())


app.use("/api/v1/user", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/notifications", notificationRouter)


app.use((err, req, res, next) => {
    
    
    
    
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
        try { fs.unlinkSync(filePath) } catch {  }
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
