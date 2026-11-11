
import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

function Dashboard ({ darkMode, setDarkMode })  {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    

    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [status, setStatus] = useState("Todo");
    const [dueDate, setDueDate] = useState("");

    const [tasks, setTasks] = useState([]);
    const [editIndex, setEditIndex] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [dateSort, setDateSort] = useState("none");

    useEffect(() => {
        getTasks();
    }, []);

    async function getTasks() {
        try {
            const token =
                localStorage.getItem("token") ||
                sessionStorage.getItem("token");

            const response = await axios.get(
                "http://localhost:5000/tasks",
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setTasks(response.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    function resetForm() {
        setTitle("");
        setDescription("");
        setPriority("Medium");
        setStatus("Todo");
        setDueDate("");
        setEditIndex(null);
        setShowForm(false);
    }

    async function addTask() {
        if (!title.trim()) {
            alert("Please enter a task title.");
            return;
        }

        const newTask = {
            title,
            description,
            priority,
            status,
            dueDate
        };

        try {
            const token =
                localStorage.getItem("token") ||
                sessionStorage.getItem("token");

            await axios.post(
                "http://localhost:5000/tasks",
                newTask,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            await getTasks();
            resetForm();
        } catch (error) {
            console.log(error);
            alert(error.response?.data?.message || "Task could not be added");
        }
    }

    async function updateTask() {
        const taskId = tasks[editIndex].id;

        const updatedTask = {
            title,
            description,
            priority,
            status,
            dueDate
        };

        try {
            const token =
                localStorage.getItem("token") ||
                sessionStorage.getItem("token");

            await axios.put(
                `http://localhost:5000/tasks/${taskId}`,
                updatedTask,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            await getTasks();
            resetForm();
        } catch (error) {
            console.log(error);
            alert(error.response?.data?.message || "Task could not be updated");
        }
    }

    async function deleteTask(task) {
        if (!window.confirm("Are you sure you want to delete this task?")) {
            return;
        }

        try {
            const token =
                localStorage.getItem("token") ||
                sessionStorage.getItem("token");

            await axios.delete(
                `http://localhost:5000/tasks/${task.id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            await getTasks();
        } catch (error) {
            console.log(error);
            alert(error.response?.data?.message || "Task could not be deleted");
        }
    }

    function editTask(task) {
        const index = tasks.findIndex((item) => item.id === task.id);

        setTitle(task.title || "");
        setDescription(task.description || "");
        setPriority(task.priority || "Medium");
        setStatus(task.status || "Todo");
        setDueDate(task.dueDate || task.due_date || "");
        setEditIndex(index);
        setShowForm(true);

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Task Statistics
    const completedTasks = tasks.filter(
        (task) => task.status === "Completed"
    ).length;

    const pendingTasks = tasks.filter(
        (task) => task.status !== "Completed"
    ).length;

    const inProgressTasks = tasks.filter(
        (task) => task.status === "In Progress"
    ).length;

    const completionRate = tasks.length
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0;

    function getTaskDate(task) {
        return task.dueDate || task.due_date || "";
    }

    // Safe date validation and formatting
    function isValidDate(dateString) {
        if (!dateString) return false;

        const date = new Date(`${dateString}T12:00:00`);
        return !Number.isNaN(date.getTime());
    }

    function formatTaskDate(dateString) {
        if (!isValidDate(dateString)) return "No due date";

        return new Date(`${dateString}T12:00:00`).toLocaleDateString(
            "en-US",
            {
                day: "numeric",
                month: "short"
            }
        );
    }

    function getLocalToday() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    const today = getLocalToday();

    // Search, Filter and Sorting
    const filteredTasks = tasks
        .filter((task) => {
            const matchesSearch =
                (task.title || "").toLowerCase().includes(search.toLowerCase()) ||
                (task.description || "").toLowerCase().includes(search.toLowerCase());

            const matchesPriority =
                priorityFilter === "All" ||
                (task.priority || "Medium") === priorityFilter;

            return matchesSearch && matchesPriority;
        })
        .sort((a, b) => {
            if (dateSort === "none") return 0;

            const dateA = getTaskDate(a);
            const dateB = getTaskDate(b);

            if (!isValidDate(dateA)) return 1;
            if (!isValidDate(dateB)) return -1;

            return dateSort === "asc"
                ? dateA.localeCompare(dateB)
                : dateB.localeCompare(dateA);
        });

    // Upcoming Deadlines
    const upcomingTasks = tasks
        .filter((task) => {
            const date = getTaskDate(task);

            return (
                isValidDate(date) &&
                task.status !== "Completed"
            );
        })
        .sort((a, b) => getTaskDate(a).localeCompare(getTaskDate(b)))
        .slice(0, 4);

    return (
        <div className={`taskflow-layout ${darkMode ? "dark-mode" : ""}`}>

            <Sidebar darkMode={darkMode} />

            <main className="taskflow-main">

                <Navbar
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    onSearch={setSearch}
                    pageTitle="Dashboard"
                />

                <div className="dashboard-content">

                    {/* Welcome Section */}
                    <section className="welcome-section">
                        <div>
                            <p className="welcome-label">
                                YOUR PERSONAL WORKSPACE
                            </p>

                            <h1>
                                Good {
                                    new Date().getHours() < 12
                                        ? "Morning"
                                        : new Date().getHours() < 17
                                            ? "Afternoon"
                                            : "Evening"
                                }, {user?.name || "User"} 👋
                            </h1>

                            <p>
                                Small steps, big progress. Let's get things done.
                            </p>
                        </div>

                        <div className="welcome-illustration">
                            <span>✦</span>
                            <div className="illustration-icon">✓</div>
                            <span>✧</span>
                        </div>
                    </section>

                    {/* Statistics Cards */}
                    <section className="cards">

                        <div className="card total-card">
                            <div className="summary-top">
                                <div className="summary-icon">▤</div>
                                <span className="summary-tag">All tasks</span>
                            </div>
                            <h3>Total Tasks</h3>
                            <h2>{tasks.length}</h2>
                            <p>Your complete workload</p>
                        </div>

                        <div className="card completed-card">
                            <div className="summary-top">
                                <div className="summary-icon">✓</div>
                                <span className="summary-tag">Done</span>
                            </div>
                            <h3>Completed</h3>
                            <h2>{completedTasks}</h2>
                            <p>Tasks finished</p>
                        </div>

                        <div className="card pending-card">
                            <div className="summary-top">
                                <div className="summary-icon">◷</div>
                                <span className="summary-tag">To do</span>
                            </div>
                            <h3>Pending</h3>
                            <h2>{pendingTasks}</h2>
                            <p>Tasks left to complete</p>
                        </div>

                        <div className="card progress-card">
                            <div className="summary-top">
                                <div className="summary-icon">↗</div>
                                <span className="summary-tag">Active</span>
                            </div>
                            <h3>In Progress</h3>
                            <h2>{inProgressTasks}</h2>
                            <p>Currently in progress</p>
                        </div>

                    </section>

                    {/* Insights Section */}
                    <section className="insights-grid">

                        <div className="insight-card completion-card">
                            <div>
                                <p className="panel-eyebrow">YOUR PROGRESS</p>
                                <h2>Completion rate</h2>
                                <p className="panel-description">
                                    Keep going — every task counts.
                                </p>
                            </div>

                            <div
                                className="progress-ring"
                                style={{
                                    "--progress": `${completionRate * 3.6}deg`
                                }}
                                role="img"
                                aria-label={`${completionRate}% of tasks completed`}
                            >
                                <div className="progress-ring-inner">
                                    <strong>{completionRate}%</strong>
                                    <span>Completed</span>
                                </div>
                            </div>

                            <div className="progress-footer">
                                <span>{completedTasks} completed</span>
                                <span>{pendingTasks} remaining</span>
                            </div>
                        </div>

                        <div className="insight-card deadlines-card">

                            <div className="panel-heading">
                                <div>
                                    <p className="panel-eyebrow">COMING UP</p>
                                    <h2>Upcoming deadlines</h2>
                                </div>
                                <span className="panel-heading-icon">▦</span>
                            </div>

                            {upcomingTasks.length === 0 ? (
                                <div className="mini-empty">
                                    <span>✦</span>
                                    <p>No upcoming deadlines yet.</p>
                                </div>
                            ) : (
                                <div className="deadline-list">

                                    {upcomingTasks.map((task) => {
                                        const taskDate = getTaskDate(task);
                                        const overdue = taskDate < today;

                                        return (
                                            <div
                                                className="deadline-item"
                                                key={task.id}
                                            >
                                                <div className="deadline-date">
                                                    <strong>
                                                        {new Date(
                                                            `${taskDate}T12:00:00`
                                                        ).getDate()}
                                                    </strong>

                                                    <span>
                                                        {new Date(
                                                            `${taskDate}T12:00:00`
                                                        ).toLocaleDateString(
                                                            "en-US",
                                                            { month: "short" }
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="deadline-info">
                                                    <strong>{task.title}</strong>

                                                    <span className={
                                                        overdue
                                                            ? "deadline-overdue"
                                                            : ""
                                                    }>
                                                        {overdue
                                                            ? "Overdue"
                                                            : taskDate === today
                                                                ? "Due today"
                                                                : "Upcoming"}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                </div>
                            )}

                        </div>
                    </section>

                    {/* Task Header */}
                    <section className="task-header">
                        <div>
                            <p className="section-eyebrow">STAY PRODUCTIVE</p>
                            <h2>My Tasks</h2>
                            <p>Search, organise and manage your work.</p>
                        </div>

                        <button
                            type="button"
                            className="add-button"
                            onClick={() => {
                                resetForm();
                                setShowForm(true);
                            }}
                        >
                            ＋ Add New Task
                        </button>
                    </section>

                    {/* Add / Edit Task Form */}
                    {showForm && (
                        <section className="task-form">

                            <div className="form-heading">
                                <div>
                                    <h2>
                                        {editIndex === null
                                            ? "Create New Task"
                                            : "Edit Task"}
                                    </h2>
                                    <p>Enter your task details below.</p>
                                </div>

                                <button
                                    type="button"
                                    className="close-form-button"
                                    onClick={resetForm}
                                    aria-label="Close form"
                                >
                                    ✕
                                </button>
                            </div>

                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    editIndex === null
                                        ? addTask()
                                        : updateTask();
                                }}
                            >

                                <div className="form-field">
                                    <label htmlFor="task-title">
                                        Task Title *
                                    </label>

                                    <input
                                        id="task-title"
                                        value={title}
                                        onChange={(event) =>
                                            setTitle(event.target.value)
                                        }
                                        placeholder="e.g. Complete project report"
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="task-description">
                                        Description
                                    </label>

                                    <textarea
                                        id="task-description"
                                        value={description}
                                        onChange={(event) =>
                                            setDescription(event.target.value)
                                        }
                                        placeholder="What needs to be done?"
                                        rows="3"
                                    />
                                </div>

                                <div className="task-form-row">

                                    <div className="form-field">
                                        <label htmlFor="task-priority">
                                            Priority
                                        </label>

                                        <select
                                            id="task-priority"
                                            value={priority}
                                            onChange={(event) =>
                                                setPriority(event.target.value)
                                            }
                                        >
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                        </select>
                                    </div>

                                    <div className="form-field">
                                        <label htmlFor="task-status">
                                            Status
                                        </label>

                                        <select
                                            id="task-status"
                                            value={status}
                                            onChange={(event) =>
                                                setStatus(event.target.value)
                                            }
                                        >
                                            <option value="Todo">Todo</option>
                                            <option value="In Progress">
                                                In Progress
                                            </option>
                                            <option value="Completed">
                                                Completed
                                            </option>
                                        </select>
                                    </div>

                                    <div className="form-field">
                                        <label htmlFor="task-date">
                                            Due Date
                                        </label>

                                        <input
                                            id="task-date"
                                            type="date"
                                            value={dueDate}
                                            onChange={(event) =>
                                                setDueDate(event.target.value)
                                            }
                                        />
                                    </div>

                                </div>

                                <div className="task-form-actions">
                                    <button
                                        type="submit"
                                        className="save-button"
                                    >
                                        {editIndex === null
                                            ? "Create Task"
                                            : "Save Changes"}
                                    </button>

                                    <button
                                        type="button"
                                        className="cancel-button"
                                        onClick={resetForm}
                                    >
                                        Cancel
                                    </button>
                                </div>

                            </form>
                        </section>
                    )}

                    {/* All Tasks */}
                    <section className="task-list">

                        <div className="task-list-heading">
                            <div>
                                <h2>All Tasks</h2>
                                <p className="task-count-description">
                                    {filteredTasks.length} matching tasks
                                </p>
                            </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="task-filters">

                            <label
                                className="search-box"
                                htmlFor="task-search"
                            >
                                <span>⌕</span>

                                <input
                                    id="task-search"
                                    type="search"
                                    placeholder="Search tasks..."
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                />
                            </label>

                            <select
                                aria-label="Filter by priority"
                                value={priorityFilter}
                                onChange={(event) =>
                                    setPriorityFilter(event.target.value)
                                }
                            >
                                <option value="All">All priorities</option>
                                <option value="High">High priority</option>
                                <option value="Medium">Medium priority</option>
                                <option value="Low">Low priority</option>
                            </select>

                            <select
                                aria-label="Sort by due date"
                                value={dateSort}
                                onChange={(event) =>
                                    setDateSort(event.target.value)
                                }
                            >
                                <option value="none">Default order</option>
                                <option value="asc">Earliest due date</option>
                                <option value="desc">Latest due date</option>
                            </select>

                        </div>

                        {/* Loading / Empty / Task List */}
                        {loading ? (

                            <div className="empty-state">
                                <div className="empty-icon">◷</div>
                                <h3>Loading your tasks...</h3>
                                <p>Your workspace is getting ready.</p>
                            </div>

                        ) : filteredTasks.length === 0 ? (

                            <div className="empty-state">
                                <div className="empty-icon">✓</div>

                                <h3>
                                    {tasks.length === 0
                                        ? "Your next win starts here"
                                        : "No matching tasks"}
                                </h3>

                                <p>
                                    {tasks.length === 0
                                        ? "Create your first task and turn your plans into progress."
                                        : "Try another search term or change your filters."}
                                </p>

                                {tasks.length === 0 && !showForm && (
                                    <button
                                        type="button"
                                        className="add-button"
                                        onClick={() => setShowForm(true)}
                                    >
                                        ＋ Create your first task
                                    </button>
                                )}
                            </div>

                        ) : (

                            <div className="task-items">

                                {filteredTasks.map((task) => (

                                    <article
                                        className="task"
                                        key={task.id}
                                    >

                                        <div className="task-checkmark">
                                            {task.status === "Completed"
                                                ? "✓"
                                                : "○"}
                                        </div>

                                        <div className="task-details">

                                            <h3>{task.title}</h3>

                                            <p>
                                                {task.description ||
                                                    "No description added."}
                                            </p>

                                            <div className="task-meta">

                                                <span
                                                    className={`priority-badge priority-${(
                                                        task.priority || "Medium"
                                                    ).toLowerCase()}`}
                                                >
                                                    {task.priority || "Medium"} Priority
                                                </span>

                                                <span
                                                    className={`task-status status-${(
                                                        task.status || "Todo"
                                                    ).toLowerCase().replace(/\s+/g, "-")}`}
                                                >
                                                    {task.status || "Todo"}
                                                </span>

                                                <span className="task-due-date">
                                                    📅 {formatTaskDate(getTaskDate(task))}
                                                </span>

                                            </div>
                                        </div>

                                        <div className="task-actions">

                                            <button
                                                type="button"
                                                className="edit-button"
                                                onClick={() => editTask(task)}
                                            >
                                                ✎ Edit
                                            </button>

                                            <button
                                                type="button"
                                                className="delete-button"
                                                onClick={() => deleteTask(task)}
                                            >
                                                Delete
                                            </button>

                                        </div>

                                    </article>

                                ))}

                            </div>
                        )}

                    </section>

                </div>
            </main>
        </div>
    );
}

export default Dashboard;
