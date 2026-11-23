
require("dotenv").config();
const mongoose = require("mongoose");

const mongoUri = process.env.MONGO_URI;

async function connectDatabase() {
    if (!mongoUri) {
        throw new Error("MONGO_URI is missing!");
    }

    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully!");
}

module.exports = { connectDatabase };
