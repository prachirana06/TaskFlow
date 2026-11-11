
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [forgotMode, setForgotMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      alert("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "https://taskflow-backend-opjd.onrender.com/login",
        {
          email: email.trim(),
          password,
        }
      );

      const { token, user } = response.data;

      if (!token) {
        throw new Error("Login token was not received.");
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      const storage = rememberMe ? localStorage : sessionStorage;

      storage.setItem("token", token);

      if (user) {
        storage.setItem("user", JSON.stringify(user));
      }

      navigate("/dashboard");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Login failed. Please try again.";

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: SEND RESET OTP
  const sendResetOtp = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("Please enter your registered email.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "https://taskflow-backend-opjd.onrender.com/forgot-password/send-otp",
        { email: email.trim() }
      );

      alert(response.data.message);

      setOtpSent(true);
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Unable to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: VERIFY OTP AND RESET PASSWORD
  const resetPassword = async (e) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      alert("Please enter a valid 6-digit OTP.");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "https://taskflow-backend-opjd.onrender.com/forgot-password/reset",
        {
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
        }
      );

      alert(response.data.message);

      setPassword("");
      setOtp("");
      setNewPassword("");
      setConfirmNewPassword("");
      setOtpSent(false);
      setForgotMode(false);

    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Unable to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-page ${darkMode ? "dark-mode" : ""}`}>

      {/* THEME BUTTON */}
      <button
        className="theme-toggle"
        type="button"
        onClick={() => setDarkMode((previous) => !previous)}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {darkMode ? "☀️" : "🌙"}
      </button>

      {/* LEFT GREEN SECTION */}
      <section className="auth-showcase">

        <div className="auth-brand">
          <img src="/logo.png" alt="TaskFlow" className="auth-logo" />
          <span>
            TaskFlow<span className="brand-dot">.</span>
          </span>
        </div>

        <div className="auth-showcase-content">
          <div className="auth-eyebrow">YOUR WORKSPACE</div>

          <h1>
            Organize your work.
            <br />
            <span>Achieve more.</span>
          </h1>

          <p className="showcase-description">
            Manage your tasks, track your progress, and turn
            your daily goals into achievements.
          </p>

          <div className="floating-task">
            <div className="task-check">✓</div>
            <div>
              <strong>Complete your goals</strong>
              <small>Stay focused and productive</small>
            </div>
          </div>

          <div className="floating-task task-two">
            <div className="task-icon">✦</div>
            <div>
              <strong>Daily progress</strong>
              <small>One step at a time</small>
            </div>
            <span className="task-percent">85%</span>
          </div>
        </div>

        <div className="floating-orb orb-one"></div>
        <div className="floating-orb orb-two"></div>

        <p className="auth-footer">
          ✦ Your productivity starts here.
        </p>
      </section>

      {/* RIGHT SECTION */}
      <main className="auth-main">

        <div className="auth-form">

          <div className="form-symbol">✦</div>

          {!forgotMode ? (
            <>
              <p className="auth-welcome">WELCOME BACK</p>

              <h2>Sign in to TaskFlow</h2>

              <p className="auth-description">
                Enter your account details to continue.
              </p>

              <form onSubmit={handleLogin}>

                <div className="auth-field">
                  <label htmlFor="email">Email address</label>

                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="auth-field">

                  <div className="password-label">
                    <label htmlFor="password">Password</label>

                    <button
                      className="forgot-link"
                      type="button"
                      onClick={() => setForgotMode(true)}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="password-wrapper">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />

                    <button
                      className="password-toggle"
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                <label className="remember-row">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>

                <button
                  className="auth-submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                  {!loading && <span className="button-arrow">→</span>}
                </button>

              </form>

              <div className="form-divider">
                YOUR PRODUCTIVITY JOURNEY
              </div>

              <p className="auth-switch">
                Don't have an account?{" "}
                <Link to="/register">Create account</Link>
              </p>
            </>
          ) : (
            <>
              <p className="auth-welcome">ACCOUNT RECOVERY</p>

              <h2>
                {otpSent ? "Reset your password" : "Forgot password?"}
              </h2>

              <p className="auth-description">
                {otpSent
                  ? `Enter the OTP sent to ${email} and create a new password.`
                  : "Enter your registered email to receive a reset OTP."
                }
              </p>

              {!otpSent ? (
                <form onSubmit={sendResetOtp}>

                  <div className="auth-field">
                    <label htmlFor="reset-email">Email address</label>

                    <input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>

                  <button
                    className="auth-submit"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Sending OTP..." : "Send Reset OTP"}
                    {!loading && <span className="button-arrow">→</span>}
                  </button>

                </form>
              ) : (
                <form onSubmit={resetPassword}>

                  <div className="auth-field">
                    <label htmlFor="reset-otp">6-Digit OTP</label>

                    <input
                      id="reset-otp"
                      type="text"
                      placeholder="Enter OTP"
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

                  <div className="auth-field">
                    <label htmlFor="new-password">New Password</label>

                    <div className="password-wrapper">
                      <input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                      />

                      <button
                        className="password-toggle"
                        type="button"
                        onClick={() => setShowNewPassword((previous) => !previous)}
                      >
                        {showNewPassword ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>

                  <div className="auth-field">
                    <label htmlFor="confirm-new-password">
                      Confirm New Password
                    </label>

                    <input
                      id="confirm-new-password"
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <button
                    className="auth-submit"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Resetting Password..." : "Reset Password"}
                    {!loading && <span className="button-arrow">→</span>}
                  </button>

                  <p className="auth-switch">
                    Didn't receive OTP?{" "}
                    <button
                      type="button"
                      className="forgot-link"
                      onClick={sendResetOtp}
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  </p>

                </form>
              )}

              <p className="auth-switch">
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => {
                    setForgotMode(false);
                    setOtpSent(false);
                    setOtp("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                  }}
                >
                  ← Back to Sign In
                </button>
              </p>

            </>
          )}

        </div>

        <p className="secure-note">
          🔒 Secure sign in to your workspace
        </p>

      </main>
    </div>
  );
}

export default Login;
