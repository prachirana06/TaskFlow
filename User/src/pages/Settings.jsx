import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import QuickNav from "../components/QuickNav";
import "./Settings.css";

const ACCENTS = [
    { name: "Forest", value: "#187653" },
    { name: "Sky", value: "#2563eb" },
    { name: "Grape", value: "#7c3aed" },
    { name: "Sunset", value: "#f97316" },
    { name: "Rose", value: "#e11d48" },
    { name: "Teal", value: "#0d9488" },
];

function normalizeUser(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};

    return {
        id: typeof value.id === "string" ? value.id : "",
        name: typeof value.name === "string" ? value.name : "",
        email: typeof value.email === "string" ? value.email : "",
        avatar: typeof value.avatar === "string" ? value.avatar : "",
        createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    };
}

function readUser() {
    try {
        const stored =
            localStorage.getItem("user") || sessionStorage.getItem("user");
        return normalizeUser(stored ? JSON.parse(stored) : null);
    } catch {
        return {};
    }
}

function Settings({ darkMode, setDarkMode, accentColor, setAccentColor, profileMode = false }) {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const initialUser = readUser();

    const [, setSearch] = useState("");
    const [user, setUser] = useState(initialUser);
    const [name, setName] = useState(initialUser.name || "");
    const [email, setEmail] = useState(initialUser.email || "");
    const [profilePassword, setProfilePassword] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    function showMessage(text) {
        setMessage(text);
        setError("");
    }

    function showError(text) {
        setError(text);
        setMessage("");
    }

    function errorMessage(err, fallback) {
        return err.response?.data?.message || fallback;
    }

    function storeUser(updated) {
        const merged = { ...user, ...updated };
        localStorage.setItem("user", JSON.stringify(merged));
        sessionStorage.setItem("user", JSON.stringify(merged));
        setUser(merged);
        setName(merged.name || "");
        setEmail(merged.email || "");
    }

    async function saveProfile(event) {
        event.preventDefault();
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanName || cleanEmail.length === 0) {
            showError("Name and email cannot be empty.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            showError("Enter a valid email address.");
            return;
        }

        if (cleanEmail !== (user.email || "").toLowerCase() && !profilePassword) {
            showError("Enter your current password to change your email.");
            return;
        }

        setSaving(true);
        try {
            const response = await api.put(
                "/profile",
                {
                    name: cleanName,
                    email: cleanEmail,
                    currentPassword: profilePassword,
                },
                { headers }
            );

            storeUser(response.data.user);
            setProfilePassword("");
            showMessage(response.data.message || "Profile updated.");
        } catch (err) {
            showError(errorMessage(err, "Profile could not be updated."));
        } finally {
            setSaving(false);
        }
    }

    function uploadAvatar(event) {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showError("Please choose an image file.");
            return;
        }

        if (file.size > 1.5 * 1024 * 1024) {
            showError("Please choose an image smaller than 1.5 MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const response = await api.put(
                    "/profile",
                    { avatar: reader.result },
                    { headers }
                );
                storeUser(response.data.user);
                showMessage("Profile picture updated.");
            } catch (err) {
                showError(errorMessage(err, "Picture could not be uploaded."));
            }
        };
        reader.readAsDataURL(file);
    }

    async function removeAvatar() {
        try {
            const response = await api.put(
                "/profile",
                { avatar: "" },
                { headers }
            );
            storeUser(response.data.user);
            showMessage("Profile picture removed.");
        } catch (err) {
            showError(errorMessage(err, "Picture could not be removed."));
        }
    }

    async function changePassword(event) {
        event.preventDefault();

        if (newPassword.length < 6) {
            showError("New password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            showError("New passwords do not match.");
            return;
        }

        setSaving(true);
        try {
            const response = await api.put(
                "/profile/password",
                { currentPassword, newPassword },
                { headers }
            );

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            showMessage(response.data.message || "Password updated.");
        } catch (err) {
            showError(errorMessage(err, "Password could not be updated."));
        } finally {
            setSaving(false);
        }
    }

    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        navigate("/login", { replace: true });
    }

    const joined = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString(undefined, {
              month: "short",
              year: "numeric",
          })
        : "Today";

    return (
        <div className={`taskflow-layout ${darkMode ? "dark-mode" : ""}`}>
            <Sidebar darkMode={darkMode} />

            <main className="taskflow-main">
                <Navbar
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    onSearch={setSearch}
                    pageTitle={profileMode ? "My Profile" : "Settings"}
                />

                <div className="settings-content">
                    <div className="settings-welcome">
                        <p>PERSONALIZE YOUR EXPERIENCE</p>
                        <h1>{profileMode ? "My Profile" : "Settings"}</h1>
                        <span>
                            {profileMode
                                ? "Your details, photo and password in one place."
                                : "Make TaskFlow yours — colors, themes and account details."}
                        </span>
                    </div>

                    <QuickNav />

                    {message && <div className="settings-message">{message}</div>}
                    {error && <div className="settings-error">{error}</div>}

                    <section className="settings-card">
                        <div className="settings-heading">
                            <div>
                                <h2>Profile Information</h2>
                                <p>Your personal account details</p>
                            </div>
                        </div>

                        <div className="profile-section">
                            <div className="profile-avatar-wrap">
                                <div
                                    className="profile-avatar"
                                    style={{
                                        background: user.avatar
                                            ? "none"
                                            : `linear-gradient(135deg, ${accentColor}, ${accentColor})`,
                                    }}
                                >
                                    {user.avatar ? (
                                        <img src={user.avatar} alt="Profile" />
                                    ) : (
                                        (user.name || "U").charAt(0).toUpperCase()
                                    )}
                                </div>

                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={uploadAvatar}
                                    className="settings-file-input"
                                />

                                <div className="profile-avatar-actions">
                                    <button
                                        type="button"
                                        className="settings-mini"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        ✎ Change photo
                                    </button>
                                    {user.avatar && (
                                        <button
                                            type="button"
                                            className="settings-mini settings-mini-danger"
                                            onClick={removeAvatar}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="profile-details">
                                <h3>{user.name || "User"}</h3>
                                <p>{user.email || "No email available"}</p>
                                <span>TaskFlow Member · Joined {joined}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            form="profile-details-form"
                            className="settings-primary"
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "✓ Save Profile"}
                        </button>
                    </section>

                    <section className="settings-card">
                        <div className="settings-heading">
                            <div>
                                <h2>Edit Details</h2>
                                <p>Update your name or email address</p>
                            </div>
                        </div>

                        <form
                            id="profile-details-form"
                            className="settings-form"
                            onSubmit={saveProfile}
                        >
                            <label>
                                <span>Full Name</span>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    maxLength={50}
                                />
                            </label>

                            <label>
                                <span>Email Address</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </label>

                            <label>
                                <span>Current password (needed only for email change)</span>
                                <input
                                    type="password"
                                    value={profilePassword}
                                    onChange={(e) => setProfilePassword(e.target.value)}
                                    placeholder="Leave blank if email is unchanged"
                                    autoComplete="current-password"
                                />
                            </label>

                            <button
                                type="submit"
                                className="settings-primary"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "✓ Save details"}
                            </button>
                        </form>
                    </section>

                    <section className="settings-card">
                        <div className="settings-heading">
                            <div>
                                <h2>Change Password</h2>
                                <p>Keep your account safe with a new password</p>
                            </div>
                        </div>

                        <form className="settings-form" onSubmit={changePassword}>
                            <label>
                                <span>Current Password</span>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                            </label>

                            <label>
                                <span>New Password</span>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </label>

                            <label>
                                <span>Confirm New Password</span>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </label>

                            <button
                                type="submit"
                                className="settings-primary"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "✓ Update password"}
                            </button>
                        </form>
                    </section>

                    {!profileMode && (
                        <>
                    <section className="settings-card">
                        <div className="settings-heading">
                            <div>
                                <h2>Appearance</h2>
                                <p>Customize how TaskFlow looks</p>
                            </div>
                        </div>

                        <div className="settings-option settings-option-column">
                            <div>
                                <h3>Theme</h3>
                                <p>Pick the look that feels right for you</p>
                            </div>

                            <div className="theme-choices">
                                <button
                                    type="button"
                                    className={`theme-choice ${!darkMode ? "theme-choice-active" : ""}`}
                                    onClick={() => setDarkMode(false)}
                                >
                                    ☀ Light
                                </button>
                                <button
                                    type="button"
                                    className={`theme-choice ${darkMode ? "theme-choice-active" : ""}`}
                                    onClick={() => setDarkMode(true)}
                                >
                                    ☾ Dark
                                </button>
                            </div>
                        </div>

                        <div className="settings-option settings-option-column">
                            <div>
                                <h3>Accent Color</h3>
                                <p>Watch the whole app change color</p>
                            </div>

                            <div className="accent-choices">
                                {ACCENTS.map((accent) => (
                                    <button
                                        key={accent.value}
                                        type="button"
                                        className={`accent-swatch ${accentColor === accent.value ? "accent-swatch-active" : ""}`}
                                        style={{ backgroundColor: accent.value }}
                                        onClick={() => setAccentColor(accent.value)}
                                        aria-label={`${accent.name} accent`}
                                        title={accent.name}
                                    />
                                ))}

                                <label className="accent-custom" title="Custom color">
                                    <input
                                        type="color"
                                        value={accentColor}
                                        onChange={(e) => setAccentColor(e.target.value)}
                                        aria-label="Custom accent color"
                                    />
                                </label>
                            </div>
                        </div>
                    </section>

                    <section className="settings-card">
                        <div className="settings-heading">
                            <div>
                                <h2>Account</h2>
                                <p>Manage your TaskFlow account</p>
                            </div>
                        </div>

                        <div className="settings-option">
                            <div>
                                <h3>Logout</h3>
                                <p>Sign out from your current account</p>
                            </div>

                            <button
                                className="settings-logout"
                                onClick={handleLogout}
                            >
                                Logout ↗
                            </button>
                        </div>
                    </section>
                        </>
                    )}

                    <div className="settings-footer">
                        <p>TaskFlow • Stay organized, stay productive.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Settings;
