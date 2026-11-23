
import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "./MyTasks.css";

function MyTasks({ darkMode, setDarkMode }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [dateSort, setDateSort] = useState("none");

    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [status, setStatus] = useState("Todo");
    const [dueDate, setDueDate] = useState("");

    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    const API = "http://localhost:5000/tasks";

    useEffect(() => {
        getTasks();
    }, []);

    async function getTasks() {
        try {
            const response = await axios.get(API, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setTasks(response.data);
        } catch (error) {
            console.log(error);
            alert("Could not load tasks.");
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
        setEditId(null);
        setShowForm(false);
    }

    async function saveTask(event) {
        event.preventDefault();

        if (!title.trim()) {
            alert("Please enter a task title.");
            return;
        }

        const taskData = {
            title: title.trim(),
            description,
            priority,
            status,
            dueDate
        };

        try {
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            if (editId !== null) {
                await axios.put(`${API}/${editId}`, taskData, config);
            } else {
                await axios.post(API, taskData, config);
            }

            await getTasks();
            resetForm();
        } catch (error) {
            console.log(error);
            alert(error.response?.data?.message || "Unable to save task.");
        }
    }

    function editTask(task) {
        setEditId(task.id);
        setTitle(task.title || "");
        setDescription(task.description || "");
        setPriority(task.priority || "Medium");
        setStatus(task.status || "Todo");
        setDueDate(task.dueDate || task.due_date || "");
        setShowForm(true);

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function deleteTask(task) {
        if (!window.confirm("Are you sure you want to delete this task?")) {
            return;
        }

        try {
            await axios.delete(`${API}/${task.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await getTasks();
        } catch (error) {
            console.log(error);
            alert("Unable to delete task.");
        }
    }

    const filteredTasks = tasks
        .filter((task) => {
            const term = search.toLowerCase().trim();

            const matchesSearch =
                (task.title || "").toLowerCase().includes(term) ||
                (task.description || "").toLowerCase().includes(term);

            const matchesStatus =
                statusFilter === "All" ||
                task.status === statusFilter;

            const matchesPriority =
                priorityFilter === "All" ||
                task.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        })
        .sort((a, b) => {
            if (dateSort === "none") return 0;

            const dateA = a.dueDate || a.due_date || "";
            const dateB = b.dueDate || b.due_date || "";

            if (!dateA) return 1;
            if (!dateB) return -1;

            return dateSort === "asc"
                ? dateA.localeCompare(dateB)
                : dateB.localeCompare(dateA);
        });

    const counts = {
        All: tasks.length,
        Todo: tasks.filter((t) => t.status === "Todo").length,
        "In Progress": tasks.filter((t) => t.status === "In Progress").length,
        Completed: tasks.filter((t) => t.status === "Completed").length
    };

    function formatDate(date) {
        if (!date) return "No due date";

        const parsed = new Date(`${date}T12:00:00`);

        if (Number.isNaN(parsed.getTime())) return "No due date";

        return parsed.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    return (
        <div className={`taskflow-layout ${darkMode ? "dark-mode" : ""}`}>
            <Sidebar darkMode={darkMode} />

            <main className="taskflow-main">
                <Navbar
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    onSearch={setSearch}
                        pageTitle="MyTasks"
                />

                <div className="mytasks-content">

                    <section className="mytasks-welcome">
                        <p>YOUR WORKSPACE</p>
                        <h1>My Tasks ✨</h1>
                        <span>Organise your work and keep moving forward.</span>
                    </section>

                    <section className="mytasks-stats">
                        {[
                            { name: "All", label: "Total Tasks" },
                            { name: "Todo", label: "To Do" },
                            { name: "In Progress", label: "In Progress" },
                            { name: "Completed", label: "Completed" }
                        ].map((item) => (
                            <button
                                type="button"
                                key={item.name}
                                className={`mytasks-stat ${
                                    statusFilter === item.name ? "selected" : ""
                                }`}
                                onClick={() => setStatusFilter(item.name)}
                            >
                                <span>{item.label}</span>
                                <strong>{counts[item.name]}</strong>
                            </button>
                        ))}
                    </section>

                    <section className="mytasks-toolbar">
                        <div>
                            <h2>All Tasks</h2>
                            <p>{filteredTasks.length} tasks found</p>
                        </div>

                        <button
                            type="button"
                            className="mytasks-add"
                            onClick={() => {
                                resetForm();
                                setShowForm(true);
                            }}
                        >
                            ＋ Add New Task
                        </button>
                    </section>

                    {showForm && (
                        <form className="mytasks-form" onSubmit={saveTask}>
                            <div className="mytasks-form-heading">
                                <h2>{editId !== null ? "Edit Task" : "Create New Task"}</h2>
                                <button type="button" onClick={resetForm}>✕</button>
                            </div>

                            <label>Task Title *</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter task title"
                                required
                            />

                            <label>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter task description"
                                rows="3"
                            />

                            <div className="mytasks-form-row">
                                <div>
                                    <label>Priority</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                    >
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                    </select>
                                </div>

                                <div>
                                    <label>Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="Todo">Todo</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>

                                <div>
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mytasks-form-actions">
                                <button type="submit" className="mytasks-add">
                                    {editId !== null ? "Save Changes" : "Create Task"}
                                </button>
                                <button type="button" onClick={resetForm}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    <section className="mytasks-filters">
                        <input
                            type="search"
                            placeholder="Search tasks..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                        >
                            <option value="All">All Priorities</option>
                            <option value="High">High Priority</option>
                            <option value="Medium">Medium Priority</option>
                            <option value="Low">Low Priority</option>
                        </select>

                        <select
                            value={dateSort}
                            onChange={(e) => setDateSort(e.target.value)}
                        >
                            <option value="none">Default Order</option>
                            <option value="asc">Earliest First</option>
                            <option value="desc">Latest First</option>
                        </select>
                    </section>

                    <section className="mytasks-list">
                        {loading ? (
                            <p className="mytasks-empty">Loading your tasks...</p>
                        ) : filteredTasks.length === 0 ? (
                            <div className="mytasks-empty">
                                <h3>No tasks found ✨</h3>
                                <p>Try changing your filters or add a new task.</p>
                            </div>
                        ) : (
                            filteredTasks.map((task) => (
                                <article className="mytasks-item" key={task.id}>
                                    <div className="mytasks-item-info">
                                        <h3>{task.title}</h3>
                                        <p>{task.description || "No description added."}</p>

                                        <div className="mytasks-meta">
                                            <span className={`mytasks-priority priority-${(task.priority || "Medium").toLowerCase()}`}>
                                                {task.priority || "Medium"} Priority
                                            </span>

                                            <span className="mytasks-status">
                                                {task.status || "Todo"}
                                            </span>

                                            <span>📅 {formatDate(task.dueDate || task.due_date)}</span>
                                        </div>
                                    </div>

                                    <div className="mytasks-actions">
                                        <button type="button" onClick={() => editTask(task)}>
                                            ✎ Edit
                                        </button>

                                        <button
                                            type="button"
                                            className="mytasks-delete"
                                            onClick={() => deleteTask(task)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </article>
                            ))
                        )}
                    </section>

                </div>
            </main>
        </div>
    );
}

export default MyTasks;
