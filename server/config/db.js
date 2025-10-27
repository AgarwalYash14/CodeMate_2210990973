require("dotenv").config()
const mongoose = require("mongoose")

let isConnecting

const connectDB = async () => {
    // Reuse existing connection
    if (mongoose.connection.readyState === 1) {
        return
    }
    if (!isConnecting) {
        isConnecting = mongoose
            .connect(`${process.env.MONGO_URI}/${process.env.DATABASE_NAME}`)
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
