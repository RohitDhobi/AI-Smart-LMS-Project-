import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { getTheme, applyTheme } from "../../gamification";

export default function StudentMobileHeader({ onToggleSidebar, sidebarOpen }) {
  const [theme, setTheme] = useState(() => getTheme());

  function handleToggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <header className="admin-mobile-header">
      <div className="admin-mobile-header-left">
        <button
          className="admin-mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <NavLink to="/dashboard" className="admin-mobile-logo">
          <span className="admin-mobile-logo-icon">📖</span>
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
        <NavLink to="/notifications" className="admin-mobile-icon-btn" title="Notifications">
          🔔
        </NavLink>
      </div>
    </header>
  );
}
