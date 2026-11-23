const mongoose = require("mongoose");

const emailOtpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        purpose: {
            type: String,
            required: true,
            enum: ["register", "reset"],
        },
        otp_hash: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            default: "",
        },
        password: {
            type: String,
            default: "",
        },
        expires_at: {
            type: Date,
            required: true,
        },
        attempts: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
        },
    }
);

module.exports = mongoose.model("EmailOtp", emailOtpSchema);
