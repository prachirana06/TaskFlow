
import { useNavigate, useLocation } from "react-router-dom";
import { useSidebar } from "../SidebarContext";
import "./Sidebar.css";

function SidebarIcon({ name }) {
    const commonProps = {
        width: 20,
        height: 20,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round"
    };

    const icons = {
        dashboard: (
            <>
                <rect x="3" y="3" width="8" height="8" rx="2" />
                <rect x="14" y="3" width="7" height="5" rx="2" />
                <rect x="14" y="11" width="7" height="10" rx="2" />
                <rect x="3" y="14" width="8" height="7" rx="2" />
            </>
        ),

        tasks: (
            <>
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="m7 12 3 3 7-7" />
            </>
        ),

        calendar: (
            <>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18" />
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
            </>
        ),

        analytics: (
            <>
                <path d="M3 3v18h18" />
                <rect x="7" y="11" width="3" height="7" rx="1" />
                <rect x="13" y="7" width="3" height="11" rx="1" />
                <rect x="19" y="4" width="2" height="14" rx="1" />
            </>
        ),

        settings: (
            <>
                <circle cx="12" cy="12" r="3" />
                <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4 1.4-1.1a8 8 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1 0 1.8Z" />
            </>
        ),

        logout: (
            <>
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
            </>
        )
    };

    return <svg {...commonProps}>{icons[name]}</svg>;
}

function Sidebar({ darkMode = false }) {
    const navigate = useNavigate();
    const location = useLocation();

    const { sidebarOpen, closeSidebar } = useSidebar();

    const menuItems = [
        { name: "Dashboard", icon: "dashboard", path: "/dashboard" },
        { name: "My Tasks", icon: "tasks", path: "/my-tasks" },
        { name: "Calendar", icon: "calendar", path: "/calendar" },
        { name: "Analytics", icon: "analytics", path: "/analytics" },
        { name: "Settings", icon: "settings", path: "/settings" }
    ];

    const getUser = () => {
        try {
            const stored = JSON.parse(
                localStorage.getItem("user") ||
                sessionStorage.getItem("user") ||
                "{}"
            );
            return stored && typeof stored === "object" ? stored : {};
        } catch {
            return {};
        }
    };

    const user = getUser();
    const userName = String(user.name || user.username || "My Account");
    const userAvatar = typeof user.avatar === "string" ? user.avatar : "";

    const isActive = (path) => location.pathname === path;

    const handleNavigation = (path) => {
        navigate(path);

        if (window.innerWidth <= 700) {
            closeSidebar();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        closeSidebar();
        navigate("/login", { replace: true });
    };

    return (
        <>
            {sidebarOpen && (
                <button
                    type="button"
                    className="sidebar-overlay"
                    onClick={closeSidebar}
                    aria-label="Close sidebar"
                />
            )}

            <aside
                className={`sidebar ${
                    darkMode ? "sidebar-dark" : ""
                } ${
                    sidebarOpen ? "sidebar-open" : "sidebar-closed"
                }`}
            >
                {/* BRAND */}

                <div className="sidebar-brand">
                    <div className="brand-icon">
                        <span>✓</span>
                    </div>

                    <div className="brand-details">
                        <h2>TaskFlow<span>.</span></h2>
                        <p>YOUR WORKSPACE</p>
                    </div>

                    <button
                        type="button"
                        className="sidebar-close"
                        onClick={closeSidebar}
                        aria-label="Close sidebar"
                    >
                        ×
                    </button>
                </div>

                {/* NAVIGATION */}

                <div className="sidebar-section">
                    <p className="sidebar-heading">WORKSPACE</p>

                    <nav className="sidebar-nav">
                        {menuItems.map((item) => (
                            <button
                                key={item.name}
                                type="button"
                                className={`sidebar-link ${
                                    isActive(item.path) ? "active" : ""
                                }`}
                                onClick={() => handleNavigation(item.path)}
                                aria-current={
                                    isActive(item.path) ? "page" : undefined
                                }
                            >
                                <span className="sidebar-icon">
                                    <SidebarIcon name={item.icon} />
                                </span>

                                <span className="sidebar-link-text">
                                    {item.name}
                                </span>

                                {isActive(item.path) && (
                                    <span className="active-indicator" />
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* BOTTOM PROFILE */}

                <div className="sidebar-bottom">
                    <div className="sidebar-profile">
                        <div className="profile-avatar">
                            {userAvatar ? (
                                <img src={userAvatar} alt="Profile" />
                            ) : (
                                String(userName || "M").charAt(0).toUpperCase()
                            )}
                        </div>

                        <div className="profile-info">
                            <h4>{userName}</h4>
                            <span>Personal Workspace</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="sidebar-logout"
                        onClick={handleLogout}
                    >
                        <span className="sidebar-icon">
                            <SidebarIcon name="logout" />
                        </span>

                        <span>Logout</span>
                    </button>

                    <p className="sidebar-version">
                        Made for better productivity
                    </p>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
