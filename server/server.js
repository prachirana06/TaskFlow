require("dotenv").config();
const express = require("express");

//for otp api
const crypto = require("crypto");
const { sendOtpEmail } = require("./emailService");

const cors = require("cors");
const mongoose = require("mongoose");
const { connectDatabase } = require("./database");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authenticateToken = require("./authMiddleware");

const User = require("./models/User");
const Task = require("./models/Task");
const EmailOtp = require("./models/EmailOtp");

const app = express();

app.use(cors());
app.use(express.json({ limit: "3mb" }));

app.use((req, res, next) => {
    if (!req.body) {
        req.body = {};
    }

    next();
});

const OTP_VALIDITY_MS = 5 * 60 * 1000;
const OTP_RESEND_WAIT_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function hashOtp(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
}

function isOtpValid(otp, storedHash) {
    const submittedHash = hashOtp(otp);

    if (submittedHash.length !== storedHash.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(submittedHash, "hex"),
        Buffer.from(storedHash, "hex")
    );
}

function isDuplicateEmailError(error) {
    return error?.code === 11000;
}


// ==========================================
// REGISTER - SEND OTP
// ==========================================

app.post("/register/send-otp", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const cleanName = name?.trim();
        const cleanEmail = email?.trim().toLowerCase();

        if (!cleanName || !cleanEmail || !password) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters."
            });
        }

        const existingUser = await User.exists({ email: cleanEmail });

        if (existingUser) {
            return res.status(400).json({
                message: "This email is already registered. Please login."
            });
        }

        const previousOtp = await EmailOtp.findOne({
            email: cleanEmail,
            purpose: "register"
        }).sort({ createdAt: -1 });

        if (
            previousOtp &&
            Date.now() - previousOtp.createdAt.getTime() < OTP_RESEND_WAIT_MS
        ) {
            return res.status(429).json({
                message: "Please wait 60 seconds before requesting another OTP."
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = hashOtp(otp);
        const hashedPassword = await bcrypt.hash(password, 10);

        await EmailOtp.deleteMany({
            email: cleanEmail,
            purpose: "register"
        });

        const otpRecord = await EmailOtp.create({
            email: cleanEmail,
            purpose: "register",
            otp_hash: otpHash,
            name: cleanName,
            password: hashedPassword,
            expires_at: new Date(Date.now() + OTP_VALIDITY_MS)
        });

        try {
            await sendOtpEmail(cleanEmail, otp, "verify your email address");
        } catch (emailError) {
            await EmailOtp.deleteOne({ _id: otpRecord._id });

            throw emailError;
        }

        res.json({
            message: "OTP sent successfully to your email."
        });

    } catch (error) {
        console.error("Send Register OTP Error:", error);

        res.status(500).json({
            message: "Unable to send OTP. Please try again."
        });
    }
});


// ==========================================
// REGISTER - VERIFY OTP
// ==========================================

app.post("/register/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;
        const cleanEmail = email?.trim().toLowerCase();

        if (!cleanEmail || !/^\d{6}$/.test(otp || "")) {
            return res.status(400).json({
                message: "Please enter a valid 6-digit OTP."
            });
        }

        const record = await EmailOtp.findOne({
            email: cleanEmail,
            purpose: "register"
        }).sort({ createdAt: -1 });

        if (!record) {
            return res.status(400).json({
                message: "OTP not found. Please request a new OTP."
            });
        }

        if (Date.now() > record.expires_at.getTime()) {
            await EmailOtp.deleteOne({ _id: record._id });

            return res.status(400).json({
                message: "OTP expired. Please request a new one."
            });
        }

        if (record.attempts >= MAX_OTP_ATTEMPTS) {
            await EmailOtp.deleteOne({ _id: record._id });

            return res.status(429).json({
                message: "Too many incorrect attempts. Please request a new OTP."
            });
        }

        if (!isOtpValid(otp, record.otp_hash)) {
            await EmailOtp.updateOne(
                { _id: record._id },
                { $inc: { attempts: 1 } }
            );

            return res.status(400).json({
                message: "Incorrect OTP. Please try again."
            });
        }

        let user;

        try {
            user = await User.create({
                name: record.name,
                email: cleanEmail,
                password: record.password,
                is_verified: true
            });
        } catch (error) {
            if (isDuplicateEmailError(error)) {
                await EmailOtp.deleteOne({ _id: record._id });

                return res.status(400).json({
                    message: "This email is already registered. Please login."
                });
            }

            throw error;
        }

        await EmailOtp.deleteOne({ _id: record._id });

        res.status(201).json({
            message: "Email verified and account created successfully!",
            userId: user._id.toString()
        });

    } catch (error) {
        console.error("Verify Register OTP Error:", error);

        res.status(500).json({
            message: "Registration failed. Please try again."
        });
    }
});



// ==========================================
// FORGOT PASSWORD - SEND OTP
// ==========================================

