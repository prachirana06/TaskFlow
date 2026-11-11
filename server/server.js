require("dotenv").config();
const express = require("express");

//for otp api 
const crypto = require("crypto");
const { sendOtpEmail } = require("./emailService");

const cors = require("cors");
const db = require("./database");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authenticateToken = require("./authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());



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

        const existingUser = db.prepare(
            "SELECT id FROM users WHERE email = ?"
        ).get(cleanEmail);

        if (existingUser) {
            return res.status(400).json({
                message: "This email is already registered. Please login."
            });
        }

        const previousOtp = db.prepare(`
            SELECT created_at FROM email_otps
            WHERE email = ? AND purpose = 'register'
            ORDER BY id DESC LIMIT 1
        `).get(cleanEmail);

        if (previousOtp &&
            Math.floor(Date.now() / 1000) - previousOtp.created_at < 60) {
            return res.status(429).json({
                message: "Please wait 60 seconds before requesting another OTP."
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
        const hashedPassword = await bcrypt.hash(password, 10);

        db.prepare(`
            DELETE FROM email_otps
            WHERE email = ? AND purpose = 'register'
        `).run(cleanEmail);

        db.prepare(`
            INSERT INTO email_otps
            (email, purpose, otp_hash, name, password, expires_at)
            VALUES (?, 'register', ?, ?, ?, ?)
        `).run(
            cleanEmail,
            otpHash,
            cleanName,
            hashedPassword,
            Date.now() + 5 * 60 * 1000
        );

        try {
            await sendOtpEmail(cleanEmail, otp, "verify your email address");
        } catch (emailError) {
            db.prepare(`
                DELETE FROM email_otps
                WHERE email = ? AND purpose = 'register'
            `).run(cleanEmail);

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

app.post("/register/verify-otp", (req, res) => {
    try {
        const { email, otp } = req.body;
        const cleanEmail = email?.trim().toLowerCase();

        if (!cleanEmail || !/^\d{6}$/.test(otp || "")) {
            return res.status(400).json({
                message: "Please enter a valid 6-digit OTP."
            });
        }

        const record = db.prepare(`
            SELECT * FROM email_otps
            WHERE email = ? AND purpose = 'register'
            ORDER BY id DESC LIMIT 1
        `).get(cleanEmail);

        if (!record) {
            return res.status(400).json({
                message: "OTP not found. Please request a new OTP."
            });
        }

        if (Date.now() > record.expires_at) {
            db.prepare("DELETE FROM email_otps WHERE id = ?").run(record.id);

            return res.status(400).json({
                message: "OTP expired. Please request a new one."
            });
        }

        if (record.attempts >= 5) {
            db.prepare("DELETE FROM email_otps WHERE id = ?").run(record.id);

            return res.status(429).json({
                message: "Too many incorrect attempts. Please request a new OTP."
            });
        }

        const submittedHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        const isValid = crypto.timingSafeEqual(
            Buffer.from(submittedHash, "hex"),
            Buffer.from(record.otp_hash, "hex")
        );

        if (!isValid) {
            db.prepare(`
                UPDATE email_otps
                SET attempts = attempts + 1
                WHERE id = ?
            `).run(record.id);

            return res.status(400).json({
                message: "Incorrect OTP. Please try again."
            });
        }

        const createUser = db.transaction(() => {
            return db.prepare(`
                INSERT INTO users
                (name, email, password, is_verified)
                VALUES (?, ?, ?, 1)
            `).run(
                record.name,
                cleanEmail,
                record.password
            );
        });

        const result = createUser();

        db.prepare("DELETE FROM email_otps WHERE id = ?").run(record.id);

        res.status(201).json({
            message: "Email verified and account created successfully!",
            userId: result.lastInsertRowid
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

        const user = db.prepare(
            "SELECT id FROM users WHERE email = ? AND is_verified = 1"
        ).get(cleanEmail);

        // Generic response to avoid revealing whether an account exists
        if (!user) {
            return res.json({
                message: "If your account exists, a reset OTP has been sent."
            });
        }

        const previousOtp = db.prepare(`
            SELECT created_at FROM email_otps
            WHERE email = ? AND purpose = 'reset'
            ORDER BY id DESC LIMIT 1
        `).get(cleanEmail);

        if (
            previousOtp &&
            Math.floor(Date.now() / 1000) - previousOtp.created_at < 60
        ) {
            return res.status(429).json({
                message: "Please wait 60 seconds before requesting another OTP."
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();

        const otpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        db.prepare(`
            DELETE FROM email_otps
            WHERE email = ? AND purpose = 'reset'
        `).run(cleanEmail);

        db.prepare(`
            INSERT INTO email_otps
            (email, purpose, otp_hash, name, password, expires_at)
            VALUES (?, 'reset', ?, '', '', ?)
        `).run(
            cleanEmail,
            otpHash,
            Date.now() + 5 * 60 * 1000
        );

        try {
            await sendOtpEmail(cleanEmail, otp, "reset your password");
        } catch (emailError) {
            db.prepare(`
                DELETE FROM email_otps
                WHERE email = ? AND purpose = 'reset'
            `).run(cleanEmail);

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

        const record = db.prepare(`
            SELECT * FROM email_otps
            WHERE email = ? AND purpose = 'reset'
            ORDER BY id DESC LIMIT 1
        `).get(cleanEmail);

        if (!record) {
            return res.status(400).json({
                message: "OTP not found. Please request a new OTP."
            });
        }

        if (Date.now() > record.expires_at) {
            db.prepare(
                "DELETE FROM email_otps WHERE id = ?"
            ).run(record.id);

            return res.status(400).json({
                message: "OTP expired. Please request a new one."
            });
        }

        if (record.attempts >= 5) {
            db.prepare(
                "DELETE FROM email_otps WHERE id = ?"
            ).run(record.id);

            return res.status(429).json({
                message: "Too many incorrect attempts. Request a new OTP."
            });
        }

        const submittedHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        const isValid = crypto.timingSafeEqual(
            Buffer.from(submittedHash, "hex"),
            Buffer.from(record.otp_hash, "hex")
        );

        if (!isValid) {
            db.prepare(`
                UPDATE email_otps
                SET attempts = attempts + 1
                WHERE id = ?
            `).run(record.id);

            return res.status(400).json({
                message: "Incorrect OTP. Please try again."
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = db.prepare(`
            UPDATE users
            SET password = ?
            WHERE email = ? AND is_verified = 1
        `).run(hashedPassword, cleanEmail);

        if (result.changes === 0) {
            return res.status(400).json({
                message: "Account not found."
            });
        }

        db.prepare(
            "DELETE FROM email_otps WHERE id = ?"
        ).run(record.id);

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
        const user = db.prepare(`
            SELECT * FROM users
            WHERE email = ?
        `).get(email);

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
                userId: user.id
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
                id: user.id,
                name: user.name,
                email: user.email
            }

        });

    } catch (error) {

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


app.post("/tasks", authenticateToken, (req, res) => {
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

        const result = db.prepare(`
            INSERT INTO tasks
            (user_id, title, description, priority, status, due_date)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            userId,
            title.trim(),
            description || "",
            priority,
            status,
            dueDate || ""
        );

        res.status(201).json({
            message: "Task created successfully",
            taskId: result.lastInsertRowid
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


app.get("/tasks", authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;

        const tasks = db.prepare(`
            SELECT * FROM tasks
            WHERE user_id = ?
            ORDER BY created_at DESC
        `).all(userId);

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


app.put("/tasks/:id", authenticateToken, (req, res) => {
    try {
        const {
            title,
            description,
            priority,
            status,
            dueDate
        } = req.body;

        const id = Number(req.params.id);
        const userId = req.user.userId;

        // Validate task ID
        if (!Number.isInteger(id) || id <= 0) {
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

        const result = db.prepare(`
            UPDATE tasks
            SET title = ?,
                description = ?,
                priority = ?,
                status = ?,
                due_date = ?
            WHERE id = ?
            AND user_id = ?
        `).run(
            title.trim(),
            description || "",
            priority,
            status,
            dueDate || "",
            id,
            userId
        );

        if (result.changes === 0) {
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


app.delete("/tasks/:id", authenticateToken, (req, res) => {
    try {
        const id = Number(req.params.id);
        const userId = req.user.userId;

        // Validate task ID
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid task ID."
            });
        }

        const result = db.prepare(`
            DELETE FROM tasks
            WHERE id = ?
            AND user_id = ?
        `).run(id, userId);

        if (result.changes === 0) {
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

app.listen(5000, () => {

    console.log("Server running on port 5000");

});