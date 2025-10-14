const { Server } = require("socket.io");
const Session = require("../models/session");

// Store active users and connections
const activeUsers = new Map(); // roomId -> Map of userId -> user objects
const userSockets = new Map(); // userId -> socketId

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.VITE_URL || "http://localhost:5173",
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // Join a room
        socket.on("join-room", async ({ roomId, user }) => {
            socket.join(roomId);

            // Track active users
            if (!activeUsers.has(roomId)) {
                activeUsers.set(roomId, new Map());
            }

            const userInfo = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                socketId: socket.id,
            };

            // Use userId as key to avoid duplicate objects
            activeUsers.get(roomId).set(user.id, userInfo);
            userSockets.set(user.id, socket.id);

            // Update database participant count
            try {
                const session = await Session.findOne({ roomId });
                if (session && !session.participants.includes(user.id)) {
                    session.participants.push(user.id);
                    await session.save();
                }
            } catch (error) {
                console.error("Error updating session participants:", error);
            }

            // Notify all users in the room
            const users = Array.from(activeUsers.get(roomId).values());
            io.to(roomId).emit("users-in-room", users);

            // Broadcast to others that a new user joined
            socket.to(roomId).emit("user-joined", {
                user: {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                },
            });
        });

        // Leave a room
        socket.on("leave-room", async ({ roomId, userId }) => {
            socket.leave(roomId);

            // Remove user from active users
            if (activeUsers.has(roomId)) {
                const users = activeUsers.get(roomId);
                const leavingUser = users.get(userId);

                if (leavingUser) {
                    users.delete(userId);
                    userSockets.delete(userId);

                    // Don't remove from database participants - keep session history
                    // Users will still see sessions they've joined in "Your Sessions"

                    // Notify remaining users
                    const remainingUsers = Array.from(users.values());
                    io.to(roomId).emit("users-in-room", remainingUsers);
                    io.to(roomId).emit("user-left", {
                        user: {
                            id: leavingUser.id,
                            name: leavingUser.name,
                            role: leavingUser.role,
                        },
                    });
                }

                // Clean up empty rooms
                if (users.size === 0) {
                    activeUsers.delete(roomId);
                }
            }
        });

        // Code change event
        socket.on("code-change", ({ roomId, code, userId }) => {
            console.log(`Code change from user ${userId} in room ${roomId}`);
            socket.to(roomId).emit("code-update", { code, userId });
        });

        // Language change event
        socket.on("language-change", ({ roomId, language, userId }) => {
            console.log(
                `Language change to ${language} from user ${userId} in room ${roomId}`
            );
            socket.to(roomId).emit("language-update", { language, userId });
        });

        // Code execution event
        socket.on("code-execution", ({ roomId, output, executionTime }) => {
            io.to(roomId).emit("execution-result", { output, executionTime });
        });

        // Raise hand event
        socket.on("raise-hand", ({ roomId, userId }) => {
            io.to(roomId).emit("hand-raised", { userId });
            // Notify all TAs
            io.emit("ta-notification", { roomId, userId });
        });

        // Lower hand event
        socket.on("lower-hand", ({ roomId, userId }) => {
            io.to(roomId).emit("hand-lowered", { userId });
        });

        // Mute user event
        socket.on("mute-user", ({ roomId, userId }) => {
            io.to(roomId).emit("user-muted", { userId });
        });

        // Unmute user event
        socket.on("unmute-user", ({ roomId, userId }) => {
            io.to(roomId).emit("user-unmuted", { userId });
        });

        // Disconnect event
        socket.on("disconnect", async () => {
            console.log("User disconnected:", socket.id);

            // Remove user from all rooms
            for (const [roomId, users] of activeUsers.entries()) {
                const userArray = Array.from(users.values());
                const disconnectedUser = userArray.find(
                    (u) => u.socketId === socket.id
                );

                if (disconnectedUser) {
                    users.delete(disconnectedUser.id);
                    userSockets.delete(disconnectedUser.id);

                    // Don't remove from database participants - keep session history
                    // Users will still see sessions they've joined in "Your Sessions"

                    // Notify remaining users
                    const remainingUsers = Array.from(users.values());
                    io.to(roomId).emit("users-in-room", remainingUsers);
                    io.to(roomId).emit("user-left", {
                        user: {
                            id: disconnectedUser.id,
                            name: disconnectedUser.name,
                            role: disconnectedUser.role,
                        },
                    });
                }

                // Clean up empty rooms
                if (users.size === 0) {
                    activeUsers.delete(roomId);
                }
            }
        });
    });

    return io;
};

// Helper function to get active users count for a room
const getActiveUsersCount = (roomId) => {
    if (!activeUsers.has(roomId)) {
        return 0;
    }
    return activeUsers.get(roomId).size;
};

// Helper function to get all active user counts
const getAllActiveUserCounts = () => {
    const counts = {};
    for (const [roomId, users] of activeUsers.entries()) {
        counts[roomId] = users.size;
    }
    return counts;
};

module.exports = {
    initializeSocket,
    getActiveUsersCount,
    getAllActiveUserCounts,
};
