require("dotenv").config();
const mongoose = require("mongoose");

const mongoUri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/taskflow";

async function connectDatabase() {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully!");
}

module.exports = { connectDatabase };
