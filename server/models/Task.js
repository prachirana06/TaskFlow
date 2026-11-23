const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        priority: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
        },
        dueDate: {
            type: String,
            default: "",
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

module.exports = mongoose.model("Task", taskSchema);
