
import { useState, useEffect } from "react";
import { useSidebar } from "../SidebarContext";
import "./Navbar.css";

function Navbar({
    onToggleSidebar,
    onNewTask,
    onSearch,
    darkMode = false,
    setDarkMode,
    pageTitle = "Dashboard",
}) {
    const { toggleSidebar } = useSidebar();

    const [search, setSearch] = useState("");
    const [focusMode, setFocusMode] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    let userName = "Username";

    try {
        const storedUser =
            localStorage.getItem("user") ||
            sessionStorage.getItem("user");

        if (storedUser) {
            const user = JSON.parse(storedUser);
            userName = user.name || user.username || "User";
        }
    } catch {
        userName = "User";
    }

    useEffect(() => {
        const handleShortcut = (event) => {
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "k"
            ) {
                event.preventDefault();
                document.getElementById("navbar-search")?.focus();
            }

            if (event.key === "Escape") {
                setShowNotifications(false);
                setShowProfile(false);
            }
        };

        window.addEventListener("keydown", handleShortcut);

        return () => {
            window.removeEventListener("keydown", handleShortcut);
        };
    }, []);

    const handleSearch = (value) => {
        setSearch(value);

        if (onSearch) {
            onSearch(value);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        window.location.href = "/login";
    };

    return (
        <header
            className={`taskflow-navbar ${
                darkMode ? "navbar-dark" : ""
            }`}
        >

            {/* Left Section */}
            <div className="navbar-start">

                <button
                    type="button"
                    className="navbar-icon-btn sidebar-toggle"
                    onClick={onToggleSidebar || toggleSidebar}
                    aria-label="Toggle sidebar"
                    title="Toggle sidebar"
                >
                    ☰
                </button>

                <div className="navbar-page">
                    <div className="navbar-breadcrumb">
                        Workspace <span>/</span> Overview
                    </div>

                    <h2>{pageTitle}</h2>
                </div>

            </div>

            {/* Search Section */}
            <div className="navbar-search-wrap">
                <span className="search-symbol">⌕</span>

                <input
                    id="navbar-search"
                    type="search"
                    placeholder="Search your tasks..."
                    value={search}
                    onChange={(event) =>
                        handleSearch(event.target.value)
                    }
                    aria-label="Search tasks"
                />

                <kbd>Ctrl K</kbd>
            </div>

            {/* Right Section */}
            <div className="navbar-actions">

                <button
                    type="button"
                    className={`focus-badge ${
                        focusMode ? "focus-active" : ""
                    }`}
                    onClick={() =>
                        setFocusMode((previous) => !previous)
                    }
                    title="Toggle focus mode"
                    aria-pressed={focusMode}
                >
                    <span className="focus-dot"></span>
                    {focusMode ? "In Focus" : "Focus Mode"}
                </button>

                <button
                    type="button"
                    className="navbar-icon-btn theme-toggle"
                    onClick={() =>
                        setDarkMode?.((previous) => !previous)
                    }
                    aria-label={
                        darkMode
                            ? "Switch to light mode"
                            : "Switch to dark mode"
                    }
                    title={darkMode ? "Light Mode" : "Dark Mode"}
                >
                    {darkMode ? "☀" : "☾"}
                </button>

                {/* Notifications */}
                <div className="navbar-popup-wrap">

                    <button
                        type="button"
                        className="navbar-icon-btn notification-btn"
                        onClick={() => {
                            setShowNotifications((previous) => !previous);
                            setShowProfile(false);
                        }}
                        aria-label="Notifications"
                        aria-expanded={showNotifications}
                        title="Notifications"
                    >
                        ♧
                        <span className="notification-dot"></span>
                    </button>

                    {showNotifications && (
                        <div className="navbar-dropdown notification-dropdown">
                            <h4>Notifications</h4>
                            <p>You’re all caught up!</p>
                            <span>
                                New task reminders will appear here.
                            </span>
                        </div>
                    )}

                </div>

                {/* Profile */}
                <div className="navbar-popup-wrap">

                    <button
                        type="button"
                        className="navbar-profile-btn"
                        onClick={() => {
                            setShowProfile((previous) => !previous);
                            setShowNotifications(false);
                        }}
                        aria-expanded={showProfile}
                    >
                        <span className="navbar-avatar">
                            {userName.charAt(0).toUpperCase()}
                        </span>

                        <span className="navbar-user-name">
                            {userName}
                        </span>

                        <span className="profile-chevron">⌄</span>
                    </button>

                    {showProfile && (
                        <div className="navbar-dropdown profile-dropdown">

                            <div className="dropdown-user">
                                <strong>{userName}</strong>
                                <span>Personal Workspace</span>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    window.alert("Profile page coming soon!")
                                }
                            >
                                ♙ &nbsp; My Profile
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    window.alert(
                                        "Workspace settings coming soon!"
                                    )
                                }
                            >
                                ⚙ &nbsp; Workspace Settings
                            </button>

                            <button
                                type="button"
                                className="dropdown-logout"
                                onClick={handleLogout}
                            >
                                ↪ &nbsp; Logout
                            </button>

                        </div>
                    )}

                </div>

            </div>
        </header>
    );
}

export default Navbar;
