
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MyTasks from "./pages/MyTasks.jsx";
import Calendar from "./pages/Calendar.jsx";
import Analytics from "./pages/Analytics.jsx";
import Settings from "./pages/Settings.jsx";

import { SidebarContext } from "./SidebarContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Check whether user is logged in
function ProtectedRoute({ children }) {
    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    return token ? children : <Navigate to="/login" replace />;
}

function App() {
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("darkMode") === "true";
    });

    const [accentColor, setAccentColor] = useState(() => {
        return localStorage.getItem("accentColor") || "#187653";
    });

    // One common sidebar state for every page
    const [sidebarOpen, setSidebarOpen] = useState(
        () => window.innerWidth > 700
    );

    useEffect(() => {
        localStorage.setItem("darkMode", darkMode);
    }, [darkMode]);

    useEffect(() => {
        localStorage.setItem("accentColor", accentColor);
        document.documentElement.style.setProperty("--accent", accentColor);
    }, [accentColor]);

    function toggleSidebar() {
        setSidebarOpen((previous) => !previous);
    }

    function closeSidebar() {
        setSidebarOpen(false);
    }

    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    return (
        <SidebarContext.Provider
            value={{
                sidebarOpen,
                toggleSidebar,
                closeSidebar,
            }}
        >
            <BrowserRouter>
                <ErrorBoundary>
                    <Routes>

                    <Route
                        path="/"
                        element={
                            <Navigate
                                to={token ? "/dashboard" : "/login"}
                                replace
                            />
                        }
                    />

                    <Route
                        path="/login"
                        element={<Login />}
                    />

                    <Route
                        path="/register"
                        element={<Register />}
                    />

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard
                                    darkMode={darkMode}
                                    setDarkMode={setDarkMode}
                                />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/my-tasks"
                        element={
                            <ProtectedRoute>
                                <MyTasks
                                    darkMode={darkMode}
                                    setDarkMode={setDarkMode}
                                />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/calendar"
                        element={
                            <ProtectedRoute>
                                <Calendar
                                    darkMode={darkMode}
                                    setDarkMode={setDarkMode}
                                />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/analytics"
                        element={
                            <ProtectedRoute>
                                <Analytics
                                    darkMode={darkMode}
                                    setDarkMode={setDarkMode}
                                />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Settings
                                    darkMode={darkMode}
                                    setDarkMode={setDarkMode}
                                    accentColor={accentColor}
                                    setAccentColor={setAccentColor}
                                    profileMode
                                />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <Settings
                                    darkMode={darkMode}
                                    setDarkMode={setDarkMode}
                                    accentColor={accentColor}
                                    setAccentColor={setAccentColor}
                                />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="*"
                        element={<Navigate to="/" replace />}
                    />

                    </Routes>
                </ErrorBoundary>
            </BrowserRouter>
        </SidebarContext.Provider>
    );
}

export default App;
