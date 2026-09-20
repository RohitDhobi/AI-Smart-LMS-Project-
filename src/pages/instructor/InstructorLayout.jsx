import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { getStoredUser } from "../../ui";
import { getTheme, applyTheme } from "../../gamification";

import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  FileText,
  FolderOpen,
  ClipboardCheck,
  HelpCircle,
  GraduationCap,
  Users,
  Calendar,
  BarChart3,
  Megaphone,
  MessageSquare,
  Bot,
  Settings,
  Code2,
} from "lucide-react";

const NAV = [
  { section: "MAIN", items: [
    { to: "/instructor", icon: LayoutDashboard, label: "Dashboard", exact: true },
  ]},
  { section: "COURSES", items: [
    { to: "/instructor/courses", icon: BookOpen, label: "All Courses" },
    { to: "/instructor/courses/create", icon: PlusCircle, label: "Create Course" },
  ]},
  { section: "CONTENT", items: [
    { to: "/instructor/lessons", icon: FileText, label: "Manage Lessons" },
    { to: "/instructor/materials", icon: FolderOpen, label: "Resources" },
  ]},
  { section: "ASSESSMENTS", items: [
    { to: "/instructor/assignments", icon: ClipboardCheck, label: "Assignments" },
    { to: "/instructor/coding", icon: Code2, label: "Coding Arena" },
    { to: "/instructor/quizzes", icon: HelpCircle, label: "Quizzes" },
    { to: "/instructor/exams", icon: GraduationCap, label: "Exams" },
  ]},
  { section: "STUDENTS", items: [
    { to: "/instructor/students", icon: Users, label: "My Students" },
    { to: "/instructor/attendance", icon: Calendar, label: "Attendance" },
    { to: "/instructor/grades", icon: BarChart3, label: "Grade Book" },
  ]},
  { section: "INSIGHTS", items: [
    { to: "/instructor/analytics", icon: BarChart3, label: "Analytics & Reports" },
    { to: "/instructor/announcements", icon: Megaphone, label: "Announcements" },
    { to: "/instructor/discussions", icon: MessageSquare, label: "Discussions" },
  ]},
  { section: "ACHIEVEMENTS", items: [
    { to: "/instructor/certificates", icon: GraduationCap, label: "Certificates" },
  ]},
  { section: "TOOLS", items: [
    { to: "/instructor/ai-tools", icon: Bot, label: "AI Tools" },
    { to: "/instructor/calendar", icon: Calendar, label: "Calendar" },
    { to: "/instructor/settings", icon: Settings, label: "Settings" },
  ]},
];

const STORAGE_KEY = "instructor-sidebar-collapsed";

export default function InstructorLayout() {
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

  const firstName = (user?.name || "Instructor").split(" ")[0];

  return (
    <>
      {mobileOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`admin-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
        role="navigation"
        aria-label="Instructor navigation"
      >
        {/* Header */}
        <div className="admin-sidebar-header">
          {!collapsed && (
            <NavLink to="/instructor" className="admin-sidebar-brand" onClick={handleNavClick}>
              <div className="admin-sidebar-logo">
                🎓
              </div>
              <div className="admin-sidebar-brand-text">
                <strong>AI Smart LMS</strong>
                <small>Instructor Panel</small>
              </div>
            </NavLink>
          )}
          {collapsed && (
            <NavLink to="/instructor" className="admin-sidebar-logo-link" onClick={handleNavClick}>
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
            <div className="admin-profile-avatar">
              {firstName[0] || "I"}
            </div>
            <div className="admin-profile-info">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <strong>{user?.name || "Instructor"}</strong>
                <span className="role-badge role-instructor" style={{ fontSize: 9, padding: "1px 6px" }}>Instructor</span>
              </div>
              <span>Instructor</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="admin-profile-collapsed">
            <div className="admin-profile-avatar small">
              {firstName[0] || "I"}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="admin-sidebar-nav">
          {NAV.map((group) => (
            <div key={group.section} className="admin-nav-group">
              {!collapsed && (
                <div className="admin-nav-group-label">{group.section}</div>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    `admin-nav-item ${isActive ? "active" : ""}`
                  }
                  onClick={handleNavClick}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="admin-nav-icon">
                    <item.icon size={18} />
                  </span>
                  {!collapsed && (
                    <span className="admin-nav-label">{item.label}</span>
                  )}
                </NavLink>
              ))}
            </div>
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
              <button
                className="admin-logout-btn collapsed"
                onClick={handleLogout}
                title="Logout"
              >
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
            <button
              className="admin-mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
            <NavLink to="/instructor" className="admin-mobile-logo">
              <span className="admin-mobile-logo-icon">🎓</span>
              <span className="admin-mobile-logo-text">AI Smart LMS</span>
            </NavLink>
          </div>
          <div className="admin-mobile-header-right">
            <button
              className="admin-mobile-icon-btn"
              onClick={handleToggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              style={{ fontSize: 18 }}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <NavLink to="/instructor/settings" className="admin-mobile-icon-btn" title="Settings">
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
