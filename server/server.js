const express = require("express")
const http = require("http")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const path = require("path")
const connectDB = require("./config/db")
const { initializeSocket } = require("./config/socket")
require("dotenv").config()

const app = express()

// Running middleware
app.use(
    cors({
        origin:
            process.env.NODE_ENV === "production"
                ? false
                : process.env.VITE_URL || "http://localhost:5173",
        credentials: true,
    })
)
app.use(express.json())
app.use(cookieParser())

// Serve static files from public directory (for client)
app.use(express.static(path.join(__dirname, "public")))

// Routes
const userRoutes = require("./routes/userRoutes")
const sessionRoutes = require("./routes/sessionRoutes")

app.use("/api/users", userRoutes)
app.use("/api/sessions", sessionRoutes)

// Catch-all handler: send back index.html for any non-API routes (for SPA)
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"))
})

const PORT = process.env.PORT || 5000

let dbPromise
const ensureDB = () => {
    if (!dbPromise) {
        dbPromise = connectDB().catch((err) => {
            console.error("Mongo connection error:", err)
            dbPromise = undefined
            throw err
        })
    }
    return dbPromise
}

module.exports = async (req, res) => {
    await ensureDB()
    return app(req, res)
}

if (require.main === module) {
    const server = http.createServer(app)
    initializeSocket(server)
    ;(async () => {
        try {
            await ensureDB()
            server.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`)
                console.log(`Socket.IO is ready for connections`)
            })
        } catch (error) {
            console.error("Failed to start server", error)
        }
    })()
}
