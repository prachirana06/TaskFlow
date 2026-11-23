import { Link, useLocation } from "react-router-dom";
import "./QuickNav.css";

const pages = [
    { path: "/dashboard", label: "Home", icon: "⌂", color: "green" },
    { path: "/my-tasks", label: "My Tasks", icon: "✓", color: "blue" },
    { path: "/calendar", label: "Calendar", icon: "▦", color: "orange" },
    { path: "/analytics", label: "Progress", icon: "↗", color: "purple" },
    { path: "/profile", label: "My Profile", icon: "◉", color: "pink" },
    { path: "/settings", label: "Settings", icon: "⚙", color: "slate" },
];

function QuickNav() {
    const { pathname } = useLocation();

    return (
        <nav className="quicknav" aria-label="Quick navigation">
            {pages.map((page) => {
                const isActive = pathname === page.path;

                return (
                    <Link
                        key={page.path}
                        to={page.path}
                        className={`quicknav-link quicknav-${page.color} ${
                            isActive ? "quicknav-active" : ""
                        }`}
                        aria-current={isActive ? "page" : undefined}
                    >
                        <span className="quicknav-icon" aria-hidden="true">
                            {page.icon}
                        </span>
                        <span>{page.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default QuickNav;