app.post("/forgot-password/send-otp", async (req, res) => {
    try {
        const cleanEmail = req.body.email?.trim().toLowerCase();

        if (!cleanEmail) {
            return res.status(400).json({
                message: "Email is required."
            });
        }

        const user = await User.exists({
            email: cleanEmail,
            is_verified: true
        });

        // Generic response to avoid revealing whether an account exists
        if (!user) {
            return res.json({
                message: "If your account exists, a reset OTP has been sent."
            });
        }

        const previousOtp = await EmailOtp.findOne({
            email: cleanEmail,
            purpose: "reset"
        }).sort({ createdAt: -1 });

        if (
            previousOtp &&
            Date.now() - previousOtp.createdAt.getTime() < OTP_RESEND_WAIT_MS
        ) {
            return res.status(429).json({
                message: "Please wait 60 seconds before requesting another OTP."
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = hashOtp(otp);

        await EmailOtp.deleteMany({
            email: cleanEmail,
            purpose: "reset"
        });

        const otpRecord = await EmailOtp.create({
            email: cleanEmail,
            purpose: "reset",
            otp_hash: otpHash,
            expires_at: new Date(Date.now() + OTP_VALIDITY_MS)
        });

        try {
            await sendOtpEmail(cleanEmail, otp, "reset your password");
        } catch (emailError) {
            await EmailOtp.deleteOne({ _id: otpRecord._id });

            throw emailError;
        }

        res.json({
            message: "If your account exists, a reset OTP has been sent."
        });

    } catch (error) {
        console.error("Forgot Password OTP Error:", error);

        res.status(500).json({
            message: "Unable to send OTP. Please try again."
        });
    }
});


// ==========================================
// FORGOT PASSWORD - VERIFY OTP & RESET
// ==========================================

app.post("/forgot-password/reset", async (req, res) => {
    try {
        const cleanEmail = req.body.email?.trim().toLowerCase();
        const { otp, newPassword } = req.body;

        if (!cleanEmail || !/^\d{6}$/.test(otp || "")) {
            return res.status(400).json({
                message: "Please enter a valid 6-digit OTP."
            });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters."
            });
        }

        const record = await EmailOtp.findOne({
            email: cleanEmail,
            purpose: "reset"
        }).sort({ createdAt: -1 });

        if (!record) {
            return res.status(400).json({
                message: "OTP not found. Please request a new OTP."
            });
        }

        if (Date.now() > record.expires_at.getTime()) {
            await EmailOtp.deleteOne({ _id: record._id });

            return res.status(400).json({
                message: "OTP expired. Please request a new one."
            });
        }

        if (record.attempts >= MAX_OTP_ATTEMPTS) {
            await EmailOtp.deleteOne({ _id: record._id });

            return res.status(429).json({
                message: "Too many incorrect attempts. Request a new OTP."
            });
        }

        if (!isOtpValid(otp, record.otp_hash)) {
            await EmailOtp.updateOne(
                { _id: record._id },
                { $inc: { attempts: 1 } }
            );

            return res.status(400).json({
                message: "Incorrect OTP. Please try again."
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = await User.updateOne(
            { email: cleanEmail, is_verified: true },
            { $set: { password: hashedPassword } }
        );

        if (result.matchedCount === 0) {
            return res.status(400).json({
                message: "Account not found."
            });
        }

        await EmailOtp.deleteOne({ _id: record._id });

        res.json({
            message: "Password reset successfully!"
        });

    } catch (error) {
        console.error("Password Reset Error:", error);

        res.status(500).json({
            message: "Unable to reset password. Please try again."
        });
    }
});



// ==========================================
// LOGIN API
// ==========================================

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Email se user find karna
        const user = await User.findOne({
            email: email?.trim().toLowerCase()
        });

        // User nahi mila
        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        // Password check karna
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(400).json({
                message: "Incorrect password"
            });
        }

        // JWT token banana
        const token = jwt.sign(
            {
                userId: user._id.toString()
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Login successful",
            token: token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                avatar: user.avatar || "",
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error("Login Error:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
});


function profileUser(user) {
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        createdAt: user.createdAt
    };
}

function isValidAvatar(value) {
    return (
        typeof value === "string" &&
        /^data:image\/(png|jpeg|jpg|gif|webp);base64,/.test(value) &&
        value.length <= 2200000
    );
}

app.get("/profile", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({ user: profileUser(user) });

    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({
            message: "Something went wrong"
        });
    }
});

app.put("/profile", authenticateToken, async (req, res) => {
    try {
        const { name, email, avatar, currentPassword } = req.body;

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (name !== undefined) {
            const cleanName = typeof name === "string" ? name.trim() : "";

            if (!cleanName || cleanName.length > 50) {
                return res.status(400).json({
                    message: "Name must be between 1 and 50 characters"
                });
            }

            user.name = cleanName;
        }

        if (email !== undefined) {
            const cleanEmail =
                typeof email === "string" ? email.trim().toLowerCase() : "";

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
                return res.status(400).json({
                    message: "Enter a valid email address"
                });
            }

            if (cleanEmail !== user.email) {
                const passwordMatch = await bcrypt.compare(
                    currentPassword || "",
                    user.password
                );

                if (!passwordMatch) {
                    return res.status(400).json({
                        message: "Current password is incorrect"
                    });
                }

                const existingUser = await User.findOne({
                    email: cleanEmail
                });

                if (
                    existingUser &&
                    existingUser._id.toString() !== user._id.toString()
                ) {
                    return res.status(409).json({
                        message: "Email already in use"
                    });
                }

                user.email = cleanEmail;
            }
        }

        if (avatar !== undefined) {
            if (
                avatar !== null &&
                avatar !== "" &&
                !isValidAvatar(avatar)
            ) {
                return res.status(400).json({
                    message:
                        "Profile picture must be a small PNG, JPG, GIF or WEBP image"
                });
            }

            user.avatar = avatar || "";
        }

        await user.save();

        res.json({
            message: "Profile updated successfully",
            user: profileUser(user)
        });

    } catch (error) {
        if (isDuplicateEmailError(error)) {
            return res.status(409).json({
                message: "Email already in use"
            });
        }

        console.error("Update Profile Error:", error);
        res.status(500).json({
            message: "Something went wrong"
        });
    }
});

