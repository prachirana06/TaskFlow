
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSidebar } from "../SidebarContext";
import api from "../api";
import "./Navbar.css";

function localDateString(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatReminderDate(value) {
    const date = new Date(`${value}T12:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
    });
}

function readReminders() {
    try {
        const stored = JSON.parse(
            localStorage.getItem("taskflow_reminders") || "[]"
        );
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
}

function Navbar({
    onToggleSidebar,
    onSearch,
    darkMode = false,
    setDarkMode,
    pageTitle = "Dashboard",
}) {
    const { toggleSidebar } = useSidebar();
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [focusMode, setFocusMode] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [reminders, setReminders] = useState(readReminders);
    const [showReminderForm, setShowReminderForm] = useState(false);
    const [reminderTitle, setReminderTitle] = useState("");
    const [reminderDate, setReminderDate] = useState(() => localDateString());

    let userName = "Username";
    let userAvatar = "";

    try {
        const storedUser =
            localStorage.getItem("user") ||
            sessionStorage.getItem("user");

        if (storedUser) {
            const user = JSON.parse(storedUser);
            userName = String(user?.name || user?.username || "User");
            userAvatar = typeof user?.avatar === "string" ? user.avatar : "";
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

    useEffect(() => {
        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        if (!token) return;

        let active = true;

        async function loadTasks() {
            try {
                const response = await api.get("/tasks", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (active) {
                    setTasks(
                        Array.isArray(response.data) ? response.data : []
                    );
                }
            } catch {
                if (active) setTasks([]);
            }
        }

        loadTasks();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        localStorage.setItem(
            "taskflow_reminders",
            JSON.stringify(reminders)
        );
    }, [reminders]);

    const today = localDateString();

    const taskReminders = tasks
        .map((task) => {
            const rawDate =
                typeof task.dueDate === "string"
                    ? task.dueDate
                    : typeof task.due_date === "string"
                    ? task.due_date
                    : "";

            return { task, date: rawDate ? rawDate.slice(0, 10) : "" };
        })
        .filter(
            ({ task, date }) =>
                date && task.status !== "Completed" && date <= today
        )
        .map(({ task, date }) => ({
            id: `task-${task.id}`,
            title: task.title || "Untitled task",
            detail:
                date === today
                    ? "Due today"
                    : `Date passed · ${formatReminderDate(date)}`,
            path: "/my-tasks",
            kind: "task",
            group: date === today ? "today" : "overdue",
        }));

    const customReminders = reminders.map((reminder) => ({
        id: reminder.id,
        title: reminder.title,
        detail:
            reminder.date === today
                ? "Today"
                : formatReminderDate(reminder.date),
        path: "",
        kind: "custom",
        group: "custom",
    }));

    const overdueItems = taskReminders.filter(
        (item) => item.group === "overdue"
    );
    const todayItems = taskReminders.filter((item) => item.group === "today");
    const notificationItems = [
        ...customReminders,
        ...overdueItems,
        ...todayItems,
    ];

    function addReminder(event) {
        event.preventDefault();

        const cleanTitle = reminderTitle.trim();

        if (!cleanTitle || !reminderDate) return;

        setReminders((previous) => [
            ...previous,
            {
                id: `rem-${Date.now()}`,
                title: cleanTitle,
                date: reminderDate,
            },
        ]);
        setReminderTitle("");
        setReminderDate(localDateString());
        setShowReminderForm(false);
    }

    function removeReminder(id) {
        setReminders((previous) =>
            previous.filter((reminder) => reminder.id !== id)
        );
    }

    function openReminder(item) {
        setShowNotifications(false);

        if (item.path) navigate(item.path);
    }

    function renderNotificationItem(item) {
        return (
            <div
                className="notification-item"
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => openReminder(item)}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        openReminder(item);
                    }
                }}
            >
                <span
                    className={`notification-icon notification-icon-${item.kind}`}
                >
                    {item.kind === "task" ? "✓" : "◷"}
                </span>

                <div>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                </div>

                {item.kind === "custom" && (
                    <button
                        type="button"
                        className="notification-remove"
                        aria-label="Remove reminder"
                        onClick={(event) => {
                            event.stopPropagation();
                            removeReminder(item.id);
                        }}
                    >
                        ×
                    </button>
                )}
            </div>
        );
    }

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
                        <Link to="/dashboard">Workspace</Link>{" "}
                        <span>/</span> {pageTitle}
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
                        {notificationItems.length > 0 && (
                            <span className="notification-dot"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="navbar-dropdown notification-dropdown">
                            <div className="notification-head">
                                <h4>Reminders</h4>
                                <span className="notification-count">
                                    {notificationItems.length}
                                </span>
                            </div>

                            {notificationItems.length === 0 &&
                            !showReminderForm ? (
                                <>
                                    <p>You’re all caught up!</p>
                                    <span>
                                        Task deadlines and your reminders
                                        will appear here.
                                    </span>
                                </>
                            ) : (
                                <div className="notification-list">
                                    {customReminders.length > 0 && (
                                        <>
                                            <span className="notification-section-label">
                                                My reminders
                                            </span>
                                            {customReminders.map(
                                                renderNotificationItem
                                            )}
                                        </>
                                    )}

                                    {overdueItems.length > 0 && (
                                        <>
                                            <span className="notification-section-label notification-label-overdue">
                                                Date passed
                                            </span>
                                            {overdueItems.map(
                                                renderNotificationItem
                                            )}
                                        </>
                                    )}

                                    {todayItems.length > 0 && (
                                        <>
                                            <span className="notification-section-label">
                                                Due today
                                            </span>
                                            {todayItems.map(
                                                renderNotificationItem
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {!showReminderForm ? (
                                <button
                                    type="button"
                                    className="notification-add"
                                    onClick={() => setShowReminderForm(true)}
                                >
                                    ＋ Add reminder
                                </button>
                            ) : (
                                <form
                                    className="notification-form"
                                    onSubmit={addReminder}
                                >
                                    <input
                                        type="text"
                                        placeholder="Reminder title..."
                                        value={reminderTitle}
                                        onChange={(event) =>
                                            setReminderTitle(event.target.value)
                                        }
                                        maxLength={60}
                                    />

                                    <input
                                        type="date"
                                        value={reminderDate}
                                        onChange={(event) =>
                                            setReminderDate(event.target.value)
                                        }
                                    />

                                    <div className="notification-form-actions">
                                        <button type="submit">Add</button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowReminderForm(false)
                                            }
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
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
                            {userAvatar ? (
                                <img src={userAvatar} alt="Profile" />
                            ) : (
                                String(userName || "U").charAt(0).toUpperCase()
                            )}
                        </span>

                        <span className="navbar-user-name">
                            {userName}
                        </span>

                        <span className="profile-chevron">⌄</span>
                    </button>

                    {showProfile && (
                        <div className="navbar-dropdown profile-dropdown">

                            <div className="dropdown-user">
                                <span className="dropdown-user-avatar">
                                    {userAvatar ? (
                                        <img src={userAvatar} alt="Profile" />
                                    ) : (
                                        String(userName || "U").charAt(0).toUpperCase()
                                    )}
                                </span>
                                <div>
                                    <strong>{userName}</strong>
                                    <span>Personal Workspace</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowProfile(false);
                                    navigate("/profile");
                                }}
                            >
                                ♙ &nbsp; My Profile
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowProfile(false);
                                    navigate("/settings");
                                }}
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
