import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut, Bell } from "lucide-react";
import { getStoredUser } from "../../ui";
import adminMenuItems from "./adminMenuConfig";
import AdminSidebarSection from "./AdminSidebarSection";

const STORAGE_KEY = "admin-sidebar-collapsed";

export default function AdminSidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [user, setUser] = useState(null);
  const [notifCount, setNotifCount] = useState(0);
  const navigate = useNavigate();

  // Load user from localStorage
  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // Ignore
    }
  }, [collapsed]);

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

  const firstName = (user?.name || "Admin").split(" ")[0];

  return (
    <>
      {/* Mobile Overlay */}
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
        aria-label="Admin navigation"
      >
        {/* Header */}
        <div className="admin-sidebar-header">
          {!collapsed && (
            <NavLink to="/admin" className="admin-sidebar-brand" onClick={handleNavClick}>
              <div className="admin-sidebar-logo">
                🎓
              </div>
              <div className="admin-sidebar-brand-text">
                <strong>AI Smart LMS</strong>
                <small>Admin Panel</small>
              </div>
            </NavLink>
          )}
          {collapsed && (
            <NavLink to="/admin" className="admin-sidebar-logo-link" onClick={handleNavClick}>
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
              {firstName[0] || "A"}
            </div>
            <div className="admin-profile-info">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <strong>{user?.name || "Admin User"}</strong>
                <span className="role-badge role-admin" style={{ fontSize: 9, padding: "1px 6px" }}>Admin</span>
              </div>
              <span>Administrator</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="admin-profile-collapsed">
            <div className="admin-profile-avatar small">
              {firstName[0] || "A"}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="admin-sidebar-nav">
          {adminMenuItems.map((group) => (
            <AdminSidebarSection
              key={group.section}
              section={group.section}
              items={group.items}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="admin-sidebar-footer">
          {!collapsed && (
            <button className="admin-logout-btn" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          )}
          {collapsed && (
            <button
              className="admin-logout-btn collapsed"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
