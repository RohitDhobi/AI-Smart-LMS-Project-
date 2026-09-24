import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut, LayoutDashboard, BookOpen, Users, ClipboardList, FileQuestion, BarChart3, Megaphone, Settings, GraduationCap, Award, Calendar, FileText, FolderOpen, ListTodo } from "lucide-react";
import { getStoredUser } from "../../ui";
import { getTheme, applyTheme } from "../../gamification";
import HODSidebar from "./HODSidebar";

const NAV = [
  { section: "MAIN", items: [
    { to: "/hod", icon: LayoutDashboard, label: "Dashboard", exact: true },
  ]},
  { section: "COURSES / SUBJECTS", items: [
    { to: "/hod/courses", icon: BookOpen, label: "Courses / Subjects" },
    { to: "/hod/subjects", icon: GraduationCap, label: "Subjects" },
  ]},
  { section: "INSTRUCTOR ASSIGNMENT", items: [
    { to: "/hod/assignments", icon: Users, label: "Instructor Assignment" },
  ]},
  { section: "STUDENTS", items: [
    { to: "/hod/students", icon: Users, label: "Students" },
  ]},
  { section: "QUESTION BANK", items: [
    { to: "/hod/questions", icon: FileQuestion, label: "Question Bank" },
    { to: "/hod/exams", icon: ClipboardList, label: "Exams" },
    { to: "/hod/announcements", icon: Megaphone, label: "Announcements" },
  ]},
  { section: "ACCOUNT", items: [
    { to: "/hod/settings", icon: Settings, label: "Settings" },
  ]},
];

const STORAGE_KEY = "hod-sidebar-collapsed";

export default function HODLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => getTheme());
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

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
    if (mobileOpen) setMobileOpen(false);
  }

  const firstName = (user?.name || "HOD").split(" ")[0];

  return (
    <>
      {mobileOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`} role="navigation" aria-label="HOD navigation">
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
          <button className="admin-collapse-btn" onClick={() => setCollapsed(!collapsed)} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
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
          {NAV.map((group) => (
            <div key={group.section} className="admin-nav-group">
              {!collapsed && <div className="admin-nav-group-label">{group.section}</div>}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
                  onClick={handleNavClick}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="admin-nav-icon">
                    <item.icon size={18} />
                  </span>
                  {!collapsed && <span className="admin-nav-label">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="admin-sidebar-footer">
          {!collapsed && (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="admin-logout-btn" onClick={handleToggleTheme} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} style={{ flex: 1, justifyContent: "center" }}>
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
              <button className="admin-logout-btn collapsed" onClick={handleToggleTheme} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <button className="admin-logout-btn collapsed" onClick={handleLogout} title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-content-area">
        {/* Mobile Header */}
        <header className="admin-mobile-header">
          <div className="admin-mobile-header-left">
            <button className="admin-mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Close menu" : "Open menu"}>
              {mobileOpen ? "✕" : "☰"}
            </button>
            <NavLink to="/hod" className="admin-mobile-logo">
              <span className="admin-mobile-logo-icon">🎓</span>
              <span className="admin-mobile-logo-text">AI Smart LMS</span>
            </NavLink>
          </div>
          <div className="admin-mobile-header-right">
            <button className="admin-mobile-icon-btn" onClick={handleToggleTheme} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} style={{ fontSize: 18 }}>
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <NavLink to="/hod/settings" className="admin-mobile-icon-btn" title="Settings">
              ⚙️
            </NavLink>
          </div>
        </header>

        <main className="admin-main-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
