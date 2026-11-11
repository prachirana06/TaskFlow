
import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "./Calendar.css";

function Calendar({ darkMode, setDarkMode }) {
    const [tasks, setTasks] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [search, setSearch] = useState("");

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

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
            console.log("Error fetching tasks:", error);
        }
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthName = currentDate.toLocaleString("default", {
        month: "long"
    });

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const previousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const getTasksForDate = (day) => {
        const date = formatDate(new Date(year, month, day));

        return tasks.filter(task => {
            return task.due_date === date || task.dueDate === date;
        });
    };

    const selectedTasks = tasks.filter(task => {
        const taskDate = task.due_date || task.dueDate;
        return taskDate === formatDate(selectedDate) &&
            (task.title || "").toLowerCase().includes(search.toLowerCase());
    });

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const isToday = (day) => {
        return formatDate(new Date(year, month, day)) === formatDate(new Date());
    };

    const isSelected = (day) => {
        return formatDate(new Date(year, month, day)) === formatDate(selectedDate);
    };

    return (
        <div className={`taskflow-layout ${darkMode ? "dark-mode" : ""}`}>
            <Sidebar darkMode={darkMode} />

            <main className="taskflow-main">
                <Navbar
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    onSearch={setSearch}
                    pageTitle="Calendar"
                />

                <div className="calendar-content">

                    <div className="calendar-welcome">
                        <p>PLAN YOUR SCHEDULE</p>
                        <h1>My Calendar 📅</h1>
                        <span>Keep track of your tasks and never miss a deadline.</span>
                    </div>

                    <div className="calendar-layout">

                        <section className="calendar-card">

                            <div className="calendar-header">
                                <div>
                                    <h2>{monthName} {year}</h2>
                                    <p>Manage your schedule</p>
                                </div>

                                <div className="calendar-navigation">
                                    <button onClick={goToToday}>Today</button>
                                    <button onClick={previousMonth}>‹</button>
                                    <button onClick={nextMonth}>›</button>
                                </div>
                            </div>

                            <div className="calendar-grid">

                                {weekdays.map(day => (
                                    <div className="calendar-weekday" key={day}>
                                        {day}
                                    </div>
                                ))}

                                {Array.from({ length: firstDay }).map((_, index) => (
                                    <div className="calendar-day empty-day" key={`empty-${index}`}></div>
                                ))}

                                {Array.from({ length: totalDays }).map((_, index) => {
                                    const day = index + 1;
                                    const dayTasks = getTasksForDate(day);

                                    return (
                                        <button
                                            key={day}
                                            className={`calendar-day
                                                ${isToday(day) ? "today" : ""}
                                                ${isSelected(day) ? "selected-day" : ""}
                                                ${dayTasks.length ? "has-tasks" : ""}
                                            `}
                                            onClick={() => setSelectedDate(new Date(year, month, day))}
                                        >
                                            <span>{day}</span>

                                            {dayTasks.length > 0 && (
                                                <div className="calendar-dots">
                                                    {dayTasks.slice(0, 3).map(task => (
                                                        <i
                                                            key={task.id}
                                                            className={
                                                                task.status === "Completed"
                                                                    ? "dot completed-dot"
                                                                    : "dot pending-dot"
                                                            }
                                                        ></i>
                                                    ))}
                                                </div>
                                            )}

                                            {dayTasks.length > 0 && (
                                                <small>{dayTasks.length} tasks</small>
                                            )}
                                        </button>
                                    );
                                })}

                            </div>

                            <div className="calendar-legend">
                                <span><i className="dot pending-dot"></i> Pending</span>
                                <span><i className="dot completed-dot"></i> Completed</span>
                            </div>

                        </section>

                        <section className="calendar-events">

                            <div className="events-heading">
                                <p>YOUR SCHEDULE</p>
                                <h2>
                                    {selectedDate.toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "long"
                                    })}
                                </h2>
                                <span>
                                    {selectedTasks.length} tasks scheduled
                                </span>
                            </div>

                            {selectedTasks.length > 0 ? (
                                <div className="events-list">
                                    {selectedTasks.map(task => (
                                        <div className="event-item" key={task.id}>
                                            <div className="event-indicator"></div>

                                            <div className="event-info">
                                                <h3>{task.title}</h3>
                                                <p>{task.description || "No description"}</p>

                                                <div className="event-meta">
                                                    <span>{task.priority || "Medium"} Priority</span>
                                                    <span className={
                                                        task.status === "Completed"
                                                            ? "event-completed"
                                                            : "event-pending"
                                                    }>
                                                        {task.status || "Todo"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="calendar-no-events">
                                    <div>📭</div>
                                    <h3>No tasks for this day</h3>
                                    <p>Enjoy your free time or plan something new!</p>
                                </div>
                            )}

                        </section>

                    </div>
                </div>
            </main>
        </div>
    );
}

export default Calendar;
