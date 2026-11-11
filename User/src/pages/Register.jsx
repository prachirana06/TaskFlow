
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Register.css";

function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");

    const [otpSent, setOtpSent] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [agree, setAgree] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    // STEP 1: Send OTP
    async function registerUser(e) {
        e.preventDefault();

        if (!name.trim() || !email.trim() || !password) {
            alert("Please fill all required fields.");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        if (!agree) {
            alert("Please accept the Terms and Conditions.");
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                "https://taskflow-backend-opjd.onrender.com/register/send-otp",
                {
                    name: name.trim(),
                    email: email.trim(),
                    password: password
                }
            );

            alert(response.data.message || "OTP sent to your email!");

            setOtpSent(true);

        } catch (error) {
            console.log(error);

            alert(
                error.response?.data?.message ||
                "Unable to send OTP. Please try again."
            );

        } finally {
            setLoading(false);
        }
    }

    // STEP 2: Verify OTP
    async function verifyOtp(e) {
        e.preventDefault();

        if (!/^\d{6}$/.test(otp)) {
            alert("Please enter a valid 6-digit OTP.");
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                "https://taskflow-backend-opjd.onrender.com/register/verify-otp",
                {
                    email: email.trim(),
                    otp: otp.trim()
                }
            );

            alert(response.data.message || "Registration Successful!");

            setName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setOtp("");
            setAgree(false);
            setOtpSent(false);

            navigate("/login");

        } catch (error) {
            console.log(error);

            alert(
                error.response?.data?.message ||
                "Invalid or expired OTP."
            );

        } finally {
            setLoading(false);
        }
    }

    // RESEND OTP
    async function resendOtp() {
        try {
            setLoading(true);

            const response = await axios.post(
                "https://taskflow-backend-opjd.onrender.com/register/send-otp",
                {
                    name: name.trim(),
                    email: email.trim(),
                    password: password
                }
            );

            alert(response.data.message || "OTP sent again!");

        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Unable to resend OTP. Please try again later."
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={`register-page ${darkMode ? "dark-mode" : ""}`}>

            {/* THEME TOGGLE BUTTON */}
            <button
                className="register-theme-toggle"
                type="button"
                onClick={() => setDarkMode((previous) => !previous)}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
                {darkMode ? "☀️" : "🌙"}
            </button>

            {/* LEFT SHOWCASE SECTION */}
            <section className="register-showcase">

                <div className="register-brand">
                    <img
                        src="/logo.png"
                        alt="TaskFlow Logo"
                        className="register-logo"
                    />
                    <span>TaskFlow<span className="register-dot">.</span></span>
                </div>

                <div className="register-showcase-content">

                    <div className="register-eyebrow">
                        START SOMETHING GREAT
                    </div>

                    <h1>
                        Make room for
                        <br />
                        <span>great things.</span>
                    </h1>

                    <p className="register-description">
                        Create your account and take control of
                        your tasks, goals and everyday progress.
                    </p>

                    <div className="register-feature">
                        <div className="register-feature-icon">✓</div>
                        <div>
                            <strong>Stay organized</strong>
                            <small>Keep everything in one place</small>
                        </div>
                    </div>

                    <div className="register-feature">
                        <div className="register-feature-icon">✦</div>
                        <div>
                            <strong>Achieve more</strong>
                            <small>Turn your plans into progress</small>
                        </div>
                    </div>

                </div>

                <p className="register-footer">
                    ✦ Your productivity starts here.
                </p>

            </section>

            {/* RIGHT REGISTRATION SECTION */}
            <main className="register-main">

                <div className="register-form-container">

                    <div className="register-symbol">✦</div>

                    <p className="register-welcome">
                        {otpSent ? "EMAIL VERIFICATION" : "GET STARTED"}
                    </p>

                    <h2>
                        {otpSent ? "Verify your email" : "Create your account"}
                    </h2>

                    <p className="register-subtitle">
                        {otpSent
                            ? `We've sent a 6-digit OTP to ${email}`
                            : "Join TaskFlow and make every day productive."
                        }
                    </p>

                    {!otpSent ? (

                        <form onSubmit={registerUser}>

                            <div className="register-field">
                                <label htmlFor="register-name">Full Name</label>
                                <input
                                    id="register-name"
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoComplete="name"
                                    required
                                />
                            </div>

                            <div className="register-field">
                                <label htmlFor="register-email">Email Address</label>
                                <input
                                    id="register-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div className="register-field">
                                <label htmlFor="register-password">Password</label>

                                <div className="register-password-wrapper">
                                    <input
                                        id="register-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="new-password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="register-password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? "🙈" : "👁"}
                                    </button>
                                </div>
                            </div>

                            <div className="register-field">
                                <label htmlFor="confirm-password">
                                    Confirm Password
                                </label>

                                <div className="register-password-wrapper">
                                    <input
                                        id="confirm-password"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Re-enter your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        autoComplete="new-password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="register-password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? "🙈" : "👁"}
                                    </button>
                                </div>
                            </div>

                            <label className="register-terms">
                                <input
                                    type="checkbox"
                                    checked={agree}
                                    onChange={(e) => setAgree(e.target.checked)}
                                />
                                <span>
                                    I agree to the Terms & Conditions
                                </span>
                            </label>

                            <button
                                type="submit"
                                className="register-submit"
                                disabled={loading}
                            >
                                {loading ? "Sending OTP..." : "Send Verification OTP"}
                                {!loading && <span>→</span>}
                            </button>

                        </form>

                    ) : (

                        <form onSubmit={verifyOtp}>

                            <div className="register-field">
                                <label htmlFor="register-otp">
                                    Enter 6-Digit OTP
                                </label>

                                <input
                                    id="register-otp"
                                    type="text"
                                    placeholder="Enter your OTP"
                                    value={otp}
                                    onChange={(e) =>
                                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                                    }
                                    inputMode="numeric"
                                    maxLength={6}
                                    autoComplete="one-time-code"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="register-submit"
                                disabled={loading}
                            >
                                {loading ? "Verifying..." : "Verify OTP & Create Account"}
                                {!loading && <span>→</span>}
                            </button>

                            <p className="register-switch">
                                Didn't receive the OTP?{" "}
                                <button
                                    type="button"
                                    onClick={resendOtp}
                                    disabled={loading}
                                >
                                    Resend OTP
                                </button>
                            </p>

                            <p className="register-switch">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOtpSent(false);
                                        setOtp("");
                                    }}
                                >
                                    ← Edit registration details
                                </button>
                            </p>

                        </form>

                    )}

                    <div className="register-divider">
                        YOUR PRODUCTIVITY JOURNEY
                    </div>

                    <p className="register-switch">
                        Already have an account?
                        {" "}
                        <Link to="/login">Sign In</Link>
                    </p>

                </div>

                <p className="register-secure-note">
                    🔒 Your information is kept secure
                </p>

            </main>

        </div>
    );
}

export default Register;
