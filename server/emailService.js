
require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS?.replace(/\s/g, "")
    }
});

async function sendOtpEmail(email, otp, purpose = "verify your email") {

    await transporter.sendMail({
        from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your TaskFlow Verification Code",

        html: `
            <div style="font-family: Arial; padding: 25px; background: #f7f8f0;">
                <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 12px;">
                    <h2 style="color: #104734;">TaskFlow</h2>

                    <h3>Email Verification</h3>

                    <p>Use the following OTP to ${purpose}:</p>

                    <h1 style="letter-spacing: 8px; color: #187653;">
                        ${otp}
                    </h1>

                    <p>This OTP is valid for 5 minutes.</p>

                    <p style="color: #777;">
                        If you did not request this code, please ignore this email.
                    </p>
                </div>
            </div>
        `
    });
}

module.exports = { sendOtpEmail };
