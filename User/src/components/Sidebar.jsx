import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

function Sidebar({ darkMode = false }) {
  const currentPath = window.location.pathname;

  const activeItem =
    currentPath === "/dashboard" ? "Dashboard" :
      currentPath === "/my-tasks" ? "My Tasks" :
        currentPath === "/calendar" ? "Calendar" :
          currentPath === "/analytics" ? "Analytics" :
            currentPath === "/settings" ? "Settings" : "Dashboard";

  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", icon: "▦" },
    { name: "My Tasks", icon: "✓" },
    { name: "Calendar", icon: "▣" },
    { name: "Analytics", icon: "▥" },
    { name: "Settings", icon: "⚙" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  const getUser = () => {
    try {
      return JSON.parse(
        localStorage.getItem("user") ||
        sessionStorage.getItem("user") ||
        "{}"
      );
    } catch {
      return {};
    }
  };

  const user = getUser();
  const userName = user.name || user.username || "My Account";

  return (
    <aside className={`sidebar ${darkMode ? "sidebar-dark" : ""}`}>

      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">✓</div>

        <div className="brand-details">
          <h2>TaskFlow<span>.</span></h2>
          <p>YOUR WORKSPACE</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-section">
        <p className="sidebar-heading">WORKSPACE</p>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`sidebar-link ${activeItem === item.name ? "active" : ""
                }`}

              onClick={() => navigate(
                item.name === "Dashboard" ? "/dashboard" :
                  item.name === "My Tasks" ? "/my-tasks" :
                    item.name === "Calendar" ? "/calendar" :
                      item.name === "Analytics" ? "/analytics" :
                        "/settings"
              )}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.name}</span>
              {activeItem === item.name && (
                <span className="active-indicator">●</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom Profile */}
      <div className="sidebar-bottom">

        <div className="sidebar-profile">
          <div className="profile-avatar">
            {userName.charAt(0).toUpperCase()}
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
          <span className="sidebar-icon">↪</span>
          <span>Logout</span>
        </button>

        <p className="sidebar-version">
          Made for better productivity
        </p>

      </div>
    </aside>
  );
}

export default Sidebar;
