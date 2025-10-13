const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const { initializeSocket } = require("./config/socket");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

//Running middleware
app.use(
    cors({
        origin: "http://localhost:5173", // Vite default port
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 5000;

//Routes
const userRoutes = require("./routes/userRoutes");
const sessionRoutes = require("./routes/sessionRoutes");

app.use("/api/users", userRoutes);
app.use("/api/sessions", sessionRoutes);

async function startServer() {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Socket.IO is ready for connections`);
        });
    } catch (error) {
        console.error("Failed to start server", error);
    }
}

startServer();
