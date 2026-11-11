
require("dotenv").config();

const { sendOtpEmail } = require("./emailService");

sendOtpEmail(
    process.env.EMAIL_USER,
    "123456",
    "test your TaskFlow email connection"
)
.then(() => {
    console.log("Gmail email sent successfully!");
})
.catch((error) => {
    console.log("Email Error:", error.message);
});
