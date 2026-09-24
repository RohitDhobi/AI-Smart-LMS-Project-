import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut, LayoutDashboard, BookOpen, ClipboardList, Users, FileQuestion, BarChart3, Megaphone, Settings, GraduationCap, Award, Calendar, FileText, FolderOpen, ListTodo } from "lucide-react";
import { getStoredUser } from "../../ui";
import { getTheme, applyTheme } from "../../gamification";
import AdminSidebarItem from "../admin/AdminSidebarItem";
import AdminSidebarSection from "../admin/AdminSidebarSection";

// =====================================================
// HOD SIDEBAR NAVIGATION CONFIGURATION
// Mirrors Section 7 from the spec:
//   HOD Dashboard | Courses / Subjects | Instructor Assignment | Students | Question Bank | Exams | Analytics | Announcements | Settings
// =====================================================

const hodMenuItems = [
  {
    section: "MAIN",
    items: [
      { label: "Dashboard", path: "/hod", icon: LayoutDashboard, exact: true },
      { label: "Analytics", path: "/hod/analytics", icon: BarChart3 },
    ],
  },
  {
    section: "COURSES / SUBJECTS",
    items: [
      { label: "Courses", path: "/hod/courses", icon: BookOpen },
      { label: "Subjects", path: "/hod/subjects", icon: GraduationCap },
    ],
  },
  {
    section: "INSTRUCTOR ASSIGNMENT",
    items: [
      { label: "Instructor Assignment", path: "/hod/assignments", icon: Users },
    ],
  },
  {
    section: "STUDENTS",
    items: [
      { label: "Students", path: "/hod/students", icon: Users },
    ],
  },
  {
    section: "QUESTION BANK",
    items: [
      { label: "Question Bank", path: "/hod/questions", icon: FileQuestion },
      { label: "Exams", path: "/hod/exams", icon: ClipboardList },
      { label: "Announcements", path: "/hod/announcements", icon: Megaphone },
    ],
  },
  {
    section: "ACCOUNT",
    items: [
      { label: "Settings", path: "/hod/settings", icon: Settings },
    ],
  },
];

export default function HODSidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = React.useState(() => {
    try {
      return localStorage.getItem("hod-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [theme, setTheme] = React.useState(() => getTheme());
  const [user, setUser] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    setUser(getStoredUser());
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem("hod-sidebar-collapsed", String(collapsed));
    } catch {}
  }, [collapsed]);

  function handleToggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  function handleNavClick() {
    if (mobileOpen && onMobileClose) onMobileClose();
  }

  const firstName = (user?.name || "HOD").split(" ")[0];

  return (
    <>
      {mobileOpen && (
        <div className="admin-sidebar-overlay" onClick={onMobileClose} aria-hidden="true" />
      )}

      <aside
        className={`admin-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
        role="navigation"
        aria-label="HOD navigation"
      >
        {/* Header */}
        <div className="admin-sidebar-header">
          {!collapsed && (
            <NavLink to="/hod" className="admin-sidebar-brand" onClick={handleNavClick}>
              <div className="admin-sidebar-logo">🎓</div>
              <div className="admin-sidebar-brand-text">
                <strong>AI Smart LMS</strong>
                <small>HOD Panel</small>
              </div>
            </NavLink>
          )}
          {collapsed && (
            <NavLink to="/hod" className="admin-sidebar-logo-link" onClick={handleNavClick}>
              <div className="admin-sidebar-logo">🎓</div>
            </NavLink>
          )}
          <button
            className="admin-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Profile Card */}
        {!collapsed && (
          <div className="admin-profile-card">
            <div className="admin-profile-avatar">{firstName[0] || "H"}</div>
            <div className="admin-profile-info">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <strong>{user?.name || "HOD User"}</strong>
                <span className="role-badge role-hod" style={{ fontSize: 9, padding: "1px 6px" }}>HOD</span>
              </div>
              <span>Head of Department</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="admin-profile-collapsed">
            <div className="admin-profile-avatar small">{firstName[0] || "H"}</div>
          </div>
        )}

        {/* Navigation */}
        <nav className="admin-sidebar-nav">
          {hodMenuItems.map((group) => (
            <AdminSidebarSection key={group.section} section={group.section} items={group.items} collapsed={collapsed} />
          ))}
        </nav>

        {/* Footer */}
        <div className="admin-sidebar-footer">
          {!collapsed && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="admin-logout-btn"
                onClick={handleToggleTheme}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                style={{ flex: 1, justifyContent: "center" }}
              >
                {theme === "dark" ? "☀️" : "🌙"}
                <span>Theme</span>
              </button>
              <button className="admin-logout-btn" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
          {collapsed && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                className="admin-logout-btn collapsed"
                onClick={handleToggleTheme}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <button className="admin-logout-btn collapsed" onClick={handleLogout} title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
