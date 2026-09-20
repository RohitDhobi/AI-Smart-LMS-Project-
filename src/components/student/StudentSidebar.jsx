import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { getStoredUser } from "../../ui";
import { getTheme, applyTheme } from "../../gamification";
import studentMenuItems from "./studentMenuConfig";

const STORAGE_KEY = "student-sidebar-collapsed";

function StudentSidebarItem({ item, collapsed }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.exact}
      className={({ isActive }) =>
        `admin-nav-item ${isActive ? "active" : ""}`
      }
      title={collapsed ? item.label : undefined}
    >
      <span className="admin-nav-icon">
        <Icon size={18} />
      </span>
      {!collapsed && (
        <span className="admin-nav-label">{item.label}</span>
      )}
      {!collapsed && item.badge && (
        <span className="sidebar-v2-badge" style={{ marginLeft: "auto" }}>
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

export default function StudentSidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [theme, setTheme] = useState(() => getTheme());
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // Ignore
    }
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
    if (mobileOpen && onMobileClose) {
      onMobileClose();
    }
  }

  const firstName = (user?.name || "Student").split(" ")[0];

  return (
    <>
      {mobileOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`admin-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
        role="navigation"
        aria-label="Student navigation"
      >
        {/* Header */}
        <div className="admin-sidebar-header">
          {!collapsed && (
            <NavLink to="/dashboard" className="admin-sidebar-brand" onClick={handleNavClick}>
              <div className="admin-sidebar-logo">
                📖
              </div>
              <div className="admin-sidebar-brand-text">
                <strong>AI Smart LMS</strong>
                <small>Student Panel</small>
              </div>
            </NavLink>
          )}
          {collapsed && (
            <NavLink to="/dashboard" className="admin-sidebar-logo-link" onClick={handleNavClick}>
              <div className="admin-sidebar-logo">📖</div>
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
              {firstName[0] || "S"}
            </div>
            <div className="admin-profile-info">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <strong>{user?.name || "Student"}</strong>
                <span className="role-badge role-student" style={{ fontSize: 9, padding: "1px 6px" }}>Student</span>
              </div>
              <span>Student</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="admin-profile-collapsed">
            <div className="admin-profile-avatar small">
              {firstName[0] || "S"}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="admin-sidebar-nav">
          {studentMenuItems.map((group) => (
            <div key={group.section} className="admin-nav-group">
              {!collapsed && (
                <div className="admin-nav-group-label">{group.section}</div>
              )}
              {group.items.map((item) => (
                <StudentSidebarItem
                  key={item.path}
                  item={item}
                  collapsed={collapsed}
                />
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
    </>
  );
}
