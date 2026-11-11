
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "./Settings.css";

function Settings ({ darkMode, setDarkMode }){
    const navigate = useNavigate();

    
    const [search, setSearch] = useState("");

    const user = JSON.parse(
        localStorage.getItem("user") ||
        sessionStorage.getItem("user") ||
        "{}"
    );

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        navigate("/login", { replace: true });
    };

    return (
        <div className={darkMode ? "dark-mode" : ""}>
            <Sidebar darkMode={darkMode} />

            <main className="taskflow-main">
                <Navbar
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    onSearch={setSearch}
                        pageTitle="Settings"
                />

                <div className="settings-content">

                    <div className="settings-welcome">
                        <p>PERSONALIZE YOUR EXPERIENCE</p>
                        <h1>Settings ⚙️</h1>
                        <span>Manage your account and application preferences.</span>
                    </div>

                    {/* Profile Section */}
                    <section className="settings-card">
                        <div className="settings-heading">
                            <div>
                                <h2>Profile Information</h2>
                                <p>Your personal account details</p>
                            </div>
                            <div className="settings-icon">👤</div>
                        </div>

                        <div className="profile-section">
                            <div className="profile-avatar">
                                {(user.name || "U").charAt(0).toUpperCase()}
                            </div>

                            <div className="profile-details">
                                <h3>{user.name || "User"}</h3>
                                <p>{user.email || "No email available"}</p>
                                <span>TaskFlow Member</span>
                            </div>
                        </div>

                        <div className="settings-info-grid">
                            <div>
                                <label>Full Name</label>
                                <p>{user.name || "Not available"}</p>
                            </div>

                            <div>
                                <label>Email Address</label>
                                <p>{user.email || "Not available"}</p>
                            </div>
                        </div>
                    </section>

                    {/* Appearance */}
                    <section className="settings-card">
                        <div className="settings-heading">
                            <div>
                                <h2>Appearance</h2>
                                <p>Customize how TaskFlow looks</p>
                            </div>
                            <div className="settings-icon">🎨</div>
                        </div>

                        <div className="settings-option">
                            <div>
                                <h3>Dark Mode</h3>
                                <p>Switch between light and dark appearance</p>
                            </div>

                            <label className="settings-switch">
                                <input
                                    type="checkbox"
                                    checked={darkMode}
                                    onChange={(e) => setDarkMode(e.target.checked)}
                                />
                                <span className="settings-slider"></span>
                            </label>
                        </div>
                    </section>

                    {/* Account */}
                    <section className="settings-card">
                        <div className="settings-heading">
                            <div>
                                <h2>Account</h2>
                                <p>Manage your TaskFlow account</p>
                            </div>
                            <div className="settings-icon">🔐</div>
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

                    <div className="settings-footer">
                        <p>TaskFlow • Stay organized, stay productive.</p>
                    </div>

                </div>
            </main>
        </div>
    );
}

export default Settings;
