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

export { app }