require("dotenv").config()
const mongoose = require("mongoose")

let isConnecting

const connectDB = async () => {
    // Reuse existing connection
    if (mongoose.connection.readyState === 1) {
        return
    }
    if (!isConnecting) {
        const uri = process.env.DATABASE_NAME
            ? `${process.env.MONGO_URI}/${process.env.DATABASE_NAME}`
            : process.env.MONGO_URI
        isConnecting = mongoose
            .connect(uri)
            .then(() => {
                console.log("MongoDB Connected")
            })
            .catch((err) => {
                isConnecting = undefined
                throw err
            })
    }
    return isConnecting
}

module.exports = connectDB