app.put("/profile/password", authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (
            !currentPassword ||
            typeof newPassword !== "string" ||
            newPassword.length < 6
        ) {
            return res.status(400).json({
                message: "New password must be at least 6 characters"
            });
        }

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const passwordMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!passwordMatch) {
            return res.status(400).json({
                message: "Current password is incorrect"
            });
        }

        if (newPassword === currentPassword) {
            return res.status(400).json({
                message: "New password must be different"
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({
            message: "Password updated successfully"
        });

    } catch (error) {
        console.error("Update Password Error:", error);
        res.status(500).json({
            message: "Something went wrong"
        });
    }
});


// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {
    res.send("Task Manager Backend is Running!");
});


// ==========================================
// CREATE TASK
// ==========================================

app.post("/tasks", authenticateToken, async (req, res) => {
    try {
        const {
            title,
            description,
            priority,
            status,
            dueDate
        } = req.body;

        // Check title
        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                message: "Task title is required."
            });
        }

        // Check priority
        if (!priority) {
            return res.status(400).json({
                message: "Task priority is required."
            });
        }

        // Check status
        if (!status) {
            return res.status(400).json({
                message: "Task status is required."
            });
        }

        const userId = req.user.userId;

        const task = await Task.create({
            user_id: userId,
            title: title.trim(),
            description: description || "",
            priority,
            status,
            dueDate: dueDate || ""
        });

        res.status(201).json({
            message: "Task created successfully",
            taskId: task._id.toString()
        });

    } catch (error) {
        console.error("Create Task Error:", error);

        res.status(500).json({
            message: "Failed to create task."
        });
    }
});


// ==========================================
// GET TASKS
// SIRF LOGGED-IN USER KE TASKS
// ==========================================

app.get("/tasks", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const tasks = await Task.find({
            user_id: userId
        }).sort({ createdAt: -1 });

        res.status(200).json(tasks);

    } catch (error) {
        console.error("Get Tasks Error:", error);

        res.status(500).json({
            message: "Failed to fetch tasks."
        });
    }
});



// ==========================================
// UPDATE TASK
// ==========================================

app.put("/tasks/:id", authenticateToken, async (req, res) => {
    try {
        const {
            title,
            description,
            priority,
            status,
            dueDate
        } = req.body;

        const id = req.params.id;
        const userId = req.user.userId;

        // Validate task ID
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid task ID."
            });
        }

        // Validate title
        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                message: "Task title is required."
            });
        }

        // Validate priority and status
        if (!priority || !status) {
            return res.status(400).json({
                message: "Priority and status are required."
            });
        }

        const task = await Task.findOneAndUpdate(
            { _id: id, user_id: userId },
            {
                $set: {
                    title: title.trim(),
                    description: description || "",
                    priority,
                    status,
                    dueDate: dueDate || ""
                }
            },
            { returnDocument: "after", runValidators: true }
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found."
            });
        }

        res.status(200).json({
            message: "Task updated successfully."
        });

    } catch (error) {
        console.error("Update Task Error:", error);

        res.status(500).json({
            message: "Failed to update task."
        });
    }
});


// ==========================================
// DELETE TASK
// ==========================================

app.delete("/tasks/:id", authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user.userId;

        // Validate task ID
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid task ID."
            });
        }

        const task = await Task.findOneAndDelete({
            _id: id,
            user_id: userId
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found."
            });
        }

        res.status(200).json({
            message: "Task deleted successfully."
        });

    } catch (error) {
        console.error("Delete Task Error:", error);

        res.status(500).json({
            message: "Failed to delete task."
        });
    }
});


// ==========================================
// SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

connectDatabase()
    .then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });

    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
        console.error("Set MONGO_URI in server/.env (e.g. mongodb://127.0.0.1:27017/taskflow)");
        process.exit(1);
    });
