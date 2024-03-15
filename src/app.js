import cookieParser from "cookie-parser"
import express from "express"
import cors from "cors"

const app = express()
// middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
// forms data url request etc
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// routes import
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import playlistRouter from "./routes/playlist.routes.js"


// routes declare
app.use("/api/v1/users", userRouter) // prefix will be /users
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/tweet", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/playlist", playlistRouter)



export { app }