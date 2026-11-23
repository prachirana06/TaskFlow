
import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "./Analytics.css";

function Analytics({ darkMode, setDarkMode }) {
    const [tasks, setTasks] = useState([]);
    const [search, setSearch] = useState("");

    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    useEffect(() => {
        getTasks();
    }, []);

    const getTasks = async () => {
        try {
            const res = await axios.get("https://taskflow-backend-opjd.onrender.com/tasks", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setTasks(res.data);
        } catch (error) {
            console.log("Error fetching analytics:", error);
        }
    };

    // Task statistics
    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(
        task => task.status?.toLowerCase() === "completed"
    ).length;

    const pendingTasks = tasks.filter(
        task => task.status?.toLowerCase() === "todo"
    ).length;

    const inProgressTasks = tasks.filter(
        task => task.status?.toLowerCase() === "in progress"
    ).length;

    const completionRate = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

    // Priority statistics
    const highTasks = tasks.filter(
        task => task.priority?.toLowerCase() === "high"
    ).length;

    const mediumTasks = tasks.filter(
        task => task.priority?.toLowerCase() === "medium"
    ).length;

    const lowTasks = tasks.filter(
        task => task.priority?.toLowerCase() === "low"
    ).length;

    const getPercentage = (value) => {
        return totalTasks > 0
            ? Math.round((value / totalTasks) * 100)
            : 0;
    };

    const filteredTasks = tasks.filter(task =>
        (task.title || "").toLowerCase().includes(search.toLowerCase())
    );

    const recentTasks = [...filteredTasks]
        .sort((a, b) => b.id - a.id)
        .slice(0, 5);

    return (
        <div className={`taskflow-layout ${darkMode ? "dark-mode" : ""}`}>
            <Sidebar darkMode={darkMode} />

            <main className="taskflow-main">
                <Navbar
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    onSearch={setSearch}
                        pageTitle="Analytics"
                />

                <div className="analytics-content">

                    {/* Welcome Section */}
                    <div className="analytics-welcome">
                        <p>YOUR PERFORMANCE</p>
                        <h1>Analytics & Reports 📊</h1>
                        <span>
                            Track your productivity and understand your progress.
                        </span>
                    </div>

                    {/* Overview Cards */}
                    <div className="analytics-stats">

                        <div className="analytics-stat">
                            <div className="analytics-stat-icon green-icon">▦</div>
                            <span>Total Tasks</span>
                            <h2>{totalTasks}</h2>
                            <p>All your tasks</p>
                        </div>

                        <div className="analytics-stat">
                            <div className="analytics-stat-icon blue-icon">✓</div>
                            <span>Completed</span>
                            <h2>{completedTasks}</h2>
                            <p>Successfully finished</p>
                        </div>

                        <div className="analytics-stat">
                            <div className="analytics-stat-icon orange-icon">◷</div>
                            <span>In Progress</span>
                            <h2>{inProgressTasks}</h2>
                            <p>Currently working</p>
                        </div>

                        <div className="analytics-stat">
                            <div className="analytics-stat-icon red-icon">○</div>
                            <span>Pending</span>
                            <h2>{pendingTasks}</h2>
                            <p>Waiting to start</p>
                        </div>

                    </div>

                    {/* Reports */}
                    <div className="analytics-grid">

                        {/* Productivity */}
                        <section className="analytics-card productivity-card">
                            <div className="analytics-card-heading">
                                <div>
                                    <h2>Productivity Overview</h2>
                                    <p>Your overall task completion</p>
                                </div>
                                <span className="report-icon">↗</span>
                            </div>

                            <div className="productivity-body">
                                <div
                                    className="progress-circle"
                                    style={{
                                        background: `conic-gradient(#187653 ${completionRate * 3.6}deg, #e8eee6 0deg)`
                                    }}
                                >
                                    <div className="progress-inner">
                                        <h2>{completionRate}%</h2>
                                        <span>Completed</span>
                                    </div>
                                </div>

                                <div className="productivity-details">
                                    <div>
                                        <span className="legend-dot completed-color"></span>
                                        <p>Completed</p>
                                        <strong>{completedTasks}</strong>
                                    </div>

                                    <div>
                                        <span className="legend-dot progress-color"></span>
                                        <p>In Progress</p>
                                        <strong>{inProgressTasks}</strong>
                                    </div>

                                    <div>
                                        <span className="legend-dot pending-color"></span>
                                        <p>Pending</p>
                                        <strong>{pendingTasks}</strong>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Priority Breakdown */}
                        <section className="analytics-card priority-card">
                            <div className="analytics-card-heading">
                                <div>
                                    <h2>Priority Breakdown</h2>
                                    <p>Tasks according to priority</p>
                                </div>
                                <span className="report-icon">◎</span>
                            </div>

                            <div className="priority-list">

                                <div className="priority-row">
                                    <div className="priority-label">
                                        <span>High Priority</span>
                                        <strong>{highTasks}</strong>
                                    </div>
                                    <div className="priority-track">
                                        <div
                                            className="priority-fill high-fill"
                                            style={{ width: `${getPercentage(highTasks)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="priority-row">
                                    <div className="priority-label">
                                        <span>Medium Priority</span>
                                        <strong>{mediumTasks}</strong>
                                    </div>
                                    <div className="priority-track">
                                        <div
                                            className="priority-fill medium-fill"
                                            style={{ width: `${getPercentage(mediumTasks)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="priority-row">
                                    <div className="priority-label">
                                        <span>Low Priority</span>
                                        <strong>{lowTasks}</strong>
                                    </div>
                                    <div className="priority-track">
                                        <div
                                            className="priority-fill low-fill"
                                            style={{ width: `${getPercentage(lowTasks)}%` }}
                                        ></div>
                                    </div>
                                </div>

                            </div>
                        </section>

                    </div>

                    {/* Recent Tasks */}
                    <section className="analytics-card recent-analytics">
                        <div className="analytics-card-heading">
                            <div>
                                <h2>Recent Tasks</h2>
                                <p>Your latest added tasks</p>
                            </div>
                            <span className="report-icon">☷</span>
                        </div>

                        {recentTasks.length > 0 ? (
                            <div className="analytics-table-wrapper">
                                <table className="analytics-table">
                                    <thead>
                                        <tr>
                                            <th>Task Name</th>
                                            <th>Priority</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {recentTasks.map(task => (
                                            <tr key={task.id}>
                                                <td>{task.title}</td>

                                                <td>
                                                    <span className={`analytics-priority ${task.priority?.toLowerCase()}`}>
                                                        {task.priority || "Medium"}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className={`analytics-status ${task.status?.toLowerCase().replace(" ", "-")}`}>
                                                        {task.status || "Todo"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="analytics-empty">
                                <div>📋</div>
                                <h3>No tasks found</h3>
                                <p>Add some tasks to see your reports here.</p>
                            </div>
                        )}
                    </section>

                </div>
            </main>
        </div>
    );
}

export default Analytics;
